/**
 * GEMINUS ENGINE: REQUIREMENT SCHEMA
 * Role: Gatekeeper Logic for Equipment.
 * Description: Maps item tiers to minimum attribute requirements.
 * Standardized to Master GDD Section 1.7.
 */

export const requirementSchema = {
  // --- STAT-TO-SLOT ASSIGNMENT RULES ---
  // Maps the item's function to the required gatekeeping attribute.
  slotMapping: {
    "Weapons": "STR", // Required for physical weapons (Swords, Axes, etc.) [cite: 417]
    "Spells": "NTL",   // Required for magical Spellbooks [cite: 418]
    "Armor": "VIT",    // Required for all Armor pieces [cite: 419]
    "Amulet": "VIT",   // Required for Jewelry [cite: 419]
    "Ring": "VIT"      // Required for Jewelry [cite: 419]
  },

  // --- DROPPER ITEM REQUIREMENT PROGRESSION TABLE ---
  // The minimum stat required to equip a Dropper item of a given Tier. [cite: 423]
  // Note: Shadow and Echo items are EXEMPT from these requirements. 
  tiers: {
    1:  { STR: 5,   NTL: 5,   VIT: 5 },   // Tier I [cite: 424]
    2:  { STR: 15,  NTL: 15,  VIT: 20 },  // Tier II [cite: 424]
    3:  { STR: 25,  NTL: 25,  VIT: 35 },  // Tier III [cite: 424]
    4:  { STR: 40,  NTL: 40,  VIT: 50 },  // Tier IV [cite: 424]
    5:  { STR: 55,  NTL: 55,  VIT: 70 },  // Tier V [cite: 424]
    6:  { STR: 70,  NTL: 70,  VIT: 90 },  // Tier VI [cite: 424]
    7:  { STR: 90,  NTL: 90,  VIT: 110 }, // Tier VII [cite: 424]
    8:  { STR: 110, NTL: 110, VIT: 135 }, // Tier VIII [cite: 424]
    9:  { STR: 130, NTL: 130, VIT: 160 }, // Tier IX [cite: 425]
    10: { STR: 155, NTL: 155, VIT: 190 }, // Tier X [cite: 425]
    11: { STR: 180, NTL: 180, VIT: 220 }, // Tier XI [cite: 425]
    12: { STR: 205, NTL: 205, VIT: 250 }, // Tier XII [cite: 425]
    13: { STR: 230, NTL: 230, VIT: 285 }, // Tier XIII [cite: 425]
    14: { STR: 260, NTL: 260, VIT: 320 }, // Tier XIV [cite: 425]
    15: { STR: 290, NTL: 290, VIT: 355 }, // Tier XV [cite: 425]
    16: { STR: 320, NTL: 320, VIT: 395 }, // Tier XVI [cite: 425]
    17: { STR: 350, NTL: 350, VIT: 435 }, // Tier XVII [cite: 425]
    18: { STR: 385, NTL: 385, VIT: 475 }, // Tier XVIII [cite: 425]
    19: { STR: 420, NTL: 420, VIT: 520 }, // Tier XIX [cite: 425]
    20: { STR: 455, NTL: 455, VIT: 565 }  // Tier XX [cite: 425]
  },

  // --- ARCHITECTURAL HELPER ---
  // Retrieves the correct requirement based on item type and tier.
  getRequirement: function(type, tier, isShadow = false) {
    if (isShadow) return 0; // Procedural loot is equipped freely. 
    const stat = this.slotMapping[type];
    return this.tiers[tier] ? this.tiers[tier][stat] : 0;
  }
};