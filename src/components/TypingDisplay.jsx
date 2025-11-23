import React, { useEffect, useRef, useState } from 'react';
import GlassCard from './UI/GlassCard';

const TypingDisplay = ({
    targetSentence,
    input,
    isComposing,
    cursorPos,
    onCursorMove,
    showFinishConfirmation,
    inputRef,
    onInput,
    onKeyDown,
    onSelect,
    onCompositionStart,
    onCompositionEnd,
    compositionStartIndex,
    gameMode
}) => {
    const displayContainerRef = useRef(null);

    // Sync scroll from textarea to display
    const handleScroll = (e) => {
        if (displayContainerRef.current) {
            displayContainerRef.current.scrollTop = e.target.scrollTop;
        }
    };

    // Dynamic font size calculation
    const getFontSizeClass = (length) => {
        if (length > 200) return "text-base md:text-lg";
        if (length > 100) return "text-lg md:text-xl";
        if (length > 50) return "text-xl md:text-2xl";
        return "text-2xl md:text-3xl";
    };

    const fontSizeClass = getFontSizeClass(targetSentence.length);

    // Common styles for both layers to ensure perfect alignment
    const textStyles = `${fontSizeClass} font-medium leading-relaxed tracking-wide break-words whitespace-pre-wrap font-mono`;

    return (
        <div className="w-full max-w-5xl mx-auto h-full flex flex-col gap-4">
            {/* Target Text Display (Reference) */}
            <GlassCard className="flex-1 p-6 overflow-hidden flex flex-col min-h-[30vh]" innerClassName="h-full flex flex-col">
                <div className="text-sm dark:text-slate-400 text-slate-500 mb-2 uppercase tracking-wider font-bold">Target Text</div>
                <div className="flex-1 overflow-y-scroll custom-scrollbar">
                    <div className={`${textStyles} dark:text-white/90 text-slate-900 font-medium`}>
                        {targetSentence.split('').map((char, index) => {
                            // Default color for untyped/future text
                            let colorClass = gameMode === 'ranking'
                                ? "dark:text-white/90 text-slate-900"
                                : "dark:text-white/30 text-slate-500";

                            if (index < input.length) {
                                // Check if this character is part of the active composition
                                const isComposingChar = compositionStartIndex !== null &&
                                    index >= compositionStartIndex &&
                                    index < cursorPos;

                                if (gameMode === 'ranking') {
                                    colorClass = "dark:text-white text-slate-900"; // Always opaque in ranking mode
                                } else if (isComposingChar) {
                                    colorClass = "dark:text-white/30 text-slate-300"; // Keep it dim/default during composition
                                } else if (input[index] === char) {
                                    colorClass = "dark:text-cyan-400 text-cyan-600";
                                } else {
                                    colorClass = "dark:text-red-400/50 text-red-500/50";
                                }
                            }

                            const isSpace = char === ' ';
                            return (
                                <span key={index} className={`transition-colors duration-100 rounded ${colorClass} ${isSpace ? 'dark:bg-white/5 bg-slate-200' : ''}`}>
                                    {char}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </GlassCard>

            {/* User Input Display (Active) */}
            {/* Manually implementing GlassCard styles to ensure flex layout works correctly for the inner textarea */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col min-h-[30vh] border border-cyan-500/30 relative rounded-2xl bg-white/5 backdrop-blur-md shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
                    <div className="text-sm dark:text-cyan-400 text-cyan-600 mb-2 uppercase tracking-wider font-bold flex justify-between items-center">
                        <span>Your Input</span>
                        <span className={`transition-colors duration-300 ${showFinishConfirmation ? 'text-yellow-400 animate-pulse font-bold' : ''}`}>
                            {showFinishConfirmation ? 'Press Enter again to Finish' : (isComposing ? 'Converting...' : 'Type & Enter')}
                        </span>
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                        {/* 1. Styled Display Layer (Background) */}
                        <div
                            ref={displayContainerRef}
                            className="absolute inset-0 overflow-hidden pointer-events-none pr-2"
                        >
                            <div className={`${textStyles} dark:text-white/90 text-slate-800`}>
                                {input.split('').map((char, index) => {
                                    const isMatch = index < targetSentence.length && char === targetSentence[index];

                                    // Check if this character is part of the active composition
                                    const isComposingChar = compositionStartIndex !== null &&
                                        index >= compositionStartIndex &&
                                        index < cursorPos;

                                    let colorClass;
                                    if (isComposingChar) {
                                        colorClass = "dark:text-white text-slate-900 border-b-2 dark:border-white/50 border-slate-400"; // Neutral style for composing
                                    } else if (gameMode === 'ranking') {
                                        colorClass = "dark:text-white text-slate-900"; // Neutral color for ranking mode
                                    } else {
                                        colorClass = isMatch ? "dark:text-cyan-300 text-cyan-600" : "dark:text-red-400 text-red-600 dark:bg-red-400/10 bg-red-500/10 rounded-sm";
                                    }

                                    const isCursor = index === cursorPos;

                                    return (
                                        <React.Fragment key={index}>
                                            {isCursor && (
                                                <span className="inline-block w-[2px] h-[1em] dark:bg-cyan-400 bg-cyan-600 animate-pulse align-middle -mb-[2px] mr-[1px]" />
                                            )}
                                            <span className={`rounded ${colorClass}`}>
                                                {char}
                                            </span>
                                        </React.Fragment>
                                    );
                                })}
                                {/* Cursor at the end */}
                                {cursorPos === input.length && (
                                    <span className="inline-block w-[2px] h-[1em] dark:bg-cyan-400 bg-cyan-600 animate-pulse align-middle -mb-[2px] ml-[1px]" />
                                )}
                            </div>
                        </div>

                        {/* 2. Real Input Layer (Foreground, Transparent) */}
                        {/* This handles IME, focus, and scrolling naturally */}
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={onInput}
                            onSelect={onSelect}
                            onKeyDown={onKeyDown}
                            onCompositionStart={onCompositionStart}
                            onCompositionEnd={onCompositionEnd}
                            onScroll={handleScroll}
                            className={`absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent resize-none outline-none border-0 p-0 m-0 overflow-y-scroll custom-scrollbar ${textStyles}`}
                            autoFocus
                            autoComplete="off"
                            spellCheck="false"
                            onCopy={(e) => e.preventDefault()}
                            onPaste={(e) => e.preventDefault()}
                            onCut={(e) => e.preventDefault()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TypingDisplay;
