/**
 * @file src/managers/ui/SettingsManager.js
 * @description Manages UI themes, local persistence, and map file imports.
 */
export class SettingsManager {
  constructor(deps) {
    this.ui = deps.ui;
    this.updateSmokeParticleColors = deps.updateSmokeParticleColors;
    this.initSmokeParticles = deps.initSmokeParticles;
    this.MapLoader = null; // Set later via GameManager.setManagers
    this.isInitialized = false;
  }

  setMapLoader(mapLoader) {
    this.MapLoader = mapLoader;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.render();
    this.addEventListeners();
    this.updateButtonStates();
    // Load the theme immediately upon manager initialization
    this.loadTheme();
  }

  render() {
    if (!this.ui.tabContentSettings) return;

    this.ui.tabContentSettings.innerHTML = `
      <div class="space-y-4">
        <div class="stat-accordion-item open">
          <button class="stat-accordion-header">
            <h3 class="text-glow-subtle font-orbitron">UI Theme</h3>
            <svg class="accordion-arrow w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div class="stat-accordion-content">
            <p class="text-sm text-gray-400 mb-4">Select a visual theme for the Geminus interface.</p>
            <div class="flex flex-col sm:flex-row gap-4">
              <button class="theme-select-btn glass-button w-full py-3 rounded-md" data-theme="aetherial-shard">Aetherial Shard</button>
              <button class="theme-select-btn glass-button w-full py-3 rounded-md" data-theme="molten-core">Molten Core</button>
            </div>
          </div>
        </div>
        <div class="stat-accordion-item open">
          <button class="stat-accordion-header">
            <h3 class="text-glow-subtle font-orbitron">Map Import</h3>
            <svg class="accordion-arrow w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div class="stat-accordion-content">
            <p class="text-sm text-gray-400 mb-2">Import a zone JSON file from your Map Editor.</p>
            <input type="file" id="map-import-input" accept=".json" class="hidden">
            <button id="import-map-btn" class="glass-button w-full py-2">Import Map</button>
          </div>
        </div>
      </div>`;
  }

  addEventListeners() {
    const settingsTab = this.ui.tabContentSettings;
    if (!settingsTab) return;

    settingsTab.addEventListener('click', e => {
      const themeBtn = e.target.closest('.theme-select-btn');
      if (themeBtn) {
        this.setTheme(themeBtn.dataset.theme);
      }

      const importBtn = e.target.closest('#import-map-btn');
      if (importBtn) {
        const fileInput = document.getElementById('map-import-input');
        if (fileInput) fileInput.click();
      }
    });

    settingsTab.addEventListener('change', e => {
      if (e.target.id === 'map-import-input') {
        if (this.MapLoader && e.target.files[0]) {
          this.MapLoader.loadMapFile(e.target.files[0]);
        }
      }
    });
  }

  setTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('geminusTheme', themeName);
    this.updateButtonStates();
    
    // Synchronize the canvas smoke with the new UI theme
    if (this.updateSmokeParticleColors) {
        this.updateSmokeParticleColors(themeName);
    }
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('geminusTheme') || 'aetherial-shard';
    this.setTheme(savedTheme);
    
    if (this.initSmokeParticles) {
        this.initSmokeParticles(savedTheme);
    }
  }

  updateButtonStates() {
    const currentTheme = localStorage.getItem('geminusTheme') || 'aetherial-shard';
    document.querySelectorAll('.theme-select-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
  }
}