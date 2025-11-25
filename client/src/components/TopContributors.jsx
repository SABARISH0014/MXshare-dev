import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Crown, Trophy, Loader2, TrendingUp, ArrowRight } from 'lucide-react'; // Added ArrowRight
import { gsap } from 'gsap';
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui/primitives'; // Added Button
import { API_BASE_URL } from '../data/constants';

// Added 'preview' prop (default false) and 'onViewAll' callback
const TopContributors = ({ preview = false, onViewAll }) => {
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const podiumRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/notes`);
                const notes = res.data;
                
                const counts = {};
                notes.forEach(note => {
                    if (note.uploader && note.uploader._id) {
                        const id = note.uploader._id;
                        if (!counts[id]) {
                            counts[id] = { ...note.uploader, totalUploads: 0, totalDownloads: 0 };
                        }
                        counts[id].totalUploads += 1;
                        counts[id].totalDownloads += (note.downloads || 0);
                    }
                });

                const scored = Object.values(counts).map(user => ({
                    ...user,
                    score: (user.totalUploads * 10) + user.totalDownloads
                }));

                const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 10);
                setContributors(sorted);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading && contributors.length > 0) {
            const ctx = gsap.context(() => {
                gsap.from(".podium-bar", { scaleY: 0, transformOrigin: "bottom", duration: 1, ease: "elastic.out(1, 0.5)", stagger: 0.2 });
                gsap.from(".podium-avatar", { y: 50, opacity: 0, duration: 0.8, delay: 0.5, ease: "back.out(1.7)", stagger: 0.2 });
                
                // Only animate list if it exists (not in preview mode)
                if (listRef.current) {
                    gsap.from(listRef.current.children, { opacity: 0, x: -20, duration: 0.5, delay: 1, stagger: 0.1 });
                }
            }, podiumRef);
            return () => ctx.revert();
        }
    }, [loading, contributors, preview]);

    if (loading) return <div className="flex items-center justify-center h-40 text-gray-500 dark:text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>;
    if (contributors.length === 0) return null; // Don't show empty section on home

    const [first, second, third, ...rest] = contributors;

    return (
        <div ref={podiumRef} className="space-y-10 animate-in fade-in duration-700">
            {/* Header - Only show on full view, or keep minimal on home */}
            <div className="text-center">
                <h2 className={`font-black text-gray-900 dark:text-white tracking-tight ${preview ? 'text-3xl' : 'text-4xl'}`}>
                    Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">Fame</span>
                </h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2">Top contributors making a difference</p>
            </div>

            {/* THE PODIUM */}
            <div className="flex justify-center items-end gap-4 sm:gap-8 md:gap-12 px-4 pb-6">
                {/* 2nd Place */}
                <div className="flex flex-col items-center w-1/3 max-w-[140px]">
                    {second && (
                        <>
                            <div className="podium-avatar relative mb-3">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600 shadow-lg">{second.name[0]}</div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">#2</div>
                            </div>
                            <div className="text-center mb-2">
                                <p className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white truncate max-w-[80px] sm:max-w-[100px]">{second.name.split(' ')[0]}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{second.score} pts</p>
                            </div>
                            <div className="podium-bar w-full h-24 sm:h-32 bg-gradient-to-t from-slate-400 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-t-lg shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 dark:bg-black/10" />
                            </div>
                        </>
                    )}
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center w-1/3 max-w-[160px] -mt-8 z-10">
                    {first && (
                        <>
                            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 mb-2 drop-shadow-lg animate-bounce-slow" fill="currentColor" />
                            <div className="podium-avatar relative mb-3">
                                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-yellow-400 bg-yellow-100 flex items-center justify-center text-3xl sm:text-4xl font-bold text-yellow-600 shadow-2xl ring-4 ring-yellow-400/20">{first.name[0]}</div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-md">#1</div>
                            </div>
                            <div className="text-center mb-2">
                                <p className="font-bold text-sm sm:text-lg text-gray-900 dark:text-white truncate max-w-[120px]">{first.name.split(' ')[0]}</p>
                                <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 font-mono font-bold">{first.score} pts</p>
                            </div>
                            <div className="podium-bar w-full h-36 sm:h-48 bg-gradient-to-t from-yellow-500 to-yellow-300 dark:from-yellow-600 dark:to-yellow-500 rounded-t-xl shadow-2xl relative overflow-hidden border-t border-yellow-200/50">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50" />
                            </div>
                        </>
                    )}
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center w-1/3 max-w-[140px]">
                    {third && (
                        <>
                            <div className="podium-avatar relative mb-3">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-amber-700 bg-amber-100 flex items-center justify-center text-2xl font-bold text-amber-800 shadow-lg">{third.name[0]}</div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">#3</div>
                            </div>
                            <div className="text-center mb-2">
                                <p className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white truncate max-w-[80px] sm:max-w-[100px]">{third.name.split(' ')[0]}</p>
                                <p className="text-[10px] text-amber-700 dark:text-amber-500 font-mono">{third.score} pts</p>
                            </div>
                            <div className="podium-bar w-full h-20 sm:h-24 bg-gradient-to-t from-amber-700 to-amber-500 dark:from-amber-800 dark:to-amber-700 rounded-t-lg shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/10" />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* PREVIEW MODE BUTTON */}
            {preview && onViewAll && (
                <div className="flex justify-center">
                    <Button 
                        variant="outline" 
                        onClick={onViewAll}
                        className="rounded-full px-8 py-6 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 group"
                    >
                        See Full Leaderboard <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}

            {/* FULL LIST (Hidden if preview is true) */}
            {!preview && rest.length > 0 && (
                <Card className="border-none bg-white dark:bg-slate-900/50 dim:bg-slate-800/50 shadow-xl overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gray-50 dark:bg-slate-900/80 border-b border-gray-100 dark:border-slate-800 px-6 py-4">
                        <CardTitle className="text-lg flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" /> Rising Stars
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div ref={listRef} className="divide-y divide-gray-100 dark:divide-slate-800">
                            {rest.map((user, index) => (
                                <div key={user._id} className="flex items-center justify-between p-4 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-8 text-center font-mono font-bold text-gray-400 dark:text-slate-500 group-hover:text-blue-500">#{index + 4}</div>
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">{user.name[0]}</div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{user.totalUploads} Uploads • {user.totalDownloads} Downloads</p>
                                        </div>
                                    </div>
                                    <div className="pr-4">
                                        <div className="bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm font-bold text-gray-700 dark:text-slate-300">{user.score} pts</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TopContributors;