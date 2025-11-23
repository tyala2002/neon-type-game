import React from 'react';
import GameEngine from './components/GameEngine';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

function App() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen dark:bg-[#0f172a] bg-slate-50 dark:text-white text-slate-900 overflow-hidden selection:bg-cyan-500/30">
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br dark:from-cyan-900/20 dark:via-slate-900 dark:to-purple-900/20 from-cyan-100/50 via-white to-purple-100/50 pointer-events-none" />

            <div className="relative z-10">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10 backdrop-blur-sm group"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    ) : (
                        <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                    )}
                </button>

                <GameEngine />
            </div>
        </div>
    );
}

export default App;
