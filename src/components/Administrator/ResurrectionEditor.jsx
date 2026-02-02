import React from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, HeartPulse, Skull, ShieldAlert, Coins, MessageSquare } from 'lucide-react';
import './admin.css';

export default function ResurrectionEditor() {
    const { masterData, updateData } = useStudioStore();
    const sanctuary = masterData.sanctuary || {
        pve: { costMult: 50, goldPenalty: 0.10 },
        pvp: { costMult: 100, goldPenalty: 0.15 },
        messages: ["The light returns...", "The Abyss releases its grip."]
    };

    const handleUpdate = (path, val) => {
        const [mode, field] = path.split('.');
        updateData('sanctuary', mode, { ...sanctuary[mode], [field]: parseFloat(val) || 0 });
    };

    return (
        <div className="editor-container no-sidebar">
            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header border-b border-sky-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <HeartPulse size={24} className="text-sky-400" />
                            <h2 className="font-cinzel text-2xl tracking-[0.2em] text-sky-100">SANCTUARY PROTOCOLS</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mt-8">
                        {/* PVE DEATH LOGIC */}
                        <div className="editor-section">
                            <h3 className="section-title text-sky-400 flex items-center gap-2"><Skull size={14}/> PvE Death Penalty</h3>
                            <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-sky-900/20">
                                <div className="editor-field-group">
                                    <label>Revival Cost (Lvl * X Gold)</label>
                                    <input type="number" value={sanctuary.pve.costMult} onChange={e => handleUpdate('pve.costMult', e.target.value)} />
                                </div>
                                <div className="editor-field-group">
                                    <label>Gold Loss Ratio (0.10 = 10%)</label>
                                    <input type="number" step="0.01" value={sanctuary.pve.goldPenalty} onChange={e => handleUpdate('pve.goldPenalty', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* PVP DEATH LOGIC */}
                        <div className="editor-section">
                            <h3 className="section-title text-red-400 flex items-center gap-2"><ShieldAlert size={14}/> PvP Death Penalty</h3>
                            <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-red-900/20">
                                <div className="editor-field-group">
                                    <label>Revival Cost (Lvl * X Gold)</label>
                                    <input type="number" value={sanctuary.pvp.costMult} onChange={e => handleUpdate('pvp.costMult', e.target.value)} />
                                </div>
                                <div className="editor-field-group">
                                    <label>Gold Loss Ratio (0.15 = 15%)</label>
                                    <input type="number" step="0.01" value={sanctuary.pvp.goldPenalty} onChange={e => handleUpdate('pvp.goldPenalty', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STATUS MESSAGES */}
                    <div className="mt-8 editor-section">
                        <h3 className="section-title text-emerald-400"><MessageSquare size={14}/> Recovery Communiques</h3>
                        <div className="space-y-2">
                            {sanctuary.messages.map((msg, idx) => (
                                <input key={idx} className="w-full bg-[#1a1c23] p-3 text-xs text-sky-200 border border-sky-900/10 rounded" 
                                    value={msg} onChange={e => {
                                        const newMsgs = [...sanctuary.messages];
                                        newMsgs[idx] = e.target.value;
                                        updateData('sanctuary', 'messages', newMsgs);
                                    }} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}