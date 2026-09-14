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

// [NEW] Universal Enchantment Value Calculator (Handles arrays and min/max pairs)
function getEnchantmentValue(enchData, magicTier) {
    if (enchData.tiers && enchData.tiers.length >= magicTier) {
        return enchData.tiers[magicTier - 1]; 
    } else if (enchData.values) {
         return enchData.values[Math.min(magicTier - 1, enchData.values.length - 1)];
    } else {
        // Linearly interpolate _min and _max across 9 tiers
        const minKey = Object.keys(enchData).find(k => k.endsWith('_min'));
        if (minKey) {
            const maxKey = minKey.replace('_min', '_max');
            const minVal = enchData[minKey];
            const maxVal = enchData[maxKey];
            const val = minVal + ((maxVal - minVal) / 8) * (magicTier - 1);
            return Number(val.toFixed(2));
        }
    }
    return magicTier; // fallback
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
    let gearWcMain = 0, gearWcOff = 0;
    let gearScMain = 0, gearScOff = 0;
    let bonusHitChance = 0;
    let bonusWcScMultiplier = 1.0;
    let bonusAcMultiplier = 1.0; // [NEW] Support for 'Guard' buff % bonus
    let totalHpRegenPercent = 0;
    let gearVit = 0, gearDex = 0, gearWis = 0; // [NEW] Gear-based attribute bonuses

    // 1. Process Equipment Stats (ARCHITECT FIX)
    const equipmentSource = player.equipped || player.equipment || {};

    Object.entries(equipmentSource).forEach(([slotKey, entry]) => {
        let item = entry;
        if (typeof item === 'string') {
             item = player.inventory ? player.inventory.find(i => i.instanceId === item || i.uuid === item) : null;
        }

        if (!item || typeof item !== 'object') return;

        const baseItem = findItemById(item.baseItemId || item.id) || {};
        const statsItem = { ...baseItem, ...item };
        const qm = safeVal(item.qualityMultiplier) || 1.0; 
        
        // Accumulate Base Stats * Quality
        const itemWc = safeMult(baseItem.wc || item.wc || 0, qm);
        const itemSc = safeMult(baseItem.sc || item.sc || 0, qm);
        
        if (slotKey === 'MAIN_HAND') gearWcMain += itemWc;
        else if (slotKey === 'OFF_HAND') gearWcOff += itemWc;
        else { gearWcMain += itemWc; gearWcOff += itemWc; } // Flat WC from armor applies to both

        if (slotKey === 'SPELL_1') gearScMain += itemSc;
        else if (slotKey === 'SPELL_2') gearScOff += itemSc;
        else { gearScMain += itemSc; gearScOff += itemSc; } // Flat SC from armor applies to both

        totalGearAC += safeMult(baseItem.ac || item.ac || 0, qm);
        
        // [NEW] Accumulate % Bonuses from Buff Spells (Might/Guard/Swiftness)
        if (statsItem.wc_bonus) bonusWcScMultiplier += safeVal(statsItem.wc_bonus);
        if (statsItem.sc_bonus) bonusWcScMultiplier += safeVal(statsItem.sc_bonus);
        if (statsItem.ac_bonus) bonusAcMultiplier += safeVal(statsItem.ac_bonus);
        if (statsItem.hit_chance_bonus) bonusHitChance += safeVal(statsItem.hit_chance_bonus);

        // [NEW] Accumulate Flat Attribute Bonuses from Gear
        if (statsItem.vit) gearVit += safeVal(statsItem.vit) * qm;
        if (statsItem.dex) gearDex += safeVal(statsItem.dex) * qm;
        if (statsItem.ntl || statsItem.wis) gearWis += safeVal(statsItem.ntl || statsItem.wis) * qm;
        
        if (statsItem.hp_regen_percent) totalHpRegenPercent += safeVal(statsItem.hp_regen_percent);
    });

    // 2. Combined Scaling Logic (Base Stats + Gear Attributes)
    const VIT = safeVal(player.baseStats?.VIT) + gearVit;
    const DEX = safeVal(player.baseStats?.DEX) + gearDex;
    const WIS = safeVal(player.baseStats?.WIS) + gearWis;
    const STR = safeVal(player.baseStats?.STR); 
    const NTL = safeVal(player.baseStats?.NTL);

    let finalWcMain = 0, finalWcOff = 0, finalScMain = 0, finalScOff = 0;
    const isTroll = player.race === 'Troll';
    const isVampire = player.race === 'Vampire';
    // [ARCHITECT FIX] Flattened biological scaling. Gear is King.
    const basePower = 5;

    // [ARCHITECT FIX] Stat Decoupling & Damage DR (The Gear Wall)
    let primaryRating = 0;   // Used for Hit Contest & Precision Overflow
    let secondaryRating = 0; // Used for Damage Multiplier

    if (isTroll) { primaryRating = VIT; secondaryRating = STR; }
    else if (isVampire) { primaryRating = VIT; secondaryRating = NTL; }
    else if (racialData.archetype === 'True Fighter' || racialData.subArchetype === 'Martial Hybrid') { primaryRating = DEX; secondaryRating = STR; }
    else if (racialData.archetype === 'True Caster' || racialData.subArchetype === 'Mystic Hybrid') { primaryRating = WIS; secondaryRating = NTL; }
    else { primaryRating = Math.max(DEX, WIS); secondaryRating = Math.max(STR, NTL); }

    // [ARCHITECT FIX] Diminishing Returns Damage Multiplier based on Secondary Stat
    // Formula: 1 + ((Secondary_Stat ^ 0.5) * 0.005) - Hard square root curve
    const dmgMultiplier = 1 + (Math.pow(secondaryRating, 0.5) * 0.005);

    if (racialData.archetype === 'True Fighter' || isTroll) {
        finalWcMain = (gearWcMain + basePower) * dmgMultiplier;
        finalWcOff = gearWcOff > 0 ? (gearWcOff + basePower) * dmgMultiplier : 0;
        finalScMain = gearScMain + (basePower * 0.5); 
        finalScOff = gearScOff > 0 ? gearScOff + (basePower * 0.5) : 0;
    } else if (racialData.archetype === 'True Caster' || isVampire) {
        finalScMain = (gearScMain + basePower) * dmgMultiplier;
        finalScOff = gearScOff > 0 ? (gearScOff + basePower) * dmgMultiplier : 0;
        finalWcMain = gearWcMain + (basePower * 0.5);
        finalWcOff = gearWcOff > 0 ? gearWcOff + (basePower * 0.5) : 0;
    } else {
        finalWcMain = (gearWcMain + basePower) * dmgMultiplier;
        finalWcOff = gearWcOff > 0 ? (gearWcOff + basePower) * dmgMultiplier : 0;
        finalScMain = (gearScMain + basePower) * dmgMultiplier;
        finalScOff = gearScOff > 0 ? (gearScOff + basePower) * dmgMultiplier : 0;
    }

    // Apply Buff Multipliers
    finalWcMain = Math.max(1, finalWcMain * bonusWcScMultiplier);
    finalWcOff = gearWcOff > 0 ? Math.max(1, finalWcOff * bonusWcScMultiplier) : 0;
    finalScMain = Math.max(1, finalScMain * bonusWcScMultiplier);
    finalScOff = gearScOff > 0 ? Math.max(1, finalScOff * bonusWcScMultiplier) : 0;

    // 3. Derived Combat Values
    player.derivedStats.maxHp = 100 + (VIT * 10);
    // [ARCHITECT FIX] Defensive multiplier shifted to square root curve matching offense
    player.derivedStats.AC = totalGearAC * (1 + (Math.pow(VIT, 0.5) * 0.005)) * bonusAcMultiplier;
    
    // [ARCHITECT FIX] Split hand stats for Dual-Strike engine
    player.derivedStats.WC_1 = Math.floor(finalWcMain);
    player.derivedStats.WC_2 = Math.floor(finalWcOff);
    player.derivedStats.SC_1 = Math.floor(finalScMain);
    player.derivedStats.SC_2 = Math.floor(finalScOff);
    
    // UI Visual Aggregation (Legacy UI Mapping)
    player.derivedStats.WC = Math.floor(finalWcMain + finalWcOff);
    player.derivedStats.SC = Math.floor(finalScMain + finalScOff);
    
    // Export Primary Stat for dynamic combat calculations
    player.derivedStats.accuracyRating = primaryRating; 

    // UI Baselines (Dynamic calculation occurs per-swing in resolveCombatTurn)
    player.derivedStats.hitChance = 75 + (bonusHitChance * 100); 
    player.derivedStats.critChance = 5;

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

    // [ARCHITECT FIX] Base Evasion Injection
    // Serves as the mathematical floor before Tier multipliers are applied
    baseMonster.evasion = safeVal(baseMonster.evasion) || 50;

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
    // [ARCHITECT FIX] Evasion Scaling Rate (Scales aggressively to match player AP growth)
    const EVASION_RATE = gddConstants?.MONSTER_SCALING_EVASION_RATE || 1.35; 

    baseMonster.hp *= Math.pow(HP_RATE, tierDiff);
    baseMonster.atk *= Math.pow(ATK_RATE, tierDiff);
    baseMonster.def *= Math.pow(DEF_RATE, tierDiff);
    baseMonster.xp *= Math.pow(REWARD_RATE, tierDiff);
    baseMonster.gold *= Math.pow(REWARD_RATE, tierDiff);
    baseMonster.evasion *= Math.pow(EVASION_RATE, tierDiff);

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
    
    // [ARCHITECT FIX] Dual-Strike Stat Splitting
    let stat1 = 0, stat2 = 0;
    if (actionType === 'cast') {
        stat1 = safeVal(pStats.SC_1);
        stat2 = safeVal(pStats.SC_2);
    } else if (actionType === 'spellstrike') {
        stat1 = Math.max(safeVal(pStats.WC_1), safeVal(pStats.SC_1)) * 1.1; 
        stat2 = Math.max(safeVal(pStats.WC_2), safeVal(pStats.SC_2)) * 1.1; 
    } else {
        // Default / Attack
        stat1 = safeVal(pStats.WC_1);
        stat2 = safeVal(pStats.WC_2);
    }

    const DAMAGE_CONST = gddConstants?.PLAYER_DAMAGE_CONSTANT || 25;
    const monsterEvasion = Math.max(1, monster.evasion || monster.def || 10); 
    const playerAccuracy = safeVal(pStats.accuracyRating);
    
    // Global Hit Score & Precision Overflow
    const gearHitBonus = Math.max(0, (pStats.hitChance || 75) - 75);
    const hitScore = 75 + ((playerAccuracy / monsterEvasion) * 15) + gearHitBonus;
    
    let finalHitChance = Math.min(100, hitScore);
    let precisionBonus = hitScore > 100 ? hitScore - 100 : 0;
    const baseCritMult = pStats.critDamage || 2.0;

    // Helper function to resolve an independent strike
    const processStrike = (strikeStat) => {
        if (strikeStat <= 0) return { dmg: 0, hit: false, crit: false, double: false };
        
        let dmg = (DAMAGE_CONST * strikeStat) / monsterAC;
        dmg = Math.max(1, dmg);

        const hit = (Math.random() * 100) <= finalHitChance;
        if (!hit) return { dmg: 0, hit: false, crit: false, double: false };

        const crit = (Math.random() * 100 < (pStats.critChance || 5));
        const critMultiplier = crit ? (baseCritMult + (precisionBonus * 0.01)) : 1.0;
        dmg *= critMultiplier;

        const double = (Math.random() * 100 < (pStats.doubleHitChance || 0));
        if (double) dmg *= 2;

        return { dmg, hit, crit, double };
    };

    // Execute independent Dual Strikes
    const strike1 = processStrike(stat1);
    const strike2 = processStrike(stat2);

    playerDamage = strike1.dmg + strike2.dmg;

    // [DEV TRACKING] Log the isolated hits to the F12 Console
    console.log(`[Dual-Strike] Hand 1 DMG: ${Math.floor(strike1.dmg)} | Hand 2 DMG: ${Math.floor(strike2.dmg)}`);

    // Apply to monster
    monster.currentHP = Math.max(0, monster.currentHP - playerDamage);

    if (monster.currentHP <= 0) return { 
        status: 'VICTORY', 
        player, 
        monster, 
        damageDealt: playerDamage,
        strike1,
        strike2
    };

    // --- [ARCHITECT FIX] MONSTER COUNTER-ATTACK (DIVISION CURVE) ---
    // Mirrors player damage math to prevent 0-damage invincibility loops
    const AC_FACTOR = gddConstants?.MONSTER_DAMAGE_AC_REDUCTION_FACTOR || 1.0;
    const effectivePlayerAC = Math.max(1, safeVal(pStats.AC) * AC_FACTOR);
    
    // Formula: (Constant * Monster_ATK) / Player_AC
    let monsterDamage = (DAMAGE_CONST * monster.atk) / effectivePlayerAC;
    
    // Ensure monster damage is a number and minimum 1
    monsterDamage = Math.max(1, isNaN(monsterDamage) ? 1 : monsterDamage);

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
        isCrit: strike1.crit || strike2.crit,
        isDoubleHit: strike1.double || strike2.double,
        strike1,
        strike2
    };
  },

  simulateCombat(player, monster) {
    // Basic simulation logic preserved but not used in manual mode
    return { outcome: 'VICTORY', finalState: { player, monster }, log: [] };
  },

  // --- [ARCHITECT FIX] ENCHANTMENT GENERATOR (GDD 2.4) ---
  // Updated: Uses Item Tier instead of Zone Level for scaling.
  generateEnchantments(item, qm, zoneId) {
    let count = 0;
    
    // [TWEAK] Boosted count logic for high quality
    if (qm >= 1.5) count = 4;        
    else if (qm >= 1.25) count = Math.floor(Math.random() * 2) + 2; // 2-3
    else if (qm >= 1.15) count = 2; // Guarantee 2 for decent Shadows (+15%+)
    else if (qm >= 1.00) count = Math.floor(Math.random() * 2) + 1; // 1-2
    else count = Math.random() < 0.5 ? 1 : 0; 

    if (count === 0 || !enchantments) return [];

    // [FIX] Scale Magic Tier based on ITEM TIER (The 2.25 Rule)
    // Example: Tier 20 Item / 2.25 = 8.88 -> Tier 9 Magic
    const itemTier = item.tier || 1;
    let magicTier = Math.ceil(itemTier / 2.25);
    
    // Clamp Tier between 1 and 9
    magicTier = Math.max(1, Math.min(9, magicTier));

    const selected = [];
    const allEnchants = [];
    
    // Gather all possible enchants
    if (enchantments.caster) allEnchants.push(...Object.values(enchantments.caster));
    if (enchantments.fighter) allEnchants.push(...Object.values(enchantments.fighter));
    if (enchantments.support) allEnchants.push(...Object.values(enchantments.support));

    for (let i = 0; i < count; i++) {
        if (allEnchants.length === 0) break;
        const randIndex = Math.floor(Math.random() * allEnchants.length);
        const enchData = allEnchants[randIndex];
        
        let value = 0;
        // Logic to pull the correct value for the calculated Magic Tier
        if (enchData.tiers && enchData.tiers.length >= magicTier) {
            value = enchData.tiers[magicTier - 1]; 
        } else if (enchData.values) {
             value = enchData.values[Math.min(magicTier - 1, enchData.values.length - 1)];
        }

        selected.push({ 
            id: enchData.id, 
            name: enchData.name, 
            effect: enchData.effect, // Pass the Effect Name (e.g. "Strength")
            value: value, 
            tier: magicTier 
        });
        
        allEnchants.splice(randIndex, 1);
        }
        return selected;
  },

  // --- [NEW] EXPOSED FOR SOULFORGE REROLLING ---
  rerollEnchantment(item, currentStatKeys) {
      if (!enchantments) return null;

      const itemTier = item.tier || 1;
      let magicTier = Math.ceil(itemTier / 2.25);
      magicTier = Math.max(1, Math.min(9, magicTier));

      const allEnchants = [];
      if (enchantments.caster) allEnchants.push(...Object.values(enchantments.caster));
      if (enchantments.fighter) allEnchants.push(...Object.values(enchantments.fighter));
      if (enchantments.support) allEnchants.push(...Object.values(enchantments.support));

      // Filter out existing enchants (checking both effect and formatted name for safety)
      const potential = allEnchants.filter(ench => {
          const nameKey = ench.name.toLowerCase().replace(/ /g, '');
          return !currentStatKeys.includes(ench.effect) && !currentStatKeys.includes(nameKey);
      });

      const pool = potential.length > 0 ? potential : allEnchants;
      const randIndex = Math.floor(Math.random() * pool.length);
      const enchData = pool[randIndex];

      const value = getEnchantmentValue(enchData, magicTier);

      return {
          key: enchData.effect || ench.name, // Use effect as the primary key for the UI
          name: enchData.name,
          effect: enchData.effect,
          value: value,
          tier: magicTier
      };
  },

