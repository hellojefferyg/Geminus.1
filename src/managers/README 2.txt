# Geminus - Refactored Code Structure

## 📁 New File Organization

```
geminus/
├── index.html                  # Main HTML (unchanged)
├── style.css                   # Styles (unchanged)
├── gdd.js                      # Game data (unchanged)
├── systems.js                  # Game logic (unchanged)
├── main.js                     # Application entry point (REFACTORED)
│
└── managers/
    ├── core/
    │   ├── DataManager.js      # Firebase & save/load
    │   ├── GameManager.js      # Main game initialization
    │   └── UIManager.js        # UI utility functions
    │
    ├── player/
    │   ├── CreationManager.js  # Character creation
    │   ├── ProfileManager.js   # XP, gold, leveling
    │   └── StatsManager.js     # Stats tab UI
    │
    ├── combat/
    │   ├── CombatManager.js    # Combat system & UI
    │   └── SanctuaryManager.js # Death/revival mechanics
    │
    ├── inventory/
    │   ├── InventoryManager.js # Inventory tab & logic
    │   └── EquipmentManager.js # Equipment tab & slots
    │
    ├── world/
    │   ├── MapDataStore.js     # Map data storage
    │   ├── MapLoader.js        # Map file loading
    │   ├── MapRenderer.js      # Canvas rendering
    │   ├── WorldMapManager.js  # Mini-map system
    │   └── ZoneManager.js      # Main zone rendering
    │
    ├── social/
    │   └── ChatManager.js      # Chat system
    │
    └── ui/
        ├── ModalManager.js     # Modal dialogs
        ├── LayoutManager.js    # Layout editor
        └── SettingsManager.js  # Settings tab
```

## 🎯 Key Benefits

### 1. **Easy to Find Code**

- Want to edit inventory UI? → `managers/inventory/InventoryManager.js`
- Need to change combat logic? → `managers/combat/CombatManager.js`
- Fixing the map system? → `managers/world/` folder

### 2. **Smaller Files**

- Old `managers.js`: **1000+ lines**
- New files: **100-400 lines each**
- Much easier to read and edit!

### 3. **Clear Dependencies**

Each manager imports only what it needs:

```javascript
import { races, items } from '../../gdd.js';
```

### 4. **No More Scrolling**

Find what you need instantly instead of scrolling through a massive file.

## 🔧 How to Edit the UI

### Example 1: Change the Stats Tab Layout

1. Open `managers/player/StatsManager.js`
1. Find the `render()` method
1. Edit the HTML template
1. Save and reload

### Example 2: Add a New Feature to Inventory

1. Open `managers/inventory/InventoryManager.js`
1. Add your new method (e.g., `sortByRarity()`)
1. Update `addEventListeners()` if needed
1. Save and test

### Example 3: Modify Combat UI

1. Open `managers/combat/CombatManager.js`
1. Edit the `render()` method for UI changes
1. Edit `fight()` or `performAction()` for logic changes

## 🔗 How Managers Connect

### Simple Dependency Pattern

```javascript
// In main.js
const combatManager = new CombatManager({
  state, ui, Systems, ProfileManager: profileManager
});
```

### Cross-Manager Communication

```javascript
// ProfileManager needs CombatManager
profileManager.setManagers({
  CombatManager: combatManager,
  StatsManager: statsManager
});
```

## 🚀 Adding a New Manager

### Step 1: Create the File

```javascript
// managers/yourCategory/YourManager.js
export class YourManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    // ... other dependencies
  }

  init() {
    // Initialization code
  }

  // Your methods here
}
```

### Step 2: Import in main.js

```javascript
import { YourManager } from './managers/yourCategory/YourManager.js';
```

### Step 3: Instantiate

```javascript
const yourManager = new YourManager({ state, ui });
```

### Step 4: Use It

```javascript
gameManager.setManagers({
  YourManager: yourManager,
  // ... other managers
});
```

## 📝 Common Tasks

### Task: Change the Equipment Grid Layout

**File:** `managers/inventory/EquipmentManager.js`
**Method:** `renderEquipmentView()`

### Task: Add New Chat Features

**File:** `managers/social/ChatManager.js`
**Methods:** `init()`, `addEventListeners()`, `sendMessage()`

### Task: Modify Map Rendering

**File:** `managers/world/MapRenderer.js`
**Method:** `draw()`

### Task: Change Theme Colors

**File:** `managers/ui/SettingsManager.js`
**Method:** `setTheme()`

### Task: Add Player Stats

**File:** `managers/player/StatsManager.js`
**Property:** `statMetadata` object

## ⚠️ Important Notes

### Files You DON’T Need to Touch

- `gdd.js` - Game data is still centralized
- `systems.js` - Core game logic is unchanged
- `style.css` - Styles are separate
- `index.html` - HTML structure is the same

### When to Update Multiple Files

Some features span multiple managers:

- **Adding a new item type**: Update `gdd.js`, `InventoryManager.js`, `EquipmentManager.js`
- **New stat system**: Update `systems.js`, `StatsManager.js`, `ProfileManager.js`
- **New map feature**: Update `MapRenderer.js`, `ZoneManager.js`, `WorldMapManager.js`

## 🐛 Debugging Tips

### Manager Not Loading?

1. Check import path in `main.js`
1. Verify class name matches file name
1. Check browser console for errors

### Manager Not Initializing?

1. Check if `init()` is called in `GameManager.js`
1. Verify dependencies are passed correctly
1. Check for circular dependency issues

### Cross-Manager Communication Failing?

1. Verify `setManagers()` was called
1. Check the manager isn’t null
1. Add console.logs to trace the issue

## 🎓 Learning the Codebase

### Start Here (Easiest to Hardest)

1. **ModalManager** - Simple, no dependencies
1. **SettingsManager** - Basic UI handling
1. **StatsManager** - UI + some logic
1. **InventoryManager** - Complex UI + filtering
1. **CombatManager** - Game logic + UI
1. **GameManager** - Orchestrates everything

### Follow a Feature Path

**Example: How equipment works**

1. User clicks item → `InventoryManager.showItemActionModal()`
1. User clicks “Equip” → `InventoryManager.equipItem()`
1. Equipment updates → `Systems.calculateDerivedStats()`
1. UI refreshes → `EquipmentManager.renderEquipmentView()`

## 💡 Best Practices

1. **Keep managers focused** - One manager, one responsibility
1. **Use dependency injection** - Pass dependencies in constructor
1. **Avoid circular dependencies** - Use `setManagers()` for cross-refs
1. **Document complex logic** - Add comments for tricky code
1. **Test in isolation** - Each manager should work independently

## 🔄 Migration Guide

### From Old Code

```javascript
// OLD: Everything in managers.js
const ProfileManager = {
  addXp(amount) { ... }
};
```

### To New Code

```javascript
// NEW: Dedicated file
export class ProfileManager {
  constructor(deps) { ... }
  addXp(amount) { ... }
}
```

-----

**Ready to start editing?** Pick any manager file and dive in! The code is now organized, modular, and much easier to work with. 🎮