// --- GEMINUS ENGINE: CENTRAL MANAGERS HUB ---

// 1. Data & Systems Configuration
import { gddConstants, races, progression, items, bestiary, gems } from './config/gdd.js';
import Systems from './utils/systems.js';

// 2. Core Infrastructure (from /managers/core/)
import { GameManager } from './managers/core/GameManager.js';
import { DataManager } from './managers/core/DataManager.js';
import { UIManager } from './managers/ui/UIManager.js';

// 3. Combat & Survival (from /managers/combat/)
import { CombatManager } from './managers/combat/CombatManager.js'; 
import { SanctuaryManager } from './managers/combat/SanctuaryManager.js';

// 4. Inventory & Gear (from /managers/inventory/)
import { InventoryManager } from './managers/inventory/InventoryManager.js';
import { EquipmentManager } from './managers/inventory/EquipmentManager.js';

// 5. Player Identity & Stats (from /managers/player/)
import { CreationManager } from './managers/player/CreationManager.js';
import { ProfileManager } from './managers/player/ProfileManager.js';
import { StatsManager } from './managers/player/StatsManager.js';

// 6. World & Rendering (from /managers/world/)
import { MapDataStore } from './managers/world/MapDataStore.js';
import { MapLoader } from './managers/world/MapLoader.js';
import { MapRenderer } from './managers/world/MapRenderer.js';
import { WorldMapManager } from './managers/world/WorldMapManager.js'; 
import { ZoneManager } from './managers/world/ZoneManager.js'; 

// 7. UI, Social & Settings (from /managers/ui/ and /managers/social/)
import { LayoutManager } from './managers/ui/LayoutManager.js';
import { ModalManager } from './managers/ui/ModalManager.js';
import { SettingsManager } from './managers/ui/SettingsManager.js';
import { ChatManager } from './managers/social/ChatManager.js';

export {
    DataManager, GameManager, MapDataStore, MapRenderer, Systems,
    ChatManager, SettingsManager, MapLoader, WorldMapManager,
    ModalManager, CreationManager, ProfileManager, CombatManager,
    SanctuaryManager, StatsManager, InventoryManager, EquipmentManager,
    UIManager, LayoutManager, ZoneManager,
    gddConstants, races, progression, items, bestiary, gems
};

/**
 * Initializes global window references for developer debugging 
 * and cross-manager resonance.
 */
export function initializeGlobals(deps) {
    window.Systems = deps.Systems;
    window.MapDataStore = deps.MapDataStore;
    window.state = deps.state;
    window.ui = deps.ui;
    window.showToast = deps.showToast;
    window.CombatManager = deps.CombatManager;
    
    console.log("⚛️ Geminus Engine: All Global Managers Mapped and Resonated.");
}