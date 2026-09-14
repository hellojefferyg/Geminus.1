# Geminus Engine — Master Subsystem Dependency Map & Reference Guide

This reference document outlines the exact architecture, data pipelines, and file dependencies across the Geminus game engine. Keep this file in your project root or `docs/` folder to quickly reference which files to inspect when tuning or modifying any system.

---

## 1. Subsystem Quick-Reference Matrix

| Subsystem / Domain | Logic / Engine Files | Data & Schema Files | UI / Component / View |
| :--- | :--- | :--- | :--- |
| **Map Studio & Content Suite** | `src/components/Visualizer/MapEditor.jsx`<br>`src/utils/ReceiverBridge.js`<br>`src/utils/InteractionFactory.js` | `public/data/zones/manifest.json`<br>`public/data/zones/Z*.json`<br>`src/config/MasterAssets.js`<br>`src/config/gdd.js` | `src/components/Visualizer/MapEditor.jsx`<br>`src/components/ObjectConfigModal.jsx`<br>`src/components/MapMakerBridge.jsx` |
| **Combat & Damage Balancing** | `src/utils/systems.js`<br>`src/managers/combat/CombatManager.js` | `src/config/gdd.js`<br>`src/data/bestiaryData.js`<br>`src/data/monsterTitles.js` | `#combat-modal`<br>`#tab-content-combat`<br>`public/modules/battle.html` |
| **Monster Forge / Auto-Balancing** | `src/utils/DevManager.js` (`forgeZone`, `forgeEntireBestiary`)<br>`MapEditor.jsx` (`generateZoneMobs`) | `src/data/zonesData.js`<br>`src/config/gdd.js`<br>`src/data/bestiaryData.js` | Browser Dev Console<br>MapEditor Roster Panel |
| **Player Creation & Profile** | `src/managers/player/CreationManager.js`<br>`src/managers/player/ProfileManager.js`<br>`src/managers/player/StatsManager.js` | `src/data/racesData.js`<br>`src/data/alignmentData.js`<br>`src/data/masteryData.js` | Character Creation Modal<br>`#tab-content-stats`<br>Player Profile Card |
| **Gear, Sockets & Inventory** | `src/managers/inventory/InventoryManager.js`<br>`src/managers/inventory/EquipmentManager.js` | `src/config/gdd.js` (`items`, `equipmentSlotConfig`)<br>`src/data/armoryData.js`<br>`src/data/jewelryData.js`<br>`src/data/gemsData.js` | `#tab-content-inventory`<br>`#tab-content-equipment` |
| **Loot Drops, Shadows & Echoes** | `src/utils/systems.js` (`generateLoot`, `generateShadowLoot`, `generateEnchantments`) | `src/data/dropTables.js`<br>`src/data/enchantmentData.js`<br>`src/config/gdd.js` | `CombatManager.js` (Loot log / Floaters) |
| **The Soulforge & Shattering** | `src/utils/systems.js` (`rerollEnchantment`)<br>`src/utils/InteractionBridge.js` | `src/data/soulforgeData.js`<br>`src/data/resourceData.js` (`crafting_resources`) | `public/modules/soulforge.html` |
| **Economy, Shops & Gilded Vault** | `src/managers/economy/MerchantManager.js`<br>`src/managers/economy/VaultManager.js` | `src/data/vaultData.js`<br>`src/data/resourceData.js` | `public/modules/armory.html`<br>`public/modules/arcanum.html`<br>`public/modules/gilded_vault.html`<br>`public/modules/market.html` |
| **Clans & Bastion Upgrades** | `src/utils/InteractionBridge.js` (`UPGRADE_BUILDING`) | `src/data/clanData.js`<br>`src/data/resourceData.js` (`war_materials`) | `public/modules/clan_hall.html`<br>`public/modules/TheClanBastion.html` |
| **Soul Debt & Resurrection** | `src/managers/combat/SanctuaryManager.js`<br>`src/managers/core/DataManager.js` | `src/utils/systems.js` (Tithe calculation) | `public/modules/sanctuary.html` |
| **Social & In-Game Chat** | `src/managers/social/ChatManager.js` | LocalStorage / Firebase State | `#footer-chat-container`<br>`public/modules/chat.html` |
| **World Map, Zones & Pathfinding** | `src/managers/world/ZoneManager.js`<br>`src/managers/world/WorldMapManager.js`<br>`src/managers/core/GameManager.js` | `public/data/zones/*.json`<br>`public/data/zones/manifest.json`<br>`src/data/zonesData.js` | `src/managers/world/MapRenderer.js`<br>`public/player.html` |
| **Map Triggers & Bridge Modals** | `src/config/InteractionRegistry.js`<br>`src/config/ModuleMap.js`<br>`src/utils/InteractionBridge.js` | `src/types/InteractionTypes.js` | `src/components/InteractionModal.jsx`<br>`#module-overlay` |
| **God Tools / Admin Suite** | `src/utils/DevManager.js`<br>`src/stores/StudioStore.js` | `src/config/gdd.js`<br>`src/data/gdd_seed.js`<br>`src/data/*.js` | `src/components/GodEditor.jsx`<br>`src/components/Administrator/*Editor.jsx`<br>`public/devtools.html` |
| **In-Game Shell UI & HUD Layout** | `src/managers/ui/UIManager.js`<br>`src/managers/ui/LayoutManager.js`<br>`src/managers/ui/ModalManager.js` | `src/managers/ui/SettingsManager.js` | `src/App.jsx`<br>`src/components/Visualizer/PlayerView.jsx`<br>`public/player.html` |

