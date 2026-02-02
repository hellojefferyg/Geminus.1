import React, { useState } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { 
    ChevronDown, Menu, Save, Upload, Download, Zap, Activity, 
    Globe, Cpu, Database, ArrowLeft, X, ChevronRight, 
    Map as MapIcon 
} from 'lucide-react';
import RaceEditor from './RaceEditor';
import EquipmentEditor from './EquipmentEditor';
import BestiaryEditor from './BestiaryEditor';
import ZoneEditor from './ZoneEditor';
import GameConfigEditor from './GameConfigEditor';
import './admin.css';

const NAV_STRUCTURE = {
    "CORE": [
        { id: 'constants', label: 'Constants' },
        { id: 'gameConfig', label: 'Combat Laws' },
        { id: 'shopManager', label: 'Shop Logic' } // New
    ],
    "WORLD": [
        { id: 'zones', label: 'Zones' },
        { id: 'races', label: 'Races' },
        { id: 'bestiary', label: 'Bestiary' },
        { id: 'mapEditor', label: 'World Map' }
    ],
    "ITEMS": [
        { id: 'equipment', label: 'Armory' },
        { id: 'arcanum', label: 'Arcanum' },
        { id: 'jewelry', label: 'Jewelry' },
        { id: 'gems', label: 'Gems' },
        { id: 'gemcutter', label: 'Gemcutter' } // New
    ],
    "SYSTEMS": [
        { id: 'quests', label: 'Quests' },
        { id: 'clans', label: 'Clans' },
        { id: 'enchantments', label: 'Shadow Forge' }, // New
        { id: 'mastery', label: 'Mastery' }, // New
        { id: 'alignment', label: 'Alignment' }, // New
        { id: 'soulforge', label: 'Soulforge' }, // New
        { id: 'vault', label: 'Gilded Vault' }, // New
        { id: 'titles', label: 'Boss Titles' }, // New
        { id: 'portal', label: 'Aether Hub' }, // New
        { id: 'sanctuary', label: 'Sanctuary' }, // New
        { id: 'estate', label: 'Estate' } // New
    ]
};

