import React, { useState, useRef, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { useStudioStore } from '../../stores/StudioStore';
import CombatScreen from './CombatScreen';
import {
  User, X, Map as MapIcon, Anchor, Minimize2, Maximize2, 
  Gamepad2, Sword, Skull, Coins, Zap
} from 'lucide-react';

// --- SHARED CONSTANTS & UTILS (PRESERVED FOR 1:1 RENDERING) ---
export const TILE_SIZE = 64;
const BIOME_COLORS = { 
    forest: '#4A6B4A', desert: '#D2B48C', tundra: '#FFFAFA', mountain: '#696969', swamp: '#556B2F', jungle: '#006400', volcanic: '#2F4F4F', plains: '#90EE90', ocean: '#1E90FF', wasteland: '#CD853F',
    savanna: '#E4A672', taiga: '#465945', wetlands: '#5A6349', badlands: '#B97C5B', archipelago: '#2E8B57',
    fungalForest: '#8A2BE2', crystallineCaves: '#AFEEEE', corruptedLands: '#4B0082', feywild: '#FF69B4', shadowlands: '#483C32', celestialPlains: '#F0E68C',
    Clear: 'rgba(0,0,0,0)',
};
const BIOME_FONTS = {
    default: 'Cinzel',
    forest: 'MedievalSharp', plains: 'MedievalSharp', savanna: 'MedievalSharp', jungle: 'MedievalSharp', taiga: 'MedievalSharp', swamp: 'MedievalSharp', wetlands: 'MedievalSharp',
    mountain: 'Uncial Antiqua', tundra: 'Uncial Antiqua', badlands: 'Uncial Antiqua', desert: 'Uncial Antiqua',
    volcanic: 'Orbitron', wasteland: 'Orbitron', corruptedLands: 'Orbitron', shadowlands: 'Orbitron',
    feywild: 'MedievalSharp', fungalForest: 'Uncial Antiqua', crystallineCaves: 'Uncial Antiqua', celestialPlains: 'Cinzel',
};
const hexUtils = { getHexPoints: (size) => { const p = []; for (let i = 0; i < 6; i++) { const a = (Math.PI / 180) * (60 * i + 30); p.push(size * Math.cos(a), size * Math.sin(a)); } return p; } };
const isoUtils = { toScreen: (x, y, s) => ({ x: (x - y) * (s / 2), y: (x + y) * (s / 4) }) };
const getTileCenter = (x, y, view, tileType, mapSize) => {
    let center = { x: 0, y: 0 };
    const mapCenterX = Math.floor(mapSize.width / 2);
    const mapCenterY = Math.floor(mapSize.height / 2);

    if (view === 'isometric') {
        if (tileType === 'square') {
            center = isoUtils.toScreen(x - mapCenterX, y - mapCenterY, TILE_SIZE);
        } else { 
            const s = TILE_SIZE / 2, w = Math.sqrt(3) * s, h = 2 * s, o = (y % 2 !== 0) ? w / 2 : 0; 
            center = { x: (x - mapCenterX) * w + o, y: (y - mapCenterY) * h * 0.75 }; 
        }
    } else {
        if (tileType === 'square') {
            center = { x: (x - mapCenterX + 0.5) * TILE_SIZE, y: (y - mapCenterY + 0.5) * TILE_SIZE };
        } else { 
            const s = TILE_SIZE / Math.sqrt(3), w = Math.sqrt(3) * s, h = 2 * s, o = (y % 2 !== 0) ? w / 2 : 0; 
            center = { x: (x - mapCenterX) * w + o, y: (y - mapCenterY) * h * 0.75 }; 
        }
    }
    return center;
};
const hexToRgba = (hex, alpha) => {
    if (!hex) return `rgba(128, 128, 128, ${alpha})`;
    if (hex.startsWith('rgba')) return hex;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const stringToColor = (str) => {
    let hash = 0; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); } let color = '#'; for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xFF; color += ('00' + value.toString(16)).substr(-2); } return color;
};