---

## 2. Core Architectural Invariants

### A. The Single Source of Truth (SSOT)
* `src/config/gdd.js` flattens all individual data tables into the universal master `items` dictionary.
* Never manually hardcode standalone gear stats inside components or managers without aligning with `gdd.js`.

### B. Strict Item Object Schema
Whenever generating, modifying, or transferring items (via `DevManager`, `MerchantManager`, `systems.js`, etc.), the item instance **must** preserve these keys:
```javascript
{
  id: "BaseRegistryID",
  uuid: crypto.randomUUID(),
  instanceId: "GEN_TYPE_TIMESTAMP_RAND",
  name: "Item Name",
  tier: 1,
  qualityMultiplier: 1.0,  // 0.75 - 1.5 for Shadows, 0.5 for Echoes
  sockets: 2,              // Strict Schema: Integer capacity
  socketedGems: [],        // Strict Schema: Array of gem instances
  enchantments: []         // Array of rolled magic affixes
}
```

### C. Scaling Math & Damage Model
* **Player Damage (Division Curve):** `(90 * Player_WC_or_SC) / Monster_AC`
* **Monster Damage (Division Curve):** `(90 * Monster_ATK) / (Player_AC * 0.5)`
* **Magic Tier Clamping:** `Math.max(1, Math.min(9, Math.ceil(itemTier / 2.25)))`

### D. MapEditor Internal Engine Protocols
* **Local vs Global State:** `MapEditor.jsx` maintains its own internal Zustand store (`useMapStore`) governing layer grids, tools, spawn points, and active trigger events, while synchronizing with `StudioStore.js` for master data persistence.
* **Auto-Trigger & Interaction Factory:** Placing objects (e.g. `theArmory`, `portalNew`, `sanctuaryReviveNew`) runs through `enrichObjectWithInteraction()`, binding automatic triggers directly to the `triggers` layer with appropriate action payloads (`openModule`, `teleport`).
* **Navigation Baking:** The collision matrix (`bakeCollisionData`) automatically scans both ground terrain (walls, empty void, liquids) and non-interactive obstacles to generate `0` (blocked) or `1` (walkable) grid states for A* pathfinding.

---

## 3. The 3-File Sharing Rule

When beginning a new feature or troubleshooting in chat, share only:
1. **The Manager / Logic Controller** (`src/managers/...` or `src/components/Visualizer/MapEditor.jsx`)
2. **The Source Data / Config Table** (`src/data/...` or `src/config/...`)
3. **The UI Component or Module** (`src/components/...` or `public/modules/...`)
