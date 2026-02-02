// resourceData.js - Master Resource & Material Database (Flattened)
export const resourceData = {
  // --- CLAN WAR MATERIALS ---
  // Required for constructing and upgrading PvP-oriented Bastion buildings [cite: 1010]
  war_materials: {
    "MAT-T1-WOOD": { 
      id: "MAT-T1-WOOD", 
      name: "Heartwood Log", 
      tier: 1, 
      type: "Wood", 
      baseValue: 1000, 
      source: "World Map Resource Node" // [cite: 1012]
    },
    "MAT-T1-ROCK": { 
      id: "MAT-T1-ROCK", 
      name: "Quarry Stone", 
      tier: 1, 
      type: "Stone", 
      baseValue: 1000, 
      source: "World Map Resource Node" // [cite: 1012]
    },
    "MAT-T2-WOOD": { 
      id: "MAT-T2-WOOD", 
      name: "Siege-Grade Timber", 
      tier: 2, 
      type: "Wood", 
      baseValue: 5000, 
      source: "World Map Resource Node" // [cite: 1013]
    },
    "MAT-T2-ROCK": { 
      id: "MAT-T2-ROCK", 
      name: "Fortress Granite", 
      tier: 2, 
      type: "Stone", 
      baseValue: 5000, 
      source: "World Map Resource Node" // [cite: 1013]
    },
    "MAT-T3-METL": { 
      id: "MAT-T3-METL", 
      name: "Bloodsteel Ingot", 
      tier: 3, 
      type: "Metal", 
      baseValue: 25000, 
      source: "World Map Resource Node" // [cite: 1014]
    },
    "MAT-T3-ORE": { 
      id: "MAT-T3-ORE", 
      name: "Adamant Ore", 
      tier: 3, 
      type: "Ore", 
      baseValue: 25000, 
      source: "World Map Resource Node" // [cite: 1014]
    }
  },

  // --- SOULFORGE & CRAFTING CURRENCIES ---
  // Special fuels for endgame item enhancement and finalized upgrades [cite: 1305-1306]
  crafting_resources: {
    "RES-ESSENCE": { 
      id: "RES-ESSENCE", 
      name: "Soul Essence", 
      type: "Crafting Currency", 
      baseValue: 100, 
      source: "Shattering Shadows/Echoes" // [cite: 1305]
    },
    "RES-PRMSUL": { 
      id: "RES-PRMSUL", 
      name: "Primal Soul", 
      type: "Premium Currency", 
      baseValue: 10000, 
      source: "Raid Bosses / Premium Shop" // [cite: 1306, 1307]
    },
    "RES-GEMDUST": { 
      id: "RES-GEMDUST", 
      name: "Gem Dust", 
      type: "Workshop Currency", 
      baseValue: 50, 
      source: "Salvaging Gems" // [cite: 768, 793]
    }
  }
};