import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { 
    Save, Plus, Trash2, Scroll, Target, Clock, 
    Trophy, Sword, Skull, Search, Gem, Sparkles, Coins 
} from 'lucide-react';
import './admin.css';

/**
 * QuestBuilder: Management interface for Appendix G: Master Quest Compendium. [cite: 1497]
 * Handles objective-based streaks, timed bounties, and reward allocation.
 */
export default function QuestBuilder() {
    const { masterData, updateData, deleteData } = useStudioStore(); //
    const quests = masterData.quests || {};
    
    const [selectedId, setSelectedId] = useState(Object.keys(quests)[0] || null);
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (selectedId && quests[selectedId]) {
            setFormData({ ...quests[selectedId] });
        } else {
            setFormData(null);
        }
    }, [selectedId, quests]);

    const handleSave = () => {
        if (!selectedId || !formData) return;
        updateData('quests', selectedId, formData);
        alert('Quest blueprint finalized in the Archive.');
    };

    const handleCreate = () => {
        const id = prompt("Assign Quest ID (e.g., QST-001):")?.toUpperCase();
        if (id) {
            const newQuest = {
                id,
                name: "New Contract",
                objectiveType: "CULL",
                targetId: "",
                targetAmount: 0,
                timeLimitMins: 0,
                rewards: { gold: 0, xp: 0, gemGrade: 0, itemId: "" }
            };
            updateData('quests', id, newQuest);
            setSelectedId(id);
        }
    };

    const handleDelete = () => {
        if (window.confirm(`Expunge quest ${selectedId} from existence?`)) {
            deleteData('quests', selectedId); //
            setSelectedId(Object.keys(quests)[0] || null);
        }
    };

    const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleRewardChange = (field, value) => setFormData(prev => ({
        ...prev,
        rewards: { ...prev.rewards, [field]: value }
    }));

    return (
        <div className="editor-container">
            <div className="editor-sidebar">
                <div className="sidebar-header">
                    <Scroll size={18} className="text-cyan-400" />
                    <span className="sidebar-title">CONTRACT ARCHIVE</span>
                    <button onClick={handleCreate} className="add-button"><Plus size={14} /></button>
                </div>
                <div className="sidebar-list">
                    {Object.values(quests).map(q => (
                        <div 
                            key={q.id}
                            onClick={() => setSelectedId(q.id)}
                            className={`sidebar-item ${selectedId === q.id ? 'active' : ''}`}
                        >
                            <span className="text-[10px] opacity-40 font-mono">{q.id}</span>
                            <span className="truncate">{q.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="editor-main">
                {formData ? (
                    <div className="editor-content">
                        <div className="content-header">
                            <div className="flex flex-col">
                                <h2 className="font-cinzel text-xl text-cyan-100 uppercase tracking-widest">{formData.name}</h2>
                                <span className="text-[10px] text-cyan-600 font-mono">CONDUIT_ID: {formData.id}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleDelete} className="action-button reset"><Trash2 size={14} /></button>
                                <button onClick={handleSave} className="action-button save"><Save size={14} /> Commit Changes</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mt-6">
                            <div className="editor-section">
                                <h3 className="section-title"><Target size={14} /> Mission Parameters</h3>
                                <div className="space-y-4">
                                    <div className="editor-field-group">
                                        <label>Contract Name</label>
                                        <input value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                                    </div>
                                    <div className="editor-field-group">
                                        <label>Objective Type</label>
                                        <select value={formData.objectiveType} onChange={e => handleChange('objectiveType', e.target.value)}>
                                            <option value="CULL">Cull (General Kills)</option>
                                            <option value="HUNT">Hunt (Specific EID)</option>
                                            <option value="ACQUIRE">Acquire (Shadow Drop)</option>
                                            <option value="TIMED_RUN">Timed Execution</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="editor-field-group">
                                            <label>Target ID (ZID:EID)</label>
                                            <input value={formData.targetId} onChange={e => handleChange('targetId', e.target.value)} placeholder="Z01:E01" />
                                        </div>
                                        <div className="editor-field-group">
                                            <label>Quantity</label>
                                            <input type="number" value={formData.targetAmount} onChange={e => handleChange('targetAmount', parseInt(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div className="editor-field-group">
                                        <label><Clock size={10} className="inline mr-1"/> Time Limit (Minutes)</label>
                                        <input type="number" value={formData.timeLimitMins} onChange={e => handleChange('timeLimitMins', parseInt(e.target.value) || 0)} />
                                    </div>
                                </div>
                            </div>

                            <div className="editor-section border-l border-cyan-900/30 pl-8">
                                <h3 className="section-title"><Trophy size={14} className="text-yellow-500" /> Reward Protocols</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="editor-field-group">
                                            <label><Coins size={10} className="inline mr-1 text-yellow-500"/> Gold Yield</label>
                                            <input type="number" value={formData.rewards.gold} onChange={e => handleRewardChange('gold', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div className="editor-field-group">
                                            <label><Sparkles size={10} className="inline mr-1 text-cyan-400"/> Experience Gain</label>
                                            <input type="number" value={formData.rewards.xp} onChange={e => handleRewardChange('xp', parseInt(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div className="editor-field-group">
                                        <label><Gem size={10} className="inline mr-1 text-purple-400"/> Bonus Gem Grade</label>
                                        <select value={formData.rewards.gemGrade} onChange={e => handleRewardChange('gemGrade', parseInt(e.target.value))}>
                                            <option value={0}>None</option>
                                            {[1,2,3,4,5,6,7,8,9].map(g => <option key={g} value={g}>Grade Tier {g}</option>)}
                                        </select>
                                    </div>
                                    <div className="editor-field-group">
                                        <label><Sword size={10} className="inline mr-1"/> Specific Item Reward (ID)</label>
                                        <input value={formData.rewards.itemId} onChange={e => handleRewardChange('itemId', e.target.value)} placeholder="ID from Armory/Accessory" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                        <Scroll size={120} />
                        <p className="font-cinzel text-2xl uppercase tracking-widest mt-4">Archive Offline</p>
                    </div>
                )}
            </div>
        </div>
    );
}