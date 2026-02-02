import React from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Gem, Zap, Layers, Scissors, TrendingUp } from 'lucide-react';
import './admin.css';

export default function GemcutterEditor() {
    const { masterData, updateData } = useStudioStore();
    const gemsConfig = masterData.gems?.config || { 
        fuseRequirement: 3, 
        baseFuseCost: 25000,
        xpPerGrade: 15 
    };

    const handleConfigChange = (key, val) => {
        updateData('gems.config', key, parseFloat(val) || 0);
    };

    return (
        <div className="editor-container no-sidebar">
            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header border-b border-orange-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <Scissors size={24} className="text-orange-500" />
                            <h2 className="font-cinzel text-2xl tracking-[0.2em] text-orange-100">GEMCUTTER'S WORKSHOP</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mt-8">
                        <section className="editor-section">
                            <h3 className="section-title text-orange-400"><Layers size={14}/> Fusion Protocols</h3>
                            <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-orange-900/20">
                                <div className="editor-field-group">
                                    <label>Gems Required for Fusion</label>
                                    <input type="number" value={gemsConfig.fuseRequirement} onChange={e => handleConfigChange('fuseRequirement', e.target.value)} />
                                    <p className="text-[9px] text-gray-500 mt-1 italic">Sets the 'FUSE_REQUIREMENT' constant used in GEMCUTTER_UI.html.</p>
                                </div>
                                <div className="editor-field-group">
                                    <label>Base Gold Cost</label>
                                    <input type="number" value={gemsConfig.baseFuseCost} onChange={e => handleConfigChange('baseFuseCost', e.target.value)} />
                                </div>
                            </div>
                        </section>

                        <section className="editor-section">
                            <h3 className="section-title text-cyan-400"><TrendingUp size={14}/> Artisan Progression</h3>
                            <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-cyan-900/20">
                                <div className="editor-field-group">
                                    <label>XP Yield per Grade Tier</label>
                                    <input type="number" value={gemsConfig.xpPerGrade} onChange={e => handleConfigChange('xpPerGrade', e.target.value)} />
                                </div>
                                <div className="p-4 bg-cyan-900/10 border border-cyan-900/30 rounded text-[10px] text-cyan-500 leading-relaxed font-mono">
                                    LOGIC: XP_Gained = Grade * xpPerGrade. Higher grade fusions provide exponentially more Artisan Mastery.
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}