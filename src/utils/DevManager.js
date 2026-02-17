import { racesData } from '../data/racesData.js';
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
            // --- WEAPONS ---
            { name: "Axe", cat: "Weapons" }, { name: "Sword", cat: "Weapons" },
            { name: "Mace", cat: "Weapons" }, { name: "Dagger", cat: "Weapons" },
            { name: "Bow", cat: "Weapons" }, { name: "Staff", cat: "Weapons" },
            { name: "Claw", cat: "Weapons" }, { name: "Shield", cat: "Weapons" },
            { name: "Arrow", cat: "Weapons" }, { name: "Caster_offhand", cat: "Weapons" },
            // --- ARMOR ---
            { name: "Helmet", cat: "Armor" }, { name: "Chest", cat: "Armor" },
            { name: "Leggings", cat: "Armor" }, { name: "Boots", cat: "Armor" },
            { name: "Gloves", cat: "Armor" }, 
            // --- JEWELRY ---
            { name: "Ring", cat: "Jewelry" }, { name: "Necklace", cat: "Jewelry" }, 
            { name: "Amulet", cat: "Jewelry" },
            // --- BUFFS ---
            { name: "might", cat: "Buff" }, { name: "guard", cat: "Buff" },
            { name: "swiftness", cat: "Buff" },
            // --- FULL SPELL REPERTOIRE (DNA Verified) ---
            { name: "fire", cat: "Spell" }, { name: "ice", cat: "Spell" },
            { name: "arcane", cat: "Spell" }, { name: "cold", cat: "Spell" },
            { name: "earth", cat: "Spell" }, { name: "air", cat: "Spell" },
            { name: "death", cat: "Spell" }, { name: "drain", cat: "Spell" }
        ];

        templates.forEach(tmp => {
            p.inventory.push({
                uuid: crypto.randomUUID(),
                instanceId: `DEV_T${t}_${tmp.name.toUpperCase()}_${Date.now()}`,
                name: `${tmp.name.charAt(0).toUpperCase() + tmp.name.slice(1)} (T${t})`,
                type: tmp.name,
                category: tmp.cat,
                tier: t,
                qualityMultiplier: 1.0,
                wc: (tmp.cat === "Weapons") ? 10 * t : 0,
                ac: (tmp.cat === "Armor") ? 5 * t : 0,
                sc: (tmp.cat === "Spell") ? 10 * t : 0,
                description: "Dev Test Gear"
            });
        });
        this.sync();
        console.log(`✅ Dev: Injected full Tier ${t} set including all 8 Spell elements.`);
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