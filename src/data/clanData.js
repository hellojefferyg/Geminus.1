// clanData.js - Master Clan & Bastion Database (Flattened)
export const clanData = {
  config: {
    creationCost: 100000, // [cite: 957]
    taxRateMin: 0,
    taxRateMax: 25,       // Max percentage of member sales for Treasury [cite: 1009]
    powerFormula: "sum(memberLevels)", // [cite: 1024]
    constructionTimerMultiplier: 1.25 // Level-based time scaling
  },

  // War Materials required for PvP buildings [cite: 1010-1014]
  resources: {
    tier1: { wood: "Heartwood Log", stone: "Quarry Stone" },
    tier2: { wood: "Siege-Grade Timber", stone: "Fortress Granite" },
    tier3: { metal: "Bloodsteel Ingot", ore: "Adamant Ore" }
  },

  // Bastion Building Definitions [cite: 980-990]
  buildings: {
    "BLD-HALL": {
      id: "BLD-HALL",
      name: "Great Hall",
      type: "Core",
      costCurrency: "gold",
      effect: "Unlocks Clan Power Bonuses and sets Max Level for all other buildings", // [cite: 980-981]
      maxLevel: 20
    },
    "BLD-FRND": {
      id: "BLD-FRND",
      name: "Force of Friendship",
      type: "PvE",
      costCurrency: "gold",
      bonusPerLevel: 0.01, // +1% to flat combat stats
      effect: "Grants flat increases to combat stats for all clan members" // [cite: 983]
    },
    "BLD-ACAD": {
      id: "BLD-ACAD",
      name: "Tracker Academy",
      type: "PvE",
      costCurrency: "gold",
      spawnRateBonus: 0.05, // +5% spawn chance per level
      effect: "Boosts the spawn rate of special, high-value monsters" // [cite: 984]
    },
    "BLD-MRKT": {
      id: "BLD-MRKT",
      name: "Black Market",
      type: "PvE",
      costCurrency: "gold",
      sellBonus: 0.02, // +2% sell value per level
      effect: "Percentage-based bonus to Gold earned from selling items" // [cite: 985]
    },
    "BLD-MINE": {
      id: "BLD-MINE",
      name: "Clan Mine",
      type: "PvE",
      costCurrency: "gold",
      gemChanceBase: 0.005, 
      effect: "Activates 'Hunter's Quarry'—a small chance to find a rare Gem on each kill", // [cite: 986]
      notes: "Includes bad luck protection" // [cite: 987]
    },
    "BLD-WALL": {
      id: "BLD-WALL",
      name: "Bastion Walls",
      type: "PvP",
      costCurrency: "war_materials", // [cite: 974]
      defensiveBonus: 0.05, 
      effect: "Enhances defensive stats during combat within own territory" // [cite: 989]
    },
    "BLD-CAMP": {
      id: "BLD-CAMP",
      name: "War Camp",
      type: "PvP",
      costCurrency: "war_materials", // [cite: 974]
      offensiveBonus: 0.05,
      effect: "Enhances offensive stats during combat in enemy territory" // [cite: 990]
    }
  },

  // Milestones for unlocking passive clan bonuses [cite: 1025]
  powerMilestones: [
    { powerNeeded: 1000, bonus: "AC_PCT_02", label: "+2% Armor" },
    { powerNeeded: 5000, bonus: "WC_PCT_02", label: "+2% Weapon Class" },
    { powerNeeded: 10000, bonus: "XP_PCT_05", label: "+5% Experience" },
    { powerNeeded: 25000, bonus: "QM_PCT_01", label: "+1% Quality Multiplier" }
  ]
};