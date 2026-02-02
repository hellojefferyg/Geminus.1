import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { 
    Save, Settings, Calculator, Percent, 
    Coins, TrendingUp, Ghost, Sparkles, Sword, Shield  
} from 'lucide-react';
import './admin.css';

export default function GameConfigEditor() {
    const { masterData } = useStudioStore();
    const constants = masterData.constants || {};
    
    // Local state for the form
    const [formData, setFormData] = useState({});

    // Sync from Store
    useEffect(() => {
        if (constants) {
            setFormData({ ...constants });
        }
    }, [constants]);

    const handleChange = (key, value) => {
        // Auto-detect number types
        const val = !isNaN(value) && value !== '' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = () => {
        useStudioStore.setState(state => ({
            masterData: {
                ...state.masterData,
                constants: formData
            }
        }));
        alert('Magi-Tech World Laws Synchronized!');
    };

    // Helper for structured input rows
    const ConfigRow = ({ label, keyName, type = "text", icon: Icon, description }) => (
        <div className="flex items-center justify-between p-4 bg-[#1a1c23] border border-[rgba(0,255,255,0.1)] rounded hover:border-[rgba(0,255,255,0.3)] transition-all group">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded bg-black/40 ${Icon ? 'text-cyan-500' : 'text-gray-600'}`}>
                    {Icon ? <Icon size={18} /> : <Settings size={18} />}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">{label}</span>
                    <span className="text-[9px] font-mono text-cyan-900 group-hover:text-cyan-600 transition-colors uppercase">{keyName}</span>
                    {description && <p className="text-[10px] text-gray-500 italic mt-1">{description}</p>}
                </div>
            </div>
            <div className="w-1/3">
                <input 
                    type={type} 
                    value={formData[keyName] || ''} 
                    onChange={e => handleChange(keyName, e.target.value)} 
                    className="editor-input text-right font-mono text-cyan-400 bg-black/60 border-cyan-900/50"
                />
            </div>
        </div>
    );

    return (
        <div className="flex h-full w-full bg-[#0c101d] text-[#e0f8ff] font-sans flex-col">
            {/* HEADER */}
            <div className="p-6 border-b border-[rgba(0,255,255,0.2)] flex justify-between items-center bg-[rgba(10,30,35,0.5)] sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Settings size={32} className="text-cyan-400 animate-spin-slow" />
                        <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-500 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="font-cinzel text-2xl text-white tracking-[0.1em]">WORLD LAW TERMINAL</h2>
                        <p className="text-xs text-cyan-600 uppercase tracking-widest font-black opacity-70">Global Constants & Axiom Calibration</p>
                    </div>
                </div>
                <button onClick={handleSave} className="action-button save px-8 py-2.5 text-xs font-black shadow-[0_0_20px_rgba(0,255,0,0.1)] hover:scale-105 active:scale-95 uppercase tracking-tighter">
                    <Save size={18} className="mr-2"/> Commit All Axioms
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-5xl mx-auto space-y-12 pb-20">
                    
                    {/* SECTION: COMBAT & CALCULATIONS */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-yellow-500/20 pb-2">
                            <Sword size={20} className="text-yellow-500" />
                            <h3 className="font-cinzel text-xl text-yellow-500">Combat Mathematics</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <ConfigRow label="HP Base Formula" keyName="VIT_HP_FORMULA" icon={Calculator} description="Formula for calculating Health from Vitality." />
                            <ConfigRow label="Base Hit Chance (%)" keyName="BASE_HIT_CHANCE" type="number" icon={Percent} />
                            <ConfigRow label="Critical Damage Multiplier" keyName="CRIT_DMG_MULT" type="number" icon={TrendingUp} />
                            <ConfigRow label="Dodge Chance Cap" keyName="DODGE_CAP" type="number" icon={Percent} />
                        </div>
                    </section>

                    {/* SECTION: ECONOMY & COMMERCE */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-2">
                            <Coins size={20} className="text-emerald-500" />
                            <h3 className="font-cinzel text-xl text-emerald-500">Socio-Economic Laws</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <ConfigRow label="Sell-Back Rate (%)" keyName="SELL_BACK_RATE" type="number" icon={Percent} description="Percentage of gold returned when selling to NPCs." />
                            <ConfigRow label="Global Gold Scalar" keyName="GLOBAL_GOLD_MULT" type="number" icon={TrendingUp} description="Master multiplier for all currency generation." />
                            <ConfigRow label="Teleportation Fee Scalar" keyName="TP_FEE_MULT" type="number" icon={TrendingUp} />
                            <ConfigRow label="Death Gold Penalty (%)" keyName="DEATH_PENALTY_GOLD" type="number" icon={Percent} />
                        </div>
                    </section>

                    {/* SECTION: DROPS & RARITY */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-purple-500/20 pb-2">
                            <Ghost size={20} className="text-purple-500" />
                            <h3 className="font-cinzel text-xl text-purple-100">Loot & Entity Axioms</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <ConfigRow label="Shadow Drop Baseline" keyName="SHADOW_DROP_BASE" type="number" icon={Ghost} description="The base 1:X chance for Shadow Drops." />
                            <ConfigRow label="Gem Drop Baseline" keyName="GEM_DROP_BASE" type="number" icon={Sparkles} description="The base 1:X chance for Gem drops." />
                            <ConfigRow label="Title Spawn Chance" keyName="TITLE_SPAWN_CHANCE" type="number" icon={Sword} description="Rarity weight for Elite/Boss title generation." />
                        </div>
                    </section>

                    {/* SECTION: PROGRESSION CURVES */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-2">
                            <TrendingUp size={20} className="text-cyan-500" />
                            <h3 className="font-cinzel text-xl text-cyan-400">Progression & Mastery</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {/* GDD-Nov23 SEC. 5 Constants */}
                            <ConfigRow label="Base XP (Lvl 1-2)" keyName="XP_BASE" type="number" icon={Calculator} description="Initial XP required for first level up." />
                            <ConfigRow label="Base AP (Lvl 1)" keyName="AP_BASE" type="number" icon={Calculator} description="Attribute points granted at hero creation." />
                            <ConfigRow label="Base MP Cost" keyName="MP_BASE_COST" type="number" icon={Calculator} description="Foundational cost for Mastery talent unlocks." />
                            
                            <ConfigRow label="AP per Level" keyName="AP_PER_LEVEL" type="number" icon={TrendingUp} />
                            <ConfigRow label="Max Player Level" keyName="MAX_LEVEL" type="number" icon={Settings} />
                            <ConfigRow label="Experience Multiplier" keyName="XP_MULTIPLIER" type="number" icon={TrendingUp} description="Exponential growth factor for level-up requirements." />
                            
                            {/* GDD Formulas */}
                            <ConfigRow label="Mastery Formula" keyName="MP_APTITUDE_FORMULA" icon={Settings} description="Logical axiom governing skill talent costs." />
                            <ConfigRow label="Dodge Logic" keyName="DODGE_CHANCE_FORMULA" icon={Shield} description="Calculates raw evasion before the cap is applied." />
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}