import React from 'react';
import GameEngine from './components/GameEngine';

function App() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden selection:bg-cyan-500/30">
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br from-cyan-900/20 via-slate-900 to-purple-900/20 pointer-events-none" />

            <div className="relative z-10">
                <GameEngine />
            </div>
        </div>
    );
}

export default App;
