/**
 * GEMINUS ENGINE: MASTER RACE DATABASE
 * Role: Single Source of Truth for Character DNA.
 * Standardized to Master GDD v2.0.
 */

export const racesData = {
  // --- TRUE FIGHTERS (DEX Scaling / VIT Scaling Special Cases) ---
  "HUMAN": { 
    id: "HUMAN", 
    raceName: "Human", 
    archetype: "True Fighter",
    specialistTitle: "Blademaster",
    coreCombatIdentity: "The Versatile Duelist",
    primaryStat: "DEX",
    apWeights: { STR: 15, DEX: 20, VIT: 10, NTL: 5, WIS: 5 },
    masteryAptitudes: { "Sword": 1, "Armor": 2, "Dbl Hit": 3 },
    passive: { name: "Adaptable Combatant", effect: "Double Hit Chance %", sourceStat: "DEX" }
  },
  "DRAGONBORN": { 
    id: "DRAGONBORN", 
    raceName: "Dragonborn", 
    archetype: "True Fighter",
    specialistTitle: "Blademaster",
    coreCombatIdentity: "The Powerhouse Knight",
    primaryStat: "DEX",
    apWeights: { STR: 18, DEX: 20, VIT: 12, NTL: 2, WIS: 3 },
    masteryAptitudes: { "Sword": 1, "Armor": 2, "Dbl Hit": 3 },
    passive: { name: "Draconic Might", effect: "Weapon Class", sourceStat: "DEX" }
  },
  "ORC": { 
    id: "ORC", 
    raceName: "Orc", 
    archetype: "True Fighter",
    specialistTitle: "Mauler",
    coreCombatIdentity: "The Definitive Mace Wielder",
    primaryStat: "DEX",
    apWeights: { STR: 20, DEX: 18, VIT: 15, NTL: 2, WIS: 2 },
    masteryAptitudes: { "Mace": 1, "Armor": 2, "Dbl Hit": 3 },
    passive: { name: "Savage Blows", effect: "Weapon Class", sourceStat: "DEX" }
  },
  "WEREWOLF": { 
    id: "WEREWOLF", 
    raceName: "Werewolf", 
    archetype: "True Fighter",
    specialistTitle: "Ravager",
    coreCombatIdentity: "The Definitive Claw Wielder",
    primaryStat: "DEX",
    apWeights: { STR: 15, DEX: 22, VIT: 13, NTL: 2, WIS: 3 },
    masteryAptitudes: { "Claw": 1, "Armor": 2, "Dbl Hit": 3 },
    passive: { name: "Feral Frenzy", effect: "Double Hit Chance %", sourceStat: "DEX" }
  },
  "MINOTAUR": { 
    id: "MINOTAUR", 
    raceName: "Minotaur", 
    archetype: "True Fighter",
    specialistTitle: "Executioner",
    coreCombatIdentity: "The Definitive Axe Wielder",
    primaryStat: "DEX",
    apWeights: { STR: 22, DEX: 18, VIT: 14, NTL: 2, WIS: 2 },
    masteryAptitudes: { "Axe": 1, "Armor": 2, "Dbl Hit": 3 },
    passive: { name: "Overpower", effect: "Critical Hit Damage %", sourceStat: "DEX" }
  },
  "TROLL": { 
    id: "TROLL", 
    raceName: "Troll", 
    archetype: "True Fighter",
    specialistTitle: "Juggernaut",
    coreCombatIdentity: "The Definitive Staff Wielder",
    primaryStat: "VIT",
    apWeights: { STR: 10, DEX: 5, VIT: 25, NTL: 5, WIS: 5 },
    masteryAptitudes: { "Staff": 1, "Armor": 2, "Dbl Hit": 3 },
    passive: { name: "Regenerative Fury", effect: "Weapon Class", sourceStat: "VIT" }
  },
  "HOBBIT": { 
    id: "HOBBIT", 
    raceName: "Hobbit", 
    archetype: "True Fighter",
    specialistTitle: "Cutthroat",
    coreCombatIdentity: "The Definitive Dagger Wielder",
    primaryStat: "DEX",
    apWeights: { STR: 8, DEX: 25, VIT: 12, NTL: 3, WIS: 7 },
    masteryAptitudes: { "Dagger": 1, "Armor": 2, "Dbl Hit": 3 },
    passive: { name: "Unseen Strike", effect: "Critical Hit Damage %", sourceStat: "DEX" }
  },
  "CENTAUR": { 
    id: "CENTAUR", 
    raceName: "Centaur", 
    archetype: "True Fighter",
    specialistTitle: "Sharpshooter",
    coreCombatIdentity: "The Definitive Ranged Wielder",
    primaryStat: "DEX",
    apWeights: { STR: 12, DEX: 24, VIT: 10, NTL: 3, WIS: 6 },
    masteryAptitudes: { "Bow": 1, "Armor": 2, "Dbl Hit": 3 },
    passive: { name: "Unerring Aim", effect: "Hit Chance %", sourceStat: "DEX" }
  },

  // --- TRUE CASTERS (WIS Scaling / VIT Scaling Special Cases) ---
  "PHOENIX": { 
    id: "PHOENIX", 
    raceName: "Phoenix", 
    archetype: "True Caster",
    specialistTitle: "Pyromancer",
    coreCombatIdentity: "The Explosive Pyromancer",
    primaryStat: "WIS",
    apWeights: { STR: 2, DEX: 3, VIT: 10, NTL: 20, WIS: 20 },
    masteryAptitudes: { "Fire": 1, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Immolate", effect: "Critical Hit Damage %", sourceStat: "WIS" }
  },
  "TIEFLING": { 
    id: "TIEFLING", 
    raceName: "Tiefling", 
    archetype: "True Caster",
    specialistTitle: "Pyromancer",
    coreCombatIdentity: "The Infernal Sorcerer",
    primaryStat: "WIS",
    apWeights: { STR: 3, DEX: 5, VIT: 8, NTL: 20, WIS: 19 },
    masteryAptitudes: { "Fire": 1, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Infernal Pact", effect: "Spell Class", sourceStat: "WIS" }
  },
  "MERMAID": { 
    id: "MERMAID", 
    raceName: "Mermaid", 
    archetype: "True Caster",
    specialistTitle: "Cryomancer",
    coreCombatIdentity: "The Definitive Cold Caster",
    primaryStat: "WIS",
    apWeights: { STR: 2, DEX: 4, VIT: 12, NTL: 19, WIS: 18 },
    masteryAptitudes: { "Cold": 1, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Crushing Depths", effect: "Spell Class", sourceStat: "WIS" }
  },
  "GNOME": { 
    id: "GNOME", 
    raceName: "Gnome", 
    archetype: "True Caster",
    specialistTitle: "Geomancer",
    coreCombatIdentity: "The Definitive Earth Caster",
    primaryStat: "WIS",
    apWeights: { STR: 4, DEX: 2, VIT: 14, NTL: 20, WIS: 15 },
    masteryAptitudes: { "Earth": 1, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Arcane Attunement", effect: "Spell Critical Hit Chance %", sourceStat: "WIS" }
  },
  "GRIFFIN": { 
    id: "GRIFFIN", 
    raceName: "Griffin", 
    archetype: "True Caster",
    specialistTitle: "Aeromancer",
    coreCombatIdentity: "The Definitive Air Caster",
    primaryStat: "WIS",
    apWeights: { STR: 2, DEX: 8, VIT: 8, NTL: 17, WIS: 20 },
    masteryAptitudes: { "Air": 1, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Sky's Wrath", effect: "Spell Class", sourceStat: "WIS" }
  },
  "VAMPIRE": { 
    id: "VAMPIRE", 
    raceName: "Vampire", 
    archetype: "True Caster",
    specialistTitle: "Sanguinist",
    coreCombatIdentity: "The Definitive Drain Caster",
    primaryStat: "VIT",
    apWeights: { STR: 4, DEX: 2, VIT: 16, NTL: 4, WIS: 14 },
    masteryAptitudes: { "Drain": 1, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Blood Rush", effect: "Spell Class", sourceStat: "VIT" }
  },
  "ELF": { 
    id: "ELF", 
    raceName: "Elf", 
    archetype: "True Caster",
    specialistTitle: "Arcanist",
    coreCombatIdentity: "The Definitive Arcane Caster",
    primaryStat: "WIS",
    apWeights: { STR: 2, DEX: 7, VIT: 7, NTL: 20, WIS: 19 },
    masteryAptitudes: { "Arcane": 1, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Elven Grace", effect: "Spell Class", sourceStat: "WIS" }
  },
  "BABA_YAGA": { 
    id: "BABA_YAGA", 
    raceName: "Baba Yaga", 
    archetype: "True Caster",
    specialistTitle: "Necromancer",
    coreCombatIdentity: "The Definitive Death Caster",
    primaryStat: "WIS",
    apWeights: { STR: 3, DEX: 2, VIT: 10, NTL: 19, WIS: 21 },
    masteryAptitudes: { "Death": 1, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Witch's Curse", effect: "Spell Class", sourceStat: "WIS" }
  },

  // --- MARTIAL HYBRIDS (DEX Scaling Warriors) ---
  "ANGEL": { 
    id: "ANGEL", 
    raceName: "Angel", 
    archetype: "Hybrid",
    subArchetype: "Martial Hybrid",
    specialistTitle: "Celestial Spellblade",
    primaryStat: "DEX",
    apWeights: { STR: 12, DEX: 18, VIT: 8, NTL: 8, WIS: 9 },
    masteryAptitudes: { "Sword": 2, "Arcane": 2, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Angelic Vengeance", effect: "Spellstrike Damage %", sourceStat: "DEX" }
  },
  "AASIMAR": { 
    id: "AASIMAR", 
    raceName: "Aasimar", 
    archetype: "Hybrid",
    subArchetype: "Martial Hybrid",
    specialistTitle: "Divine Arbiter",
    primaryStat: "DEX",
    apWeights: { STR: 14, DEX: 18, VIT: 9, NTL: 7, WIS: 7 },
    masteryAptitudes: { "Mace": 2, "Arcane": 2, "Armor": 3, "Dbl Hit": "B" },
    passive: { name: "Divine Judgment", effect: "Spellstrike Damage %", sourceStat: "DEX" }
  },
  "BANSHEE": { 
    id: "BANSHEE", 
    raceName: "Banshee", 
    archetype: "Hybrid",
    subArchetype: "Martial Hybrid",
    specialistTitle: "Trickster Rogue",
    primaryStat: "DEX",
    apWeights: { STR: 6, DEX: 20, VIT: 7, NTL: 9, WIS: 13 },
    masteryAptitudes: { "Dagger": 2, "Arcane": 2, "Armor": 3, "Dbl Hit": "B" },
    passive: { name: "Wail of Doom", effect: "Spellstrike Damage %", sourceStat: "DEX" }
  },
  "HALFLING": { 
    id: "HALFLING", 
    raceName: "Halfling", 
    archetype: "Hybrid",
    subArchetype: "Martial Hybrid",
    specialistTitle: "Mystical Guardian",
    primaryStat: "DEX",
    apWeights: { STR: 7, DEX: 21, VIT: 10, NTL: 7, WIS: 10 },
    masteryAptitudes: { "Staff": 2, "Arcane": 2, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Lethal Precision", effect: "Spellstrike Damage %", sourceStat: "DEX" }
  },

  // --- MYSTIC HYBRIDS (WIS Scaling Warriors) ---
  "DWARF": { 
    id: "DWARF", 
    raceName: "Dwarf", 
    archetype: "Hybrid",
    subArchetype: "Mystic Hybrid",
    specialistTitle: "Runic Forgemaster",
    primaryStat: "WIS",
    apWeights: { STR: 12, DEX: 8, VIT: 10, NTL: 12, WIS: 18 },
    masteryAptitudes: { "Axe": 2, "Fire": 2, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Runic Power", effect: "Spellstrike Damage %", sourceStat: "WIS" }
  },
  "DEMON": { 
    id: "DEMON", 
    raceName: "Demon", 
    archetype: "Hybrid",
    subArchetype: "Mystic Hybrid",
    specialistTitle: "Hellfire Acolyte",
    primaryStat: "WIS",
    apWeights: { STR: 10, DEX: 8, VIT: 8, NTL: 15, WIS: 19 },
    masteryAptitudes: { "Staff": 2, "Fire": 2, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Demonic Fury", effect: "Spellstrike Damage %", sourceStat: "WIS" }
  },
  "DRAUGR": { 
    id: "DRAUGR", 
    raceName: "Draugr", 
    archetype: "Hybrid",
    subArchetype: "Mystic Hybrid",
    specialistTitle: "Wailing Executioner",
    primaryStat: "WIS",
    apWeights: { STR: 13, DEX: 6, VIT: 12, NTL: 12, WIS: 17 },
    masteryAptitudes: { "Staff": 2, "Death": 2, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Undying Cold", effect: "Spellstrike Damage %", sourceStat: "WIS" }
  },
  "UNICORN": { 
    id: "UNICORN", 
    raceName: "Unicorn", 
    archetype: "Hybrid",
    subArchetype: "Mystic Hybrid",
    specialistTitle: "Undead Blightknight",
    primaryStat: "WIS",
    apWeights: { STR: 8, DEX: 10, VIT: 9, NTL: 13, WIS: 20 },
    masteryAptitudes: { "Sword": 2, "Death": 2, "Armor": 3, "Dbl Hit": 3 },
    passive: { name: "Pure Magic", effect: "Spellstrike Damage %", sourceStat: "WIS" }
  }
};