// --- A* PATHFINDING (KEPT FOR MOVEMENT) ---
const aStar = (grid, start, end, tileType = 'square') => {
    const rows = grid.length;
    const cols = grid[0].length;
    const nodes = [];
    for (let y = 0; y < rows; y++) {
        nodes[y] = [];
        for (let x = 0; x < cols; x++) {
            nodes[y][x] = { x, y, f: 0, g: 0, h: 0, parent: null, isWall: grid[y][x] === 0, closed: false, opened: false };
        }
    }
    const heuristic = (a, b) => {
        if (tileType === 'square') return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        const toCube = (n) => { const cx = n.x - (n.y - (n.y & 1)) / 2; const cz = n.y; return { x: cx, y: -cx - cz, z: cz }; };
        const ac = toCube(a), bc = toCube(b);
        return (Math.abs(ac.x - bc.x) + Math.abs(ac.y - bc.y) + Math.abs(ac.z - bc.z)) / 2;
    };
    const startNode = nodes[start.y][start.x];
    const endNode = nodes[end.y][end.x];
    let openSet = [startNode];
    startNode.opened = true;
    startNode.isWall = false; // Always allow starting hex
    endNode.isWall = false;   // Always allow target hex (collision checked before call)

    while (openSet.length > 0) {
        let lowestIndex = 0;
        for (let i = 0; i < openSet.length; i++) { if (openSet[i].f < openSet[lowestIndex].f) lowestIndex = i; }
        let current = openSet[lowestIndex];
        if (current === endNode) { let path = []; while (current.parent) { path.push(current); current = current.parent; } return path.reverse(); }
        openSet.splice(lowestIndex, 1); current.closed = true;
        const { x, y } = current;
        let dirs;
        if (tileType === 'hex') {
            dirs = (y % 2 !== 0) ? [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]] : [[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]];
        } else { dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]; }
        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                const neighbor = nodes[ny][nx];
                if (neighbor.closed || neighbor.isWall) continue;
                let gScore = current.g + 1; let better = false;
                if (!neighbor.opened) { better = true; neighbor.opened = true; openSet.push(neighbor); } else if (gScore < neighbor.g) { better = true; }
                if (better) { neighbor.parent = current; neighbor.g = gScore; neighbor.h = heuristic(neighbor, endNode); neighbor.f = neighbor.g + neighbor.h; }
            }
        }
    }
    return [];
};
// --- COLLISION BAKING LOGIC (RESTORED) ---
// Ensures movement works even if the JSON is missing a navigation layer
const bakeCollisionData = (layers, mapSize, assetLibrary) => {
    const navigationGrid = Array.from({ length: mapSize.height }, () => Array(mapSize.width).fill(1));
    const objectLayer = layers.find(l => l.id === 'objects');
    const groundLayer = layers.find(l => l.id === 'ground');

    for (let y = 0; y < mapSize.height; y++) {
        for (let x = 0; x < mapSize.width; x++) {
            // 1. Check Ground (Liquids/Voids)
            if (groundLayer?.grid[y][x]) {
                const type = groundLayer.grid[y][x].type;
                if (['wall', 'empty', 'water', 'lava'].includes(type)) {
                    navigationGrid[y][x] = 0;
                    continue; 
                }
            }
            // 2. Check Objects (Natural Obstacles without interactions)
            const objectTile = objectLayer?.grid[y][x];
            if (objectTile && objectTile.assetId) {
                const asset = assetLibrary[objectTile.assetId];
                const props = objectTile.properties || {};
                if (asset) {
                    const isNaturalObstacle = asset.type === 'Natural Obstacles';
                    const hasInteraction = props.interactionType && props.interactionType !== 'none';
                    if (isNaturalObstacle && !hasInteraction) navigationGrid[y][x] = 0;
                    if (props.isTraversable === false) navigationGrid[y][x] = 0;
                }
            }
        }
    }
    return navigationGrid;
};
// --- STYLES ---
const StyleInjector = () => {
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            :root { --bg-dark-teal: #273b40; --highlight-powder-blue: #cae9ea; --grounding-black: #1d1d1d; --shadow-dark-grey: #3c4748; --glow-vibrant-teal: #208c8c; }
            body { font-family: 'Inter', sans-serif; color: var(--highlight-powder-blue); background-color: var(--grounding-black); overscroll-behavior: contain; margin: 0; padding: 0; overflow: hidden; }
            .glass-panel { background: rgba(29, 29, 29, 0.45); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--shadow-dark-grey); box-shadow: 0 4px 25px rgba(0, 0, 0, 0.5); }
            .loading-bridge { background: #000; background-size: cover; background-position: center; }
            .loading-spinner { width: 60px; height: 60px; border: 4px solid rgba(0,255,255,0.1); border-left-color: #00ffff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
        const fontFamilies = ['Cinzel:wght@400;700', 'MedievalSharp', 'Uncial+Antiqua', 'Orbitron:wght@500'];
        const fontLink = document.createElement('link');
        fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
        return () => { document.head.removeChild(style); document.head.removeChild(fontLink); };
    }, []);
    return null;
};

