import { INTERACTION_MAP } from '../config/InteractionRegistry';
import { UI_MODULES } from '../types/InteractionTypes';

/**
 * Scans an object ID and returns the correct interaction config.
 * @param {string} objectId - The unique ID of the object (e.g., "The_Soulforge_5_5")
 * @returns {object} The interaction configuration object.
 */
export const enrichObjectWithInteraction = (objectId) => {
    // 1. Default safe state
    const baseConfig = {
        hasInteraction: false,
        triggerType: 'ON_CLICK',
        actionType: 'OPEN_UI',
        targetModule: UI_MODULES.DEFAULT
    };

    if (!objectId) return baseConfig;

    // 2. Find matching keyword (e.g., does "The_Soulforge_5_5" include "Soulforge")
    // Iterates through the Registry keys to find a partial match in the objectId
    const matchedKey = Object.keys(INTERACTION_MAP).find(key => 
        objectId.includes(key)
    );

    if (matchedKey) {
        return {
            ...baseConfig,
            ...INTERACTION_MAP[matchedKey],
            hasInteraction: true
        };
    }

    return baseConfig;
};