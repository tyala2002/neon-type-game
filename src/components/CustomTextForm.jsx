import React, { useState } from 'react';
import GlassCard from './UI/GlassCard';
import { Trophy } from 'lucide-react';

const CustomTextForm = ({ onStart, gameMode, onModeChange, onShowRanking }) => {
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    // Load all text files from ../target_text directory
    const textFiles = import.meta.glob('../target_text/*.txt', { as: 'raw', eager: true });
    const texts = Object.values(textFiles);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (texts.length > 0) {
            const randomIndex = Math.floor(Math.random() * texts.length);
            const randomText = texts[randomIndex];
            const totalSeconds = minutes * 60 + seconds;
            onStart(randomText, totalSeconds > 0 ? totalSeconds : null);
        }
    };

    const adjustTime = (type, amount) => {
        if (type === 'minutes') {
            setMinutes(prev => Math.max(0, Math.min(60, prev + amount)));
        } else {
            setSeconds(prev => {
                const newVal = prev + amount;
                if (newVal >= 60) {
                    setMinutes(m => Math.min(60, m + 1));
                    return 0;
                }
                if (newVal < 0) {
                    if (minutes > 0) {
                        setMinutes(m => m - 1);
                        return 59;
                    }
                    return 0;
                }
                return newVal;
            });
        }
    };

    const formatNumber = (num) => num.toString().padStart(2, '0');

    return (
        <GlassCard className="p-5 hover:bg-white/10 transition-colors group">
            <div className="h-full flex flex-col items-center space-y-3">
                {/* Mode Toggle */}
                <div className="flex bg-black/20 p-1 rounded-lg mb-2">
                    <button
                        onClick={() => onModeChange('challenge')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${gameMode === 'challenge' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Challenge
                    </button>
                    <button
                        onClick={() => onModeChange('ranking')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${gameMode === 'ranking' ? 'bg-yellow-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Ranking
                    </button>
                </div>

                <h3 className="text-xl font-bold text-white">
                    {gameMode === 'ranking' ? 'Ranking Mode' : 'Challenge Mode'}
                </h3>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    {/* Variable Content Area with Fixed Min-Height */}
                    <div className="w-full min-h-[160px] flex flex-col justify-center">
                        {gameMode === 'ranking' ? (
                            <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className="text-slate-400 text-xs text-center mb-4">
                                    Compete for the top score (180s)
                                </p>
                                <button
                                    type="button"
                                    onClick={onShowRanking}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 mb-4 rounded-lg bg-white/5 hover:bg-white/10 text-yellow-400 text-sm font-bold transition-colors border border-yellow-500/30"
                                >
                                    <Trophy className="w-4 h-4" />
                                    View Leaderboard
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Time Limit</label>
                                <div className="flex items-center justify-center gap-4 bg-slate-900/50 p-3 rounded-xl border border-white/10 w-full">
                                    {/* Minutes */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Min</span>
                                        <div className="text-xl font-mono font-bold text-white w-12 text-center bg-black/20 rounded py-1">
                                            {minutes === 0 && seconds === 0 ? '--' : formatNumber(minutes)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => adjustTime('minutes', -1)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
                                            >
                                                -
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => adjustTime('minutes', 1)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-xl font-bold text-slate-600 pb-6 pt-2">:</div>

                                    {/* Seconds */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Sec</span>
                                        <div className="text-xl font-mono font-bold text-white w-12 text-center bg-black/20 rounded py-1">
                                            {minutes === 0 && seconds === 0 ? '--' : formatNumber(seconds)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => adjustTime('seconds', -1)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
                                            >
                                                -
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => adjustTime('seconds', 1)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={`w-full py-2.5 rounded-lg text-white font-semibold transition-colors shadow-lg text-sm
                            ${gameMode === 'ranking'
                                ? 'bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/20'
                                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'}`}
                    >
                        {gameMode === 'ranking' ? 'Start Ranking Game' : 'Start Challenge Game'}
                    </button>
                </form>
            </div>
        </GlassCard>
    );
};

export default CustomTextForm;
