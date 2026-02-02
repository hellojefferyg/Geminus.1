import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Plus, Trash2, Skull, Sword, Shield, Coins, Check } from "lucide-react";import './admin.css';
import { getScaledMobStats } from "../../utils/combatUtils";
// Difficulty Tiers
const TIERS = ["Minion", "Standard", "Elite", "Mini-Boss", "Boss", "God"];
const TIER_COLORS = {
    "Minion": "text-gray-400",
    "Standard": "text-white",
    "Elite": "text-yellow-400",
    "Mini-Boss": "text-orange-400",
    "Boss": "text-red-500",
    "God": "text-purple-500 shadow-purple-500/50 drop-shadow-md"
};

// --- HELPER COMPONENT (MOVED OUTSIDE) ---
// By defining this OUTSIDE the main function, it remains stable, fixing the focus issue.
const Field = ({ label, value, onChange, type = "text", options = null }) => (
    <div className="mb-2 w-full">
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{label}</label>
        {options ? (
            <select value={value} onChange={e => onChange(e.target.value)} className="editor-select">
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        ) : (
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="editor-input" />
        )}
    </div>
);

export default function BestiaryEditor() {
    const { masterData, updateData } = useStudioStore();
    const zones = masterData.zones || {};
    const bestiary = masterData.bestiary || {};
    
    // Links the Bestiary to the active Zone from the global store
    const selectedZid = masterData?.selectedZid || Object.keys(zones)[0] || null;

    const [selectedId, setSelectedId] = useState(Object.keys(bestiary)[0] || null);
    const [formData, setFormData] = useState(null);

    // --- ADD THE ASSIGNMENT LOGIC HERE ---
    const assignToActiveZone = (mobId) => {
        if (!mobId || !selectedZid) return;
        
        // This version handles the case where selectedZid might be null or the zone doesn't exist
const currentZoneMobs = (selectedZid && zones[selectedZid]) ? (zones[selectedZid].mobs || []) : [];

        // Enforce the 11-monster capacity limit per zone
        if (currentZoneMobs.length >= 11 && !currentZoneMobs.includes(mobId)) {
            alert("Zone is at capacity (11/11)!");
            return;
        }

        // Toggle the monster in/out of the zone list
        const newMobList = currentZoneMobs.includes(mobId) 
            ? currentZoneMobs.filter(id => id !== mobId) // Remove if already there
            : [...currentZoneMobs, mobId];              // Add if missing

        updateData('zones', selectedZid, { ...zones[selectedZid], mobs: newMobList });
    };
    useEffect(() => {
    if (selectedId && bestiary[selectedId]) {
        // Ensure name and monsterId are available for display
        setFormData({ 
            ...bestiary[selectedId], 
            name: bestiary[selectedId].name || bestiary[selectedId].monsterName,
            id: selectedId 
        });
    } else {
        setFormData(null);
    }
}, [selectedId, bestiary]);

    // Handlers
const handleChange = (field, value) => {
    // List of keys that must be stored as numbers
    const numericFields = ['hp', 'damage', 'ac', 'xpValue', 'goldValue', 'level'];
    const val = numericFields.includes(field) ? (parseInt(value) || 0) : value;
    
    setFormData(prev => ({ ...prev, [field]: val }));
};

    const handleSave = () => {
        if (!selectedId || !formData) return;
        updateData('bestiary', selectedId, formData);
        alert(`'${formData.name}' saved to Bestiary!`);
    };

    const handleCreate = () => {
    const zoneKeys = Object.keys(zones).sort();
    
    if (zoneKeys.length === 0) {
        alert("Warning: No Zones found. Please sync your maps first!");
        return;
    }

    // 1. Get the Monster Name
    const mobName = prompt("Enter Monster Name (e.g. Echoing Stalker):");
    if (!mobName) return;

    // 2. NEW: Get the EID (Slot ID)
    const eid = prompt("Enter Enemy ID / Slot (e.g. 01, 05, 11):", "01");
    if (!eid) return;

    // 3. Determine the parent Zone
    const targetZid = selectedZid || zoneKeys[0]; 
    
    // 4. Construct the GDD-compliant ZID:EID string
    const finalId = `${targetZid}:${eid}`;

    // Safety: check if this slot is already taken in the bestiary
    if (bestiary[finalId]) {
        if (!confirm(`Slot ${finalId} already exists. Overwrite?`)) return;
    }

    // 5. Save with the FLAT data structure
    const newMob = { 
        id: finalId,
        name: mobName, 
        level: zones[targetZid]?.minLevel || 1,
        tier: parseInt(eid) === 11 ? "Boss" : "Minion",
        type: "Humanoid",
        hp: 50, 
        damage: 5, 
        ac: 10, 
        xpValue: 20, 
        goldValue: 5 
    };

    updateData('bestiary', finalId, newMob);

    // 6. Automatically add it to the Zone's mob list if not already there
    const currentZone = zones[targetZid];
    if (currentZone && !currentZone.mobs?.includes(finalId)) {
        const updatedMobs = [...(currentZone.mobs || []), finalId].sort();
        updateData('zones', targetZid, { ...currentZone, mobs: updatedMobs });
    }

    setSelectedId(finalId);
};

    const handleDelete = () => {
        if (!selectedId) return;
        if (confirm(`Permanently banish '${selectedId}'? This will also remove it from all assigned zones.`)) {
           // Use the dedicated store action for cascading deletion
           useStudioStore.getState().deleteBestiaryEntity(selectedId);
           setSelectedId(null);
        }
    };

    return (
        <div className="flex h-full w-full bg-[#0c101d] text-[#e0f8ff] font-sans">
            
            {/* MAGI-TECH HIERARCHICAL LIST PANEL */}
            <div className="w-1/3 border-r border-[rgba(0,255,255,0.2)] flex flex-col bg-[#0f1525]">
                <div className="p-3 border-b border-cyan-900/50 bg-[#161d31]">
                    <h4 className="text-cyan-400 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold opacity-70">Zone Explorer</h4>
                    <button onClick={handleCreate} className="action-button save w-full justify-center py-1 text-[10px] border-cyan-500/30 hover:bg-cyan-500/20">
                        <Plus size={12} className="mr-1" /> Summon New Entity
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {/* Groups monsters by ZID automatically */}
{/* GROUPS MONSTERS BY ZID:EID PREFIX */}
{Object.entries(
    Object.values(bestiary || {}).reduce((acc, mob) => {
        // Support ZID:EID (Z01:01) or Legacy (MOB_ZONE_NAME)
        const zid = mob.id?.includes(':') ? mob.id.split(':')[0] : (mob.zid || "UNASSIGNED");
        if (!acc[zid]) acc[zid] = [];
        acc[zid].push(mob);
        return acc;
    }, {})
).sort((a, b) => {
    return a[0].localeCompare(b[0], undefined, {numeric: true, sensitivity: 'base'});
}).map(([zid, zoneMobs]) => (
    <details key={zid} open={zid === selectedZid} className="group border-b border-cyan-950/30">
        <summary className="flex items-center justify-between p-3 bg-cyan-950/20 cursor-pointer sticky top-0 z-10 backdrop-blur-sm">
            <span className="text-[10px] font-bold tracking-widest text-cyan-100 uppercase">
                {zones[zid]?.zoneName || zid}
            </span>
            <span className="text-[9px] text-cyan-500/50 font-mono">{zoneMobs.length} UNITS</span>
        </summary>
        
        <div className="bg-black/30 pb-1">
            {zoneMobs.map(mob => {
                const targetId = mob.id; // Direct key use (Z01:01)
                const currentZone = zones[selectedZid] || {};
                
                // Safe check if monster is assigned to the current active zone
                const isAssigned = Array.isArray(currentZone.mobs) && currentZone.mobs.includes(targetId);

                // Quick Stat Display Scaling
                const scaledMob = getScaledMobStats(mob, currentZone, null);

                return (
                    <div 
                        key={targetId} 
                        onClick={() => setSelectedId(targetId)}
                        className={`pl-8 pr-3 py-2 text-[11px] cursor-pointer flex flex-col hover:bg-cyan-500/10 transition-all
                            ${selectedId === targetId ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400' : 'text-gray-500'}`}
                    >
                        <div className="flex justify-between items-center w-full">
                            <div className="flex flex-col truncate">
                                <span className="truncate mr-2 font-bold">{scaledMob.displayName}</span>
                                <span className={`text-[8px] uppercase tracking-tighter ${isAssigned ? 'text-green-400' : 'opacity-40'}`}>
                                    {isAssigned ? '● Assigned' : 'Unassigned'} 
                                </span>
                            </div>
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    assignToActiveZone(targetId);
                                }}
                                className={`p-1.5 rounded border transition-all ${
                                    isAssigned 
                                    ? 'bg-green-500/20 border-green-500 text-green-400' 
                                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black'
                                }`}
                            >
                                {isAssigned ? <Check size={10} /> : <Plus size={10} />}
                            </button>
                        </div>
                        
                        <div className="flex gap-3 text-[9px] mt-1 opacity-60">
                            <span className="text-red-400">H: {scaledMob.hp}</span>
                            <span className="text-orange-400">D: {scaledMob.damage}</span>
                            {currentZone?.dangerRating > 1 && <span className="text-cyan-400 italic">x{currentZone.dangerRating}</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    </details>
))}
                </div>
            </div>

            {/* DETAIL PANEL */}
            <div className="w-2/3 flex flex-col">
                {formData ? (
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 mb-4 border-b border-[rgba(0,255,255,0.2)]">
                            <h3 className={`font-cinzel text-xl ${TIER_COLORS[formData.tier]}`}>{formData.name}</h3>
                            <div className="flex gap-2 text-red-900">
                                <Skull size={24} />
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="space-y-4">
                            
                            {/* Identity */}
                            <div className="editor-field-group">
                                <h5>Classification</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Name" value={formData.name || formData.monsterName} onChange={v => handleChange('name', v)} />
                                    {/* MAGI-TECH DYNAMIC ZONE LINKING */}
                                    <div className="mb-2 w-full">
                                        <label className="block text-xs font-medium text-cyan-500/60 mb-1 uppercase tracking-widest">Assigned Zone</label>
                                        <select 
                                            value={formData.zid} 
                                            onChange={e => {
                                                const newZid = e.target.value;
                                                // Extract the name part (everything after the first underscore)
                                                const namePart = formData.id.split('_').slice(1).join('_');
                                                const newEid = `${newZid}_${namePart}`;
                                                
                                                // 1. Save the mob with the NEW ZID:EID
                                                updateData('bestiary', newEid, { ...formData, zid: newZid });
                                                // 2. Delete the old ZID:EID entry
                                                updateData('bestiary', formData.id, undefined);
                                                // 3. Keep your focus on the mob in its new home
                                                setSelectedId(newEid);
                                            }}
                                            className="editor-select w-full border-cyan-900/40 bg-[#0c101d] text-cyan-200 text-[11px]"
                                        >
                                            {Object.keys(zones).sort().map(zid => (
                                                <option key={zid} value={zid}>{zid} — {zones[zid].zoneName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Field label="Tier / Rank" value={formData.tier} onChange={v => handleChange('tier', v)} options={TIERS} />
                                    <Field label="Level" value={formData.level} onChange={v => handleChange('level', v)} type="number" />
                                    <Field label="Creature Type" value={formData.type || 'Humanoid'} onChange={v => handleChange('type', v)} options={['Humanoid', 'Beast', 'Undead', 'Construct', 'Demon', 'Dragon']} />
                                </div>
                            </div>

                            {/* Combat Stats */}
                            <div className="editor-field-group">
                                <h5>Combat Statistics</h5>
                                <div className="grid grid-cols-3 gap-4">
                                    <Field label="Health (HP)" value={formData.hp} onChange={v => handleChange('hp', v)} type="number" />
                                    <Field label="Armor (AC)" value={formData.ac} onChange={v => handleChange('ac', v)} type="number" />
                                    <Field label="Damage" value={formData.damage} onChange={v => handleChange('damage', v)} type="number" />
                                </div>
                            </div>

                            {/* Rewards */}
                            <div className="editor-field-group">
                                <h5>Rewards & Loot</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Coins size={16} className="text-yellow-500" />
                                        <Field label="Gold Drop" value={formData.goldValue} onChange={v => handleChange('goldValue', v)} type="number" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-400 font-bold text-xs">XP</span>
                                        <Field label="XP Value" value={formData.xpValue} onChange={v => handleChange('xpValue', v)} type="number" />
                                    </div>
                                </div>
                            </div>      

                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-4 mt-6 border-t border-[rgba(0,255,255,0.2)] pt-4">
                            <button onClick={handleDelete} className="action-button reset">
                                <Trash2 size={14} /> Banish
                            </button>
                            <button onClick={handleSave} className="action-button save ml-auto">
                                <Save size={14} /> Update Bestiary
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 p-4 flex items-center justify-center text-[#a8cde0]">
                        Select a monster to analyze.
                    </div>
                )}
            </div>
        </div>
    );
}