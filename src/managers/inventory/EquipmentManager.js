// src/managers/inventory/EquipmentManager.js
import { items, equipmentSlotConfig } from '../../config/gdd.js';

export class EquipmentManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.showToast = deps.showToast;
    this.Systems = deps.Systems;
    this.InventoryManager = null;
    this.ProfileManager = null;
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
   * [FIXED] Equips an item using UUID to prevent crashes.
   * Aligned with the 'equipped' property used by the Armory/Arcanum.
   */
  async equipItem(uuid) {
      // 1. Get Player State
      const p = this.state.player;
      
      // 2. Initialize 'equipped' object if missing (Migration from old 'equipment')
      if (!p.equipped) p.equipped = {};

      // 3. Find Item in Inventory (Using UUID for accuracy)
      const item = p.inventory.find(i => i.uuid === uuid);

      // [SAFETY] Abort if item is missing to prevent the "read properties of null" crash
      if (!item) {
          console.error(`❌ EquipmentManager: Item with UUID ${uuid} not found.`);
          this.showToast("Error: Item not found.", true);
          return;
      }

      console.log(`🛡️ Equipping: ${item.name} (${item.type})`);

      // 4. Determine Slot (Map Item Type to Equipment Slot)
      // This ensures 'Axe' goes to 'weapon' and 'Helmet' goes to 'helmet'
      let slot = item.type.toLowerCase();
      const slotMap = {
          'helmet': 'helmet', 
          'chest': 'chest',
          'gloves': 'gloves',
          'leggings': 'leggings',
          'boots': 'boots',
          'necklace': 'necklace',
          'ring': 'ring',
          'axe': 'weapon',
          'sword': 'weapon',
          'mace': 'weapon',
          'dagger': 'weapon',
          'staff': 'weapon',
          'bow': 'weapon',
          'claw': 'weapon'
      };

      if (slotMap[slot]) slot = slotMap[slot];

      // 5. Update State (Point to the new UUID)
      // Note: We don't need to "unequip" explicitly because the item 
      // stays in the inventory array; we just change the pointer.
      p.equipped[slot] = uuid; 
      
      // 6. Recalculate Stats
      if (this.Systems) {
          this.Systems.calculateDerivedStats(p);
      }
      
      // 7. UI Refresh & Feedback
      this.showToast(`Equipped ${item.name}`);
      
      // Update Profile/Shop UI if open
      if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();
      
      // Close Inspector Modal
      const modal = document.getElementById('item-modal');
      if (modal) modal.classList.add('hidden');
      
      // Re-render this view to show the item in the slot
      this.renderEquipmentView();
  }

  /**
   * [UPDATED] Renders the equipment slots using the new 'equipped' and 'uuid' system.
   */
  renderEquipmentView() {
    const equipmentContainer = this.ui.tabContentEquipment;
    if (!equipmentContainer) return;

    // Ensure player has the new data structure
    if (!this.state.player.equipped) this.state.player.equipped = {};

    const slotsHTML = equipmentSlotConfig.map(slot => {
      // Convert display name "Helmet" to key "helmet"
      const slotKey = slot.name.toLowerCase();
      const itemUuid = this.state.player.equipped[slotKey];
      
      // Find the actual item object using the UUID
      const item = this.state.player.inventory.find(i => i.uuid === itemUuid);
      
      let contentHTML = '<span class="text-xs text-gray-500">Empty</span>';
      
      if (item) {
          // Use the item's own image or a placeholder
          // Safe navigation in case baseId logic is needed, but item should have all data now
          const imageUrl = item.imageUrl || `https://placehold.co/48x48/1f2937/ffffff?text=${item.name?.substring(0, 2)}`;
          const overlaysHTML = this.InventoryManager?.generateGemOverlaysHTML(item) || '';
          
          contentHTML = `
            ${overlaysHTML}
            <img src="${imageUrl}" class="h-12 w-12 object-contain" onerror="this.onerror=null;this.src='https://placehold.co/48x48/1f2937/ffffff?text=ERR';">
            <span class="item-tier-label">T${item.tier || 1}</span>`;
      }
      
      return `
        <div class="equipment-slot-wrapper">
          <div class="equipment-slot-title font-orbitron text-glow-subtle"><span>${slot.name}</span></div>
          <div class="equipment-slot-content cursor-pointer hover:border-cyan-400" 
               data-slot-name="${slot.name}" 
               data-uuid="${itemUuid || ""}" 
               style="border-color: var(--border-color-main)">
               ${contentHTML}
          </div>
        </div>`;
    }).join("");

    equipmentContainer.innerHTML = `<div class="equipment-grid p-4">${slotsHTML}</div>`;
  }

  addEventListeners() {
    const equipmentContainer = this.ui.tabContentEquipment;
    if (!equipmentContainer) return;

    equipmentContainer.addEventListener('click', (e) => {
      const slot = e.target.closest('.equipment-slot-content');
      // If the slot has a UUID (contains an item), show details
      if (slot && slot.dataset.uuid && this.InventoryManager) {
        this.InventoryManager.showItemDetails(slot.dataset.uuid);
      }
    });
  }
}