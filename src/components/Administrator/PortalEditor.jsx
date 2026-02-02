import React, { useState } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, MapPin, Zap, Layers, Cpu, Sparkles, TrendingUp } from 'lucide-react';
import './admin.css';

export default function PortalEditor() {
    const { masterData, updateData } = useStudioStore();
    const portalConfig = masterData.portal || { 
        aetheriumPerks: {}, 
        config: { baseShardDropRate: 0.01, shardValue: 100 } 
    };

    const handlePerkUpdate = (id, field, val) => {
        const perk = { ...portalConfig.aetheriumPerks[id], [field]: val };
        updateData('portal.aetheriumPerks', id, perk);
    };

    return (
        <div className="editor-container no-sidebar">
            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header border-b border-indigo-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <MapPin size={24} className="text-indigo-400" />
                            <h2 className="font-cinzel text-2xl tracking-[0.2em] text-indigo-100">AETHERIUM HUB CONTROL</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mt-8">
                        {/* LEFT: NETWORK CONFIG */}
                        <div className="space-y-8">
                            <section className="editor-section">
                                <h3 className="section-title text-indigo-400"><Cpu size={14}/> Core Signal Parameters</h3>
                                <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg">
                                    <div className="editor-field-group">
                                        <label>Shard Drop Rate</label>
                                        <input type="number" step="0.001" value={portalConfig.config?.baseShardDropRate} 
                                            onChange={e => updateData('portal.config', 'baseShardDropRate', parseFloat(e.target.value))} />
                                    </div>
                                    <div className="editor-field-group">
                                        <label>Shard Aurum Value</label>
                                        <input type="number" value={portalConfig.config?.shardValue} 
                                            onChange={e => updateData('portal.config', 'shardValue', parseInt(e.target.value))} />
                                    </div>
                                </div>
                            </section>

                            <section className="editor-section">
                                <h3 className="section-title text-cyan-400"><Sparkles size={14}/> Aetherium Perks</h3>
                                <div className="space-y-4">
                                    {Object.entries(portalConfig.aetheriumPerks).map(([id, perk]) => (
                                        <div key={id} className="bg-[#1a1c23] p-4 rounded border border-indigo-900/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-indigo-200">{perk.name}</span>
                                                <span className="text-[9px] text-indigo-500 font-mono">MAX RANK: {perk.maxRank}</span>
                                            </div>
                                            <div className="editor-field-group">
                                                <label className="text-[8px]">Perk Description</label>
                                                <input className="text-[10px]" value={perk.description} 
                                                    onChange={e => handlePerkUpdate(id, 'description', e.target.value)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: ZONE ACCESS LOGIC */}
                        <div className="editor-section">
                            <h3 className="section-title text-purple-400"><Layers size={14}/> Teleport Manifest</h3>
                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                {Object.values(masterData.zones || {}).map(zone => (
                                    <div key={zone.id} className="flex items-center justify-between p-3 border-b border-white/5 hover:bg-white/5 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-indigo-100">{zone.zoneName}</span>
                                            <span className="text-[9px] text-gray-500 font-mono">REQ LVL: {zone.minLevel}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <label className="text-[8px] block text-gray-600 uppercase">TP Fee</label>
                                                <span className="text-[10px] text-yellow-500 font-mono">{zone.minLevel * 100}G</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}