import Systems from './utils/systems.js';
import { VaultManager } from './managers/economy/VaultManager.js';
import { MerchantManager } from './managers/economy/MerchantManager.js';
import { 
    initializeGlobals, DataManager, ChatManager, SettingsManager, MapDataStore, MapLoader, MapRenderer, WorldMapManager, 
    ModalManager, CreationManager, ProfileManager, CombatManager, SanctuaryManager, 
    StatsManager, InventoryManager, EquipmentManager, UIManager, GameManager, 
    LayoutManager, ZoneManager 
} from './managers.js';

// --- App State & Config ---
let state = {
  // Initialized as null; populated with race and gender during Creation
  player: null, 
  
  // NEW: Global defaults for asset pathing logic
  settings: {
      defaultGender: 'female' 
  },
  ui: {
isFocused: false,
isLayoutEditMode: false,
selectedInventoryId: null,
selectedGemId: null,
activeTab: 'socket',
activeSocketView: 'visual',
selectedGemForSocketing: null,
itemFilter: { category: 'All', subType: 'All', tier: 'All' },
gemFilter: { type: 'All', grade: 'All' }
},
game: { combatActive: false, currentZoneId: null, globalJackpot: 0},
zone: {
name: "No Zone Loaded",
},
keyState: { up: false, left: false, down: false, right: false, interact: false },
firebase: {
db: null,
auth: null,
userId: null,
playerDocRef: null,
},
chat: {
currentChannel: 'main',
unsubscribeListener: null,
}
};

// --- Zone Data ---
// As requested, placeholder map data has been removed to create a clean slate.
// The game will now require a map to be imported via the Settings tab to begin.
const embeddedZoneData = null;

// --- UI Elements ---
const ui = {};
document.querySelectorAll('[id]').forEach(el => {
const camelCaseId = el.id.replace(/-(\w)/g, (m, g) => g.toUpperCase());
ui[camelCaseId] = el;
});

// --- Utility Functions ---
function showToast(message, isError = false) {
ui.toastNotification.textContent = message;
ui.toastNotification.className = `glass-panel fixed left-1/2 -translate-x-1/2 z-[210] transition-all duration-500 ease-in-out px-6 py-3 rounded-lg font-semibold ${isError ? 'toast-error' : 'toast-success'}`;
ui.toastNotification.style.bottom = '5rem';
setTimeout(() => { ui.toastNotification.style.bottom = '-100px'; }, 3000);
}

// --- Smoke Canvas Animation ---
// Change lines 54-55 to this safety check:
const smokeCanvas = document.getElementById('smoke-canvas');
const smokeCtx = smokeCanvas ? smokeCanvas.getContext('2d') : null;
if (smokeCanvas) {
    smokeCanvas.width = window.innerWidth;
    smokeCanvas.height = window.innerHeight;
}
let smokeParticles = [];
const smokeParticleCount = 75;

class SmokeParticle {
constructor(color) {
this.x = Math.random() * smokeCanvas.width;
this.y = Math.random() * smokeCanvas.height;
this.size = Math.random() * 150 + 50;
this.speedX = Math.random() * 0.4 - 0.2;
this.speedY = Math.random() * 0.4 - 0.2;
this.color = color;
}
update() {
this.x += this.speedX;
this.y += this.speedY;
if (this.x < -this.size) this.x = smokeCanvas.width + this.size;
if (this.x > smokeCanvas.width + this.size) this.x = -this.size;
if (this.y < -this.size) this.y = smokeCanvas.height + this.size;
if (this.y > smokeCanvas.height + this.size) this.y = -this.size;
}
draw() {
smokeCtx.fillStyle = this.color;
smokeCtx.beginPath();
smokeCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
smokeCtx.filter = 'blur(60px)';
smokeCtx.fill();
}
}

