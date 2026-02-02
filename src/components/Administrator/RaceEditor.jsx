import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Plus, Trash2 } from 'lucide-react';
import './admin.css'; // Inject the styles

export default function RaceEditor() {
    const { masterData, updateData } = useStudioStore();
    const races = masterData.races || {};
    
    const [selectedId, setSelectedId] = useState(Object.keys(races)[0] || null);
    const [formData, setFormData] = useState(null);

useEffect(() => {
        if (selectedId && races[selectedId]) {
            const race = races[selectedId];
            setFormData({
                ...race,
                // Maps to the new GDD-compliant nested objects
                apWeights: race.apWeights || { STR: 0, DEX: 0, VIT: 0, NTL: 0, WIS: 0 },
                masteryAptitudes: race.masteryAptitudes || {},
                passive: race.passive || { name: "", effect: "", sourceStat: "" }
            });
        } else {
            setFormData(null);
        }
    }, [selectedId, races]);

    const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleStatChange = (stat, value) => {
        const upperStat = stat.toUpperCase(); // Matches GDD formatting for STR, DEX, etc.
        setFormData(prev => ({ 
            ...prev, 
            apWeights: {
                ...prev.apWeights,
                [upperStat]: parseInt(value) || 0 
            }
        }));
    };

    const handleSave = () => {
        if (!selectedId || !formData) return;
        updateData('races', selectedId, formData);
        alert(`'${selectedId}' saved!`); // Kept your toast style alert
    };

    const handleCreate = () => {
        const id = prompt("Enter a unique key for the new item:"); // Matches handleAddNewItem prompt
        if (id) {
            const cleanId = id.trim().replace(/\s+/g, '_').toLowerCase();
            updateData('races', cleanId, { 
                raceName: "New Race", 
                archetype: "True Fighter", 
                primaryStat: "STR",
                statWeights: { str: 10, dex: 10, vit: 10, ntl: 10, wis: 10 },
                masteryAptitudes: {}
            });
            setSelectedId(cleanId);
        }
    };

    const handleDelete = () => {
        if(confirm(`Delete '${selectedId}' permanently?`)) {
           updateData('races', selectedId, undefined); // Deletes key in Zustand
           setSelectedId(null);
        }
    };

    // Helper for input fields to match your 'createField' logic
    const Field = ({ label, value, onChange, type = "text", options = null }) => (
        <div className="mb-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            {options ? (
                <select 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="editor-select"
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input 
                    type={type} 
                    value={value || ''} 
                    onChange={e => onChange(e.target.value)} 
                    className="editor-input"
                />
            )}
        </div>
    );

    return (
        <div className="flex h-full w-full bg-[#0c101d] text-[#e0f8ff] font-sans">
            
            {/* LIST PANEL (Matches renderListDetailView left panel) */}
            <div className="w-1/3 border-r border-[rgba(0,255,255,0.2)] flex flex-col">
                <div className="p-2 border-b border-[rgba(0,255,255,0.2)]">
                    <button onClick={handleCreate} className="action-button save w-full justify-center">
                        <Plus size={14} /> Add New Race
                    </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {Object.keys(races).map(key => (
                        <div 
                            key={key} 
                            onClick={() => setSelectedId(key)}
                            className={`list-item ${selectedId === key ? 'active' : ''}`}
                        >
                            <span>{races[key].raceName || key}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* DETAIL PANEL (Matches renderListDetailView right panel) */}
            <div className="w-2/3 flex flex-col">
                {formData ? (
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 mb-4 border-b border-[rgba(0,255,255,0.2)]">
                            <h3 className="font-cinzel text-xl text-cyan-400">Editing: {formData.raceName}</h3>
                        </div>

                        {/* Form Body (Matches renderRaceDetailForm structure exactly) */}
                        <div className="space-y-4">
                            
                            {/* Core Identity Group */}
                            <div className="editor-field-group">
                                <h5>Core Identity</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <Field label="Race Name" value={formData.raceName} onChange={v => handleChange('raceName', v)} />
                                    <Field label="Archetype" value={formData.archetype} onChange={v => handleChange('archetype', v)} options={["True Fighter", "True Caster", "Hybrid"]} />
                                    <Field label="Sub-Archetype" value={formData.subArchetype} onChange={v => handleChange('subArchetype', v)} options={["N/A", "Martial", "Mystic"]} />
                                    <Field label="Specialist Title" value={formData.specialistTitle} onChange={v => handleChange('specialistTitle', v)} />
                                    <Field label="Combat Identity" value={formData.coreCombatIdentity} onChange={v => handleChange('coreCombatIdentity', v)} />
                                    <Field label="Primary Stat" value={formData.primaryStat} onChange={v => handleChange('primaryStat', v)} options={["DEX", "STR", "VIT", "INT", "WIS"]} />
                                </div>
                            </div>

                            {/* Stat Weights Group */}
                            <div className="editor-field-group">
                                <h5>Stat Weights</h5>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {['str', 'dex', 'vit', 'ntl', 'wis'].map(stat => (
                                        <Field 
                                            key={stat} 
                                            label={stat.toUpperCase()} 
                                            value={formData.apWeights[stat.toUpperCase()] || 0}
                                            onChange={v => handleStatChange(stat, v)} 
                                            type="number" 
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Functional Passive Editor */}
                            <div className="editor-field-group">
                                <h5>Passive Mechanics (Level 101+)</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Field label="Passive Name" value={formData.passive.name} onChange={v => handleChange('passive', { ...formData.passive, name: v })} />
                                    <Field label="Target Effect" value={formData.passive.effect} onChange={v => handleChange('passive', { ...formData.passive, effect: v })} />
                                    <Field label="Source Stat" value={formData.passive.sourceStat} onChange={v => handleChange('passive', { ...formData.passive, sourceStat: v })} options={["STR", "DEX", "VIT", "NTL", "WIS"]} />
                                </div>
                            </div>

                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center gap-4 mt-6 border-t border-[rgba(0,255,255,0.2)] pt-4">
                            <button onClick={handleDelete} className="action-button reset">
                                <Trash2 size={14} /> Delete Item
                            </button>
                            <button onClick={handleSave} className="action-button save ml-auto">
                                <Save size={14} /> Save Changes
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 p-4 flex items-center justify-center text-[#a8cde0]">
                        Select an item.
                    </div>
                )}
            </div>
        </div>
    );
}