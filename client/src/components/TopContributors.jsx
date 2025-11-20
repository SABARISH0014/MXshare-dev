import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/primitives';
import { mockContributors } from '../data/constants';

const TopContributors = () => {
    const [sortBy, setSortBy] = useState('rating');
    const [sortedContributors, setSortedContributors] = useState(mockContributors);

    useEffect(() => {
        let sorted = [...mockContributors];
        if (sortBy === 'score') {
            sorted.sort((a, b) => b.score - a.score);
        } else if (sortBy === 'rating') {
            sorted.sort((a, b) => b.rating - a.rating);
        }
        setSortedContributors(sorted);
    }, [sortBy]);

    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
    };

    const getRankCardStyle = (rank) => {
        switch (rank) {
            case 1: return 'bg-yellow-900/30 border-yellow-500 transform scale-105 shadow-xl shadow-yellow-900/30';
            case 2: return 'bg-gray-800/50 border-gray-600';
            case 3: return 'bg-orange-900/30 border-orange-600';
            default: return 'bg-gray-800';
        }
    };

    const TopRankCard = ({ contributor, rank }) => (
        <Card className={`text-center p-6 transition-transform duration-300 hover:scale-[1.03] ${getRankCardStyle(rank)}`}>
            <Award className={`w-8 h-8 mx-auto ${rank === 1 ? 'text-yellow-500 fill-yellow-400' : (rank === 2 ? 'text-gray-400 fill-gray-500' : 'text-orange-500 fill-orange-600')} mb-2`} />
            <p className="text-3xl font-extrabold text-white">{rank}</p>
            <h4 className="text-lg font-semibold mt-1 text-white">{contributor.name}</h4>
            <p className="text-sm text-gray-400">{contributor.department}</p>
        </Card>
    );

    const RankTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
                <thead>
                    <tr className="bg-gray-800/50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('rating')}>
                            Rating <TrendingUp className={`w-4 h-4 inline ml-1 ${sortBy === 'rating' ? 'text-blue-500' : 'text-gray-600'}`} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('score')}>
                            Score <TrendingUp className={`w-4 h-4 inline ml-1 ${sortBy === 'score' ? 'text-blue-500' : 'text-gray-600'}`} />
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {sortedContributors.map((c, index) => (
                        <tr key={c.id} className="hover:bg-gray-800/50 transition-colors duration-100">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{c.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" /> {c.rating}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-semibold">{c.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    const LeaderboardChart = ({ data }) => {
        const chartData = data.slice(0, 5).map(user => ({ name: user.name.split(' ')[0], score: user.score })).reverse();
        return (
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="#9ca3af" fontSize={12} />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} className="fill-blue-600" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-4xl font-extrabold text-white mb-8 flex items-center">
                <Award className="w-8 h-8 mr-3 text-yellow-500" /> MXian Leaderboard
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {sortedContributors.slice(0, 3).map((c, index) => (
                    <TopRankCard key={c.id} contributor={c} rank={index + 1} />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card className="lg:col-span-2">
                   <CardHeader>
                       <CardTitle>Top 5 Contributors (by Score)</CardTitle>
                   </CardHeader>
                   <CardContent>
                       <LeaderboardChart data={sortedContributors} />
                   </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Detailed Contributor Rankings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankTable />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TopContributors;