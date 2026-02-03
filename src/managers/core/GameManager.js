// src/managers/core/GameManager.js
import { MODULE_FILE_MAP } from '../../config/ModuleMap.js';
export class GameManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.embeddedZoneData = deps.embeddedZoneData;
    this.showToast = deps.showToast;
    this.Systems = deps.Systems;

    // Infrastructure for the "Magi-Tech" connection
    this.ProfileManager = null;
    this.VaultManager = null; // [NEW] Step 17
    this.WorldMapManager = null;
    this.ZoneManager = null;
    this.LayoutManager = null;
    this.ChatManager = null;
    this.CombatManager = null;
    this.StatsManager = null;
    this.InventoryManager = null;
    this.EquipmentManager = null;
    this.SettingsManager = null;
    this.MapDataStore = null;

    this.isInitialized = false;
  }

  /**
   * Bridges all manager instances after they are created in main.js
   * @param {Object} managers - Map of all manager instances
   */
  setManagers(managers) {
    Object.assign(this, managers);
  }

  async init() {
    const wasInitialized = this.isInitialized;
    if (!this.isInitialized) {
      this.isInitialized = true;
    }

    // 1. Reveal the HUD screen now that the engine is ready
    if (this.ui.gameHudScreen) {
        this.ui.gameHudScreen.style.display = 'block';
    }

    // --- CRITICAL: SYNC PLAYER DATA BEFORE FETCHING WORLD ---
    // This forces the engine to wait for the Firebase/Local data to resonate.
    if (!this.state.player && this.DataManager) {
        console.log("⏳ GameManager: Waiting for Player Echo...");
        await this.DataManager.loadPlayer(); 
    }

    // 2. Initial player calculation per Section 1.3
    if (this.state.player) {
        this.Systems.calculateDerivedStats(this.state.player);
    }

    // 3. Trigger initial UI refreshes & Resonance
    if (this.ProfileManager) this.ProfileManager.updateAllProfileUI();
    if (this.UIManager) this.UIManager.updatePlayerStatusUI();

    // 4. Initialize world and navigation systems
    if (this.WorldMapManager) this.WorldMapManager.init();
    if (this.ZoneManager) this.ZoneManager.init();
    
    this.setupEventListeners();

    // 5. AUTOMATIC ZONE LOADING (Materialization Fix) - Same as MapEditor
    // Load zone if player exists and we don't have zone data yet
    if (this.state.player && this.MapDataStore) {
      if (!this.MapDataStore.data) {
        await this.loadInitialZone();
      } else {
        console.log("✅ Zone already loaded:", this.MapDataStore.data.zoneName || this.MapDataStore.data.name);
      }
    } else if (!wasInitialized && !this.state.player) {
      // First init, but no player yet - zone will load after character creation
      console.log("⏳ GameManager: Waiting for player creation before loading zone...");
    }

    // 6. Finalize auxiliary systems (Layout & Social)
    if (this.LayoutManager) this.LayoutManager.init();
    if (this.ChatManager) this.ChatManager.init();
    
    console.log("🚀 Geminus Engine: Systems fully resonated. Player:", this.state.player?.name);
  }

  /**
   * Loads the initial zone - same mechanism as MapEditor
   * Fetches manifest, then loads the first zone (or player's current zone)
   */
  async loadInitialZone() {
    try {
      // Try to load from manifest first (like MapEditor does)
      console.log("📂 GameManager: Fetching manifest from ./data/zones/manifest.json");
      const manifestRes = await fetch('./data/zones/manifest.json');
      
      let targetZid = this.state.player?.currentZoneId || 'Z01';
      
      if (manifestRes.ok) {
        const zoneIds = await manifestRes.json();
        console.log("📝 GameManager: Found zones in manifest:", zoneIds.length);
        
        // Use first zone from manifest if player doesn't have a current zone
        if (!this.state.player?.currentZoneId && zoneIds.length > 0) {
          // Skip ZMW00 (world map) and Z00, use first actual zone
          const firstZone = zoneIds.find(zid => zid !== 'ZMW00' && zid !== 'Z00') || zoneIds[0];
          targetZid = firstZone;
        }
      }
      
      console.log(`🗺️ GameManager: Materializing world from /data/zones/${targetZid}.json`);
      
      // Fetch the zone JSON
      const response = await fetch(`./data/zones/${targetZid}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - Zone file not found: ${targetZid}.json`);
      }
      
      const zoneData = await response.json();
      
      // Feed the data into the store and trigger the ZoneManager render
      await this.MapDataStore.load(zoneData);
      
      // Populate global state so UIManager can see the zone name
      // Support zid (MapEditor format), zoneId (GDD format), and id (legacy format)
      this.state.zone = {
          id: zoneData.zid || zoneData.zoneId || zoneData.id || targetZid,
          name: zoneData.zoneName || zoneData.name || "Unknown Zone"
      };

          if (this.ZoneManager) {
              await this.ZoneManager.loadZone(this.MapDataStore.data);
          }

      // Successfully materialized. Transition to Equipment view.
      this.switchTab('equipment');
      
      // Final UI resonance to clear "No Zone Loaded"
      if (this.UIManager) {
          this.UIManager.updatePlayerStatusUI();
      }
      
      console.log(`✅ Zone loaded: ${this.state.zone.name} (${this.state.zone.id})`);
    } catch (err) {
        console.error("❌ GameManager: Zone materialization failed.", err);
        console.error("   Error details:", err.message);
        this.switchTab('settings');
        if (this.showToast) {
            this.showToast(`World load failed: ${err.message}. Check console for details.`, true);
        }
    }
  }

  setupEventListeners() {
    // Tab Switching Logic
    if (this.ui.mainTabsContainer) {
        this.ui.mainTabsContainer.addEventListener('click', (e) => {
            if (this.state.ui.isLayoutEditMode || !e.target.classList.contains('main-tab-button')) return;
            this.switchTab(e.target.dataset.tab);
        });
    }

    // Focus Mode (Hides UI for immersion)
    if (this.ui.focusModeBtn) {
        this.ui.focusModeBtn.addEventListener('click', () => {
            this.state.ui.isFocused = !this.state.ui.isFocused;
            if (this.ui.mainContent) {
                this.ui.mainContent.classList.toggle('focused', this.state.ui.isFocused);
            }
        });
    }

    // Toggle Mobile/Footer Controls
    if (this.ui.toggleControlsBtn) {
        this.ui.toggleControlsBtn.addEventListener('click', () => {
            if (this.ui.footerSection) {
                this.ui.footerSection.classList.toggle('controls-hidden');
            }
        });
    }

    // Layout Editor Trigger
    if (this.ui.layoutEditBtn) {
        this.ui.layoutEditBtn.addEventListener('click', () => {
            if (this.LayoutManager) this.LayoutManager.toggleEditMode();
        });
    }

    // Map Overlays
    if (this.ui.miniMapPanel) {
        this.ui.miniMapPanel.addEventListener('click', async () => {
            if (this.ui.fullScreenMapOverlay) {
                this.ui.fullScreenMapOverlay.classList.remove('hidden');
                if (this.ZoneManager) {
                    this.ZoneManager.resizeCanvas();
                    // MAGI-TECH SYNC: Wait for resonance before opening full map
                    if (this.MapDataStore && this.MapDataStore.data) {
                        await this.ZoneManager.loadZone(this.MapDataStore.data);
                    } else {
                        console.log("⚠️ No zone loaded. Please import a map via Settings tab.");
                    }
                }
            }
        });
    }

    if (this.ui.mapCloseBtn) {
        this.ui.mapCloseBtn.addEventListener('click', () => {
            if (this.ui.fullScreenMapOverlay) {
                this.ui.fullScreenMapOverlay.classList.add('hidden');
            }
        });
    }
  // --- DEV TOOLS: ZONE SWITCHER ---
    const devBtn = document.getElementById('dev-zone-btn');
    const devSelect = document.getElementById('dev-zone-select');

    if (devBtn && devSelect) {
        // Toggle Dropdown
        devBtn.addEventListener('click', async () => {
            const isHidden = devSelect.classList.contains('hidden');
            if (isHidden) {
                devSelect.classList.remove('hidden');
                // Load manifest if empty
                if (devSelect.options.length <= 1) {
                    try {
                        const res = await fetch('./data/zones/manifest.json');
                        const zones = await res.json();
                        devSelect.innerHTML = '<option value="">Select Zone...</option>';
                        zones.forEach(id => {
                            const opt = document.createElement('option');
                            opt.value = id;
                            opt.textContent = id;
                            devSelect.appendChild(opt);
                        });
                    } catch (e) {
                        console.error("Dev Tools: Manifest load failed", e);
                        devSelect.innerHTML = '<option>Error loading manifest</option>';
                    }
                }
            } else {
                devSelect.classList.add('hidden');
            }
        });

        // Handle Warp
        devSelect.addEventListener('change', (e) => {
            const targetId = e.target.value;
            if (targetId && this.ZoneManager) {
                if (window.confirm(`⚡ DEV WARP: Travel to ${targetId}?`)) {
                    // Warp to center (safe default)
                    this.ZoneManager.handleZoneTransition(targetId, 10, 10);
                    devSelect.classList.add('hidden');
                    devSelect.value = "";
                }
            }
        });
    }
    
  }

  switchTab(tabName) {
    // Deactivate all panels and buttons
    document.querySelectorAll('#main-tabs-container .main-tab-button, #main-tab-content .main-tab-panel').forEach(el => {
      el.classList.remove('active');
    });

    // Activate the target tab
    const tabButton = document.querySelector(`.main-tab-button[data-tab="${tabName}"]`);
    const tabPanel = document.getElementById(`tab-content-${tabName}`);

    if (tabButton) tabButton.classList.add('active');
    if (tabPanel) tabPanel.classList.add('active');

    // Lazy-load managers only when their tab is first opened
    const managers = {
      combat: this.CombatManager,
      stats: this.StatsManager,
      inventory: this.InventoryManager,
      equipment: this.EquipmentManager,
      settings: this.SettingsManager
    };

    if (managers[tabName] && !managers[tabName].isInitialized) {
        managers[tabName].init();
      }
    } // <--- This closes switchTab

    /**
     * [NEW] Opens a game module (HTML file) in the overlay iframe.
     * Includes Active Handshake to force-load data.
     * @param {string} moduleId - The ID from the trigger (e.g., 'armory_shop')
     */
    openModule(moduleId) {
        const fileName = MODULE_FILE_MAP[moduleId];
        
        if (!fileName) {
            console.error(`❌ Module Error: No file mapped for ID '${moduleId}'`);
            this.showToast(`Error: Module ${moduleId} not found.`);
            return;
        }
  
        console.log(`📂 Opening Module: ${fileName} (ID: ${moduleId})`);
  
        // 1. Get UI Elements
        let overlay = document.getElementById('module-overlay');
        let iframe = document.getElementById('module-iframe');
        let closeBtn = document.getElementById('module-close-btn');
  
        if (!overlay || !iframe) {
            console.warn("⚠️ UI Error: #module-overlay or #module-iframe not found in DOM.");
            return;
        }
  
        // 2. Load the File
        iframe.src = `./modules/${fileName}`; 
  
        // [CRITICAL FIX] Active Handshake
        // We wait for the file to load, then we manually START the shop from here.
        iframe.onload = () => {
            const childWin = iframe.contentWindow;
            
            // Check if the loaded file has a ShopManager (Armory/Arcanum)
            if (childWin && childWin.ShopManager) {
                console.log(`⚡ GameManager: Injecting Player Data into ${moduleId}...`);
                
                // 1. Create the bridge so the child can talk back (for Buying)
                childWin.gameManager = this; 
                
                // 2. Force Start the Shop with the current Player State
                childWin.ShopManager.init(this.state.player);
            }
        };

        // 3. Show Overlay
        overlay.classList.remove('hidden');
        
        // 4. Handle Close
        closeBtn.onclick = () => {
            overlay.classList.add('hidden');
            iframe.src = ""; // Clear source to stop scripts
            // Return focus to the game canvas
            if (this.ui.zoneCanvas) this.ui.zoneCanvas.focus();
        };
    }

}