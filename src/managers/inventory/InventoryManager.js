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
   * [ARCHITECT FIX] Text-Only Mode (Dev)
   * Disables images to prevent 404/CORB errors. Shows "Type T#" instead.
   */
  render() {
      // 1. Container Check
      let container = this.ui.inventoryGrid || document.getElementById('inventory-grid');
      if (!container && this.ui.tabContentInventory) {
           container = this.ui.tabContentInventory.querySelector('#inventory-grid') || this.ui.tabContentInventory.querySelector('.inventory-grid');
      }
      if (!container) return;

      container.innerHTML = '';

      // 2. Get & Filter Items
      const rawInventory = this.state.player.inventory || [];
      const filteredItems = rawInventory.filter(item => {
          const base = items[item.id] || items[item.baseItemId] || {};
          const full = { ...base, ...item };
          const cat = (full.category || full.type || '').toLowerCase();
          
          if (this.currentFilter === 'all') return true;
          if (this.currentFilter === 'weapon') return cat.includes('weapon') || ['axe','sword','bow','staff','dagger','mace','claw'].includes(cat);
          if (this.currentFilter === 'armor') return cat.includes('armor') || ['helmet','chest','leggings','gloves','boots'].includes(cat);
          if (this.currentFilter === 'jewelry') return ['ring','necklace','artifact'].includes(cat);
          return false;
      });

      if (filteredItems.length === 0) {
          container.innerHTML = `<div class="col-span-full text-gray-500 text-center p-4">Empty</div>`;
          return;
      }

      // 3. Render Cards (TEXT ONLY MODE)
      container.innerHTML = filteredItems.map(item => {
          const baseItem = items[item.id] || items[item.baseItemId] || {};
          const displayItem = { ...baseItem, ...item };
          
          const name = displayItem.name || "Item";
          const tier = displayItem.tier || 1;
          const type = (displayItem.type || 'Misc'); // Keep casing for display
          
          // Generate Stat String for Tooltip
          let statString = "";
          if (displayItem.wc) statString = `WC: ${displayItem.wc}`;
          else if (displayItem.ac) statString = `AC: ${displayItem.ac}`;
          else if (displayItem.sc) statString = `SC: ${displayItem.sc}`;
          else if (displayItem.hp_regen_percent) statString = "Regen";
          else statString = displayItem.type || "Misc";

          return `
              <div class="item-card relative border border-gray-600 bg-gray-900/80 p-1 rounded cursor-pointer hover:bg-gray-800 group h-14 flex items-center justify-center"
                   onclick="window.gameManager.InventoryManager.showItemDetails('${item.uuid || item.instanceId}')">
                  
                  <div class="flex flex-col items-center justify-center text-center w-full">
                      <span class="text-[10px] font-bold text-cyan-200 leading-none">${type}</span>
                      <span class="text-[9px] font-mono text-yellow-500 mt-0.5">T${tier}</span>
                  </div>
                  
                  ${displayItem.qty > 1 ? `<span class="absolute bottom-0 right-0 bg-blue-900 text-[9px] px-1 rounded-tl">${displayItem.qty}</span>` : ''}
                  
                  <div class="hidden group-hover:flex flex-col absolute inset-0 bg-black/95 z-20 items-center justify-center text-center p-1 border border-cyan-500/50">
                      <span class="text-[9px] text-cyan-100 font-bold leading-tight mb-1">${name}</span>
                      <span class="text-[9px] text-yellow-400 font-mono">${statString}</span>
                  </div>
              </div>
          `;
      }).join('');
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

    /**
     * [ARCHITECT FIX] Shows item details using the Master Registry.
     * Fixes "No Stats" by correctly looking up base data.
     */
    showItemDetails(instanceId) {
        const item = this.state.player.inventory.find(i => i.uuid === instanceId || i.instanceId === instanceId);
        if (!item) return;

        // [ARCHITECT FIX] Merge Registry Data with Instance Data
        // This ensures we get the Stats from the Registry AND the UUID from the Instance
        const registryData = items[item.id] || items[item.baseItemId] || {};
        const fullItemData = { ...registryData, ...item };

        if (window.gameManager?.ModalManager) {
            window.gameManager.ModalManager.showItemInspector(fullItemData);
        } else {
            // Fallback
            const name = fullItemData.name || 'Unknown Item';
            const stats = [];
            if (fullItemData.wc) stats.push(`WC: ${fullItemData.wc}`);
            if (fullItemData.ac) stats.push(`AC: ${fullItemData.ac}`);
            
            this.showToast(`${name} ${stats.join(' ')}`, false);
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