import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// --- CONFIGURATION ---
// This must match the URL where your Map Maker is running.
// If running separately: "http://localhost:5174"
// If inside public folder: "/map-maker.html" (or whatever the file is named)
const MAP_MAKER_URL = "http://localhost:5173"; 

export default function MapMakerBridge({ onClose }) {
    const iframeRef = useRef(null);

    // 1. LISTENER: Listen for "Save" messages from the Map Maker
    useEffect(() => {
        const handleMessage = (event) => {
            // Check if the message is actually for us
            if (!event.data || !event.data.type) return;

            const { type, payload } = event.data;

            if (type === 'SAVE_MAP_DATA') {
                console.log("📥 Dev Tools received Map Data:", payload);
                alert("Connection Successful: Received Map Data!");
                // Later, we will connect this to useMapStore to actually save it.
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // 2. SENDER: Send a "Hello" handshake when the Iframe loads
    const handleIframeLoad = () => {
        console.log("📤 Sending handshake to Map Maker...");
        if (iframeRef.current) {
            iframeRef.current.contentWindow.postMessage({
                type: 'INIT_DEV_TOOLS',
                message: 'Connection Established'
            }, '*');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-7xl h-[90vh] bg-gray-900 border border-indigo-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center bg-black/60 p-3 border-b border-gray-700">
                    <h3 className="text-white font-bold ml-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_indigo]"></span>
                        Map Maker Bridge
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* The Map Maker Iframe */}
                <div className="flex-1 bg-black relative">
                    <iframe
                        ref={iframeRef}
                        src={MAP_MAKER_URL}
                        title="Map Maker"
                        className="w-full h-full border-none"
                        onLoad={handleIframeLoad}
                        allow="clipboard-read; clipboard-write"
                    />
                </div>
            </div>
        </div>
    );
}