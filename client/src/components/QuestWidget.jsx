import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, RefreshCw, CheckCircle, Zap } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Contexts (Assuming you have these, if not, pass data via props)
import { AuthContext } from '../context/AuthContext'; 
import { ToastContext } from '../context/ToastContext';
import { API_BASE_URL } from '../data/constants'; // e.g., 'http://localhost:3001'

const socket = io(API_BASE_URL);

const QuestWidget = () => {
    const { user, token } = useContext(AuthContext); // Need user._id and auth token
    const { addToast } = useContext(ToastContext);

    const [quests, setQuests] = useState([]);
    const [stats, setStats] = useState({ level: 1, xp: 0, streak: 0, rerollsLeft: 1 });
    const [loading, setLoading] = useState(true);
    const [rerolling, setRerolling] = useState(false);

    // 1. Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                // Assuming you have an endpoint returning profile + gamification data
                const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Set initial state from DB
                const d = res.data; 
                setQuests(d.dailyQuestProgress.quests);
                setStats({
                    level: d.level,
                    xp: d.xp,
                    streak: d.dailyQuestProgress.streak,
                    rerollsLeft: d.dailyQuestProgress.rerollsLeft
                });
            } catch (err) {
                console.error("Failed to load quests", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    // 2. Socket.io Connection
    useEffect(() => {
        if (!user?._id) return;

        // Join the room identified by User ID
        socket.emit('join_user_room', user._id);

        // LISTEN: Live Progress Updates & Completions
        socket.on('quest_update', (data) => {
            // data contains: { updatedQuests, xpGained, completedQuestIds, leveledUp }
            
            // 1. Update Quests (Completed ones will be missing from this array)
            setQuests(data.updatedQuests);
            
            // 2. Update Stats
            setStats(prev => ({
                ...prev,
                xp: data.totalXp,
                level: data.currentLevel
            }));

            // 3. UI Feedback
            if (data.completedQuestIds && data.completedQuestIds.length > 0) {
                addToast(`Quest Complete! +${data.xpGained} XP`, "success");
            }
            if (data.leveledUp) {
                addToast(`LEVEL UP! You represent level ${data.currentLevel}!`, "success");
            }
        });

        // LISTEN: Daily Reset (Midnight)
        socket.on('daily_reset', (data) => {
            setQuests(data.quests);
            setStats(prev => ({ ...prev, streak: data.streak, rerollsLeft: 1 }));
            addToast("New Day! Daily Quests Reset.", "info");
        });

        return () => {
            socket.off('quest_update');
            socket.off('daily_reset');
        };
    }, [user, addToast]);

    // 3. Handle Reroll
    const handleReroll = async (questId) => {
        if (stats.rerollsLeft <= 0) return;
        setRerolling(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/gamification/reroll`, 
                { questId }, 
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            setQuests(res.data.newQuests);
            setStats(prev => ({ ...prev, rerollsLeft: prev.rerollsLeft - 1 }));
            addToast("Quest swapped!", "success");
        } catch (err) {
            addToast(err.response?.data?.message || "Reroll failed", "error");
        } finally {
            setRerolling(false);
        }
    };

    // --- Helper: Calculate XP Bar Width ---
    const getXpProgress = () => {
        // Based on your formula: Level = Floor(XP / 100) + 1
        // So progress within level is XP % 100
        return stats.xp % 100;
    };

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-6">
            
            {/* Header: Level & Streak */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Daily Focus</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                            LVL {stats.level}
                        </div>
                        <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${getXpProgress()}%` }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-orange-500">
                    <Flame className={`w-5 h-5 ${stats.streak > 0 ? 'fill-orange-500' : ''}`} />
                    <span className="font-bold text-xl">{stats.streak}</span>
                    <span className="text-xs text-orange-400 font-medium mt-1">Day Streak</span>
                </div>
            </div>

            {/* Quest List */}
            <div className="space-y-4">
                <AnimatePresence mode='popLayout'>
                    {quests.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-gray-400"
                        >
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>All quests completed!</p>
                            <p className="text-xs">Come back tomorrow.</p>
                        </motion.div>
                    ) : (
                        quests.map((quest) => (
                            <QuestCard 
                                key={quest.questId} 
                                quest={quest} 
                                onReroll={() => handleReroll(quest.questId)}
                                canReroll={stats.rerollsLeft > 0}
                                isRerolling={rerolling}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Sub-Component: Individual Card ---
const QuestCard = ({ quest, onReroll, canReroll, isRerolling }) => {
    const percentage = Math.min(100, (quest.progress / quest.targetCount) * 100);

    return (
        <motion.div
            layout // Magic prop for smooth reordering
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 100, transition: { duration: 0.2 } }}
            className="group relative bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-transparent hover:border-indigo-100 dark:hover:border-slate-700 transition-colors"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">{quest.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{quest.description}</p>
                </div>
                <div className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    +{quest.xpReward} XP
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-0 left-0 h-full bg-indigo-500"
                />
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400 font-mono">
                    {quest.progress} / {quest.targetCount}
                </span>
                
                {/* Reroll Button (Only show if 0 progress to prevent cheating, or always show if you prefer) */}
                {quest.progress === 0 && (
                    <button 
                        onClick={onReroll}
                        disabled={!canReroll || isRerolling}
                        className={`text-[10px] flex items-center gap-1 transition-colors
                            ${canReroll 
                                ? 'text-gray-400 hover:text-indigo-500 cursor-pointer' 
                                : 'text-gray-300 cursor-not-allowed opacity-50'
                            }`}
                        title={canReroll ? "Swap this quest" : "No rerolls left today"}
                    >
                        <RefreshCw className={`w-3 h-3 ${isRerolling ? 'animate-spin' : ''}`} />
                        Swap
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default QuestWidget;