// src/data/gdd_seed.js
import { armoryData } from './armoryData';
import { arcanumData } from './arcanumData';
import { jewelryData } from './jewelryData';
import { dropTableData } from './dropTables';
import { gemsData } from './gemsData';
import { racesData } from './racesData';
import { zonesData } from './zonesData';
import { bestiaryData } from './bestiaryData';

export const GDD_INITIAL_DATA = {
    // These pull automatically from the modular files you just populated
    races: racesData || {},
    dropTables: dropTableData || {},
    armory: armoryData || {},
    arcanum: arcanumData || {},
    jewelry: jewelryData || {},
    gems: gemsData || {},
    zones: Array.isArray(zonesData) 
        ? zonesData.reduce((acc, z) => ({ ...acc, [z.id]: z }), {}) 
        : {},
    bestiary: bestiaryData || {},
};