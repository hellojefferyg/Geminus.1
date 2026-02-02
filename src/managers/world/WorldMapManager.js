/**
 * @file src/managers/world/WorldMapManager.js
 * @description Master control for the Mini-Map interface and world-level navigation.
 */
export class WorldMapManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.MapRenderer = deps.MapRenderer;
    this.MapDataStore = deps.MapDataStore;
    this.isInitialized = false;
    this.mapRenderer = null;
  }

  /**
   * Initializes the Mini-Map renderer using the dedicated canvas from the UI.
   */
  init() {
    if (this.isInitialized || !this.ui.miniMapCanvas) return;

    // Initialize MapRenderer specifically for Mini-Map usage (isMiniMap = true)
    this.mapRenderer = new this.MapRenderer(this.ui.miniMapCanvas, true);
    this.isInitialized = true;
    
    console.log("🗺️ World: WorldMapManager (Mini-Map) resonance established.");
    
    this.mapRenderer.resize();
    this.draw();
  }

  /**
   * Triggers a re-draw of the Mini-Map based on player movement or zone changes.
   */
  draw() {
    if (!this.isInitialized || !this.state.player || !this.mapRenderer) return;
    
    // Safety check: Ensure the DataStore has map data before drawing
    if (!this.MapDataStore.data) {
        console.warn("⚠️ WorldMapManager: Attempted to draw mini-map with no zone data.");
        return;
    }

    // Draw using data from MapDataStore and current player position
    this.mapRenderer.draw(
      this.MapDataStore.data, 
      this.state.player.pos, 
      this.MapDataStore
    );
  }
}