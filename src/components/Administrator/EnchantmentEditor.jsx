import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Sparkles, Zap, Shield, Sword, Heart, Activity } from 'lucide-react';
import './admin.css';

export default function EnchantmentEditor() {
    const { masterData, updateData } = useStudioStore();
    const enchantments = masterData.enchantments || {};
    
    const [activeCategory, setActiveCategory] = useState('caster');
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const catKeys = Object.keys(enchantments[activeCategory] || {});
        setSelectedId(catKeys[0] || null);
    }, [activeCategory, enchantments]);

    useEffect(() => {
        if (selectedId && enchantments[activeCategory]?.[selectedId]) {
            setFormData({ ...enchantments[activeCategory][selectedId] });
        } else {
            setFormData(null);
        }
    }, [selectedId, activeCategory, enchantments]);

    const handleSave = () => {
        if (!selectedId || !formData) return;
        updateData(`enchantments.${activeCategory}`, selectedId, formData);
        alert(`${formData.name} calibration updated.`);
    };

    const handleTierChange = (index, value) => {
        const newTiers = [...formData.tiers];
        newTiers[index] = parseFloat(value) || 0;
        setFormData({ ...formData, tiers: newTiers });
    };

    const CategoryBtn = ({ id, label, icon: Icon }) => (
        <button 
            onClick={() => setActiveCategory(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all border ${
                activeCategory === id ? 'bg-cyan-600 border-cyan-400 text-black' : 'bg-black/40 border-cyan-900/30 text-cyan-700 hover:text-cyan-300'
            }`}
        >
            <Icon size={12} /> {label}
        </button>
    );

    return (
        <div className="editor-container">
            <div className="editor-sidebar">
                <div className="sidebar-header">
                    <Sparkles size={18} className="text-purple-400" />
                    <span className="sidebar-title">ENCHANTMENT FORGE</span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                    <CategoryBtn id="caster" label="Caster" icon={Zap} />
                    <CategoryBtn id="fighter" label="Fighter" icon={Sword} />
                    <CategoryBtn id="support" label="Support" icon={Shield} />
                </div>
                <div className="sidebar-list mt-2">
                    {Object.values(enchantments[activeCategory] || {}).map(e => (
                        <div 
                            key={e.id}
                            onClick={() => setSelectedId(e.id)}
                            className={`sidebar-item ${selectedId === e.id ? 'active' : ''}`}
                        >
                            {e.name}
                        </div>
                    ))}
                </div>
            </div>

            <div className="editor-main">
                {formData ? (
                    <div className="editor-content">
                        <div className="content-header">
                            <h2 className="font-cinzel text-xl text-purple-100 uppercase tracking-widest">{formData.name}</h2>
                            <button onClick={handleSave} className="action-button save"><Save size={14} /> Update Calibration</button>
                        </div>

                        <div className="editor-section mt-6">
                            <h3 className="section-title">Tier IX Percentage Progression [cite: 1476]</h3>
                            <div className="grid grid-cols-3 gap-4 bg-black/40 p-6 rounded-xl border border-purple-900/20">
                                {formData.tiers ? formData.tiers.map((val, idx) => (
                                    <div key={idx} className="editor-field-group">
                                        <label className="text-purple-500 font-mono text-[9px]">TIER {idx + 1}</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={val} 
                                            onChange={(e) => handleTierChange(idx, e.target.value)} 
                                            className="font-mono text-cyan-400"
                                        />
                                    </div>
                                )) : (
                                    <p className="col-span-3 text-[10px] text-gray-500 italic">This enchantment uses dynamic min/max scaling logic.</p>
                                )}
                            </div>
                        </div>

                        {/* RANGED LOGIC FIELDS */}
                        {(formData.sc_min !== undefined || formData.wc_min !== undefined) && (
                            <div className="grid grid-cols-2 gap-8 mt-8">
                                <div className="editor-section">
                                    <h3 className="section-title"><Activity size={14}/> Dynamic Scaling (Min/Max)</h3>
                                    <div className="space-y-4">
                                        {formData.sc_min !== undefined && <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="editor-field-group"><label>SC Min %</label><input type="number" step="0.01" value={formData.sc_min} onChange={e => setFormData({...formData, sc_min: parseFloat(e.target.value)})}/></div>
                                                <div className="editor-field-group"><label>SC Max %</label><input type="number" step="0.01" value={formData.sc_max} onChange={e => setFormData({...formData, sc_max: parseFloat(e.target.value)})}/></div>
                                            </div>
                                        </>}
                                        {formData.vit_min !== undefined && <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="editor-field-group"><label>VIT Min %</label><input type="number" step="0.01" value={formData.vit_min} onChange={e => setFormData({...formData, vit_min: parseFloat(e.target.value)})}/></div>
                                                <div className="editor-field-group"><label>VIT Max %</label><input type="number" step="0.01" value={formData.vit_max} onChange={e => setFormData({...formData, vit_max: parseFloat(e.target.value)})}/></div>
                                            </div>
                                        </>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                        <Sparkles size={120} />
                    </div>
                )}
            </div>
        </div>
    );
}