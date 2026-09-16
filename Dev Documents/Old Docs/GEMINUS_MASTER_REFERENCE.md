# Geminus Engine — Master Subsystem Dependency Map & Reference Guide

This reference document outlines the exact architecture, data pipelines, and file dependencies across the Geminus game engine. Keep this file in your project root or `docs/` folder to quickly reference which files to inspect when tuning or modifying any system.

---

## 1. Subsystem Quick-Reference Matrix

| Subsystem / Domain | Logic / Engine Files | Data & Schema Files | UI / Component / View |
| :--- | :--- | :--- | :--- |
| **Combat & Damage Balancing** | `src/utils/systems.js`<br>`src/managers/combat/CombatManager.js` | `src/config/gdd.js`<br>`src/data/bestiaryData.js`<br>`src/data/monsterTitles.js` | `#combat-modal`<br>`#tab-content-combat`<br>`public/modules/battle.html` |
| **Monster Forge / Auto-Balancing** | `src/utils/DevManager.js` (`forgeZone`, `forgeEntireBestiary`) | `src/data/zonesData.js`<br>`src/config/gdd.js` | Browser Dev Console |
| **Gear, Sockets & Inventory** | `src/managers/inventory/InventoryManager.js`<br>`src/managers/inventory/EquipmentManager.js` | `src/config/gdd.js` (`items`, `equipmentSlotConfig`)<br>`src/data/armoryData.js`<br>`src/data/jewelryData.js`<br>`src/data/gemsData.js` | `#tab-content-inventory`<br>`#tab-content-equipment` |
| **Loot Drops, Shadows & Echoes** | `src/utils/systems.js` (`generateLoot`, `generateShadowLoot`, `generateEnchantments`) | `src/data/dropTables.js`<br>`src/data/enchantmentData.js`<br>`src/config/gdd.js` | `CombatManager.js` (Loot log / Floaters) |
| **The Soulforge & Shattering** | `src/utils/systems.js` (`rerollEnchantment`)<br>`src/utils/InteractionBridge.js` | `src/data/soulforgeData.js`<br>`src/data/resourceData.js` (`crafting_resources`) | `public/modules/soulforge.html` |
| **Economy, Shops & Gilded Vault** | `src/managers/economy/MerchantManager.js`<br>`src/managers/economy/VaultManager.js` | `src/data/vaultData.js`<br>`src/data/resourceData.js` | `public/modules/armory.html`<br>`public/modules/arcanum.html`<br>`public/modules/gilded_vault.html`<br>`public/modules/market.html` |
| **Clans & Bastion Upgrades** | `src/utils/InteractionBridge.js` (`UPGRADE_BUILDING`) | `src/data/clanData.js`<br>`src/data/resourceData.js` (`war_materials`) | `public/modules/clan_hall.html` |
| **Soul Debt & Resurrection** | `src/managers/combat/SanctuaryManager.js`<br>`src/managers/core/DataManager.js` | `src/utils/systems.js` (Tithe calculation) | `public/modules/sanctuary.html` |
| **World Map, Zones & Pathfinding** | `src/managers/world/ZoneManager.js`<br>`src/managers/world/WorldMapManager.js`<br>`src/managers/core/GameManager.js` | `public/data/zones/*.json`<br>`public/data/zones/manifest.json`<br>`src/data/zonesData.js` | `src/managers/world/MapRenderer.js`<br>`public/player.html` |
| **Map Triggers & Bridge Modals** | `src/config/InteractionRegistry.js`<br>`src/config/ModuleMap.js`<br>`src/utils/InteractionBridge.js` | `src/types/InteractionTypes.js` | `src/components/InteractionModal.jsx`<br>`#module-overlay` |

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

---

## 3. The 3-File Sharing Rule

When beginning a new feature or troubleshooting in chat, share only:
1. **The Manager / Logic Controller** (`src/managers/...`)
2. **The Source Data / Config Table** (`src/data/...` or `src/config/...`)
3. **The UI Component or Module** (`src/components/...` or `public/modules/...`)
