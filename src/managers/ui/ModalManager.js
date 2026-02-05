// src/managers/ui/ModalManager.js
import { armory, arcanum, jewelry } from '../../config/gdd.js';

// [ARCHITECT FIX] Robust Lookup Helper
// Searches all data sources to ensure we find stats for everything.
function findItemById(itemId) {
  if (!itemId) return null;

  // 1. Search Armory (Weapons/Armor)
  if (armory) {
      if (armory.weapons) {
          for (const type in armory.weapons) {
              if (armory.weapons[type][itemId]) return { ...armory.weapons[type][itemId], type: type };
          }
      }
      if (armory.armor) {
          for (const type in armory.armor) {
              if (armory.armor[type][itemId]) return { ...armory.armor[type][itemId], type: type };
          }
      }
  }

  // 2. Search Arcanum (Spells/Buffs)
  if (arcanum) {
      if (arcanum.spells) {
          for (const type in arcanum.spells) {
              if (arcanum.spells[type][itemId]) return { ...arcanum.spells[type][itemId], type: 'Spell' };
          }
      }
      if (arcanum.buffs) {
           if (arcanum.buffs[itemId]) return { ...arcanum.buffs[itemId], type: 'Buff' };
           for (const type in arcanum.buffs) {
              if (arcanum.buffs[type][itemId]) return { ...arcanum.buffs[type][itemId], type: 'Buff' };
          }
      }
  }

  // 3. Search Jewelry
  if (jewelry) {
      for (const cat in jewelry) {
          if (jewelry[cat][itemId]) return { ...jewelry[cat][itemId], type: 'Jewelry' };
      }
  }

  return null;
}

export class ModalManager {
  constructor(deps) {
    this.ui = deps.ui;
  }

