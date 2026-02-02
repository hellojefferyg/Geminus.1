// enchantmentData.js - Master Enchantment Compendium (Flattened)
export const enchantmentData = {
  caster: {
    "ENCH-LORE-STN": {
      id: "ENCH-LORE-STN",
      name: "LoreStone Enchanted",
      effect: "Increase Spell Class",
      tiers: [0.25, 0.5, 0.5, 1, 1.25, 2, 3.25, 4, 5] // % values for Tier 1-9
    },
    "ENCH-LORE-HRT": {
      id: "ENCH-LORE-HRT",
      name: "LoreHeart Enchanted",
      effect: "Increase Base SC and Base AC",
      sc_min: 0.25, sc_max: 3.75,
      ac_min: 0.25, ac_max: 5.00
    },
    "ENCH-TRUE-RTE": {
      id: "ENCH-TRUE-RTE",
      name: "True-Rite Enchanted",
      effect: "Increase Hit Chance and Decrease Enemy WIS",
      hit_min: 0.75, hit_max: 7.50,
      enemy_wis_debuff_min: 2.00, enemy_wis_debuff_max: 7.50
    },
    "ENCH-MIND-RTE": {
      id: "ENCH-MIND-RTE",
      name: "Mindrite Enchanted",
      effect: "Increase WIS",
      tiers: [1.25, 1.875, 2.5, 3.125, 3.75, 5, 7.5, 10, 12.5]
    },
    "ENCH-SANG-HRT": {
      id: "ENCH-SANG-HRT",
      name: "Sanguine-Heart Enchanted",
      effect: "Increase VIT and Base SC",
      vit_min: 0.6, vit_max: 6.25,
      sc_min: 0.1, sc_max: 2.5
    }
  },
  fighter: {
    "ENCH-WAR-STN": {
      id: "ENCH-WAR-STN",
      name: "WarStone Enchanted",
      effect: "Increase Weapon Class",
      tiers: [0.25, 0.5, 0.75, 1.25, 1.75, 2.5, 3.25, 4, 5]
    },
    "ENCH-WAR-HRT": {
      id: "ENCH-WAR-HRT",
      name: "WarHeart Enchanted",
      effect: "Increase Base WC and Base AC",
      wc_min: 0.25, wc_max: 3.75,
      ac_min: 0.25, ac_max: 5.00
    },
    "ENCH-TRUE-LTE": {
      id: "ENCH-TRUE-LTE",
      name: "True-Lite Enchanted",
      effect: "Increase Hit Chance and Decrease Enemy DEX",
      hit_min: 0.75, hit_max: 7.50,
      enemy_dex_debuff_min: 2.00, enemy_dex_debuff_max: 7.50
    },
    "ENCH-IGHT-RTE": {
      id: "ENCH-IGHT-RTE",
      name: "Mightrite Enchanted",
      effect: "Increase DEX",
      tiers: [1.25, 1.875, 2.5, 3.125, 3.75, 5, 7.5, 10, 12.5]
    },
    "ENCH-JUGG-EYE": {
      id: "ENCH-JUGG-EYE",
      name: "Juggernaut's Eye Enchanted",
      effect: "Increase VIT and Base WC",
      vit_min: 0.6, vit_max: 6.25,
      wc_min: 0.1, wc_max: 2.5
    }
  },
  support: {
    "ENCH-OBSD-ENT": {
      id: "ENCH-OBSD-ENT",
      name: "Obsidian Enchanted",
      effect: "Increase Armor Class",
      tiers: [0.25, 0.5, 0.75, 1.25, 1.75, 2.5, 3.25, 4, 5]
    },
    "ENCH-SPKE-ENT": {
      id: "ENCH-SPKE-ENT",
      name: "Spike-Core's Enchanted",
      effect: "Increase Crit",
      tiers: [0.25, 0.625, 1.25, 1.875, 2.5, 3.125, 3.75, 4.375, 5]
    },
    "ENCH-TRUE-ENT": {
      id: "ENCH-TRUE-ENT",
      name: "True-Core's Enchanted",
      effect: "Increase Hit",
      tiers: [0.75, 1.5, 2.25, 3, 3.75, 4.5, 5.25, 6.25, 7.5]
    },
    "ENCH-VITL-ENT": {
      id: "ENCH-VITL-ENT",
      name: "Vital-Core's Enchanted",
      effect: "Increase Vitality",
      tiers: [1.25, 1.875, 2.5, 3.125, 3.75, 5, 7.5, 10, 12.5]
    },
    "ENCH-BLOD-ENT": {
      id: "ENCH-BLOD-ENT",
      name: "Blood-Core's Enchanted",
      effect: "Steal Enemy Health",
      tiers: [1, 1.5, 2.25, 3.75, 6.25, 10, 12.5, 15, 18.75]
    }
  },
  logic: {
    // Defines the number of enchantments generated based on initial QM [cite: 820, 821]
    generation_rules: [
      { qm_min: 0.75, qm_max: 0.99, count_min: 0, count_max: 1 },
      { qm_min: 1.00, qm_max: 1.24, count_min: 1, count_max: 2 },
      { qm_min: 1.25, qm_max: 1.49, count_min: 2, count_max: 3 },
      { qm_min: 1.50, qm_max: 1.50, count_min: 4, count_max: 4 } // Perfect Roll [cite: 821]
    ]
  }
};