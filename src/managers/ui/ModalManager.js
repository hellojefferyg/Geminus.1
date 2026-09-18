// src/managers/ui/ModalManager.js
import { armory, arcanum, jewelry, items, gems } from '../../config/gdd.js'; // [ARCHITECT FIX] Import gems to prevent crashes

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
   * [ARCHITECT FIX] Item Inspector - Universal Stat Support
   * dynamically renders ANY stat found in gemsData, jewelryData, or armoryData.
   */
  showItemInspector(item, context = {}) {
    if (!item) return;

    // 1. Resolve Base Data & Merge
    const baseItem = findItemById(item.baseItemId || item.id);
    const fullItem = { ...baseItem, ...item };

    const name = fullItem.name || "Unknown Item";
    const desc = fullItem.description || "No description available.";
    const imageUrl = fullItem.imageUrl || `https://placehold.co/64x64/1f2937/ffffff?text=${name.substring(0,2)}`;
    
    // Calculate Quality Multiplier
    const qm = (typeof fullItem.qualityMultiplier === 'number') ? fullItem.qualityMultiplier : 1.0;
    
    // [ARCHITECT FIX] Route through the Universal Engine
    let trueStats = { wc: fullItem.wc * qm, ac: fullItem.ac * qm, sc: fullItem.sc * qm };
    if (window.gameManager && window.gameManager.Systems) {
        trueStats = window.gameManager.Systems.calculateTrueItemStats(fullItem);
    }

    // --- STAT CONFIGURATION ---
    // Maps internal database keys to readable labels and colors
    const statConfig = [
        // Primary Combat (Multiplied)
        { key: 'wc', label: 'Weapon Class', color: 'text-red-400' },
        { key: 'ac', label: 'Armor Class', color: 'text-blue-400' },
        { key: 'sc', label: 'Spell Class', color: 'text-purple-400' },
        
        // Base Attributes
        { key: 'str_bonus', label: 'Strength', color: 'text-red-300' },
        { key: 'vit_bonus', label: 'Vitality', color: 'text-green-300' },
        { key: 'dex_bonus', label: 'Dexterity', color: 'text-yellow-300' },
        { key: 'ntl_bonus', label: 'Intellect', color: 'text-blue-300' },
        { key: 'int_bonus', label: 'Intellect', color: 'text-blue-300' }, // Handle alias
        { key: 'wis_bonus', label: 'Wisdom', color: 'text-purple-300' },
        
        // Gem/Jewelry Specifics
        { key: 'wc_bonus', label: 'WC Bonus', color: 'text-red-300' },
        { key: 'ac_bonus', label: 'AC Bonus', color: 'text-blue-300' },
        { key: 'sc_bonus', label: 'SC Bonus', color: 'text-purple-300' },
        { key: 'hp_pct', label: 'Max HP', color: 'text-green-400', isPct: true },
        { key: 'hp_regen_percent', label: 'HP Regen', color: 'text-green-400', isPct: true },
        { key: 'regen_pct', label: 'HP Regen', color: 'text-green-400', isPct: true }, // Jewelry alias
        
        // Advanced Combat
        { key: 'crit_bonus', label: 'Crit Chance', color: 'text-yellow-400', isPct: true },
        { key: 'crit_chance_bonus', label: 'Crit Chance', color: 'text-yellow-400', isPct: true },
        { key: 'hit_bonus', label: 'Hit Chance', color: 'text-orange-400', isPct: true },
        { key: 'hit_chance_bonus', label: 'Hit Chance', color: 'text-orange-400', isPct: true },
        { key: 'double_hit_bonus', label: 'Double Hit', color: 'text-orange-300', isPct: true },
        { key: 'mastery_chance_bonus', label: 'Mastery', color: 'text-pink-400', isPct: true },
        
        // Steals & Debuffs (The "Nasty" Stuff)
        { key: 'health_steal', label: 'Life Steal', color: 'text-red-500' },
        { key: 'wis_steal', label: 'Wisdom Steal', color: 'text-purple-500' },
        { key: 'int_steal', label: 'Intellect Steal', color: 'text-blue-500' },
        { key: 'str_steal', label: 'Strength Steal', color: 'text-red-500' },
        { key: 'dex_steal', label: 'Dexterity Steal', color: 'text-yellow-500' },
        { key: 'enemy_wis_debuff', label: 'Enemy WIS Debuff', color: 'text-gray-400' },
        { key: 'enemy_int_debuff', label: 'Enemy INT Debuff', color: 'text-gray-400' },
        { key: 'enemy_str_debuff', label: 'Enemy STR Debuff', color: 'text-gray-400' },
        { key: 'enemy_dex_debuff', label: 'Enemy DEX Debuff', color: 'text-gray-400' },
        { key: 'enemy_hit_debuff', label: 'Blind (Hit Debuff)', color: 'text-gray-400' },

        // Economy & Luck
        { key: 'exp_bonus', label: 'EXP Bonus', color: 'text-cyan-400', isPct: true },
        { key: 'gold_bonus', label: 'Gold Bonus', color: 'text-yellow-400', isPct: true },
        { key: 'shadow_drop_bonus', label: 'Shadow Luck', color: 'text-purple-500', isPct: true },
        { key: 'shadow_bonus', label: 'Shadow Luck', color: 'text-purple-500', isPct: true }, // Artifact alias
        { key: 'drop_chance_bonus', label: 'Drop Rate', color: 'text-green-300', isPct: true },
        { key: 'gem_bonus', label: 'Gem Luck', color: 'text-pink-400', isPct: true },
        { key: 'resource_drop_bonus', label: 'Harvester', color: 'text-emerald-400', isPct: true }
    ];

    // 2. Build Stats Block
    let statsHTML = '';
    
    statConfig.forEach(stat => {
        // Check if item has this property (value > 0)
        if (fullItem[stat.key] !== undefined && Number(fullItem[stat.key]) !== 0) {
            const rawVal = Number(fullItem[stat.key]);
            
            // [ARCHITECT FIX] Dynamically swap in Universal Math for Primary Stats
            let effVal = rawVal * qm;
            if (['wc', 'ac', 'sc'].includes(stat.key)) {
                effVal = trueStats[stat.key];
            }
            
            let displayVal = '';
            
            if (stat.isPct) {
                // If it's a small decimal (e.g. 0.05), treat as 5%. If it's > 1 (e.g. 5), treat as 5%.
                // Your data mixes these (Jewelry uses 0.05, Gems use integers like 5).
                // Heuristic: If value <= 1, multiply by 100.
                let pctVal = effVal;
                if (Math.abs(rawVal) <= 1.0) pctVal = effVal * 100;
                
                displayVal = `+${Number(pctVal).toFixed(2)}%`;
            } else {
                displayVal = effVal.toFixed(2);
                if (effVal > 0) displayVal = `+${displayVal}`; // Add plus sign for bonuses
            }
            
            // Special formatting for Primary Stats (WC/AC/SC) to match old style
            if (['wc', 'ac', 'sc'].includes(stat.key)) {
                displayVal = effVal.toFixed(2); // No plus sign
            }

            statsHTML += `
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-xs">${stat.label}</span>
                    <span class="${stat.color} font-bold font-mono text-sm">
                        ${displayVal} 
                        ${qm !== 1.0 || effVal !== (rawVal * qm) ? `<span class="text-[9px] text-gray-600">(Base: ${rawVal})</span>` : ''}
                    </span>
                </div>`;
        }
    });

    // 3. Build Enchantments Block
    let enchantHTML = '';
    if (fullItem.enchantments && fullItem.enchantments.length > 0) {
        enchantHTML = `<div class="mt-3 pt-2 border-t border-gray-700">`;
        enchantHTML += `<div class="text-[10px] text-cyan-500 uppercase tracking-widest mb-1 font-orbitron">Enchantments</div>`;
        
        fullItem.enchantments.forEach(ench => {
            let color = 'text-gray-300';
            if (ench.tier >= 7) color = 'text-yellow-400'; 
            else if (ench.tier >= 4) color = 'text-blue-300'; 
            
            let displayString = "";
            const isValValid = ench.value !== undefined && ench.value !== null && !isNaN(Number(ench.value));
            
            if (isValValid) {
                const val = Number(ench.value) % 1 !== 0 ? Number(ench.value).toFixed(2) : Number(ench.value);
                const effectDesc = ench.effect || "Stat";
                displayString = `+${val} ${effectDesc}`;
            } else {
                // Gracefully handles multi-stat enchantments without printing NaN
                const stats = [];
                for (const [k, v] of Object.entries(ench)) {
                    if (k.includes('_bonus') || k.includes('_steal') || k.includes('_pct') || k.includes('_debuff')) {
                        if (v !== undefined && v !== null && !isNaN(Number(v))) {
                            let label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('Bonus', '').trim();
                            if (label === 'Wc') label = 'WC'; if (label === 'Ac') label = 'AC'; if (label === 'Sc') label = 'SC'; if (label === 'Vit') label = 'VIT';
                            stats.push(`+${v} ${label}`);
                        }
                    }
                }
                displayString = stats.length > 0 ? stats.join(', ') : (ench.effect || "Stat");
            }

            enchantHTML += `
                <div class="flex justify-between text-xs items-center mb-1">
                    <span class="${color}">✧ Enchantment</span>
                    <span class="font-mono ${color} text-[10px] bg-black/40 px-1.5 rounded">
                        ${displayString}
                    </span>
                </div>`;
        });
        enchantHTML += `</div>`;
    }

    // 3.5 Build Sockets Block
    let gemsHTML = '';
    const totalSockets = fullItem.sockets || 0;
    const socketedGems = fullItem.socketedGems || [];

    if (totalSockets > 0) {
        gemsHTML = `<div class="mt-3 pt-2 border-t border-gray-700">`;
        gemsHTML += `<div class="text-[10px] text-cyan-500 uppercase tracking-widest mb-1 font-orbitron">Sockets (${socketedGems.length}/${totalSockets})</div>`;
        
        for (let i = 0; i < totalSockets; i++) {
            const gem = socketedGems[i];
            if (gem) {
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
                      // Manual parse if master registry misses it
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
                
                gemsHTML += `
                    <div class="flex justify-between text-xs items-center mb-1">
                        <span class="text-cyan-300">♦ ${name} <span class="text-[9px] text-gray-400">(G${grade})</span></span>
                        <span class="font-mono text-cyan-200 text-[10px] bg-cyan-900/30 border border-cyan-800/50 px-1.5 rounded text-right">
                            ${statText}
                        </span>
                    </div>`;
            } else {
                gemsHTML += `
                    <div class="flex justify-between text-xs items-center mb-1 opacity-50">
                        <span class="text-gray-500">♢ Empty Socket</span>
                    </div>`;
            }
        }
        gemsHTML += `</div>`;
    }

    // 4. Dynamic Action Button
    let actionBtnHTML;
    const isGem = (fullItem.type || '').toLowerCase() === 'gem' || (fullItem.category || '').toLowerCase() === 'gem';
    
    if (context.isEquipped) {
        actionBtnHTML = `
            <button id="inspector-action-btn" class="glass-button py-3 text-yellow-400 border-yellow-900/50 hover:bg-yellow-900/20 font-bold tracking-wider">
                UNEQUIP
            </button>`;
    } else if (!isGem) {
        actionBtnHTML = `
            <button id="inspector-action-btn" class="glass-button py-3 text-green-400 border-green-900/50 hover:bg-green-900/20 font-bold tracking-wider">
                EQUIP
            </button>`;
    } else {
        // Gem State
        actionBtnHTML = `
            <button class="glass-button py-3 text-gray-500 border-gray-700 cursor-not-allowed font-bold tracking-wider opacity-50">
                SOCKETABLE
            </button>`;
    }

    // 5. Render Full HTML
    const contentHTML = `
      <div class="flex flex-col gap-4">
        <div class="flex justify-center py-4 bg-black/20 rounded-lg">
            <div class="relative w-24 h-24 border border-[var(--border-color-main)] rounded-md flex items-center justify-center bg-black/60 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <img src="${imageUrl}" class="w-16 h-16 object-contain drop-shadow-md" alt="${name}">
                <div class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[var(--gold-color)] text-black text-[10px] font-bold rounded">T${fullItem.tier || fullItem.grade || 1}</div>
            </div>
        </div>
        
        <div class="glass-panel p-3 rounded space-y-2 text-sm">
            <div class="flex justify-between border-b border-gray-700 pb-1 mb-2">
                <span class="text-gray-400">Type</span> 
                <span class="text-[var(--highlight-color)] font-orbitron capitalize">${fullItem.type || fullItem.category || 'Misc'}</span>
            </div>
            
            ${statsHTML}
            
            ${qm !== 1.0 ? `<div class="flex justify-between mt-2 pt-2 border-t border-gray-700"><span class="text-yellow-500">Quality</span> <span class="text-yellow-400">${qm > 1 ? '+' : ''}${Math.round((qm - 1) * 100)}%</span></div>` : ''}
            
            ${enchantHTML}
            ${gemsHTML}
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

            if (actionBtn && !actionBtn.classList.contains('cursor-not-allowed')) {
                actionBtn.onclick = () => {
                    if (context.isEquipped) {
                        if (gm && gm.EquipmentManager) {
                            gm.EquipmentManager.unequipItem(context.slotKey);
                            this.hide();
                        }
                    } else {
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