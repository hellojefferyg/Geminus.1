export class VaultManager {
    constructor(deps) {
        this.state = deps.state;
        this.showToast = deps.showToast;
        this.DataManager = deps.DataManager;
        this.ProfileManager = null; // Set via setManagers
    }

    setManagers(managers) {
        this.ProfileManager = managers.ProfileManager;
    }

    /**
     * Deposit Gold into the Gilded Vault
     * @param {number} amount 
     */
    deposit(amount) {
        const p = this.state.player;
        if (!p) return;

        // Validation
        if (amount <= 0) {
            this.showToast("Invalid amount.", true);
            return;
        }
        if (p.gold < amount) {
            this.showToast("Insufficient gold on hand.", true);
            return;
        }

        // Transaction
        p.gold -= amount;
        p.gildedVaultGold = (p.gildedVaultGold || 0) + amount;

        // Feedback
        this.showToast(`Deposited ${amount.toLocaleString()} Gold into Vault.`, false);
        this.sync();
    }

    /**
     * Withdraw Gold from the Gilded Vault
     * @param {number} amount 
     */
    withdraw(amount) {
        const p = this.state.player;
        if (!p) return;

        // Validation
        if (amount <= 0) {
            this.showToast("Invalid amount.", true);
            return;
        }
        if ((p.gildedVaultGold || 0) < amount) {
            this.showToast("Insufficient gold in Vault.", true);
            return;
        }

        // Transaction
        p.gildedVaultGold -= amount;
        p.gold += amount;

        // Feedback
        this.showToast(`Withdrew ${amount.toLocaleString()} Gold.`, false);
        this.sync();
    }

    /**
     * Pay Soul Debt directly from Vault (Remote Access)
     * Used by Sanctuary Logic
     */
    paySoulDebt(amount) {
        const p = this.state.player;
        if (!p || !p.soulDebt) return false;

        if ((p.gildedVaultGold || 0) < amount) return false;

        // 1. Deduct from Vault
        p.gildedVaultGold -= amount;

        // 2. Apply against Debt (Gold first, then XP conversion if GDD allows, but usually just Gold Debt)
        let remainingPayment = amount;
        
        if (p.soulDebt.gold > 0) {
            const paid = Math.min(remainingPayment, p.soulDebt.gold);
            p.soulDebt.gold -= paid;
            remainingPayment -= paid;
        }

        if (remainingPayment > 0) {
            this.showToast(`Paid ${amount - remainingPayment} Gold towards Soul Debt.`, false);
        } else {
            this.showToast(`Paid ${amount} Gold towards Soul Debt.`, false);
        }

        this.sync();
        return true;
    }

    /**
     * Syncs state to UI and Database
     */
    sync() {
        if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();
        
        this.DataManager.updatePlayer({ 
            gold: this.state.player.gold, 
            gildedVaultGold: this.state.player.gildedVaultGold,
            soulDebt: this.state.player.soulDebt
        });
    }
}