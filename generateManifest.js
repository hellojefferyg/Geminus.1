const fs = require('fs');
const path = require('path');

// CONFIGURATION: Ensure these paths match your folder structure
const MAPS_DIR = './public/maps'; 
const OUTPUT_FILE = './public/maps/zoneManifest.json';

function generate() {
    console.log("🛠️ Geminus: Generating Zone Manifest...");
    
    if (!fs.existsSync(MAPS_DIR)) {
        console.error(`❌ Folder not found: ${MAPS_DIR}`);
        return;
    }

    const files = fs.readdirSync(MAPS_DIR);
    const manifest = { 
        zones: {}, 
        metadata: { 
            total: 0, 
            generatedAt: new Date().toISOString() 
        } 
    };

    files.forEach(file => {
        // Only process actual zone JSON files, skip the manifest itself
        if (file.endsWith('.json') && file !== 'zoneManifest.json') {
            try {
                const filePath = path.join(MAPS_DIR, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Use zid (Z01) as the key, or the filename if zid is missing
                const zid = content.zid || file.replace('.json', '');
                
                manifest.zones[zid] = {
                    name: content.zoneName || "Unknown Sector",
                    level: content.zoneLevel || 1,
                    type: content.zoneType || "Standard"
                };
                
                manifest.metadata.total++;
            } catch (err) {
                console.warn(`⚠️ Skipping ${file}: Invalid JSON format.`);
            }
        }
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
    console.log(`✅ Success: ${manifest.metadata.total} zones indexed in zoneManifest.json`);
}

generate();