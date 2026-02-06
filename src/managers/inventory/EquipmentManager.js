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
   * [ARCHITECT FIX] Equips items with Correct Priority.
   * Fixes Necklace/Amulet equipping by checking them BEFORE generic Jewelry.
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

      // 3. Resolve Data & Normalize
      const registryData = items[item.id] || items[item.baseItemId] || {};
      const fullItem = { ...registryData, ...item };
      
      // "Dropper" Fix
      if (registryData.type && registryData.type !== 'Unknown') {
          fullItem.type = registryData.type;
          fullItem.category = registryData.category || fullItem.category;
      }

      let rawType = fullItem.type || fullItem.category || 'Unknown';
      const itemType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      const itemCategory = (fullItem.category || '').charAt(0).toUpperCase() + (fullItem.category || '').slice(1).toLowerCase();

      // 4. Determine Target Slot
      let targetSlotKey = null;

      // A. Spells & Buffs
      if (['Spell', 'Buff', 'Scroll'].includes(itemCategory) || 
          ['Air', 'Earth', 'Fire', 'Water', 'Arcane', 'Death', 'Drain', 'Buff', 'Protection', 'Enhancement', 'Recovery'].includes(itemType)) {
          targetSlotKey = 'SPELL_1';
          if (p.equipped.SPELL_1 && !p.equipped.SPELL_2) targetSlotKey = 'SPELL_2';
      }
      
      // B. Jewelry [FIXED ORDER]
      // 1. Check Specifics (Necklace/Amulet) FIRST so they don't get eaten by 'Jewelry'
      else if (['Necklace', 'Amulet'].includes(itemType)) {
          targetSlotKey = 'NECK';
      }
      // 2. Check Generic Jewelry (Rings) SECOND
      else if (itemCategory === 'Jewelry' || itemType === 'Ring') {
          targetSlotKey = 'RING_1';
          if (p.equipped.RING_1 && !p.equipped.RING_2) targetSlotKey = 'RING_2';
      }
      
      // C. Weapons (Includes Bow/Staff)
      else if (['Axe', 'Sword', 'Mace', 'Dagger', 'Claw', 'Weapon', 'Weapons', 'Bow', 'Staff'].includes(itemType)) {
          targetSlotKey = 'MAIN_HAND';
          
          // Dual Wield Logic (Skip for 2H weapons)
          const isTwoHanded = ['Bow', 'Staff'].includes(itemType);
          if (!isTwoHanded && p.equipped.MAIN_HAND && !p.equipped.OFF_HAND) {
              targetSlotKey = 'OFF_HAND';
          }
      }
      
      // D. Armor
      else {
          if (['Helmet', 'Helm'].includes(itemType)) targetSlotKey = 'HEAD';
          if (['Chest', 'Armor', 'Body'].includes(itemType)) targetSlotKey = 'BODY';
          if (['Leggings', 'Legs', 'Pants'].includes(itemType)) targetSlotKey = 'LEGS';
          if (['Gloves', 'Gauntlets', 'Hands'].includes(itemType)) targetSlotKey = 'HANDS';
          if (['Boots', 'Feet'].includes(itemType)) targetSlotKey = 'FEET';
          if (['Shield'].includes(itemType)) targetSlotKey = 'OFF_HAND';
      }

      // E. Fallback Config Check
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

      // 5. Swap Logic
      if (p.equipped[targetSlotKey]) {
          const oldItem = p.equipped[targetSlotKey];
          p.inventory.push(oldItem);
      }

      // 6. Equip & Remove
      p.equipped[targetSlotKey] = fullItem;
      p.inventory.splice(invIndex, 1);

      // 7. Sync
      this.recalculateAndSync();
      this.showToast(`Equipped ${fullItem.name}.`, false);
  }

  /**
   * [NEW] Helper to handle stats and UI refresh centrally
   */
  recalculateAndSync() {
      if (this.Systems) this.Systems.calculateDerivedStats(this.state.player);
      if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();
      
      this.renderEquipmentView();
      if (this.InventoryManager) this.InventoryManager.render();
  }

  /**
   * [NEW] Unequip Item
   * Moves item from Slot -> Inventory
   */
  unequipItem(slotKey) {
      const p = this.state.player;
      const item = p.equipped[slotKey];
      
      if (!item) return;

      p.inventory.push(item);
      delete p.equipped[slotKey]; // Clear slot

      this.recalculateAndSync();
      this.showToast(`Unequipped ${item.name}.`, false);
  }

  /**
   * [ARCHITECT FIX] Renders equipment in Text-Only Dev Mode.
   * Eliminates 404 errors by removing <img> tags.
   */
  renderEquipmentView() {
    const equipmentContainer = this.ui.tabContentEquipment;
    if (!equipmentContainer) return;

    if (!this.state.player.equipped) this.state.player.equipped = {};

    const slotsHTML = equipmentSlotConfig.map(slot => {
      let internalKey = slot.name.toUpperCase().replace(' ', '_');
      if (slot.name === 'Helmet') internalKey = 'HEAD';
      if (slot.name === 'Armor') internalKey = 'BODY';
      if (slot.name === 'Leggings') internalKey = 'LEGS';
      if (slot.name === 'Boots') internalKey = 'FEET';
      if (slot.name === 'Gauntlets') internalKey = 'HANDS';
      if (slot.name === 'Weapon 1') internalKey = 'MAIN_HAND';
      if (slot.name === 'Weapon 2') internalKey = 'OFF_HAND';
      if (slot.name === 'Amulet') internalKey = 'NECK';
      if (slot.name === 'Ring') internalKey = 'RING_1'; 
      if (slot.name === 'Spell 1') internalKey = 'SPELL_1';
      if (slot.name === 'Spell 2') internalKey = 'SPELL_2';
      
      let item = this.state.player.equipped[internalKey];
      if (typeof item === 'string') {
          item = this.state.player.inventory.find(i => i.uuid === item || i.instanceId === item);
      }

      // Default Empty State
      let contentHTML = '<span class="text-xs text-gray-600 font-mono opacity-50">Empty</span>';
      
      if (item && item.name) {
          const name = item.name || "Item";
          const tier = item.tier || 1;
          const type = item.type || "Misc";

          // Generate Stats for Equipment Tooltip
          let statString = "";
          if (item.wc) statString = `WC ${item.wc}`;
          else if (item.ac) statString = `AC ${item.ac}`;
          else if (item.sc) statString = `SC ${item.sc}`;
          else if (item.type === 'Buff') statString = "Passive";
          else statString = item.type;

          // [DEV MODE] Text-Based Representation
          contentHTML = `
            <div class="flex flex-col items-center justify-center w-full h-full p-1 text-center">
                <span class="text-[9px] text-cyan-200 font-bold leading-tight break-words w-full">${name}</span>
                <span class="text-[8px] text-yellow-500 font-mono mt-0.5">T${tier}</span>
            </div>
            
            <div class="hidden group-hover:flex flex-col absolute inset-0 bg-black/90 z-20 items-center justify-center p-1 text-center transition-opacity duration-200 border border-cyan-500/30">
                <span class="text-[8px] text-cyan-100 font-bold leading-tight">${name}</span>
                <span class="text-[8px] text-green-400 font-mono mt-0.5">${statString}</span>
            </div>
          `;
      }
      
      return `
        <div class="flex flex-col items-center group">
            <div class="text-[10px] text-cyan-600 font-orbitron mb-1">${slot.name}</div>
            <div class="w-16 h-16 glass-panel border border-cyan-900/50 flex items-center justify-center relative cursor-pointer hover:border-cyan-400 transition-colors bg-black/40"
                 onclick="window.gameManager.EquipmentManager.handleSlotClick('${internalKey}')">
               ${contentHTML}
            </div>
        </div>`;
    }).join("");

    equipmentContainer.innerHTML = `<div class="grid grid-cols-2 gap-4 p-4">${slotsHTML}</div>`;
  }
  
  // [ARCHITECT FIX] Opens Inspector with Context (Equipped)
  handleSlotClick(slotKey) {
      const item = this.state.player.equipped[slotKey];
      if (item && this.ModalManager) {
          // We pass isEquipped: true so ModalManager knows to show 'UNEQUIP' button
          this.ModalManager.showItemInspector(item, { isEquipped: true, slotKey: slotKey });
      }
  }

  // Kept for backward compatibility, but redundant due to inline onclicks
  addEventListeners() {
    const equipmentContainer = this.ui.tabContentEquipment;
    if (!equipmentContainer) return;
    // Listener preserved but logic delegated to handleSlotClick
  }

  getEquippedStats() {
      const stats = { wc: 0, ac: 0, sc: 0, str_req: 0, vit_req: 0, ntl_req: 0 };
      const p = this.state.player;

      if (!p.equipped) return stats;

      Object.values(p.equipped).forEach(item => {
          if (!item || typeof item !== 'object') return;
          
          if (item.wc) stats.wc += Number(item.wc);
          if (item.ac) stats.ac += Number(item.ac);
          if (item.sc) stats.sc += Number(item.sc);
      });

      return stats;
  }
}