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
   * [ARCHITECT FIX] Equips items with Master Type Priority.
   * Fixes "Cannot equip Dropper" by forcing a lookup of the Real Type from GDD.
   */
  async equipItem(input) {
      const p = this.state.player;
      if (!p.equipped) p.equipped = {};

      // 1. Resolve UUID
      let uuid = input;
      if (typeof input === 'object' && input !== null) {
          uuid = input.uuid || input.instanceId;
      }

      // 2. Find Item in Inventory
      const invIndex = p.inventory.findIndex(i => i.uuid === uuid || i.instanceId === uuid);
      if (invIndex === -1) {
          this.showToast("Item not found.", true);
          return;
      }
      const item = p.inventory[invIndex];

      // 3. Resolve Data (The Critical Fix)
      // Look up the "True" data from the Master Registry
      const registryData = items[item.id] || items[item.baseItemId] || {};
      
      // Merge: Registry wins for static props (Type), Instance wins for dynamic (UUID, Quality)
      const fullItem = { ...registryData, ...item };
      
      // [FIX] Force-override the type if the Registry knows better
      // This cures the "Dropper" virus by restoring the original type (e.g., 'Chest')
      if (registryData.type && registryData.type !== 'Unknown') {
          fullItem.type = registryData.type;
          fullItem.category = registryData.category || fullItem.category;
      }

      let rawType = fullItem.type || fullItem.category || 'Unknown';
      const itemType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      const itemCategory = (fullItem.category || '').charAt(0).toUpperCase() + (fullItem.category || '').slice(1).toLowerCase();

      // 4. Determine Target Slot
      let targetSlotKey = null;

      // A. Priority Check: Spells/Buffs
      if (['Spell', 'Buff', 'Scroll'].includes(itemCategory) || 
          ['Air', 'Earth', 'Fire', 'Water', 'Arcane', 'Death', 'Drain', 'Buff', 'Protection', 'Enhancement', 'Recovery'].includes(itemType)) {
          targetSlotKey = 'SPELL_1';
      }
      // B. Priority Check: Jewelry
      else if (itemCategory === 'Jewelry' || itemType === 'Ring') targetSlotKey = 'RING_1';
      else if (itemType === 'Necklace' || itemType === 'Amulet') targetSlotKey = 'NECK';
      // C. Fallback: Physical Gear
      else {
          if (['Axe', 'Sword', 'Mace', 'Dagger', 'Bow', 'Staff', 'Claw', 'Weapon', 'Weapons'].includes(itemType)) targetSlotKey = 'MAIN_HAND';
          if (['Helmet', 'Helm'].includes(itemType)) targetSlotKey = 'HEAD';
          if (['Chest', 'Armor', 'Body'].includes(itemType)) targetSlotKey = 'BODY';
          if (['Leggings', 'Legs', 'Pants'].includes(itemType)) targetSlotKey = 'LEGS';
          if (['Gloves', 'Gauntlets', 'Hands'].includes(itemType)) targetSlotKey = 'HANDS';
          if (['Boots', 'Feet'].includes(itemType)) targetSlotKey = 'FEET';
      }

      // D. Final Config Object Check
      if (!targetSlotKey) {
          for (const [key, config] of Object.entries(equipmentSlotConfig)) {
              if (config.allowedTypes && (config.allowedTypes.includes(itemType) || config.allowedTypes.includes(itemCategory))) {
                  targetSlotKey = key;
                  break;
              }
          }
      }

      if (!targetSlotKey) {
          this.showToast(`Cannot equip ${itemType} (${itemCategory}).`, true);
          return;
      }

      // 5. Smart Slotting
      if (targetSlotKey === 'RING_1' && p.equipped.RING_1 && !p.equipped.RING_2) targetSlotKey = 'RING_2';
      if (targetSlotKey === 'SPELL_1' && p.equipped.SPELL_1 && !p.equipped.SPELL_2) targetSlotKey = 'SPELL_2';

      // 6. Swap Logic
      if (p.equipped[targetSlotKey]) {
          const oldItem = p.equipped[targetSlotKey];
          p.inventory.push(oldItem);
      }

      // 7. Equip & Remove
      p.equipped[targetSlotKey] = fullItem;
      p.inventory.splice(invIndex, 1);

      // 8. Update Stats & UI
      if (this.Systems) this.Systems.calculateDerivedStats(p);
      if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();

      this.showToast(`Equipped ${fullItem.name}.`, false);
      this.renderEquipmentView();
      if (this.InventoryManager) this.InventoryManager.render();
  }
  /**
   * [ARCHITECT FIX] Renders equipment with Master Data Lookup.
   * Fixes "undefined" slots by merging save data with GDD data.
   */
  renderEquipmentView() {
    const equipmentContainer = this.ui.tabContentEquipment;
    if (!equipmentContainer) return;

    if (!this.state.player.equipped) this.state.player.equipped = {};

    const slotsHTML = equipmentSlotConfig.map(slot => {
      const slotKey = slot.name.toLowerCase().replace(' ', '_'); // handle "Ring 1" -> "ring_1" or map correctly
      // Note: Use the exact keys you set in equipItem (HEAD, BODY, MAIN_HAND, SPELL_1, etc.)
      
      // Map display name to internal key (Robust Mapping)
      let internalKey = slotKey;
      if (slot.name === 'Helmet') internalKey = 'HEAD';
      if (slot.name === 'Armor') internalKey = 'BODY';
      if (slot.name === 'Leggings') internalKey = 'LEGS';
      if (slot.name === 'Boots') internalKey = 'FEET';
      if (slot.name === 'Gauntlets') internalKey = 'HANDS';
      if (slot.name === 'Weapon 1') internalKey = 'MAIN_HAND';
      if (slot.name === 'Weapon 2') internalKey = 'OFF_HAND'; // or SPELL_1 depending on logic
      if (slot.name === 'Amulet') internalKey = 'NECK';
      if (slot.name === 'Ring') internalKey = 'RING_1';
      if (slot.name === 'Spell 1') internalKey = 'SPELL_1';
      
      // Try to find the item
      let item = this.state.player.equipped[internalKey];
      
      // If item is just a UUID (legacy), find it in inventory. 
      // If it's a full object (new system), use it.
      if (typeof item === 'string') {
          item = this.state.player.inventory.find(i => i.uuid === item || i.instanceId === item);
      }

      let contentHTML = '<span class="text-xs text-gray-600 font-mono">Empty</span>';
      
      if (item) {
          // [CRITICAL MERGE]
          const baseItem = items[item.id] || items[item.baseItemId] || {};
          const displayItem = { ...baseItem, ...item };
          
          const name = displayItem.name || "Item";
          const type = (displayItem.type || 'misc').toLowerCase();
          const tier = displayItem.tier || 1;
          const imageUrl = displayItem.imageUrl || `assets/items/${type}_t${tier}.png`;

          contentHTML = `
            <img src="${imageUrl}" class="h-10 w-10 object-contain" onerror="this.src='https://placehold.co/40x40/222?text=${name.charAt(0)}'">
            <span class="absolute bottom-0 right-0 bg-black/70 text-[10px] px-1 text-cyan-200">T${tier}</span>
          `;
      }
      
      return `
        <div class="flex flex-col items-center">
            <div class="text-[10px] text-cyan-600 font-orbitron mb-1">${slot.name}</div>
            <div class="w-16 h-16 glass-panel border border-cyan-900/50 flex items-center justify-center relative cursor-pointer hover:border-cyan-400 transition-colors"
                 onclick="window.gameManager.EquipmentManager.handleSlotClick('${internalKey}')">
               ${contentHTML}
            </div>
        </div>`;
    }).join("");

    equipmentContainer.innerHTML = `<div class="grid grid-cols-2 gap-4 p-4">${slotsHTML}</div>`;
  }
  
  // Helper for click handling
  handleSlotClick(slotKey) {
      const item = this.state.player.equipped[slotKey];
      if (item && this.InventoryManager) {
          // Handle both object and UUID
          const uuid = item.uuid || item.instanceId || (typeof item === 'string' ? item : null);
          if (uuid) this.InventoryManager.showItemDetails(uuid);
      }
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
  /**
   * [ARCHITECT FIX] Aggregates stats from all equipped items.
   * Called by ProfileManager to update the character sheet.
   */
  getEquippedStats() {
      const stats = { wc: 0, ac: 0, sc: 0, str_req: 0, vit_req: 0, ntl_req: 0 };
      const p = this.state.player;

      if (!p.equipped) return stats;

      Object.values(p.equipped).forEach(item => {
          if (!item) return;
          
          // Merge with Master Data to ensure we get the base stats
          const baseItem = items[item.id] || items[item.baseItemId] || {};
          const fullItem = { ...baseItem, ...item }; // Instance stats override base

          // Sum up the GDD keys (lowercase)
          if (fullItem.wc) stats.wc += Number(fullItem.wc);
          if (fullItem.ac) stats.ac += Number(fullItem.ac);
          if (fullItem.sc) stats.sc += Number(fullItem.sc);
          
          // Track specific bonuses if they exist
          if (fullItem.bonuses) {
             // Logic for handling complex bonuses (hitChance, etc.) can go here
          }
      });

      return stats;
  }
}