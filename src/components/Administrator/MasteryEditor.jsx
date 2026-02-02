import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, GraduationCap, Zap, TrendingUp, Target, Users } from 'lucide-react';
import './admin.css';

export default function MasteryEditor() {
    const { masterData, updateData } = useStudioStore();
    const mastery = masterData.mastery || {};
    const races = masterData.races || {};
    
    const [selectedRaceId, setSelectedRaceId] = useState(Object.keys(races)[0] || null);
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (selectedRaceId && mastery.aptitudes?.[selectedRaceId]) {
            setFormData({ ...mastery.aptitudes[selectedRaceId] });
        }
    }, [selectedRaceId, mastery]);

    const handleSave = () => {
        updateData(`mastery.aptitudes`, selectedRaceId, formData);
        alert(`Aptitude profiles for ${selectedRaceId} synchronized.`);
    };

    const handleConfigChange = (key, val) => {
        updateData('mastery.config', key, parseFloat(val) || 0);
    };

    return (
        <div className="editor-container">
            <div className="editor-sidebar">
                <div className="sidebar-header">
                    <GraduationCap size={18} className="text-emerald-400" />
                    <span className="sidebar-title">MASTERY APTITUDE</span>
                </div>
                <div className="sidebar-list">
                    {Object.keys(races).map(id => (
                        <div key={id} onClick={() => setSelectedRaceId(id)} className={`sidebar-item ${selectedRaceId === id ? 'active' : ''}`}>
                            {id}
                        </div>
                    ))}
                </div>
            </div>

            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header">
                        <h2 className="font-cinzel text-xl text-emerald-100 uppercase tracking-widest">Global Law: The Mastery Curve</h2>
                        <div className="flex gap-4 bg-black/40 p-4 rounded-lg border border-emerald-900/30">
                            <div className="flex items-center gap-2">
                                <label className="text-[9px] text-emerald-600 font-bold uppercase">Base XP</label>
                                <input type="number" className="w-20 bg-transparent text-emerald-400 font-mono" value={mastery.config?.xpBase} onChange={e => handleConfigChange('xpBase', e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2 border-l border-emerald-900/30 pl-4">
                                <label className="text-[9px] text-emerald-600 font-bold uppercase">Mult</label>
                                <input type="number" step="0.01" className="w-16 bg-transparent text-emerald-400 font-mono" value={mastery.config?.xpMultiplier} onChange={e => handleConfigChange('xpMultiplier', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {formData && (
                        <div className="grid grid-cols-2 gap-8 mt-8">
                            <div className="editor-section">
                                <h3 className="section-title"><Target size={14} /> {selectedRaceId} Aptitude Weights (MP)</h3>
                                <p className="text-[10px] text-gray-500 mb-4 italic">Lower value = Higher talent (MP cost per level).</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(formData).map(([skill, cost]) => (
                                        <div key={skill} className="editor-field-group">
                                            <label className="uppercase text-emerald-500 font-mono">{skill}</label>
                                            <input type="number" value={cost} onChange={e => setFormData({...formData, [skill]: parseInt(e.target.value) || 0})} />
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleSave} className="action-button save w-full mt-6"><Save size={14} /> Update Aptitude</button>
                            </div>

                            <div className="editor-section border-l border-emerald-900/30 pl-8">
                                <h3 className="section-title"><TrendingUp size={14} /> Level Benefit Scaling</h3>
                                <div className="space-y-4">
                                    {Object.entries(mastery.benefits || {}).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center bg-[#1a1c23] p-3 rounded border border-emerald-900/10">
                                            <span className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className="text-emerald-400 font-mono text-sm">+{val * 100}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}