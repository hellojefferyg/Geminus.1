import React from 'react';
import { useStudioStore } from './stores/StudioStore';
import MapEditor from './components/Visualizer/MapEditor';
import AdminDashboard from './components/Administrator/AdminDashboard';

export default function GeminusStudio() {
    const viewMode = useStudioStore((state) => state.viewMode);

    // --- ENTRY GUARD: CHECK FOR PLAYER MODE ---
    const urlParams = new URLSearchParams(window.location.search);
    const isPlayerMode = urlParams.get('mode') === 'player';

    // If the URL has ?mode=player, DO NOT render the editor.
    // Instead, we render the empty container Jeff's engine expects.
    if (isPlayerMode) {
        return (
            <div id="geminus-player-wrapper" className="w-full h-screen bg-[#0d1117] text-white overflow-hidden">
                {/* Jeff's main.js will look for these specific IDs */}
                <div id="game-hud-screen" style={{ display: 'none' }}>
                    <canvas id="smoke-canvas"></canvas>
                    <div id="toast-notification"></div>
                    {/* The rest of the HUD HTML should go here */}
                </div>
            </div>
        );
    }

    // DEFAULT: Studio/Editor Logic
    return (
        <>
            {viewMode === 'visualizer' && (
                <>
                    <MapEditor />
                    <div className="fixed bottom-4 right-4 z-[9999]">
                        <button 
                            onClick={() => useStudioStore.getState().setViewMode('administrator')}
                            className="flex items-center justify-center w-12 h-12 bg-black/80 border border-[#00ffff] text-[#00ffff] rounded-full shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:scale-110 transition-transform"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </>
            )}

            {viewMode === 'administrator' && <AdminDashboard />}
        </>
    );
}