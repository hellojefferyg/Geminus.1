import React from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Scale, Sun, Moon, Sparkles, ChevronRight } from 'lucide-react';
import './admin.css';

export default function AlignmentEditor() {
    const { masterData, updateData } = useStudioStore();
    const alignment = masterData.alignment || {};

    const handleTierChange = (index, field, value) => {
        const newTiers = [...alignment.tiers];
        newTiers[index] = { ...newTiers[index], [field]: isNaN(value) ? value : parseFloat(value) };
        updateData('alignment', 'tiers', newTiers);
    };

    return (
        <div className="editor-container no-sidebar">
            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header border-b border-orange-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <Scale size={24} className="text-orange-500" />
                            <h2 className="font-cinzel text-2xl tracking-[0.2em] text-orange-100">MORALITY CONDUIT</h2>
                        </div>
                        <div className="flex gap-4 items-center">
                            <label className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">Global Spawn Chance</label>
                            <input type="number" step="0.0001" className="bg-black/40 border border-orange-900/30 px-3 py-1 rounded text-orange-400 font-mono text-xs w-24" 
                                value={alignment.config?.spawnChance} 
                                onChange={e => updateData('alignment.config', 'spawnChance', parseFloat(e.target.value))} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-8">
                        <div className="flex text-[10px] font-black text-orange-900 uppercase tracking-widest px-4">
                            <div className="w-24">Threshold</div>
                            <div className="w-32">Benevolent</div>
                            <div className="w-32">Malevolent</div>
                            <div className="w-32">Visual Glow</div>
                            <div className="w-24">QM Bonus</div>
                        </div>
                        {alignment.tiers?.map((tier, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-black/20 p-4 border border-orange-900/10 rounded-xl hover:border-orange-500/30 transition-all">
                                <input className="w-24 text-xs font-mono text-orange-200" value={tier.threshold} onChange={e => handleTierChange(idx, 'threshold', e.target.value)} />
                                <div className="flex items-center gap-2 w-32">
                                    <Sun size={12} className="text-yellow-500" />
                                    <input className="text-xs bg-transparent" value={tier.beneTitle} onChange={e => handleTierChange(idx, 'beneTitle', e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 w-32">
                                    <Moon size={12} className="text-purple-500" />
                                    <input className="text-xs bg-transparent" value={tier.maleTitle} onChange={e => handleTierChange(idx, 'maleTitle', e.target.value)} />
                                </div>
                                <select className="w-32 text-[10px] bg-black/40 text-gray-400" value={tier.glow} onChange={e => handleTierChange(idx, 'glow', e.target.value)}>
                                    <option>Faint</option><option>Light</option><option>Bright</option><option>Vivid</option><option>Glowing</option><option>Radiant</option><option>Pulsing</option>
                                </select>
                                <input className="w-24 text-xs text-cyan-400 font-mono" value={tier.qmBonus} onChange={e => handleTierChange(idx, 'qmBonus', e.target.value)} />
                            </div>
                        ))}
                    </div>

                    {/* CAPSTONE LOGIC SUMMARY */}
                    <div className="mt-12 p-8 bg-orange-900/5 border border-orange-900/20 rounded-2xl flex justify-between items-center">
                        <div className="max-w-md">
                            <h4 className="font-cinzel text-orange-400 flex items-center gap-2"><Sparkles size={16}/> Path of Perfection vs. Power</h4>
                            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                                At ±25,000 alignment, these capstones inject a final 10% multiplier into the core loot or combat formulas. 
                                Edits to these specific IDs must be done via the Raw Terminal.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {['PATH-FORTUNE', 'PATH-PERFECTION'].map(id => (
                                <div key={id} className="px-4 py-2 bg-black/40 border border-orange-900/30 text-[10px] text-orange-200 font-mono rounded">
                                    {id}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}