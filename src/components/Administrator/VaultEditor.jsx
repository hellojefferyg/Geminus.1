import React, { useState } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Landmark, TrendingUp, AlertTriangle, ShieldCheck, Coins, Briefcase } from 'lucide-react';
import './admin.css';

export default function VaultEditor() {
    const { masterData, updateData } = useStudioStore();
    const vault = masterData.vault || {};

    const handleConfigChange = (key, val) => {
        updateData('vault.config', key, parseFloat(val) || 0);
    };

    const handleVentureChange = (id, field, val) => {
        const venture = { ...vault.ventures[id], [field]: isNaN(val) ? val : parseFloat(val) };
        updateData('vault.ventures', id, venture);
    };

    return (
        <div className="editor-container no-sidebar">
            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header border-b border-yellow-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <Landmark size={24} className="text-yellow-500" />
                            <h2 className="font-cinzel text-2xl tracking-[0.2em] text-yellow-100">GRAND VAULT CALIBRATOR</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mt-8">
                        {/* LEFT: FINANCIAL POLICY */}
                        <div className="space-y-8">
                            <section className="editor-section">
                                <h3 className="section-title text-yellow-400"><ShieldCheck size={14}/> Merchant's Writ Policy</h3>
                                <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg">
                                    <div className="editor-field-group">
                                        <label>Unlock Level</label>
                                        <input type="number" value={vault.config?.merchantsWritUnlockLevel} onChange={e => handleConfigChange('merchantsWritUnlockLevel', e.target.value)} />
                                    </div>
                                    <div className="editor-field-group">
                                        <label>Debt Tithe Rate (%)</label>
                                        <input type="number" step="0.01" value={vault.config?.debtTitheRate} onChange={e => handleConfigChange('debtTitheRate', e.target.value)} />
                                    </div>
                                </div>
                            </section>

                            <section className="editor-section">
                                <h3 className="section-title text-orange-400"><TrendingUp size={14}/> Credit Limit Scaling</h3>
                                <div className="space-y-2">
                                    {Object.entries(vault.creditLimits || {}).map(([lvl, data]) => (
                                        <div key={lvl} className="flex justify-between items-center bg-[#1a1c23] p-3 rounded border border-yellow-900/10">
                                            <span className="text-xs text-gray-500 font-mono">{lvl}</span>
                                            <div className="flex items-center gap-2">
                                                <Coins size={10} className="text-yellow-600"/>
                                                <input type="number" className="w-24 bg-transparent text-right text-yellow-200 font-mono" 
                                                    value={data.maxBorrow} onChange={e => {
                                                        const newLimits = { ...vault.creditLimits };
                                                        newLimits[lvl].maxBorrow = parseInt(e.target.value);
                                                        updateData('vault', 'creditLimits', newLimits);
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: VENTURE CHARTERS */}
                        <div className="editor-section">
                            <h3 className="section-title text-cyan-400"><Briefcase size={14}/> Venture ROI Parameters</h3>
                            <div className="space-y-6">
                                {Object.values(vault.ventures || {}).map(v => (
                                    <div key={v.id} className="bg-black/40 border border-cyan-900/20 p-6 rounded-2xl">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-cinzel text-cyan-100">{v.name}</h4>
                                            <span className={`text-[9px] px-2 py-1 rounded font-bold ${v.risk === 'High' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>{v.risk.toUpperCase()} RISK</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="editor-field-group"><label>Duration (Hrs)</label><input type="number" value={v.durationHours} onChange={e => handleVentureChange(v.id, 'durationHours', e.target.value)} /></div>
                                            <div className="editor-field-group"><label>Base Cost</label><input type="number" value={v.baseCost} onChange={e => handleVentureChange(v.id, 'baseCost', e.target.value)} /></div>
                                            <div className="editor-field-group"><label>ROI Min (x)</label><input type="number" step="0.01" value={v.roiMin} onChange={e => handleVentureChange(v.id, 'roiMin', e.target.value)} /></div>
                                            <div className="editor-field-group"><label>ROI Max (x)</label><input type="number" step="0.01" value={v.roiMax} onChange={e => handleVentureChange(v.id, 'roiMax', e.target.value)} /></div>
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