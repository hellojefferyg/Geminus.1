export class SanctuaryManager {
  constructor(deps) {
    this.state = deps.state;
    this.showToast = deps.showToast;
    this.DataManager = deps.DataManager;
    this.CombatManager = null; // Set later
    this.ProfileManager = null; // Set later
    this.isPlayerDefeated = false;
  }

  setManagers(managers) {
    this.CombatManager = managers.CombatManager;
    this.ProfileManager = managers.ProfileManager;
    this.GameManager = managers.GameManager; // [NEW] Required to open modules
  }

  handlePlayerDefeat() {
    if (this.isPlayerDefeated) return;

    this.isPlayerDefeated = true;
    this.state.game.combatActive = false;
    console.log("💀 SanctuaryManager: Player Defeated. Initiating Soul Recall...");

    // [CRITICAL CHANGE] Do NOT strip gold/xp here. 
    // We wait for the player to choose their path in the Sanctuary.

    if (this.CombatManager) {
      this.CombatManager.logToGame("<span class='log-enemy'>You have been defeated!</span>");
      this.CombatManager.logToGame(`<span class='log-system'>Your soul drifts to the Sanctuary...</span>`);
    }

    // [NEW] Open the Sanctuary Module (sanctuary.html)
    if (this.GameManager && this.GameManager.openModule) {
        setTimeout(() => {
            this.GameManager.openModule('sanctuary'); 
        }, 1500); // Cinematic delay
    } else {
        console.error("❌ SanctuaryManager: Cannot open Sanctuary module. GameManager missing.");
    }
  }

  /**
   * [NEW] Called by sanctuary.html when the player makes a choice.
   * @param {string} strategy - 'PENITENT' or 'BARGAIN'
   */
  commitRevival(strategy) {
    if (!this.state.player) return;
    
    const p = this.state.player;
    // GDD Constants (Fallback if not imported)
    const PENALTY = { GOLD: 1.0, XP: 1.0 }; 

    if (strategy === 'PENITENT') {
        // Option A: Lose Assets, Clean Slate
        const goldLoss = Math.floor(p.gold * PENALTY.GOLD);
        const xpLoss = Math.floor(p.xp * PENALTY.XP);
        
        p.gold = Math.max(0, p.gold - goldLoss);
        p.xp = Math.max(0, p.xp - xpLoss);
        
        this.showToast(`Revived. Lost ${goldLoss} Gold and ${xpLoss} XP.`, false);
    } 
    else if (strategy === 'BARGAIN') {
        // Option B: Keep Assets, Incur Debt
        // Calculate what they WOULD have lost
        const goldDebt = Math.floor(p.gold * PENALTY.GOLD);
        const xpDebt = Math.floor(p.xp * PENALTY.XP);

        // Apply to Soul Debt
        if (!p.soulDebt) p.soulDebt = { gold: 0, xp: 0, goldDebtTotal: 0, xpDebtTotal: 0 };
        
        p.soulDebt.gold += goldDebt;
        p.soulDebt.xp += xpDebt;
        p.soulDebt.goldDebtTotal += goldDebt;
        p.soulDebt.xpDebtTotal += xpDebt;

        this.showToast("Revived. Soul Debt Incurred.", true);
    }

    // REVIVE LOGIC
    this.isPlayerDefeated = false;
    p.hp = p.derivedStats.maxHp;
    
    // Update Cloud
    this.DataManager.updatePlayer({ 
        hp: p.hp, 
        gold: p.gold, 
        xp: p.xp, 
        soulDebt: p.soulDebt 
    });

    // Refresh UI
    if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();
    if (this.CombatManager) this.CombatManager.updateCombatInfoPanel();
  }

  }