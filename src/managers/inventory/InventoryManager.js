/**
 * @file src/managers/inventory/InventoryManager.js
 * @description Manages player item storage, filtering, search, and GDD-driven interaction logic.
 */
import { items, races, equipmentSlotConfig, formulas, gems } from '../../config/gdd.js'; // [ARCHITECT FIX] Import gems

export class InventoryManager {
    constructor(deps) {
        this.state = deps.state;
        this.ui = deps.ui;
        this.showToast = deps.showToast;
        this.Systems = deps.Systems;
        
        this.isInitialized = false;
        
        // [ARCHITECT PRESERVED] Filter State
        this.currentFilter = 'all'; 
        this.subFilter = 'all';     
        this.searchQuery = '';      

        // [ARCHITECT FIX] Global Tooltip Reference (Fixes clipping issues)
        this.tooltipEl = null;
    }

    /**
     * Initializes the inventory view and delegates event listeners.
     */
    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        // [ARCHITECT FIX] Expose Master Registries to external UI frames (Soulforge, Gemcutter, etc.)
        if (window.gameManager) {
            window.gameManager.items = items;
            window.gameManager.gems = gems;
        }
        
        this.createGlobalTooltip(); // [FIX] Initialize floating tooltip layer
        this.setupListeners();
        this.render();
        console.log("🎒 Inventory: Visuals, Filters & Tooltips Resonated.");
    }

    /**
     * [ARCHITECT NEW] Public Refresh Method
     */
    refresh() {
        // Only render if the inventory tab is actually visible to save performance
        if (this.ui.tabContentInventory && this.ui.tabContentInventory.offsetParent !== null) {
            this.render();
        }
    }

    setupListeners() {
        if (!this.ui.tabContentInventory) return;

        // Delegated listener for optimized performance
        this.ui.tabContentInventory.addEventListener('click', (e) => {
            const itemCard = e.target.closest('.item-card');
            
            // Handle Item Clicks (Inspector)
            if (itemCard) {
                this.showItemDetails(itemCard.dataset.instanceId); 
            }
        });
    }

    /**
     * [ARCHITECT FIX] Creates a single tooltip attached to the body.
     * This prevents the tooltip from being hidden by the inventory scroll bar or search box.
     */
    createGlobalTooltip() {
        if (document.getElementById('global-item-tooltip')) return;

        const el = document.createElement('div');
        el.id = 'global-item-tooltip';
        // High Z-Index ensures it floats over EVERYTHING
        el.className = 'fixed hidden pointer-events-none z-[9999] bg-black/95 border border-cyan-500/50 p-2 rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] flex-col min-w-[120px] max-w-[200px]';
        document.body.appendChild(el);
        this.tooltipEl = el;
    }
    /**
   * [NEW] Deep searches the imported items configuration for base item data.
   * Bypasses DataManager failures for nested categories (like weapons.Sword).
   */
  findItemBaseData(baseItemId) {
      if (!baseItemId || !items) return null;
      for (const category of Object.values(items)) {
          if (!category || typeof category !== 'object') continue;
          if (category[baseItemId]) return category[baseItemId]; // Flat check
          for (const subCategory of Object.values(category)) { // Nested check
              if (subCategory && typeof subCategory === 'object' && subCategory[baseItemId]) {
                  return subCategory[baseItemId];
              }
          }
      }
      return null;
  }
    /**
     * [ARCHITECT FIX] Renders Inventory with Search (w/ Clear Button), Sub-Filters & Smart Sorting.
     */
    render() {
        let tabContent = this.ui.tabContentInventory || document.getElementById('tab-content-inventory');
        if (!tabContent) return;

        // 1. Define Sub-Filter Maps
        const SUB_FILTERS = {
            weapon: ['Axe', 'Bow', 'Claw', 'Dagger', 'Mace', 'Staff', 'Sword', 'Shield', 'Orb'],
            armor: ['Helmet', 'Chest', 'Leggings', 'Boots', 'Gloves'],
            // Added the missing elements from your DNA database
            spell: ['Air', 'Arcane', 'Cold', 'Ice', 'Death', 'Drain', 'Earth', 'Fire', 'Might', 'Guard', 'Swiftness'],
            jewelry: ['Ring', 'Necklace'],
            gem: [], 
            misc: ['Resource', 'Estate', 'Clan', 'Crafting', 'Quest'], // [ARCHITECT FIX] Added Misc sub-tabs for resources
            all: []
        };

        // 2. Create/Clear Control Bar Container
        let controlBar = tabContent.querySelector('.inventory-controls');
        if (!controlBar) {
            const oldBars = tabContent.querySelectorAll('.inventory-filters, .inventory-filters-container');
            oldBars.forEach(el => el.remove());

            controlBar = document.createElement('div');
            controlBar.className = 'inventory-controls flex flex-col gap-2 mb-4 p-2 bg-black/40 rounded-lg border border-gray-700';
            tabContent.insertBefore(controlBar, tabContent.firstChild);
        }
        controlBar.innerHTML = ''; 

        // --- A. SEARCH BAR (With "X" Button) ---
        const searchRow = document.createElement('div');
        searchRow.className = 'flex w-full relative items-center';
        
        // Search Input
        searchRow.innerHTML = `
            <input type="text" id="inv-search" 
                   class="w-full bg-gray-900 text-cyan-100 text-xs p-2 pr-8 rounded border border-gray-600 focus:border-cyan-500 outline-none font-mono" 
                   placeholder="Search Name, Stats, or Type..." value="${this.searchQuery}">
            
            ${this.searchQuery ? 
                `<button id="inv-clear-search" class="absolute right-2 text-gray-500 hover:text-cyan-400 font-bold transition-colors">✕</button>` 
                : ''}
        `;
        controlBar.appendChild(searchRow);

        // --- B. FILTER TABS ---
        const tabsRow = document.createElement('div');
        tabsRow.className = 'flex gap-2 overflow-x-auto custom-scrollbar pb-1';
        
        const filters = [
            { id: 'all', label: 'All' },
            { id: 'weapon', label: 'Weapons' },
            { id: 'armor', label: 'Armor' },
            { id: 'jewelry', label: 'Jewelry' },
            { id: 'spell', label: 'Spells' },
            { id: 'gem', label: 'Gems' },
            { id: 'misc', label: 'Misc' }
        ];

        tabsRow.innerHTML = filters.map(f => {
            const isActive = this.currentFilter === f.id;
            const activeClass = 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.3)]';
            const inactiveClass = 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700';
            return `<button class="inv-tab-btn px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${isActive ? activeClass : inactiveClass}" data-filter="${f.id}">${f.label}</button>`;
        }).join('');
        controlBar.appendChild(tabsRow);

        // --- C. SUB-FILTER DROPDOWN ---
        const activeSubOptions = SUB_FILTERS[this.currentFilter] || [];
        if (activeSubOptions.length > 0) {
            const subFilterRow = document.createElement('div');
            subFilterRow.className = 'flex items-center gap-2';
            
            const optionsHTML = [`<option value="all">All ${this.currentFilter}s</option>`]
                .concat(activeSubOptions.map(opt => `<option value="${opt}" ${this.subFilter === opt ? 'selected' : ''}>${opt}</option>`))
                .join('');

            subFilterRow.innerHTML = `
                <select id="inv-subfilter" class="w-full bg-gray-900 text-cyan-200 text-[10px] p-1.5 rounded border border-gray-600 outline-none uppercase font-mono">
                    ${optionsHTML}
                </select>
            `;
            controlBar.appendChild(subFilterRow);
        }

        // --- D. ATTACH LISTENERS ---
        
        // 1. Search Input
        const searchInput = controlBar.querySelector('#inv-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.render(); // Re-render to toggle X button
                // Restore Focus Hack
                setTimeout(() => {
                    const el = document.getElementById('inv-search');
                    if(el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
                }, 0);
            });
        }

        // 2. Clear Button
        const clearBtn = controlBar.querySelector('#inv-clear-search');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.searchQuery = '';
                this.render();
            });
        }

        // 3. Tabs
        controlBar.querySelectorAll('.inv-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                this.subFilter = 'all'; 
                this.render(); 
            });
        });

        // 4. Dropdown
        const subSelect = controlBar.querySelector('#inv-subfilter');
        if (subSelect) {
            subSelect.addEventListener('change', (e) => {
                this.subFilter = e.target.value;
                this.renderGrid();
            });
        }

        this.renderGrid();
    }
    /**
     * [NEW] Deep Search Helper
     * Scans through nested item categories (like weapons.Sword) to find base data.
     */
    findItemBaseData(baseItemId) {
        if (!baseItemId || !items) return {};
        for (const category of Object.values(items)) {
            if (!category || typeof category !== 'object') continue;
            if (category[baseItemId]) return category[baseItemId]; // Flat check
            for (const subCategory of Object.values(category)) { // Nested check
                if (subCategory && typeof subCategory === 'object' && subCategory[baseItemId]) {
                    return subCategory[baseItemId];
                }
            }
        }
        return {};
    }
    /**
     * [ARCHITECT FIX] Render Grid with Forced Categorization
     * Fixes: Store items (Droppers) appearing in the wrong tabs.
     */
    renderGrid() {
        let tabContent = this.ui.tabContentInventory;
        let grid = tabContent.querySelector('#inventory-grid');
        
        if (!grid) {
            grid = document.createElement('div');
            grid.id = 'inventory-grid';
            grid.className = 'grid grid-cols-5 gap-2 overflow-y-auto max-h-[400px] p-1 custom-scrollbar';
            tabContent.appendChild(grid);
        }
        grid.innerHTML = '';

        // [ARCHITECT FIX] Merge standard inventory with the Resource Pouch
        const rawInventory = [...(this.state.player.inventory || [])];
        
        if (this.state.player.resources) {
            Object.entries(this.state.player.resources).forEach(([key, amount]) => {
                // Ignore empty resources and internal currencies if needed
                if (amount > 0 && key !== 'essence' && key !== 'primalSouls') { 
                    // Auto-categorize based on common naming conventions
                    let guessedSubType = 'Resource';
                    if (key.includes('Timber') || key.includes('Stone') || key.includes('Ore')) guessedSubType = 'Estate';
                    if (key.includes('Log') || key.includes('Granite') || key.includes('Ingot')) guessedSubType = 'Clan';
                    if (key.toLowerCase().includes('quest')) guessedSubType = 'Quest';

                    rawInventory.push({
                        id: key,
                        instanceId: `res_${key}`,
                        name: key.replace(/([A-Z])/g, ' $1').trim(), // Auto-space PascalCase (e.g., "HeartwoodLog" -> "Heartwood Log")
                        category: 'Misc',
                        type: 'Resource',
                        subType: guessedSubType,
                        qty: amount, // The card renderer will automatically put this in a blue badge!
                        isResource: true
                    });
                }
            });
        }
        
        // --- 1. FILTER LOGIC ---
        const filteredItems = rawInventory.filter(item => {
            // SURGICAL FIX: Use deep search to find base item data
            const targetId = item.id || item.baseItemId;
            const base = this.findItemBaseData(targetId);
            const full = { ...base, ...item };
            
            // Normalize Data
            let cat = (full.category || '').toLowerCase();
            const type = (full.type || '').toLowerCase();
            const name = (full.name || '').toLowerCase();
            const searchStr = `${name} ${type} ${cat} WC:${full.wc||0} AC:${full.ac||0} SC:${full.sc||0}`.toLowerCase();

            // [FIX] Priority Categorization (Enforces Tab Rules based on Name/Type)
            
            // A. Armor (Remove Shields/Off-hands from here)
            if (['helmet', 'chest', 'leggings', 'boots', 'gloves', 'armor'].some(t => type.includes(t) || name.includes(t))) {
                cat = 'armor';
            }
            // B. Weapons (Now includes Shields, Arrows, and Off-hands)
            else if (['axe', 'sword', 'bow', 'staff', 'dagger', 'mace', 'claw', 'orb', 'weapon', 'shield', 'arrow', 'offhand', 'caster'].some(t => type.includes(t) || name.includes(t))) {
                cat = 'weapon';
            }
            // C. Spells & Buffs (Ensures all elements and buffs land in the Spell tab)
            else if (['spell', 'scroll', 'book', 'air', 'fire', 'earth', 'water', 'cold', 'ice', 'arcane', 'death', 'drain', 'might', 'guard', 'swiftness', 'buff'].some(t => type.includes(t) || name.includes(t))) {
                cat = 'spell';
            }
            // D. Jewelry
            else if (['ring', 'necklace', 'amulet', 'jewelry'].some(t => type.includes(t) || name.includes(t))) {
                cat = 'jewelry';
            }
            // E. Gems
            else if (['gem', 'stone', 'shard', 'essence', 'core', 'rite'].some(t => type.includes(t) || name.includes(t))) {
                cat = 'gem';
            }

            // Main Filter
            if (this.currentFilter !== 'all') {
                if (this.currentFilter === 'weapon' && !cat.includes('weapon')) return false;
                if (this.currentFilter === 'armor' && !cat.includes('armor')) return false;
                if (this.currentFilter === 'jewelry' && !cat.includes('jewelry')) return false;
                if (this.currentFilter === 'spell' && !(cat.includes('spell') || cat.includes('buff'))) return false;
                if (this.currentFilter === 'gem' && !cat.includes('gem')) return false;
                if (this.currentFilter === 'misc') {
                    const isKnown = cat.includes('weapon') || cat.includes('armor') || cat.includes('jewelry') || cat.includes('spell') || cat.includes('gem');
                    if (isKnown) return false;
                }
            }

            // Sub-Filter
            if (this.subFilter !== 'all') {
                const subTarget = this.subFilter.toLowerCase();
                const subType = (full.subType || '').toLowerCase();
                const matchesSub = name.includes(subTarget) || type.includes(subTarget) || subType.includes(subTarget);
                if (!matchesSub) return false;
            }

            // Search
            if (this.searchQuery) {
                if (!searchStr.includes(this.searchQuery)) return false;
            }

            return true;
        });

        // --- 2. RENDER EMPTY STATE ---
        if (filteredItems.length === 0 && this.searchQuery) {
            grid.innerHTML = `<div class="col-span-full text-gray-500 text-center p-4 italic text-xs border border-dashed border-gray-700 rounded mt-4">No matching items found.</div>`;
            return;
        }

        // --- 3. RENDER ITEMS ---
        const playerRace = this.state.player.race || "Human";
        const raceData = races[playerRace] || {};
        const playerFocus = raceData.weaponFocus || ""; 

        const itemsHTML = filteredItems.map(item => {
            // SURGICAL FIX: Use deep search before rendering the card
            const targetId = item.id || item.baseItemId;
            const baseItem = this.findItemBaseData(targetId);
            const fullItem = { ...baseItem, ...item };
            return this.generateItemCardHTML(fullItem, playerRace, playerFocus);
        }).join('');

        grid.innerHTML = itemsHTML;

        // --- 4. RENDER EMPTY SLOTS (Bag Feel) ---
        if (this.currentFilter === 'all' && !this.searchQuery) {
            const INVENTORY_CAPACITY = 25; 
            const remainingSlots = Math.max(0, INVENTORY_CAPACITY - filteredItems.length);
            if (remainingSlots > 0) {
                grid.innerHTML += this.generateEmptySlotsHTML(remainingSlots);
            }
        }
    }

    /**
     * @param {Object} item - The item instance
     * @param {string} race - Player race
     * @param {string} focus - Racial weapon focus
     * [ARCHITECT UPDATED] Preserves all visuals, uses Global Tooltip
     */
    generateItemCardHTML(item, race, focus) {
        const p = this.state.player;
        
        // Merge
        const registryData = items[item.id] || items[item.baseItemId] || {};
        const fullItem = { ...registryData, ...item };

        // [PRESERVED] Visual Logic
        const itemLevel = fullItem.level || 1; 
        const levelError = itemLevel > p.level ? 'border-red-900/50 bg-red-900/10' : '';
        
        const subType = fullItem.subType || fullItem.type || "";
        const isSpecialized = focus && subType.toLowerCase() === focus.toLowerCase();
        const specializationGlow = isSpecialized ? 'shadow-[0_0_10px_rgba(34,211,238,0.4)] border-cyan-400/50' : 'border-gray-800';

        const itemId = fullItem.baseItemId || fullItem.instanceId || fullItem.id || '';
        const isShadow = fullItem.type === 'Shadow' || (fullItem.name && fullItem.name.includes('Shadow'));
        const shadowOverlay = isShadow ? '<div class="absolute inset-0 bg-purple-500/10 pointer-events-none"></div>' : '';

        const tier = fullItem.tier || 1;
        const imageUrl = fullItem.imageUrl || `https://placehold.co/64x64/1f2937/ffffff?text=${(fullItem.name || 'Item').substring(0,2)}`;

        // Prepare Tooltip Data (Passed as string attribute)
        const tooltipData = JSON.stringify({
            name: fullItem.name,
            tier: tier,
            type: fullItem.type || fullItem.category || 'Misc',
            wc: fullItem.wc,
            ac: fullItem.ac,
            sc: fullItem.sc,
            regen: fullItem.hp_regen_percent,
            qm: fullItem.qualityMultiplier,
            isShadow: isShadow,
            socketedGems: fullItem.socketedGems || [] // [ARCHITECT FIX] Pass gems to tooltip renderer
        }).replace(/"/g, '&quot;');

        // [UPDATED] Replaced nested Tooltip HTML with mouse events for Global Tooltip
        return `
            <div class="item-card relative aspect-square glass-panel cursor-pointer transition-all hover:scale-105 group ${specializationGlow} ${levelError}" 
                 data-instance-id="${fullItem.uuid || fullItem.instanceId}"
                 onmouseenter="window.gameManager.InventoryManager.showTooltip(this, '${tooltipData}')"
                 onmouseleave="window.gameManager.InventoryManager.hideTooltip()">
                 
                ${shadowOverlay}
                ${this.generateGemOverlaysHTML(fullItem)}
                
                <img src="${imageUrl}" class="w-full h-full object-contain p-1" alt="${fullItem.name}">
                
                <div class="absolute bottom-0 right-0 px-1 bg-black/80 text-[8px] text-gray-400 font-orbitron">
                    T${tier}
                </div>
                
                ${fullItem.qty > 1 ? `<span class="absolute top-0 left-0 bg-blue-900 text-[9px] px-1 rounded-br text-white">${fullItem.qty}</span>` : ''}
            </div>
        `;
    }

    /**
     * [ARCHITECT FIX] Global Tooltip Display Logic
     * Dynamically positions the tooltip near the hovered element.
     */
    showTooltip(element, dataStr) {
        if (!this.tooltipEl) this.createGlobalTooltip();
        
        try {
            const data = JSON.parse(dataStr.replace(/&quot;/g, '"'));
            const el = this.tooltipEl;

            // Build Content
            let statString = "";
            let statColor = "text-gray-400";
            const qm = data.qm || 1.0;
            const fmtStat = (val) => (Number(val) * qm).toFixed(1);

            if (data.wc) { statString = `WC ${fmtStat(data.wc)}`; statColor = "text-red-400"; }
            else if (data.ac) { statString = `AC ${fmtStat(data.ac)}`; statColor = "text-blue-400"; }
            else if (data.sc) { statString = `SC ${fmtStat(data.sc)}`; statColor = "text-purple-400"; }
            else if (data.regen) { statString = `Regen +${(data.regen*100).toFixed(0)}%`; statColor = "text-green-400"; }
            else if (data.type && data.type.toLowerCase().includes('gem')) { statString = "Gem"; statColor = "text-pink-400"; }
            
            if (qm > 1.0) statString += ` (+${Math.round((qm-1)*100)}%)`;

            // [ARCHITECT FIX] O(1) Master Registry Lookup utilizing pre-formatted GDD stats
            let gemsHTML = '';
            if (data.socketedGems && data.socketedGems.length > 0) {
                gemsHTML = `<div class="mt-1 pt-1 w-full border-t border-gray-700 flex flex-col items-center">`;
                data.socketedGems.forEach(gem => {
                    // [ARCHITECT FIX] Ultra-Robust Fallback Stat Parser
                    let gBase = items[gem.id];
                    let specificGem = null;
                    
                    if (!gBase && gems && gems.base_gems) {
                        const family = gems.base_gems[gem.id.toLowerCase()] || gems.base_gems[gem.id];
                        if (family) {
                            specificGem = Object.values(family).find(g => Number(g.grade) === Number(gem.grade || 1));
                            if (specificGem) gBase = items[specificGem.id];
                        }
                    }
                    
                    const name = gBase ? gBase.name.replace(/Grade \d+ /, '') : (specificGem ? specificGem.name.replace(/Grade \d+ /, '') : gem.id);
                    const grade = gem.grade || (gBase ? gBase.grade : 1);
                    
                    let statText = 'Stat Boost';
                    if (gBase && gBase.stat && Object.keys(gBase.stat).length > 0) {
                        statText = Object.entries(gBase.stat).map(([k, v]) => `${v} ${k}`).join(', ');
                    } else if (specificGem) {
                        const stats = [];
                        for (const [k, v] of Object.entries(specificGem)) {
                            if (k.includes('_bonus') || k.includes('_steal') || k.includes('_pct') || k.includes('_debuff')) {
                                let label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('Bonus', '').trim();
                                if (label === 'Wc') label = 'WC'; if (label === 'Ac') label = 'AC'; if (label === 'Sc') label = 'SC';
                                stats.push(`${v > 0 ? '+' : ''}${v} ${label}`);
                            }
                        }
                        if (stats.length > 0) statText = stats.join(', ');
                    }
                    
                    // Prioritize exact mathematical stats in the tooltip
                    gemsHTML += `<span class="text-[8px] text-cyan-300 font-mono text-center">♦ ${statText} <span class="text-[7px] text-gray-400">(${name} G${grade})</span></span>`;
                });
                gemsHTML += `</div>`;
            }

            // [UPDATED] Added Tier Display & Gems
            el.innerHTML = `
                <span class="text-[10px] text-cyan-100 font-bold text-center leading-tight mb-1">${data.name}</span>
                <span class="text-[8px] text-yellow-500 font-mono mb-0.5">Tier ${data.tier || 1}</span>
                <span class="text-[9px] ${statColor} font-mono text-center">${statString}</span>
                ${data.isShadow ? `<span class="text-[8px] text-purple-400 text-center mt-1 uppercase tracking-widest">Shadow</span>` : ''}
                ${gemsHTML}
            `;

            // Position Logic
            const rect = element.getBoundingClientRect();
            
            // Calculate Top (Above item)
            let top = rect.top - el.offsetHeight - 8;
            // Calculate Left (Centered)
            let left = rect.left + (rect.width / 2) - (el.offsetWidth / 2);

            // Flip if too close to top of screen
            if (top < 10) top = rect.bottom + 8;

            el.style.top = `${top}px`;
            el.style.left = `${left}px`;
            el.classList.remove('hidden');
            el.classList.add('flex');
        } catch (err) {
            console.warn("Tooltip Parse Error", err);
        }
    }

    hideTooltip() {
        if (this.tooltipEl) {
            this.tooltipEl.classList.add('hidden');
            this.tooltipEl.classList.remove('flex');
        }
    }

    /**
     * [PRESERVED] Helper for empty slot generation
     */
    generateEmptySlotsHTML(count) {
        if (count <= 0) return '';
        return Array(count).fill(0).map(() => `
            <div class="aspect-square glass-panel border-gray-800/20 opacity-30"></div>
        `).join('');
    }

    /**
     * [ARCHITECT FIX] Shows item details using the Master Registry.
     */
    showItemDetails(instanceId) {
        const item = this.state.player.inventory.find(i => i.uuid === instanceId || i.instanceId === instanceId);
        if (!item) return;

        // Merge Registry Data with Instance Data
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
     * [PRESERVED] Helper for Gem Overlays
     */
    generateGemOverlaysHTML(item) {
        if (!item || !item.sockets || item.sockets.length === 0) return '';
        
        return `
            <div class="absolute top-0.5 right-0.5 flex flex-col gap-0.5 pointer-events-none z-10">
                ${Array.from({ length: item.sockets || 0 }).map((_, i) => {
                    const gem = item.socketedGems && item.socketedGems[i];
                    return `
                    <div class="w-1.5 h-1.5 rounded-full border border-black/50 shadow-sm" 
                         style="background-color: ${gem ? (gem.color || '#fff') : 'transparent'}; box-shadow: ${gem ? `0 0 2px ${gem.color || '#fff'}` : 'none'};">
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}