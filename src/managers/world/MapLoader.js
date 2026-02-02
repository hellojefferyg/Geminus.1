/**
 * @file src/managers/world/MapLoader.js
 * @description Handles the ingestion of map JSON files per Section 2.2 of the GDD.
 */
export class MapLoader {
  constructor(deps) {
    this.MapDataStore = deps.MapDataStore;
    this.ZoneManager = deps.ZoneManager;
    this.showToast = deps.showToast;
  }

  /**
   * Processes the JSON map file selected via the Settings tab.
   * @param {File} file - The JSON file object.
   */
  loadMapFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const mapData = JSON.parse(e.target.result);
        
        // Validation per Section 6.1 Data Schemas: Ensure required map properties exist.
        if (!mapData.layers) {
          throw new Error("Invalid map file format: Missing 'layers' property. Ensure this is a valid MapEditor export.");
        }
        
        // assetLibrary is optional (some zones might not have custom assets)
        if (!mapData.assetLibrary) {
          console.warn("⚠️ MapLoader: No assetLibrary found. Zone will use default assets.");
          mapData.assetLibrary = {}; // Provide empty asset library as fallback
        }

        // Support both zid (MapEditor) and zoneId/id (legacy) formats
        const zoneId = mapData.zid || mapData.zoneId || mapData.id || 'UNKNOWN';
        const zoneName = mapData.zoneName || mapData.name || 'New Zone';
        console.log(`📂 World: Importing resonance for ${zoneName} (${zoneId})`);

        // Pass data to the Store to trigger asset pre-caching.
        if (this.MapDataStore) {
          await this.MapDataStore.load(mapData);
        }

        // Initialize the zone within the manager once data is stabilized.
        if (this.ZoneManager && this.MapDataStore?.data) {
          await this.ZoneManager.loadZone(this.MapDataStore.data);
          this.showToast("Map resonance established.", false);
        }
      } catch (error) {
        console.error("❌ World Loader Error:", error);
        this.showToast(`Failed to load map: ${error.message}`, true);
      }
    };

    reader.readAsText(file);
  }
}