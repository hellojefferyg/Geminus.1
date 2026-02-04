/**
 * @file src/managers/inventory/InventoryManager.js
 * @description Manages player item storage, filtering, and GDD-driven interaction logic.
 */
import { items, races, equipmentSlotConfig, formulas } from '../../config/gdd.js';

export class InventoryManager {
    constructor(deps) {
        this.state = deps.state;
        this.ui = deps.ui;
        this.showToast = deps.showToast;
        this.Systems = deps.Systems;
        
        this.isInitialized = false;
        this.currentFilter = 'all';
    }

    /**
     * Initializes the inventory view and delegates event listeners.
     */
    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        this.setupListeners();
        this.render();
        console.log("🎒 Inventory: Aetherial Bags resonated via Master GDD.");
    }

    setupListeners() {
        if (!this.ui.tabContentInventory) return;

        this.ui.tabContentInventory.addEventListener('click', (e) => {
            const itemCard = e.target.closest('.item-card');
            const filterBtn = e.target.closest('.inventory-filter-btn');

            if (itemCard) {
                this.showItemDetails(itemCard.dataset.instanceId); 
// (This line is actually fine as long as step 1 fills the data attribute correctly, but double check it matches the variable name)
            }

            if (filterBtn) {
                this.currentFilter = filterBtn.dataset.filter;
                this.render();
            }
        });
    }

    /**
     * Renders the grid with GDD-mandated highlights for racial specialization 
     * and equippability warnings.
     */
    render() {
        const container = this.ui.tabContentInventory;
        if (!container || !this.state.player) return;

        const inventory = this.state.player.inventory || [];
        const playerRace = this.state.player.race.toLowerCase();
        // GDD: Highlight items matching racial specialization (e.g., Swords for Humans)
        const racialFocus = races[playerRace]?.specialization || '';

        const filteredItems = this.currentFilter === 'all' 
            ? inventory 
            : inventory.filter(item => item.type.toLowerCase() === this.currentFilter);

        container.innerHTML = `
            <div class="inventory-wrapper p-4 flex flex-col h-full">
                <div class="inventory-filters flex gap-2 mb-4 border-b border-gray-800 pb-3">
                    ${['all', 'weapons', 'armor', 'spells', 'amulet', 'ring'].map(f => `
                        <button class="inventory-filter-btn px-2 py-1 text-[10px] font-orbitron glass-panel ${this.currentFilter === f ? 'border-cyan-500 text-cyan-400' : 'text-gray-500'}" 
                                data-filter="${f}">
                            ${f.toUpperCase()}
                        </button>
                    `).join('')}
                </div>

                <div class="inventory-grid grid grid-cols-5 gap-2 overflow-y-auto">
                    ${filteredItems.map(item => this.generateItemCardHTML(item, playerRace, racialFocus)).join('')}
                    ${this.generateEmptySlotsHTML(40 - filteredItems.length)}
                </div>
            </div>
        `;
    }

    /**
     * @param {Object} item - The item instance
     * @param {string} race - Player race
     * @param {string} focus - Racial weapon focus from Appendix A1
     */
    generateItemCardHTML(item, race, focus) {
        // GDD Rule: Red marking for items above player level (Section 4.3.1.3)
        const levelError = item.level > this.state.player.level ? 'border-red-900/50 bg-red-900/10' : '';
        
        // GDD Rule: Special glow for racial specialization (Section 4.3.1.3)
        const isSpecialized = item.subType?.toLowerCase() === focus.toLowerCase();
        const specializationGlow = isSpecialized ? 'shadow-[0_0_10px_rgba(34,211,238,0.4)] border-cyan-400/50' : 'border-gray-800';

        // GDD Rule: Visual distinction for Shadow vs Standard (Section 6.2)
        // Check both baseItemId and instanceId for shadow items
        const itemId = item.baseItemId || item.instanceId || item.id || '';
        const isShadow = item.type === 'Shadow' || itemId.includes('-shadow-') || itemId.includes('_S_');
        const shadowOverlay = isShadow ? '<div class="absolute inset-0 bg-purple-500/10 pointer-events-none"></div>' : '';

        return `
            <div class="item-card relative aspect-square glass-panel cursor-pointer transition-all hover:scale-105 group ${specializationGlow} ${levelError}" 
                 data-instance-id="${item.uuid || item.instanceId}">
                ${shadowOverlay}
                <img src="${item.imageUrl}" class="w-full h-full object-contain p-1" alt="${item.name}">
                
                <div class="absolute top-1 right-1 flex gap-0.5">
                    ${(item.sockets || []).map(gem => `
                        <div class="w-1.5 h-1.5 rounded-full" style="background: ${gem.color || '#fff'}"></div>
                    `).join('')}
                </div>

                <div class="absolute bottom-0 right-0 px-1 bg-black/80 text-[8px] text-gray-400 font-orbitron">
                    T${item.tier || 1}
                </div>
            </div>
        `;
    }

    generateEmptySlotsHTML(count) {
        if (count <= 0) return '';
        return Array(count).fill(0).map(() => `
            <div class="aspect-square glass-panel border-gray-800/20 opacity-30"></div>
        `).join('');
    }

    showItemDetails(instanceId) {
        // [FIX] Support both UUID (Shop) and InstanceID (Legacy)
const item = this.state.player.inventory.find(i => i.uuid === instanceId || i.instanceId === instanceId);
        if (!item) return;

        // Bridge to ModalManager for the "Item Examination" panel (Section 4.3.1.2)
        if (window.gameManager?.ModalManager) {
            window.gameManager.ModalManager.showItemInspector(item);
        } else {
            const baseItem = this.findBaseItem(item.baseItemId);
            const itemName = baseItem?.name || item.baseItemId || 'Unknown Item';
            this.showToast(`${itemName} (Tier ${item.tier || 1})`, false);
        }
    }
    /**
     * [FIX] Missing Helper for EquipmentManager
     * Generates the little gem dots overlay on item icons.
     */
    generateGemOverlaysHTML(item) {
        if (!item || !item.sockets || item.sockets.length === 0) return '';
        
        // Returns a container with small colored dots for each socketed gem
        return `
            <div class="absolute top-0.5 right-0.5 flex flex-col gap-0.5 pointer-events-none z-10">
                ${item.sockets.map(gem => `
                    <div class="w-1.5 h-1.5 rounded-full border border-black/50 shadow-sm" 
                         style="background-color: ${gem.color || '#fff'}; box-shadow: 0 0 2px ${gem.color || '#fff'};">
                    </div>
                `).join('')}
            </div>
        `;
    }
}