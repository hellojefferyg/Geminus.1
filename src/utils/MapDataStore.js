/**
 * MapDataStore: Ingests Zone JSON and materializes the asset cache.
 * Provides an asynchronous gateway for the ZoneManager and ReceiverBridge.
 */
export class MapDataStore {
    constructor() {
        this.data = null;
        this.assetImages = {}; 
        this.isReady = false;
    }

    /**
     * load: Materializes assets from the provided map JSON.
     * Ensures all images (Background and Library) are decoded before resolving.
     */
    async load(mapData) {
        this.data = mapData;
        this.assetImages = {}; 

        if (mapData.assetLibrary) {
            // RESTORED: This matches your Editor's requirement to gather EVERY URL
            const urls = Object.values(mapData.assetLibrary).map(a => a.imageUrl);
            
            // THE BACKGROUND FIX: Added specific check for imageBackgroundUrl
            const bgUrl = mapData.imageBackgroundUrl || mapData.backgroundImageData;
            if (bgUrl) {
                // We map this specific key to 'ZONE_BACKGROUND' so the Renderer can find it
                this.assetImages['ZONE_BACKGROUND'] = bgUrl; 
                urls.push(bgUrl);
            }

            await Promise.all(urls.map(async (url) => {
                if (url) {
                    const img = new Image();
                    img.src = url;
                    await img.decode().catch(() => console.warn(`🛑 Failed: ${url}`));
                    
                    // Identify if this specific URL is the background we just tagged
                    const storageKey = (url === bgUrl) ? 'ZONE_BACKGROUND' : url;
                    this.assetImages[storageKey] = img;
                }
            }));
            
            this.isReady = true;
        }
    }

    /**
     * _bakeTriggers: Standardizes Trigger layers based on Object asset IDs.
     * Preserves logic for Armory, Portal, and Vault detection.
     */
    _bakeTriggers(mapData) {
        if (!mapData.layers) return;

        // Ensure a trigger layer exists
        let triggers = mapData.layers.find(l => (l.name || l.id || "").toLowerCase() === 'triggers');
        if (!triggers) {
            triggers = { 
                name: 'triggers', 
                type: 'trigger',
                grid: Array.from({ length: mapData.mapSize?.height || 25 }, 
                    () => Array(mapData.mapSize?.width || 25).fill(null)) 
            };
            mapData.layers.push(triggers);
        }

        const objects = mapData.layers.find(l => (l.name || l.id || "").toLowerCase() === 'objects');
        if (objects) {
            objects.grid.forEach((row, y) => {
                if (!row) return;
                row.forEach((tile, x) => {
                    if (tile?.assetId && triggers.grid[y]) {
                        const id = tile.assetId.toLowerCase();
                        // Auto-assign actions based on asset keywords from the Editor
                        if (id.includes('armory') || id.includes('portal') || id.includes('vault') || id.includes('arcanum')) {
                            triggers.grid[y][x] = { 
                                type: id, 
                                action: 'module', 
                                properties: tile.properties || {} 
                            };
                        }
                    }
                });
            });
        }
    }
}