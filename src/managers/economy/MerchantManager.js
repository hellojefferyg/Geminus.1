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

    getShopData(storeType) {
        const items = [];
        
        if (storeType === 'armory') {
            if (armoryData && armoryData.weapons) {
                Object.entries(armoryData.weapons).forEach(([type, subCategoryObj]) => {
                    Object.values(subCategoryObj).forEach(item => {
                        items.push({ 
                            ...item, 
                            category: 'Weapons', 
                            type: type, 
                            levelReq: item.str_req || item.int_req || item.vit_req || 1
                        });
                    });
                });
            }
            if (armoryData && armoryData.armor) {
                Object.entries(armoryData.armor).forEach(([type, subCategoryObj]) => {
                    Object.values(subCategoryObj).forEach(item => {
                        items.push({ 
                            ...item, 
                            category: 'Armor', 
                            type: type, 
                            levelReq: item.vit_req || 1 
                        });
                    });
                });
            }
            if (jewelryData) {
                ['necklace', 'ring'].forEach(cat => {
                    if (jewelryData[cat]) {
                        Object.values(jewelryData[cat]).forEach(item => {
                            items.push({ ...item, category: 'Jewelry', type: cat, levelReq: item.vit_req || 1 });
                        });
                    }
                });
            }
        } 

        else if (storeType === 'arcanum') {
            if (arcanumData) {
                if (arcanumData.spells) {
                    Object.entries(arcanumData.spells).forEach(([type, subCategoryObj]) => {
                        Object.values(subCategoryObj).forEach(item => {
                            items.push({ ...item, category: 'Spell', type: type, levelReq: item.ntl_req || 1 });
                        });
                    });
                }
                // [FIX] Match 'Buff' key in arcanumData.js
                if (arcanumData.Buff) { 
                    Object.entries(arcanumData.Buff).forEach(([type, subCategoryObj]) => {
                        Object.values(subCategoryObj).forEach(item => {
                            items.push({ ...item, category: 'Buff', type: type, levelReq: item.str_req || 1 });
                        });
                    });
                }
            }
            if (jewelryData && jewelryData.artifact) {
                Object.values(jewelryData.artifact).forEach(item => {
                    items.push({ ...item, category: 'Artifacts', type: 'Artifact', levelReq: item.vit_req || 1 });
                });
            }
        }
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
            sellValue: Math.floor(price * 0.25),
            sockets: 2, // [ARCHITECT FIX] Strict Schema: Integer Capacity
            socketedGems: [] // [ARCHITECT FIX] Strict Schema: Array Contents
        };

        p.inventory.push(newItem);

        // 4. Feedback & Sync
        this.showToast(`Purchased ${baseItem.name}`, false);
        this.sync();
        return true;
    }

    /**
     * TRANSACTION: SELL (With Buyback Support)
     */
    sellItem(itemInstanceOrId) {
        const p = this.state.player;
        if (!p) return false;

        const uuid = typeof itemInstanceOrId === 'string' ? itemInstanceOrId : (itemInstanceOrId.uuid || itemInstanceOrId.instanceId);
        const index = p.inventory.findIndex(i => i.uuid === uuid || i.instanceId === uuid);

        if (index === -1) {
            this.showToast("Item not found.", true);
            return false;
        }

        const item = p.inventory[index];
        if (item.locked) {
            this.showToast("Item is locked.", true);
            return false;
        }

        // 1. Calculate Price (25% of original price)
        const sellPrice = item.sellValue || Math.floor((item.price || item.cost || 0) * 0.25);

        // 2. Add to Buyback Buffer before removing from inventory
        if (!this.buybackStock) this.buybackStock = [];
        this.buybackStock.unshift({ ...item, buybackPrice: sellPrice });
        
        // Keep only the last 10 sold items
        if (this.buybackStock.length > 10) this.buybackStock.pop();

        // 3. Execute Transaction
        p.inventory.splice(index, 1);
        p.gold += sellPrice;

        this.showToast(`Sold ${item.name} for ${sellPrice.toLocaleString()} G`, false);
        this.sync();
        return true;
    }

    /**
     * TRANSACTION: BUYBACK
     */
    buybackItem(index) {
        const p = this.state.player;
        const item = this.buybackStock[index];
        
        if (!item || p.gold < item.buybackPrice) {
            this.showToast("Insufficient gold for buyback.", true);
            return false;
        }

        p.gold -= item.buybackPrice;
        
        // Remove the buyback helper property before returning to inventory
        const { buybackPrice, ...cleanItem } = item;
        p.inventory.push(cleanItem);
        
        this.buybackStock.splice(index, 1);
        this.showToast(`Recovered ${cleanItem.name}`, false);
        this.sync();
        return true;
    }

    sync() {
        if (this.ProfileManager) this.ProfileManager.saveProfile();
    }
}
