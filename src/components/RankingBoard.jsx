import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import GlassCard from './UI/GlassCard';
import { Trophy, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RankingBoard = ({ onClose }) => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        fetchScores();
    }, []);

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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl"
            >
                <GlassCard className="p-6 w-full h-[70vh] flex flex-col relative">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                            onClick={fetchScores}
                            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Refresh Ranking"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-6 pr-12">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/20">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Ranking Mode</h2>
                        </div>

                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0f172a] z-10">
                                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-white/10">
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
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors group"
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
                                            <td className="py-3 px-4 font-medium text-white group-hover:text-cyan-400 transition-colors">
                                                {score.username}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-yellow-400">
                                                {score.score.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                                                {score.cpm}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                                                {score.accuracy}%
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-500 text-xs">
                                                {formatDate(score.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default RankingBoard;