function initSmokeParticles(theme) {
smokeParticles = [];
const color = theme === 'molten-core'
? `rgba(249, 115, 22, ${Math.random() * 0.07})`
: `rgba(34, 211, 238, ${Math.random() * 0.07})`;
for (let i = 0; i < smokeParticleCount; i++) {
smokeParticles.push(new SmokeParticle(color));
}
}

function updateSmokeParticleColors(theme) {
const color = theme === 'molten-core'
? `rgba(249, 115, 22, ${Math.random() * 0.07})`
: `rgba(34, 211, 238, ${Math.random() * 0.07})`;
smokeParticles.forEach(p => {
p.color = color;
});
}

function animateSmoke() {
smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
for (let i = 0; i < smokeParticles.length; i++) {
smokeParticles[i].update();
smokeParticles[i].draw();
}
requestAnimationFrame(animateSmoke);
}

window.addEventListener('resize', () => {
smokeCanvas.width = window.innerWidth;
smokeCanvas.height = window.innerHeight;
const currentTheme = localStorage.getItem('geminusTheme') || 'aetherial-shard';
initSmokeParticles(currentTheme);
if(WorldMapManager.isInitialized) {
WorldMapManager.isInitialized = false; // Force re-init to handle canvas resize
WorldMapManager.init();
}
if(ZoneManager.isInitialized) {
    ZoneManager.resizeCanvas();
    ZoneManager.draw();
}
});

// --- Controls System ---
function initControls() {
const keyElements = document.querySelectorAll('.game-key');
const setKeyState = (key, isPressed) => {
state.keyState[key] = isPressed;
document.querySelectorAll(`[data-key="${key}"]`).forEach(el => el.classList.toggle('pressed', isPressed));
};
const handleKeyPress = (key) => {
    if (!state.player || !ZoneManager.isLoaded) return;
    let dx = 0, dy = 0;
    switch(key) {
        case 'up': dy = -1; break;
        case 'down': dy = 1; break;
        case 'left': dx = -1; break;
        case 'right': dx = 1; break;
        case 'interact':
            SanctuaryManager.revivePlayer();
            return;
    }
    const newX = state.player.pos.x + dx;
    const newY = state.player.pos.y + dy;
    const mapSize = MapDataStore.data.mapSize;
    const navigationLayer = MapDataStore.data.layers.find(l => l.id === 'navigation');
    
    // Check if the new position is within map bounds and is walkable
    if (newX >= 0 && newX < mapSize.width && newY >= 0 && newY < mapSize.height && navigationLayer.grid[newY][newX].isWalkable) {
        state.player.pos.x = newX;
        state.player.pos.y = newY;
        ZoneManager.draw();
        WorldMapManager.draw();
        UIManager.updatePlayerStatusUI();
    }
};
keyElements.forEach(element => {
const key = element.dataset.key;
if (!key) return;
element.addEventListener('touchstart', (e) => { e.preventDefault(); setKeyState(key, true); handleKeyPress(key); }, { passive: false });
element.addEventListener('touchend', (e) => { e.preventDefault(); setKeyState(key, false); }, { passive: false });
element.addEventListener('mousedown', (e) => { e.preventDefault(); setKeyState(key, true); handleKeyPress(key); });
element.addEventListener('mouseup', (e) => { e.preventDefault(); setKeyState(key, false); });
element.addEventListener('mouseleave', () => { if (state.keyState[key]) setKeyState(key, false); });
});
window.addEventListener('keydown', (e) => {
if(document.activeElement.tagName === 'INPUT') return;
let key;
switch(e.key) {
case 'ArrowUp': case 'w': key = 'up'; break;
case 'ArrowDown': case 's': key = 'down'; break;
case 'ArrowLeft': case 'a': key = 'left'; break;
case 'ArrowRight': case 'd': key = 'right'; break;
case 'Enter': case ' ': key = 'interact'; break;
default: return;
}
e.preventDefault();
if (!state.keyState[key]) {
setKeyState(key, true);
handleKeyPress(key);
}
});
window.addEventListener('keyup', (e) => {
if(document.activeElement.tagName === 'INPUT') return;
let key;
switch(e.key) {
case 'ArrowUp': case 'w': key = 'up'; break;
case 'ArrowDown': case 's': key = 'down'; break;
case 'ArrowLeft': case 'a': key = 'left'; break;
case 'ArrowRight': case 'd': key = 'right'; break;
case 'Enter': case ' ': key = 'interact'; break;
default: return;
}
e.preventDefault();
setKeyState(key, false);
});
}

