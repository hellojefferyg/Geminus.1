import React from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Home, Hammer, TrendingUp, Package, ChevronRight } from 'lucide-react';
import './admin.css';

export default function EstateEditor() {
    const { masterData, updateData } = useStudioStore();
    const estate = masterData.estate || { buildings: {} };

    const handleUpdate = (id, field, val) => {
        const building = { ...estate.buildings[id], [field]: isNaN(val) ? val : parseFloat(val) };
        updateData('estate.buildings', id, building);
    };

    return (
        <div className="editor-container no-sidebar">
            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header border-b border-emerald-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <Home size={24} className="text-emerald-500" />
                            <h2 className="font-cinzel text-2xl tracking-[0.2em] text-emerald-100">ESTATE & KINGDOM ARCHITECT</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-8">
                        {Object.values(estate.buildings).map(b => (
                            <div key={b.id} className="bg-black/40 border border-emerald-900/20 p-6 rounded-2xl flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-cinzel text-emerald-200 tracking-widest">{b.name}</h4>
                                    <span className="text-[10px] text-emerald-600 font-mono">CODE: {b.id}</span>
                                </div>
                                
                                <div className="editor-field-group">
                                    <label>Building Purpose</label>
                                    <input value={b.description} onChange={e => handleUpdate(b.id, 'description', e.target.value)} />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="editor-field-group">
                                        <label className="text-[8px]">Base Yield</label>
                                        <input type="number" value={b.baseProduction} onChange={e => handleUpdate(b.id, 'baseProduction', e.target.value)} />
                                    </div>
                                    <div className="editor-field-group">
                                        <label className="text-[8px]">Cost Step</label>
                                        <input type="number" value={b.upgradeCost} onChange={e => handleUpdate(b.id, 'upgradeCost', e.target.value)} />
                                    </div>
                                    <div className="editor-field-group">
                                        <label className="text-[8px]">Max Rank</label>
                                        <input type="number" value={b.maxLevel || 10} onChange={e => handleUpdate(b.id, 'maxLevel', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}