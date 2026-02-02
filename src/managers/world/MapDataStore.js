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
}