// --- Main Initialization ---
/**
 * Main Initialization - MAGI-TECH ASYNC SYNC
 * This version connects all managers and handles the asynchronous loading
 * required for GitHub asset resonance.
 */
async function main() {
    // 1. Initialize globals so all managers and UI modules can see the 'brain'
    initializeGlobals({
        state, ui, showToast, MapDataStore, embeddedZoneData, 
        updateSmokeParticleColors, initSmokeParticles,
        DataManager, GameManager, ZoneManager, CombatManager, Systems,
        InventoryManager, EquipmentManager, StatsManager, ProfileManager, ChatManager
    });

    // 2. Instantiate the Game Manager (The Heart)
    const gameManager = new GameManager({
        state, ui, embeddedZoneData, showToast, Systems
    });
    
    
    // 3. Plug in ALL separate manager modules from your managers folder
    // We create the modalManager instance first so we can pass it to others
    const modalManager = new ModalManager({ ui });

    // Create MapDataStore first so it can be passed to other managers
    const mapDataStore = new MapDataStore();

    // [UPDATED] Instantiate DataManager EARLY so it can be passed to others
    const dataManager = new DataManager({ state, showToast, ModalManager: modalManager });

    // [NEW] Instantiate VaultManager (Step 17)
    const vaultManager = new VaultManager({ state, showToast, DataManager: dataManager });
    
    gameManager.setManagers({
        DataManager: dataManager, // [UPDATED] Use the instance created above
        UIManager: new UIManager({ state, ui }), 
        MapDataStore: mapDataStore,
        ChatManager: new ChatManager({ state, ui, showToast }),
        CombatManager: new CombatManager({ state, ui, showToast, Systems }),
        InventoryManager: new InventoryManager({ state, ui, showToast, Systems, ModalManager: modalManager }),
        EquipmentManager: new EquipmentManager({ state, ui, showToast, Systems, ModalManager: modalManager }),
        StatsManager: new StatsManager({ state, ui, Systems }),
        ProfileManager: new ProfileManager({ state, ui, showToast, Systems, DataManager: dataManager }),
        SettingsManager: new SettingsManager({ state, ui, showToast }),
        WorldMapManager: new WorldMapManager({ state, ui, MapRenderer, MapDataStore: mapDataStore }),
        LayoutManager: new LayoutManager({ state, ui }),
        ModalManager: modalManager,
        CreationManager: new CreationManager({ state, ui, showToast, ModalManager: modalManager, Systems }),
        // [FIX] Passed DataManager to SanctuaryManager (was missing)
        SanctuaryManager: new SanctuaryManager({ state, ui, DataManager: dataManager }),
        VaultManager: vaultManager // [NEW] Step 17
    });

    // 4. Final internal wiring (The Handshake)
    // Connect DataManager to the engine
    gameManager.DataManager.setManagers({ 
        GameManager: gameManager,
        CreationManager: gameManager.CreationManager
    });

    // Ensure CreationManager can talk to the UI to update your name/race
    gameManager.CreationManager.setManagers({
        DataManager: gameManager.DataManager,
        UIManager: gameManager.UIManager, 
        GameManager: gameManager
    });
    
    // This line will now work because UIManager is no longer undefined
    gameManager.UIManager.setManagers({
        GameManager: gameManager,
        DataManager: gameManager.DataManager
    });

    // [FIX] Wire ProfileManager and UI into CombatManager
    if (gameManager.CombatManager) {
        gameManager.CombatManager.setManagers({
            ProfileManager: gameManager.ProfileManager,
            SanctuaryManager: gameManager.SanctuaryManager,
            UIManager: gameManager.UIManager // [NEW] Added this line
        });
    }

    // [NEW] Wire SanctuaryManager to Profile & Combat (For Revival UI updates)
    if (gameManager.SanctuaryManager) {
        gameManager.SanctuaryManager.setManagers({
            ProfileManager: gameManager.ProfileManager,
            CombatManager: gameManager.CombatManager
        });
    }

    // [NEW] Step 17: Wire ProfileManager into VaultManager
    gameManager.VaultManager.setManagers({
        ProfileManager: gameManager.ProfileManager
    });

    // [CRITICAL FIX] Wire Dependencies into ProfileManager
    // Without this, the Stats Tab will NOT update when you level up.
    gameManager.ProfileManager.setManagers({
        StatsManager: gameManager.StatsManager,
        CombatManager: gameManager.CombatManager,
        UIManager: gameManager.UIManager
    });

    // [CRITICAL FIX] Connect EquipmentManager to the Brain
    // This ensures equipping items recalculates your damage
    gameManager.EquipmentManager.setManagers({
        InventoryManager: gameManager.InventoryManager,
        ProfileManager: gameManager.ProfileManager,
        Systems: Systems
    });

    // Create ZoneManager and MapLoader after other managers are set (they need MapDataStore)
    const zoneManager = new ZoneManager({ state, ui, MapRenderer, MapDataStore: mapDataStore });
    const mapLoader = new MapLoader({ MapDataStore: mapDataStore, ZoneManager: zoneManager, showToast });
    
    // Wire them into GameManager
    gameManager.ZoneManager = zoneManager;
    gameManager.MapLoader = mapLoader;
    gameManager.MapDataStore = mapDataStore;
    // [NEW] Initialize Merchant System
    gameManager.MerchantManager = new MerchantManager({
        state: state, // <--- ADD THIS LINE
        gameManager: gameManager,
        ui: ui
    });
    
    // Set up ZoneManager's late dependencies
    zoneManager.setManagers({
        WorldMapManager: gameManager.WorldMapManager,
        UIManager: gameManager.UIManager
    });
    
    // Wire MapLoader into SettingsManager
    if (gameManager.SettingsManager) {
        gameManager.SettingsManager.setMapLoader(mapLoader);
    }
    
    // Wire CombatManager into ZoneManager for battle interactions
    if (zoneManager && gameManager.CombatManager) {
        zoneManager.setManagers({
            WorldMapManager: gameManager.WorldMapManager,
            UIManager: gameManager.UIManager,
            CombatManager: gameManager.CombatManager
        });
    }
    
    // Expose gameManager globally for interaction handlers
    window.gameManager = gameManager;

    // 5. Start the engine - MAGI-TECH SYNC: Wait for asset materialization
    console.log("⚛️ Geminus Engine: Initiating startup resonance...");
    await gameManager.init();
    
    // 6. ALIGNMENT FIX: Resize the canvas BEFORE the curtain rises
    // This fixes the "NW drift" by ensuring hex math matches actual screen pixels.
    if (gameManager.ZoneManager) {
        gameManager.ZoneManager.resizeCanvas();
        gameManager.ZoneManager.draw(); // Force a fresh draw with new dimensions
    }

    // 7. Dismiss the loading curtain ONLY after assets and alignment are ready
    if (ui.loadingScreen) {
        ui.loadingScreen.classList.add('fade-out');
        console.log("⚛️ Geminus: Loading screen dismissed.");
    }
    
    // 8. Check for a missing player and trigger creation if needed
    if (!state.player && gameManager.CreationManager) {
        console.log("🌑 No Player Echo detected. Triggering Creation Flow...");
        gameManager.CreationManager.init();
    }
    
    console.log("🚀 Geminus Engine: All systems online and integrated.");
}

document.addEventListener('DOMContentLoaded', main);