// --- GAME STATE STORE ---
// Derived from useMapStore but strict readonly on world data
const useGameStore = create((set, get) => ({
    // World Data
    zones: {},
    activeZoneId: null,
    
    // Active Zone State
    zid: '', zoneName: '', biome: 'plains', 
    mapSize: { width: 1, height: 1 }, 
    layers: [], 
    triggers: {}, 
    assetLibrary: {},
    
    // Player State
    playerPosition: null,
    isMoving: false,
    
    // Visuals
    view: 'topDown', tileType: 'hex', tileOpacity: 0.5,
    backgroundImageData: null,
    backgroundAnimation: 'none', animationSpeed: 1,
    aiStyle: 'Photorealistic', aiMood: 'Vibrant', aiKeywords: '',
    
    // Camera
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    
    // UI State
    activeModule: null,
    isTransitioning: false,
    toastMessage: '',
    showCombat: false,
    activeBattleMob: null,
    pendingEncounter: null,

    // Actions
    setField: (field, value) => set({ [field]: value }),
    
    setToast: (msg) => {
        set({ toastMessage: msg });
        setTimeout(() => set({ toastMessage: '' }), 3000);
    },

    setActiveZone: async (newZoneId) => {
        const state = get();
        const target = state.zones[newZoneId];

        // 1. Lazy Load Logic
        if (target && target.isLazy) {
            console.log(`📡 Fetching Zone Data: ${newZoneId}...`);
            try {
                const res = await fetch(`/data/zones/${newZoneId}.json`);
                if (!res.ok) throw new Error(`Could not find ${newZoneId}.json`);
                const fullData = await res.json();
                
                // Update Global Registry
                const updatedZones = { ...state.zones, [newZoneId]: { ...fullData, isLazy: false } };
                set({ zones: updatedZones });
                
                // Set Active State
                get().injectZoneData(fullData);
            } catch (e) {
                console.error("Zone load failed:", e);
                get().setToast(`Failed to travel to ${newZoneId}`);
                return;
            }
        } else if (target) {
            // Already loaded
            get().injectZoneData(target);
        }
    },

    injectZoneData: (data) => {
        set({
            activeZoneId: data.zid,
            zid: data.zid,
            zoneName: data.zoneName,
            biome: data.biome,
            mapSize: data.mapSize,
            layers: data.layers,
            triggers: data.triggers || {},
            assetLibrary: data.assetLibrary || {},
            backgroundImageData: data.backgroundImageData,
            backgroundAnimation: data.backgroundAnimation || 'none',
            animationSpeed: data.animationSpeed || 1,
            // Reset Camera
            zoom: 1,
            panOffset: { x: 0, y: 0 },
            isTransitioning: false
        });

        // [CRITICAL] FORCE COLLISION BAKE
        // Ensures walls/water block movement even if the JSON lacks a nav layer
        if (!data.layers.find(l => l.type === 'navigation')) {
            const bakedGrid = bakeCollisionData(data.layers, data.mapSize, data.assetLibrary || {});
            set(state => ({
                layers: [
                    ...state.layers,
                    { id: 'nav-auto-baked', type: 'navigation', grid: bakedGrid, isVisible: false, opacity: 0 }
                ]
            }));
        }

        // Trigger center view
        setTimeout(() => get().centerCameraOnPlayer(), 100);
    },

    centerCameraOnPlayer: () => {
        const state = get();
        const { playerPosition, mapSize, zoom } = state;
        if (!playerPosition) return;
        
        const mapCenterX = Math.floor(mapSize.width / 2);
        const mapCenterY = Math.floor(mapSize.height / 2);
        
        const r = playerPosition.y - mapCenterY;
        const q = playerPosition.x - Math.floor((r - (r & 1)) / 2) - mapCenterX;
        
        const worldX = TILE_SIZE * Math.sqrt(3) * (q + r / 2);
        const worldY = TILE_SIZE * (3 / 2) * r * (2 / 3);

        set({ panOffset: { x: -worldX * zoom, y: -worldY * zoom } });
    },

    snapToCoord: (x, y) => {
        const state = get();
        const center = getTileCenter(x, y, state.view, state.tileType, state.mapSize);
        set({ panOffset: { x: -center.x, y: -center.y }, zoom: 1.0 });
    }
}));

// --- MODULE RENDERER (SHOPS/INVENTORY) ---
const ModuleRenderer = ({ moduleId, onClose }) => {
    const FILE_MAP = {
        'armory_shop': 'armory.html', 'theArmory': 'armory.html', 
        'arcanum_shop': 'arcanum.html', 'theArcanumNew': 'arcanum.html',
        'gilded_vault_storage': 'gilded_vault.html', 'gildedVaultNew': 'gilded_vault.html',
        'soulforge': 'soul_forge.html', 'soulforgeNew': 'soul_forge.html',
        'sanctuary_revive_point': 'sanctuary.html', 'sanctuaryReviveNew': 'sanctuary.html',
        'estate_bank': 'estate_bank.html', 'teleport_ui': 'world_map.html',
        'mob_select': 'bestiary.html', 'quest_board': 'quest_board.html',
        'market': 'market.html', 'clan_hall': 'clan_hall.html'
    };
    const fileName = FILE_MAP[moduleId] || `${moduleId}.html`;
    const filePath = `/modules/${fileName}`;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-10">
            <div className="relative w-full max-w-5xl h-full max-h-[85vh] glass-panel shadow-2xl rounded-xl flex flex-col animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-2 right-2 z-[200] p-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-xl border-2 border-white/20 active:scale-90 transition-all">
                    <X size={24} strokeWidth={3} />
                </button>
                <iframe src={filePath} className="w-full h-full border-0 bg-white/5" title={`Module: ${moduleId}`} />
            </div>
        </div>
    );
};

