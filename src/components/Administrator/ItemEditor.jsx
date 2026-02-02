import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Trash2, Save, Plus } from 'lucide-react';

export default function ItemEditor({ activeTool }) {
    const { masterData, updateData, deleteData } = useStudioStore();
    
    // 1. Get ALL items from the shared folder
    const allItems = masterData.items || {};

    // 2. Filter items so they ONLY show up in their specific tab
    const filteredEntries = Object.entries(allItems).filter(([id, item]) => {
        return item.type === activeTool;
    });

    const items = Object.fromEntries(filteredEntries);
    
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState(null);

    // Sync selection when the tab (activeTool) changes
    useEffect(() => {
        const firstId = Object.keys(items)[0];
        setSelectedId(firstId || null);
    }, [activeTool]);

    // Sync form when selection changes
    useEffect(() => {
        if (selectedId && items[selectedId]) {
            setFormData({ ...items[selectedId] });
        } else {
            setFormData(null);
        }
    }, [selectedId, items]);

    const handleSave = () => {
        if (!selectedId || !formData) return;
        updateData('items', selectedId, formData);
        alert("Item Data Updated!");
    };

    const handleDelete = () => {
        if (!window.confirm("Are you sure you want to scrap this item?")) return;
        
        const idToDelete = selectedId;
        const remainingIds = Object.keys(items).filter(id => id !== idToDelete);
        
        // Safety: Set selection to next item BEFORE deleting to prevent white screen crash
        setSelectedId(remainingIds[0] || null);
        
        deleteData('items', idToDelete);
    };

    return (
        <div className="flex h-full font-sans">
            {/* LEFT: ITEM LIST */}
            <div className="w-64 border-r border-cyan-900/30 flex flex-col bg-black/20">
                <div className="p-4 border-b border-cyan-900/30">
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 rounded text-xs hover:bg-cyan-500/10">
                        <Plus size={14} /> Forge New {activeTool}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {Object.values(items).map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className={`p-3 cursor-pointer border-b border-cyan-900/10 transition-colors ${selectedId === item.id ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            <div className="text-xs font-bold uppercase tracking-tighter">{item.name}</div>
                            <div className="text-[10px] opacity-50">{item.tier || 'Common'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: EDITOR PANEL */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {formData ? (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="flex justify-between items-start border-b border-cyan-900/30 pb-4">
                            <div>
                                <h2 className="text-2xl font-cinzel text-cyan-400 uppercase tracking-widest">{formData.name}</h2>
                                <p className="text-xs text-gray-500 italic">ID: {selectedId}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Scrap Item">
                                    <Trash2 size={20} />
                                </button>
                                <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                                    <Save size={18} /> SAVE CHANGES
                                </button>
                            </div>
                        </div>

                        {/* CORE DATA */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-cyan-500/50 uppercase font-bold tracking-widest">Display Name</label>
                                <input 
                                    className="w-full bg-black/40 border border-cyan-900/50 p-2 text-sm outline-none focus:border-cyan-400 transition-colors"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-cyan-500/50 uppercase font-bold tracking-widest">Tier</label>
                                <select 
                                    className="w-full bg-black/40 border border-cyan-900/50 p-2 text-sm outline-none focus:border-cyan-400 transition-colors"
                                    value={formData.tier || ''}
                                    onChange={(e) => setFormData({...formData, tier: e.target.value})}
                                >
                                    {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* STATS AREA */}
                        {/* GDD-COMPLIANT STATISTICS PANEL */}
                        <div className="p-4 bg-cyan-900/10 border border-cyan-900/30 rounded">
                            <h3 className="text-[11px] text-cyan-400 mb-4 tracking-widest font-bold uppercase">Magi-Tech Properties</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Requirement Stats (Always Visible) */}
                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 uppercase font-bold">VIT Required</label>
                                    <input type="number" className="w-full bg-black/40 border border-cyan-900/50 p-1 text-sm outline-none focus:border-cyan-400"
                                        value={formData.vit_req || 0}
                                        onChange={(e) => setFormData({...formData, vit_req: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 uppercase font-bold">Gold Price</label>
                                    <input type="number" className="w-full bg-black/40 border border-cyan-900/50 p-1 text-sm outline-none focus:border-cyan-400"
                                        value={formData.price || 0}
                                        onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                                    />
                                </div>

                                {/* Dynamic Scaling Stats based on Item Type */}
                                {activeTool.toLowerCase() === 'necklace' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-cyan-500/50 uppercase font-bold">HP Bonus (%)</label>
                                            <input type="number" step="0.001" className="w-full bg-black/40 border border-cyan-900/50 p-1 text-sm outline-none focus:border-cyan-400"
                                                value={formData.hp_pct || 0}
                                                onChange={(e) => setFormData({...formData, hp_pct: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-cyan-500/50 uppercase font-bold">HP Regen (%)</label>
                                            <input type="number" step="0.001" className="w-full bg-black/40 border border-cyan-900/50 p-1 text-sm outline-none focus:border-cyan-400"
                                                value={formData.regen_pct || 0}
                                                onChange={(e) => setFormData({...formData, regen_pct: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTool.toLowerCase() === 'ring' && (
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-cyan-500/50 uppercase font-bold">Crit Bonus (%)</label>
                                        <input type="number" step="0.001" className="w-full bg-black/40 border border-cyan-900/50 p-1 text-sm outline-none focus:border-cyan-400"
                                            value={formData.crit_bonus || 0}
                                            onChange={(e) => setFormData({...formData, crit_bonus: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-cyan-500/50 uppercase font-bold tracking-widest">Lore / Description</label>
                            <textarea 
                                className="w-full bg-black/40 border border-cyan-900/50 p-3 text-sm outline-none focus:border-cyan-400 h-24 resize-none"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <div className="font-cinzel text-xl tracking-widest">NO {activeTool.toUpperCase()} DETECTED</div>
                        <div className="text-xs mt-2 italic">Use the Magi-Tech Terminal to allocate data...</div>
                    </div>
                )}
            </div>
        </div>
    );
}