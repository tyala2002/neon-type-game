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
                <div className="text-sm text-slate-400 mb-2 uppercase tracking-wider font-bold">Target Text</div>
                <div className="flex-1 overflow-y-scroll custom-scrollbar">
                    <div className={`${textStyles} text-white/90`}>
                        {targetSentence.split('').map((char, index) => {
                            let colorClass = gameMode === 'ranking' ? "text-white" : "text-white/30";

                            if (index < input.length) {
                                // Check if this character is part of the active composition
                                const isComposingChar = compositionStartIndex !== null &&
                                    index >= compositionStartIndex &&
                                    index < cursorPos;

                                if (gameMode === 'ranking') {
                                    colorClass = "text-white"; // Always opaque in ranking mode
                                } else if (isComposingChar) {
                                    colorClass = "text-white/30"; // Keep it dim/default during composition
                                } else if (input[index] === char) {
                                    colorClass = "text-cyan-400";
                                } else {
                                    colorClass = "text-red-400/50";
                                }
                            }

                            const isSpace = char === ' ';
                            return (
                                <span key={index} className={`transition-colors duration-100 rounded ${colorClass} ${isSpace ? 'bg-white/5' : ''}`}>
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
                    <div className="text-sm text-cyan-400 mb-2 uppercase tracking-wider font-bold flex justify-between items-center">
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
                            <div className={`${textStyles} text-white/90`}>
                                {input.split('').map((char, index) => {
                                    const isMatch = index < targetSentence.length && char === targetSentence[index];

                                    // Check if this character is part of the active composition
                                    const isComposingChar = compositionStartIndex !== null &&
                                        index >= compositionStartIndex &&
                                        index < cursorPos;

                                    let colorClass;
                                    if (isComposingChar) {
                                        colorClass = "text-white border-b-2 border-white/50"; // Neutral style for composing
                                    } else if (gameMode === 'ranking') {
                                        colorClass = "text-white"; // Neutral color for ranking mode
                                    } else {
                                        colorClass = isMatch ? "text-cyan-300" : "text-red-400 bg-red-400/10 rounded-sm";
                                    }

                                    const isCursor = index === cursorPos;

                                    return (
                                        <React.Fragment key={index}>
                                            {isCursor && (
                                                <span className="inline-block w-[2px] h-[1em] bg-cyan-400 animate-pulse align-middle -mb-[2px] mr-[1px]" />
                                            )}
                                            <span className={`rounded ${colorClass}`}>
                                                {char}
                                            </span>
                                        </React.Fragment>
                                    );
                                })}
                                {/* Cursor at the end */}
                                {cursorPos === input.length && (
                                    <span className="inline-block w-[2px] h-[1em] bg-cyan-400 animate-pulse align-middle -mb-[2px] ml-[1px]" />
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
