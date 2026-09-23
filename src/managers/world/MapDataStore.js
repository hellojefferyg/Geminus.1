/**
 * @file src/managers/world/MapDataStore.js
 * @description Foundation for zone data management and asset pre-caching.
 */
export class MapDataStore {
  constructor() {
    this.data = null;
    this.assetImages = {};
    this.backgroundImage = null;
    this.isLoaded = false;
    this.loadedChunks = new Set(); // [NEW] Track fetched chunks
  }

  /**
   * Loads zone JSON and pre-caches all referenced asset images.
   * @param {Object} zoneData - The raw JSON data for the zone.
   */
  /**
   * Loads zone JSON and pre-caches all referenced asset images.
   * Includes Magi-Tech GitHub URL sanitization for background and assets.
   */
  async load(zoneData) {
    this.isLoaded = false;
    
    // Support both 'zoneName' (GDD) and 'name' (Editor) formats
    const resolvedName = zoneData?.zoneName || zoneData?.name;
    if (!zoneData || !resolvedName) {
        console.error("🌑 MapDataStore: Invalid zone data provided.");
        return;
    }

    console.log(`🌐 World: Loading map structure for ${resolvedName}`);
    this.data = zoneData;
    
    // [CRITICAL FIX] Clear chunk cache on zone transition so new chunks can download
    this.loadedChunks.clear();

    // [CRITICAL FIX] Ensure layers array exists so the Renderer and ZoneManager don't crash before chunks arrive
    if (!this.data.layers) {
        this.data.layers = [];
    }

    const assetPromises = [];
    
    // 1. Pre-load background image with GitHub Sanitization
    const bgUrl = zoneData.backgroundImageData || zoneData.imageBackgroundUrl || zoneData.backgroundImage;
    if (bgUrl) {
      assetPromises.push(new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        // MAGI-TECH URL SYNC: Apply comprehensive GitHub sanitization to the background image
        let src = bgUrl;
        if (src.includes('github.com') && !src.includes('raw.githubusercontent.com')) {
          src = src.replace('github.com', 'raw.githubusercontent.com')
                   .replace('/blob/', '/')
                   .replace('/refs/heads/', '/');
        } else if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
          src = '/' + src;
        }

        img.onload = () => {
          this.backgroundImage = img;
          console.log("✅ Background image loaded");
          resolve();
        };
        img.onerror = () => {
          console.warn("⚠️ Failed to load background image:", src);
          resolve();
        };
        img.src = src;
      }));
    }
    
    // 2. Pre-cache asset images with GitHub Sanitization
    if (this.data.assetLibrary) {
      for (const assetId in this.data.assetLibrary) {
        const asset = this.data.assetLibrary[assetId];
        if (asset.imageUrl && !this.assetImages[asset.imageUrl]) {
          assetPromises.push(new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            // MAGI-TECH URL SYNC: Match Editor's GitHub sanitization to prevent 404/CORS errors
            let src = asset.imageUrl;
            if (src.includes('github.com') && !src.includes('raw.githubusercontent.com')) {
              src = src.replace('github.com', 'raw.githubusercontent.com')
                       .replace('/blob/', '/')
                       .replace('/refs/heads/', '/');
            } else if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
              src = '/' + src; // Handle relative paths
            }

            img.onload = () => {
              this.assetImages[asset.imageUrl] = img;
              resolve();
            };
            img.onerror = () => {
              console.warn(`⚠️ Asset Error: Failed at ${src}`);
              resolve();
            };
            img.src = src;
          }));
        }
      }
    }

    await Promise.all(assetPromises);
    this.isLoaded = true;
    console.log("✅ World: Map data stabilized and assets cached.");
  }

  /**
   * Get background image if loaded
   */
  getBackgroundImage() {
    return this.backgroundImage;
  }

  /**
   * Retrieves a pre-cached image object by its Asset ID.
   */
  getAssetImage(assetId) {
    const asset = this.data.assetLibrary?.[assetId];
    return asset?.imageUrl ? this.assetImages[asset.imageUrl] : null;
  }

  /**
   * [NEW] Dynamically fetches spatial chunks and merges them into the engine state.
   */
  async fetchSpatialChunk(zoneId, chunkX, chunkY) {
    const chunkId = `${chunkX}_${chunkY}`;
    if (this.loadedChunks.has(chunkId)) return false; 

    try {
      const response = await fetch(`./data/zones/${zoneId}_chunk_${chunkId}.json`);
      if (!response.ok) {
        this.loadedChunks.add(chunkId); // Mark as checked even if it's an empty void
        return false;
      }

      const chunkData = await response.json();

      // Ensure master layers is an array
      if (!Array.isArray(this.data.layers)) {
        this.data.layers = Object.values(this.data.layers || {});
      }

      // Merge localized layer data into the master engine state
      const chunkLayers = Array.isArray(chunkData.layers) ? chunkData.layers : Object.values(chunkData.layers || {});
      
      chunkLayers.forEach(chunkLayer => {
        const layerId = chunkLayer.id || chunkLayer.name;
        let masterLayer = this.data.layers.find(l => l && (l.id || l.name) === layerId);

        if (!masterLayer) {
          masterLayer = { ...chunkLayer, grid: {} };
          this.data.layers.push(masterLayer);
        }
        if (!masterLayer.grid) masterLayer.grid = {};

        // Merge the numeric chunk objects into the master 2D array
        Object.entries(chunkLayer.grid).forEach(([yStr, row]) => {
          const y = parseInt(yStr, 10);
          if (!masterLayer.grid[y]) masterLayer.grid[y] = [];

          Object.entries(row).forEach(([xStr, tile]) => {
            const x = parseInt(xStr, 10);
            masterLayer.grid[y][x] = tile;
          });
        });
      });

      this.loadedChunks.add(chunkId);
      return true; // Return true to trigger a canvas redraw
    } catch (err) {
      console.warn(`⚠️ Skipped missing chunk ${chunkId}`);
      this.loadedChunks.add(chunkId);
      return false;
    }
  }
}