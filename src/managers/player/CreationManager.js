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
          <h2 class="text-xl font-orbitron text-center mb-4 text-glow-subtle">Choose Your Identity</h2> 
          <div class="flex justify-center gap-4 mb-6">
            <button onclick="gameManager.CreationManager.setGender('male')" class="gender-btn px-6 py-2 border border-teal-500/50 rounded hover:bg-teal-500/20 font-orbitron">Male</button>
            <button onclick="gameManager.CreationManager.setGender('female')" class="gender-btn px-6 py-2 border border-teal-500/50 rounded hover:bg-teal-500/20 font-orbitron">Female</button>
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
          // SURGICAL FIX: Ensure name, race, AND gender are selected
          const genderSelected = this.tempPlayer && this.tempPlayer.gender;
          finishBtn.disabled = !selectedRace || name.length < 3 || !genderSelected;
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
  /**
   * Sets the player's gender and updates the UI selection state.
   * @param {string} gender - 'male' or 'female'
   */
  setGender(gender) {
    if (!this.tempPlayer) this.tempPlayer = {};
    this.tempPlayer.gender = gender;
    
    console.log(`👤 Creation: Gender set to ${gender}`);

    // Update UI: Find all gender buttons in the current modal
    const buttons = document.querySelectorAll('.gender-btn');
    buttons.forEach(btn => {
        // Use an exact match so "Male" doesn't trigger when "Female" is selected
const isTarget = btn.innerText.trim().toLowerCase() === gender.toLowerCase();
        
        if (isTarget) {
            btn.classList.add('bg-teal-500/30', 'border-teal-400', 'text-white');
            btn.classList.remove('border-teal-500/50');
        } else {
            btn.classList.remove('bg-teal-500/30', 'border-teal-400', 'text-white');
            btn.classList.add('border-teal-500/50');
        }
    });
    // Trigger the finish button check whenever gender changes
    const nameInput = document.getElementById('creation-player-name');
    if (nameInput) {
        // This is a bit of a hack to trigger the internal checkCanFinish logic
        nameInput.dispatchEvent(new Event('input'));
    }
  }

  async finishCreation(playerName, raceId) {
    if (!raceId || !playerName) return;

    // --- STEP 1: DEFINE THE SPAWN MAP ---
    // Mapping every race to their ancestral GDD starting zone
    const SPAWN_MAP = {
      dwarf: { zone: 'Z01', x: 12, y: 14 },
      elf: { zone: 'Z02', x: 10, y: 10 },
      halfling: { zone: 'Z03', x: 15, y: 15 },
      human: { zone: 'Z04', x: 8, y: 8 },
      gnome: { zone: 'Z05', x: 12, y: 12 },
      dragonborn: { zone: 'Z06', x: 20, y: 10 },
      tiefling: { zone: 'Z07', x: 5, y: 18 },
      hobbit: { zone: 'Z08', x: 12, y: 12 },
      orc: { zone: 'Z09', x: 14, y: 14 },
      troll: { zone: 'Z10', x: 9, y: 15 },
      minotaur: { zone: 'Z11', x: 12, y: 12 },
      centaur: { zone: 'Z12', x: 22, y: 10 },
      griffin: { zone: 'Z13', x: 12, y: 5 },
      phoenix: { zone: 'Z14', x: 12, y: 12 },
      unicorn: { zone: 'Z15', x: 10, y: 10 },
      baba_yaga: { zone: 'Z16', x: 12, y: 12 },
      draugr: { zone: 'Z17', x: 12, y: 20 },
      mermaid: { zone: 'Z18', x: 12, y: 12 },
      vampire: { zone: 'Z19', x: 15, y: 15 },
      werewolf: { zone: 'Z20', x: 12, y: 12 },
      banshee: { zone: 'Z21', x: 12, y: 12 },
      aasimar: { zone: 'Z22', x: 12, y: 12 },
      demon: { zone: 'Z23', x: 12, y: 12 },
      angel: { zone: 'Z24', x: 12, y: 12 }
    };

    // Determine specific spawn data or fallback to Z01
    const spawnData = SPAWN_MAP[raceId.toLowerCase()] || { zone: 'Z01', x: 12, y: 12 };

    // 1. Initialize Player State
    const raceData = races[raceId];
    const startingStats = raceData.apWeights || {}; 
    if (!raceData.apWeights) console.error(`CreationManager: Missing apWeights for race ${raceId}`);

    this.state.player = {
      name: playerName,
      // SURGICAL FIX: Persisting the gender selected in the UI
      gender: this.tempPlayer?.gender || this.state.settings?.defaultGender || 'female',
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
      // SURGICAL UPDATE: Set position from Spawn Map
      pos: { x: spawnData.x, y: spawnData.y },
      icon: '👤'
    };

    // 2. Update Global Game State for Zone Loading
    this.state.game.currentZoneId = spawnData.zone;

    // --- 3. SMART GEAR ALLOCATION (THE DEV-MANAGER METHOD) ---
    const archetype = (raceData.archetype || '').toLowerCase();
    const isCaster = archetype.includes('caster') || archetype.includes('mage') || archetype.includes('weaver');

    let weaponType = 'sword'; 
    let spellElement = 'arcane';
    
    if (raceData.masteryAptitudes) {
        if (raceData.masteryAptitudes.Staff === 1 || isCaster) weaponType = 'staff';
        else if (raceData.masteryAptitudes.Axe === 1) weaponType = 'axe';
        else if (raceData.masteryAptitudes.Mace === 1) weaponType = 'mace';
        else if (raceData.masteryAptitudes.Dagger === 1) weaponType = 'dagger';
        else if (raceData.masteryAptitudes.Bow === 1) weaponType = 'bow';
        
        if (raceData.masteryAptitudes.Fire === 1) spellElement = 'fire';
        else if (raceData.masteryAptitudes.Cold === 1) spellElement = 'cold';
        else if (raceData.masteryAptitudes.Earth === 1) spellElement = 'earth';
        else if (raceData.masteryAptitudes.Air === 1) spellElement = 'air';
        else if (raceData.masteryAptitudes.Death === 1) spellElement = 'death';
    }

    // [SECRET FIX 1] Build a flat array and INJECT the category type, exactly like DevManager!
    let allItems = [];
    try {
        if (items?.weapons) Object.entries(items.weapons).forEach(([k, cat]) => Object.values(cat).forEach(i => allItems.push({...i, type: k})));
        if (items?.armor) Object.entries(items.armor).forEach(([k, cat]) => Object.values(cat).forEach(i => allItems.push({...i, type: k})));
        if (items?.spells) Object.entries(items.spells).forEach(([k, cat]) => Object.values(cat).forEach(i => allItems.push({...i, type: k})));
    } catch (e) {
        console.warn("CreationManager: Could not flatten items database.", e);
    }

    let starterWeapon = null;
    let starterSpell = null;
    let starterArmor = null;

    // Triple-Layer Search: Checks the injected type, the item name, and the ID just to be safe
    const searchMatch = (item, keyword) => {
        const str = `${item.type || ''} ${item.name || ''} ${item.id || ''}`.toLowerCase();
        return str.includes(keyword.toLowerCase()) && item.tier === 1;
    };

    if (isCaster) {
        starterSpell = allItems.find(i => searchMatch(i, spellElement))
                    || allItems.find(i => searchMatch(i, 'arcane'));
    } else {
        starterWeapon = allItems.find(i => searchMatch(i, weaponType))
                     || allItems.find(i => searchMatch(i, 'sword'));
    }

    // Chest armor specifically rejects anything with HLM (helmets)
    starterArmor = allItems.find(i => (searchMatch(i, 'chest') || searchMatch(i, 'armor')) && !(i.id||'').includes('HLM'));

    // HARD FALLBACKS: A mathematical guarantee the player is never spawned naked
    if (!starterWeapon && !isCaster) starterWeapon = { id: 'SWD-WPN-T01', name: 'Novice Sword', tier: 1, wc: 10, type: 'sword' };
    if (!starterSpell && isCaster) starterSpell = { id: 'ARC-SPL-T01', name: 'Novice Arcane', tier: 1, sc: 10, type: 'arcane' };
    if (!starterArmor) starterArmor = { id: 'CHST-ARM-T01', name: 'Novice Tunic', tier: 1, ac: 15, type: 'chest' };

    // --- 4. GRANT & EQUIP GEAR ---
    if (starterWeapon) {
        const newWeapon = {
            ...starterWeapon, 
            instanceId: `${starterWeapon.id || 'WPN'}_${Date.now()}_W`,
            baseItemId: starterWeapon.id,
            category: 'Weapon', // Helps UI Sorting
            socketedGems: []
        };
        this.state.player.inventory.push(newWeapon);
        this.state.player.equipment['Weapon'] = newWeapon.instanceId;
    }

    if (starterArmor) {
        const newArmor = {
            ...starterArmor,
            instanceId: `${starterArmor.id || 'ARM'}_${Date.now()}_A`,
            baseItemId: starterArmor.id,
            category: 'Armor', // Helps UI Sorting
            socketedGems: []
        };
        this.state.player.inventory.push(newArmor);
        this.state.player.equipment['Chest'] = newArmor.instanceId;
    }

    if (starterSpell) {
        const newSpell = {
            ...starterSpell,
            instanceId: `${starterSpell.id || 'SPL'}_${Date.now()}_S`,
            baseItemId: starterSpell.id,
            category: 'Spell', // Helps UI Sorting
            socketedGems: []
        };
        this.state.player.inventory.push(newSpell);
        this.state.player.equipment['Spell 1'] = newSpell.instanceId;
    }

    // 5. Final Calculations
    this.Systems.calculateDerivedStats(this.state.player);
    this.state.player.hp = this.state.player.derivedStats.maxHp;

    // 6. Save & Launch
    await this.DataManager.savePlayer(this.state.player);

    if (this.UIManager) {
      this.UIManager.updatePlayerStatusUI();
    }

    this.ModalManager.hide();
    
    if (this.GameManager) {
        // Load the ancestral home zone dynamically
        await this.GameManager.loadInitialZone(spawnData.zone);
        if (this.Systems) {
            this.Systems.calculateDerivedStats(this.state.player);
        }
        if (this.UIManager) {
            this.UIManager.updatePlayerStatusUI();
        }
    }
  }
}