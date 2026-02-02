import { useEffect, useRef } from 'react'; // 1. Added useRef
import { useMapStore } from './Visualizer/MapEditor';
import { X } from 'lucide-react';
import { InteractionBridge } from '../../utils/InteractionBridge'; // 2. Added Bridge import

export default function InteractionModal() {
    const activeModule = useMapStore(state => state.activeModule);
    const closeModule = useMapStore(state => state.closeModule);
    
    // 3. Initialize Iframe Reference
    const iframeRef = useRef(null);

    // 4. Initialize Global Message Listener
    // This allows HTML modules to send data back to the React Store
    useEffect(() => {
        InteractionBridge.listen();
    }, []);

    // 5. Handshake Protocol
    // Triggered when the HTML file finishes loading
    const handleIframeLoad = () => {
        if (iframeRef.current) {
            InteractionBridge.sync(iframeRef.current);
        }
    };

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') closeModule(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [closeModule]);

    if (!activeModule) return null;

    const moduleId = activeModule.moduleId || 'default';
    const sourceUrl = `/modules/${moduleId}.html`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl h-[85vh] bg-[#1a1a1a] border border-[#00ffff]/30 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.1)] flex flex-col overflow-hidden">
                
                {/* Header Section */}
                <div className="flex justify-between items-center bg-black/40 p-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_cyan]" />
                        <h3 className="text-xs font-cinzel text-cyan-100 uppercase tracking-[0.3em] font-bold">
                            {moduleId.replace(/_/g, ' ')} Terminal
                        </h3>
                    </div>
                    <button 
                        onClick={closeModule}
                        className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors text-gray-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-black relative">
                    <iframe 
                        ref={iframeRef} // 6. Linked reference
                        src={sourceUrl}
                        onLoad={handleIframeLoad} // 7. Triggered sync on load
                        title="Interaction Module"
                        className="w-full h-full border-0"
                        onError={(e) => {
                            e.target.srcdoc = `<body style="background:#111;color:#888;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;">
                                <div>
                                    <h1 style="color:#ff4444;margin-bottom:10px;">Module Not Found</h1>
                                    <p>Could not load: <strong>public/modules/${moduleId}.html</strong></p>
                                    <p style="font-size:12px;margin-top:20px;">Please ensure the file exists and the ID matches.</p>
                                </div>
                            </body>`;
                        }}
                    />
                </div>
            </div>
        </div>
    );
}