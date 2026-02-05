// src/utils/systems.js
import { races, progression, items, gddConstants, bestiary, gems, zones, enchantments } from '../config/gdd.js';

// --- SAFETY UTILS ---
// Prevents "undefined * 5 = NaN" errors
const safeVal = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;
const safeMult = (val, mult) => safeVal(val) * safeVal(mult);

// [ARCHITECT FIX] Helper to find an item by ID in the FLAT Master Registry
function findItemById(itemId) {
  if (!items || !itemId) return null;
  // Direct lookup because 'items' is now a flat object { "Axe-1": {...}, ... }
  return items[itemId];
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

    // 1. Process Equipment Stats (ARCHITECT FIX)
    // We check 'equipped' (New System) first, then 'equipment' (Legacy)
    const equipmentSource = player.equipped || player.equipment || {};

    // Iterate through all equipped items
    Object.values(equipmentSource).forEach(entry => {
        let item = entry;

        // Legacy Support: If entry is just an ID string, try to find it in inventory
        // (Note: In the new system, items are removed from inventory, so this is just a fallback)
        if (typeof item === 'string') {
             item = player.inventory ? player.inventory.find(i => i.instanceId === item || i.uuid === item) : null;
        }

        if (!item || typeof item !== 'object') return;

        // Resolve Base Item (Source of Truth for Stats)
        const baseItem = findItemById(item.baseItemId || item.id) || {};
        
        // Merge Instance + Base to get the most accurate data
        // Priority: Item Instance > Base Item
        const statsItem = { ...baseItem, ...item };

        // [CRITICAL] Apply Quality Multiplier
        // If the item has a specific multiplier, use it. Otherwise default to 1.0.
        const qm = safeVal(item.qualityMultiplier) || 1.0; 
        
        // Calculate Stats (Base Stat * Quality)
        // We use baseItem stats for the multiplication to avoid double-scaling if item.wc is already scaled
        const wc = baseItem.wc !== undefined ? baseItem.wc : (item.wc || 0);
        const ac = baseItem.ac !== undefined ? baseItem.ac : (item.ac || 0);
        const sc = baseItem.sc !== undefined ? baseItem.sc : (item.sc || 0);

        totalGearWC += safeMult(wc, qm);
        totalGearAC += safeMult(ac, qm);
        totalGearSC += safeMult(sc, qm);
        
        // Apply Bonuses
        if (statsItem.wc_bonus) bonusWcScMultiplier += safeVal(statsItem.wc_bonus);
        if (statsItem.sc_bonus) bonusWcScMultiplier += safeVal(statsItem.sc_bonus);
        if (statsItem.hp_regen_percent) totalHpRegenPercent += safeVal(statsItem.hp_regen_percent);
    });

    // 2. Archetype Scaling Logic
    let finalWC = 0, finalSC = 0;
    const primaryStat = racialData.primaryStat;
    const scalingStatValue = safeVal(player.baseStats?.[primaryStat]);

    const isTroll = player.race === 'Troll';
    const isVampire = player.race === 'Vampire';
    const VIT = safeVal(player.baseStats?.VIT);
    const DEX = safeVal(player.baseStats?.DEX);
    const WIS = safeVal(player.baseStats?.WIS);

    // Base Spell Power
    const basePower = 5 + (player.level * 2);

    switch (racialData.archetype) {
      case 'True Fighter':
        const fighterStat = isTroll ? VIT : scalingStatValue;
        finalWC = (totalGearWC + basePower) * (1 + (fighterStat * 0.0055));
        finalSC = totalGearSC + (basePower * 0.5); 
        break;

      case 'True Caster':
        if (totalGearSC === 0 && totalGearWC > 0) {
            totalGearSC = totalGearWC * 0.8;
        }
        const casterStat = isVampire ? VIT : scalingStatValue;
        finalSC = (totalGearSC + basePower) * (1 + (casterStat * 0.0055));
        finalWC = totalGearWC + (basePower * 0.5);
        break;
        
      case 'Hybrid':
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

  // --- [ARCHITECT FIX] SHADOW LOGIC + RESTORED DROP TABLES ---
  // PRESERVED: Drop Tables, Cross-Drop Logic, Dropper Logic.
  // UPDATED: Data access (player.equipped) and Registry Lookups (Flat List).
  generateShadowLoot(player, currentZoneId) {
      // 1. Slot Map: Maps Legacy/GDD Keys to New EquipmentManager Keys
      // We pick a key (e.g., 'mainHand'), then map it to the actual slot 'MAIN_HAND'
      const slotKeyMap = {
          'mainHand': 'MAIN_HAND',
          'offHand': 'OFF_HAND',
          'head': 'HEAD',
          'body': 'BODY',
          'legs': 'LEGS',
          'feet': 'FEET',
          'hands': 'HANDS'
      };
      
      const legacySlots = Object.keys(slotKeyMap);
      const selectedLegacySlot = legacySlots[Math.floor(Math.random() * legacySlots.length)];
      const actualSlotKey = slotKeyMap[selectedLegacySlot];
      
      // [FIX] Access the NEW equipped structure
      let mother = player.equipped ? player.equipped[actualSlotKey] : null;
      
      // Legacy support: If it's still a string ID, find the object
      if (typeof mother === 'string') {
          mother = player.inventory.find(i => i.instanceId === mother || i.uuid === mother);
      }

      // 2. DROP TABLES (YOUR ORIGINAL LOGIC RESTORED)
      const dropTables = {
          "DT2": { name: "Heavy Weapons", pool: ["Sword", "Axe", "Scythe", "Mace"], crossDrop: "DT3" },
          "DT3": { name: "Light/Ranged", pool: ["Bow", "Arrow", "Claw", "Dagger"], crossDrop: "DT2" },
          "DT4": { name: "Lower Armor", pool: ["Leggings", "Boots"], crossDrop: null },
          "DT5": { name: "Upper Armor", pool: ["Helmet", "Gloves"], crossDrop: null },
          "DT6": { name: "Elemental Magic", pool: ["Air", "Fire", "Earth", "Water"], crossDrop: null },
          "DT7": { name: "Armor", pool: ["Helmet", "Chest", "Leggings", "Boots", "Gloves"], crossDrop: null },
          "DT8": { name: "Support Magic", pool: ["Buff", "Heal"], crossDrop: "DT6" }
      };

      // [FIX] Updated Helper to find items in the new FLAT registry
      const findBaseItem = (targetType, targetTier) => {
          if (!targetType) return null;
          const lowerType = targetType.toLowerCase();
          // The new 'items' object is flat, so we search values directly
          return Object.values(items).find(i => 
              (i.type || '').toLowerCase() === lowerType && 
              i.tier === targetTier
          );
      };

      let child = {};

      // SCENARIO A: Slot is Empty -> Drop Random Shadow Tier 1 for that slot
      if (!mother) {
          // Map the legacy slot name (e.g. 'head') to a default item type (e.g. 'Helmet')
          let defaultType = 'Sword';
          if (selectedLegacySlot === 'head') defaultType = 'Helmet';
          if (selectedLegacySlot === 'body') defaultType = 'Chest';
          if (selectedLegacySlot === 'legs') defaultType = 'Leggings';
          if (selectedLegacySlot === 'feet') defaultType = 'Boots';
          if (selectedLegacySlot === 'hands') defaultType = 'Gloves';
          if (selectedLegacySlot === 'offHand') defaultType = 'Shield';

          const baseItem = findBaseItem(defaultType, 1);
          if (!baseItem) return null;

          child = { ...baseItem };
          child.type = 'Shadow';
          child.name = `Shadow of ${baseItem.name}`;
          child.tier = 1;
          child.qualityMultiplier = 0.75 + (Math.random() * 0.75);
          child.enchantments = this.generateEnchantments(child, child.qualityMultiplier, currentZoneId);
      }
      
      // SCENARIO B: Mother is a Shadow -> Drop Echo
      else if (mother.type === 'Shadow') {
          child = { ...mother };
          child.type = 'Echo';
          child.name = `Echo of ${mother.name}`;
          child.qualityMultiplier = 0.5;
          child.enchantments = []; 
          
          if (mother.tier > 1) {
             const maxTier = mother.tier - 1;
             child.tier = Math.floor(Math.random() * maxTier) + 1;
             const downgradedBase = findBaseItem(mother.type, child.tier); 
             if (downgradedBase) {
                 child.wc = downgradedBase.wc;
                 child.ac = downgradedBase.ac;
                 child.sc = downgradedBase.sc;
             }
          } else {
             child.tier = 1;
          }
      }

      // SCENARIO C: Mother is Dropper OR Standard -> Use Drop Tables
      else {
          // 1. Determine Drop Table based on Mother's Type
          let dtKey = null;
          const mType = mother.type || mother.subType || '';
          
          for (const [key, dt] of Object.entries(dropTables)) {
              // Case-insensitive check against pool
              if (dt.pool.some(t => t.toLowerCase() === mType.toLowerCase())) {
                  dtKey = key;
                  break;
              }
          }

          // 2. Select Pool (Cross-Drop logic handles here if needed, or we just pick from pool)
          // Note: Your original code selected the CrossDrop table if the mother was a "Dropper".
          // Since "Dropper" isn't a type in the new system (it's handled by 'Unknown' fix),
          // we assume ANY matched table is valid.
          const pool = dtKey ? dropTables[dtKey].pool : [mType];
          
          // 3. Pick Type from Pool
          const newType = pool[Math.floor(Math.random() * pool.length)];
          
          // 4. Determine Tier
          let newTier = mother.tier || 1;
          if (newTier > 1 && Math.random() < 0.5) newTier -= 1;

          // 5. Fetch Data
          let baseItem = findBaseItem(newType, newTier);
          
          // Safety Fallback
          if (!baseItem) baseItem = findBaseItem(mType, newTier);
          if (!baseItem) return null;

          child = { ...baseItem };
          child.type = 'Shadow';
          child.name = `Shadow of ${child.name}`;
          child.tier = newTier;
          child.qualityMultiplier = 0.75 + (Math.random() * 0.75);
          child.enchantments = this.generateEnchantments(child, child.qualityMultiplier, currentZoneId);
      }
      
      if (!child.name) return null;

      child.instanceId = `${child.baseItemId || 'GEN'}_SHADOW_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      child.sockets = []; 

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