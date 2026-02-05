/**
 * GEMINUS ENGINE: CONFIGURATION HUB
 * Role: Single Source of Truth (SSOT)
 * Description: Centralizes master formulas, progression math, and raw data imports.
 */

// --- 1. DATA LAYER IMPORTS ---
import { alignmentData } from '../data/alignmentData.js';
import { arcanumData } from '../data/arcanumData.js';
import { armoryData } from '../data/armoryData.js';
import { bestiaryData } from '../data/bestiaryData.js';
import { clanData } from '../data/clanData.js';
import { dropTableData as dropTables } from '../data/dropTables.js';
import { enchantmentData } from '../data/enchantmentData.js';
import { GDD_INITIAL_DATA as gdd_seed } from '../data/gdd_seed.js';
import { gemsData } from '../data/gemsData.js';
import { jewelryData } from '../data/jewelryData.js';
import { masteryData } from '../data/masteryData.js';
import { monsterTitles as monsterTitlesData } from '../data/monsterTitles.js';
import { racesData } from '../data/racesData.js';
import { requirementSchema as requirementSchemaData } from '../data/requirementSchema.js';
import { resourceData } from '../data/resourceData.js';
import { soulforgeData } from '../data/soulforgeData.js';
import { vaultData } from '../data/vaultData.js';
import { zonesData } from '../data/zonesData.js';

// --- 2. MASTER FORMULAS (ARCHITECTURAL BLUEPRINT) ---
const formulas = {
  "derivedStats": {
    "MaximumHP": {
      "formula": "100 + (VIT * 10)",
      "description": "Calculates Maximum HP based on Vitality."
    },
    "ArmorClass": {
      "formula": "(Sum of AC from Gear) * (1 + (VIT * 0.0075))",
      "description": "Calculates Armor Class based on gear and Vitality."
    },
    "WeaponClass": {
      "True Fighter": {
        "formula": "(Sum of WC from Gear) * (1 + (DEX * 0.0055))",
        "scalingStat": "DEX"
      },
      "Martial Hybrid": {
        "formula": "(Sum of WC from Gear) * (1 + (DEX * 0.0055))",
        "scalingStat": "DEX"
      },
      "Mystic Hybrid": {
        "formula": "(Sum of WC from Gear) * (1 + (WIS * 0.0055))",
        "scalingStat": "WIS"
      },
      "Troll": { // Special VIT-Scaling Case [cite: 301-304]
        "formula": "(Sum of WC from Gear) * (1 + (VIT * 0.0055))",
        "scalingStat": "VIT",
        "specialCase": true
      }
    },
    "SpellClass": {
      "True Caster": {
        "formula": "(Sum of SC from Gear) * (1 + (WIS * 0.0055))",
        "scalingStat": "WIS"
      },
      "Martial Hybrid": {
        "formula": "(Sum of SC from Gear) * (1 + (DEX * 0.0055))",
        "scalingStat": "DEX"
      },
      "Mystic Hybrid": {
        "formula": "(Sum of SC from Gear) * (1 + (WIS * 0.0055))",
        "scalingStat": "WIS"
      },
      "Vampire": { // Special VIT-Scaling Case [cite: 305-307]
        "formula": "(Sum of SC from Gear) * (1 + (VIT * 0.0055))",
        "scalingStat": "VIT",
        "specialCase": true
      }
    },
    "HitChance": {
      "DEX_Based": { "formula": "90 + (DEX * 0.05)", "archetypes": ["True Fighter", "Martial Hybrid"] },
      "WIS_Based": { "formula": "90 + (WIS * 0.05)", "archetypes": ["True Caster", "Mystic Hybrid"] }
    },
    "CriticalHitChance": {
      "DEX_Based": { "formula": "5 + (DEX * 0.01)", "archetypes": ["True Fighter", "Martial Hybrid"] },
      "WIS_Based": { "formula": "5 + (WIS * 0.01)", "archetypes": ["True Caster", "Mystic Hybrid"] }
    },
    "RacialPower": { // Standardized Mechanical Model [cite: 332-341]
      "SingleStat": { "formula": "PrimaryStat * 0.10" },
      "DualStat": { "formula": "(Stat1 * 0.05) + (Stat2 * 0.05)" }
    }
  },
  "combat": {
    "PlayerDamage": {
      "formula": "(90 * Player_WC_or_SC) / Monster_AC", // Damage Asymmetry: Division [cite: 839]
      "description": "Player damage is reduced by monster AC via division."
    },
    "MonsterDamage": {
      "formula": "Monster_Attack - (Player_AC * 0.5)", // Damage Asymmetry: Subtraction [cite: 840]
      "description": "Monster damage is reduced by player AC via subtraction."
    },
    "SpellstrikeDamage": { // Hybrid Signature Action [cite: 288]
      "formula": "((90 * Player_WC) / Monster_AC + (90 * Player_SC) / Monster_AC) * 0.8",
      "description": "Hybrid damage balanced by a 0.8x global modifier."
    }
  },
  "progression": {
    "ExperienceToLevel": {
      "formula": "200 * (1.12 ^ Current_Level)", // Exponential Grind Wall 
      "description": "XP curve defining the vertical progression cycle."
    },
    "MasteryXPToPoint": {
      "formula": "5000 * (1.15 ^ Current_Mastery_Points)", // mastery skill curve [cite: 439]
      "description": "Exponential curve for Mastery Point acquisition."
    }
  },
  "healthAndResources": {
    "BaseHealthRegen": {
      "formula": "floor(5 + (PlayerLevel * 1.5))", // Static Growth [cite: 362]
      "description": "Level-based HP regeneration per turn."
    },
    "GearHealthRegen": {
      "formula": "CurrentMaxHP * sum(%Regen FromAllSources)", // Scalable %-based [cite: 372]
      "description": "Percentage-based HP regeneration from gear."
    },
    "TotalHealthRegen": {
      "formula": "BaseRegen + floor(GearRegen)",
      "inCombatModifier": 0.5, // 50% Reduction in Combat [cite: 397]
      "description": "Total HP regen per turn, reduced in active encounters."
    }
  }
};

