import { racesData } from '../data/racesData.js';
import { armory, jewelry, arcanum } from '../config/gdd.js'; // [ARCHITECT FIX] Import Raw Modules
// src/utils/DevManager.js
/**
 * @file src/utils/DevManager.js
 * @description Centralized developer tools for Geminus. Handles resource injection,
 * level jumps, and starter set generation to streamline testing.
 */

export const DevManager = {
    gm: null,

    /**
     * @param {Object} gm - The global GameManager instance.
     */
    init(gm) {
        this.gm = gm;
        window.DEV_FORCE_DROPS = false;
        console.log("🛠️ DevManager: Initialized. Cheat-codes ready.");
    },

    /**
     * Sets specific player values and triggers attribute redistribution.
     */
    /**
     * Sets player level and gold, then grants a pool of points for manual allocation.
     */
    setPlayerStats(level, gold) {
        const p = this.gm.state.player;

        if (level !== undefined && level !== "") {
            const targetLevel = parseInt(level);
            p.level = targetLevel;
            
            // Grant 1 point per level as requested (not 5) for manual testing
            // This triggers the "Select Attribute Focus" UI in combat
            p.attributePoints = targetLevel; 
            
            // Reset base stats to baseline so you can test the "clean" impact of your manual choices
            p.baseStats = { STR: 10, DEX: 10, VIT: 10, NTL: 10, WIS: 10 }; 
        }

        if (gold !== undefined && gold !== "") {
            p.gold = parseInt(gold);
        }
        
        this.gm.Systems.calculateDerivedStats(p);
        this.sync();
        console.log(`⚡ Dev: Level ${p.level} applied. Assign your ${p.attributePoints} points in Combat.`);
    },

    /**
     * Injects a COMPLETE set of "Droppers" (non-shadows) at the specified Tier.
     */
    injectTierSet(tier = 1) {
        const p = this.gm.state.player;
        const t = parseInt(tier);
        
        const templates = [
            "Axe", "Sword", "Mace", "Dagger", "Bow", "Staff", "Claw", "Shield", "Arrow", "Caster_offhand",
            "Helmet", "Chest", "Leggings", "Boots", "Gloves",
            "Ring", "Necklace", "Amulet",
            "might", "guard", "swiftness",
            "fire", "ice", "arcane", "cold", "earth", "air", "death", "drain"
        ];

        // [ARCHITECT FIX] Aggregate authentic items AND inject 'type' from parent keys
        let allItems = [];
        if (armory?.weapons) Object.entries(armory.weapons).forEach(([k, cat]) => Object.values(cat).forEach(i => allItems.push({...i, type: k})));
        if (armory?.armor) Object.entries(armory.armor).forEach(([k, cat]) => Object.values(cat).forEach(i => allItems.push({...i, type: k})));
        if (jewelry?.necklace) Object.values(jewelry.necklace).forEach(i => allItems.push({...i, type: 'necklace'}));
        if (jewelry?.ring) Object.values(jewelry.ring).forEach(i => allItems.push({...i, type: 'ring'}));
        if (arcanum?.spells) Object.entries(arcanum.spells).forEach(([k, cat]) => Object.values(cat).forEach(i => allItems.push({...i, type: k})));
        if (arcanum?.Buff) Object.entries(arcanum.Buff).forEach(([k, cat]) => Object.values(cat).forEach(i => allItems.push({...i, type: k})));

        templates.forEach(typeName => {
            // Normalize template names to match GDD standards
            let searchType = typeName.toLowerCase();
            if (searchType === 'amulet') searchType = 'necklace';
            if (searchType === 'ice') searchType = 'cold';

            const baseItem = allItems.find(i => 
                ((i.type || '').toLowerCase() === searchType || (i.subType || '').toLowerCase() === searchType) && 
                i.tier === t
            );

            if (baseItem) {
                p.inventory.push({
                    ...baseItem,
                    uuid: crypto.randomUUID(),
                    instanceId: `DEV_T${t}_${typeName.toUpperCase()}_${Date.now()}`,
                    qualityMultiplier: 1.0,
                    locked: false,
                    description: "Authentic Dev Test Gear",
                    sockets: 2, // [ARCHITECT FIX] Strict Schema: Integer Capacity
                    socketedGems: [] // [ARCHITECT FIX] Strict Schema: Array Contents
                });
            } else {
                console.warn(`⚠️ Dev: Authentic base item for '${searchType}' at Tier ${t} not found.`);
            }
        });
        
        this.sync();
        console.log(`✅ Dev: Injected authentic Tier ${t} set from Master Registry.`);
    },
    /**
     * Calculates and displays projected stats in the UI before applying.
     * Matches the "1 Point Per Level" manual allocation rule.
     */
    updatePreview() {
        const p = this.gm.state.player;
        if (!p) return;

        const levelInput = document.getElementById('dev-set-level');
        const level = parseInt(levelInput.value) || p.level;
        const raceKey = p.race ? p.race.toUpperCase() : 'HUMAN';
        const raceConfig = racesData[raceKey];

        if (raceConfig && raceConfig.apWeights) {
            // Updated to 1 point per level for manual testing
            const totalPoints = level; 
            const w = raceConfig.apWeights;

            // Calculate Projected Base Stats based on 1:1 Level-to-Point ratio
            // We use 55 as the divisor because your DNA weights sum to 55
            const projVIT = Math.floor(totalPoints * (w.VIT / 55));
            const projDEX = Math.floor(totalPoints * (w.DEX / 55));
            const projWIS = Math.floor(totalPoints * (w.WIS / 55));

            // Health Calculation (100 base + 10 per VIT)
            const hp = 100 + (projVIT * 10);
            
            // WC/SC Scaling Logic
            const basePower = 5 + (level * 2);
            let wc = basePower, sc = basePower;
            
            // Map Primary Scaling value based on Race DNA
            const primaryVal = (raceConfig.primaryStat === 'VIT') ? projVIT : 
                               (raceConfig.primaryStat === 'DEX') ? projDEX : projWIS;

            // Apply Archetype Multipliers
            if (raceConfig.archetype === 'True Fighter') {
                wc = (basePower) * (1 + (primaryVal * 0.0055));
            } else if (raceConfig.archetype === 'True Caster') {
                sc = (basePower) * (1 + (primaryVal * 0.0055));
            } else if (raceConfig.archetype === 'Hybrid') {
                wc = (basePower) * (1 + (primaryVal * 0.0055));
                sc = (basePower) * (1 + (primaryVal * 0.0055));
            }

            // Update Preview DOM
            document.getElementById('prev-hp').innerText = Math.floor(hp).toLocaleString();
            document.getElementById('prev-wc').innerText = Math.floor(wc).toLocaleString();
            document.getElementById('prev-sc').innerText = Math.floor(sc).toLocaleString();
        }
    },

    /**
     * Toggles the global DEV_FORCE_DROPS flag.
     */
    toggleForceDrops() {
        window.DEV_FORCE_DROPS = !window.DEV_FORCE_DROPS;
        console.log(`⚡ Dev: Force Drops is now ${window.DEV_FORCE_DROPS}`);
        return window.DEV_FORCE_DROPS;
    },

    /**
     * Forces all UI managers to refresh their views with the new data.
     */
    sync() {
        if (this.gm.InventoryManager) this.gm.InventoryManager.render();
        if (this.gm.ProfileManager) this.gm.ProfileManager.updateAllProfileUI();
        
        // Sync the Arcanum or Armory if they are open in an iframe
        const shopFrame = document.querySelector('iframe'); 
        if (shopFrame && shopFrame.contentWindow.ShopManager) {
            shopFrame.contentWindow.ShopManager.refreshState();
        }
    }
};

// Make it globally accessible for the HTML buttons
window.DevManager = DevManager;