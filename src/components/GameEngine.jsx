import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import TypingDisplay from './TypingDisplay';
import GlassCard from './UI/GlassCard';
import CustomTextForm from './CustomTextForm';
import confetti from 'canvas-confetti';
import { calculateAccuracy } from '../utils/scoring';
import { supabase } from '../lib/supabaseClient';
import RankingBoard from './RankingBoard';
import { ArrowLeft } from 'lucide-react';

const GameEngine = () => {
    const {
        gameState,
        targetText,
        input,
        setInput,
        startGame,
        resetGame,
        endGame,
        startTime,
        endTime,
        timeLimit,
        timeLeft
    } = useGameLogic();

    const [isComposing, setIsComposing] = useState(false);
    const [compositionStartIndex, setCompositionStartIndex] = useState(null);
    const [cursorPos, setCursorPos] = useState(0);
    const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);

    // Ranking Mode State
    const [gameMode, setGameMode] = useState('challenge'); // 'challenge' | 'ranking'
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', null
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [userRank, setUserRank] = useState(null);
    const [lastGameSettings, setLastGameSettings] = useState({ text: null, duration: null });
    const [rankingTab, setRankingTab] = useState('leaderboard');

    // Load all text files for retry randomization
    const textFiles = import.meta.glob('../target_text/*.txt', { as: 'raw', eager: true });
    const texts = Object.values(textFiles);

    const inputRef = useRef(null);

    // Auto-focus input when playing
    useEffect(() => {
        if (gameState === 'playing' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [gameState, targetText]);

    // Global Key Listener for Esc
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'Escape' && gameState !== 'idle') {
                resetGame();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [gameState, resetGame]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isComposing) {
            e.preventDefault();
            if (showFinishConfirmation) {
                endGame();
            } else {
                setShowFinishConfirmation(true);
            }
        }
    };

    const handleInput = (e) => {
        setShowFinishConfirmation(false);
        setInput(e.target.value);
        setCursorPos(e.target.selectionStart);
    };

    const handleSelect = (e) => {
        setCursorPos(e.target.selectionStart);
    };

    const handleCursorMove = (newPos) => {
        if (inputRef.current) {
            inputRef.current.setSelectionRange(newPos, newPos);
            inputRef.current.focus();
            setCursorPos(newPos);
        }
    };

    const handleCompositionStart = (e) => {
        setIsComposing(true);
        setCompositionStartIndex(e.target.selectionStart);
    };
    const handleCompositionEnd = (e) => {
        setIsComposing(false);
        setCompositionStartIndex(null);
        setInput(e.target.value);
        setCursorPos(e.target.selectionStart);
    };

    useEffect(() => {
        if (gameState === 'finished') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [gameState]);

    if (gameState === 'idle') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-10 w-full"
                >
                    <div className="space-y-4">
                        <motion.h1
                            animate={{
                                textShadow: [
                                    "0 0 20px rgba(34,211,238,0.5)",
                                    "0 0 40px rgba(168,85,247,0.5)",
                                    "0 0 20px rgba(34,211,238,0.5)"
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-7xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
                        >
                            NEON TYPE
                        </motion.h1>
                        <p className="text-2xl text-slate-400 font-light tracking-wide">
                            Long-Form Japanese Input Mastery
                        </p>
                    </div>

                    <div className="max-w-md mx-auto w-full space-y-6">
                        <CustomTextForm
                            onStart={(text, duration) => {
                                setShowFinishConfirmation(false);
                                setLastGameSettings({ text, duration }); // Save settings for retry
                                if (gameMode === 'ranking') {
                                    startGame(text, 180); // Fixed 180s for ranking
                                    setSubmissionStatus(null); // Reset submission status
                                    setUserRank(null);
                                } else {
                                    startGame(text, duration);
                                }
                            }}
                            gameMode={gameMode}
                            onModeChange={setGameMode}
                            onShowRanking={(tab = 'leaderboard') => {
                                setRankingTab(tab);
                                setShowRankingModal(true);
                            }}
                        />
                        <AnimatePresence>
                            {showRankingModal && (
                                <RankingBoard
                                    onClose={() => setShowRankingModal(false)}
                                    initialTab={rankingTab}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (gameState === 'finished') {
        // Calculate Score Metrics
        let timeSeconds = Math.max(0.1, (endTime - startTime) / 1000);

        // Clamp to time limit if set (to avoid showing 60.1s etc)
        if (timeLimit && timeSeconds > timeLimit) {
            timeSeconds = timeLimit;
        }
        const cpm = Math.round((input.length / timeSeconds) * 60);

        // Accuracy: Levenshtein Distance (Match rate up to the point typed)
        // We compare input against the target text prefix of the same length
        const accuracy = calculateAccuracy(input, targetText.slice(0, input.length));

        // Score: (CPM * Accuracy * Length) / 10
        // Rewards both speed, accuracy, and text length
        const score = Math.round((cpm * (accuracy / 100) * input.length) / 10);

        return (
            <div className="min-h-screen flex flex-col items-center justify-center max-w-4xl mx-auto px-4 text-center">
                <GlassCard className="p-12 space-y-8 w-full border-purple-500/30">
                    <h2 className="text-5xl font-bold text-white mb-4">
                        {timeLimit && timeLeft === 0 ? "Time's Up!" : "Game Complete!"}
                    </h2>

                    {/* Main Score Display */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="text-slate-400 text-sm uppercase tracking-wider mb-2 font-bold">Total Score</div>
                        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                            {score}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Speed</p>
                            <p className="text-4xl font-bold text-cyan-400">{cpm}</p>
                            <p className="text-xs text-slate-500 mt-1">chars/min</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Accuracy</p>
                            <p className={`text-4xl font-bold ${accuracy >= 95 ? 'text-green-400' : accuracy >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {accuracy}%
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Final Match</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Time</p>
                            <p className="text-4xl font-bold text-purple-400">
                                {timeSeconds.toFixed(1)}s
                            </p>
                        </div>
                    </div>

                    {gameMode !== 'ranking' && (
                        <div className="p-4 rounded-xl bg-black/20 text-left max-h-40 overflow-y-auto custom-scrollbar mt-4">
                            <p className="text-slate-300 text-xs mb-2 uppercase font-bold">Result Text</p>
                            <p className="text-white/80 leading-relaxed text-sm font-mono">{input}</p>
                        </div>
                    )}

                    {gameMode === 'ranking' && !submissionStatus ? (
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-4">
                            <h3 className="text-xl font-bold text-white mb-4">Submit to Ranking Mode</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    maxLength={20}
                                    className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                                />
                                <button
                                    onClick={async () => {
                                        if (!username.trim()) return;

                                        if (!supabase) {
                                            alert("Supabase client not initialized. Check .env variables.");
                                            return;
                                        }

                                        setIsSubmitting(true);
                                        try {
                                            // 1. Check if user exists (fetch ALL records to handle duplicates)
                                            const { data: existingScores, error: fetchError } = await supabase
                                                .from('scores')
                                                .select('*')
                                                .eq('username', username.trim())
                                                .order('score', { ascending: false }); // Get highest score first

                                            if (fetchError) throw fetchError;

                                            if (existingScores && existingScores.length > 0) {
                                                const bestRecord = existingScores[0];
                                                const duplicateIds = existingScores.slice(1).map(r => r.id);

                                                // 2. Cleanup duplicates if any exist
                                                if (duplicateIds.length > 0) {
                                                    await supabase
                                                        .from('scores')
                                                        .delete()
                                                        .in('id', duplicateIds);
                                                }

                                                // 3. Check if new score is higher than the BEST existing score
                                                if (score > bestRecord.score) {
                                                    const { error: updateError } = await supabase
                                                        .from('scores')
                                                        .update({
                                                            score: score,
                                                            cpm: cpm,
                                                            accuracy: accuracy,
                                                            created_at: new Date().toISOString()
                                                        })
                                                        .eq('id', bestRecord.id);

                                                    if (updateError) throw updateError;
                                                    setSubmissionStatus('success');
                                                } else {
                                                    setSubmissionStatus('not_high_score');
                                                }
                                            } else {
                                                // 4. User does not exist, insert new score
                                                const { error: insertError } = await supabase
                                                    .from('scores')
                                                    .insert([
                                                        {
                                                            username: username.trim(),
                                                            score: score,
                                                            cpm: cpm,
                                                            accuracy: accuracy
                                                        }
                                                    ]);

                                                if (insertError) throw insertError;
                                                setSubmissionStatus('success');
                                            }

                                            // 5. Calculate Rank (Always calculate rank for the CURRENT score)
                                            const { count, error: countError } = await supabase
                                                .from('scores')
                                                .select('*', { count: 'exact', head: true })
                                                .gt('score', score);

                                            if (countError) throw countError;
                                            setUserRank(count + 1);

                                            // Save username to localStorage
                                            localStorage.setItem('username', username.trim());

                                            // Save to Local History
                                            const historyItem = {
                                                date: new Date().toISOString(),
                                                score: score,
                                                cpm: cpm,
                                                accuracy: accuracy
                                            };
                                            const currentHistory = JSON.parse(localStorage.getItem('neon_type_history') || '[]');
                                            currentHistory.push(historyItem);
                                            localStorage.setItem('neon_type_history', JSON.stringify(currentHistory));

                                        } catch (error) {
                                            console.error('Error submitting score:', error);
                                            alert(`Failed to submit score: ${error.message}`);
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    disabled={isSubmitting || !username.trim()}
                                    className="bg-yellow-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Sending...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    ) : gameMode === 'ranking' && submissionStatus === 'success' ? (
                        <div className="bg-green-500/20 p-6 rounded-xl border border-green-500/50 mt-4">
                            <h3 className="text-xl font-bold text-green-400 mb-2">Score Submitted!</h3>
                            <p className="text-slate-300 text-sm mb-2">Your score has been added to the ranking.</p>
                            {userRank && (
                                <div className="text-lg font-bold text-white">
                                    Your Rank: <span className="text-yellow-400 text-2xl">#{userRank}</span>
                                </div>
                            )}
                        </div>
                    ) : gameMode === 'ranking' && submissionStatus === 'not_high_score' ? (
                        <div className="bg-yellow-500/20 p-6 rounded-xl border border-yellow-500/50 mt-4">
                            <h3 className="text-xl font-bold text-yellow-400 mb-2">Good Game!</h3>
                            <p className="text-slate-300 text-sm mb-2">You didn't beat your personal best this time, but keep trying!</p>
                            {userRank && (
                                <div className="text-lg font-bold text-white">
                                    Rank for this score: <span className="text-yellow-400 text-2xl">#{userRank}</span>
                                </div>
                            )}
                        </div>
                    ) : null}

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => {
                                setShowFinishConfirmation(false);
                                setSubmissionStatus(null);
                                setUserRank(null);

                                let nextText = lastGameSettings.text;
                                if (texts.length > 0) {
                                    const randomIndex = Math.floor(Math.random() * texts.length);
                                    nextText = texts[randomIndex];
                                }

                                if (gameMode === 'ranking') {
                                    startGame(nextText, 180);
                                } else {
                                    startGame(nextText, lastGameSettings.duration);
                                }
                            }}
                            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold text-lg hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-orange-500/25"
                        >
                            Retry
                        </button>
                        <button
                            onClick={resetGame}
                            className="flex-1 py-4 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 hover:scale-[1.02] transition-all border border-white/10"
                        >
                            Back to Menu
                        </button>
                    </div>
                </GlassCard >
            </div >
        );
    }

    return (
        <div
            className={`h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative outline-none overflow-hidden transition-colors duration-700
                ${gameMode === 'ranking'
                    ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a1005] to-black'
                    : 'bg-slate-900'
                }`}
            onClick={() => inputRef.current?.focus()}
        >
            {/* Back to Menu Button */}
            <button
                onClick={resetGame}
                className="absolute top-4 left-4 z-50 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10 backdrop-blur-sm group"
                title="Back to Menu"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 z-10">
                <motion.div
                    className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(input.length / targetText.length) * 100}%` }}
                />
            </div>

            <div className="w-full max-w-5xl mb-4 flex justify-between text-slate-400 px-2 z-10">
                <div className="font-mono text-sm font-bold tracking-wider">
                    {gameMode === 'ranking' ? 'RANKING MODE' : 'CHALLENGE MODE'}
                </div>
                <div className="flex items-center gap-4">
                    {timeLimit && (
                        <div className={`font-mono text-sm font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                            TIME: {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                    <div className="font-mono text-sm">{Math.min(100, Math.round((input.length / targetText.length) * 100))}%</div>
                </div>
            </div>

            <div className="flex-1 w-full max-h-[80vh] relative z-0">
                <TypingDisplay
                    targetSentence={targetText}
                    input={input}
                    isComposing={isComposing}
                    cursorPos={cursorPos}
                    onCursorMove={handleCursorMove}
                    showFinishConfirmation={showFinishConfirmation}
                    inputRef={inputRef}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    compositionStartIndex={compositionStartIndex}
                    gameMode={gameMode}
                />
            </div>
        </div>
    );
};

export default GameEngine;
