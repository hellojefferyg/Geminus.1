/**
 * Enum for available UI Modules.
 * These string values must match the keys used in your UI rendering logic/switch statements.
 */
export const UI_MODULES = {
    DEFAULT: 'DEFAULT_VIEW', // Fallback/None
    ARMORY: 'ARMORY_UI',
    ARCANUM: 'ARCANUM_UI',
    VAULT: 'VAULT_UI',
    PORTAL: 'PORTAL_UI',
    RESURRECTION: 'RESURRECTION_UI',
    SOULFORGE: 'SOULFORGE_UI',
    GEMCUTTER: 'GEMCUTTER_UI',
    ENTRANCE: 'ENTRANCE_UI',     // Shared by Dungeon, Gate, Entrance
    CRAFTING: 'CRAFTING_UI',     // Generic crafting if needed
    MANAGEMENT: 'MANAGEMENT_UI', // Town Hall/Settlement
    MILITARY: 'MILITARY_UI'      // Barracks
};