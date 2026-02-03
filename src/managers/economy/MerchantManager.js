import { armory as armoryData, jewelry as jewelryData, arcanum as arcanumData } from '../../config/gdd.js';

export class MerchantManager {
    constructor(deps) {
        this.state = deps.state || window.gameManager.state; 
        this.showToast = deps.showToast || ((msg) => console.log(msg));
        this.DataManager = deps.DataManager;
        this.ProfileManager = null; 
    }

    setManagers(managers) {
        this.ProfileManager = managers.ProfileManager;
    }

    /**
     * RETRIEVAL: Fetches the raw data for the storefronts.
     * PRESERVES 'TYPE' (Axe, Cold, etc.) for UI Matching.
     * @param {string} storeType - 'armory' | 'arcanum'
     */
    getShopData(storeType) {
        const items = [];
        
        if (storeType === 'armory') {
            // Flatten Weapons (Preserve Type: axe, bow, etc.)
            if (armoryData && armoryData.weapons) {
                Object.entries(armoryData.weapons).forEach(([type, categoryObj]) => {
                    Object.values(categoryObj).forEach(item => {
                        items.push({ ...item, category: 'Weapons', type: type });
                    });
                });
            }
            // Flatten Armor
            if (armoryData && armoryData.armor) {
                Object.entries(armoryData.armor).forEach(([type, categoryObj]) => {
                    Object.values(categoryObj).forEach(item => {
                        items.push({ ...item, category: 'Armor', type: type });
                    });
                });
            }
            // Flatten Jewelry
            if (jewelryData) {
                 Object.entries(jewelryData).forEach(([type, categoryObj]) => {
                    // Jewelry often has sub-types like 'necklace' or 'ring'
                    Object.values(categoryObj).forEach(item => {
                        items.push({ ...item, category: 'Jewelry', type: type });
                    });
                 });
            }
        } else if (storeType === 'arcanum') {
            // Flatten Spells
            if (arcanumData && arcanumData.spells) {
                Object.entries(arcanumData.spells).forEach(([type, categoryObj]) => {
                    Object.values(categoryObj).forEach(item => {
                        items.push({ ...item, category: 'Spell', type: type });
                    });
                });
            }
            // Flatten Buffs (if they exist in a separate category)
            if (arcanumData && arcanumData.buffs) {
                 Object.entries(arcanumData.buffs).forEach(([type, categoryObj]) => {
                    Object.values(categoryObj).forEach(item => {
                        items.push({ ...item, category: 'Buff', type: type });
                    });
                });
            }
        }
        
        // Sort by Tier ascending
        return items.sort((a, b) => (a.tier || 0) - (b.tier || 0));
    }

    /**
     * TRANSACTION: BUY
     */
    buyItem(baseItem) {
        const p = this.state.player;
        if (!p) return false;

        const price = baseItem.cost || baseItem.price || 999999;

        // 1. Validation
        if (p.gold < price) {
            this.showToast("Insufficient Funds.", true);
            return false;
        }
        
        // 2. Transaction
        p.gold -= price;

        // 3. Item Generation
        const newItem = {
            ...baseItem,
            instanceId: `${baseItem.id}_${Date.now()}_Bought`,
            uuid: crypto.randomUUID(), // Ensure UUID for inventory tracking
            type: baseItem.type || 'Unknown', // Persist type
            qualityMultiplier: 1.0,
            locked: false,
            sellValue: Math.floor(price * 0.25)
        };

        p.inventory.push(newItem);

        // 4. Feedback & Sync
        this.showToast(`Purchased ${baseItem.name}`, false);
        this.sync();
        return true;
    }

    /**
     * TRANSACTION: SELL
     */
    sellItem(itemInstanceOrId) {
        const p = this.state.player;
        if (!p) return false;

        const uuid = typeof itemInstanceOrId === 'string' ? itemInstanceOrId : (itemInstanceOrId.uuid || itemInstanceOrId.instanceId);
        const index = p.inventory.findIndex(i => i.uuid === uuid || i.instanceId === uuid);

        if (index === -1) {
            this.showToast("Item not found in inventory.", true);
            return false;
        }

        const item = p.inventory[index];

        if (item.locked) {
            this.showToast("Item is locked.", true);
            return false;
        }

        const sellPrice = item.sellValue || Math.floor((item.price || item.cost || 0) * 0.2);

        p.inventory.splice(index, 1);
        p.gold += sellPrice;

        this.showToast(`Sold ${item.name} for ${sellPrice.toLocaleString()} G`, false);
        this.sync();
        return true;
    }

    sync() {
        if (this.ProfileManager) this.ProfileManager.saveProfile();
    }
}