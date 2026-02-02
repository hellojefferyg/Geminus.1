import { UI_MODULES } from '../types/InteractionTypes';

/**
 * Registry mapping object ID keywords to specific interaction configurations.
 */
export const INTERACTION_MAP = {
    // --- UI MODULES (Standard Shops & Hubs) ---
    'Armory': {
        targetModule: UI_MODULES.ARMORY,
        label: 'Enter Armory',
        actionType: 'OPEN_UI'
    },
    'Arcanum': {
        targetModule: UI_MODULES.ARCANUM,
        label: 'Research Arcana',
        actionType: 'OPEN_UI'
    },
    'Gilded_Vault': {
        targetModule: UI_MODULES.VAULT,
        label: 'Open Vault',
        actionType: 'OPEN_UI'
    },
    // Portal: Opens the Teleport Hub UI (User selects destination)
    'Portal': {
        targetModule: UI_MODULES.PORTAL,
        label: 'Teleportation Hub',
        actionType: 'OPEN_UI'
    },
    // Sanctuary: Opens the Resurrection/Healer UI
    'Sanctuary': {
        targetModule: UI_MODULES.RESURRECTION,
        label: 'Sanctuary',
        actionType: 'OPEN_UI'
    },
    'Resurrection': {
        targetModule: UI_MODULES.RESURRECTION,
        label: 'Resurrect Units',
        actionType: 'OPEN_UI'
    },
    // Crafting Stations (Case-sensitive fixes included)
    'SoulForge': {
        targetModule: UI_MODULES.SOULFORGE,
        label: 'Enter Soulforge',
        actionType: 'OPEN_UI'
    },
    'Gem_Cutter': {
        targetModule: UI_MODULES.GEMCUTTER,
        label: 'Cut Gems',
        actionType: 'OPEN_UI'
    },

    // --- DIRECT TELEPORTERS (Entrances/Exits) ---
    // These link directly to another zone
    'Entrance': {
        actionType: 'TELEPORT',
        label: 'Enter Zone',
        defaultParams: { targetZoneId: 'SET_ZID', targetX: 0, targetY: 0 }
    },
    'Dungeon': {
        actionType: 'TELEPORT',
        label: 'Enter Dungeon',
        defaultParams: { targetZoneId: 'SET_ZID', targetX: 0, targetY: 0 }
    },
    'Gate': {
        actionType: 'TELEPORT',
        label: 'Open Gate',
        defaultParams: { targetZoneId: 'SET_ZID', targetX: 0, targetY: 0 }
    }
};