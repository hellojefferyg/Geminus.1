// src/managers/player/CreationManager.js

// 1. Corrected path: Step out of 'managers' and 'player' to reach 'config'
import { races, items, gddConstants } from '../../config/gdd.js';

/**
 * @file src/managers/core/CreationManager.js
 */
export class CreationManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.showToast = deps.showToast;
    this.ModalManager = deps.ModalManager;
    this.Systems = deps.Systems;
    
    this.DataManager = null;
    this.UIManager = null;
    this.GameManager = null;
  }

  setManagers(managers) {
    this.DataManager = managers.DataManager;
    this.UIManager = managers.UIManager;
    this.GameManager = managers.GameManager;
  }

  init() {
    const contentHTML = `
      <div class="creation-card w-full h-full flex flex-col"> 
        <div class="flex-shrink-0"> 
          <h1 class="text-3xl font-orbitron text-center mb-4 text-glow-label">Create Your Hero</h1> 
          <div class="mb-4 px-4"> 
            <input type="text" id="creation-player-name" placeholder="Enter Character Name" class="w-full text-lg editor-input"> 
          </div> 
          <h2 class="text-xl font-orbitron text-center mb-4 text-glow-subtle">Choose Your Race</h2> 
        </div> 
        <div id="creation-race-grid" class="flex-grow overflow-y-auto custom-scrollbar grid grid-cols-2 md:grid-cols-4 gap-2 px-4"> 
          ${Object.keys(races).map(raceId => `
            <div class="race-option p-3 text-center border border-transparent rounded-md cursor-pointer hover:bg-[rgba(var(--highlight-color-rgb),0.2)] font-orbitron text-glow-subtle" data-race="${raceId}">
              ${races[raceId].raceName}
            </div>
          `).join("")} 
        </div> 
        <div class="flex-shrink-0 mt-4 px-4"> 
          <button id="finish-creation-btn" class="glass-button w-full py-3 font-bold rounded-md" disabled>Finish</button> 
        </div> 
      </div>`;

    this.ModalManager.show('Create Your Character', contentHTML, {
      widthClass: 'w-full max-w-3xl h-full sm:h-auto sm:max-h-[90vh]',
      onContentReady: (contentDiv) => {
        let selectedRace = null;
        const finishBtn = contentDiv.querySelector('#finish-creation-btn');
        const nameInput = contentDiv.querySelector('#creation-player-name');

        const checkCanFinish = () => {
          const name = nameInput.value.trim();
          finishBtn.disabled = !selectedRace || name.length < 3;
        };

        contentDiv.querySelectorAll('.race-option').forEach(option => {
          option.addEventListener('click', () => {
            selectedRace = option.dataset.race;
            contentDiv.querySelectorAll('.race-option').forEach(el => {
              el.style.backgroundColor = 'transparent';
            });
            option.style.backgroundColor = `rgba(var(--highlight-color-rgb), 0.3)`;
            checkCanFinish();
          });
        });

        nameInput.addEventListener('input', checkCanFinish);

        finishBtn.addEventListener('click', () => {
          const playerName = nameInput.value.trim();
          this.finishCreation(playerName, selectedRace);
        });
      },
    });
  }

  async finishCreation(playerName, raceId) {
    if (!raceId || !playerName) return;

    // 1. Initialize Player State
    const raceData = races[raceId];
    const startingStats = raceData.apWeights || {}; 
    if (!raceData.apWeights) console.error(`CreationManager: Missing apWeights for race ${raceId}`);

    this.state.player = {
      name: playerName,
      level: 1,
      xp: 0,
      gold: 1000,
      xpToNextLevel: gddConstants.XP_BASE || 200,
      attributePoints: 0, 
      race: raceId,
      archetype: raceData.archetype,
      cci: raceData.coreCombatIdentity,
      baseStats: { ...startingStats },
      derivedStats: {},
      inventory: [],
      equipment: {},
      gems: [],
      lastItemDrop: null,
      lastGemDrop: null,
      defeatedBosses: [],
      pos: { x: 12, y: 12 },
      icon: '👤'
    };

    // --- 2. SMART GEAR ALLOCATION (UPDATED) ---
    // We determine the best weapon and spell based on Mastery Aptitudes.
    
    let weaponType = 'sword'; // Default fallback
    let spellElement = null;
    
    // Check Masteries to pick gear
    if (raceData.masteryAptitudes) {
        // Preferred Weapon Logic
        if (raceData.masteryAptitudes.Staff === 1 || raceData.archetype === 'True Caster') weaponType = 'staff';
        else if (raceData.masteryAptitudes.Axe === 1) weaponType = 'axe';
        else if (raceData.masteryAptitudes.Mace === 1) weaponType = 'mace';
        else if (raceData.masteryAptitudes.Dagger === 1) weaponType = 'dagger';
        else if (raceData.masteryAptitudes.Bow === 1) weaponType = 'bow';
        
        // Preferred Spell Element Logic (for Starter Spell)
        if (raceData.masteryAptitudes.Fire === 1) spellElement = 'fire';
        else if (raceData.masteryAptitudes.Cold === 1) spellElement = 'cold';
        else if (raceData.masteryAptitudes.Earth === 1) spellElement = 'earth';
        else if (raceData.masteryAptitudes.Air === 1) spellElement = 'air';
        else if (raceData.masteryAptitudes.Death === 1) spellElement = 'death';
        else if (raceData.masteryAptitudes.Arcane === 1) spellElement = 'arcane';
        else if (raceData.archetype === 'True Caster') spellElement = 'arcane'; // Default caster fallback
    }

    // A. Find Weapon
    let startingWeaponId = null;
    if (items?.weapons?.[weaponType]) {
        // Find T01 of the chosen type
        const t1Key = Object.keys(items.weapons[weaponType]).find(k => k.includes('T01'));
        if (t1Key) startingWeaponId = items.weapons[weaponType][t1Key].id;
    }
    // Fallback to sword if specific weapon not found
    if (!startingWeaponId && items?.weapons?.sword?.["SWD-WPN-T01"]) {
        startingWeaponId = items.weapons.sword["SWD-WPN-T01"].id;
    }

    // B. Find Armor (Generic T01)
    let startingArmorId = "HLM-HLM-T01"; 
    if (items?.armor) {
      for (const armorType in items.armor) {
        const tier1Key = Object.keys(items.armor[armorType] || {}).find(key => key.includes("-T01"));
        if (tier1Key) {
          startingArmorId = items.armor[armorType][tier1Key].id;
          break;
        }
      }
    }

    // C. Find Spell (If applicable)
    let startingSpellId = null;
    if (spellElement && items?.spells?.[spellElement]) {
        const t1SpellKey = Object.keys(items.spells[spellElement]).find(k => k.includes('T01'));
        if (t1SpellKey) startingSpellId = items.spells[spellElement][t1SpellKey].id;
    }

    // --- 3. GRANT & EQUIP GEAR ---
    
    // Grant Weapon
    if (startingWeaponId) {
        const newWeapon = {
            instanceId: `${startingWeaponId}_${Date.now()}_W`,
            baseItemId: startingWeaponId,
            tier: 1,
            type: 'Dropper',
            socketedGems: []
        };
        this.state.player.inventory.push(newWeapon);
        this.state.player.equipment['Weapon 1'] = newWeapon.instanceId;
    }

    // Grant Armor
    if (startingArmorId) {
        const newArmor = {
            instanceId: `${startingArmorId}_${Date.now()}_A`,
            baseItemId: startingArmorId,
            tier: 1,
            type: 'Dropper',
            socketedGems: []
        };
        this.state.player.inventory.push(newArmor);
        this.state.player.equipment['Armor'] = newArmor.instanceId;
    }

    // Grant Spell (New!)
    if (startingSpellId) {
        const newSpell = {
            instanceId: `${startingSpellId}_${Date.now()}_S`,
            baseItemId: startingSpellId,
            tier: 1,
            type: 'Spell', // Ensure this matches your Item Type logic
            socketedGems: []
        };
        this.state.player.inventory.push(newSpell);
        this.state.player.equipment['Spell 1'] = newSpell.instanceId;
    }

    // 4. Final Calculations
    this.Systems.calculateDerivedStats(this.state.player);
    this.state.player.hp = this.state.player.derivedStats.maxHp;

    // 5. Save & Launch
    await this.DataManager.savePlayer(this.state.player);

    if (this.UIManager) {
      this.UIManager.updatePlayerStatusUI();
    }

    this.ModalManager.hide();
    
    if (this.GameManager) {
        await this.GameManager.loadInitialZone();
        if (this.Systems) {
            this.Systems.calculateDerivedStats(this.state.player);
        }
        if (this.UIManager) {
            this.UIManager.updatePlayerStatusUI();
        }
    }
  }
}