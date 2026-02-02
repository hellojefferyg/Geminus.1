import { create } from 'zustand';
import { GDD_INITIAL_DATA } from '../data/gdd_seed'; 
import { armoryData } from '../data/armoryData'; // <--- IMPORT YOUR DATA FILE
import { zonesData } from '../data/zonesData';
import { bestiaryData } from '../data/bestiaryData';
import { monsterTitles } from '../data/monsterTitles'; 

// --- INITIAL DATA SCHEMA ---
const INITIAL_DATA = {
    // 1. PLAYER STATE
    player: {
        name: "Traveler",
        class: "Vanguard",
        level: 1,
        hp: 100,
        maxHp: 100,
        xp: 0,
        gold: 0,
        inventory: []
    },

    // 2. GLOBAL CONSTANTS
    constants: {
        qualityMin: 0.75, 
        qualityMax: 1.5,
        baseShadowRate: 0.05,
        baseEchoRate: 0.01,
        shadowCurrentTierWeight: 0.70,
        echoMaxTierOffset: -1,
        sellBackRate: 0.50,
        enchantSuccessBase: 0.65,
        essenceYieldRate: 1.0,
        globalGoldMultiplier: 1.0,
        difficultyScalingFactor: 1.15,
        VIT_HP_FORMULA: "(100 + (VIT * 10))",
        BASE_HIT_CHANCE: 90,
        AP_PER_LEVEL: 40
    },

    selectedZid: "Z01", 

    // 4. GDD LIBRARIES (Auto-filled from seed files)
    dropTables: GDD_INITIAL_DATA.dropTables || {},
    armory: armoryData || {}, // <--- USE THE IMPORTED ARMORY DATA
    arcanum: GDD_INITIAL_DATA.arcanum || {},
    jewelry: GDD_INITIAL_DATA.jewelry || {},
    
    // 5. WORLD & AUX DATA
    races: GDD_INITIAL_DATA.races || {}, 
    gems: GDD_INITIAL_DATA.gems || { base_gems: {} },
    bestiary: GDD_INITIAL_DATA.bestiary || {},
    zones: Array.isArray(zonesData) 
    ? zonesData.reduce((acc, z) => ({ ...acc, [z.id]: z }), {}) 
    : (GDD_INITIAL_DATA.zones || {}),
    
    // 6. COMBAT ENGINE DATA
    monsterTitles: GDD_INITIAL_DATA.monsterTitles || {},
    monsterTraits: GDD_INITIAL_DATA.monsterTraits || {}
};

