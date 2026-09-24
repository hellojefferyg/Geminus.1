const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(process.cwd(), 'raw_zones');
const OUT_DIR = path.join(process.cwd(), 'public', 'data', 'zones');
const CHUNK_SIZE = 50;

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

function chunkZoneData() {
    const files = fs.readdirSync(RAW_DIR).filter(file => file.endsWith('.json'));
    const manifest = {};
    const spawnRegex = /entrance|portal|warp|spawn/i;

    files.forEach(file => {
        const zoneId = file.replace('.json', '');
        console.log(`Processing ${zoneId}...`);

        try {
            const rawData = fs.readFileSync(path.join(RAW_DIR, file), 'utf-8');
            const zoneData = JSON.parse(rawData);

            const {
                layers = [],
                backgroundImageData,
                originalBackgroundImageData,
                ...globalConfig
            } = zoneData;

            if (!globalConfig.spawnPoints) globalConfig.spawnPoints = [];

            // 2. AGGRESSIVE SCAN: Legacy Hexes Array
            if (Array.isArray(globalConfig.hexes)) {
                globalConfig.hexes.forEach(h => {
                    const match = (h.trigger && spawnRegex.test(h.trigger)) || 
                                  (h.assetId && spawnRegex.test(h.assetId)) || 
                                  (h.interactionType && spawnRegex.test(h.interactionType));
                    if (match) {
                        const sx = h.x !== undefined ? h.x : h.q;
                        const sy = h.y !== undefined ? h.y : h.r;
                        if (sx !== undefined && sy !== undefined) {
                            globalConfig.spawnPoints.push({ x: sx, y: sy });
                        }
                    }
                });
            }

            const chunks = {};
            let totalHexes = 0;

            const layerArray = Array.isArray(layers) ? layers : Object.values(layers);

            layerArray.forEach((layer) => {
                const layerId = layer.id || layer.name;
                const { grid = [], ...layerMeta } = layer;
                
                if (Array.isArray(grid)) {
                    grid.forEach((row, y) => {
                        if (!Array.isArray(row)) return;
                        
                        row.forEach((tile, x) => {
                            if (!tile) return;

                            totalHexes++;

                            // 3. AGGRESSIVE SCAN: Layer Grid Array
                            const match = (tile.assetId && spawnRegex.test(tile.assetId)) || 
                                          (tile.trigger && spawnRegex.test(tile.trigger)) || 
                                          (tile.eventId && spawnRegex.test(tile.eventId)) || 
                                          (tile.properties && tile.properties.interactionType && spawnRegex.test(tile.properties.interactionType));
                            
                            if (match) {
                                globalConfig.spawnPoints.push({ x, y });
                            }

                            const chunkX = Math.floor(x / CHUNK_SIZE);
                            const chunkY = Math.floor(y / CHUNK_SIZE);
                            const chunkId = `${chunkX}_${chunkY}`;

                            if (!chunks[chunkId]) chunks[chunkId] = {};
                            if (!chunks[chunkId][layerId]) chunks[chunkId][layerId] = { ...layerMeta, grid: {} };
                            if (!chunks[chunkId][layerId].grid[y]) chunks[chunkId][layerId].grid[y] = {};

                            chunks[chunkId][layerId].grid[y][x] = tile;
                        });
                    });
                }
            });

            const masterFileName = `${zoneId}_master.json`;
            fs.writeFileSync(
                path.join(OUT_DIR, masterFileName),
                JSON.stringify({ 
                    ...globalConfig, 
                    backgroundImageData, 
                    originalBackgroundImageData 
                })
            );

            const chunkList = Object.keys(chunks);
            chunkList.forEach(chunkId => {
                const chunkFileName = `${zoneId}_chunk_${chunkId}.json`;
                fs.writeFileSync(
                    path.join(OUT_DIR, chunkFileName),
                    JSON.stringify({ chunkId: chunkId, layers: Object.values(chunks[chunkId]) })
                );
            });

            manifest[zoneId] = {
                zoneName: globalConfig.zoneName || globalConfig.name || zoneId,
                minLevel: globalConfig.minLevel || 1,
                type: globalConfig.type || 'Standard',
                masterConfigFile: masterFileName,
                chunks: chunkList,
                totalHexes: totalHexes
            };
            
            // [FIX] ONLY use legacy center if absolutely zero physical portals were found!
            if (globalConfig.spawnPoints.length === 0) {
                if (globalConfig.startX !== undefined && globalConfig.startY !== undefined) {
                    globalConfig.spawnPoints.push({ x: globalConfig.startX, y: globalConfig.startY });
                } else if (globalConfig.spawnX !== undefined && globalConfig.spawnY !== undefined) {
                    globalConfig.spawnPoints.push({ x: globalConfig.spawnX, y: globalConfig.spawnY });
                }
            }
            
            if (globalConfig.spawnPoints.length === 0) {
                console.warn(`\x1b[33m⚠️ WARNING: ${zoneId} has ZERO spawn points! The player will drop in the void.\x1b[0m`);
            } else {
                console.log(`Successfully split ${zoneId} layers into ${chunkList.length} chunks. (Found ${globalConfig.spawnPoints.length} spawn points)`);
            }

        } catch (err) {
            console.error(`\x1b[31m❌ ERROR processing ${zoneId}: The file was locked or invalid. Skipping...\x1b[0m`, err.message);
        }
    });

    try {
        fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
        console.log('Manifest updated. Chunking complete.');
    } catch (err) {
        console.error(`\x1b[31m❌ ERROR writing manifest.json\x1b[0m`, err.message);
    }
}

chunkZoneData();