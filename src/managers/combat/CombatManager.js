// src/managers/combat/CombatManager.js

import { bestiary } from '../../config/gdd.js';

export class CombatManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.Systems = deps.Systems;
    this.ProfileManager = deps.ProfileManager;
    this.SanctuaryManager = null; 
    this.UIManager = null; 
    this.isInitialized = false;
    this.currentMonster = null;
    this.logMessages = [];
    
    // Persist UI preference
    this.handedness = localStorage.getItem('combatHandedness') || 'right';
  }

  setManagers(managers) {
    this.ProfileManager = managers.ProfileManager;
    this.SanctuaryManager = managers.SanctuaryManager;
    this.UIManager = managers.UIManager; 
    if (managers.Systems) this.Systems = managers.Systems;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    this.render();
    this.addEventListeners();
    this.updateCombatInfoPanel();
    
    const initialZone = this.state.game.currentZoneId || 'Z01';
    
    if (window.gameManager && window.gameManager.ZoneManager && window.gameManager.ZoneManager.syncCombatData) {
        console.log("⚔️ CombatManager: UI Initialized. Requesting live data from ZoneManager...");
        window.gameManager.ZoneManager.syncCombatData(); 
    } else {
        this.populateMonsterList(initialZone);
    }

    this.logMessages = ['Select a monster to begin combat.'];
    this.renderLog();
  }

  logToGame(message) {
    this.logMessages.push(message);
    if (this.logMessages.length > 50) { 
      this.logMessages.shift();
    }
    this.renderLog();
  }

  renderLog() {
    const logDisplay = document.getElementById('combat-log-display');
    if (logDisplay) {
      logDisplay.innerHTML = this.logMessages.join('<br>');
      logDisplay.scrollTop = logDisplay.scrollHeight;
    }
  }

  bindTeleportUI() {
    this.ui.combatRoot = document.getElementById('combat-module-root');
    this.ui.combatModal = document.getElementById('combat-modal');
    this.ui.combatModalBody = document.getElementById('combat-modal-body');
    this.ui.closeCombatModalBtn = document.getElementById('close-combat-modal-btn');
    this.ui.tabContentCombat = document.getElementById('tab-content-combat');
    
    // Chat Teleportation Bindings
    this.ui.chatFooter = document.getElementById('footer-chat-container');
    this.ui.mainFooterSlot = document.getElementById('footer-container');
    this.ui.modalChatSlot = document.getElementById('combat-modal-chat-slot');
  }

  /**
   * [ARCHITECT FIX] High-Speed Grinding Layout
   * Order: Stats -> Fight Bar -> Actions -> Log (Bottom)
   * This keeps Fight and Action buttons close together for rapid clicks.
   */
  render() {
    this.bindTeleportUI();
    if (!this.ui.combatRoot) return;
    this.ui.combatRoot.innerHTML = `
      <div class="flex flex-col h-full relative">
        
        <div id="combat-info-panel" class="w-full p-2 mb-1 rounded-lg bg-black/20 border shrink-0" style="border-color: var(--border-color-main)">
          <div id="combat-stats-container"></div>
        </div>

        <div class="w-full flex justify-end px-1 mb-1">
            <button id="handedness-toggle" class="text-[9px] text-gray-500 hover:text-cyan-400 font-mono border border-gray-800/50 px-2 py-0.5 rounded bg-black/40 transition-colors uppercase">
                UI: ${this.handedness}
            </button>
        </div>

        <div class="combat-control-bar flex gap-2 p-2 mb-1 bg-black/20 rounded-lg shrink-0">
          <select id="monsterSelect" class="editor-input flex-grow"></select>
          <button class="glass-button px-4 py-2" id="fightBtn">FIGHT</button>
        </div>

        <div id="combat-actions-container" class="p-2 mb-2 border-b border-gray-800/50 bg-black/40 backdrop-blur-sm hidden shrink-0 rounded-lg">
        </div>

        <div id="combat-log-display" class="flex-grow p-2 overflow-y-auto custom-scrollbar text-sm bg-black/10 rounded border border-white/5 shadow-inner"></div>
      </div>`;
  }

  /**
   * [ARCHITECT FIX] Dynamic Button Rendering
   * Handles Universal Actions, Handedness Sorting, and Toggle Placement.
   */
  renderCombatControls() {
    const container = document.getElementById('combat-actions-container');
    if (!container) return;

    // 1. Define Available Actions
    const actions = [
        { id: 'attack', label: 'ATTACK', type: 'physical' },
        { id: 'cast', label: 'CAST', type: 'magical' }
    ];

    // 2. Class Specific Extras
    const pClass = this.state.player.class || '';
    const pSub = this.state.player.subType || '';
    if (pClass === 'SpellStrike' || pSub === 'SpellBlade' || this.state.player.archetype === 'Hybrid') {
        actions.push({ id: 'spellstrike', label: 'SPELLSTRIKE', type: 'hybrid' });
    }

    // 3. Determine "Dominant" Action for Sorting
    const raceData = this.state.player.raceData || {}; 
    const isCaster = raceData.archetype === 'True Caster';
    const isHybrid = actions.some(a => a.id === 'spellstrike');
    const dominantActionId = isHybrid ? 'spellstrike' : (isCaster ? 'cast' : 'attack');

    // 4. Sort based on Handedness
    actions.sort((a, b) => {
        const isADom = a.id === dominantActionId;
        const isBDom = b.id === dominantActionId;
        
        if (this.handedness === 'left') {
            return isADom ? -1 : 1; 
        } else {
            return isADom ? 1 : -1; 
        }
    });

    // 5. Generate Buttons HTML
    const buttonsHTML = actions.map(action => {
        let colorClass = 'border-gray-500 text-gray-200 hover:bg-gray-800'; 
        if (action.type === 'physical') colorClass = 'border-red-500/50 text-red-100 hover:bg-red-900/40 bg-red-900/10 shadow-[0_0_5px_rgba(220,38,38,0.2)]';
        if (action.type === 'magical') colorClass = 'border-blue-500/50 text-blue-100 hover:bg-blue-900/40 bg-blue-900/10 shadow-[0_0_5px_rgba(37,99,235,0.2)]';
        if (action.type === 'hybrid') colorClass = 'border-purple-500/50 text-purple-100 hover:bg-purple-900/40 bg-purple-900/10 shadow-[0_0_5px_rgba(147,51,234,0.2)]';

        const isDominant = action.id === dominantActionId;
        const sizeClass = isDominant ? 'font-bold tracking-widest border-opacity-100' : 'opacity-90 border-opacity-60';

        return `
            <button class="combat-action-btn flex-1 h-12 rounded border ${colorClass} ${sizeClass} transition-all active:scale-95 flex items-center justify-center uppercase font-orbitron text-xs sm:text-sm"
                data-action="${action.id}">
                ${action.label}
            </button>
        `;
    }).join('');

    // 6. Inject JUST the buttons (Toggle is now handled in render())
    container.innerHTML = `
        <div class="flex gap-2 w-full">
            ${buttonsHTML}
        </div>
    `;

    // 7. Attach Listeners
    this.attachDynamicListeners(container);
  }

  attachDynamicListeners(container) {
      container.querySelectorAll('.combat-action-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
              const action = e.target.closest('button').dataset.action;
              this.performAction(action);
          });
      });

      const toggleBtn = container.querySelector('#handedness-toggle');
      if (toggleBtn) {
          toggleBtn.addEventListener('click', () => {
              this.handedness = this.handedness === 'right' ? 'left' : 'right';
              localStorage.setItem('combatHandedness', this.handedness);
              this.renderCombatControls(); 
          });
      }
  }

  teleport(toModal) {
    // 1. Force Dynamic DOM Binding
    this.bindTeleportUI();
    
    if (!this.ui.combatRoot || !this.ui.combatModalBody || !this.ui.tabContentCombat) {
        console.error("❌ CombatManager: Teleport aborted. Missing DOM nodes.");
        return;
    }

    // 2. SELF-HEALING ARCHITECTURE
    // If the browser wiped the innerHTML during layout shifts, rebuild it instantly.
    if (!this.ui.combatRoot.querySelector('#combat-info-panel')) {
        console.warn("⚠️ CombatManager: Interface collapsed during shift. Executing Self-Healing rebuild...");
        this.render();
        this.addEventListeners();
        this.updateCombatInfoPanel();
    }
    
    // 3. Force Flex Display (overriding any inherited tab-hiding CSS)
    this.ui.combatRoot.classList.remove('hidden');
    this.ui.combatRoot.style.display = 'flex';
    
    // 4. Execute DOM Teleportation
    if (toModal) {
      this.ui.combatModalBody.appendChild(this.ui.combatRoot);
      if (this.ui.chatFooter && this.ui.modalChatSlot) {
          this.ui.modalChatSlot.appendChild(this.ui.chatFooter);
          this.ui.chatFooter.style.display = 'flex'; // Force visibility of chat footer
      }
      if (this.ui.combatModal) {
          this.ui.combatModal.classList.remove('hidden');
          this.ui.combatModal.classList.add('flex');
      }
    } else {
      this.ui.tabContentCombat.appendChild(this.ui.combatRoot);
      if (this.ui.chatFooter && this.ui.mainFooterSlot) {
          this.ui.mainFooterSlot.appendChild(this.ui.chatFooter);
      }
      if (this.ui.combatModal) {
          this.ui.combatModal.classList.remove('flex');
          this.ui.combatModal.classList.add('hidden');
      }
    }
    
    this.renderLog();

    // 5. Delay Scroll to allow browser painting to finish
    setTimeout(() => {
        const chatContent = document.getElementById('footer-chat-content-wrapper');
        if (chatContent) chatContent.scrollTop = chatContent.scrollHeight;
    }, 25);
  }

  openWildEncounter(monsterList, isBoss = false) {
    this.teleport(true);
    const zoneId = this.state.game.currentZoneId || 'Z01';
    this.populateMonsterListFromZone(zoneId, monsterList);
    
    if (monsterList && monsterList.length > 0) {
      const mobId = monsterList[0].id || monsterList[0].eid;
      const monsterSelect = document.getElementById('monsterSelect');
      if (monsterSelect) monsterSelect.value = mobId;
      this.selectMonster(mobId);
    }
    this.logToGame(isBoss ? "<span class='text-red-500 font-bold'>A BOSS approaches!</span>" : "<span class='text-yellow-400'>A wild monster attacks!</span>");
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
    if (this.ui.closeCombatModalBtn) {
        this.ui.closeCombatModalBtn.addEventListener('click', () => this.teleport(false));
    }

    const combatRoot = this.ui.combatRoot;
    if (!combatRoot) return;

    const monsterSelect = combatRoot.querySelector('#monsterSelect');
    if (monsterSelect) {
        monsterSelect.addEventListener('change', (e) => this.selectMonster(e.target.value));
    }

    const fightBtn = combatRoot.querySelector('#fightBtn');
    if (fightBtn) {
        fightBtn.addEventListener('click', () => this.fight());
    }

    // [NEW] Handedness Toggle Listener (Now Static)
    const toggleBtn = combatRoot.querySelector('#handedness-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // Flip State
            this.handedness = this.handedness === 'right' ? 'left' : 'right';
            
            // Save & Update UI Text
            localStorage.setItem('combatHandedness', this.handedness);
            toggleBtn.textContent = `UI: ${this.handedness.toUpperCase()}`;
            
            // Re-render the buttons below
            this.renderCombatControls(); 
        });
    }

    const logDisplay = combatRoot.querySelector('#combat-log-display');
    if (logDisplay) {
        logDisplay.addEventListener('click', (e) => {
            const link = e.target.closest('.stat-allocation-link');
            if (link && this.ProfileManager) {
                const stat = link.dataset.stat;
                const success = this.ProfileManager.allocateAllPoints(stat);
                if (success) {
                    const container = link.closest('div'); 
                    if (container) container.innerHTML = `<div class="text-cyan-400 font-bold text-center">>> Power channeled into ${stat}.</div>`;
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

  populateMonsterListFromZone(zoneId, zoneMobs) {
    this.state.game.currentZoneId = zoneId;
    this.currentZoneMobs = zoneMobs; 
    
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

    let monsterTemplate = null;
    if (this.currentZoneMobs) {
        monsterTemplate = this.currentZoneMobs.find(m => (m.id || m.eid) === monsterId);
    }

    if (!monsterTemplate) {
        const zoneData = bestiary[this.state.game.currentZoneId];
        if (zoneData && zoneData.monsters) {
            monsterTemplate = zoneData.monsters.find(m => m.id === monsterId);
        }
    }

    if (!monsterTemplate) {
        console.warn(`CombatManager: Monster ID '${monsterId}' not found.`);
        return;
    }

    const tier = (bestiary[this.state.game.currentZoneId] && bestiary[this.state.game.currentZoneId].gearTier) || 1;
    const scaledMonster = this.Systems.MonsterScaling(monsterTemplate, tier, this.state.game.currentZoneId);
    
    this.currentMonster = {
      ...scaledMonster,
      currentHP: scaledMonster.hp,
      stats: { ATK: scaledMonster.atk, DEF: scaledMonster.def, HP: scaledMonster.hp, XP: scaledMonster.xp, GOLD: scaledMonster.gold }
    };

    this.logMessages = [`You are targeting ${this.currentMonster.name}.`];
    this.renderLog();
    this.updateButtons();
  }

  fight() {
    if (!this.currentMonster || !this.state.player) return;
    this.state.game.combatActive = true;
    this.currentMonster.currentHP = this.currentMonster.hp; 
    this.logMessages = [`⚔️ You engage the ${this.currentMonster.name}!`];
    this.renderLog();
    this.updateButtons(); 
    this.updateCombatInfoPanel();
  }

  performAction(actionType) {
    if (!this.state.game.combatActive || !this.currentMonster) return;

    const result = this.Systems.resolveCombatTurn(this.state.player, this.currentMonster, actionType);

    // --- ENCAPSULATED EVENT LOGGERS ---
    const logPlayerAction = () => {
      if (result.strike1 || result.strike2) {
        const pStats = this.state.player.derivedStats;
        let hasMain = false, hasOff = false;
        
        if (actionType === 'cast') { 
            hasMain = pStats.SC_1 > 0; 
            hasOff = pStats.SC_2 > 0; 
        } else if (actionType === 'spellstrike') { 
            hasMain = (pStats.WC_1 > 0 || pStats.SC_1 > 0); 
            hasOff = (pStats.WC_2 > 0 || pStats.SC_2 > 0); 
        } else { 
            hasMain = pStats.WC_1 > 0; 
            hasOff = pStats.WC_2 > 0; 
        }

        let totalDmgDelay = 0;

        const logStrikeChain = (strikeArray, handName, isActive) => {
            if (!isActive || !strikeArray) return;
            strikeArray.forEach((strike) => {
                if (strike.hit) {
                    let logClass = "log-player";
                    let visualTag = "";
                    
                    if (strike.type === 'double') {
                        logClass = "text-cyan-300 font-bold";
                        visualTag = " <span class='text-cyan-400 font-bold'>DOUBLE!</span>";
                    } else if (strike.type === 'triple') {
                        logClass = "text-fuchsia-400 font-bold tracking-wider";
                        visualTag = " <span class='text-fuchsia-500 font-bold uppercase'>TRIPLE!</span>";
                    }

                    let msg = `${handName} hits for <span class="${logClass}">${Math.floor(strike.dmg)}</span>.`;
                    if (strike.crit) msg += ` <span class="text-yellow-400 font-bold">CRIT!</span>`;
                    msg += visualTag;
                    
                    this.logToGame(msg);

                    if (this.UIManager) {
                        setTimeout(() => {
                            const monsterEl = document.querySelector('#combat-info-panel');
                            const floatType = strike.crit ? 'crit' : 'damage'; 
                            this.UIManager.showFloatingText(Math.floor(strike.dmg), floatType, monsterEl);
                            
                            if (strike.type === 'double') this.UIManager.showFloatingText("DOUBLE", 'shadow', monsterEl);
                            if (strike.type === 'triple') this.UIManager.showFloatingText("TRIPLE", 'gem', monsterEl);
                        }, totalDmgDelay);
                        
                        totalDmgDelay += 150; 
                    }
                } else {
                    this.logToGame(`${handName} <span class="text-gray-500">MISSED</span> ${this.currentMonster.name}.`);
                }
            });
        };

        logStrikeChain(result.strike1, "1st Strike", hasMain);
        logStrikeChain(result.strike2, "2nd Strike", hasOff);
      }

      if (result.hpRegained > 0) {
          this.logToGame(`<span class="text-green-400 font-bold">+${Math.floor(result.hpRegained)} HP</span> <span class="text-gray-500 text-xs">(Regen)</span>`);
          if (this.UIManager) {
              const statPanel = document.querySelector('#combat-info-panel');
              setTimeout(() => this.UIManager.showFloatingText(`+${Math.floor(result.hpRegained)}`, 'heal', statPanel), 300);
          }
      }
    };

    const logMonsterAction = () => {
      if (result.damageTaken) {
        this.logToGame(`${this.currentMonster.name} hits you for <span class="log-enemy">${Math.floor(result.damageTaken)}</span>.`);
      }
    };

    // --- DYNAMIC SEQUENCE EXECUTION ---
    if (result.firstAttacker === 'monster') {
        logMonsterAction();
        // Prevent player from visibly attacking if the monster's first strike was fatal
        if (result.status !== 'DEFEAT') logPlayerAction();
    } else {
        logPlayerAction();
        // Prevent monster from visibly attacking if the player's first strike was fatal
        if (result.status !== 'VICTORY') logMonsterAction();
    }

    // --- ENDGAME STATES ---
    if (result.status === 'VICTORY') {
      this.logToGame(`<span class="log-enemy text-red-500 font-bold">${this.currentMonster.name} slain.</span>`);
      
      const lootMessages = this.Systems.generateLoot(
        this.state.player,
        this.currentMonster,
        this.state.game.currentZoneId
      );

      if (this.UIManager) {
          const xp = Math.floor(this.currentMonster.xp);
          const gold = Math.floor(this.currentMonster.gold);
          setTimeout(() => this.UIManager.showFloatingText(`+${xp} XP`, 'xp'), 200);
          setTimeout(() => this.UIManager.showFloatingText(`+${gold} Gold`, 'gold'), 600);

          lootMessages.forEach((msg, index) => {
              const delay = 1000 + (index * 400);
              if (msg.includes('Shadow Found')) setTimeout(() => this.UIManager.showFloatingText('🟣 SHADOW DROP!', 'shadow'), delay);
              else if (msg.includes('Echo of')) setTimeout(() => this.UIManager.showFloatingText('🌑 ECHO MANIFESTED!', 'shadow'), delay);
              else if (msg.includes('Loot:') || msg.includes('Gem')) setTimeout(() => this.UIManager.showFloatingText('💎 GEM FOUND!', 'gem'), delay);
              else if (msg.includes('Quest') || msg.includes('Artifact')) setTimeout(() => this.UIManager.showFloatingText('📜 QUEST ITEM!', 'quest'), delay);
          });
      }

      lootMessages.forEach(msg => this.logToGame(msg));
      
      const p = this.state.player;
      if (p.attributePoints > 0) {
          this.renderLevelUpOptions(p.attributePoints);
      }
      
      this.endCombat();
      return; 
    }

    if (result.status === 'DEFEAT') {
      this.logToGame(`<span class="log-enemy text-red-600 font-bold">You have been defeated!</span>`);
      this.endCombat();
      if (this.SanctuaryManager) {
        this.SanctuaryManager.handlePlayerDefeat();
      }
      return;
    }

    // Ensure the character sheet updates with the live hit chance from this turn
    if (this.ProfileManager && this.ProfileManager.updateAllProfileUI) {
        this.ProfileManager.updateAllProfileUI();
    }
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
    const actionsContainer = document.getElementById('combat-actions-container');

    if (fightBtn) {
        fightBtn.style.display = 'block';
        fightBtn.disabled = !this.currentMonster; 
    }

    if (actionsContainer) {
        if (this.state.game.combatActive) {
            actionsContainer.classList.remove('hidden');
            this.renderCombatControls();
        } else {
            actionsContainer.classList.add('hidden');
        }
    }
  }

  renderLevelUpOptions(points) {
    const stats = ['DEX', 'STR', 'NTL', 'WIS', 'VIT'];
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