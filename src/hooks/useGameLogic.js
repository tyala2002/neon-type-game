import { useState, useCallback, useEffect } from 'react';
import { calculateAccuracy } from '../utils/scoring';

const DEFAULT_TEXT = "プログラミングとは、コンピュータに実行させる命令を作成する作業のことです。現代社会において、ソフトウェアは私たちの生活のあらゆる場面で使われています。スマートフォンアプリから家電製品、自動車の制御システムに至るまで、プログラムが動いています。プログラミングを学ぶことで、論理的思考力が養われ、問題解決能力が向上します。また、自分のアイデアを形にする創造的な楽しさも味わえます。最初は難しく感じるかもしれませんが、少しずつ理解が深まると、その面白さに夢中になるでしょう。継続は力なり、毎日少しずつでもコードを書くことが上達への近道です。";

export const useGameLogic = () => {
    const [targetText, setTargetText] = useState(DEFAULT_TEXT);
    const [gameState, setGameState] = useState('idle'); // idle, playing, finished
    const [input, setInput] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [timeLimit, setTimeLimit] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    const startGame = useCallback((customText = null, customTimeLimit = null) => {
        if (customText) {
            setTargetText(customText);
        } else {
            setTargetText(DEFAULT_TEXT);
        }
        setInput('');
        setGameState('playing');
        setStartTime(Date.now());
        setEndTime(null);
        setTimeLimit(customTimeLimit);
        setTimeLeft(customTimeLimit);
    }, []);

    const endGame = useCallback(() => {
        setGameState('finished');
        setEndTime(Date.now());
    }, []);

    const resetGame = useCallback(() => {
        setGameState('idle');
        setInput('');
        setEndTime(null);
        setTimeLimit(null);
        setTimeLeft(null);
    }, []);

    const handleInputChange = useCallback((newInput) => {
        setInput(newInput);
    }, []);

    // Timer logic
    useEffect(() => {
        let interval = null;
        if (gameState === 'playing' && timeLimit !== null) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState, timeLimit, endGame]);

    return {
        gameState,
        targetText,
        input,
        setInput: handleInputChange,
        startGame,
        resetGame,
        endGame,
        startTime,
        endTime,
        timeLimit,
        timeLeft
    };
};
