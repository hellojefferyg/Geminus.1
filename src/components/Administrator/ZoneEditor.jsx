import React, { useState } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Plus, Globe, Settings, Map as MapIcon, Percent, Skull, Trash2, ChevronRight, Sword, Shield, Coins, Gem, Ghost, TrendingUp, Sparkles, Layers } from 'lucide-react';import './admin.css';
export default function ZoneEditor() {
    const { masterData, updateData } = useStudioStore();
    const zones = masterData.zones || {};
    const bestiary = masterData.bestiary || {};
    
    const [selectedZid, setSelectedZid] = useState(Object.keys(zones)[0] || null);

    // --- ADD THE NEW DYNAMIC FIELD LOGIC HERE ---
    const [newKey, setNewKey] = useState("");

    const addCustomLogicField = () => {
        if (!newKey || !selectedZid) return;
        // This pushes the new field into the zone object in your master state
        handleZoneChange(newKey.trim(), ""); 
        setNewKey(""); 
    };
    // --------------------------------------------

    const handleCreateZone = () => {
        const id = prompt("Enter Zone ID (e.g. Z01, Z25):")?.toUpperCase();
        // ... rest of your code
        if (id) {
            updateData('zones', id, { 
                zoneName: "New Territory", 
                recommendedLevel: 1,
                dropMultiplier: 1.0,
                description: "A mysterious new land."
            });
            setSelectedZid(id);
        }
    };

    const handleZoneChange = (field, value) => {
        const updatedZone = { ...zones[selectedZid], [field]: value };
        updateData('zones', selectedZid, updatedZone);
    };

    // Filters Bestiary to only show mobs belonging to this ZID
    // Optimized Zonal Filter
const zonalMobs = React.useMemo(() => {
    // 1. Get the current zone's internal ID (e.g., "Z01") and its assigned monsters list
    const currentZone = zones[selectedZid];
    const idToMatch = currentZone?.id; 
    const assignedIds = currentZone?.mobs || [];
    
    // 2. Filter the bestiary with safety guards
    return Object.values(bestiary || {}).filter(mob => {
        if (!mob) return false; // Ignore null/undefined monsters

        // 3. Match by TWO methods to ensure old and new data both show up:
        // Method A: The monster has a hardcoded 'zid' property
        const hasZidMatch = mob.zid === idToMatch;
        
        // Method B: The monster's ID is inside the Zone's 'mobs' array
        const mId = mob.id || mob.monsterId;
        const hasAssignmentMatch = assignedIds.includes(mId);

        return hasZidMatch || hasAssignmentMatch;
    });
}, [bestiary, selectedZid, zones]); // Added zones as a dependency
    const [editingEid, setEditingEid] = useState(null);

    const handleMobChange = (eid, field, value) => {
    const mob = bestiary[eid];
    // Numeric keys for flat data structure
    const numericFields = ['hp', 'damage', 'ac', 'xpValue', 'goldValue', 'level'];
    const val = numericFields.includes(field) ? (parseInt(value) || 0) : value;

    const updatedMob = { ...mob, [field]: val };
    updateData('bestiary', eid, updatedMob); 
};;

    const handleDeleteMob = (eid) => {
        if (window.confirm(`Permanently remove ${eid} from the world and all zones?`)) {
            useStudioStore.getState().deleteBestiaryEntity(eid);
            if (editingEid === eid) setEditingEid(null);
        }
    };
    // Trigger the Cascading Delete
    const handleDeleteZone = () => {
        if (window.confirm(`⚠️ BANISH ZONE: ${selectedZid}?\nThis will permanently delete the zone and all ${zonalMobs.length} monsters inside it.`)) {
            useStudioStore.getState().banishZone(selectedZid);
        }
    };
    const Field = ({ label, value, onChange, type = "text", options = null, icon: Icon }) => (
        <div className="flex flex-col gap-1">
            <label className="text-[9px] text-gray-500 uppercase font-black flex items-center gap-1">
                {Icon && <Icon size={10} />} {label}
            </label>
            {options ? (
                <select value={value} onChange={e => onChange(e.target.value)} className="editor-input py-1">
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input 
                    type={type} 
                    className="editor-input py-1 px-2 text-xs" 
                    value={value || ''} 
                    onChange={e => onChange(e.target.value)} 
                />
            )}
        </div>
    );
    return (
        <div className="flex h-full bg-[#0a1e23]/50 backdrop-blur-md overflow-hidden">
            {/* Sidebar List */}
            <div className="w-64 border-r border-cyan-900/30 flex flex-col bg-black/20">
                <div className="p-4 border-b border-cyan-900/30 flex justify-between items-center bg-cyan-950/20">
                    <span className="font-cinzel text-xs tracking-widest text-cyan-400">Territories</span>
                    <button onClick={handleCreateZone} className="p-1 hover:bg-cyan-400/20 text-cyan-400 rounded transition-all"><Plus size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {Object.values(zones).map(z => (
                        <div 
                            key={z.id} 
                            onClick={() => setSelectedZid(Object.keys(zones).find(key => zones[key].id === z.id))}
                            className={`p-3 text-[11px] cursor-pointer border-b border-white/5 transition-all
                                ${selectedZid === z.id ? 'bg-cyan-500/20 text-white border-l-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <div className="font-bold uppercase tracking-tighter">{z.id}</div>
                            <div className="opacity-60 italic">{z.zoneName}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col min-w-0 bg-black/10">
                {selectedZid && zones[selectedZid] ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {/* Zone Header Config */}
                        {/* GDD APPENDIX C1 MODIFIERS */}
<div className="editor-field-group p-4 bg-black/40 rounded border border-cyan-900/30">
    <h5 className="text-cyan-400 font-cinzel text-[10px] tracking-widest mb-4 uppercase text-center">Let there be Geminus!!!</h5>
    
    {/* Stacks to 1 col on mobile/split, 2 on tablet, 4 on desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Field label="Zone Name" value={zones[selectedZid]?.zoneName || ""} onChange={v => handleZoneChange('zoneName', v)} icon={Globe} />
    <Field label="Min Level" type="number" value={zones[selectedZid]?.minLevel || 0} onChange={v => handleZoneChange('minLevel', v)} icon={TrendingUp} />
    <Field label="Zone Type" value={zones[selectedZid]?.type || "Standard"} onChange={v => handleZoneChange('type', v)} icon={Settings} options={["Standard", "Gold Zone", "Gem Zone", "Shadow Zone"]} />
    <Field label="Gold Multiplier" type="number" value={zones[selectedZid]?.goldMultiplier || 1} onChange={v => handleZoneChange('goldMultiplier', v)} icon={Coins} />

    <Field label="Shadow Rate (1:X)" value={zones[selectedZid]?.shadowDropRate || ""} onChange={v => handleZoneChange('shadowDropRate', v)} icon={Ghost} />
    <Field label="Gem Rate (1:X)" value={zones[selectedZid]?.gemDropRate || ""} onChange={v => handleZoneChange('gemDropRate', v)} icon={Sparkles} />
    
    {/* Nesting the Grade Min/Max in their own sub-grid to keep them paired */}
    <div className="grid grid-cols-2 gap-2">
        <Field label="Grade Min" type="number" value={zones[selectedZid]?.gemGradeMin || 1} onChange={v => handleZoneChange('gemGradeMin', parseInt(v) || 1)} icon={Gem} />
        <Field label="Grade Max" type="number" value={zones[selectedZid]?.gemGradeMax || 1} onChange={v => handleZoneChange('gemGradeMax', parseInt(v) || 1)} icon={Gem} />
    </div>

    {/* ... existing fields for Grade Min, Max, and Weights */}
        <Field label="Grade Weights (%)" value={zones[selectedZid]?.gemGradeWeights || ""} onChange={v => handleZoneChange('gemGradeWeights', v)} icon={Layers} />
    </div> {/* <--- THIS IS THE END OF THE MAIN 4-COLUMN GRID */}

    {/* PASTE THE DYNAMIC LOOP HERE: */}
    {/* This loop catches 'hexStyle', 'ambientFog', etc., automatically */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 border-t border-cyan-900/10 pt-4">
        {Object.keys(zones[selectedZid] || {})
            .filter(key => ![
                'id', 'zoneName', 'minLevel', 'type', 'goldMultiplier', 
                'shadowDropRate', 'gemDropRate', 'gemGradeMin', 'gemGradeMax', 
                'gemGradeWeights', 'dangerRating', 'titleChanceMult'
            ].includes(key))
            .map(key => (
                <Field 
                    key={key} 
                    label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} 
                    value={zones[selectedZid][key]} 
                    onChange={v => handleZoneChange(key, v)} 
                    icon={Settings} 
                />
            ))}
    </div>

    {/* BELOW THIS is where your "Append Logic Field" button should be */}
    <div className="flex items-center gap-2 mt-6 pt-4 border-t border-cyan-900/30">
        <input 
            placeholder="New Logic Key (e.g. requiresKey)"
            className="editor-input flex-1 py-1.5 px-3 text-[10px]"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
        />
        <button onClick={addCustomLogicField} className="...">
            <Plus size={12} className="inline mr-1"/> Append Logic
        </button>
    </div>
</div> {/* <--- THIS CLOSES THE WHOLE "LET THERE BE GEMINUS!!!" SECTION */}

                        {/* INTERACTIVE ZONAL ENTITY MANAGEMENT */}
                        <div className="editor-field-group p-4 bg-black/40 rounded border border-cyan-900/30 shadow-inner">
                            <h5 className="flex items-center gap-2 mb-4 text-orange-500 font-cinzel tracking-widest uppercase">
                                <Skull size={14}/> Zonal Entity Management ({zonalMobs.length})
                            </h5>
                            <div className="space-y-3">
                                
{zonalMobs.map(mob => {
    // ACCORDION FIX: Use 'id' (Z01:01) so uniqueKey is never undefined
    const uniqueKey = mob.id; 

    return (
        <div key={uniqueKey} className={`border rounded transition-all duration-200 ${editingEid === uniqueKey ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'border-cyan-900/30 bg-cyan-950/10'}`}>
            
            {/* Entity Header (Click to Expand) */}
            <div 
                onClick={() => setEditingEid(editingEid === uniqueKey ? null : uniqueKey)}
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-cyan-400/5"
            >
                <div className="flex flex-col">
                    <span className="text-cyan-300 font-bold text-xs uppercase tracking-tight">{mob.name}</span>
                    <span className="text-[9px] text-gray-500 font-mono italic">{uniqueKey}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-[10px] font-mono">
                        {/* STATS FIX: Removed .stats nesting */}
                        <span className="text-red-400">H:{mob.hp}</span>
                        <span className="text-orange-400">D:{mob.damage}</span>
                    </div>
                    <ChevronRight size={14} className={`text-cyan-500 transition-transform duration-200 ${editingEid === uniqueKey ? 'rotate-90' : ''}`} />
                </div>
            </div>

            {/* Expanded Entity Editor Content */}
            {editingEid === uniqueKey && (
                <div className="p-4 border-t border-cyan-900/30 bg-black/40 space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-bold">Entity Name</label>
                            <input className="editor-input" value={mob.name} onChange={e => handleMobChange(uniqueKey, 'name', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-bold text-orange-500/50">ZID:EID (Read-Only)</label>
                            <input className="editor-input opacity-40 cursor-not-allowed" value={mob.id} readOnly />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-black/20 p-3 rounded">
                        <div className="space-y-3">
                            <Field label="Health (HP)" type="number" value={mob.hp} onChange={v => handleMobChange(uniqueKey, 'hp', v)} icon={Skull} />
                            <Field label="Damage (DMG)" type="number" value={mob.damage} onChange={v => handleMobChange(uniqueKey, 'damage', v)} icon={Sword} />
                        </div>
                        <div className="space-y-3">
                            <Field label="Defense (AC)" type="number" value={mob.ac} onChange={v => handleMobChange(uniqueKey, 'ac', v)} icon={Shield} />
                            <Field label="Experience (XP)" type="number" value={mob.xpValue} onChange={v => handleMobChange(uniqueKey, 'xpValue', v)} icon={TrendingUp} />
                        </div>
                        <div className="space-y-3">
                            <Field label="Gold Yield" type="number" value={mob.goldValue} onChange={v => handleMobChange(uniqueKey, 'goldValue', v)} icon={Coins} />
                            <Field label="Level" type="number" value={mob.level} onChange={v => handleMobChange(uniqueKey, 'level', v)} icon={TrendingUp} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
})}
                                {zonalMobs.length === 0 && <div className="text-center p-4 text-gray-600 text-[10px] italic">No entities assigned to this sector.</div>}
                            </div>
                        </div>

                        {/* BANISH ZONE BUTTON */}
                        <div className="flex pt-4 border-t border-red-900/30 justify-end">
                            <button 
                                onClick={handleDeleteZone}
                                className="flex items-center gap-2 px-6 py-2 bg-red-900/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] rounded shadow-lg shadow-red-900/20"
                            >
                                <Trash2 size={12} /> Banish Territory
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 uppercase text-xs tracking-[0.5em] animate-pulse">
                        Select a Zone to Calibrate
                    </div>
                )}
            </div>
        </div>
    );
}