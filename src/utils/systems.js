// src/utils/systems.js
import { races, progression, items, gddConstants, bestiary, gems, zones, enchantments } from '../config/gdd.js';

// --- SAFETY UTILS ---
// Prevents "undefined * 5 = NaN" errors
const safeVal = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;
const safeMult = (val, mult) => safeVal(val) * safeVal(mult);

// Helper function to find an item by ID in the nested armory structure
function findItemById(itemId) {
  if (!items || !itemId) return null;
  
  // Search in weapons
  if (items.weapons) {
    for (const weaponType in items.weapons) {
      if (items.weapons[weaponType] && items.weapons[weaponType][itemId]) {
        return items.weapons[weaponType][itemId];
      }
    }
  }
  
  // Search in armor
  if (items.armor) {
    for (const armorType in items.armor) {
      if (items.armor[armorType] && items.armor[armorType][itemId]) {
        return items.armor[armorType][itemId];
      }
    }
  }
  
  return null;
}

const Systems = {
  calculateDerivedStats(player) {
    if (!player) return player; 
    
    player.derivedStats = {};
    
    // [FIX] Case-Insensitive Lookup
    // Handles "Tiefling" (Save Data) vs "TIEFLING" (Config Data)
    let racialData = races[player.race];
    if (!racialData && player.race) {
        racialData = races[player.race.toUpperCase()];
    }

    if (!racialData) {
        console.warn(`⚠️ Systems: Invalid race ${player.race}. Using fallback.`);
        return player;
    }

    let totalGearAC = 0;
    let totalGearWC = 0;
    let totalGearSC = 0;
    let bonusHitChance = 0;
    let bonusWcScMultiplier = 1.0;
    let totalHpRegenPercent = 0;

    // 1. Process Equipment Stats
    if (player.equipment && player.inventory) {
        for (const slotName in player.equipment) {
          const instanceId = player.equipment[slotName];
          if (!instanceId) continue;

          const item = player.inventory.find(i => i.instanceId === instanceId);
          if (!item) continue;

          const baseItem = findItemById(item.baseItemId);
          if (!baseItem) continue;

          const qm = safeVal(item.qualityMultiplier) || 1.0; 
          
          totalGearWC += safeMult(baseItem.wc, qm);
          totalGearAC += safeMult(baseItem.ac, qm);
          totalGearSC += safeMult(baseItem.sc, qm);
          
          if (baseItem.wc_bonus) bonusWcScMultiplier += safeVal(baseItem.wc_bonus);
          if (baseItem.sc_bonus) bonusWcScMultiplier += safeVal(baseItem.sc_bonus);
          if (baseItem.hp_regen_percent) totalHpRegenPercent += safeVal(baseItem.hp_regen_percent);
        }
    }

    // 2. Archetype Scaling Logic
    let finalWC = 0, finalSC = 0;
    const primaryStat = racialData.primaryStat;
    const scalingStatValue = safeVal(player.baseStats?.[primaryStat]);

    const isTroll = player.race === 'Troll';
    const isVampire = player.race === 'Vampire';
    const VIT = safeVal(player.baseStats?.VIT);
    const DEX = safeVal(player.baseStats?.DEX);
    const WIS = safeVal(player.baseStats?.WIS);

    // [FIX] Base Spell Power (The "Spell Class" of the default cast)
    // Even without a weapon, the spell itself has power that grows with level.
    const basePower = 5 + (player.level * 2);

    switch (racialData.archetype) {
      case 'True Fighter':
        // Fighter Scaling (WC)
        // If Troll, Scale with VIT. Else, Scale with DEX.
        const fighterStat = isTroll ? VIT : scalingStatValue;
        finalWC = (totalGearWC + basePower) * (1 + (fighterStat * 0.0055));
        
        // Fighter Magic (SC) - Minimal aptitude
        // They get gear stats + half base power, but NO stat scaling.
        finalSC = totalGearSC + (basePower * 0.5); 
        break;

      case 'True Caster':
        // [FIX] Staff Fallback: If Item has WC but no SC, use 80% of WC as SC
        // This handles cases where a "Staff" was defined only as a physical weapon.
        if (totalGearSC === 0 && totalGearWC > 0) {
            totalGearSC = totalGearWC * 0.8;
        }

        // Caster Scaling (SC)
        // If Vampire, Scale with VIT. Else, Scale with WIS.
        const casterStat = isVampire ? VIT : scalingStatValue;
        
        // The Spell (basePower) + The Wand (GearSC) * Mastery (Int/Vit)
        finalSC = (totalGearSC + basePower) * (1 + (casterStat * 0.0055));

        // Caster Physical (WC) - Minimal aptitude
        finalWC = totalGearWC + (basePower * 0.5);
        break;
        
      case 'Hybrid':
        // Hybrid scales BOTH with Primary Stat
        finalWC = (totalGearWC + basePower) * (1 + (scalingStatValue * 0.0055));
        finalSC = (totalGearSC + basePower) * (1 + (scalingStatValue * 0.0055));
        break;
    }

    // [Safety] Apply Bonuses and Floors
    finalWC = Math.max(1, finalWC * bonusWcScMultiplier);
    finalSC = Math.max(1, finalSC * bonusWcScMultiplier);

    // 3. Derived Combat Values
    player.derivedStats.maxHp = 100 + (VIT * 10);
    player.derivedStats.AC = totalGearAC * (1 + (VIT * 0.0075));
    player.derivedStats.WC = Math.floor(finalWC);
    player.derivedStats.SC = Math.floor(finalSC);

    // Hit & Crit Logic
    if (primaryStat === 'DEX' || (racialData.archetype === 'True Fighter' && primaryStat === 'VIT')) {
      player.derivedStats.hitChance = 90 + (DEX * 0.05);
      player.derivedStats.critChance = 5 + (DEX * 0.01);
    } else {
      player.derivedStats.hitChance = 90 + (WIS * 0.05);
      player.derivedStats.critChance = 5 + (WIS * 0.01);
    }

    player.derivedStats.hitChance += (player.derivedStats.hitChance * bonusHitChance);

    // --- HP REGEN CALCULATION ---
    const baseRegen = Math.floor(5 + ((player.level || 1) * 1.5));
    const gearRegen = player.derivedStats.maxHp * totalHpRegenPercent;
    player.derivedStats.hpRegen = baseRegen + Math.floor(gearRegen);

    // HP Sync & NaN Prevention
    if (isNaN(player.derivedStats.maxHp)) player.derivedStats.maxHp = 100;
    if (player.hp === undefined || isNaN(player.hp) || player.hp > player.derivedStats.maxHp) {
        player.hp = player.derivedStats.maxHp;
    }

    player.stats = player.derivedStats;
    return player;
  },

  MonsterScaling(monster, targetGearTier, zoneId = null) {
    const baseMonster = { ...monster };
    
    // [FIXED] Ensure base stats are numbers
    baseMonster.hp = safeVal(baseMonster.hp) || 25;
    baseMonster.atk = safeVal(baseMonster.atk) || 5;
    baseMonster.def = safeVal(baseMonster.def) || 0;
    baseMonster.xp = safeVal(baseMonster.xp) || 10;
    baseMonster.gold = safeVal(baseMonster.gold) || 5;

    // --- 1. SUPER EASY MECHANIC ---
    if (zoneId && zones) {
        const zoneKey = Object.keys(zones).find(k => zones[k].id === zoneId);
        const zone = zoneKey ? zones[zoneKey] : null;

        if (zone && zone.minLevel > 10000 && ['Gem Zone', 'Shadow Zone', 'Gold Zone'].includes(zone.type)) {
            const scalingFactor = 0.10 + (Math.random() * 0.10);
            baseMonster.hp = Math.floor(baseMonster.hp * scalingFactor);
            baseMonster.atk = Math.floor(baseMonster.atk * scalingFactor);
        }
    }
    
    const safeTier = Math.max(1, safeVal(targetGearTier));
    if (safeTier <= 1 && !baseMonster.title) return baseMonster;

    const tierDiff = safeTier - 1;
    // [FIXED] Check constants exist, fallback if not
    const HP_RATE = gddConstants?.MONSTER_SCALING_HP_RATE || 1.15;
    const ATK_RATE = gddConstants?.MONSTER_SCALING_ATK_RATE || 1.1;
    const DEF_RATE = gddConstants?.MONSTER_SCALING_DEF_RATE || 1.05;
    const REWARD_RATE = gddConstants?.MONSTER_SCALING_REWARD_RATE || 1.2;

    baseMonster.hp *= Math.pow(HP_RATE, tierDiff);
    baseMonster.atk *= Math.pow(ATK_RATE, tierDiff);
    baseMonster.def *= Math.pow(DEF_RATE, tierDiff);
    baseMonster.xp *= Math.pow(REWARD_RATE, tierDiff);
    baseMonster.gold *= Math.pow(REWARD_RATE, tierDiff);

    // --- 2. MONSTER TITLES  ---
    if (baseMonster.title) {
        switch (baseMonster.title) {
            case 'Echo':
                baseMonster.hp *= 2; baseMonster.atk *= 2; baseMonster.def *= 2;
                baseMonster.gold *= 2;
                break;
            case 'Marauder':
                baseMonster.doubleHitChance = (baseMonster.doubleHitChance || 0) + 70;
                break;
            case 'Dreadlord':
                baseMonster.hp *= 4; baseMonster.atk *= 4; baseMonster.def *= 4;
                baseMonster.gold *= 3; baseMonster.xp *= 4;
                break;
            case 'Juggernaut':
                baseMonster.hp *= 10;
                baseMonster.def += 5;
                break;
            case 'Apex':
                baseMonster.hp *= 4; baseMonster.atk *= 4; baseMonster.def *= 4;
                baseMonster.gold *= 4; baseMonster.xp *= 4;
                baseMonster.doubleHitChance = (baseMonster.doubleHitChance || 0) + 50;
                break;
        }
    }

    // [FIXED] Final Safety Floor
    baseMonster.hp = Math.max(1, Math.floor(baseMonster.hp));
    baseMonster.atk = Math.max(1, Math.floor(baseMonster.atk));
    baseMonster.def = Math.floor(baseMonster.def);
    baseMonster.xp = Math.floor(baseMonster.xp);
    baseMonster.gold = Math.floor(baseMonster.gold);

    return baseMonster;
  },

  resolveCombatTurn(player, monster, actionType = 'attack') {
    const racialData = races[player.race];
    if (!racialData) return { status: 'ERROR' };

    if (monster.currentHP === undefined) monster.currentHP = monster.hp || 25;

    let playerDamage = 0;
    const pStats = player.derivedStats || player.stats; 
    const monsterAC = Math.max(1, monster.def || 1);
    
    // [FIXED] Robust Stat Selection
    let stat = 0;
    if (actionType === 'cast') {
        stat = safeVal(pStats.SC);
    } else if (actionType === 'spellstrike') {
        const wc = safeVal(pStats.WC);
        const sc = safeVal(pStats.SC);
        stat = Math.max(wc, sc) * 1.1; 
    } else {
        // Default / Attack
        stat = safeVal(pStats.WC);
    }

    // [FIXED] Prevent Divide by Zero / NaN
    const DAMAGE_CONST = gddConstants?.PLAYER_DAMAGE_CONSTANT || 25;
    playerDamage = (DAMAGE_CONST * stat) / monsterAC;
    playerDamage = Math.max(1, playerDamage); // Minimum 1 damage

    // --- CRIT & DOUBLE HIT LOGIC ---
    const isCrit = Math.random() * 100 < (pStats.critChance || 5);
    const critMultiplier = isCrit ? (pStats.critDamage || 2.0) : 1.0; 
    playerDamage *= critMultiplier;

    const isDoubleHit = Math.random() * 100 < (pStats.doubleHitChance || 0);
    if (isDoubleHit) playerDamage *= 2; 

    // Apply to monster
    monster.currentHP = Math.max(0, monster.currentHP - playerDamage);

    if (monster.currentHP <= 0) return { status: 'VICTORY', player, monster, damageDealt: playerDamage };

    // Monster Counter-Attack
    // [FIXED] Prevent NaN from AC calc
    const AC_FACTOR = gddConstants?.MONSTER_DAMAGE_AC_REDUCTION_FACTOR || 0.5;
    let monsterDamage = Math.max(0, monster.atk - (safeVal(pStats.AC) * AC_FACTOR));
    
    // Ensure monster damage is a number
    if (isNaN(monsterDamage)) monsterDamage = 0;

    player.hp = Math.max(0, player.hp - monsterDamage);
    
    if (player.hp <= 0) return { status: 'DEFEAT', player, monster, damageTaken: monsterDamage };

    // --- IN-COMBAT REGEN ---
    const combatRegen = Math.floor(safeVal(player.derivedStats.hpRegen) * 0.5);
    player.hp = Math.min(player.derivedStats.maxHp, player.hp + combatRegen);
    
    // Keep HP in sync
    monster.hp = monster.currentHP; 

    return { 
        status: 'CONTINUE', 
        player, 
        monster, 
        damageDealt: playerDamage, 
        damageTaken: monsterDamage,
        monsterCurrentHP: monster.currentHP,
        playerCurrentHP: player.hp,
        isCrit: isCrit,
        isDoubleHit: isDoubleHit
    };
  },

  simulateCombat(player, monster) {
    // Basic simulation logic preserved but not used in manual mode
    return { outcome: 'VICTORY', finalState: { player, monster }, log: [] };
  },

  // --- [NEW] ENCHANTMENT GENERATOR (GDD 2.4) ---
  generateEnchantments(item, qm, zoneId) {
    let count = 0;
    if (qm >= 1.5) count = 4;        
    else if (qm >= 1.25) count = Math.floor(Math.random() * 2) + 2; 
    else if (qm >= 1.00) count = Math.floor(Math.random() * 2) + 1; 
    else count = Math.random() < 0.5 ? 1 : 0; 

    if (count === 0 || !enchantments) return [];

    const zone = Array.isArray(zones) 
        ? zones.find(z => z.id === zoneId) 
        : (zones && zones[zoneId] ? zones[zoneId] : null);
        
    const lvl = (zone && typeof zone.minLevel === 'number') ? zone.minLevel : 1;
    
    let tier = 1;
    if (lvl >= 13000) tier = 9;
    else if (lvl >= 6000) tier = 8;
    else if (lvl >= 3000) tier = 7;
    else if (lvl >= 1000) tier = 6;
    else if (lvl >= 500) tier = 5;
    else if (lvl >= 250) tier = 4;
    else if (lvl >= 100) tier = 3;
    else if (lvl >= 50) tier = 2;

    const selected = [];
    const allEnchants = [];
    if (enchantments.caster) allEnchants.push(...Object.values(enchantments.caster));
    if (enchantments.fighter) allEnchants.push(...Object.values(enchantments.fighter));
    if (enchantments.support) allEnchants.push(...Object.values(enchantments.support));

    for (let i = 0; i < count; i++) {
        if (allEnchants.length === 0) break;
        const randIndex = Math.floor(Math.random() * allEnchants.length);
        const enchData = allEnchants[randIndex];
        
        let value = 0;
        if (enchData.tiers && enchData.tiers.length >= tier) {
            value = enchData.tiers[tier - 1]; 
        } else if (enchData.values) {
             value = enchData.values[Math.min(tier - 1, enchData.values.length - 1)];
        }

        selected.push({ 
            id: enchData.id, 
            name: enchData.name, 
            effect: enchData.effect,
            value: value, 
            tier: tier 
        });
        
        allEnchants.splice(randIndex, 1);
    }
    return selected;
  },

  // --- [NEW] SHADOW EVOLUTION LOGIC (GDD 2.2 + Drop Tables) ---
  generateShadowLoot(player, currentZoneId) {
      // 1. Pick a Random Equipment Slot to Roll On
      const slots = ['mainHand', 'offHand', 'head', 'body', 'legs', 'feet', 'hands'];
      const selectedSlot = slots[Math.floor(Math.random() * slots.length)];
      
      const instanceId = player.equipment[selectedSlot];
      const mother = instanceId ? player.inventory.find(i => i.instanceId === instanceId) : null;

      // 2. Define Drop Tables (As provided)
      const dropTables = {
          "DT2": { name: "Heavy Weapons", pool: ["sword", "axe", "scythe", "mace"], crossDrop: "DT3" },
          "DT3": { name: "Light/Ranged", pool: ["bow", "arrow", "claw"], crossDrop: "DT2" },
          "DT4": { name: "Lower Armor", pool: ["legs", "boots"], crossDrop: null },
          "DT5": { name: "Upper Armor", pool: ["helm", "gloves"], crossDrop: null },
          "DT6": { name: "Elemental Magic", pool: ["damageSpell1", "damageSpell2"], crossDrop: null },
          "DT7": { name: "Armor", pool: ["helm", "chest", "legs", "boots", "gloves"], crossDrop: null },
          "DT8": { name: "Support Magic", pool: ["buffSpell1", "buffSpell2", "healSpell1"], crossDrop: "DT6" }
      };

      // Helper to find a base item definition by Type and Tier
      const findBaseItem = (type, tier) => {
          // Check Weapons
          if (items.weapons && items.weapons[type]) {
              return Object.values(items.weapons[type]).find(i => i.tier === tier);
          }
          // Check Armor
          if (items.armor && items.armor[type]) {
              return Object.values(items.armor[type]).find(i => i.tier === tier);
          }
          // Check Magic (Arcanum)
          if (items.magic && items.magic[type]) {
               return Object.values(items.magic[type]).find(i => i.tier === tier);
          }
          return null;
      };

      let child = {};

      // SCENARIO A: Slot is Empty -> Drop Random Shadow Tier 1 for that slot
      if (!mother) {
          // Map slot to a default type
          let defaultType = 'sword'; // Fallback
          if (selectedSlot === 'head') defaultType = 'helm';
          if (selectedSlot === 'body') defaultType = 'chest';
          if (selectedSlot === 'legs') defaultType = 'legs';
          if (selectedSlot === 'feet') defaultType = 'boots';
          if (selectedSlot === 'hands') defaultType = 'gloves';
          if (selectedSlot === 'offHand') defaultType = 'shield';
          
          const baseItem = findBaseItem(defaultType, 1);
          if (!baseItem) return null;

          child = { ...baseItem };
          child.type = 'Shadow';
          child.name = `Shadow of ${baseItem.name}`;
          child.tier = 1;
          child.qualityMultiplier = 0.75 + (Math.random() * 0.75);
          child.enchantments = this.generateEnchantments(child, child.qualityMultiplier, currentZoneId);
      }
      
      // SCENARIO B: Mother is a Shadow -> Drop Echo (Exact Weak Copy)
      else if (mother.type === 'Shadow') {
          child = { ...mother };
          child.type = 'Echo';
          child.name = `Echo of ${mother.name}`;
          child.qualityMultiplier = 0.5; // Fixed Weakness
          child.enchantments = []; // Echoes lose enchants? Or keep them? Assuming lose for now based on "Weak Copy"
          
          // Tier Rule: Random 1 to Mother-1
          if (mother.tier > 1) {
             const maxTier = mother.tier - 1;
             child.tier = Math.floor(Math.random() * maxTier) + 1;
             // Re-fetch base item stats for the new lower tier to ensure stats align
             const downgradedBase = findBaseItem(mother.subType || 'sword', child.tier); // assuming subType exists or derived
             if (downgradedBase) {
                 child.wc = downgradedBase.wc;
                 child.ac = downgradedBase.ac;
                 child.sc = downgradedBase.sc;
             }
          } else {
             child.tier = 1;
          }
      }

      // SCENARIO C: Mother is a Dropper -> Drop Shadow (Cross-Drop Enabled)
      else if (mother.type === 'Dropper' || !mother.type) {
          // 1. Determine which Drop Table to use
          // We infer the DT based on the mother's type
          let dtKey = null;
          for (const [key, dt] of Object.entries(dropTables)) {
              if (dt.pool.includes(mother.subType) || dt.pool.includes(mother.itemType)) { // Check flexible type props
                  dtKey = key;
                  break;
              }
          }
          // Fallback if no DT found, use generic pool based on slot?
          // Using the mother's own type as default pool if no DT match
          const pool = dtKey ? dropTables[dtKey].pool : [mother.subType || 'sword'];
          
          // 2. Pick Type from Pool (Cross-Drop Logic)
          // Simple logic: Pick any item from the pool
          const newType = pool[Math.floor(Math.random() * pool.length)];
          
          // 3. Determine Tier (X or X-1)
          let newTier = mother.tier;
          if (mother.tier > 1 && Math.random() < 0.5) newTier -= 1;

          // 4. Fetch the actual Item Data for this Type + Tier
          const baseItem = findBaseItem(newType, newTier);
          if (!baseItem) return null; // Should not happen if data is complete

          child = { ...baseItem };
          child.type = 'Shadow';
          child.name = `Shadow of ${baseItem.name}`;
          child.tier = newTier;
          child.qualityMultiplier = 0.75 + (Math.random() * 0.75);
          child.enchantments = this.generateEnchantments(child, child.qualityMultiplier, currentZoneId);
      }
      
      if (!child.name) return null;

      // Finalize Instance ID
      child.instanceId = `${child.baseItemId || 'GEN'}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      child.sockets = []; // Reset sockets

      return child;
  },

  generateLoot(player, monster, currentZoneId) {
    const lootMessages = [];
    
    // --- DEV OVERRIDE CHECK ---
    const isDevMode = window.DEV_FORCE_DROPS === true;
    if (isDevMode) lootMessages.push(`<span class="text-yellow-400 font-bold">⚠️ DEV MODE: DROPS FORCED</span>`);

    // --- 1. GET ZONE DATA ---
    const zone = Array.isArray(zones) 
        ? zones.find(z => z.id === currentZoneId) 
        : (zones && zones[currentZoneId] ? zones[currentZoneId] : null);

    const zoneMult = (zone && typeof zone.goldMultiplier === 'number') ? zone.goldMultiplier : 1.0;

    // --- 2. GOLD & XP ---
    let netGold = Math.floor((typeof monster.gold === 'number' ? monster.gold : 0) * zoneMult);
    let netXp = Math.floor((typeof monster.xp === 'number' ? monster.xp : 0) * zoneMult);
    
    if (player.soulDebt && (player.soulDebt.gold > 0 || player.soulDebt.xp > 0)) {
        const titheRate = 0.50; 
        const goldTithe = Math.min(player.soulDebt.gold, Math.floor(netGold * titheRate));
        const xpTithe = Math.min(player.soulDebt.xp, Math.floor(netXp * titheRate));
        player.soulDebt.gold -= goldTithe; player.soulDebt.xp -= xpTithe;
        netGold -= goldTithe; netXp -= xpTithe;
        if (goldTithe > 0 || xpTithe > 0) lootMessages.push(`Soul Tithe: Paid ${goldTithe} Gold & ${xpTithe} XP.`);
        if (player.soulDebt.gold <= 0 && player.soulDebt.xp <= 0) {
            lootMessages.push(`✨ SOUL DEBT CLEARED!`);
            player.soulDebt = null; 
        }
    }

    player.gold = (player.gold || 0) + netGold;
    player.xp = (player.xp || 0) + netXp;
    lootMessages.push(`Earned ${netXp} XP & ${netGold} Gold.`);

    // --- 3. GEM DROPS ---
    const rateValGem = (zone && typeof zone.gemDropRate === 'number') ? zone.gemDropRate : 600;
    const GEM_CHANCE = 1 / rateValGem;
    
    // [DEV] If isDevMode is true, we skip the RNG check
    if (isDevMode || Math.random() < GEM_CHANCE) {
        if (gems && gems.base_gems) {
             const allGems = [];
             if (gems.base_gems.lorestone) allGems.push(...Object.values(gems.base_gems.lorestone));
             if (gems.base_gems.warstone) allGems.push(...Object.values(gems.base_gems.warstone));
             if (gems.base_gems.obsidian) allGems.push(...Object.values(gems.base_gems.obsidian));
             
             if (allGems.length > 0) {
                const weightsStr = (zone && zone.gemGradeWeights) ? zone.gemGradeWeights : "100";
                const weights = weightsStr.split(',').map(Number);
                const totalWeight = weights.reduce((a,b) => a+b, 0);
                let randomWeight = Math.random() * totalWeight;
                let selectedGradeIndex = 0;
                for (let i = 0; i < weights.length; i++) {
                    randomWeight -= weights[i];
                    if (randomWeight <= 0) { selectedGradeIndex = i; break; }
                }
                const gradeGems = allGems.filter(g => g.grade === (selectedGradeIndex + 1));
                const pool = gradeGems.length > 0 ? gradeGems : allGems; 
                const randomGem = pool[Math.floor(Math.random() * pool.length)];
                const gemDrop = { ...randomGem, instanceId: `GEM_${Date.now()}` };
                player.inventory.push(gemDrop);
                lootMessages.push(`Loot: ${gemDrop.name}`);
             }
        }
    }

    // --- 4. SHADOW/ECHO DROPS ---
    const rateValShadow = (zone && typeof zone.shadowDropRate === 'number') ? zone.shadowDropRate : 250;
    const SHADOW_CHANCE = 1 / rateValShadow;

    // [DEV] If isDevMode is true, we skip the RNG check
    if (isDevMode || Math.random() < SHADOW_CHANCE) {
        const drop = this.generateShadowLoot(player, currentZoneId);
        if (drop) {
            player.inventory.push(drop);
            if (drop.type === 'Shadow') {
                const qmPct = Math.round((drop.qualityMultiplier - 1) * 100);
                const enchCount = drop.enchantments ? drop.enchantments.length : 0;
                lootMessages.push(`Shadow Found: ${drop.name} (+${qmPct}%) [${enchCount} Enchants]`);
            } else if (drop.type === 'Echo') {
                lootMessages.push(`Echo of ${drop.name} manifested!`);
            }
        }
    }

    // --- 5. LEVEL UP CHECK ---
    const XP_BASE = (gddConstants && gddConstants.XP_BASE) || 200;
    const XP_GROWTH = (gddConstants && gddConstants.XP_GROWTH_RATE) || 1.5;
    const virtualLevel = player.level + (player.attributePoints || 0);
    const xpReq = Math.floor(XP_BASE * Math.pow(XP_GROWTH, virtualLevel));
        
    if (player.xp >= xpReq) {
         player.xp -= xpReq; 
         player.attributePoints = (player.attributePoints || 0) + 1;
         if (player.derivedStats) player.derivedStats.hp = player.derivedStats.maxHp; 
         lootMessages.push(`🌟 LEVEL UP AVAILABLE!`);
    } else {
         player.xpToNextLevel = xpReq;
    }

    return lootMessages;
  }
};

export default Systems;