// soulforgeData.js - Master Soulforge Crafting Database (Flattened)
export const soulforgeData = {
  config: {
    baseCriticalSuccessChance: 0.05, // 5% base chance [cite: 1221, 1289]
    ascensionMinInfusionLevel: 10,  // Requires +10 to Ascend [cite: 1218, 1273]
    ascensionStatBoost: 0.50,       // +50% to main stat [cite: 1275]
    infusionCostMultiplier: 1.5,    // Exponential cost scale [cite: 1216, 1255]
    masteryXpBonusCrit: 5.0         // Multiplier for Mastery XP on Crit [cite: 1300]
  },

  // XP yields for performing actions [cite: 1299]
  masteryXpYields: {
    infusion: 15,
    rerolling: 20,
    shatteringShadow: 10,
    shatteringEcho: 5,
    ascension: 100
  },

  // Formula constants for Infusion costs [cite: 1216, 1255]
  infusionBaseCosts: {
    goldBase: 100000,
    essenceBase: 50
    // Logic: Cost = Base * (Multiplier ^ Current_Infusion_Level)
  },

  // Flat fees for rerolling secondary enchantments by Tier [cite: 1264]
  rerollCosts: {
    T1: { gold: 50000, essence: 25 },
    T2: { gold: 87500, essence: 40 },
    T3: { gold: 153125, essence: 65 },
    T4: { gold: 267968, essence: 100 },
    T5: { gold: 468945, essence: 150 },
    T6: { gold: 820654, essence: 225 },
    T7: { gold: 1436145, essence: 350 },
    T8: { gold: 2513253, essence: 500 },
    T9: { gold: 4398193, essence: 750 },
    T10: { gold: 7696838, essence: 1200 },
    T11: { gold: 13469467, essence: 1800 },
    T12: { gold: 23571567, essence: 2700 },
    T13: { gold: 41250242, essence: 4000 },
    T14: { gold: 72187924, essence: 6000 },
    T15: { gold: 126328867, essence: 9000 },
    T16: { gold: 221075517, essence: 13500 },
    T17: { gold: 386882155, essence: 20000 },
    T18: { gold: 677043771, essence: 30000 },
    T19: { gold: 1184826599, essence: 45000 },
    T20: { gold: 2073446549, essence: 70000 }
  },

  // Critical Success Outcomes [cite: 1222-1225, 1292-1295]
  criticalOutcomes: {
    infusion: "Double stat gain",
    reroll: "Resource cost refunded",
    ascension: "Primal Soul cost refunded",
    shattering: "Double Essence yield"
  },

  // Essence yield rates from Shattering [cite: 1283-1284]
  shatteringYields: {
    echoBaseMultiplier: 0.5,
    shadowBaseMultiplier: 1.0,
    tierEssenceBase: 10 // Multiplied by Item Tier
  }
};