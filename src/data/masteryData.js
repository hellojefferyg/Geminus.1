// masteryData.js - Master Mastery System Database (Flattened)
export const masteryData = {
  config: {
    baseCap: 100, // [cite: 443]
    xpFormula: "5000 * (1.15^Current_Mastery_Points)", // [cite: 439]
    xpBase: 5000,
    xpMultiplier: 1.15
  },

  // Benefit per purchased level [cite: 449, 452, 454, 456]
  benefits: {
    weapon: 0.005,  // +0.5% to Base WC
    spell: 0.005,   // +0.5% to Base SC
    armor: 0.0025,  // +0.25% to Base AC
    doubleHit: 0.001 // +0.1% to Double Hit Chance
  },

  // Mastery Point (MP) Cost per Level per Race [cite: 463-561]
  aptitudes: {
    // --- TRUE FIGHTERS ---
    "HUMAN":      { sword: 1, armor: 2, dblHit: 3 },
    "DRAGONBORN": { sword: 1, armor: 2, dblHit: 3 },
    "ORC":        { mace: 1, armor: 2, dblHit: 3 },
    "WEREWOLF":   { claw: 1, armor: 2, dblHit: 3 },
    "MINOTAUR":   { axe: 1, armor: 2, dblHit: 3 },
    "TROLL":      { staff: 1, armor: 2, dblHit: 3 },
    "HOBBIT":     { dagger: 1, armor: 2, dblHit: 3 },
    "CENTAUR":    { bow: 1, armor: 2, dblHit: 3 },

    // --- TRUE CASTERS ---
    "PHOENIX":    { fire: 1, armor: 3, dblHit: 3 },
    "TIEFLING":   { fire: 1, armor: 3, dblHit: 3 },
    "MERMAID":    { cold: 1, armor: 3, dblHit: 3 },
    "GNOME":      { earth: 1, armor: 3, dblHit: 3 },
    "GRIFFIN":    { air: 1, armor: 3, dblHit: 3 },
    "VAMPIRE":    { drain: 1, armor: 3, dblHit: 3 },
    "ELF":        { arcane: 1, armor: 3, dblHit: 3 },
    "BABA_YAGA":  { death: 1, armor: 3, dblHit: 3 },

    // --- MARTIAL HYBRIDS ---
    "ANGEL":      { sword: 2, arcane: 2, armor: 3, dblHit: 3 },
    "PALADIN":    { mace: 2, arcane: 2, armor: 3, dblHit: 3 }, // [cite: 560]
    "BANSHEE":    { dagger: 2, arcane: 2, armor: 3, dblHit: 3 },
    "HALFLING":   { staff: 2, arcane: 2, armor: 3, dblHit: 3 },

    // --- MYSTIC HYBRIDS ---
    "DWARF":      { axe: 2, fire: 2, armor: 3, dblHit: 3 },
    "DEMON":      { staff: 2, fire: 2, armor: 3, dblHit: 3 },
    "DRAUGR":     { staff: 2, death: 2, armor: 3, dblHit: 3 },
    "UNICORN":    { sword: 2, death: 2, armor: 3, dblHit: 3 }
  }
};