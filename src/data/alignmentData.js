// alignmentData.js - Master Alignment System Database (Flattened)
export const alignmentData = {
  config: {
    minAlignment: -25000,
    maxAlignment: 25000,
    startValue: 0,
    spawnChance: 0.0133, // 1 in 75 chance for Titled [cite: 570]
    alignmentTypeChance: 0.40 // 40% chance Title is an alignment type [cite: 570]
  },

  // Alignment changes based on monster kills [cite: 571-587]
  monsterTriggers: {
    "MARAUDER": { action: "Benevolent", value: 1, note: "Killing this evil creature is a Good act." },
    "DREADLORD": { action: "Benevolent", value: 2, note: "Killing this powerful evil leader is a Good act." },
    "JUGGERNAUT": { action: "Malevolent", value: -1, note: "Killing this defensive guardian is an Evil act." },
    "APEX": { action: "Malevolent", value: -2, note: "Killing this pinnacle creature is an Evil act." }
  },

  // Stacking rewards and visual cues [cite: 590-591]
  tiers: [
    { threshold: 100, beneTitle: "Honorable", maleTitle: "Ruthless", glow: "Faint", qmBonus: 0.005 },
    { threshold: 500, beneTitle: "Justicar", maleTitle: "Vicious", glow: "Light", qmBonus: 0.010 },
    { threshold: 1000, beneTitle: "Guardian", maleTitle: "Tyrant", glow: "Bright", qmBonus: 0.015 },
    { threshold: 2500, beneTitle: "Protector", maleTitle: "Dominator", glow: "Vivid", qmBonus: 0.020 },
    { threshold: 5000, beneTitle: "Saint", maleTitle: "Dreadlord", glow: "Glowing", qmBonus: 0.030 },
    { threshold: 10000, beneTitle: "Luminary", maleTitle: "Malevolent", glow: "Radiant", qmBonus: 0.050 },
    { threshold: 25000, beneTitle: "Paragon", maleTitle: "Anathema", glow: "Pulsing", qmBonus: 0.100 }
  ],

  // Endgame Capstone Choices (unlocked at ±25,000) [cite: 592-599]
  capstoneChoices: {
    benevolent: {
      "PATH-FORTUNE": { id: "PATH-FORTUNE", name: "Path of Fortune", gemDropBonus: 0.10 },
      "PATH-PROVIDENCE": { id: "PATH-PROVIDENCE", name: "Path of Providence", shadowDropBonus: 0.05 }
    },
    malevolent: {
      "PATH-PERFECTION": { id: "PATH-PERFECTION", name: "Path of Perfection", flatQmBoost: 0.10 },
      "PATH-POWER": { id: "PATH-POWER", name: "Path of Power", enchantEffectivenessBonus: 0.10 }
    }
  }
};