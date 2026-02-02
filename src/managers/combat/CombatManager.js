// src/managers/combat/CombatManager.js

// 1. Corrected Path to step out of 'managers' and 'combat' into 'config'
import { bestiary } from '../../config/gdd.js';

export class CombatManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.Systems = deps.Systems;
    this.ProfileManager = deps.ProfileManager;
    this.SanctuaryManager = null; // Set later via GameManager.setManagers
    this.isInitialized = false;
    this.currentMonster = null;
    this.logMessages = [];
  }

  // Without this line, the Combat Manager is "blind" and cannot see the screen to draw the floating text.
  setManagers(managers) {
    this.ProfileManager = managers.ProfileManager;
    this.SanctuaryManager = managers.SanctuaryManager;
    this.UIManager = managers.UIManager; // [NEW] Connects the visual layer
    if (managers.Systems) this.Systems = managers.Systems;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    this.render();
    this.addEventListeners();
    this.updateCombatInfoPanel();
    
    // [NEW] SMART INITIALIZATION
    // Check if the ZoneManager already has a map-specific list ready for us
    const initialZone = this.state.game.currentZoneId || 'Z01';
    
    if (window.gameManager && window.gameManager.ZoneManager && window.gameManager.ZoneManager.syncCombatData) {
        console.log("⚔️ CombatManager: UI Initialized. Requesting live data from ZoneManager...");
        // This forces the map to re-send its data to us now that we are awake
        window.gameManager.ZoneManager.syncCombatData(); 
    } else {
        // Fallback to static GDD data if the map isn't ready
        this.populateMonsterList(initialZone);
    }

    this.logMessages = ['Select a monster to begin combat.'];
    this.renderLog();
  }

  logToGame(message) {
    this.logMessages.push(message);
    if (this.logMessages.length > 5) {
      this.logMessages.shift();
    }
    this.renderLog();
  }

  renderLog() {
    // Note: Ensure this ID exists in your final HUD HTML
    const logDisplay = document.querySelector('#tab-content-combat #combat-log-display');
    if (logDisplay) {
      logDisplay.innerHTML = this.logMessages.join('<br>');
      logDisplay.scrollTop = logDisplay.scrollHeight;
    }
  }

  render() {
    if (!this.ui.tabContentCombat) return;
    this.ui.tabContentCombat.innerHTML = `
      <div class="space-y-4 flex flex-col h-full">
        <div id="combat-info-panel" class="w-full p-2 rounded-lg bg-black/20 border" style="border-color: var(--border-color-main)">
          <div id="combat-stats-container"></div>
        </div>
        <div class="combat-control-bar flex gap-2 p-2 bg-black/20 rounded-lg">
          <select id="monsterSelect" class="editor-input flex-grow"></select>
          <button class="glass-button px-4 py-2" id="fightBtn">FIGHT</button>
        </div>
        <div class="flex justify-center gap-2">
          <button class="glass-button py-2 rounded-md w-1/2" id="attackBtn" style="display: none;">ATTACK</button>
          <button class="glass-button py-2 rounded-md w-1/2" id="castBtn" style="display: none;">CAST</button>
          <button class="glass-button py-2 rounded-md w-1/2" id="spellstrikeBtn" style="display: none;">SPELLSTRIKE</button>
        </div>
        <div id="combat-log-display" class="flex-grow p-2 overflow-y-auto custom-scrollbar text-sm"></div>
      </div>`;
  }

  updateCombatInfoPanel() {
    const p = this.state.player;
    if (!p || !p.derivedStats) return;

    const statsContainer = document.getElementById('combat-stats-container');
    if (!statsContainer) return;

    const hpPercent = (p.hp / p.derivedStats.maxHp) * 100;
    let healthClass = hpPercent < 20 ? 'text-red-500' : hpPercent < 50 ? 'text-yellow-500' : 'text-green-500';

    const createStatHTML = (label, value) => 
      `<div class="flex justify-between text-xs px-1"><span class="text-glow-label">${label}:</span><span class="text-glow-subtle">${value}</span></div>`;

    statsContainer.innerHTML = `
      <div class="grid grid-cols-2 gap-x-4">
        ${createStatHTML('Level', p.level)}
        ${createStatHTML('Health', `<span class="${healthClass}">${Math.ceil(p.hp)} / ${Math.ceil(p.derivedStats.maxHp)}</span>`)}
        ${createStatHTML('Gold', Math.floor(p.gold).toLocaleString())}
        ${createStatHTML('XP', Math.floor(p.xp).toLocaleString())}
        ${createStatHTML('Inv', `${p.inventory.length}/200`)}
        ${createStatHTML('Next', Math.floor(p.xpToNextLevel).toLocaleString())}
      </div>
      <div class="text-[10px] text-glow-subtle text-center mt-1 border-t border-white/10 pt-1">Location: ${this.state.zone.name}</div>
    `;
  }

  addEventListeners() {
    const combatTab = this.ui.tabContentCombat;
    if (!combatTab) return;

    const monsterSelect = combatTab.querySelector('#monsterSelect');
    if (monsterSelect) {
        monsterSelect.addEventListener('change', (e) => this.selectMonster(e.target.value));
    }

    const fightBtn = combatTab.querySelector('#fightBtn');
    if (fightBtn) {
        fightBtn.addEventListener('click', () => this.fight());
    }

    ['attackBtn', 'castBtn', 'spellstrikeBtn'].forEach(id => {
        const btn = combatTab.querySelector(`#${id}`);
        if (btn) {
            btn.addEventListener('click', () => this.performAction(id.replace('Btn', '')));
        }
    });
    // [NEW] Listen for Stat Allocation Clicks in the Log
    const logDisplay = combatTab.querySelector('#combat-log-display');
    if (logDisplay) {
        logDisplay.addEventListener('click', (e) => {
            const link = e.target.closest('.stat-allocation-link');
            if (link && this.ProfileManager) {
                const stat = link.dataset.stat;
                
                // Call the Bulk Dump function
                const success = this.ProfileManager.allocateAllPoints(stat);
                
                if (success) {
                    // [FIX] Visual confirmation: Remove the buttons so they can't be clicked again
                    const container = link.closest('div'); // The parent container of the links
                    if (container) {
                        container.innerHTML = `<div class="text-cyan-400 font-bold text-center">>> Power channeled into ${stat}.</div>`;
                    }
                    this.updateCombatInfoPanel();
                }
            }
        });
    }
  }

  populateMonsterList(zoneId) {
    this.state.game.currentZoneId = zoneId;
    const zoneData = bestiary[zoneId];
    if (!zoneData) return;

    const monsterSelect = document.getElementById('monsterSelect');
    if (!monsterSelect) return;

    let optionsHTML = '<option value="">Select a monster...</option>';
    if (zoneData.monsters) {
      zoneData.monsters.forEach(m => {
        optionsHTML += `<option value="${m.id}">${m.name}</option>`;
      });
    }
    monsterSelect.innerHTML = optionsHTML;
    this.resetCombatSelection();
  }

  /**
   * Populate monster list from zone data (zoneMobs array)
   * [UPDATED] Stores the mobs so selectMonster can find them later.
   */
  populateMonsterListFromZone(zoneId, zoneMobs) {
    this.state.game.currentZoneId = zoneId;
    this.currentZoneMobs = zoneMobs; // <--- [NEW] Save the list!
    
    const monsterSelect = document.getElementById('monsterSelect');
    if (!monsterSelect) return;

    let optionsHTML = '<option value="">Select a monster...</option>';
    if (zoneMobs && zoneMobs.length > 0) {
      zoneMobs.forEach(m => {
        const mobId = m.id || m.eid || `EID_${Date.now()}`;
        const mobName = m.name || mobId;
        const levelText = m.level ? ` (Lvl ${m.level})` : '';
        const bossText = m.isBoss ? ' 💀' : '';
        optionsHTML += `<option value="${mobId}">${mobName}${levelText}${bossText}</option>`;
      });
    }
    monsterSelect.innerHTML = optionsHTML;
    this.resetCombatSelection();
  }

  selectMonster(monsterId) {
    if (!monsterId) {
      this.resetCombatSelection();
      return;
    }

    // 1. Try to find the mob in the Dynamic Zone List (from Map)
    let monsterTemplate = null;
    if (this.currentZoneMobs) {
        monsterTemplate = this.currentZoneMobs.find(m => (m.id || m.eid) === monsterId);
    }

    // 2. Fallback: Check Static Bestiary (Legacy Support)
    if (!monsterTemplate) {
        const zoneData = bestiary[this.state.game.currentZoneId];
        if (zoneData && zoneData.monsters) {
            monsterTemplate = zoneData.monsters.find(m => m.id === monsterId);
        }
    }

    if (!monsterTemplate) {
        console.warn(`CombatManager: Monster ID '${monsterId}' not found in Zone Mobs or Bestiary.`);
        return;
    }

    // 3. Scale & Set Monster
    // Check if gearTier exists, default to 1 if not
    const tier = (bestiary[this.state.game.currentZoneId] && bestiary[this.state.game.currentZoneId].gearTier) || 1;
    
   // [UPDATED] Pass Zone ID for "Super Easy" Scaling Checks
    const scaledMonster = this.Systems.MonsterScaling(monsterTemplate, tier, this.state.game.currentZoneId);
    this.currentMonster = {
      ...scaledMonster,
      currentHP: scaledMonster.hp,
      stats: {
        ATK: scaledMonster.atk,
        DEF: scaledMonster.def,
        HP: scaledMonster.hp,
        XP: scaledMonster.xp,
        GOLD: scaledMonster.gold
      }
    };

    this.logMessages = [`You are targeting ${this.currentMonster.name}.`];
    this.renderLog();
    this.updateButtons();
  }

  fight() {
    if (!this.currentMonster || !this.state.player) return;

    // 1. Prepare State
    this.state.game.combatActive = true;
    
    // Always reset monster to full HP at start of new fight (Essential for Re-rolls)
    this.currentMonster.currentHP = this.currentMonster.hp; 
    
    // Clear previous logs to keep it clean for high-speed grinding
    this.logMessages = [`⚔️ You engage the ${this.currentMonster.name}!`];
    
    this.renderLog();
    this.updateButtons(); // Refresh button states
    this.updateCombatInfoPanel();
  }

  performAction(actionType) {
    if (!this.state.game.combatActive || !this.currentMonster) return;

    // 1. Resolve ONE Turn
    const result = this.Systems.resolveCombatTurn(this.state.player, this.currentMonster, actionType);

    // 2. Log & Visualize Player Action
    if (result.damageDealt) {
      // VISUALS: Determine if it's a Crit or Normal hit
      const isCrit = result.isCrit;
      const type = isCrit ? 'crit' : 'damage';
      
      // [FIXED] Use this.UIManager directly (removed .ui)
      if (this.UIManager) {
          // Try to spawn it over the monster info panel
          const monsterEl = document.querySelector('#combat-info-panel');
          this.UIManager.showFloatingText(Math.floor(result.damageDealt), type, monsterEl);
      }

      let msg = `You hit ${this.currentMonster.name} for <span class="log-player">${Math.floor(result.damageDealt)}</span>.`;
      if (isCrit) msg += ` <span class="text-yellow-400 font-bold">CRIT!</span>`;
      if (result.isDoubleHit) msg += ` <span class="text-cyan-400 font-bold">DOUBLE!</span>`;
      this.logToGame(msg);
    }

    // 3. Check Victory
    if (result.status === 'VICTORY') {
      this.logToGame(`<span class="log-enemy text-red-500 font-bold">${this.currentMonster.name} slain.</span>`);
      
      const lootMessages = this.Systems.generateLoot(
        this.state.player,
        this.currentMonster,
        this.state.game.currentZoneId
      );

      // [UPDATED] Smart Loot Visualization
      if (this.UIManager) {
          // 1. Show Standard Gains (XP/Gold)
          const xp = Math.floor(this.currentMonster.xp);
          const gold = Math.floor(this.currentMonster.gold);
          
          setTimeout(() => this.UIManager.showFloatingText(`+${xp} XP`, 'xp'), 200);
          setTimeout(() => this.UIManager.showFloatingText(`+${gold} Gold`, 'gold'), 600);

          // 2. Scan for Rares (Shadows, Echoes, Gems, Quest Items)
          lootMessages.forEach((msg, index) => {
              // Stagger the popups so they don't stack perfectly
              const delay = 1000 + (index * 400);

              if (msg.includes('Shadow Found')) {
                  // Tier 1: Shadow (Purple)
                  setTimeout(() => this.UIManager.showFloatingText('🟣 SHADOW DROP!', 'shadow'), delay);
              } 
              else if (msg.includes('Echo of')) {
                  // Tier 2: Echo (Purple - Same style, distinct text)
                  setTimeout(() => this.UIManager.showFloatingText('🌑 ECHO MANIFESTED!', 'shadow'), delay);
              }
              else if (msg.includes('Loot:') || msg.includes('Gem')) {
                  // Gems (Cyan)
                  setTimeout(() => this.UIManager.showFloatingText('💎 GEM FOUND!', 'gem'), delay);
              }
              else if (msg.includes('Quest') || msg.includes('Artifact')) {
                  // Quest Items (Orange)
                  setTimeout(() => this.UIManager.showFloatingText('📜 QUEST ITEM!', 'quest'), delay);
              }
          });
      }

      lootMessages.forEach(msg => this.logToGame(msg));
      
      // [NEW] Level Up Prompt (Preserved)
      const p = this.state.player;
      if (p.attributePoints > 0) {
          this.renderLevelUpOptions(p.attributePoints);
      }
      
      this.endCombat();
      return; 
    }

    // 4. Monster Counter-Attack (Only if alive)
    if (result.damageTaken) {
      this.logToGame(`${this.currentMonster.name} hits you for <span class="log-enemy">${Math.floor(result.damageTaken)}</span>.`);
    }

    // 5. Check Defeat
    if (result.status === 'DEFEAT') {
      this.logToGame(`<span class="log-enemy text-red-600 font-bold">You have been defeated!</span>`);
      this.endCombat();
      if (this.SanctuaryManager) {
        this.SanctuaryManager.handlePlayerDefeat();
      }
      return;
    }

    // 6. Update UI (Health Bars, etc)
    this.ProfileManager.updateAllProfileUI();
    this.updateCombatInfoPanel();
  }

  endCombat() {
    this.state.game.combatActive = false;
    this.updateButtons();
    this.updateCombatInfoPanel();
    this.renderLog();
  }

  resetCombatSelection() {
    this.currentMonster = null;
    this.state.game.combatActive = false;
    this.logMessages = ['Select a monster to begin combat.'];
    this.renderLog();
    this.updateButtons();
  }

  updateButtons() {
    const fightBtn = document.getElementById('fightBtn');
    const attackBtn = document.getElementById('attackBtn');
    const castBtn = document.getElementById('castBtn');
    const spellstrikeBtn = document.getElementById('spellstrikeBtn');

    if (!fightBtn || !attackBtn || !castBtn || !spellstrikeBtn) return;

    const isFighting = this.state.game.combatActive;
    const p = this.state.player;

    // [UPDATED] FIGHT Button is ALWAYS visible to allow skipping/re-rolling
    fightBtn.style.display = 'block';
    
    // Disable Fight button only if no monster is selected at all
    fightBtn.disabled = !this.currentMonster; 

    // Action Buttons: Only visible when actively fighting
    // This creates the UI state: [FIGHT] [ATTACK] [CAST] all visible during combat
    const showActions = isFighting;
    
    attackBtn.style.display = (showActions && (p.archetype === 'True Fighter' || p.archetype === 'Hybrid')) ? 'block' : 'none';
    castBtn.style.display = (showActions && (p.archetype === 'True Caster' || p.archetype === 'Hybrid')) ? 'block' : 'none';
    spellstrikeBtn.style.display = (showActions && p.archetype === 'Hybrid') ? 'block' : 'none';
  }
  /**
   * Renders the clickable stat allocation links.
   * Shows "DEX (4)" where 4 is the number of levels banked.
   */
  renderLevelUpOptions(points) {
    const stats = ['DEX', 'STR', 'NTL', 'WIS', 'VIT'];
    
    // Each link calls the ProfileManager when clicked
    const links = stats.map(stat => 
        `<span class="stat-allocation-link text-green-400 cursor-pointer hover:underline hover:text-white font-bold" data-stat="${stat}">
            ${stat} (${points})
         </span>`
    ).join(' <span class="text-gray-500">|</span> ');

    this.logToGame(`<div class="mt-2 p-2 border border-green-900/50 bg-green-900/10 rounded text-center text-xs">
        <div class="text-yellow-400 font-cinzel mb-1">Select Attribute Focus</div>
        ${links}
    </div>`);
  }
}