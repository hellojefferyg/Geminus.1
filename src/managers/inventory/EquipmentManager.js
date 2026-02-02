// src/managers/inventory/EquipmentManager.js
import { items, equipmentSlotConfig } from '../../config/gdd.js';

// Helper function to find an item by ID
function findItemById(itemId) {
  if (!items || !itemId) return null;
  if (items.weapons) {
    for (const weaponType in items.weapons) {
      if (items.weapons[weaponType]?.[itemId]) return items.weapons[weaponType][itemId];
    }
  }
  if (items.armor) {
    for (const armorType in items.armor) {
      if (items.armor[armorType]?.[itemId]) return items.armor[armorType][itemId];
    }
  }
  return null;
}

export class EquipmentManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.showToast = deps.showToast;
    this.Systems = deps.Systems; // [FIX] Added Systems for stats calc
    this.InventoryManager = null;
    this.ProfileManager = null;  // [FIX] Added ProfileManager for UI updates
    this.ModalManager = deps.ModalManager;
    this.isInitialized = false;
  }

  setManagers(managers) {
    this.InventoryManager = managers.InventoryManager;
    this.ProfileManager = managers.ProfileManager;
    if (managers.Systems) this.Systems = managers.Systems;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.renderEquipmentView();
    this.addEventListeners();
  }

  /**
   * Equips an item to the correct slot, handling unequip/swap logic.
   * [NEW] Triggers Stat Recalculation immediately.
   */
  async equipItem(item) {
    if (!item) return;

    // 1. Determine Slot
    let targetSlot = 'Weapon 1';
    const baseItem = findItemById(item.baseItemId);
    
    if (items.armor) {
        for (const cat in items.armor) {
             if (items.armor[cat][item.baseItemId]) {
                 targetSlot = 'Armor'; 
                 break;
             }
        }
    }
    
    // 2. Handle Swap (Unequip current)
    const currentEquippedId = this.state.player.equipment[targetSlot];
    if (currentEquippedId) {
        this.showToast(`Swapped out previous gear.`, false);
    }

    // 3. Equip
    this.state.player.equipment[targetSlot] = item.instanceId;

    // 4. [CRITICAL] Recalculate Stats
    if (this.Systems) {
        this.Systems.calculateDerivedStats(this.state.player);
        const maxHp = this.state.player.derivedStats.maxHp;
        // Optional: Heal up to new Max HP? Or keep percentage?
        // For now, simple cap check
        if (this.state.player.hp > maxHp) this.state.player.hp = maxHp;
    }

    // 5. Refresh UI
    this.renderEquipmentView();
    if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();
    
    this.showToast(`${baseItem.name} equipped!`, false);
  }

  renderEquipmentView() {
    const equipmentContainer = this.ui.tabContentEquipment;
    if (!equipmentContainer) return;

    const slotsHTML = equipmentSlotConfig.map(slot => {
      const instanceId = this.state.player.equipment[slot.name];
      const item = this.state.player.inventory.find(i => i.instanceId === instanceId);
      let contentHTML = '<span class="text-xs text-gray-500">Empty</span>';
      
      if (item) {
        const base = findItemById(item.baseItemId);
        if (!base) {
          contentHTML = `<span class="text-xs text-gray-500">Item Error</span>`;
        } else {
          let overlaysHTML = this.InventoryManager?.generateGemOverlaysHTML(item) || '';
          const imageUrl = base.imageUrl || `https://placehold.co/48x48/1f2937/ffffff?text=${base.name?.substring(0, 2)}`;
          
          contentHTML = `
            ${overlaysHTML}
            <img src="${imageUrl}" class="h-12 w-12 object-contain" onerror="this.onerror=null;this.src='https://placehold.co/48x48/1f2937/ffffff?text=ERR';">
            <span class="item-tier-label">T${item.tier}</span>`;
        }
      }
      
      return `
        <div class="equipment-slot-wrapper">
          <div class="equipment-slot-title font-orbitron text-glow-subtle"><span>${slot.name}</span></div>
          <div class="equipment-slot-content cursor-pointer hover:border-cyan-400" data-slot-name="${slot.name}" data-instance-id="${instanceId || ""}" style="border-color: var(--border-color-main)">${contentHTML}</div>
        </div>`;
    }).join("");

    equipmentContainer.innerHTML = `<div class="equipment-grid p-4">${slotsHTML}</div>`;
  }

  addEventListeners() {
    const equipmentContainer = this.ui.tabContentEquipment;
    if (!equipmentContainer) return;

    equipmentContainer.addEventListener('click', (e) => {
      const slot = e.target.closest('.equipment-slot-content');
      if (slot && slot.dataset.instanceId && this.InventoryManager) {
        this.InventoryManager.showItemDetails(slot.dataset.instanceId);
      }
    });
  }
}