  show(title, contentHTML, options = {}) {
    const { widthClass = 'w-11/12 max-w-lg', onContentReady } = options;

    if (!this.ui.modalContainer) {
      console.warn("⚠️ ModalManager: modalContainer not found.");
      return;
    }

    this.ui.modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="glass-panel p-4 rounded-lg flex flex-col ${widthClass}">
          <div class="flex-shrink-0 flex justify-between items-center mb-4">
            <h3 class="font-orbitron text-xl capitalize text-glow-subtle">${title}</h3>
            <button id="modal-close-btn" class="text-2xl leading-none transition-colors hover:text-cyan-400">&times;</button>
          </div>
          <div id="modal-content-body" class="flex-grow overflow-y-auto custom-scrollbar">${contentHTML}</div>
        </div>
      </div>`;

    this.ui.modalContainer.querySelector('#modal-close-btn').onclick = () => this.hide();

    if (onContentReady) {
      onContentReady(this.ui.modalContainer.querySelector('#modal-content-body'));
    }
  }

  hide() {
    if (this.ui.modalContainer) this.ui.modalContainer.innerHTML = "";
  }

  /**
   * [ARCHITECT FIX] Item Inspector with Context
   * Handles both "Equip" and "Unequip" states.
   */
  showItemInspector(item, context = {}) {
    if (!item) return;

    // 1. Resolve Base Data
    const baseItem = findItemById(item.baseItemId || item.id);
    const fullItem = { ...baseItem, ...item };

    const name = fullItem.name || "Unknown Item";
    const desc = fullItem.description || "No description available.";
    const imageUrl = fullItem.imageUrl || `https://placehold.co/64x64/1f2937/ffffff?text=${name.substring(0,2)}`;
    
    // 2. Build Stats Block
    let statsHTML = '';
    if (fullItem.wc) statsHTML += `<div class="flex justify-between"><span class="text-gray-400">Weapon Class (WC)</span> <span class="text-red-400 font-bold">${fullItem.wc}</span></div>`;
    if (fullItem.ac) statsHTML += `<div class="flex justify-between"><span class="text-gray-400">Armor Class (AC)</span> <span class="text-blue-400 font-bold">${fullItem.ac}</span></div>`;
    if (fullItem.sc) statsHTML += `<div class="flex justify-between"><span class="text-gray-400">Spell Class (SC)</span> <span class="text-purple-400 font-bold">${fullItem.sc}</span></div>`;
    
    if (fullItem.hp_regen_percent) statsHTML += `<div class="flex justify-between"><span class="text-gray-400">HP Regen</span> <span class="text-green-400 font-bold">+${(fullItem.hp_regen_percent * 100).toFixed(0)}%</span></div>`;
    if (fullItem.crit_bonus) statsHTML += `<div class="flex justify-between"><span class="text-gray-400">Crit Chance</span> <span class="text-yellow-400 font-bold">+${fullItem.crit_bonus}%</span></div>`;

    // 3. Dynamic Action Button (Equip vs Unequip)
    // [THIS IS THE MISSING PART IN YOUR VERSION]
    let actionBtnHTML;
    if (context.isEquipped) {
        actionBtnHTML = `
            <button id="inspector-action-btn" class="glass-button py-3 text-yellow-400 border-yellow-900/50 hover:bg-yellow-900/20 font-bold tracking-wider">
                UNEQUIP
            </button>`;
    } else {
        actionBtnHTML = `
            <button id="inspector-action-btn" class="glass-button py-3 text-green-400 border-green-900/50 hover:bg-green-900/20 font-bold tracking-wider">
                EQUIP
            </button>`;
    }

    // 4. Render HTML
    const contentHTML = `
      <div class="flex flex-col gap-4">
        <div class="flex justify-center py-4 bg-black/20 rounded-lg">
            <div class="relative w-24 h-24 border border-[var(--border-color-main)] rounded-md flex items-center justify-center bg-black/60 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <img src="${imageUrl}" class="w-16 h-16 object-contain drop-shadow-md" alt="${name}">
                <div class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[var(--gold-color)] text-black text-[10px] font-bold rounded">T${fullItem.tier || 1}</div>
            </div>
        </div>
        
        <div class="glass-panel p-3 rounded space-y-2 text-sm">
            <div class="flex justify-between border-b border-gray-700 pb-1 mb-2">
                <span class="text-gray-400">Type</span> 
                <span class="text-[var(--highlight-color)] font-orbitron">${fullItem.type || fullItem.category || 'Misc'}</span>
            </div>
            ${statsHTML}
            ${fullItem.qualityMultiplier > 1 ? `<div class="flex justify-between mt-2 pt-2 border-t border-gray-700"><span class="text-yellow-500">Quality</span> <span class="text-yellow-400">+${Math.round((fullItem.qualityMultiplier - 1) * 100)}%</span></div>` : ''}
        </div>

        <p class="text-xs text-gray-400 italic text-center px-4 leading-relaxed">"${desc}"</p>

        <div class="grid grid-cols-2 gap-3 mt-4">
            ${actionBtnHTML}
            <button id="inspector-trash-btn" class="glass-button py-3 text-red-400 border-red-900/50 hover:bg-red-900/20 font-bold tracking-wider">
                DESTROY
            </button>
        </div>
      </div>
    `;

    this.show(name, contentHTML, {
        widthClass: 'w-80',
        onContentReady: (contentDiv) => {
            const actionBtn = contentDiv.querySelector('#inspector-action-btn');
            const trashBtn = contentDiv.querySelector('#inspector-trash-btn');
            const gm = window.gameManager;

            if (actionBtn) {
                actionBtn.onclick = () => {
                    if (context.isEquipped) {
                        // UNEQUIP ACTION
                        if (gm && gm.EquipmentManager) {
                            gm.EquipmentManager.unequipItem(context.slotKey);
                            this.hide();
                        }
                    } else {
                        // EQUIP ACTION
                        if (gm && gm.EquipmentManager) {
                            gm.EquipmentManager.equipItem(fullItem); 
                            this.hide();
                        }
                    }
                };
            }
            
            if (trashBtn) {
                trashBtn.onclick = () => {
                    if (context.isEquipped) {
                        gm.showToast("Cannot destroy equipped item. Unequip first.", true);
                        return;
                    }
                    if (confirm(`Destroy ${name}?`)) {
                        if (gm && gm.state && gm.state.player) {
                            const idx = gm.state.player.inventory.findIndex(i => i.instanceId === item.instanceId || i.uuid === item.uuid);
                            if (idx > -1) {
                                gm.state.player.inventory.splice(idx, 1);
                                if (gm.InventoryManager) gm.InventoryManager.render();
                                gm.showToast(`${name} destroyed.`, false);
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