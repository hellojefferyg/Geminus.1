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
   * [ARCHITECT FIX] Renders Inventory with Smart Shadow Sorting.
   * - Deduce category from Item Name if Type is 'Shadow'.
   * - Strict tab separation (Armor stays in Armor, Weapons in Weapons).
   */
  render() {
      // 1. Locate Container
      let tabContent = this.ui.tabContentInventory || document.getElementById('tab-content-inventory');
      if (!tabContent) return;

      // 2. Cleanup Old Bars
      const oldBars = tabContent.querySelectorAll('.inventory-filters, .inventory-filters-container');
      oldBars.forEach(el => el.remove());

      // 3. Init State
      if (!this.currentFilter) this.currentFilter = 'all';

      // 4. Render Filter Bar
      let filterContainer = tabContent.querySelector('.inventory-filters-container');
      if (!filterContainer) {
          filterContainer = document.createElement('div');
          filterContainer.className = 'inventory-filters-container mb-4 p-2 bg-black/20 rounded-lg flex gap-2 overflow-x-auto custom-scrollbar';
          tabContent.insertBefore(filterContainer, tabContent.firstChild);
          
          filterContainer.addEventListener('click', (e) => {
              const btn = e.target.closest('.filter-btn');
              if (btn) {
                  this.currentFilter = btn.dataset.filter;
                  this.render(); 
              }
          });
      }

      const filters = [
          { id: 'all', label: 'All' },
          { id: 'weapon', label: 'Weapons' },
          { id: 'armor', label: 'Armor' },
          { id: 'jewelry', label: 'Jewelry' },
          { id: 'spell', label: 'Spells' },
          { id: 'gem', label: 'Gems' },
          { id: 'misc', label: 'Others' }
      ];

      filterContainer.innerHTML = filters.map(f => {
          const isActive = this.currentFilter === f.id;
          const activeClass = 'bg-cyan-700 text-white border-cyan-500';
          const inactiveClass = 'text-cyan-400 border-cyan-700/50 hover:bg-cyan-900/50';
          return `<button class="filter-btn px-3 py-1 rounded text-xs font-bold border transition-colors whitespace-nowrap ${isActive ? activeClass : inactiveClass}" data-filter="${f.id}">${f.label}</button>`;
      }).join('');

      // 5. Grid Container
      let grid = tabContent.querySelector('#inventory-grid');
      if (!grid) {
          grid = document.createElement('div');
          grid.id = 'inventory-grid';
          grid.className = 'grid grid-cols-5 gap-2 overflow-y-auto max-h-[400px] p-1 custom-scrollbar';
          tabContent.appendChild(grid);
      }
      grid.innerHTML = '';

      // 6. [FIX] Smart Filter Logic
      const rawInventory = this.state.player.inventory || [];
      const filteredItems = rawInventory.filter(item => {
          const base = items[item.id] || items[item.baseItemId] || {};
          const full = { ...base, ...item };
          
          let cat = (full.category || '').toLowerCase();
          const type = (full.type || '').toLowerCase();
          const name = (full.name || '').toLowerCase();

          // [CRITICAL FIX] Shadow Categorization
          // If item is a Shadow, we MUST infer category from the name because 'type' is just 'Shadow'
          if (type === 'shadow' || name.includes('shadow')) {
              if (['helmet','chest','leggings','gloves','boots','shield'].some(k => name.includes(k))) {
                  cat = 'armor';
              } else if (['axe','sword','bow','staff','dagger','mace','claw'].some(k => name.includes(k))) {
                  cat = 'weapons';
              } else if (['ring','necklace','amulet'].some(k => name.includes(k))) {
                  cat = 'jewelry';
              }
          }

          // --- LOGIC GATES ---
          if (this.currentFilter === 'all') return true;
          
          if (this.currentFilter === 'weapon') {
              return cat.includes('weapon');
          }
          
          if (this.currentFilter === 'armor') {
              return cat.includes('armor');
          }
          
          if (this.currentFilter === 'jewelry') {
              return cat.includes('jewelry');
          }
          
          if (this.currentFilter === 'spell') {
              return cat.includes('spell') || cat.includes('buff');
          }

          if (this.currentFilter === 'gem') {
              return cat.includes('gem') || type.includes('gem') || name.includes('stone') || name.includes('rite') || name.includes('core');
          }

          if (this.currentFilter === 'misc') {
              const isWeapon = cat.includes('weapon');
              const isArmor = cat.includes('armor');
              const isJewelry = cat.includes('jewelry');
              const isSpell = cat.includes('spell') || cat.includes('buff');
              const isGem = cat.includes('gem') || type.includes('gem') || name.includes('stone');
              return !isWeapon && !isArmor && !isJewelry && !isSpell && !isGem;
          }
          
          return false;
      });

      // 7. Render
      if (filteredItems.length === 0) {
          grid.innerHTML = `<div class="col-span-full text-gray-500 text-center p-4 italic">No items found.</div>`;
          return;
      }

      grid.innerHTML = filteredItems.map(item => {
          const baseItem = items[item.id] || items[item.baseItemId] || {};
          const displayItem = { ...baseItem, ...item };
          
          const name = displayItem.name || "Item";
          const tier = displayItem.tier || 1;
          const targetId = item.uuid || item.instanceId;
          const isShadow = (displayItem.type === 'Shadow' || name.includes('Shadow'));
          
          let statString = "";
          if (displayItem.wc) statString = `WC: ${displayItem.wc}`;
          else if (displayItem.ac) statString = `AC: ${displayItem.ac}`;
          else if (displayItem.sc) statString = `SC: ${displayItem.sc}`;
          else if (displayItem.hp_regen_percent) statString = "Regen";
          else if (displayItem.category === 'Gem') statString = "Gem"; 
          else statString = displayItem.category || "Misc";

          const nameColor = isShadow ? 'text-purple-400' : 'text-cyan-200';
          const borderColor = isShadow ? 'border-purple-500/50' : 'border-gray-600';
          const tierColor = isShadow ? 'text-purple-300' : 'text-yellow-500';

          return `
              <div class="item-card relative border ${borderColor} bg-gray-900/80 p-1 rounded cursor-pointer hover:bg-gray-800 group h-14 flex items-center justify-center transition-all"
                   data-instance-id="${targetId}" 
                   onclick="window.gameManager.InventoryManager.showItemDetails('${targetId}')">
                  <div class="flex flex-col items-center justify-center text-center w-full overflow-hidden">
                      <span class="text-[10px] font-bold ${nameColor} leading-none px-1 truncate w-full">${name}</span>
                      <span class="text-[9px] font-mono ${tierColor} mt-0.5">T${tier}</span>
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