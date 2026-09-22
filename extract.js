import fs from 'fs';
import path from 'path';

const zonesDir = './public/data/zones';
const files = fs.readdirSync(zonesDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const output = files.map(file => {
    const data = JSON.parse(fs.readFileSync(path.join(zonesDir, file), 'utf-8'));
    return `${data.zid} | ${data.zoneName} | ${data.biome}`;
});

console.log(output.join('\n'));