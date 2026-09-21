// --- src/managers/player/StatsManager.js ---

// 1. Corrected path: Step out of 'managers' and 'player' to find config
import { gddConstants } from '../../config/gdd.js';

export class StatsManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.ProfileManager = deps.ProfileManager;
    this.isInitialized = false;

    this.statMetadata = {
        STR: { name: 'Strength', icon: '💪', description: 'A gatekeeper stat for physical weapons.' },
        DEX: { name: 'Dexterity', icon: '🏹', description: 'Primary stat for Fighters & Martial Hybrids. Governs Hit/Crit Chance, WC scaling, and Turn Initiative.' },
        VIT: { name: 'Vitality', icon: '❤️', description: 'Primary survivability stat. Governs Max HP and AC scaling.' },
        NTL: { name: 'Intellect', icon: '🧠', description: 'A gatekeeper stat for spells.' },
        WIS: { name: 'Wisdom', icon: '🔮', description: 'Primary stat for Casters & Mystic Hybrids. Governs Hit/Crit Chance, SC scaling, and Turn Initiative.' },
        WC_1: { name: 'Weapon Class (Main)', icon: '⚔️', description: 'Effectiveness of your primary physical weapon.' },
        WC_2: { name: 'Weapon Class (Off)', icon: '🗡️', description: 'Effectiveness of your secondary physical weapon.' },
        SC_1: { name: 'Spell Class (Main)', icon: '✨', description: 'Effectiveness of your primary magic spell.' },
        SC_2: { name: 'Spell Class (Off)', icon: '🪄', description: 'Effectiveness of your secondary magic spell.' },
        finalAC: { name: 'Armor Class', icon: '🛡️', description: 'Your total damage reduction.' },
        maxHp: { name: 'Health Points', icon: '❤️', description: 'Your life force. If it reaches zero, you are defeated.' },
        hitChance: { name: 'Hit Chance', icon: '🎯', description: 'Calculated hit probability against your most recently targeted or engaged monster.' },
        critChance: { name: 'Crit Chance', icon: '💥', description: 'The probability of an attack dealing bonus critical damage.' },
        critDamage: { name: 'Crit Damage', icon: '⚔️', description: 'Damage multiplier applied when landing a critical strike.' },
        doubleHitChance: { name: 'Double Hit', icon: '⚡', description: 'Chance to trigger a secondary rapid strike upon landing a hit.' },
        tripleHitChance: { name: 'Triple Hit', icon: '🌪️', description: 'Chance to trigger a tertiary rapid strike following a successful Double Hit.' }
      };
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.render();
    this.addEventListeners();
  }

  render() {
    const statsContainer = this.ui.tabContentStats;
    if (!statsContainer || !this.state.player) return;

    const p = this.state.player;
    const canUpgrade = p.attributePoints >= gddConstants.AP_PER_LEVEL;

    const createStatLine = (attrKey, value, isUpgradable = false) => {
      const meta = this.statMetadata[attrKey] || { name: attrKey, icon: '?', description: 'No info available.' };
      const upgradeButton = isUpgradable ? `<button class="attr-btn" data-attr="${attrKey}" ${!canUpgrade ? 'disabled' : ''}>+</button>` : '';
      const infoButton = `<button class="info-btn" data-title="${meta.name}" data-description="${meta.description}">i</button>`;
      
      return `
        <div class="stat-line">
          <span class="stat-icon">${meta.icon}</span>
          <span class="stat-name text-glow-subtle">${meta.name}</span>
          <span class="stat-value text-glow-subtle" data-stat-value="${attrKey}">${value}</span>
          ${upgradeButton}
          ${infoButton}
        </div>`;
    };

    const createHpLine = () => {
      const meta = this.statMetadata.maxHp;
      const hpPercent = (p.hp / p.derivedStats.maxHp) * 100;
      
      return `
        <div class="stat-line">
          <span class="stat-icon">${meta.icon}</span>
          <span class="stat-name text-glow-subtle">${meta.name}</span>
          <div class="flex-grow flex items-center gap-2">
            <div class="progress-bar-track h-3 flex-grow">
              <div class="progress-bar-fill h-full" style="width: ${hpPercent}%; background-color: var(--hp-color);"></div>
            </div>
            <span class="stat-value text-glow-subtle">${Math.ceil(p.hp)} / ${Math.ceil(p.derivedStats.maxHp)}</span>
          </div>
          <button class="info-btn" data-title="${meta.name}" data-description="${meta.description}">i</button>
        </div>`;
    };

    statsContainer.innerHTML = `
      <div id="stats-container" class="space-y-3">
        <div class="stat-accordion-item open">
          <button class="stat-accordion-header">
            <h3 class="text-glow-subtle font-orbitron">Secondary Attributes</h3>
            <svg class="accordion-arrow w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div class="stat-accordion-content">
            ${createStatLine('STR', `${Math.round(p.derivedStats?.STR || p.baseStats.STR)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.round(p.baseStats.STR)})</span>`, true)}
            ${createStatLine('DEX', `${Math.round(p.derivedStats?.DEX || p.baseStats.DEX)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.round(p.baseStats.DEX)})</span>`, true)}
            ${createStatLine('VIT', `${Math.round(p.derivedStats?.VIT || p.baseStats.VIT)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.round(p.baseStats.VIT)})</span>`, true)}
            ${createStatLine('NTL', `${Math.round(p.derivedStats?.NTL || p.baseStats.NTL)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.round(p.baseStats.NTL)})</span>`, true)}
            ${createStatLine('WIS', `${Math.round(p.derivedStats?.WIS || p.baseStats.WIS)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.round(p.baseStats.WIS)})</span>`, true)}
            <div class="stat-line mt-2">
              <span class="stat-icon">💎</span>
              <span class="stat-name text-glow-subtle">Unspent Points</span>
              <span id="unspent-points-value" class="stat-value text-glow-label">${p.attributePoints || 0}</span>
            </div>
          </div>
        </div>
        <div class="stat-accordion-item">
          <button class="stat-accordion-header">
            <h3 class="text-glow-subtle font-orbitron">Primary Combat Stats</h3>
            <svg class="accordion-arrow w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div class="stat-accordion-content">
            ${createStatLine('WC_1', `${(p.derivedStats.WC_1 || 0).toFixed(2)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.floor(p.derivedStats.rawGearWC_1 || 0)})</span>`)}
            ${createStatLine('WC_2', `${(p.derivedStats.WC_2 || 0).toFixed(2)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.floor(p.derivedStats.rawGearWC_2 || 0)})</span>`)}
            ${createStatLine('SC_1', `${(p.derivedStats.SC_1 || 0).toFixed(2)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.floor(p.derivedStats.rawGearSC_1 || 0)})</span>`)}
            ${createStatLine('SC_2', `${(p.derivedStats.SC_2 || 0).toFixed(2)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.floor(p.derivedStats.rawGearSC_2 || 0)})</span>`)}
            ${createStatLine('finalAC', `${(p.derivedStats.AC || 0).toFixed(2)} <span class="text-cyan-400 text-[10px] font-mono ml-1">(${Math.floor(p.derivedStats.rawGearAC || 0)})</span>`)}
          </div>
        </div>
        <div class="stat-accordion-item">
          <button class="stat-accordion-header">
            <h3 class="text-glow-subtle font-orbitron">Derived Stats</h3>
            <svg class="accordion-arrow w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div class="stat-accordion-content">
            ${createHpLine()}
            ${createStatLine('hitChance', `${(p.derivedStats.lastHitChance || 0).toFixed(2)}%`)}
            ${createStatLine('critChance', `${(p.derivedStats.critChance || 0).toFixed(2)}%`)}
            ${createStatLine('critDamage', `${((p.derivedStats.critDamage || 2.0) * 100).toFixed(0)}%`)}
            ${createStatLine('doubleHitChance', `${(p.derivedStats.doubleHitChance || 0).toFixed(2)}%`)}
            ${createStatLine('tripleHitChance', `${(p.derivedStats.tripleHitChance || 0).toFixed(2)}%`)}
          </div>
        </div>
      </div>`;
  }

  addEventListeners() {
    const statsContainer = this.ui.tabContentStats;
    if (!statsContainer) return;

    statsContainer.addEventListener('click', (e) => {
      const header = e.target.closest('.stat-accordion-header');
      const attrBtn = e.target.closest('.attr-btn');
      const infoBtn = e.target.closest('.info-btn');

      if (header) {
        header.parentElement.classList.toggle('open');
      } else if (attrBtn && this.ProfileManager) {
        // [ARCHITECT FIX] Calls the correct banking function
        this.ProfileManager.allocateAllPoints(attrBtn.dataset.attr);
      } else if (infoBtn) {
        this.showStatInfo(infoBtn.dataset.title, infoBtn.dataset.description);
      }
    });

    const backdrop = document.getElementById('stat-info-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => this.hideStatInfo());
    }
  }

  showStatInfo(title, description) {
    const modal = document.getElementById('stat-info-modal');
    if (!modal) return;
    modal.querySelector('#stat-info-title').textContent = title;
    modal.querySelector('#stat-info-description').textContent = description;
    modal.style.display = 'flex';
  }

  hideStatInfo() {
    const modal = document.getElementById('stat-info-modal');
    if (modal) modal.style.display = 'none';
  }
}