export default function AdminDashboard() {
    // FIX: Extract masterData so the Telemetry Pulse can read it
    const { setViewMode, masterData } = useStudioStore(); 
    const [activeTool, setActiveTool] = useState('races'); 
    const [isNavOpen, setIsNavOpen] = useState(true); 
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [terminalInput, setTerminalInput] = useState("");
    const [importTarget, setImportTarget] = useState('bestiary');
    const handleTerminalSubmit = () => {
        try {
            const payload = JSON.parse(terminalInput);
            // Redirects 'equipment' to 'armory' bucket
            const targetBucket = payload.category === 'equipment' ? 'armory' : payload.category;

            if (['armory', 'arcanum', 'jewelry'].includes(targetBucket)) {
                // Nested Slot Logic (GDD Compliant)
                Object.entries(payload.data).forEach(([slot, items]) => {
                    Object.entries(items).forEach(([id, itemData]) => {
                        updateData(targetBucket, id, itemData, slot);
                    });
                });
            } else {
                // Standard Flat Logic (Races, Bestiary)
                Object.entries(payload.data).forEach(([id, data]) => {
                    updateData(targetBucket, id, data);
                });
            }
            alert(`Magi-Tech Terminal: Allocated to ${targetBucket}`);
            setTerminalInput("");
            setIsTerminalOpen(false);
        } catch (err) {
            alert("TERMINAL ERROR: Check JSON format or Category mapping.");
        }
    };
    const handleSaveDatabase = () => {
        const dataStr = JSON.stringify(useStudioStore.getState().masterData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `geminus_db_${new Date().toISOString().slice(0,10)}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleLoadDatabase = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                const store = useStudioStore.getState();
                Object.keys(json).forEach(key => {
                    if (Array.isArray(json[key])) store.importData(key, json[key]);
                });
                alert("Database Merged Successfully!");
            } catch (err) {
                alert("Error parsing JSON: " + err.message);
            }
        };
        reader.readAsText(file);
    };

    const executeAllocation = () => {
        try {
            const input = terminalInput.trim();
            if (!input) return;

            // 1. ATTEMPT NESTED JSON PARSE (GDD SLOT LOGIC)
            try {
                const payload = JSON.parse(input);
                // Redirect 'equipment' category to 'armory' bucket
                const targetBucket = payload.category === 'equipment' ? 'armory' : (payload.category || importTarget);

                if (['armory', 'arcanum', 'jewelry'].includes(targetBucket)) {
                    // Loop through sub-slots (e.g., helm, weapon1)
                    Object.entries(payload.data).forEach(([slot, items]) => {
                        Object.entries(items).forEach(([id, itemData]) => {
                            // Uses the 4-argument writer for nested slots
                            useStudioStore.getState().updateData(targetBucket, id, itemData, slot);
                        });
                    });
                } else {
                    // Standard Flat Logic (Bestiary, Races, Zones)
                    const dataToImport = payload.data || payload;
                    Object.entries(dataToImport).forEach(([id, data]) => {
                        useStudioStore.getState().updateData(targetBucket, id, data);
                    });
                }
                alert(`Magi-Tech Terminal: Allocated to ${targetBucket}`);
                setTerminalInput("");
                setIsTerminalOpen(false);
            } catch (jsonErr) {
                // 2. FALLBACK: RAW TEXT IMPORT
                const lines = input.split('\n').filter(l => l.trim());
                lines.forEach(line => {
                    const id = line.trim().toUpperCase();
                    useStudioStore.getState().updateData(importTarget, id, { id, name: line.trim() });
                });
                alert(`Allocated ${lines.length} raw text units to ${importTarget}`);
                setTerminalInput("");
            }
        } catch (err) {
            alert(`CRITICAL ERROR: ${err.message}`);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#0c101d] text-[#e0f8ff] font-sans overflow-hidden">
            {/* MOBILE DRAWER BRIDGE: Overlays content on small screens, Sidebar on desktop */}
            <div className={`fixed md:relative z-[1000] md:z-auto transition-all duration-300 ease-in-out bg-[#0c101d] 
                ${isNavOpen ? 'w-full md:w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'} 
                flex-shrink-0 overflow-hidden flex flex-col border-r border-cyan-900/30 h-full shadow-2xl md:shadow-none`}
            >
                {/* MOBILE-ONLY CLOSE BUTTON */}
                <div className="md:hidden p-4 flex justify-end border-b border-cyan-900/30">
                    <button 
                        onClick={() => setIsNavOpen(false)} 
                        className="p-2 bg-red-900/20 border border-red-500/40 text-red-400 rounded-full"
                    >
                        ✕
                    </button>
                </div>

                {/* MAGI-TECH COMMAND HEADER & TELEMETRY PULSE */}
<div className="p-4 border-b border-cyan-500/20 bg-gradient-to-b from-cyan-950/10 to-transparent">
    <h2 className="font-cinzel text-lg text-cyan-400 tracking-wider">COMMAND CENTER</h2>
</div>

<div className="p-4 mx-3 my-2 bg-cyan-950/20 border border-cyan-500/20 rounded-lg shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] transition-all hover:border-cyan-400/40">
    <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
            <Activity size={10} className="text-cyan-500" />
            <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">System Pulse</span>
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_cyan]"></div>
    </div>
    
    <div className="space-y-1.5 font-mono text-[10px]">
    {/* MAGI-TECH SAFE TELEMETRY READOUTS */}
    <div className="flex justify-between text-gray-400">
        <span className="flex items-center gap-1">
            <Globe size={8} className="text-gray-500" /> Zones Cached:
        </span>
        <span className="text-cyan-300 font-bold">
            {Object.keys(masterData?.zones || {}).length}
        </span>
    </div>

    <div className="flex justify-between text-gray-400">
        <span className="flex items-center gap-1">
            <Cpu size={8} className="text-gray-500" /> Entity Count:
        </span>
        <span className="text-orange-400 font-bold">
            {Object.keys(masterData?.bestiary || {}).length}
        </span>
    </div>

    <div className="flex justify-between text-gray-400 border-t border-cyan-900/30 pt-1 mt-1">
        <span className="flex items-center gap-1">
            <Database size={8} className="text-gray-500" /> Sync Status:
        </span>
        <span className="text-green-400 text-[8px] uppercase tracking-tighter font-black">
            Magi-Tech Active
        </span>
    </div>
</div>
</div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {Object.entries(NAV_STRUCTURE).map(([group, items]) => (
                        <details key={group} open className="group">
                            <summary className="nav-group flex items-center justify-between cursor-pointer p-3 hover:bg-cyan-500/5 text-xs font-bold tracking-widest text-gray-500">
                                {group}
                                <ChevronDown size={14} className="group-open:rotate-180 transition-transform"/>
                            </summary>
                            <div className="flex flex-col">
                                {items.map(item => (
                                    <div 
                                        key={item.id}
                                        onClick={() => setActiveTool(item.id)}
                                        className={`px-6 py-2 text-sm transition-all cursor-pointer ${activeTool === item.id ? 'bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400' : 'text-gray-400 hover:text-cyan-200'}`}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>
                {/* MAGI-TECH OVERDRIVE CONSOLE */}
<div className="p-4 border-t border-cyan-900/50 space-y-3 bg-black/40">
    {/* 1. GLOBAL PARAMETER OVERDRIVE */}
    <div className="text-[8px] font-bold text-gray-500 uppercase mb-1 tracking-tighter text-center">Global Parameter Overdrive</div>
    <div className="flex gap-2">
        <button 
            onClick={() => useStudioStore.getState().applyWorldScaling(1.1)} 
            className="flex-1 py-1.5 text-[8px] border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 rounded uppercase font-black transition-all active:scale-95"
        >
            Buff World
        </button>
        <button 
            onClick={() => useStudioStore.getState().applyWorldScaling(0.9)} 
            className="flex-1 py-1.5 text-[8px] border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded uppercase font-black transition-all active:scale-95"
        >
            Nerf World
        </button>
    </div>

    {/* 2. DATA PERSISTENCE BRIDGE */}
    <div className="flex gap-2">
        <button onClick={handleSaveDatabase} className="flex-1 flex items-center justify-center p-2 text-[10px] border border-green-900/50 text-green-400 hover:bg-green-900/20 rounded transition-colors">
            <Download size={12} className="mr-1"/>SAVE
        </button>
        <label className="flex-1 flex items-center justify-center p-2 text-[10px] border border-blue-900/50 text-blue-400 hover:bg-blue-900/20 rounded cursor-pointer transition-colors">
            <Upload size={12} className="mr-1"/>LOAD
            <input type="file" onChange={handleLoadDatabase} className="hidden" accept=".json"/>
        </label>
    </div>

    {/* 3. SYSTEM TERMINAL & EMERGENCY PURGE */}
    <button onClick={() => setIsTerminalOpen(true)} className="w-full py-2 text-[10px] font-bold text-orange-400 border border-orange-900/50 hover:bg-orange-900/20 rounded tracking-widest uppercase shadow-inner">
        🔥 Data Terminal
    </button>
    
    <button 
        onClick={() => useStudioStore.getState().purgeWorldData()}
        className="w-full py-2 bg-red-950/20 border border-red-500/40 text-red-500 text-[9px] font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
    >
        <Zap size={10} /> Emergency Purge
    </button>

    {/* 4. EXIT PROTOCOL */}
    <button onClick={() => setViewMode('visualizer')} className="w-full py-2 text-[10px] border border-gray-700 text-gray-400 hover:text-cyan-400 rounded flex items-center justify-center transition-all">
        <ArrowLeft size={12} className="mr-1"/> EXIT TO MAP
    </button>
</div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-12 border-b border-cyan-900/30 bg-[#0a1e23]/90 flex items-center px-4">
                    <button onClick={() => setIsNavOpen(!isNavOpen)} className="p-2 hover:bg-white/5 rounded text-cyan-400"><Menu size={20}/></button>
                    <span className="ml-4 font-cinzel text-xs tracking-widest text-gray-400">MODULE // <span className="text-cyan-400">{activeTool.toUpperCase()}</span></span>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    {activeTool === 'races' && <RaceEditor />}
                    {(activeTool === 'equipment' || activeTool === 'jewelry' || activeTool === 'gems' || activeTool === 'arcanum') && (
                        <EquipmentEditor activeTool={activeTool} />
        )}
                    {activeTool === 'bestiary' && <BestiaryEditor />}
                    {(activeTool === 'constants' || activeTool === 'gameConfig') && <GameConfigEditor />}
                    {activeTool === 'zones' && <ZoneEditor />}
                </div>
            </div>

            {isTerminalOpen && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] p-12">
                    <div className="w-full max-w-4xl h-full max-h-[700px] bg-[#0f1525] border border-cyan-500/30 rounded flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-[#161d31]">
                            <div className="flex items-center gap-4">
                                <h3 className="text-cyan-400 font-cinzel text-xs tracking-widest">RELATIONAL DATA TERMINAL</h3>
                                <div className="flex bg-black/40 p-1 rounded border border-cyan-900/30">
                                    {['bestiary', 'zones', 'constants', 'equipment'].map(cat => (
                                        <button key={cat} onClick={() => setImportTarget(cat)} className={`px-3 py-1 text-[9px] uppercase rounded ${importTarget === cat ? 'bg-cyan-500 text-black font-bold' : 'text-gray-500'}`}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setIsTerminalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                        <textarea 
                            className="flex-1 bg-black/50 p-6 font-mono text-[11px] text-cyan-100 outline-none resize-none custom-scrollbar"
                            placeholder={`Paste JSON or ZID:EID list here...\nExample:\nZONE_01:ORC_WARRIOR\nZONE_01:GOBLIN_SCOUT`}
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                        />
                        <div className="p-4 border-t border-cyan-900/50 bg-[#161d31] flex justify-between items-center">
                            <p className="text-[10px] text-cyan-600 font-mono italic">TARGET: masterData.{importTarget}</p>
                            <button onClick={executeAllocation} className="bg-cyan-600 hover:bg-cyan-500 text-black px-8 py-2 text-[10px] font-bold rounded">EXECUTE ALLOCATION</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}