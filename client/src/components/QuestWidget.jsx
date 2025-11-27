import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RefreshCw, CheckCircle, Zap } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Contexts
import { AuthContext } from '../context/AuthContext'; 
import { ToastContext } from '../context/ToastContext';
import { API_BASE_URL } from '../data/constants';

// Initialize Socket outside component to prevent multiple connections
const socket = io(API_BASE_URL);

const QuestWidget = () => {
    // 1. FIX: Destructure 'authToken' (not 'token') to match your Context
    const { user, authToken } = useContext(AuthContext); 
    const { addToast } = useContext(ToastContext);

    const [quests, setQuests] = useState([]);
    const [stats, setStats] = useState({ level: 1, xp: 0, streak: 0, rerollsLeft: 1 });
    const [loading, setLoading] = useState(true);
    const [rerolling, setRerolling] = useState(false);

    // 2. Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            // Safety Check: If no token, stop loading and exit.
            if (!authToken) {
                setLoading(false); 
                return;
            }

            try {
                const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                
                const d = res.data; 
                
                // Safety check for missing data
                const questData = d.dailyQuestProgress || {};
                
                setQuests(questData.quests || []);
                setStats({
                    level: d.level || 1,
                    xp: d.xp || 0,
                    streak: questData.streak || 0,
                    rerollsLeft: questData.rerollsLeft ?? 1 
                });
            } catch (err) {
                console.error("Failed to load quests", err);
            } finally {
                // This ensures the loading animation ALWAYS stops
                setLoading(false);
            }
        };

        fetchData();
    }, [authToken]); // Dependency is now authToken

    // 3. Socket.io Connection
    useEffect(() => {
        if (!user?._id) return;

        socket.emit('join_user_room', user._id);

        socket.on('quest_update', (data) => {
            setQuests(data.updatedQuests);
            setStats(prev => ({
                ...prev,
                xp: data.totalXp,
                level: data.currentLevel
            }));

            if (data.completedQuestIds && data.completedQuestIds.length > 0) {
                addToast(`Quest Complete! +${data.xpGained} XP`, "success");
            }
            if (data.leveledUp) {
                addToast(`LEVEL UP! You are now level ${data.currentLevel}!`, "success");
            }
        });

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

    // 4. Handle Reroll
    const handleReroll = async (questId) => {
        if (stats.rerollsLeft <= 0) return;
        setRerolling(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/gamification/reroll`, 
                { questId }, 
                { headers: { Authorization: `Bearer ${authToken}` }}
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

    const getXpProgress = () => {
        return stats.xp % 100;
    };

    // LOADING STATE SKELETON
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 h-full border border-gray-100 dark:border-slate-800 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 h-full flex flex-col">
            
            {/* Header: Level & Streak */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Daily Focus</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                            LVL {stats.level}
                        </div>
                        <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
            <div className="space-y-4 flex-grow">
                <AnimatePresence mode='popLayout'>
                    {quests.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-gray-400 flex flex-col items-center justify-center h-full"
                        >
                            <CheckCircle className="w-12 h-12 mb-2 opacity-20" />
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

// CORRECTED COMPONENT
// We must wrap the function in React.forwardRef to expose 'ref'
const QuestCard = React.forwardRef(({ quest, onReroll, canReroll, isRerolling }, ref) => {
    const percentage = Math.min(100, (quest.progress / quest.targetCount) * 100);

    return (
        <motion.div
            ref={ref} // <--- Now 'ref' exists because of forwardRef above
            layout 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 100, transition: { duration: 0.2 } }}
            className="group relative bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-transparent hover:border-indigo-100 dark:hover:border-slate-700 transition-colors"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">{quest.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{quest.description}</p>
                </div>
                <div className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    +{quest.xpReward} XP
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-0 left-0 h-full bg-indigo-500"
                />
            </div>
            <div className="flex justify-between mt-2 items-center">
                <span className="text-[10px] text-gray-400 font-mono">
                    {quest.progress} / {quest.targetCount}
                </span>
                
                {/* Reroll Button (Visible if progress is 0) */}
                {quest.progress === 0 && (
                    <button 
                        onClick={onReroll}
                        disabled={!canReroll || isRerolling}
                        className={`text-[10px] flex items-center gap-1 transition-colors px-2 py-0.5 rounded
                            ${canReroll 
                                ? 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer' 
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
});

export default QuestWidget;