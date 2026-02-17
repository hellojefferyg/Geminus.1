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

    let totalGearAC = 0, totalGearWC = 0, totalGearSC = 0;
    let bonusHitChance = 0;
    let bonusWcScMultiplier = 1.0;
    let bonusAcMultiplier = 1.0; // [NEW] Support for 'Guard' buff % bonus
    let totalHpRegenPercent = 0;
    let gearVit = 0, gearDex = 0, gearWis = 0; // [NEW] Gear-based attribute bonuses

    // 1. Process Equipment Stats (ARCHITECT FIX)
    const equipmentSource = player.equipped || player.equipment || {};

    Object.values(equipmentSource).forEach(entry => {
        let item = entry;
        if (typeof item === 'string') {
             item = player.inventory ? player.inventory.find(i => i.instanceId === item || i.uuid === item) : null;
        }

        if (!item || typeof item !== 'object') return;

        const baseItem = findItemById(item.baseItemId || item.id) || {};
        const statsItem = { ...baseItem, ...item };
        const qm = safeVal(item.qualityMultiplier) || 1.0; 
        
        // Accumulate Base Stats * Quality
        totalGearWC += safeMult(baseItem.wc || item.wc || 0, qm);
        totalGearAC += safeMult(baseItem.ac || item.ac || 0, qm);
        totalGearSC += safeMult(baseItem.sc || item.sc || 0, qm);
        
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
    
    // Map current primary scaling value
    const primaryStat = racialData.primaryStat;
    let scalingStatValue = (primaryStat === 'VIT') ? VIT : (primaryStat === 'DEX') ? DEX : WIS;

    let finalWC = 0, finalSC = 0;
    const isTroll = player.race === 'Troll';
    const isVampire = player.race === 'Vampire';
    const basePower = 5 + (player.level * 2);

    switch (racialData.archetype) {
      case 'True Fighter':
        const fighterStat = isTroll ? VIT : scalingStatValue;
        finalWC = (totalGearWC + basePower) * (1 + (fighterStat * 0.0055));
        finalSC = totalGearSC + (basePower * 0.5); 
        break;

      case 'True Caster':
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
      // [FIX] Normalize type to handle spaces/underscores for Arrows, Shields, and Buffs
      const mType = mother ? (mother.type || mother.subType || '').replace(/ /g, '_').toLowerCase() : '';
      // Legacy support for string IDs
      if (typeof mother === 'string') {
          mother = player.inventory.find(i => i.instanceId === mother || i.uuid === mother);
      }

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

      // Helper to find base items in the flat registry
      const findBaseItem = (targetType, targetTier) => {
          if (!targetType) return null;
          const lowerType = targetType.toLowerCase();
          return Object.values(items).find(i => 
              (i.type || '').toLowerCase() === lowerType && 
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
      }

      // SCENARIO C: STANDARD ITEM ("Dropper") -> Drops SHADOW
      // Logic: 3x Weighted Drop Table -> Current/-1 Tier -> High Stats
      else {
          // 1. Identify Drop Table
          let dtKey = null;
          const mType = mother.type || mother.subType || '';
          
          for (const [key, dt] of Object.entries(dropTables)) {
              if (dt.pool.some(t => t.replace(/ /g, '_').toLowerCase() === mType)) {
                  dtKey = key;
                  break;
              }
          }

          // 2. Build Weighted Pool (Target Farming: 3x Chance for Mother Type)
          const pool = dtKey ? dropTables[dtKey].pool : [mType];
          const weightedPool = [];
          
          pool.forEach(type => {
              const normalizedPoolType = type.replace(/ /g, '_').toLowerCase();
              if (normalizedPoolType === mType) {
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
      }
      child.uuid = crypto.randomUUID(); // Ensures compatibility with Equipment & Inventory Managers

      child.instanceId = `${child.baseItemId || 'GEN'}_${child.isEcho ? 'ECHO' : 'SHADOW'}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      
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