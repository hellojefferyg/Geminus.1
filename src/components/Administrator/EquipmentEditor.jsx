import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { 
    Save, Plus, Sword, Shield, Zap, Target, 
    Sparkles, Gem, Layers, Trash2, ChevronRight 
} from 'lucide-react';

// 1. DATA MAPS: Aligned with Magi-Tech GDD Slot Architecture
const CATEGORY_MAP = {
    equipment: 'armory',
    jewelry: 'jewelry',
    arcanum: 'arcanum',
    gems: 'gems'
};

const SUB_SLOTS = {
    // FIX: Aligned 'legs' to 'leggings' to match armoryData.js
    armory: ["helmet", "weapons", "chest", "gloves", "leggings", "boots"],
    arcanum: ["spells"], 
    jewelry: ["necklace", "ring", "artifact"],
    gems: ["base_gems"] // This must match the key in gemsData.js
};

const TIERS = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Artifact"];

export default function EquipmentEditor({ activeTool }) {
    const { masterData, updateData } = useStudioStore();
    
    // 1. SMART BUCKET RESOLVER: Handles case-sensitivity
    const targetBucket = (CATEGORY_MAP[activeTool] || activeTool || "").toLowerCase();
    
    // UI STATE: Track selection
    const [selectedSubSlot, setSelectedSubSlot] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [selectedType, setSelectedType] = useState("ALL");

    // 2. FAIL-SAFE ALIASES: Bridges UI labels to armoryData.js keys
    const SLOT_ALIASES = { 
        legs: "leggings",
        shield: "weapons" 
    };

    // FORCED DEFAULTING: Ensures Gems load base_gems automatically
useEffect(() => {
    const slots = SUB_SLOTS[targetBucket] || [];
    if (slots.length > 0) {
        if (!selectedSubSlot || !slots.includes(selectedSubSlot)) {
            setSelectedSubSlot(slots[0]);
            setSelectedType("ALL"); 
            setSelectedId(null);
        }
    }
}, [targetBucket, selectedSubSlot]);

    // UNIVERSAL DATA RESOLVER: Checks primary, then falls back to weapon-nested key or alias
    const alias = SLOT_ALIASES[selectedSubSlot];
    const rawData = masterData?.[targetBucket]?.[selectedSubSlot] || 
                    (targetBucket === 'armory' ? masterData?.[targetBucket]?.weapons?.[selectedSubSlot] : null) ||
                    (alias ? (masterData?.[targetBucket]?.[alias] || masterData?.[targetBucket]?.weapons?.[alias]) : null) || {};

    console.log("DEBUG GEMS:", { targetBucket, selectedSubSlot, alias, dataKeys: Object.keys(rawData) });
    let items = {};

    // 1. Detect folders (axe, fire, lorestone) vs flat items (chest)
    const folderEntries = Object.entries(rawData).filter(([key, val]) => val && typeof val === 'object' && !val.id);

    if (folderEntries.length > 0) {
        // 2. We found folders. Now determine which one to show
        const typeKey = selectedType === "ALL" ? null : selectedType;
        
        if (typeKey) {
            // Targeted selection (Checks both "LORESTONE" and "lorestone")
            items = rawData[typeKey] || rawData[typeKey.toLowerCase()] || rawData[typeKey.toUpperCase()] || {};
        } else {
            // FLAT-MAPPER: Merge all folders (axe, bow, lorestone, etc.) into sidebar
            items = Object.values(rawData).reduce((acc, group) => ({ ...acc, ...group }), {});
        }
    } else {
        // 3. Flat structure for Chest/Helmets
        // If there are no folders, the items (like Novice Chest) are already at the top level
        items = rawData;
    }

    const activeItem = items[selectedId] || null;

    // FORGE LOGIC: Enhanced with UI-Auto-Focus and Nesting Support
    const handleCreate = () => {
        const currentCategory = (CATEGORY_MAP[activeTool] || activeTool || "").toLowerCase();
        const fallbackSlot = SUB_SLOTS[currentCategory]?.[0];
        const activeSubSlot = selectedSubSlot || fallbackSlot;

        if (!activeSubSlot) {
            console.error("FORGE FAILURE: No active sub-slot found for", activeTool);
            return;
        }

        const id = `${activeSubSlot.toUpperCase()}_${Date.now()}`;
        const newItem = {
            id,
            name: `New ${activeSubSlot}`,
            tier: 1, // Using numeric tiers from armoryData.js
            price: 50000,
            ic: 0, ac: 0, wc: 0, sc: 0, hit: 0, 
            shadowMultiplier: 1.0,
            echoStability: 0.5,
            description: ""
        };

        // Determine if we need to save inside the 'weapons' folder
        let slot = activeSubSlot;
        let subType = null;

        if (currentCategory === 'armory') {
            // Case A: Weapon sub-folders (axe, sword)
            if (folderEntries.length > 0) {
                slot = 'weapons';
                subType = selectedType === "ALL" ? "axe" : selectedType.toLowerCase();
            } 
            // Case B: Armor nested inside weapons (helmet, chest)
            else if (masterData.armory?.weapons?.[activeSubSlot]) {
                slot = 'weapons';
                subType = activeSubSlot;
            }
        }

        updateData(currentCategory, id, newItem, slot, subType);
        setSelectedSubSlot(activeSubSlot);
        setSelectedId(id);
    };

    const handleUpdate = (field, value) => {
        if (!selectedId || !selectedSubSlot) return;

        // Added requirements and tier to numeric enforcement per armoryData.js
        const numericFields = ['price', 'tier', 'shadowMultiplier', 'echoStability', 'ic', 'ac', 'wc', 'sc', 'hit', 'pAtk', 'mAtk', 'pDef', 'mDef', 'crit', 'haste', 'str_req', 'vit_req'];
        const val = numericFields.includes(field) ? (parseFloat(value) || 0) : value;

        const updated = { ...activeItem, [field]: val };

        // DYNAMIC PATH REDIRECT: Finds the nested path so updates don't create duplicates
        let slot = selectedSubSlot;
        let subType = null;

        if (targetBucket === 'armory') {
            if (folderEntries.length > 0) {
                // Path: armory -> weapons -> axe -> ID
                slot = 'weapons';
                subType = Object.keys(rawData).find(key => rawData[key] && rawData[key][selectedId]) || selectedType.toLowerCase();
            } else if (masterData.armory?.weapons?.[selectedSubSlot]) {
                // Path: armory -> weapons -> helmet -> ID
                slot = 'weapons';
                subType = selectedSubSlot;
            }
        }

        updateData(targetBucket, selectedId, updated, slot, subType);
    };

    return (
        <div className="flex h-full bg-[#0c101d] text-cyan-100 font-sans border-t border-cyan-900/20">
            {/* SIDEBAR: SLOT & BLUEPRINT NAVIGATOR */}
            <div className="w-72 border-r border-cyan-900/30 flex flex-col bg-black/40">
                <div className="p-4 space-y-4 border-b border-cyan-900/30 bg-[#0a0e1a]">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-cyan-600 uppercase tracking-widest">Active Conduit Slot</label>
                        <select 
                            value={selectedSubSlot} 
                            onChange={(e) => { setSelectedSubSlot(e.target.value); setSelectedId(null); }}
                            className="w-full bg-black border border-cyan-500/30 p-2 text-[10px] text-cyan-400 font-black uppercase rounded outline-none"
                        >
                            {SUB_SLOTS[targetBucket]?.map(slot => (
                                <option key={slot} value={slot}>{slot.replace(/([A-Z0-9])/g, ' $1')}</option>
                            ))}
                        </select>
                    </div>
                    {/* SUB-TYPE FILTER: Forced to appear if sub-folders exist */}
{Object.values(rawData).length > 0 && typeof Object.values(rawData)[0] === 'object' && !Object.values(rawData)[0].id && (
    <div className="space-y-1 mb-4">
        <label className="text-[9px] font-black text-purple-600 uppercase tracking-widest italic">Filter by Type</label>
        <select 
            value={selectedType} 
            onChange={(e) => { setSelectedType(e.target.value); setSelectedId(null); }}
            className="w-full bg-black border border-purple-500/30 p-2 text-[10px] text-purple-400 font-black uppercase rounded outline-none"
        >
            <option value="ALL">Show All Types</option>
            {Object.keys(rawData).map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
            ))}
        </select>
    </div>
)}
                    <button onClick={handleCreate} className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 rounded flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all uppercase text-[10px] font-black tracking-widest">
                        <Plus size={14} /> Forge New {activeTool}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {Object.values(items).length === 0 && (
                        <p className="text-[10px] text-gray-600 text-center mt-10 italic">No {selectedSubSlot} blueprints detected.</p>
                    )}
                    {Object.values(items).map(item => (
                        <div key={item.id} onClick={() => setSelectedId(item.id)}
                            className={`p-3 rounded cursor-pointer transition-all border group ${selectedId === item.id ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-black/20 border-cyan-900/30 hover:border-cyan-700'}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black uppercase truncate group-hover:text-cyan-400 transition-colors">{item.name}</span>
                                <span className="text-[7px] px-1.5 py-0.5 bg-cyan-900/30 rounded text-cyan-500 font-mono">{item.tier}</span>
                            </div>
                            <div className="text-[8px] text-cyan-900 font-mono mt-1">{item.id}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN WORKSPACE: BLUEPRINT CONFIGURATOR */}
            {activeItem ? (
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#0c101d] to-[#04060b]">
                    <div className="max-w-4xl mx-auto space-y-10">
                        {/* HEADER: IDENTITY & VALUE */}
                        <div className="flex justify-between items-end border-b border-cyan-500/20 pb-8">
                            <div className="flex-1">
                                <label className="text-[9px] text-cyan-700 font-black uppercase tracking-[0.2em] mb-2 block">Item Identification</label>
                                <input 
                                    value={activeItem.name} 
                                    onChange={(e) => handleUpdate('name', e.target.value)}
                                    className="bg-transparent text-4xl font-cinzel text-cyan-400 outline-none w-full border-b border-transparent focus:border-cyan-500/10"
                                />
                                <div className="flex gap-6 mt-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[8px] text-gray-600 uppercase font-black">Rarity Tier</label>
                                        <select 
                                            value={activeItem.tier} 
                                            onChange={(e) => handleUpdate('tier', e.target.value)}
                                            className="bg-black/40 border border-cyan-900/50 p-1 px-4 text-[10px] font-black uppercase text-cyan-400 rounded cursor-pointer focus:border-cyan-500"
                                        >
                                            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 border-l border-cyan-900/30 pl-6">
                                        <label className="text-[8px] text-gray-600 uppercase font-black">Active Sub-Slot</label>
                                        <span className="text-[10px] text-cyan-700 font-mono uppercase font-black">{selectedSubSlot}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <label className="block text-[10px] text-cyan-600 uppercase font-black mb-1 italic">Value (Shadow Gold)</label>
                                <input 
                                    type="number" 
                                    value={activeItem.price} 
                                    onChange={(e) => handleUpdate('price', parseInt(e.target.value) || 0)}
                                    className="bg-black/80 border border-cyan-900/50 p-3 text-2xl font-mono text-orange-400 w-40 text-right rounded shadow-inner outline-none focus:border-orange-500/50"
                                />
                            </div>
                        </div>

                        {/* DYNAMIC GDD STAT GRID: Handles all GDD custom stats and requirements */}
<div className="space-y-4">
    <label className="text-[10px] text-cyan-600 font-black uppercase tracking-widest">Power & Requirements</label>
    <div className="grid grid-cols-5 gap-5">
        {/* Expanded to include Strength and Vitality requirements from armoryData.js */}
        {['ic', 'ac', 'wc', 'sc', 'hit', 'str_req', 'vit_req', 'pAtk', 'mAtk', 'pDef', 'mDef'].map((statId) => (
            activeItem[statId] !== undefined && (
                <div key={statId} className="bg-black/60 border border-cyan-900/30 p-5 rounded-lg flex flex-col items-center shadow-inner">
                    <label className="text-[8px] font-black text-gray-600 uppercase mb-3 text-center">{statId.replace('_', ' ').toUpperCase()}</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={activeItem[statId] || 0} 
                        onChange={(e) => handleUpdate(statId, e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/10 text-center font-mono text-cyan-200 text-xl py-2 outline-none rounded" 
                    />
                </div>
            )
        ))}
    </div>
</div>

                        {/* SHADOW & ECHO PIPELINE */}
                        <div className="space-y-4">
                            <label className="text-[10px] text-purple-600 font-black uppercase tracking-widest">Procedural Yield Engine</label>
                            <div className="grid grid-cols-2 gap-8 bg-cyan-950/20 border border-cyan-500/20 p-8 rounded-2xl relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 p-2 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"><Gem size={120} /></div>
                                <div className="relative z-10">
                                    <label className="text-[10px] text-cyan-400 font-black uppercase flex items-center gap-2 mb-3">
                                        <Gem size={12} className="text-cyan-500"/> Shadow Multiplier
                                    </label>
                                    <input 
                                        type="number" step="0.1"
                                        value={activeItem.shadowMultiplier}
                                        onChange={(e) => handleUpdate('shadowMultiplier', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-black/60 border border-cyan-900/50 p-3 text-cyan-200 font-mono text-lg rounded shadow-inner outline-none focus:border-cyan-400"
                                    />
                                    <p className="text-[9px] text-cyan-800 mt-3 font-mono uppercase tracking-tighter leading-relaxed">Scaling factor for Zonal Shadow Drop Rates.</p>
                                </div>
                                <div className="relative z-10">
                                    <label className="text-[10px] text-purple-400 font-black uppercase flex items-center gap-2 mb-3">
                                        <Sparkles size={12} className="text-purple-500"/> Echo Stability
                                    </label>
                                    <input 
                                        type="number" step="0.01"
                                        value={activeItem.echoStability}
                                        onChange={(e) => handleUpdate('echoStability', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-black/60 border border-purple-900/50 p-3 text-purple-200 font-mono text-lg rounded shadow-inner outline-none focus:border-purple-400"
                                    />
                                    <p className="text-[9px] text-purple-900 mt-3 font-mono uppercase tracking-tighter leading-relaxed">Stability of "Shadows of Shadows" generation.</p>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPTION BOX */}
                        <div className="space-y-4 pb-10">
                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Blueprint Protocol Notes</label>
                            <textarea 
                                value={activeItem.description}
                                onChange={(e) => handleUpdate('description', e.target.value)}
                                className="w-full bg-black/40 border border-cyan-900/50 p-6 text-xs text-cyan-100/60 h-32 outline-none focus:border-cyan-500/30 rounded-xl font-sans leading-relaxed shadow-inner"
                                placeholder="Initialize flavor text or operational protocols for this conduit..."
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-[0.03]">
                    <Layers size={160} />
                    <p className="font-cinzel text-4xl uppercase tracking-[0.8em] mt-8">Forge Offline</p>
                </div>
            )}
        </div>
    );
}