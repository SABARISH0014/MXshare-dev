import { User } from '../models/User.js';
import QUEST_POOL from '../config/questPool.js';

class GamificationEngine {
    constructor() {
        this.io = null; // We will attach Socket.io here
    }

    // Call this in your index.js/server.js to link the websocket
    initialize(ioInstance) {
        this.io = ioInstance;
    }

    // --- 1. CORE: GENERATE QUESTS ---
    generateDailyQuests(count = 3) {
        const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(q => ({
            questId: q.id,
            label: q.label,
            description: q.description,
            eventTrigger: q.eventTrigger,
            targetCount: q.targetCount,
            xpReward: q.xpReward,
            progress: 0,
            completed: false
        }));
    }

    // --- 2. THE LIVE TRACKER ---
    async trackEvent(userId, eventType) {
        const user = await User.findById(userId);
        if (!user) return null;

        await this.checkDailyReset(user);

        // Filter active quests matching this event
        const activeQuests = user.dailyQuestProgress.quests;
        const relevantIndices = activeQuests
            .map((q, index) => (q.eventTrigger === eventType ? index : -1))
            .filter(index => index !== -1);

        if (relevantIndices.length === 0) return; // No quests match this action

        let xpGained = 0;
        let completedQuestIds = [];
        let anyChange = false;

        // Process Quests
        relevantIndices.forEach(index => {
            const quest = activeQuests[index];
            
            if (!quest.completed) {
                quest.progress += 1;
                anyChange = true;

                // CHECK COMPLETION
                if (quest.progress >= quest.targetCount) {
                    quest.completed = true;
                    xpGained += quest.xpReward;
                    completedQuestIds.push(quest.questId);
                    
                    // ARCHIVE: Move to history so it "disappears" from active list
                    user.dailyQuestProgress.completedHistory.push(quest);
                    // We remove it from active array below
                }
            }
        });

        // Remove completed quests from active list (The "Disappearing" Act)
        if (completedQuestIds.length > 0) {
            user.dailyQuestProgress.quests = activeQuests.filter(q => !q.completed);
        }

        // Apply XP & Level Up
        let leveledUp = false;
        if (xpGained > 0) {
            user.xp += xpGained;
            const newLevel = user.calculateLevel(); // Assuming you have this method
            if (newLevel > user.level) {
                user.level = newLevel;
                leveledUp = true;
            }
        }

        if (anyChange) {
            await user.save();
            
            // --- LIVE UPDATE (Socket.io) ---
            // This pushes data to the frontend immediately!
            if (this.io) {
                this.io.to(userId.toString()).emit('quest_update', {
                    updatedQuests: user.dailyQuestProgress.quests, // Send only active ones
                    xpGained,
                    totalXp: user.xp,
                    completedQuestIds, // Frontend can use this to show a "Success" toast before hiding
                    leveledUp,
                    currentLevel: user.level
                });
            }
        }

        return { xpGained, completedQuestIds };
    }

    // --- 3. DAILY RESET & STREAKS ---
    async checkDailyReset(user) {
        const now = new Date();
        const lastReset = new Date(user.dailyQuestProgress.lastReset);
        
        // Helper to check if dates are different days
        const isSameDay = (d1, d2) => 
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        if (isSameDay(now, lastReset) && user.dailyQuestProgress.quests.length > 0) {
            return; // Already has quests for today
        }

        // It is a new day! Calculate Streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (isSameDay(lastReset, yesterday)) {
            user.dailyQuestProgress.streak += 1; // Kept the streak
        } else if (!isSameDay(now, lastReset)) {
            user.dailyQuestProgress.streak = 1; // Lost the streak (reset to 1)
        }

        // Reset Data
        user.dailyQuestProgress.lastReset = now;
        user.dailyQuestProgress.quests = this.generateDailyQuests();
        user.dailyQuestProgress.completedHistory = []; // Optional: Clear yesterday's history
        user.dailyQuestProgress.rerollsLeft = 1; // Reset rerolls

        await user.save();
        
        // Notify frontend of new day
        if (this.io) {
            this.io.to(user._id.toString()).emit('daily_reset', {
                quests: user.dailyQuestProgress.quests,
                streak: user.dailyQuestProgress.streak
            });
        }
    }

    // --- 4. NEW FEATURE: REROLL QUEST ---
    // User can swap 1 quest they don't like
    async rerollQuest(userId, questIdToSwap) {
        const user = await User.findById(userId);
        if (!user || user.dailyQuestProgress.rerollsLeft <= 0) {
            throw new Error("No rerolls left today.");
        }

        const quests = user.dailyQuestProgress.quests;
        const index = quests.findIndex(q => q.questId === questIdToSwap);

        if (index === -1) throw new Error("Quest not found.");

        // Pick a new random quest that ISN'T currently in the list
        const currentIds = quests.map(q => q.questId);
        const availablePool = QUEST_POOL.filter(q => !currentIds.includes(q.id));
        
        if (availablePool.length === 0) throw new Error("No unique quests available.");

        const randomNew = availablePool[Math.floor(Math.random() * availablePool.length)];
        
        // Replace
        user.dailyQuestProgress.quests[index] = {
            questId: randomNew.id,
            label: randomNew.label,
            description: randomNew.description,
            eventTrigger: randomNew.eventTrigger,
            targetCount: randomNew.targetCount,
            xpReward: randomNew.xpReward,
            progress: 0,
            completed: false
        };

        user.dailyQuestProgress.rerollsLeft -= 1;
        await user.save();

        return user.dailyQuestProgress.quests;
    }
}

export default new GamificationEngine();