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

    // Set local and global state
    this.isPlayerDefeated = true;
    this.state.game.combatActive = false;
    
    if (this.state.player) {
      this.state.player.isDefeated = true;
    }

    console.log("💀 SanctuaryManager: Player Defeated. Initiating Soul Recall...");

    // Update Combat Log
    if (this.CombatManager) {
      this.CombatManager.logToGame("<span class='log-enemy text-red-600 font-bold'>You have been defeated!</span>");
      this.CombatManager.logToGame("<span class='log-system italic'>Your soul drifts... Travel to the Sanctuary on the map to revive.</span>");
    }

    // Notify Player via Toast
    if (this.showToast) {
        this.showToast("DEFEATED. Travel to the Sanctuary building to mend your soul.", true);
    }

    // Sync with DataManager for persistence
    if (this.DataManager) {
        this.DataManager.updatePlayer({ isDefeated: true });
    }
  }

  /**
   * [NEW] Called by sanctuary.html when the player makes a choice.
   * @param {string} strategy - 'PENITENT' or 'BARGAIN'
   */
  commitRevival(strategy) {
    if (!this.state.player) return;
    
    const p = this.state.player;
    const isPvp = p.lastDeathType === 'PVP_DEATH';
    const PENALTY = { GOLD: 1.0, XP: 1.0 }; 

    // 1. Enforce PVP Restrictions 
    if (isPvp && strategy === 'BARGAIN') {
        if (this.GameManager && this.GameManager.showToast) {
            this.GameManager.showToast("The Echo refuses to bargain for a warrior's death.", true);
        }
        return; // Block the execution
    }

    if (strategy === 'PENITENT') {
        const goldLoss = Math.floor(p.gold * PENALTY.GOLD);
        const xpLoss = Math.floor(p.xp * PENALTY.XP);
        
        // In PVP, gold is already claimed by the victor; we ensure it is zeroed here [cite: 924, 925]
        p.gold = 0;
        p.xp = 0;
        
        if (this.GameManager && this.GameManager.showToast) {
            const msg = isPvp ? `Revived. Consequences of combat accepted.` : `Revived. Paid ${goldLoss} Gold and ${xpLoss} XP.`;
            this.GameManager.showToast(msg, false);
        }
    } 
    else if (strategy === 'BARGAIN' && !isPvp) {
        // Standard Bargain logic (Only for PVE) [cite: 920, 925]
        const goldDebtAmount = Math.floor(p.gold * PENALTY.GOLD);
        const xpDebtAmount = Math.floor(p.xp * PENALTY.XP);

        if (!p.soulDebt) {
            p.soulDebt = { gold: 0, xp: 0, goldDebtTotal: 0, xpDebtTotal: 0 };
        }
        
        p.soulDebt.gold += goldDebtAmount;
        p.soulDebt.xp += xpDebtAmount;
        p.soulDebt.goldDebtTotal += goldDebtAmount;
        p.soulDebt.xpDebtTotal += xpDebtAmount;

        if (this.GameManager && this.GameManager.showToast) {
            this.GameManager.showToast("Revived. Soul Debt incurred (50% Tithe active).", true);
        }
    }

    // Restore Soul State
    this.isPlayerDefeated = false;
    p.isDefeated = false;
    p.hp = p.derivedStats.maxHp; 
    
    // Sync with DataManager for Cloud Persistence
    if (this.DataManager) {
        this.DataManager.updatePlayer({ 
            hp: p.hp, 
            gold: p.gold, 
            xp: p.xp, 
            soulDebt: p.soulDebt,
            isDefeated: false // [FIX] Ensure the cloud knows player is no longer a ghost
        });
    }

    // Refresh UI Resonance [cite: 54, 401]
    if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();
    if (this.CombatManager) this.CombatManager.updateCombatInfoPanel();

    // Close Module Overlay to reveal map [cite: 54, 201]
    const overlay = window.parent.document.getElementById('module-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  /**
   * Processes a manual tithe payment using gold from the Gilded Vault.
   * Per GDD 3.5.2, debt can be repaid manually at the Sanctuary.
   * @param {number} amount - The amount of gold to pay.
   */
  payDebtWithVaultGold(amount) {
    if (!this.state.player || !this.state.player.soulDebt) return;
    
    const p = this.state.player;
    const payment = Math.floor(amount);

    // 1. Validation
    if (payment <= 0) return;
    if (payment > (p.gildedVaultGold || 0)) {
        if (this.showToast) this.showToast("Insufficient gold in Gilded Vault.", true);
        return;
    }

    // 2. Deduct from Gilded Vault
    p.gildedVaultGold -= payment;
    let remainingPayment = payment;

    // 3. Apply to Gold Debt first
    if (p.soulDebt.gold > 0) {
        const goldPaid = Math.min(remainingPayment, p.soulDebt.gold);
        p.soulDebt.gold -= goldPaid;
        remainingPayment -= goldPaid;
    }

    // 4. Apply any leftover to XP Debt
    if (remainingPayment > 0 && p.soulDebt.xp > 0) {
        const xpPaid = Math.min(remainingPayment, p.soulDebt.xp);
        p.soulDebt.xp -= xpPaid;
        remainingPayment -= xpPaid;
    }

    // 5. Check if Debt is cleared
    if (p.soulDebt.gold <= 0 && p.soulDebt.xp <= 0) {
        p.soulDebt.gold = 0;
        p.soulDebt.xp = 0;
        p.soulDebt.goldDebtTotal = 0;
        p.soulDebt.xpDebtTotal = 0;
        if (this.showToast) this.showToast("Soul Debt fully repaid!", false);
    } else {
        if (this.showToast) this.showToast(`Paid ${payment} Gold towards Soul Debt.`, false);
    }

    // 6. Sync Persistence and Refresh HUD
    if (this.DataManager) {
        this.DataManager.updatePlayer({ 
            gildedVaultGold: p.gildedVaultGold,
            soulDebt: p.soulDebt 
        });
    }
    if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();
  }

  }