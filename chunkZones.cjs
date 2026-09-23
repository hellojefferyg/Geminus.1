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

    files.forEach(file => {
        const zoneId = file.replace('.json', '');
        console.log(`Processing ${zoneId}...`);

        const rawData = fs.readFileSync(path.join(RAW_DIR, file), 'utf-8');
        const zoneData = JSON.parse(rawData);

        // 1. Isolate global metadata and massive images
        const {
            layers = [],
            backgroundImageData,
            originalBackgroundImageData,
            ...globalConfig
        } = zoneData;

        // 2. Export master file
        const masterFileName = `${zoneId}_master.json`;
        fs.writeFileSync(
            path.join(OUT_DIR, masterFileName),
            JSON.stringify({ 
                ...globalConfig, 
                backgroundImageData, 
                originalBackgroundImageData 
            })
        );

        const chunks = {};
        let totalHexes = 0;

        // 3. Process each layer's 2D array
        const layerArray = Array.isArray(layers) ? layers : Object.values(layers);

        layerArray.forEach((layer) => {
            const layerId = layer.id || layer.name;
            const { grid = [], ...layerMeta } = layer;
            
            if (Array.isArray(grid)) {
                // y is the row index, x is the column index
                grid.forEach((row, y) => {
                    if (!Array.isArray(row)) return;
                    
                    row.forEach((tile, x) => {
                        if (!tile) return;

                        totalHexes++;
                        const chunkX = Math.floor(x / CHUNK_SIZE);
                        const chunkY = Math.floor(y / CHUNK_SIZE);
                        const chunkId = `${chunkX}_${chunkY}`;

                        if (!chunks[chunkId]) {
                            chunks[chunkId] = {};
                        }
                        
                        // Reconstruct layer metadata, but use an Object for the grid
                        // to prevent massive [null, null...] padding in the final JSON
                        if (!chunks[chunkId][layerId]) {
                            chunks[chunkId][layerId] = { ...layerMeta, grid: {} };
                        }

                        if (!chunks[chunkId][layerId].grid[y]) {
                            chunks[chunkId][layerId].grid[y] = {};
                        }

                        // Store the tile perfectly at its absolute coordinate
                        chunks[chunkId][layerId].grid[y][x] = tile;
                    });
                });
            }
        });

        // 4. Output the partitioned chunk files
        const chunkList = Object.keys(chunks);
        chunkList.forEach(chunkId => {
            const chunkFileName = `${zoneId}_chunk_${chunkId}.json`;
            const localizedLayers = Object.values(chunks[chunkId]);
            
            fs.writeFileSync(
                path.join(OUT_DIR, chunkFileName),
                JSON.stringify({
                    chunkId: chunkId,
                    layers: localizedLayers
                })
            );
        });

        // 5. Update the manifest
        manifest[zoneId] = {
            masterConfigFile: masterFileName,
            chunks: chunkList,
            totalHexes: totalHexes
        };
        
        console.log(`Successfully split ${zoneId} layers into ${chunkList.length} chunks.`);
    });

    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log('Manifest updated. Chunking complete.');
}

chunkZoneData();