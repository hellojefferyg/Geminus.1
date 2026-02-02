/**
 * @file src/managers/ui/UIManager.js
 * UIManager: Orchestrates the HUD, player status visuals, and UI animations.
 * Bridges to the Racial Aptitude and World God Tools for dynamic labeling.
 */
import { races as staticRaces } from '../../config/gdd.js'; // Path adjusted for src/managers/ui/

export class UIManager {
    constructor(deps) {
        this.state = deps.state;
        this.ui = deps.ui;
        
        // Phase 2 references (Initialized as null, populated via setManagers)
        this.GameManager = null;
        this.DataManager = null;
    }

    /**
     * Required for the Handshake in main.js
     * Connects references needed to refresh the HUD and menus
     */
    setManagers(managers) {
        this.GameManager = managers.GameManager;
        this.DataManager = managers.DataManager;
    }

    /**
     * Updates the main game HUD with current player and zone data
     */
    updatePlayerStatusUI() {
        if (!this.state.player) return;

        const p = this.state.player;
        
        // Bridge: Prioritize Studio race definitions
        const GDD = window.GDD || {};
        const races = GDD.races || staticRaces;
        const raceData = races[p.race];

        // Format Archetype and Specialization (CCI) abbreviations
        const archetypeAbbr = {
            'True Fighter': 'FTR',
            'True Caster': 'CST',
            'Hybrid': 'HYB'
        }[p.archetype] || 'N/A';

        // --- Robust A-Spec Formatting: Handles empty Studio data ---
        const cciRaw = (p.cci && p.cci !== 'undefined') ? p.cci : 'Initiate/Initiate';
        const cciParts = cciRaw.split('/');
        const specialization = cciParts[0];
        const aspecValue = `${archetypeAbbr}-${specialization}`;

        // HUD Element Updates
        if (this.ui.playerNameLevelValue) {
            this.ui.playerNameLevelValue.textContent = `${p.name} [Rank ${p.level}]`;
        }

        if (this.ui.playerRaceValue) {
            this.ui.playerRaceValue.textContent = raceData ? raceData.raceName : p.race;
        }

        if (this.ui.playerAspecValue) {
            this.ui.playerAspecValue.textContent = aspecValue;
        }

        if (this.ui.zoneNameValue) {
            this.ui.zoneNameValue.textContent = this.state.zone.name;
        }

        if (this.ui.playerCoordsValue) {
            this.ui.playerCoordsValue.textContent = `HEX: ${p.pos.x}, ${p.pos.y}`;
        }
        
        console.log("🎨 HUD: Character Materialization Complete.");
    }

    /**
     * Triggers a visual flash on stat values when they are updated
     * @param {string} attr - The attribute key (e.g., 'STR', 'VIT')
     */
    flashStatUpdate(attr) {
        const statValueEl = document.querySelector(`[data-stat-value="${attr}"]`);
        const unspentPointsEl = document.getElementById('unspent-points-value');

        if (statValueEl) {
            statValueEl.classList.add('flash-update');
            setTimeout(() => statValueEl.classList.remove('flash-update'), 500);
        }

        if (unspentPointsEl) {
            unspentPointsEl.classList.add('flash-update');
            setTimeout(() => unspentPointsEl.classList.remove('flash-update'), 500);
        }
    }
    /**
   * Spawns floating text at a specific screen position.
   * [UPDATED] Forces high-contrast visibility and proper layering.
   */
  showFloatingText(text, type, targetElement = null) {
    // 1. Ensure the Layer Exists (Fixes the "Behind UI" issue)
    let layer = document.getElementById('floating-text-layer');
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'floating-text-layer';
        document.body.appendChild(layer);
    }

    const el = document.createElement('div');
    el.className = `floating-text float-${type}`;
    el.innerHTML = text;
    
    // 2. Position Logic
    let x, y;
    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        // Add random jitter
        const offset = (Math.random() * 60) - 30;
        x = rect.left + (rect.width / 2) + offset; 
        
        // [FIX] Spawn slightly higher so it doesn't overlap the "Next:" text
        y = rect.top - 20; 
    } else {
        // Default to center screen
        x = window.innerWidth / 2 + ((Math.random() * 60) - 30);
        y = window.innerHeight / 2 - 100;
    }

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    layer.appendChild(el);

    // Cleanup
    setTimeout(() => {
        el.remove();
    }, 1500);
  }
}