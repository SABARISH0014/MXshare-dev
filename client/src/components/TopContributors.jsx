import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, TrendingUp, Star, Loader2, Trophy, Medal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/primitives';
import { API_BASE_URL } from '../data/constants';

const TopContributors = () => {
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('score'); // 'score' or 'rating'

    // --- FETCH LIVE DATA ---
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/notes/leaderboard`);
                setContributors(res.data);
            } catch (error) {
                console.error("Leaderboard fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    // Handle Sorting (Client Side for smoothness)
    const sortedContributors = [...contributors].sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
    });

    // Helper for Rank Styles
    const getRankStyle = (rank) => {
        if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
        if (rank === 2) return 'bg-gray-400/20 border-gray-400/50 text-gray-300';
        if (rank === 3) return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
        return 'bg-gray-800/50 border-gray-700 text-gray-400';
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500 mb-2" />;
        if (rank === 2) return <Medal className="w-8 h-8 text-gray-400 mb-2" />;
        if (rank === 3) return <Medal className="w-8 h-8 text-orange-500 mb-2" />;
        return <Award className="w-8 h-8 text-blue-500 mb-2" />;
    };

    const TopRankCard = ({ contributor, rank }) => (
        <Card className={`text-center p-6 transition-all duration-300 hover:scale-105 border ${getRankStyle(rank)}`}>
            <div className="flex flex-col items-center">
                {getRankIcon(rank)}
                <div className="text-4xl font-extrabold mb-1">#{rank}</div>
                <h4 className="text-lg font-bold text-white truncate w-full">{contributor.name}</h4>
                <p className="text-xs font-mono opacity-80 mb-3">{contributor.department}</p>
                
                <div className="grid grid-cols-2 gap-2 w-full mt-2 text-sm">
                    <div className="bg-gray-900/50 rounded p-1">
                        <span className="block text-xs opacity-60">Score</span>
                        <span className="font-bold">{Math.round(contributor.score)}</span>
                    </div>
                    <div className="bg-gray-900/50 rounded p-1">
                        <span className="block text-xs opacity-60">Uploads</span>
                        <span className="font-bold">{contributor.notes}</span>
                    </div>
                </div>
            </div>
        </Card>
    );

    const LeaderboardChart = ({ data }) => {
        const chartData = data.slice(0, 5).map(user => ({ 
            name: user.name.split(' ')[0], 
            score: Math.round(user.score) 
        }));
        
        return (
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fill: '#9CA3AF', fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                            cursor={{fill: 'transparent'}}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? '#3B82F6' : '#4B5563'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    if (loading) return <div className="flex justify-center p-10 text-white"><Loader2 className="animate-spin mr-2"/> Loading Leaderboard...</div>;
    if (contributors.length === 0) return <div className="text-center p-10 text-gray-400">No contributions yet. Be the first!</div>;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Top 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {sortedContributors.slice(0, 3).map((c, index) => (
                    <TopRankCard key={c._id} contributor={c} rank={index + 1} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
                   <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                           <TrendingUp className="w-5 h-5 text-blue-500"/> Top 5 Activity
                       </CardTitle>
                   </CardHeader>
                   <CardContent>
                       <LeaderboardChart data={sortedContributors} />
                   </CardContent>
                </Card>

                {/* Detailed Table */}
                <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>All Contributors</CardTitle>
                            <div className="flex gap-2 text-xs bg-gray-800 p-1 rounded-lg">
                                <button 
                                    onClick={() => setSortBy('score')}
                                    className={`px-3 py-1 rounded-md transition-all ${sortBy === 'score' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Score
                                </button>
                                <button 
                                    onClick={() => setSortBy('rating')}
                                    className={`px-3 py-1 rounded-md transition-all ${sortBy === 'rating' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Rating
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-800">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Uploads</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rating</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {sortedContributors.map((c, index) => (
                                        <tr key={c._id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">#{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-white">{c.name}</div>
                                                <div className="text-xs text-gray-500">{c.department}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">{c.notes}</td>
                                            <td className="px-6 py-4 text-sm text-yellow-500 flex items-center gap-1">
                                                {c.rating} <Star className="w-3 h-3 fill-yellow-500" />
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-right text-blue-400">{Math.round(c.score)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TopContributors;