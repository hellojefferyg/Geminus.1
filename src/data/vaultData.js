// vaultData.js - Master Gilded Vault & Financial Database (Flattened)
export const vaultData = {
  config: {
    merchantsWritUnlockLevel: 50, // [cite: 1147]
    personalVaultDepositLimit: 0, // 0 = No storage limit [cite: 1139]
    ventureMaxActivePerType: 1,  // [cite: 1164]
    defaultInterestRate: 0.05,    // Future scope passive gold sink [cite: 1156]
    debtTitheRate: 0.50          // 50% of earnings go to debt [cite: 1191, 925]
  },

  // Venture Charters (Investment System) [cite: 1160-1172]
  ventures: {
    "VNT-CARAVAN": {
      id: "VNT-CARAVAN",
      name: "Caravan Escort",
      risk: "Low",
      durationHours: 4,
      baseCost: 1000000,
      roiMin: 1.05, // +5% profit
      roiMax: 1.15, // +15% profit
      description: "A low cost, short duration, and dependable positive ROI." // [cite: 1171]
    },
    "VNT-EXPEDITION": {
      id: "VNT-EXPEDITION",
      name: "Sunken City Expedition",
      risk: "High",
      durationHours: 24,
      baseCost: 50000000,
      roiMin: 0.50, // Potential 50% loss
      roiMax: 3.00, // Potential 200% profit
      description: "A high cost, long duration, and wide ROI range including loss." // [cite: 1172]
    }
  },

  // Merchant's Writ Credit Limits (Tiered by Player Level) [cite: 1149]
  creditLimits: {
    L50:  { maxBorrow: 5000000 },
    L100: { maxBorrow: 25000000 },
    L500: { maxBorrow: 100000000 },
    L1000:{ maxBorrow: 500000000 }
  },

  // Guild Treasury Withdrawal Permissions [cite: 1181-1185]
  guildPermissions: {
    LEADER:  { canDeposit: true, canWithdraw: true, dailyLimit: -1 }, // Unlimited [cite: 1185]
    OFFICER: { canDeposit: true, canWithdraw: true, dailyLimit: 10000000 }, // [cite: 1183]
    MEMBER:  { canDeposit: true, canWithdraw: false, dailyLimit: 0 }  // [cite: 1182]
  },

  // Aurum Exchange Commodities [cite: 1188, 1012-1014]
  exchangeCommodities: {
    "MAT-T1-WOOD": { id: "MAT-T1-WOOD", name: "Heartwood Log", baseValue: 1000 },
    "MAT-T1-ROCK": { id: "MAT-T1-ROCK", name: "Quarry Stone", baseValue: 1000 },
    "MAT-T2-WOOD": { id: "MAT-T2-WOOD", name: "Siege-Grade Timber", baseValue: 5000 },
    "MAT-T2-ROCK": { id: "MAT-T2-ROCK", name: "Fortress Granite", baseValue: 5000 },
    "MAT-T3-METAL":{ id: "MAT-T3-METAL", name: "Bloodsteel Ingot", baseValue: 25000 },
    "MAT-T3-ORE":  { id: "MAT-T3-ORE",   name: "Adamant Ore", baseValue: 25000 }
  }
};