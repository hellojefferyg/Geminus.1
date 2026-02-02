// src/managers/ui/ModalManager.js
import { items } from '../../config/gdd.js';

// Helper to look up static item data (Name, Stats, Desc) from the ID
function findItemById(itemId) {
  if (!items || !itemId) return null;
  
  if (items.weapons) {
    for (const type in items.weapons) {
      if (items.weapons[type][itemId]) return items.weapons[type][itemId];
    }
  }
  if (items.armor) {
    for (const type in items.armor) {
      if (items.armor[type][itemId]) return items.armor[type][itemId];
    }
  }
  // Fallback for Spells/Gems if added later
  return null;
}

/**
 * @file src/managers/ui/ModalManager.js
 * @description Master control for game overlays, character creation, and item inspection.
 */
export class ModalManager {
  constructor(deps) {
    this.ui = deps.ui;
  }

  /**
   * Displays a modal with custom HTML content.
   * @param {string} title - The header text.
   * @param {string} contentHTML - The inner body content.
   * @param {Object} options - Configuration for width and callbacks.
   */
  show(title, contentHTML, options = {}) {
    const { widthClass = 'w-11/12 max-w-lg', onContentReady } = options;

    if (!this.ui.modalContainer) {
      console.warn("⚠️ ModalManager: modalContainer not found in UI dependencies.");
      return;
    }

    this.ui.modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="glass-panel p-4 rounded-lg flex flex-col ${widthClass}">
          <div class="flex-shrink-0 flex justify-between items-center mb-4">
            <h3 class="font-orbitron text-xl capitalize text-glow-subtle">${title}</h3>
            <button id="modal-close-btn" class="text-2xl leading-none transition-colors hover:text-[var(--highlight-color)]">&times;</button>
          </div>
          <div id="modal-content-body" class="flex-grow overflow-y-auto custom-scrollbar">${contentHTML}</div>
        </div>
      </div>`;

    const closeBtn = this.ui.modalContainer.querySelector('#modal-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => this.hide();
    }

    if (onContentReady) {
      const body = this.ui.modalContainer.querySelector('#modal-content-body');
      if (body) onContentReady(body);
    }
  }

  /**
   * Clears the modal container, effectively closing the overlay.
   */
  hide() {
    if (this.ui.modalContainer) {
      this.ui.modalContainer.innerHTML = "";
    }
  }

  /**
   * [NEW] Item Inspector Module
   * Shows details, stats, and action buttons for a specific inventory item.
   */
  showItemInspector(item) {
    if (!item) return;

    // 1. Look up the static data (Name, Description, Base Stats)
    const baseItem = findItemById(item.baseItemId);
    const name = baseItem ? baseItem.name : (item.name || "Unknown Item");
    const desc = baseItem ? baseItem.description : "No description available.";
    const imageUrl = baseItem?.imageUrl || `https://placehold.co/64x64/1f2937/ffffff?text=${name.substring(0,2)}`;

    // 2. Build the HTML
    const contentHTML = `
      <div class="flex flex-col gap-4">
        <div class="flex justify-center py-4 bg-black/20 rounded-lg">
            <div class="relative w-24 h-24 border border-[var(--border-color-main)] rounded-md flex items-center justify-center bg-black/60 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <img src="${imageUrl}" class="w-16 h-16 object-contain drop-shadow-md" alt="${name}">
                <div class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[var(--gold-color)] text-black text-[10px] font-bold rounded">T${item.tier}</div>
            </div>
        </div>
        
        <div class="glass-panel p-3 rounded space-y-2 text-sm">
            <div class="flex justify-between border-b border-gray-700 pb-1 mb-2">
                <span class="text-gray-400">Type</span> 
                <span class="text-[var(--highlight-color)] font-orbitron">${baseItem?.type || 'Misc'}</span>
            </div>
            ${baseItem?.wc ? `<div class="flex justify-between"><span class="text-gray-400">Weapon Class (WC)</span> <span class="text-red-400 font-bold">${baseItem.wc}</span></div>` : ''}
            ${baseItem?.ac ? `<div class="flex justify-between"><span class="text-gray-400">Armor Class (AC)</span> <span class="text-blue-400 font-bold">${baseItem.ac}</span></div>` : ''}
            ${baseItem?.sc ? `<div class="flex justify-between"><span class="text-gray-400">Spell Class (SC)</span> <span class="text-purple-400 font-bold">${baseItem.sc}</span></div>` : ''}
            
            ${item.qualityMultiplier > 1 ? `<div class="flex justify-between mt-2 pt-2 border-t border-gray-700"><span class="text-yellow-500">Quality</span> <span class="text-yellow-400">+${Math.round((item.qualityMultiplier - 1) * 100)}%</span></div>` : ''}
        </div>

        <p class="text-xs text-gray-400 italic text-center px-4 leading-relaxed">"${desc}"</p>

        <div class="grid grid-cols-2 gap-3 mt-4">
            <button id="inspector-equip-btn" class="glass-button py-3 text-green-400 border-green-900/50 hover:bg-green-900/20 font-bold tracking-wider">
                EQUIP
            </button>
            <button id="inspector-trash-btn" class="glass-button py-3 text-red-400 border-red-900/50 hover:bg-red-900/20 font-bold tracking-wider">
                DESTROY
            </button>
        </div>
      </div>
    `;

    // 3. Render and Wire Events
    this.show(name, contentHTML, {
        widthClass: 'w-80',
        onContentReady: (contentDiv) => {
            const equipBtn = contentDiv.querySelector('#inspector-equip-btn');
            const trashBtn = contentDiv.querySelector('#inspector-trash-btn');
            const gm = window.gameManager;

            // EQUIP ACTION
            if (equipBtn) {
                equipBtn.onclick = () => {
                    if (gm && gm.EquipmentManager) {
                        gm.EquipmentManager.equipItem(item);
                        this.hide();
                    } else {
                        console.error("EquipmentManager not found.");
                    }
                };
            }
            
            // TRASH ACTION
            if (trashBtn) {
                trashBtn.onclick = () => {
                     if (confirm(`Are you sure you want to destroy ${name}? This cannot be undone.`)) {
                         if (gm && gm.state && gm.state.player) {
                             // Manual removal logic for safety
                             const idx = gm.state.player.inventory.findIndex(i => i.instanceId === item.instanceId);
                             if (idx > -1) {
                                 gm.state.player.inventory.splice(idx, 1);
                                 
                                 // Refresh UI
                                 if (gm.InventoryManager) gm.InventoryManager.render();
                                 if (gm.showToast) gm.showToast(`${name} destroyed.`, false);
                                 
                                 this.hide();
                             }
                         }
                     }
                };
            }
        }
    });
  }
}