// --- MAIN PLAYER COMPONENT ---
export default function PlayerUI() {
    const { 
        zones, activeZoneId, zid, zoneName, biome, mapSize, layers, triggers, 
        playerPosition, isMoving, view, tileType, tileOpacity, zoom, panOffset,
        backgroundImageData, backgroundAnimation, animationSpeed,
        activeModule, isTransitioning, toastMessage, showCombat, activeBattleMob, pendingEncounter,
        setField, setActiveZone, centerCameraOnPlayer, snapToCoord, setToast
    } = useGameStore();

    const canvasRef = useRef(null);
    const animationCanvasRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [imageAssetCache, setImageAssetCache] = useState({});
    const [backgroundImage, setLocalBackgroundImage] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [mouseCoords, setMouseCoords] = useState({ x: -1, y: -1 });
    const [isMmDocked, setIsMmDocked] = useState(false);
    const [isMmLarge, setIsMmLarge] = useState(false);

    // --- 1. BOOTSTRAP: LOAD MANIFEST ---
    useEffect(() => {
        const bootGame = async () => {
            try {
                const manifestRes = await fetch('/data/zones/manifest.json');
                if (!manifestRes.ok) throw new Error("Manifest not found");
                const zoneIds = await manifestRes.json();
                
                const shells = {};
                zoneIds.forEach(id => shells[id] = { zid: id, isLazy: true });
                setField('zones', shells);

                // Load Initial Zone (Z01)
                const startId = zoneIds[0];
                await useGameStore.getState().setActiveZone(startId);
                
                // Set Spawn (Default to center if no spawn point found in data)
                const spawnRes = await fetch(`/data/zones/${startId}.json`);
                const spawnData = await spawnRes.json();
                const defaultSpawn = spawnData.spawnPoints?.[0] || { x: Math.floor(spawnData.mapSize.width/2), y: Math.floor(spawnData.mapSize.height/2) };
                setField('playerPosition', { x: defaultSpawn.x, y: defaultSpawn.y });

            } catch (e) {
                console.error("Boot failed:", e);
                setToast("Error loading world data.");
            }
        };
        bootGame();
    }, []);

    // --- 2. ASSET CACHING ---
    useEffect(() => {
        const lib = useGameStore.getState().assetLibrary;
        if (!lib) return;
        Object.values(lib).forEach(asset => {
            if (asset.imageUrl && !imageAssetCache[asset.imageUrl]) {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = asset.imageUrl;
                img.onload = () => setImageAssetCache(prev => ({ ...prev, [asset.imageUrl]: img }));
            }
        });
    }, [useGameStore.getState().assetLibrary]);

    // --- 3. BACKGROUND IMAGE ---
    useEffect(() => {
        if (!backgroundImageData) { setLocalBackgroundImage(null); return; }
        const img = new Image();
        img.onload = () => setLocalBackgroundImage(img);
        img.src = backgroundImageData;
    }, [backgroundImageData]);

    // --- 4. CANVAS RESIZING ---
    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) setCanvasSize(entry.contentRect);
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // --- 5. INTERACTION LOGIC (MOVEMENT & TRIGGERS) ---
    const getCoords = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: -1, y: -1 };
        const rect = canvas.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - canvas.width / 2 - panOffset.x) / zoom;
        const worldY = (e.clientY - rect.top - canvas.height / 2 - panOffset.y) / zoom;
        const mapCenterX = Math.floor(mapSize.width / 2);
        const mapCenterY = Math.floor(mapSize.height / 2);

        if (tileType === 'hex') {
            const s = TILE_SIZE / Math.sqrt(3);
            const q = (Math.sqrt(3) / 3 * worldX - 1 / 3 * worldY) / s;
            const r = (2 / 3 * worldY) / s;
            let x = q, z = r, y = -x - z;
            let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
            const xDiff = Math.abs(rx - x), yDiff = Math.abs(ry - y), zDiff = Math.abs(rz - z);
            if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
            else if (yDiff > zDiff) ry = -rx - rz;
            else rz = -rx - ry;
            return { x: rx + Math.floor((rz - (rz & 1)) / 2) + mapCenterX, y: rz + mapCenterY };
        } else {
            return { x: Math.floor(worldX / TILE_SIZE + mapCenterX), y: Math.floor(worldY / TILE_SIZE + mapCenterY) };
        }
    };

    const handleInteraction = (e) => {
        if (isPanning) return;
        const coords = getCoords(e);
        if (coords.x < 0 || coords.x >= mapSize.width || coords.y < 0 || coords.y >= mapSize.height) return;

        // A. Check for Triggers (Portals, Shops, NPCs)
        const triggerLayer = layers.find(l => l.type === 'trigger');
        const tileTrigger = triggerLayer?.grid?.[coords.y]?.[coords.x];
        const currentTriggers = triggers || {};
        const isAdjacent = playerPosition && Math.abs(playerPosition.x - coords.x) <= 1 && Math.abs(playerPosition.y - coords.y) <= 1;

        // Priority 1: Triggers (Interactive Objects)
        if (tileTrigger?.eventId && currentTriggers[tileTrigger.eventId]) {
            const config = currentTriggers[tileTrigger.eventId];
            
            // Interaction: Only works if adjacent or clicked ON it
            if (config.condition === 'onInteract' && (isAdjacent || (playerPosition.x === coords.x && playerPosition.y === coords.y))) {
                if (config.action === 'teleport') {
                    const { targetZoneId, targetX, targetY } = config.parameters;
                    if (window.confirm(`🌍 Travel to ${targetZoneId}?`)) {
                        setField('isTransitioning', true);
                        setTimeout(() => {
                            setActiveZone(targetZoneId);
                            const tx = parseInt(targetX) || 0, ty = parseInt(targetY) || 0;
                            setField('playerPosition', { x: tx, y: ty });
                        }, 500);
                    }
                } else if (config.action === 'openModule') {
                    setField('activeModule', config.parameters);
                } else if (config.action === 'displayText') {
                    setToast(config.parameters.message);
                }
                return;
            }
        }

        // Priority 2: Combat/Encounter (Self Click or Enemy Click)
        // (Simplified: Clicking self allows opening mob menu if present)
        if (playerPosition && coords.x === playerPosition.x && coords.y === playerPosition.y) {
            setField('showCombat', true);
            return;
        }

        // Priority 3: Movement (A* Pathfinding)
        const groundLayer = layers.find(l => l.id === 'ground');
        const targetHex = groundLayer?.grid?.[coords.y]?.[coords.x];
        const isWalkable = targetHex && targetHex.type !== 'empty' && targetHex.type !== 'wall';
        
        // Check Navigation Layer if it exists
        const navLayer = layers.find(l => l.type === 'navigation');
        const isNavBlocked = navLayer && navLayer.grid[coords.y]?.[coords.x] === 0;

        if (isWalkable && !isNavBlocked) {
            // Pathfind
            const gridForPath = navLayer 
                ? navLayer.grid.map(row => row.map(cell => (cell === 0 ? 0 : 1)))
                : Array.from({ length: mapSize.height }, () => Array(mapSize.width).fill(1));
            
            // Ensure start is walkable
            if(gridForPath[playerPosition.y]) gridForPath[playerPosition.y][playerPosition.x] = 1;

            const path = aStar(gridForPath, playerPosition, coords, tileType);
            if (path && path.length > 0) {
                movePlayer(path);
            }
        }
    };

    const movePlayer = (path) => {
        if (isMoving || !path.length) return;
        setField('isMoving', true);
        let step = 0;
        const interval = setInterval(() => {
            if (step < path.length) {
                const nextPos = { x: path[step].x, y: path[step].y };
                setField('playerPosition', nextPos);
                // Soft Snap Camera
                useGameStore.getState().centerCameraOnPlayer();
                
                // Check "On Enter" Triggers
                const tLayer = useGameStore.getState().layers.find(l => l.type === 'trigger');
                const tData = tLayer?.grid?.[nextPos.y]?.[nextPos.x];
                if (tData?.eventId) {
                    const trig = useGameStore.getState().triggers[tData.eventId];
                    if (trig && trig.condition === 'onEnter') {
                        // Execute simple onEnter (complex ones might need pausing movement)
                        if (trig.action === 'displayText') setToast(trig.parameters.message);
                    }
                }

                step++;
            } else {
                clearInterval(interval);
                setField('isMoving', false);
            }
        }, 150); // Movement speed
    };

    // --- 6. RENDER LOOP (IDENTICAL TO EDITOR) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !canvasSize.width) return;
        canvas.width = canvasSize.width; canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        const assetLibrary = useGameStore.getState().assetLibrary || {};

        ctx.fillStyle = '#1d1d1d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2 + panOffset.x, canvas.height / 2 + panOffset.y);
        ctx.scale(zoom, zoom);

        // Draw Background
        if (backgroundImage) {
            const s = TILE_SIZE / Math.sqrt(3); 
            const h = 2 * s;
            // Proportional Sync logic from Editor
            const totalGridWidth = mapSize.width * TILE_SIZE;
            const totalGridHeight = mapSize.height * (tileType === 'hex' ? TILE_SIZE * 1.5 : TILE_SIZE);
            const offsetShiftY = (totalGridHeight - (mapSize.height * 0.75 * h)) / 4;
            
            ctx.drawImage(backgroundImage, -totalGridWidth / 2, (-totalGridHeight / 2) + offsetShiftY, totalGridWidth, totalGridHeight);
        }

        // Draw Layers
        const groundLayer = layers.find(l => l.id === 'ground');
        layers.forEach(layer => {
            if (!layer.isVisible) return;
            ctx.globalAlpha = layer.opacity;

            if (layer.type === 'visual') {
                const renderList = [];
                // Culling Logic
                const s = TILE_SIZE / Math.sqrt(3); const w = Math.sqrt(3) * s; const h = 2 * s;
                const buffer = 2;
                const startX = Math.max(0, Math.floor(((-canvas.width / 2 - panOffset.x) / zoom) / w + mapSize.width/2) - buffer);
                const endX = Math.min(mapSize.width - 1, Math.ceil(((canvas.width / 2 - panOffset.x) / zoom) / w + mapSize.width/2) + buffer);
                const startY = Math.max(0, Math.floor(((-canvas.height / 2 - panOffset.y) / zoom) / (h * 0.75) + mapSize.height/2) - buffer);
                const endY = Math.min(mapSize.height - 1, Math.ceil(((canvas.height / 2 - panOffset.y) / zoom) / (h * 0.75) + mapSize.height/2) + buffer);

                for (let y = startY; y <= endY; y++) {
                    for (let x = startX; x <= endX; x++) {
                        const tile = layer.grid[y][x];
                        if (!tile) continue;
                        const groundTile = groundLayer?.grid[y]?.[x];
                        const isVoid = !groundTile || groundTile.type === 'empty';
                        if (isVoid && layer.id === 'ground') continue; // Don't draw void ground

                        if (layer.id === 'ground') renderList.push({ type: 'tile', tile, x, y, depth: y + x });
                        else if (tile.assetId) renderList.push({ type: 'asset', tile, x, y, depth: y + x + 0.5 });
                    }
                }
                renderList.sort((a, b) => a.depth - b.depth);

                renderList.forEach(item => {
                    const { tile, x, y } = item;
                    const center = getTileCenter(x, y, view, tileType, mapSize);

                    if (item.type === 'tile') {
                        const biomeColor = BIOME_COLORS[biome] || BIOME_COLORS.forest;
                        const fillStyle = hexToRgba(biomeColor, tileOpacity);
                        const points = hexUtils.getHexPoints(view === 'isometric' ? TILE_SIZE / 2 : TILE_SIZE / Math.sqrt(3));
                        
                        ctx.save();
                        ctx.translate(center.x, center.y);
                        ctx.beginPath();
                        ctx.moveTo(points[0], points[1]);
                        for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
                        ctx.closePath();
                        ctx.fillStyle = fillStyle;
                        ctx.fill();
                        
                        // Subtle Borders
                        if (zoom > 0.4) {
                            ctx.strokeStyle = 'rgba(29, 29, 29, 0.3)';
                            ctx.lineWidth = 1 / zoom;
                            ctx.stroke();
                        }
                        ctx.restore();
                    } else if (item.type === 'asset') {
                        const asset = assetLibrary[tile.assetId];
                        const img = imageAssetCache[asset?.imageUrl];
                        ctx.save();
                        ctx.translate(center.x, center.y);
                        if (tile.rotation) ctx.rotate(tile.rotation * Math.PI / 180);
                        if (tile.flipped) ctx.scale(-1, 1);

                        if (img && img.complete) {
                            const scale = asset.scale || 1;
                            const yOffset = asset.yOffset || 0;
                            const size = TILE_SIZE * scale;
                            const ar = img.height / img.width;
                            ctx.drawImage(img, -size/2, -(size * ar)/2 + yOffset, size, size * ar);
                        } else if (asset?.svgPath) {
                            const path = new Path2D(asset.svgPath);
                            ctx.scale(TILE_SIZE/32, TILE_SIZE/32);
                            ctx.translate(-12, -12);
                            ctx.fillStyle = asset.color || '#fff';
                            ctx.fill(path);
                        }
                        ctx.restore();

                        // Interaction Badges
                        if (tile.properties?.interactionType && tile.properties.interactionType !== 'none') {
                            const badgeSize = (TILE_SIZE / 5) / zoom;
                            const badgeX = center.x + (TILE_SIZE/3);
                            const badgeY = center.y - (TILE_SIZE/3);
                            ctx.save();
                            ctx.beginPath(); ctx.arc(badgeX, badgeY, badgeSize, 0, 2 * Math.PI);
                            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fill();
                            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1/zoom; ctx.stroke();
                            ctx.fillStyle = '#00ffff'; ctx.font = `bold ${badgeSize}px sans-serif`;
                            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                            ctx.fillText('!', badgeX, badgeY+1);
                            ctx.restore();
                        }
                    }
                });
            }
        });

        // Draw Player
        if (playerPosition) {
            const center = getTileCenter(playerPosition.x, playerPosition.y, view, tileType, mapSize);
            const radius = TILE_SIZE / 2.5;
            
            // Glow
            ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(center.x, center.y, radius, 0, 2*Math.PI);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'; ctx.fill();
            ctx.shadowBlur = 0;

            // Icon/Circle
            ctx.beginPath(); ctx.arc(center.x, center.y, radius * 0.6, 0, 2*Math.PI);
            ctx.fillStyle = '#00ffff'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2/zoom; ctx.stroke();
        }

        ctx.restore();
    }, [layers, view, tileType, tileOpacity, mapSize, canvasSize, zoom, panOffset, imageAssetCache, backgroundImage, playerPosition, biome]);

    // --- 7. PARTICLE ANIMATION ---
    useEffect(() => {
        const canvas = animationCanvasRef.current;
        if (!canvas || backgroundAnimation === 'none') return;
        canvas.width = canvasSize.width; canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        let frame;
        let particles = [];
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (Math.random() < 0.3 * animationSpeed && particles.length < 100) {
                particles.push({ 
                    x: Math.random() * canvas.width, y: -10, 
                    vx: (Math.random()-0.5)*0.5, vy: (0.5+Math.random())*animationSpeed,
                    life: 0, maxLife: 100 + Math.random()*100, size: 2+Math.random()*3
                });
            }
            for (let i = particles.length-1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy; p.life++;
                if (p.life > p.maxLife) { particles.splice(i, 1); continue; }
                ctx.fillStyle = `rgba(200, 255, 255, ${1 - p.life/p.maxLife})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 2*Math.PI); ctx.fill();
            }
            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, [backgroundAnimation, animationSpeed, canvasSize]);

    // --- 8. INPUT HANDLERS ---
    const handleMouseDown = (e) => {
        if (e.button === 2) { setIsPanning(true); setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }); }
        else if (e.button === 0) { handleInteraction(e); }
    };
    const handleMouseMove = (e) => {
        if (isPanning) {
            setField('panOffset', { x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        } else {
            setMouseCoords(getCoords(e));
        }
    };
    const handleWheel = (e) => {
        const zoomFactor = 1.1;
        const newZoom = Math.max(0.2, Math.min(3, e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor));
        setField('zoom', newZoom);
    };

    return (
        <>
            <StyleInjector />
            <div className="fixed inset-0 bg-black text-cyan-100 font-cinzel overflow-hidden">
                {/* CANVAS LAYER */}
                <div ref={canvasContainerRef} className="absolute inset-0 touch-none">
                    <canvas ref={canvasRef} className="absolute inset-0" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setIsPanning(false)} onWheel={handleWheel} onContextMenu={e => e.preventDefault()} />
                    <canvas ref={animationCanvasRef} className="absolute inset-0 pointer-events-none" />
                </div>

                {/* UI OVERLAYS */}
                {activeModule && <ModuleRenderer moduleId={activeModule.moduleId} onClose={() => setField('activeModule', null)} />}
                
                {isTransitioning && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black loading-bridge">
                        <div className="text-center">
                            <div className="loading-spinner mb-4"></div>
                            <h2 className="text-3xl text-cyan-400 animate-pulse tracking-widest">{zoneName}</h2>
                        </div>
                    </div>
                )}

                {toastMessage && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-cyan-900/80 border border-cyan-500/50 text-white px-6 py-2 rounded-lg shadow-[0_0_15px_cyan] z-50 animate-bounce">
                        {toastMessage}
                    </div>
                )}

                {/* MINIMAP */}
                <MiniMap 
                    canvasSize={canvasSize} 
                    isDocked={false} 
                    setDocked={() => {}} /* Disable docking in Player UI */
                    isLarge={isMmLarge} 
                    setLarge={setIsMmLarge} 
                />

                {/* COMBAT SCREEN */}
                {showCombat && (
                    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center backdrop-blur">
                        <div className="relative w-full max-w-5xl h-[90vh] glass-panel border border-red-500/50 rounded-xl overflow-hidden shadow-2xl">
                            <button onClick={() => setField('showCombat', false)} className="absolute top-4 right-4 z-[160] p-2 bg-red-600 rounded-full hover:bg-red-500 text-white"><X size={20} /></button>
                            <CombatScreen onClose={() => setField('showCombat', false)} initialEnemyId={activeBattleMob} currentZoneId={zid} />
                        </div>
                    </div>
                )}

                {/* STATUS BAR */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 pointer-events-none">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl text-cyan-400 tracking-widest shadow-black drop-shadow-md">{zoneName}</h1>
                        <span className="text-xs text-cyan-600">[{zid}] {biome.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-cyan-600">
                        COORDS: {mouseCoords.x}, {mouseCoords.y}
                    </div>
                </div>
            </div>
        </>
    );
}

// --- MAGI-TECH MINIMAP: Dockable & Scalable Navigator (RESTORED) ---
function MiniMap({ canvasSize, isDocked, setDocked, isLarge, setLarge }) {
    const { layers, mapSize, zoom, panOffset, playerPosition, biome } = useGameStore();
    const mmCanvasRef = useRef(null);
    
    // Default size vs Double size (384x192)
    const baseWidth = isLarge ? 384 : 192;
    const baseHeight = baseWidth * (mapSize.height / mapSize.width);
    const [mmDim, setMmDim] = useState({ w: baseWidth, h: baseHeight });

    // Sync dimensions when "Large" toggle is clicked
    useEffect(() => {
        setMmDim({ w: baseWidth, h: baseHeight });
    }, [isLarge, mapSize]);

    useEffect(() => {
        const canvas = mmCanvasRef.current;
        if (!canvas || !layers.length || !canvasSize) return;
        const ctx = canvas.getContext('2d');
        
        const scaleX = canvas.width / mapSize.width;
        const scaleY = canvas.height / mapSize.height;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.clip();

        ctx.fillStyle = '#000'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const groundLayer = layers.find(l => l.id === 'ground');
        if (!groundLayer) { ctx.restore(); return; }

        // DRAW TERRAIN
        groundLayer.grid.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile.type !== 'empty' && tile.type !== 'default' && tile.type !== 'wall') {
                    ctx.fillStyle = BIOME_COLORS[biome] || '#4A6B4A';
                    ctx.fillRect(x * scaleX, y * scaleY, scaleX + 0.5, scaleY + 0.5);
                }
            });
        });

        // DRAW VIEWPORT BOX
        const viewW = (canvasSize.width / (zoom * TILE_SIZE)) * scaleX;
        const viewH = (canvasSize.height / (zoom * TILE_SIZE)) * scaleY;
        const viewX = ((-panOffset.x - canvasSize.width / 2) / (zoom * TILE_SIZE)) * scaleX + (mapSize.width * scaleX / 2);
        const viewY = ((-panOffset.y - canvasSize.height / 2) / (zoom * TILE_SIZE)) * scaleY + (mapSize.height * scaleY / 2);

        if (viewW < canvas.width || viewH < canvas.height) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(viewX, viewY, viewW, viewH);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
            ctx.fillRect(viewX, viewY, viewW, viewH);
        }

        // DRAW PLAYER BLIP
        if (playerPosition) {
            const blipX = (playerPosition.x / mapSize.width) * canvas.width;
            const blipY = (playerPosition.y / mapSize.height) * canvas.height;
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(blipX, blipY, 3, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }, [layers, mapSize, zoom, panOffset, canvasSize, mmDim, biome, playerPosition]);

    const handleMinimapClick = (e) => {
        const rect = mmCanvasRef.current.getBoundingClientRect();
        const gridX = Math.floor(((e.clientX - rect.left) / rect.width) * mapSize.width);
        const gridY = Math.floor(((e.clientY - rect.top) / rect.height) * mapSize.height);
        useGameStore.getState().snapToCoord(gridX, gridY);
    };

    return (
        <div 
            style={{ width: isDocked ? '100%' : mmDim.w, height: isDocked ? 'auto' : mmDim.h + 22 }}
            className={`${isDocked ? 'relative' : 'absolute bottom-4 right-4'} bg-black/80 border border-teal-500/30 rounded-lg overflow-hidden shadow-2xl backdrop-blur-md z-40 group hover:border-teal-400 transition-all`}
        >
            <div className="text-[9px] text-teal-500/50 uppercase font-bold px-2 py-1 bg-black/40 flex justify-between items-center select-none">
                <div className="flex items-center gap-2">
                    <button onClick={() => setDocked(!isDocked)} title="Toggle Dock" className="hover:text-teal-300">
                        <Anchor size={10} className={isDocked ? 'text-teal-400' : ''} />
                    </button>
                    <span>Navigator</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setLarge(!isLarge)} title="Toggle Size" className="hover:text-teal-300">
                        {isLarge ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                    </button>
                </div>
            </div>
            <canvas 
                ref={mmCanvasRef} 
                width={isDocked ? 240 : mmDim.w} 
                height={isDocked ? 120 : mmDim.h} 
                onClick={handleMinimapClick}
                className="w-full h-full cursor-crosshair opacity-80 hover:opacity-100 transition-opacity"
            />
        </div>
    );
}