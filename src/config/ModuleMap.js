/**
 * @file src/config/ModuleMap.js
 * @description Maps Map Triggers (IDs) to their actual HTML Interface files.
 */

export const MODULE_FILE_MAP = {
    // --- CORE SHOPS & BUILDINGS ---
    // The Armory (Shop)
    'armory_shop':             'armory.html',
    'theArmory':               'armory.html', 
    'ARMORY_UI':               'armory.html', // [ADDED FIX]

    // The Arcanum (Magic Shop)
    'arcanum_shop':            'arcanum.html',
    'theArcanumNew':           'arcanum.html',
    'ARCANUM_UI':              'arcanum.html', // [ADDED FIX]

    // The Gilded Vault (Player Bank)
    'gilded_vault_storage':    'gilded_vault.html',
    'gildedVaultNew':          'gilded_vault.html',
    'VAULT_UI':                'gilded_vault.html', // [ADDED FIX]

    // --- CRAFTING ---
    // The Soulforge (Crafting)
    'soulforge':               'soulforge.html', 
    'soulforgeNew':            'soulforge.html',
    'SOULFORGE_UI':            'soulforge.html', // [ADDED FIX]
    
    // Gem Cutter
    'gemCutter1':              'gem_cutter.html',
    'gemCutter2':              'gem_cutter.html',
    'GEMCUTTER_UI':            'gem_cutter.html', // [ADDED FIX]

    // --- UTILITY ---
    // Sanctuary (Revive/Heal)
    'sanctuary_revive_point':  'sanctuary.html',
    'sanctuaryReviveNew':      'sanctuary.html',
    'RESURRECTION_UI':         'sanctuary.html', // [ADDED FIX]
    
    // --- TRAVEL & QUESTS ---
    // Portal / Teleport
    'teleport_ui':             'portal.html',
    'portalNew':               'portal.html',
    'PORTAL_UI':               'portal.html', // [ADDED FIX]
    
    // Quests & Market
    'quest_board':             'quest_board.html',
    'market':                  'market.html',
    'black_market':            'market.html',    
    
    // Clan
    'clan_hall':               'clan_hall.html' ,

    // Combat Popup
    'combat_encounter':        'battle.html'
};