import { User } from '../models/User.js';
import QUEST_POOL from '../config/questPool.js'; // Import the pool

class GamificationEngine {

    // 1. Pick 3 Random Quests
    generateDailyQuests() {
        // Shuffle array using Fisher-Yates algorithm
        const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
        // Return top 3
        return shuffled.slice(0, 3).map(q => ({
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

    async trackEvent(userId, eventType) {
        const user = await User.findById(userId);
        if (!user) return null;

        // CHECK RESET: Pass 'true' to force save if quests generated
        await this.checkDailyReset(user);

        // Filter user's *active* quests that match this event
        const relevantQuests = user.dailyQuestProgress.quests.filter(q => q.eventTrigger === eventType);

        let xpGained = 0;
        let leveledUp = false;
        let questCompleted = false;

        for (let userQuest of relevantQuests) {
            if (userQuest.completed) continue;

            userQuest.progress += 1;

            if (userQuest.progress >= userQuest.targetCount) {
                userQuest.completed = true;
                xpGained += userQuest.xpReward;
                questCompleted = true;
            }
        }

        if (xpGained > 0) {
            user.xp += xpGained;
            const newLevel = user.calculateLevel();
            if (newLevel > user.level) {
                user.level = newLevel;
                leveledUp = true;
            }
        }

        // Save only if progress changed or reset happened
        if (xpGained > 0 || questCompleted) {
            await user.save();
        }

        return { xpGained, leveledUp, currentLevel: user.level };
    }

    async checkDailyReset(user) {
        const now = new Date();
        const lastReset = new Date(user.dailyQuestProgress.lastReset);

        // Check if it's a new day OR if the user has NO quests yet (first login)
        const isNewDay = now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth();
        const hasNoQuests = user.dailyQuestProgress.quests.length === 0;

        if (isNewDay || hasNoQuests) {
            user.dailyQuestProgress.lastReset = now;
            // GENERATE NEW RANDOM QUESTS HERE
            user.dailyQuestProgress.quests = this.generateDailyQuests(); 
            await user.save();
        }
    }
}

export default new GamificationEngine();