// --- 3. CORE CONSTANTS ---
const gddConstants = {
    BASE_GEM_DROP_CHANCE: 1/250,
    BASE_SHADOW_DROP_CHANCE: 1/600,
    SHADOW_QM_MIN: 0.75,
    SHADOW_QM_MAX: 1.5,
    ECHO_QM: 0.5,
    XP_BASE: 200, 
    XP_GROWTH_RATE: 1.12, 
    AP_PER_LEVEL: 40,
    PLAYER_DAMAGE_CONSTANT: 90, 
    HYBRID_SPELLSTRIKE_MULTIPLIER: 0.8,
    MONSTER_DAMAGE_AC_REDUCTION_FACTOR: 0.5,
    MONSTER_SCALING_HP_RATE: 1.20, 
    MONSTER_SCALING_DEF_RATE: 1.20, 
    MONSTER_SCALING_ATK_RATE: 1.22, 
    MONSTER_SCALING_REWARD_RATE: 1.27
};

const equipmentSlotConfig = [
    { name: 'Helmet', type: 'Armor' }, { name: 'Weapon 1', type: 'Weapons' },
    { name: 'Armor', type: 'Armor' }, { name: 'Weapon 2', type: 'Weapons' },
    { name: 'Gauntlets', type: 'Armor' }, { name: 'Leggings', type: 'Armor' },
    { name: 'Boots', type: 'Armor' }, { name: 'Amulet', type: 'Amulet' },
    { name: 'Spell 1', type: 'Spells' }, { name: 'Ring', type: 'Ring' },
    { name: 'Spell 2', type: 'Spells' }, { name: 'Accessories', type: 'Accessory' }
];

// --- 4. ENGINE DATA MAPPING ---
// Maps imported data files to engine-facing constants.
export const alignment = alignmentData;
export const arcanum = arcanumData;
export const armory = armoryData;
export const bestiary = bestiaryData;
export const clans = clanData;
export const drops = dropTables;
export const enchantments = enchantmentData;
export const seed = gdd_seed;
export const gems = gemsData;
export const jewelry = jewelryData;
export const mastery = masteryData;
export const monsterTitles = monsterTitlesData;
export const races = racesData;
export const requirementSchema = requirementSchemaData;
export const resources = resourceData;
export const soulforge = soulforgeData;
export const vault = vaultData;
export const zones = zonesData;

// [ARCHITECT FIX] Flatten all data into a Master Registry AND Inject Types
// This ensures items[id] returns { type: 'Axe', category: 'Weapons', ... }
const flattenItems = () => {
    const allItems = {};

    // 1. Flatten Armory (Weapons & Armor)
    if (armoryData.weapons) {
        Object.entries(armoryData.weapons).forEach(([type, categoryObj]) => {
            Object.values(categoryObj).forEach(item => {
                allItems[item.id] = { ...item, type: type, category: 'Weapons' }; // Inject Type!
            });
        });
    }
    if (armoryData.armor) {
        Object.entries(armoryData.armor).forEach(([type, categoryObj]) => {
            Object.values(categoryObj).forEach(item => {
                allItems[item.id] = { ...item, type: type, category: 'Armor' }; // Inject Type!
            });
        });
    }

    // 2. Flatten Arcanum (Spells & Buffs)
    if (arcanumData.spells) {
        Object.entries(arcanumData.spells).forEach(([type, categoryObj]) => {
            Object.values(categoryObj).forEach(item => {
                allItems[item.id] = { ...item, type: type, category: 'Spell' };
            });
        });
    }
    if (arcanumData.buffs) {
        // Handle nested or flat buff structures
        Object.entries(arcanumData.buffs).forEach(([key, val]) => {
             // If val is an object of items (nested)
             if (val.id) {
                 allItems[val.id] = { ...val, type: 'Buff', category: 'Buff' };
             } else {
                 Object.values(val).forEach(item => {
                     allItems[item.id] = { ...item, type: 'Buff', category: 'Buff' };
                 });
             }
        });
    }

    // 3. Flatten Jewelry
    if (jewelryData) {
        if (jewelryData.necklace) Object.values(jewelryData.necklace).forEach(i => allItems[i.id] = { ...i, type: 'Necklace', category: 'Jewelry' });
        if (jewelryData.ring) Object.values(jewelryData.ring).forEach(i => allItems[i.id] = { ...i, type: 'Ring', category: 'Jewelry' });
        if (jewelryData.artifact) Object.values(jewelryData.artifact).forEach(i => allItems[i.id] = { ...i, type: 'Artifact', category: 'Jewelry' });
    }

    return allItems;
};

// Export the Master Registry
export const items = flattenItems();

// Exporting Master Formulas & Config
export { formulas, gddConstants, equipmentSlotConfig };

// Export aliases for backward compatibility
export const progression = formulas.progression;
// export const items = armory; // [REMOVED] Replaced by the intelligent flattenItems registry above