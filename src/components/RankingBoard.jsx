import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import GlassCard from './UI/GlassCard';
import { Trophy, X, RefreshCw, History, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useTheme } from '../context/ThemeContext';

const RankingBoard = ({ onClose, initialTab = 'leaderboard' }) => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState(initialTab); // 'leaderboard' | 'history'
    const [selectedMetric, setSelectedMetric] = useState('score'); // 'score' | 'cpm' | 'accuracy'
    const [scores, setScores] = useState([]);
    const [localHistory, setLocalHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (activeTab === 'leaderboard') {
            fetchScores();
        } else {
            loadLocalHistory();
        }
    }, [activeTab]);

    const fetchScores = async () => {
        setLoading(true);
        setErrorMsg(null);

        if (!supabase) {
            setErrorMsg("Supabase client not initialized. Check .env variables.");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('scores')
                .select('*')
                .order('score', { ascending: false })
                .limit(100);

            if (error) throw error;
            setScores(data);
        } catch (error) {
            console.error('Error fetching scores:', error);
            setErrorMsg(error.message || "Failed to fetch scores");
        } finally {
            setLoading(false);
        }
    };

    const loadLocalHistory = () => {
        try {
            const history = JSON.parse(localStorage.getItem('neon_type_history') || '[]');
            // Ensure score is number and sort
            const formattedHistory = history.map(h => ({
                ...h,
                score: Number(h.score),
                cpm: Number(h.cpm),
                accuracy: Number(h.accuracy),
                date: h.date
            }));
            formattedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
            setLocalHistory(formattedHistory);
        } catch (e) {
            console.error("Failed to load local history", e);
            setLocalHistory([]);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatChartDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ja-JP', {
            month: 'numeric',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 dark:bg-black/60 bg-slate-900/5 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl"
            >
                <GlassCard className="w-full h-[70vh]" innerClassName="flex flex-col h-full p-6 relative">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        {activeTab === 'leaderboard' && (
                            <button
                                onClick={fetchScores}
                                className="p-2 rounded-full hover:bg-white/10 dark:text-slate-400 text-slate-500 hover:text-white dark:hover:text-white transition-colors"
                                title="Refresh Ranking"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 dark:text-slate-400 text-slate-500 hover:text-white dark:hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6 pr-12">
                        <div className="p-2 rounded-lg bg-yellow-500/20">
                            {activeTab === 'leaderboard' ? (
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            ) : (
                                <History className="w-6 h-6 text-yellow-400" />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white text-slate-900">
                            {activeTab === 'leaderboard' ? 'Leaderboard' : 'My History'}
                        </h2>
                    </div>


                    <div className="flex-1 overflow-hidden flex flex-col">
                        {activeTab === 'leaderboard' ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 dark:bg-[#0f172a] bg-slate-100 z-10">
                                        <tr className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-wider border-b dark:border-white/10 border-slate-200">
                                            <th className="py-3 px-4 font-bold">Rank</th>
                                            <th className="py-3 px-4 font-bold">Player</th>
                                            <th className="py-3 px-4 font-bold text-right">Score</th>
                                            <th className="py-3 px-4 font-bold text-right">CPM</th>
                                            <th className="py-3 px-4 font-bold text-right">Accuracy</th>
                                            <th className="py-3 px-4 font-bold text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-slate-500">Loading scores...</td>
                                            </tr>
                                        ) : errorMsg ? (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-red-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span>Error: {errorMsg}</span>
                                                        <span className="text-xs text-slate-500">Check console for details</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : scores.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-slate-500">No scores yet. Be the first!</td>
                                            </tr>
                                        ) : (
                                            scores.map((score, index) => (
                                                <tr
                                                    key={score.id}
                                                    className="border-b dark:border-white/5 border-slate-100 dark:hover:bg-white/5 hover:bg-slate-50 transition-colors group"
                                                >
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                            index === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                                    'text-slate-500'
                                                            }`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-medium dark:text-white text-slate-900 group-hover:text-cyan-400 dark:group-hover:text-cyan-400 transition-colors">
                                                        {score.username}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold dark:text-yellow-400 text-yellow-600">
                                                        {score.score.toLocaleString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono dark:text-slate-300 text-slate-600">
                                                        {score.cpm}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono dark:text-slate-300 text-slate-600">
                                                        {score.accuracy}%
                                                    </td>
                                                    <td className="py-3 px-4 text-right dark:text-slate-500 text-slate-400 text-xs">
                                                        {formatDate(score.created_at)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                {localHistory.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                        <History className="w-12 h-12 mb-4 opacity-50" />
                                        <p>No local history found.</p>
                                        <p className="text-sm mt-2">Play Ranking Mode to see your progress!</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 w-full h-full p-4 flex flex-col">
                                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                            <div className="flex items-center gap-2 text-yellow-400">
                                                <TrendingUp className="w-5 h-5" />
                                                <h3 className="font-bold">
                                                    {selectedMetric === 'score' ? 'Score Progression' :
                                                        selectedMetric === 'cpm' ? 'CPM Progression' :
                                                            'Accuracy Progression'}
                                                </h3>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedMetric('score')}
                                                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${selectedMetric === 'score'
                                                        ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50'
                                                        : 'dark:text-slate-400 text-slate-500 hover:text-white dark:hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    Score
                                                </button>
                                                <button
                                                    onClick={() => setSelectedMetric('cpm')}
                                                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${selectedMetric === 'cpm'
                                                        ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50'
                                                        : 'dark:text-slate-400 text-slate-500 hover:text-white dark:hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    CPM
                                                </button>
                                                <button
                                                    onClick={() => setSelectedMetric('accuracy')}
                                                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${selectedMetric === 'accuracy'
                                                        ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50'
                                                        : 'dark:text-slate-400 text-slate-500 hover:text-white dark:hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    Accuracy
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-full h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={localHistory}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#334155" : "#cbd5e1"} opacity={0.5} />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickFormatter={formatChartDate}
                                                        stroke={theme === 'dark' ? "#94a3b8" : "#64748b"}
                                                        fontSize={12}
                                                        tickMargin={10}
                                                    />
                                                    <YAxis
                                                        stroke={theme === 'dark' ? "#94a3b8" : "#64748b"}
                                                        fontSize={12}
                                                        domain={selectedMetric === 'accuracy' ? [0, 100] : ['auto', 'auto']}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                                                        itemStyle={{ color: '#facc15' }}
                                                        labelFormatter={formatDate}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey={selectedMetric}
                                                        stroke="#facc15"
                                                        strokeWidth={3}
                                                        dot={{ r: 4, fill: theme === 'dark' ? '#0f172a' : '#ffffff', stroke: '#facc15', strokeWidth: 2 }}
                                                        activeDot={{ r: 6, fill: '#facc15' }}
                                                        isAnimationActive={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </motion.div>
        </div >
    );
};

export default RankingBoard;
