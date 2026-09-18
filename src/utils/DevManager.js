import { racesData } from '../data/racesData.js';
import { armory, jewelry, arcanum } from '../config/gdd.js'; 
import { zonesData } from '../data/zonesData.js'; // [ADDED] Import Raw Zones
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
            
            // [ARCHITECT FIX] Prevent Level Doubling with the new Bank System.
            // Reset the player to Level 1, then give them the exact points needed to reach the target level.
            p.level = 1;
            p.attributePoints = targetLevel > 1 ? targetLevel - 1 : 0; 
            
            // Reset base stats to baseline so you can test the "clean" impact of your manual choices
            p.baseStats = { STR: 10, DEX: 10, VIT: 10, NTL: 10, WIS: 10 }; 
        }

        if (gold !== undefined && gold !== "") {
            p.gold = parseInt(gold);
        }
        
        this.gm.Systems.calculateDerivedStats(p);
        this.sync();
        console.log(`⚡ Dev: Target Level ${level} prepared. Assign your ${p.attributePoints} banked points to rank up.`);
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
    },

    /**
     * [MAGI-TECH AUTOMATED BESTIARY FORGER]
     * Generates mathematically perfect monster stats based on the "1-Shot Optimal" ARPG Rule.
     * Usage in Browser Console: window.DevManager.forgeZone("Z87", 172222, 18)
     */
    forgeZone(zoneId, minLevel, gearTier) {
        console.log(`\n⚙️ MAGI-TECH FORGE: Initializing simulation for ${zoneId}...`);

        // 1. GHOST PLAYER AP ALLOCATION (Based on True Fighter weights)
        // 16 DEX, 12 STR, 12 VIT per level
        const primaryStat = 16 * minLevel;   // DEX (Accuracy)
        const secondaryStat = 12 * minLevel; // STR (Damage)
        const vitStat = 12 * minLevel;       // VIT (Survivability)

        // 2. GHOST PLAYER GEAR ESTIMATE
        // Assuming Tier 1 = ~35 total WC, scaling linearly as a baseline before multipliers
        const totalGearWC = gearTier * 35; 
        const totalGearAC = gearTier * 25;
        const basePower = 5 + (minLevel * 2);

        // 3. DAMAGE MATH (Using the exact DR formula from Systems.js)
        const dmgMultiplier = 1 + (Math.pow(secondaryStat, 0.75) * 0.005);
        const finalWC = Math.max(1, (totalGearWC + basePower) * dmgMultiplier);

        // 4. MONSTER BASELINES
        // Set reasonable AC scaling to prevent damage from inflating too wildly
        const bossAC = Math.max(1, gearTier * 120);
        const minionAC = Math.max(1, gearTier * 60);

        // Player Damage Formula: (25 * WC) / AC
        const bossDamageTaken = Math.floor((25 * finalWC) / bossAC);
        const minionDamageTaken = Math.floor((25 * finalWC) / minionAC);

        // 5. THE 1-SHOT ARPG RULE
        const bossHP = bossDamageTaken;              // 1-Shot by optimal player
        const minionHP = Math.floor(bossHP * 0.15);  // 1-Shot by previous-tier player (or 15% of Boss HP)

        // 6. EVASION & HIT CONTEST
        // Hit Score = 75 + ((Acc/Ev) * 15). To equal exactly 100%, Acc/Ev must be 1.666.
        const bossEvasion = Math.floor(primaryStat / 1.666);
        const minionEvasion = Math.floor(bossEvasion * 0.6);

        // 7. LETHALITY (Monster Damage)
        // A sub-optimal player should die in ~4 hits to a Boss, ~10 hits to a minion.
        const playerMaxHP = 100 + (vitStat * 10);
        const playerActualAC = totalGearAC * (1 + (vitStat * 0.0075));
        
        // Monster Damage Formula Reversed: Atk = (TargetDmg * PlayerAC) / 25
        const bossAtk = Math.floor(((playerMaxHP / 4) * playerActualAC) / 25);
        const minionAtk = Math.floor(((playerMaxHP / 10) * playerActualAC) / 25);

        console.log(`=========================================`);
        console.log(`🏰 ZONE ${zoneId} PERFECT BALANCING DATA`);
        console.log(`Target: Level ${minLevel.toLocaleString()} | Gear Tier: ${gearTier}`);
        console.log(`Player Optimal Damage: ${bossDamageTaken.toLocaleString()} per swing`);
        console.log(`=========================================`);
        console.log(`[BOSS / ELITE TEMPLATE]`);
        console.log(`hp: ${bossHP}`);
        console.log(`damage: ${bossAtk}`);
        console.log(`ac: ${bossAC}`);
        console.log(`evasion: ${bossEvasion}`);
        console.log(`-----------------------------------------`);
        console.log(`[MINION / STANDARD TEMPLATE]`);
        console.log(`hp: ${minionHP}`);
        console.log(`damage: ${minionAtk}`);
        console.log(`ac: ${minionAC}`);
        console.log(`evasion: ${minionEvasion}`);
        console.log(`=========================================\n`);
    },

    /**
     * [MAGI-TECH MASTER FORGE v12 - BULLETPROOF GDD ALIGNMENT]
     * Safely reads constants or falls back to verified 90 / 0.5 math.
     */
    forgeEntireBestiary() {
        console.log("⚙️ MAGI-TECH FORGE: Initiating Auto-Repair (Bulletproof Alignment)...");

        const flatBestiary = this.gm.DataManager.getBestiary();
        const zones = {};
        const repairedFlatBestiary = {};

        // 1. BULLETPROOF CONSTANT FETCHING
        // Uses typeof to prevent ReferenceErrors if the import is missing
        const DAMAGE_CONST = (typeof gddConstants !== 'undefined' && gddConstants.PLAYER_DAMAGE_CONSTANT) 
            ? gddConstants.PLAYER_DAMAGE_CONSTANT 
            : 90;
            
        const AC_FACTOR = (typeof gddConstants !== 'undefined' && gddConstants.MONSTER_DAMAGE_AC_REDUCTION_FACTOR) 
            ? gddConstants.MONSTER_DAMAGE_AC_REDUCTION_FACTOR 
            : 0.5;

        for (const [mobId, mobData] of Object.entries(flatBestiary)) {
            const zKey = mobId.split(':')[0];
            if (!zones[zKey]) zones[zKey] = [];
            zones[zKey].push(mobData);
        }

        const anchors = [
            { z: 25, lvl: 100 }, { z: 34, lvl: 1000 }, { z: 59, lvl: 6143 },
            { z: 87, lvl: 172222 }, { z: 95, lvl: 200000 }, { z: 101, lvl: 400000 }
        ];

        const getTargetLevel = (zoneIndex) => {
            if (zoneIndex <= 24) return 1;
            for (let i = 0; i < anchors.length - 1; i++) {
                if (zoneIndex >= anchors[i].z && zoneIndex <= anchors[i+1].z) {
                    const rangeZ = anchors[i+1].z - anchors[i].z;
                    const rangeLvl = anchors[i+1].lvl - anchors[i].lvl;
                    const progress = (zoneIndex - anchors[i].z) / rangeZ;
                    return Math.floor(anchors[i].lvl + (rangeLvl * Math.pow(progress, 2)));
                }
            }
            return 400000;
        };

        for (const [zKey, mobList] of Object.entries(zones)) {
            const zNum = parseInt(zKey.replace('Z', ''));
            if (isNaN(zNum)) continue;

            const minLevel = getTargetLevel(zNum);
            const gearTier = (zNum >= 25) ? Math.min(24, Math.floor(2 + ((zNum - 25) / 76) * 22)) : 1;
            const prevTier = Math.max(0, gearTier - 1); 

            // --- THE CORE PLAYER STATS ---
            const primaryStat = 16 * Math.max(1, minLevel);
            const vitStat = 12 * Math.max(1, minLevel);
            const playerMaxHP = 100 + (vitStat * 10); 

            const prevGearMult = prevTier === 0 ? 0.5 : Math.pow(1.22, prevTier - 1);
            const currGearMult = Math.pow(1.22, gearTier - 1);

            // Anchored to User's Live T1 Stats
            const floorPlayerWC = Math.max(1, 26 * prevGearMult);
            const floorPlayerAC = Math.max(1, 27 * prevGearMult);

            const ceilingPlayerWC = Math.max(1, 52 * currGearMult);
            const ceilingPlayerAC = Math.max(1, 55 * currGearMult);

            // --- MONSTER DEFENSES ---
            const minionAC = Math.max(5, Math.floor(40 * prevGearMult));
            const bossAC = Math.max(10, Math.floor(100 * currGearMult));

            const floorDamageDealt = Math.max(1, Math.floor((DAMAGE_CONST * floorPlayerWC) / minionAC));
            const ceilingDamageDealt = Math.max(1, Math.floor((DAMAGE_CONST * ceilingPlayerWC) / bossAC));

            const minionHP = Math.max(20, floorDamageDealt * 2); 
            const bossHP = Math.max(100, ceilingDamageDealt * 5); 

            // --- REVERSE ENGINEER LETHALITY ---
            const minionTargetDmg = playerMaxHP / 10; 
            const bossTargetDmg = playerMaxHP / 4;    

            const minionAtk = Math.max(2, Math.floor((minionTargetDmg * Math.max(1, floorPlayerAC * AC_FACTOR)) / DAMAGE_CONST));
            const bossAtk = Math.max(5, Math.floor((bossTargetDmg * Math.max(1, ceilingPlayerAC * AC_FACTOR)) / DAMAGE_CONST));

            const minionEvasion = Math.max(5, Math.floor(primaryStat / 2.5));
            const bossEvasion = Math.max(10, Math.floor(primaryStat / 1.666));

            const mobCount = mobList.length;

            mobList.forEach((mob, index) => {
                const progress = mobCount > 1 ? (index / (mobCount - 1)) : 1;
                const isEliteOrBoss = mob.tier === 'Boss' || mob.tier === 'Elite' || mob.isBoss;
                const p = isEliteOrBoss ? 1 : progress;

                repairedFlatBestiary[mob.id] = {
                    ...mob,
                    level: Math.floor(minLevel + (index * 0.5)),
                    hp: Math.floor(minionHP + ((bossHP - minionHP) * p)),
                    atk: Math.floor(minionAtk + ((bossAtk - minionAtk) * p)),
                    def: Math.floor(minionAC + ((bossAC - minionAC) * p)),
                    evasion: Math.floor(minionEvasion + ((bossEvasion - minionEvasion) * p)),
                    xp: Math.max(1, Math.floor((minLevel * 10) * (0.5 + (0.5 * p)))),
                    gold: Math.max(1, Math.floor((minLevel * 5) * (0.5 + (0.5 * p))))
                };
            });
        }

        let outputCode = `// GENERATED BY MAGI-TECH ENGINE\nexport const bestiaryData = {\n`;
        for (const [mobId, mob] of Object.entries(repairedFlatBestiary)) {
            outputCode += `  "${mobId}": ${JSON.stringify(mob)},\n`;
        }
        outputCode += `};\n`;

        navigator.clipboard.writeText(outputCode).then(() => {
            console.log("✅ SUCCESS! Bulletproof Bestiary copied to clipboard!");
        });
    },

    /**
     * [MAGI-TECH ZONES FORGE v2]
     */
    forgeZonesData() {
        console.log("⚙️ MAGI-TECH FORGE: Synchronizing Zone Entry Levels (Parallel Starters)...");
        const activeZones = zonesData || [];
        
        const anchors = [
            { z: 25, lvl: 100 }, 
            { z: 34, lvl: 1000 },
            { z: 59, lvl: 6143 }, 
            { z: 87, lvl: 172222 }, 
            { z: 95, lvl: 200000 }, 
            { z: 101, lvl: 400000 }
        ];

        const getTargetLevel = (zoneIndex) => {
            if (zoneIndex <= 24) return 1; // [FIX] All 24 Starter Zones are Level 1
            for (let i = 0; i < anchors.length - 1; i++) {
                if (zoneIndex >= anchors[i].z && zoneIndex <= anchors[i+1].z) {
                    const rangeZ = anchors[i+1].z - anchors[i].z;
                    const rangeLvl = anchors[i+1].lvl - anchors[i].lvl;
                    const progress = (zoneIndex - anchors[i].z) / rangeZ;
                    return Math.floor(anchors[i].lvl + (rangeLvl * Math.pow(progress, 2))); 
                }
            }
            return 400000;
        };

        const repairedZones = activeZones.map(zone => {
            const zMatch = zone.id.match(/\d+/);
            const zNum = zMatch ? parseInt(zMatch[0]) : 1;
            return { ...zone, minLevel: getTargetLevel(zNum) };
        });

        let outputCode = `// GENERATED BY MAGI-TECH ENGINE\nexport const zonesData = [\n`;
        repairedZones.forEach((zone, index) => {
            outputCode += `  ${JSON.stringify(zone)}${index < repairedZones.length - 1 ? ',' : ''}\n`;
        });
        outputCode += `];\n`;

        navigator.clipboard.writeText(outputCode).then(() => {
            console.log("✅ SUCCESS! Synchronized zonesData.js copied to clipboard!");
        }).catch(err => {
            console.error("Clipboard blocked. Raw text below:");
            console.log(outputCode);
        });
    }
};

// Make it globally accessible for the HTML buttons
window.DevManager = DevManager;