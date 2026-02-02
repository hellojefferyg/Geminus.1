/**
 * @file src/config/MasterAssets.js
 * @description The "Master Palette" for the game. 
 * Sourced directly from MapEditor.jsx (Synesence7600/Map-Assets).
 * If a map file forgets to list its assets, the engine looks here.
 */

export const MASTER_ASSET_LIBRARY = {
    // --- Core Interactives ---
    "theArmory": { 
        id: "theArmory", 
        scale: 1.15, yOffset: -5, color: '#607D8B', name: 'The Armory', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Armory.png', 
        defaultProperties: { moduleId: 'armory_shop', interactionType: 'shop' }
    },
    "theArcanumNew": { 
        id: "theArcanumNew", 
        scale: 1, yOffset: 0, color: '#483D8B', name: 'The Arcanum', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Arcanum.png', 
        defaultProperties: { moduleId: 'arcanum_shop', interactionType: 'shop' }
    },
    "gildedVaultNew": { 
        id: "gildedVaultNew", 
        scale: 1, yOffset: 0, color: '#DAA520', name: 'The Gilded Vault', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Gilded%20Vault.png', 
        defaultProperties: { moduleId: 'gilded_vault_storage', interactionType: 'storage' }
    },
    "portalNew": { 
        id: "portalNew", 
        scale: 0.9, yOffset: -2, color: '#00FFFF', name: 'Portal', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Portal.png', 
        defaultProperties: { interactionType: 'portal', targetZoneId: 'default_zone', targetCoords: '0,0' }
    },
    "sanctuaryReviveNew": { 
        id: "sanctuaryReviveNew", 
        scale: 1, yOffset: 0, color: '#F0E68C', name: 'Sanctuary (Revive)', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Sanctuary%20(Revive).png', 
        defaultProperties: { interactionId: 'sanctuary_revive_point', interactionType: 'revive' }
    },
    "entranceBlue": { 
        id: "entranceBlue", 
        scale: 0.75, yOffset: -3, color: '#4287f5', name: 'Entrance (Blue)', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Entrance%20(Blue).png' 
    },
    "entranceBlack": { 
        id: "entranceBlack", 
        scale: 0.75, yOffset: -3, color: '#333333', name: 'Entrance (Black)', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Entrance%20(Black).png' 
    },
    "entranceRed": { 
        id: "entranceRed", 
        scale: 0.75, yOffset: -3, color: '#f54242', name: 'Entrance (Red)', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Entrance%20(Red).png' 
    },
    "gemCutter1": { 
        id: "gemCutter1", 
        scale: 1, yOffset: 0, color: '#B9F2FF', name: 'The Gem Cutter 1', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Gem%20Cutter%201.png' 
    },
    "gemCutter2": { 
        id: "gemCutter2", 
        scale: 1, yOffset: 0, color: '#B9F2FF', name: 'The Gem Cutter 2', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Gem%20Cutter%202.png' 
    },
    "soulforgeNew": { 
        id: "soulforgeNew", 
        scale: 1, yOffset: 0, color: '#E6E6FA', name: 'The SoulForge', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Soul%20Forge.png' 
    },

    // --- Estate Buildings ---
    "estateHall": { 
        id: "estateHall", 
        scale: 1, yOffset: 0, color: '#FFD700', name: 'Estate Hall', type: 'Estate Buildings', 
        svgPath: 'M2 22 L2 12 L6 12 L6 8 L18 8 L18 12 L22 12 L22 22 Z M10 12 L14 12 L14 22 L10 22 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Estate%20Hall.png' 
    },
    "researchCottage": { 
        id: "researchCottage", 
        scale: 1, yOffset: 0, color: '#8A2BE2', name: 'Research Cottage', type: 'Estate Buildings', 
        svgPath: 'M12 2 L2 8 L2 22 L22 22 L22 8 Z M16 14 A4 4 0 1 1 8 14 A4 4 0 0 1 16 14', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Research%20Cottage.png' 
    },
    "storehouse": { 
        id: "storehouse", 
        scale: 1, yOffset: 0, color: '#A0522D', name: 'Storehouse', type: 'Estate Buildings', 
        svgPath: 'M3 8 L12 2 L21 8 L21 22 L3 22 Z M8 12 H16 V18 H8Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Store%20House.png' 
    },
    "tannery": { 
        id: "tannery", 
        scale: 1, yOffset: 0, color: '#D2B48C', name: 'Tannery', type: 'Estate Buildings', 
        svgPath: 'M4 4 h16 v16 h-16 z M8 8 v8 h8 v-8 z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Tannery%20.png' 
    },
    "questBoard": { 
        id: "questBoard", 
        scale: 1, yOffset: 0, color: '#DEB887', name: 'Quest Board', type: 'Estate Buildings', 
        svgPath: 'M5 3 H19 V21 H5 Z M8 7 H16 M8 11 H16 M8 15 H12', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Quest%20board.png' 
    },
    "estateBank": { 
        id: "estateBank", 
        scale: 1, yOffset: 0, color: '#C0C0C0', name: 'Estate Bank', type: 'Estate Buildings', 
        svgPath: 'M12 2 L2 7 L2 9 L22 9 L22 7 Z M4 10 H20 V22 H4 Z M7 12 H9 V18 H7 Z M11 12 H13 V18 H11 Z M15 12 H17 V18 H15 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Estate%20Resource%20Bank.png' 
    },
    "gemcutter": { 
        id: "gemcutter", 
        scale: 1, yOffset: 0, color: '#B9F2FF', name: 'Gemcutter', type: 'Estate Buildings', 
        svgPath: 'M12 2 L18 8 L12 14 L6 8 Z M6 10 L18 10 L18 16 L12 22 L6 16 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Gem%20Cutter%201.png' 
    },
    "arcanistsAltar": { 
        id: "arcanistsAltar", 
        scale: 1, yOffset: 0, name: "Arcanist's Altar", type: 'Estate Buildings', color: '#8A2BE2', 
        svgPath: '', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Arcanists%20Alter.png' 
    },

    // --- Resource Generators ---
    "dragonwoodGrove": { 
        id: "dragonwoodGrove", 
        scale: 1, yOffset: 0, color: '#006400', name: 'Dragonwood Grove', type: 'Resource Generators', 
        svgPath: 'M12 22 L12 12 M12 12 L6 6 M12 12 L18 6 M6 6 A6 6 0 1 1 18 6 A6 6 0 0 1 6 6', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dragonwood%20Grove.png' 
    },
    "bedrockQuarry": { 
        id: "bedrockQuarry", 
        scale: 1, yOffset: 0, color: '#696969', name: 'Bedrock Quarry', type: 'Resource Generators', 
        svgPath: 'M2 12 L12 2 L22 12 L12 22 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Bedrock%20Quarry.png' 
    },
    "estateMine": { 
        id: "estateMine", 
        scale: 1, yOffset: 0, color: '#8B4513', name: 'Estate Mine', type: 'Resource Generators', 
        svgPath: 'M4 10 H20 L12 22 Z M10 4 L14 4 L14 10 L10 10 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Estate%20Mine.png' 
    },
    "huntingPreserve": { 
        id: "huntingPreserve", 
        scale: 1, yOffset: 0, color: '#556B2F', name: 'Hunting Preserve', type: 'Resource Generators', 
        svgPath: 'M12 2 A10 10 0 0 0 2 12 A10 10 0 0 0 12 22 A10 10 0 0 0 22 12 A10 10 0 0 0 12 2 M22 2 L12 12 L2 22', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Hunting%20Preserve.png' 
    },

    // --- Clan Buildings ---
    "greatHall": { 
        id: "greatHall", 
        scale: 1, yOffset: 0, color: '#B8860B', name: 'Great Hall', type: 'Clan Buildings', 
        svgPath: 'M2 22 L2 10 L12 3 L22 10 L22 22 Z M6 10 L6 22 M18 10 L18 22 M10 10 L10 22 M14 10 L14 22', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Great%20Hall.png' 
    },
    "bastionWalls": { 
        id: "bastionWalls", 
        scale: 1, yOffset: 0, color: '#808080', name: 'Bastion Walls', type: 'Clan Buildings', 
        svgPath: 'M2 8 H22 V16 H2 Z M8 8 V16 M16 8 V16', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Bastion%20Walls1.png' 
    },
    "warCamp": { 
        id: "warCamp", 
        scale: 1, yOffset: 0, color: '#FF4500', name: 'War Camp', type: 'Clan Buildings', 
        svgPath: 'M2 22 L12 2 L22 22 Z M4 22 L12 12 L20 22', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/War%20Camp.png' 
    },
    "forceOfFriendship": { 
        id: "forceOfFriendship", 
        scale: 1, yOffset: 0, name: "Force of Friendship", type: 'Clan Buildings', color: '#4CAF50', 
        svgPath: '', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Force%20of%20Friendship.png' 
    },
    "trackerAcademy": { 
        id: "trackerAcademy", 
        scale: 1, yOffset: 0, name: "Tracker Academy", type: 'Clan Buildings', color: '#FF9800', 
        svgPath: '', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Tracker%20Academy.png' 
    },
    "blackMarket": { 
        id: "blackMarket", 
        scale: 1, yOffset: 0, name: "Black Market", type: 'Clan Buildings', color: '#607D8B', 
        svgPath: '', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Black%20Market.png' 
    },
    "clanMine": { 
        id: "clanMine", 
        scale: 1, yOffset: 0, name: "Clan Mine", type: 'Clan Buildings', color: '#795548', 
        svgPath: '', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Clan%20Mine.png' 
    },

    // --- Resource Nodes ---
    "dragonboneTimber": { 
        id: "dragonboneTimber", 
        scale: 1, yOffset: 0, name: "Dragonbone Timber", type: 'Resource Nodes', color: '#5D4037', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dragonbone%20Timber.png' 
    },
    "primordialMire": { 
        id: "primordialMire", 
        scale: 1, yOffset: 0, name: "Primordial Mire", type: 'Resource Nodes', color: '#4E342E', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Primordial%20Mire.png' 
    },
    "earthRootRock": { 
        id: "earthRootRock", 
        scale: 1, yOffset: 0, name: "Earth-Root Rock", type: 'Resource Nodes', color: '#6D4C41', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Earth-Root%20Rock.png' 
    },
    "dwarfForgedIron": { 
        id: "dwarfForgedIron", 
        scale: 1, yOffset: 0, name: "Dwarf-Forged Iron", type: 'Resource Nodes', color: '#455A64', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dwarf-Forged%20Iron.png' 
    },
    "rawhide": { 
        id: "rawhide", 
        scale: 1, yOffset: 0, name: "Rawhide", type: 'Resource Nodes', color: '#A1887F', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Rawhide.png' 
    },
    "heartwoodLog": { 
        id: "heartwoodLog", 
        scale: 1, yOffset: 0, name: "Heartwood Log", type: 'Resource Nodes', color: '#3E2723', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Heartwood%20Log.png' 
    },
    "quarryStone": { 
        id: "quarryStone", 
        scale: 1, yOffset: 0, name: "Quarry Stone", type: 'Resource Nodes', color: '#757575', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Quarry%20Stone.png' 
    },
    "duneTitanDust": { 
        id: "duneTitanDust", 
        scale: 1, yOffset: 0, name: "Dune-Titan Dust", type: 'Resource Nodes', color: '#FFC107', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dune-Titan%20Dust.png' 
    },
    "infernalEmberlump": { 
        id: "infernalEmberlump", 
        scale: 1, yOffset: 0, name: "Infernal Emberlump", type: 'Resource Nodes', color: '#F44336', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Infernal%20Embrlump.png' 
    },
    "astralDust": { 
        id: "astralDust", 
        scale: 1, yOffset: 0, name: "Astral Dust", type: 'Resource Nodes', color: '#9C27B0', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Astral%20Dust.png' 
    },
    "siegeGradeTimber": { 
        id: "siegeGradeTimber", 
        scale: 1, yOffset: 0, name: "Siege-Grade Timber", type: 'Resource Nodes', color: '#8D6E63', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Siege-Grade%20Timber.png' 
    },
    "fortressGranite": { 
        id: "fortressGranite", 
        scale: 1, yOffset: 0, name: "Fortress Granite", type: 'Resource Nodes', color: '#9E9E9E', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Fortress%20Granite.png' 
    },
    "voidHeartAdamant": { 
        id: "voidHeartAdamant", 
        scale: 1, yOffset: 0, name: "Void-Heart Adamant", type: 'Resource Nodes', color: '#212121', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Void-Heart%20Adamant.png' 
    },
    "titansBloodOre": { 
        id: "titansBloodOre", 
        scale: 1, yOffset: 0, name: "Titans-Blood Ore", type: 'Resource Nodes', color: '#B71C1C', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Titans-Blood%20Ore%20.png' 
    },
    "nightWhisperEssence": { 
        id: "nightWhisperEssence", 
        scale: 1, yOffset: 0, name: "Night Whisper Essence", type: 'Resource Nodes', color: '#4A148C', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Night%20Whisper%20Essence.png' 
    },
    "seraphicPlatinum": { 
        id: "seraphicPlatinum", 
        scale: 1, yOffset: 0, name: "Seraphic Platinum", type: 'Resource Nodes', color: '#E0E0E0', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Seraphic%20Platinum.png' 
    },
    "worldShards": { 
        id: "worldShards", 
        scale: 1, yOffset: 0, name: "World Shard", type: 'Resource Nodes', color: '#00BCD4', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/World%20Shard.png' 
    },
    "bloodsteelIngot": { 
        id: "bloodsteelIngot", 
        scale: 1, yOffset: 0, name: "Bloodsteel Ingot", type: 'Resource Nodes', color: '#D32F2F', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Blood%20Steel%20Ingot.png' 
    },
    "adamantOre": { 
        id: "adamantOre", 
        scale: 1, yOffset: 0, name: "Adamant Ore", type: 'Resource Nodes', color: '#616161', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Adamant%20Ore.png' 
    },

    // --- Refined Resources ---
    "ironIngot": { 
        id: "ironIngot", 
        scale: 1, yOffset: 0, name: "Iron Ingot", type: 'Refined Resources', color: '#BDBDBD', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Iron%20Ingot.png' 
    },
    "tannedLeather": { 
        id: "tannedLeather", 
        scale: 1, yOffset: 0, name: "Tanned Leather", type: 'Refined Resources', color: '#8D6E63', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Tanned%20Leather.png' 
    },
    "arcaneResin": { 
        id: "arcaneResin", 
        scale: 1, yOffset: 0, name: "Arcane Resin", type: 'Refined Resources', color: '#673AB7', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Arcane%20Resin.png' 
    },
    "fociStone": { 
        id: "fociStone", 
        scale: 1, yOffset: 0, name: "Foci Stone", type: 'Refined Resources', color: '#03A9F4', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Foci%20Stone.png' 
    },

    // --- Natural Obstacles ---
    "tree": { 
        id: "tree", 
        scale: 1, yOffset: 0, color: '#228B22', name: 'Tree', type: 'Natural Obstacles', 
        svgPath: 'M12 10 L2 22 H22 Z M10 10 V2 H14 V10 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Tree.png' 
    },
    "rock": { 
        id: "rock", 
        scale: 1, yOffset: 0, color: '#6c757d', name: 'Rock', type: 'Natural Obstacles', 
        svgPath: 'M4 20 C4 10 10 10 12 14 C14 10 20 10 20 20 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Rock.png' 
    },
    "giantMushroom": { 
        id: "giantMushroom", 
        scale: 1, yOffset: 0, color: '#8B008B', name: 'Giant Mushroom', type: 'Natural Obstacles', 
        svgPath: 'M4 12 C4 6 20 6 20 12 Z M10 12 V22 H14 V12 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Giant%20Mushroom.png' 
    },
    "thornVines": { 
        id: "thornVines", 
        scale: 1, yOffset: 0, color: '#8B0000', name: 'Thorn Vines', type: 'Natural Obstacles', 
        svgPath: 'M2 12 C8 2 16 22 22 12', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Thorn%20Vines%20.png' 
    },
    "petrifiedTree": { 
        id: "petrifiedTree", 
        scale: 1, yOffset: 0, color: '#556B2F', name: 'Petrified Tree', type: 'Natural Obstacles', 
        svgPath: 'M12 2 L10 12 L14 12 Z M8 12 L2 22 L10 22 Z M16 12 L22 22 L14 22 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Petrified%20Tree.png' 
    },
    "crystalCluster": { 
        id: "crystalCluster", 
        scale: 1, yOffset: 0, color: '#00BFFF', name: 'Crystal Cluster', type: 'Natural Obstacles', 
        svgPath: 'M12 2 L16 10 L12 12 L8 10 Z M4 12 L10 14 L8 22 Z M20 12 L14 14 L16 22 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Crystal%20Cluster.png' 
    },
    "lavaFissure": { 
        id: "lavaFissure", 
        scale: 1, yOffset: 0, color: '#FF4500', name: 'Lava Fissure', type: 'Natural Obstacles', 
        svgPath: 'M2 12 Q8 6 12 12 T22 12', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Lava%20Fissure.png' 
    },
    "iceSpire": { 
        id: "iceSpire", 
        scale: 1, yOffset: 0, color: '#ADD8E6', name: 'Ice Spire', type: 'Natural Obstacles', 
        svgPath: 'M12 2 L2 22 H22 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Ice%20Spire%20.png' 
    },
    "giantBones": { 
        id: "giantBones", 
        scale: 1, yOffset: 0, color: '#F5F5DC', name: 'Giant Bones', type: 'Natural Obstacles', 
        svgPath: 'M4 4 A4 4 0 1 1 4 12 H20 A4 4 0 1 1 20 4 Z', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Giant%20Bones.png' 
    },
    "denseWebs": { 
        id: "denseWebs", 
        scale: 1, yOffset: 0, color: '#FFFFFF', name: 'Dense Webs', type: 'Natural Obstacles', 
        svgPath: 'M12 2 V22 M2 12 H22 M5 5 L19 19 M5 19 L19 5', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dense%20webs.png' 
    },

    // --- Terrain ---
    "grass": { 
        id: "grass", 
        scale: 1, yOffset: 0, color: '#4A6B4A', name: 'Grass', type: 'Terrain', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Grass.png' 
    },
    "water": { 
        id: "water", 
        scale: 1, yOffset: 0, color: '#1E90FF', name: 'Water', type: 'Terrain', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Water.png' 
    },
    "mud": { 
        id: "mud", 
        scale: 1, yOffset: 0, color: '#8B4513', name: 'Mud', type: 'Terrain', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Mud.png' 
    },
    "crackedGround": { 
        id: "crackedGround", 
        scale: 1, yOffset: 0, color: '#CD853F', name: 'Cracked Ground', type: 'Terrain', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Cracked%20Ground%20.png' 
    },
    "snowDrift": { 
        id: "snowDrift", 
        scale: 1, yOffset: 0, color: '#FFFAFA', name: 'Snow Drift', type: 'Terrain', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Snow%20Drift.png' 
    },
    "ashfall": { 
        id: "ashfall", 
        scale: 1, yOffset: 0, color: '#2F4F4F', name: 'Ashfall', type: 'Terrain', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Ashfall.png' 
    }
};