import React from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Skull, Sparkles, Zap, Shield, TrendingUp, Ghost } from 'lucide-react';
import './admin.css';

export default function TitleBalancer() {
    const { masterData, updateData } = useStudioStore();
    const titles = masterData.monsterTitles || {};

    const handleUpdate = (id, field, val) => {
        const title = { ...titles[id], [field]: isNaN(val) ? val : parseFloat(val) };
        updateData('monsterTitles', id, title);
    };

    return (
        <div className="editor-container no-sidebar">
            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header border-b border-purple-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <Ghost size={24} className="text-purple-500" />
                            <h2 className="font-cinzel text-2xl tracking-[0.2em] text-purple-100">MONSTER TITLE OVERRIDE</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-8">
                        {Object.entries(titles).map(([id, t]) => (
                            <div key={id} className="bg-black/40 border border-purple-900/20 p-5 rounded-2xl hover:border-purple-500/40 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-cinzel text-purple-200 tracking-widest">{id}</h4>
                                        <span className="text-[9px] text-purple-500 font-mono">TIER {t.tier} | RARITY 1:{t.rarity}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="editor-field-group">
                                        <label className="text-[8px] text-gray-500">STAT MULT</label>
                                        <input type="number" step="0.1" value={t.statMult} onChange={e => handleUpdate(id, 'statMult', e.target.value)} />
                                    </div>
                                    <div className="editor-field-group">
                                        <label className="text-[8px] text-gray-500">HP MULT</label>
                                        <input type="number" step="0.1" value={t.hpMult || t.statMult} onChange={e => handleUpdate(id, 'hpMult', e.target.value)} />
                                    </div>
                                    <div className="editor-field-group">
                                        <label className="text-[8px] text-gray-500 text-yellow-600">GOLD MULT</label>
                                        <input type="number" step="0.1" value={t.goldMult} onChange={e => handleUpdate(id, 'goldMult', e.target.value)} />
                                    </div>
                                    <div className="editor-field-group">
                                        <label className="text-[8px] text-gray-500 text-cyan-600">XP MULT</label>
                                        <input type="number" step="0.1" value={t.xpMult} onChange={e => handleUpdate(id, 'xpMult', e.target.value)} />
                                    </div>
                                </div>

                                <div className="editor-field-group">
                                    <label className="text-[8px] text-gray-500">SPECIAL EFFECT PROTOCOL</label>
                                    <input className="text-[10px]" value={t.effect || "NONE"} onChange={e => handleUpdate(id, 'effect', e.target.value)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}