export const useStudioStore = create((set, get) => ({
    // --- STATE ---
viewMode: 'visualizer', 
    adminSelectedZid: null, // Track which zone we are managing in God Tools
    adminSelectedEid: null, // Track which mob we are tweaking
    masterData: INITIAL_DATA,
    // BRIDGE: Call this when a single map is loaded in the Editor
    registerZoneFromMap: (zoneData) => set((state) => {
        const zid = zoneData.id || zoneData.zoneId;
        return {
            masterData: {
                ...state.masterData,
                zones: {
                    ...state.masterData.zones,
                    [zid]: zoneData 
                }
            }
        };
    }),

    // SYNC BRIDGE: Registers zones from bulk ZIP/JSON imports for Dev Tools
    // SYNC BRIDGE: Registers zones with full GDD Appendix C1 modifiers
    syncImportedZones: (zoneList) => set((state) => {
        const newZones = { ...state.masterData.zones };
        zoneList.forEach(z => {
            if (!newZones[z.id]) {
                newZones[z.id] = { 
                    id: z.id, 
                    zoneName: z.name || z.id,
                    minLevel: 1,
                    type: "Standard",
                    shadowDropRate: 600, // 1 in 600
                    gemGrade: 1,
                    gemDropRate: 400, // 1 in 400
                    goldMultiplier: 1
                };
            }
        });
        return { masterData: { ...state.masterData, zones: newZones } };
    }),
    // CASCADING DELETE: Purges a Zone and all its associated Monsters
    banishZone: (zid) => set((state) => {
        const newZones = { ...state.masterData.zones };
        const newBestiary = { ...state.masterData.bestiary };

        // 1. Remove the Zone entry
        delete newZones[zid];

        // This follows the GDD ZID:EID mapping 
        Object.keys(newBestiary).forEach(eid => {
    // Matches new "Z01:01" format and legacy .zid property
    if (eid.startsWith(`${zid}:`) || newBestiary[eid].zid === zid) {
        delete newBestiary[eid];
    }
});

        return {
            masterData: {
                ...state.masterData,
                zones: newZones,
                bestiary: newBestiary
            },
            adminSelectedZid: null // Reset UI selection
        };
    }),
    // TARGETED DELETE: Removes a single mob from the bestiary [cite: 14]
    deleteBestiaryEntity: (eid) => set((state) => {
        const currentMaster = JSON.parse(JSON.stringify(state.masterData));
        
        // 1. Remove from Bestiary
        delete currentMaster.bestiary[eid];

        // 2. Remove from ALL Zones (Cleanup)
        Object.keys(currentMaster.zones).forEach(zid => {
            const zone = currentMaster.zones[zid];
            if (Array.isArray(zone.mobs)) {
                currentMaster.zones[zid].mobs = zone.mobs.filter(id => id !== eid);
            }
        });

        return { masterData: currentMaster };
    }),
    // MAGI-TECH OVERDRIVE: Global Stat Scaler
    applyWorldScaling: (multiplier) => set((state) => {
        const newBestiary = { ...state.masterData.bestiary };
        Object.keys(newBestiary).forEach(eid => {
            const mob = newBestiary[eid];
            if (mob.stats) {
                // Precision scaling for HP and DMG across all entities
                newBestiary[eid].stats.hp = Math.floor(mob.stats.hp * multiplier);
                newBestiary[eid].stats.dmg = Math.floor(mob.stats.dmg * multiplier);
            }
        });
        return { 
            masterData: { ...state.masterData, bestiary: newBestiary } 
        };
    }),

    // MAGI-TECH PURGE: Emergency World Reset
    purgeWorldData: () => {
        if (window.confirm("CRITICAL OVERRIDE: Purge all Zone and Bestiary data? This cannot be undone.")) {
            set((state) => ({
                masterData: { 
                    ...state.masterData, 
                    zones: {}, 
                    bestiary: {} 
                }
            }));
        }
    },
    // --- ACTIONS ---
    setViewMode: (mode) => set({ viewMode: mode }),
    
    // UNIVERSAL WRITER: Updated to handle Category -> Slot -> Type -> Item nesting
updateData: (category, id, value, slot = null, subType = null) => set((state) => {
    // Create a deep clone to ensure React triggers a UI refresh
    const currentMaster = JSON.parse(JSON.stringify(state.masterData));

    if (slot && subType) {
        // TRIPLE-DEEP: Path for nested items (e.g., masterData -> armory -> weapons -> SWORD -> ID)
        if (!currentMaster[category][slot][subType]) currentMaster[category][slot][subType] = {};
        currentMaster[category][slot][subType][id] = value;
    } else if (slot) {
        // DOUBLE-DEEP: Path for standard items (e.g., masterData -> armory -> helmet -> ID)
        if (!currentMaster[category][slot]) currentMaster[category][slot] = {};
        currentMaster[category][slot][id] = value;
    } else {
        // SINGLE-DEEP: Path for global constants (e.g., masterData -> zones -> ID)
        currentMaster[category][id] = value;
    }

    return { masterData: currentMaster };
}),

    // 2. GOD TOOLS (Your mass-tweak logic)
    massTweakZonalBestiary: (zid, statField, multiplier) => set((state) => {
        const bestiary = { ...state.masterData.bestiary };
        Object.keys(bestiary).forEach(eid => {
            if (eid.toUpperCase().startsWith(zid.toUpperCase()) || bestiary[eid].zid === zid) {
                if (bestiary[eid].stats && bestiary[eid].stats[statField]) {
                    bestiary[eid].stats[statField] = Math.round(bestiary[eid].stats[statField] * multiplier);
                }
            }
        });
        return { masterData: { ...state.masterData, bestiary } };
    }),

    // 3. HIERARCHICAL IMPORT (The "185 Items" Fix & ID Normalization)
    importHierarchicalData: (zoneObj) => set((state) => {
        const currentData = { ...state.masterData };
        const newBestiary = { ...currentData.bestiary };
        const newZones = { ...currentData.zones };

        // Support both direct zone objects or named-key wrappers (e.g., { "crystal_caves": { ... } })
        const rawZoneData = zoneObj.zoneId ? zoneObj : Object.values(zoneObj)[0];
        const zoneId = rawZoneData.zoneId;

        if (!zoneId) {
            console.error("IMPORT ERROR: No zoneId found in provided JSON.");
            return state;
        }

        // 1. Extract & Normalize Monsters for the Bestiary
        if (rawZoneData.monsters && Array.isArray(rawZoneData.monsters)) {
            rawZoneData.monsters.forEach((mob, index) => {
                // INTERNALIZATION: Ensure 'id' exists for UI selection while keeping 'monsterId'
                const finalId = (mob.monsterId || mob.id || `MOB_${zoneId}_${index}`).toUpperCase();
                
                newBestiary[finalId] = {
                    ...mob,
                    id: finalId, // Primary key for BestiaryEditor selection logic
                    name: mob.name || mob.monsterName || "Unknown Entity",
                    zid: zoneId, // Link to the current parent zone
                    stats: mob.stats || { hp: 50, dmg: 5, ac: 10, xp: 20, gold: 5 }
                };
            });
        }

        // 2. Sync Zone Metadata
        newZones[zoneId] = {
            ...rawZoneData,
            id: zoneId,
            // Map monster list to normalized IDs for the Map/Encounter system
            monsters: rawZoneData.monsters?.map((m, i) => ({
                ...m,
                monsterId: (m.monsterId || m.id || `MOB_${zoneId}_${i}`).toUpperCase()
            }))
        };

        return {
            masterData: {
                ...currentData,
                bestiary: newBestiary,
                zones: newZones
            }
        };
    }),

    // 1. UNIVERSAL WRITER: This allows Dev Tools to save your individual mob/zone edits
    updateMasterData: (category, newData) => set((state) => ({
        masterData: {
            ...state.masterData,
            [category]: newData
        }
    })),

    // 2. BULK IMPORT: This allows the terminal to process your mass JSON/text lists
    importData: (category, data) => set((state) => ({
        masterData: {
            ...state.masterData,
            [category]: { ...state.masterData[category], ...data }
        }
    })),

    // 5. SYSTEMS (Combat/Player)
    // Enhanced Lookup: Supports both fixed JSON coordinates and Map Editor rosters
    getEncounterAt: (zid, coords) => {
        const state = get();
        const zone = state.masterData.zones[zid];
        if (!zone) return [];

        // Priority 1: Check for monsters with specific hardcoded coordinates (Hierarchical JSON)
        if (zone.monsters) {
            const specificMatch = zone.monsters.filter(m => m.spawnCoords === coords);
            if (specificMatch.length > 0) {
                return specificMatch.map(m => ({
                    eid: (m.monsterId || m.id).toUpperCase(),
                    name: m.name
                }));
            }
        }

        // Priority 2: Fallback to dynamic Map Editor Roster (zoneMobs)
        if (zone.zoneMobs && zone.zoneMobs.length > 0) {
            return [{
                eid: (zone.zoneMobs[0].monsterId || zone.zoneMobs[0].id).toUpperCase(),
                name: zone.zoneMobs[0].name,
                isRoaming: true
            }];
        }

        return [];
    },

    updatePlayer: (field, value) => set((state) => ({
        masterData: { 
            ...state.masterData, 
            player: { ...state.masterData.player, [field]: value } 
        }
    })),

    addReward: (xp, gold, item = null) => set((state) => {
        const p = state.masterData.player;
        const newInventory = item ? [...(p.inventory || []), item] : (p.inventory || []);
        
        return {
            masterData: { 
                ...state.masterData, 
                player: { 
                    ...p, 
                    xp: (p.xp || 0) + xp, 
                    gold: (p.gold || 0) + gold, 
                    inventory: newInventory 
                } 
            }
        };
    })
}));