// --- [ARCHITECT FIX] SHADOW DROP SYSTEM ---
  // Implements: 3x Weighted Target Farming, Echo Degradation, Floor at Tier 1
  generateShadowLoot(player, currentZoneId) {
      // 1. Select Slot (Updated to include Spells & Jewelry)
      const slotKeyMap = {
          'mainHand': 'MAIN_HAND', 'offHand': 'OFF_HAND', 'head': 'HEAD',
          'body': 'BODY', 'legs': 'LEGS', 'feet': 'FEET', 'hands': 'HANDS',
          'spell1': 'SPELL_1', 'spell2': 'SPELL_2',
          'neck': 'NECK', 'ring': 'RING_1' // Updated to match EquipmentManager
      };
      
      const legacySlots = Object.keys(slotKeyMap);
      const selectedLegacySlot = legacySlots[Math.floor(Math.random() * legacySlots.length)];
      const actualSlotKey = slotKeyMap[selectedLegacySlot];
      
      let mother = player.equipped ? player.equipped[actualSlotKey] : null;
      // Legacy support for string IDs
      if (typeof mother === 'string') {
          mother = player.inventory.find(i => i.instanceId === mother || i.uuid === mother);
      }

      // [ARCHITECT FIX] Normalize type WITHOUT underscores so it matches dropTables spaces
      const rawMotherType = mother ? (mother.type || mother.subType || '') : '';
      const normalizedMotherType = rawMotherType.toLowerCase().trim();

      // Hardcoded Drop Tables (Mapped to match your dropTables.js)
      const dropTables = {
          "DT2": { name: "Fighter Weapons", pool: ["axe", "bow", "arrow", "claw", "dagger", "mace", "sword", "staff"], crossDrop: null },
          "DT3": { name: "Upper Armor", pool: ["helm", "gloves"], crossDrop: null },
          "DT4": { name: "Armor", pool: ["chest"], crossDrop: null },
          "DT5": { name: "Lower Armor", pool: ["legs", "boots"], crossDrop: null },
          "DT6": { name: "Elemental Magic", pool: ["air", "arcane", "cold", "death", "drain", "earth", "fire" ], crossDrop: null },
          "DT7": { name: "Caster Weapons", pool: ["caster off hand", "shield" ], crossDrop: "DT7" },
          "DT8": { name: "Support Magic", pool: ["might", "guard", "swiftness"], crossDrop: "DT8" },
          "DT9": { name: "Jewelry", pool: ["necklace", "ring"], crossDrop: null }
      };

      // [ARCHITECT FIX] Helper to find base items. Now correctly checks subType too!
      const findBaseItem = (targetType, targetTier) => {
          if (!targetType) return null;
          const lowerType = targetType.toLowerCase().trim();
          return Object.values(items).find(i => 
              ((i.type || '').toLowerCase().trim() === lowerType || (i.subType || '').toLowerCase().trim() === lowerType) && 
              i.tier === targetTier
          );
      };

      let child = {};
      
      // SCENARIO A: EMPTY SLOT -> Tier 1 Shadow
      if (!mother) {
          let defaultType = 'Sword';
          // Physical Gear
          if (selectedLegacySlot === 'head') defaultType = 'Helmet';
          if (selectedLegacySlot === 'body') defaultType = 'Chest';
          if (selectedLegacySlot === 'legs') defaultType = 'Leggings';
          if (selectedLegacySlot === 'feet') defaultType = 'Boots';
          if (selectedLegacySlot === 'hands') defaultType = 'Gloves';
          if (selectedLegacySlot === 'offHand') defaultType = 'Shield';
          // New Slots
          if (selectedLegacySlot === 'spell1' || selectedLegacySlot === 'spell2') defaultType = 'Fire';
          if (selectedLegacySlot === 'neck') defaultType = 'Necklace';
          if (selectedLegacySlot === 'ring') defaultType = 'Ring';

          const baseItem = findBaseItem(defaultType, 1);
          if (!baseItem) return null;

          child = { ...baseItem };
          child.isShadow = true;
          child.rarity = 'Shadow';
          child.name = `Shadow of ${baseItem.name}`;
          child.tier = 1;
          child.qualityMultiplier = 0.75 + (Math.random() * 0.75); // 75% - 150%
          child.enchantments = this.generateEnchantments(child, child.qualityMultiplier);
          child.category = baseItem.category || 'Misc';
          child.type = baseItem.type || 'Misc';
          
          // [ARCHITECT FIX] Array required for InventoryManager .map()
          child.maxSockets = 2;
          child.sockets = []; // [ARCHITECT FIX] Must be empty array
          child.socketedGems = [];
      }
      
      // SCENARIO B: MOTHER IS SHADOW or ECHO -> Drops ECHO
      // Logic: Drops Echo of [Mother Name]. Tier Random(1 to Current-1). Floor 1.
      else if (mother.isShadow || mother.isEcho) {
          // 1. Determine New Tier
          let newTier = 1;
          if (mother.tier > 1) {
              // Random between 1 and (MotherTier - 1)
              newTier = Math.floor(Math.random() * (mother.tier - 1)) + 1;
          } else {
              // Floor: Tier 1 drops Tier 1
              newTier = 1;
          }
          
          // 2. Fetch Base Stats for new Tier
          let baseItem = findBaseItem(mother.type, newTier);
          if (!baseItem) baseItem = mother; // Fallback

          child = { ...baseItem };
          child.tier = newTier;
          child.isEcho = true;
          child.rarity = 'Echo';
          child.name = `Echo of ${baseItem.name}`;
          
          // 3. Stats: Fixed 50% of Base Item
          child.qualityMultiplier = 0.5; 
          child.category = baseItem.category || mother.category;
          child.type = baseItem.type || mother.type;

          // 4. Enchants: Inherit from Mother, slashed by 50%
          child.enchantments = (mother.enchantments || []).map(e => ({
              ...e,
              value: safeVal(e.value) * 0.5 // Slash power
          }));
          
          // [ARCHITECT FIX] Inherit Mother's sockets (ensure array fallback)
          child.sockets = Array.isArray(mother.sockets) ? mother.sockets : [null, null];
          child.socketedGems = [];
      }

      // SCENARIO C: STANDARD ITEM ("Dropper") -> Drops SHADOW
      // Logic: 3x Weighted Drop Table -> Current/-1 Tier -> High Stats
      else {
          // 1. Identify Drop Table
          let dtKey = null;
          
          for (const [key, dt] of Object.entries(dropTables)) {
              // [ARCHITECT FIX] Checking against normalized spaces, no underscores
              if (dt.pool.some(t => t.toLowerCase().trim() === normalizedMotherType)) {
                  dtKey = key;
                  break;
              }
          }

          // 2. Build Weighted Pool (Target Farming: 3x Chance for Mother Type)
          const pool = dtKey ? dropTables[dtKey].pool : [normalizedMotherType];
          const weightedPool = [];
          
          pool.forEach(type => {
              const normalizedPoolType = type.toLowerCase().trim();
              if (normalizedPoolType === normalizedMotherType) {
                  weightedPool.push(type, type, type); // 3 Tickets for Mother
              } else {
                  weightedPool.push(type); // 1 Ticket for others
              }
          });
          
          const newType = weightedPool[Math.floor(Math.random() * weightedPool.length)];
          
          // 3. Determine Tier (Current or -1)
          let newTier = mother.tier || 1;
          if (newTier > 1 && Math.random() < 0.5) newTier -= 1;

          const baseItem = findBaseItem(newType, newTier);
          if (!baseItem) return null;

          child = { ...baseItem };
          child.tier = newTier;
          child.isShadow = true;
          child.rarity = 'Shadow';
          child.name = `Shadow of ${baseItem.name}`;
          child.qualityMultiplier = 0.75 + (Math.random() * 0.75); // 75-150%
          child.enchantments = this.generateEnchantments(child, child.qualityMultiplier);
          child.category = baseItem.category || 'Misc';
          child.type = baseItem.type || 'Misc';
          
          // [ARCHITECT FIX] Array required for InventoryManager .map()
          child.sockets = [null, null];
          child.socketedGems = [];
      }
      
      child.uuid = crypto.randomUUID(); // Ensures compatibility with Equipment & Inventory Managers
      child.instanceId = `${child.baseItemId || 'GEN'}_${child.isEcho ? 'ECHO' : 'SHADOW'}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      
      // [ARCHITECT FIX] Restore Strict Schema (Integer Capacity, Array Contents)
      child.sockets = 2; 
      child.socketedGems = Array.isArray(child.socketedGems) ? child.socketedGems.filter(gem => gem !== null && !gem.isEmpty) : [];
      
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
    
    // --- 3. SOUL DEBT TITHE SYSTEM (Refined) ---
    // Per GDD 3.5.2: 50% Tithe on all future Gold and XP gains.
    if (player.soulDebt && (player.soulDebt.gold > 0 || player.soulDebt.xp > 0)) {
        const TITHE_RATE = 0.50; 

        // Process Gold Tithe (Use Math.ceil to prevent 0-tithe exploits on small gains)
        if (player.soulDebt.gold > 0) {
            const potentialGoldTithe = Math.ceil(netGold * TITHE_RATE);
            const actualGoldPaid = Math.min(player.soulDebt.gold, potentialGoldTithe);
            
            player.soulDebt.gold -= actualGoldPaid;
            netGold -= actualGoldPaid;
            if (actualGoldPaid > 0) lootMessages.push(`Soul Tithe: -${actualGoldPaid} Gold paid.`);
        }

        // Process XP Tithe
        if (player.soulDebt.xp > 0) {
            const potentialXpTithe = Math.ceil(netXp * TITHE_RATE);
            const actualXpPaid = Math.min(player.soulDebt.xp, potentialXpTithe);
            
            player.soulDebt.xp -= actualXpPaid;
            netXp -= actualXpPaid;
            if (actualXpPaid > 0) lootMessages.push(`Soul Tithe: -${actualXpPaid} XP paid.`);
        }

        // Finalize Debt Cleanup
        if (player.soulDebt.gold <= 0 && player.soulDebt.xp <= 0) {
            lootMessages.push(`✨ SOUL DEBT FULLY REPAID!`);
            // Reset totals so sanctuary.html progress bars clear
            player.soulDebt.gold = 0;
            player.soulDebt.xp = 0;
            player.soulDebt.goldDebtTotal = 0;
            player.soulDebt.xpDebtTotal = 0;
            
            // Persistence Handshake to update cloud state
            if (window.gameManager?.DataManager) {
                window.gameManager.DataManager.updatePlayer({ soulDebt: player.soulDebt });
            }
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
             
             // [ARCHITECT FIX] Dynamic Collection
             // Previously, you manually listed only 3 types (Lore, War, Obsidian).
             // Now, we grab ALL gem families defined in gemsData.js automatically.
             Object.values(gems.base_gems).forEach(familyGroup => {
                 allGems.push(...Object.values(familyGroup));
             });
             
             if (allGems.length > 0) {
                // 1. Determine Grade Weights based on Zone
                // (Default to equal chance if zone doesn't specify)
                const weightsStr = (zone && zone.gemGradeWeights) ? zone.gemGradeWeights : "100";
                const weights = weightsStr.split(',').map(Number);
                
                // 2. Roll for Grade
                const totalWeight = weights.reduce((a,b) => a+b, 0);
                let randomWeight = Math.random() * totalWeight;
                let selectedGradeIndex = 0;
                for (let i = 0; i < weights.length; i++) {
                    randomWeight -= weights[i];
                    if (randomWeight <= 0) { selectedGradeIndex = i; break; }
                }
                
                // 3. Filter Pool by Grade (e.g., only Grade 1 gems)
                const targetGrade = selectedGradeIndex + 1;
                const gradeGems = allGems.filter(g => g.grade === targetGrade);
                
                // Fallback: If no gems of that grade exist, pick from full pool
                const pool = gradeGems.length > 0 ? gradeGems : allGems; 
                
                // 4. Select Final Gem
                const randomGem = pool[Math.floor(Math.random() * pool.length)];
                
                // 5. Grant to Player
                // We assign a unique instanceId so they stack properly in the backend if needed
                const gemDrop = { ...randomGem, instanceId: `GEM_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };
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
            // [FIX] Check for boolean flags, not 'type' string
            if (drop.isShadow) {
                const qmPct = Math.round((drop.qualityMultiplier - 1) * 100);
                const enchCount = drop.enchantments ? drop.enchantments.length : 0;
                lootMessages.push(`Shadow Found: ${drop.name} (+${qmPct}%) [${enchCount} Enchants]`);
            } else if (drop.isEcho) {
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
    if (window.gameManager && window.gameManager.InventoryManager) {
        window.gameManager.InventoryManager.refresh();
    }
    return lootMessages;
  }
};

export default Systems;