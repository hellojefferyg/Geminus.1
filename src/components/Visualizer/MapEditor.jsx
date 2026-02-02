import React, { useState, useRef, useEffect, useMemo } from 'react';
import { enrichObjectWithInteraction } from "../../utils/InteractionFactory";
import { create } from 'zustand';
import { useStudioStore } from '../../stores/StudioStore';
import CombatScreen from './CombatScreen';
import {
  User, Square, Hexagon, Eye, RefreshCcw, Download, Upload,
  ChevronDown, ChevronRight, LayoutGrid, Route, Torus,
  RotateCcw, Focus, PanelLeft, PanelRight, Sparkles, Image as ImageIcon,
  Building2, Globe, Map as MapIcon, GitMerge, Pencil, Droplet, MousePointer, PaintBucket, Brush, Eraser, PlusCircle, Trash2,
  Layers, EyeOff, Undo, Redo, Circle, RectangleHorizontal, Stamp, Save, Edit, ChevronUp, ChevronDown as ChevronDownIcon,
  Footprints, Zap, Crop, RefreshCw, File, Pipette, FlipHorizontal, MapPin, ClipboardCopy, Gamepad2, Camera, X, Wand2, Copy, Plus, FileArchive, FolderArchive, Repeat, Skull, Coins, Sword, Move, Maximize2, Anchor, Minimize2, 
} from 'lucide-react';
// --- BIOME COLOR RULES ---
// This tells the editor: "If you find this color, it's a valid spot for these types of zones."
const BIOME_COLOR_RULES = {
  "forest":         { r: 88,  g: 104, b: 55  }, //manually sampled RGB ✅
  "jungle":         { r: 32,   g: 43, b: 13   },//manually sampled RGB ✅
  "plains":         { r: 124, g: 252, b: 0   },
  "savanna":        { r: 228, g: 166, b: 114 },
  "desert":         { r: 124, g: 117, b: 91 }, //Manaually sampled RGB ✅
  "wasteland":      { r: 205, g: 133, b: 63  },
  "mountain":       { r: 185, g: 204, b: 210 }, // Your sampled Snow RGB ✅
  "tundra":         { r: 185, g: 204, b: 210 }, // Also mapped to Snow ✅
  "taiga":          { r: 70,  g: 89,  b: 69  },
  "swamp":          { r: 45,  g: 65,  b: 30  }, 
  "wetlands":       { r: 90,  g: 99,  b: 73  },
  "ocean":          { r: 30,  g: 144, b: 255 },
  "crystallineCaves": { r: 175, g: 238, b: 238 }
};
// --- CDN LOADER ---
const CDNScriptLoader = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);
    return null;
};

// --- STYLES & FONTS ---
const StyleInjector = () => {
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --bg-dark-teal: #273b40;
                --highlight-powder-blue: #cae9ea;
                --grounding-black: #1d1d1d;
                --shadow-dark-grey: #3c4748;
                --glow-vibrant-teal: #208c8c;
            }
            body { font-family: 'Inter', sans-serif; color: var(--highlight-powder-blue); background-color: var(--grounding-black); overscroll-behavior: contain; }
            .font-cinzel { font-family: 'Cinzel', serif; }
            .font-medieval { font-family: 'MedievalSharp', cursive; }
            .font-uncial { font-family: 'Uncial Antiqua', cursive; }
            .font-orbitron { font-family: 'Orbitron', sans-serif; }
            .glass-panel { background: rgba(29, 29, 29, 0.45); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--shadow-dark-grey); box-shadow: 0 4px 25px rgba(0, 0, 0, 0.5); }
            .glass-button { background: rgba(32, 140, 140, 0.25); border: 1px solid rgba(32, 140, 140, 0.6); color: var(--highlight-powder-blue); transition: all 0.2s ease-in-out; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .glass-button:disabled { background: rgba(60, 71, 72, 0.4) !important; border-color: rgba(60, 71, 72, 0.8) !important; cursor: not-allowed; color: #6b7280 !important; }
            .glass-button:not(:disabled):hover { background: rgba(32, 140, 140, 0.6); border-color: rgba(62, 200, 200, 0.9); transform: translateY(-2px); }
            .glass-button.active { background: var(--glow-vibrant-teal); border-color: #88ffff; color: #ffffff; transform: translateY(-2px); }
            .glass-button:not(:disabled):active { transform: translateY(1px) scale(0.98); }
            .editor-input, .editor-select, .editor-textarea { background-color: rgba(0,0,0,0.3); border: 1px solid var(--shadow-dark-grey); color: var(--highlight-powder-blue); padding: 4px 8px; border-radius: 4px; width: 100%; font-size: 12px; }
            .editor-input:focus, .editor-select:focus, .editor-textarea:focus { outline: none; border-color: var(--glow-vibrant-teal); box-shadow: 0 0 5px var(--glow-vibrant-teal); }
            input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 30px var(--grounding-black) inset !important;
                -webkit-text-fill-color: var(--highlight-powder-blue) !important;
                caret-color: var(--highlight-powder-blue) !important;
            }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--shadow-dark-grey); border-radius: 4px; }
            
            /* --- CYBER-MYSTICAL ACCORDION THEME --- */
            .accordion-item-bg { 
                background: rgba(10, 30, 35, 0.75); 
                backdrop-filter: blur(10px); 
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 255, 255, 0.2);
                color: #e0f8ff; 
                transition: all 0.3s ease;
            }
            .accordion-item-bg button {
                color: #e0f8ff;
                text-shadow: 0 0 4px rgba(0, 255, 255, 0.7);
            }
            .accordion-item-bg-active { 
                background: #00ffff; 
                color: #000; 
                box-shadow: 0 0 10px #00ffff, inset 0 0 6px rgba(0, 255, 255, 0.8);
                border-color: #00ffff;
            }
            .accordion-item-bg-active button, .accordion-item-bg-active span, .accordion-item-bg-active input {
                color: #000;
                text-shadow: none;
            }
            .accordion-item-bg-active .editor-input {
                 background-color: rgba(0,0,0,0.1);
                 border-color: rgba(0,0,0,0.3);
            }
            //Zone Transition Animation
            /* --- PASTE EVERYTHING BELOW THIS LINE --- */
            .loading-bridge {
                background: #000;
                background-size: cover;
                background-position: center;
            }

            .loading-spinner {
                width: 120px;
                height: 120px;
                border-radius: 50%;
            }
        `;
        document.head.appendChild(style);
        
        const fontFamilies = ['Cinzel:wght@400;700', 'MedievalSharp', 'Uncial+Antiqua', 'Orbitron:wght@500'];
        const fontLink = document.createElement('link');
        fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        return () => { 
            document.head.removeChild(style);
            document.head.removeChild(fontLink);
        };
    }, []);
    return null;
};

// --- CONSTANTS & UTILITIES ---
export const TILE_SIZE = 64;
const BIOME_COLORS = { 
    forest: '#4A6B4A', desert: '#D2B48C', tundra: '#FFFAFA', mountain: '#696969', swamp: '#556B2F', jungle: '#006400', volcanic: '#2F4F4F', plains: '#90EE90', ocean: '#1E90FF', wasteland: '#CD853F',
    savanna: '#E4A672', taiga: '#465945', wetlands: '#5A6349', badlands: '#B97C5B', archipelago: '#2E8B57',
    fungalForest: '#8A2BE2', crystallineCaves: '#AFEEEE', corruptedLands: '#4B0082', feywild: '#FF69B4', shadowlands: '#483C32', celestialPlains: '#F0E68C',
    Clear: 'rgba(0,0,0,0)',
};
const BIOME_LIST = Object.keys(BIOME_COLORS);
const BIOME_FONTS = {
    default: 'Cinzel',
    forest: 'MedievalSharp', plains: 'MedievalSharp', savanna: 'MedievalSharp', jungle: 'MedievalSharp', taiga: 'MedievalSharp', swamp: 'MedievalSharp', wetlands: 'MedievalSharp',
    mountain: 'Uncial Antiqua', tundra: 'Uncial Antiqua', badlands: 'Uncial Antiqua', desert: 'Uncial Antiqua',
    volcanic: 'Orbitron', wasteland: 'Orbitron', corruptedLands: 'Orbitron', shadowlands: 'Orbitron',
    feywild: 'MedievalSharp', fungalForest: 'Uncial Antiqua', crystallineCaves: 'Uncial Antiqua', celestialPlains: 'Cinzel',
};
const BIOME_OBSTACLES = {
    forest: ['tree', 'rock'], jungle: ['tree', 'thornVines'], feywild: ['giantMushroom', 'tree'],
    desert: ['rock', 'giantBones'], wasteland: ['rock', 'petrifiedTree'], badlands: ['rock', 'giantBones'],
    tundra: ['iceSpire', 'rock'], taiga: ['tree', 'rock'], mountain: ['rock', 'iceSpire'],
    swamp: ['thornVines', 'petrifiedTree'], shadowlands: ['petrifiedTree', 'denseWebs'], fungalForest: ['giantMushroom', 'denseWebs'],
    volcanic: ['lavaFissure', 'rock'], corruptedLands: ['thornVines', 'petrifiedTree'],
    celestialPlains: ['crystalCluster'], crystallineCaves: ['crystalCluster'],
    default: ['rock']
};
export const hexUtils = { getHexPoints: (size) => { const p = []; for (let i = 0; i < 6; i++) { const a = (Math.PI / 180) * (60 * i + 30); p.push(size * Math.cos(a), size * Math.sin(a)); } return p; } };
const isoUtils = { toScreen: (x, y, s) => ({ x: (x - y) * (s / 2), y: (x + y) * (s / 4) }) };
export const getTileCenter = (x, y, view, tileType, mapSize) => {
    let center = { x: 0, y: 0 };
    
    // --- MATH SYNC: Use Math.floor to match the click coordinate math ---
    // This ensures the map is drawn on whole hexes, not halfway between them.
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

const aStar = (grid, start, end, tileType = 'square') => {
    const rows = grid.length;
    const cols = grid[0].length;
    const nodes = [];
    
    // 1. PERFORMANCE INIT: Use boolean flags instead of array searches (.includes)
    for (let y = 0; y < rows; y++) {
        nodes[y] = [];
        for (let x = 0; x < cols; x++) {
            nodes[y][x] = { 
                x, y, f: 0, g: 0, h: 0, parent: null, 
                isWall: grid[y][x] === 0,
                closed: false, // O(1) visited check
                opened: false  // O(1) open check
            };
        }
    }

    const heuristic = (a, b) => {
        if (tileType === 'square') return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        // Hexagonal Axial/Cube Distance
        const toCube = (n) => {
            const cx = n.x - (n.y - (n.y & 1)) / 2;
            const cz = n.y;
            return { x: cx, y: -cx - cz, z: cz };
        };
        const ac = toCube(a), bc = toCube(b);
        return (Math.abs(ac.x - bc.x) + Math.abs(ac.y - bc.y) + Math.abs(ac.z - bc.z)) / 2;
    };

    const startNode = nodes[start.y][start.x];
    const endNode = nodes[end.y][end.x];
    let openSet = [startNode];
    startNode.opened = true;

    // 2. STUCK GUARD: Ensure start/end aren't blocked by the grid logic itself
    startNode.isWall = false;
    endNode.isWall = false;

    while (openSet.length > 0) {
        let lowestIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIndex].f) lowestIndex = i;
        }

        let current = openSet[lowestIndex];
        if (current === endNode) {
            let path = [];
            while (current.parent) { path.push(current); current = current.parent; }
            return path.reverse();
        }

        openSet.splice(lowestIndex, 1);
        current.closed = true;

        const { x, y } = current;
        // CORRECTED HEX NEIGHBORS: Adjusted for Pointy-Top Offset coordinates (y % 2)
        // This ensures the pathfinder doesn't "miss" diagonal connections on large maps.
        let dirs;
        if (tileType === 'hex') {
            dirs = (y % 2 !== 0) 
                ? [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]] // Odd rows
                : [[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]]; // Even rows
        } else {
            dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // Standard Square
        }

        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                const neighbor = nodes[ny][nx];
                if (neighbor.closed || neighbor.isWall) continue;

                let gScore = current.g + 1;
                let better = false;

                if (!neighbor.opened) {
                    better = true;
                    neighbor.opened = true;
                    openSet.push(neighbor);
                } else if (gScore < neighbor.g) {
                    better = true;
                }

                if (better) {
                    neighbor.parent = current;
                    neighbor.g = gScore;
                    neighbor.h = heuristic(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                }
            }
        }
    }
    return [];
};

// --- REUSABLE UI COMPONENTS ---
const Accordion = ({ title, children, isOpen, onToggle, isSub = false }) => (
    <div className={!isSub ? "border-b border-[var(--shadow-dark-grey)] pb-1 mb-1" : ""}>
        <button onClick={onToggle} className={`flex items-center justify-between w-full py-1 ${isSub ? 'text-sm pl-2' : 'text-base font-cinzel'}`}>
            <span className="capitalize truncate">{title}</span>
            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} ${isSub ? 'pl-2 pt-1' : 'pt-1'}`}>
            {children}
        </div>
    </div>
);
const GlassButton = ({ onClick, isActive, children, className = '', ...props }) => (
    <button onClick={onClick} className={`p-2 rounded-lg transition-colors flex-1 glass-button text-xs ${isActive ? 'active' : ''} ${className}`} {...props}> {children} </button>
);

// --- INITIAL DATA & ASSETS (UPDATED WITH SMART LOGIC) ---

const initialAssets = Object.fromEntries(Object.entries({
    // --- Core Interactives ---
    theArmory: { 
        scale: 1.15, yOffset: -5, color: '#607D8B', name: 'The Armory', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Armory.png', 
        defaultProperties: { moduleId: 'armory_shop', interactionType: 'shop' }
    },
    theArcanumNew: { 
        scale: 1, yOffset: 0, color: '#483D8B', name: 'The Arcanum', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Arcanum.png', 
        defaultProperties: { moduleId: 'arcanum_shop', interactionType: 'shop' }
    },
    gildedVaultNew: { 
        scale: 1, yOffset: 0, color: '#DAA520', name: 'The Gilded Vault', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Gilded%20Vault.png', 
        defaultProperties: { moduleId: 'gilded_vault_storage', interactionType: 'storage' }
    },
    portalNew: { 
        scale: 0.9, yOffset: -2, color: '#00FFFF', name: 'Portal', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Portal.png', 
        defaultProperties: { interactionType: 'portal', targetZoneId: 'default_zone', targetCoords: '0,0' }
    },
    sanctuaryReviveNew: { 
        scale: 1, yOffset: 0, color: '#F0E68C', name: 'Sanctuary (Revive)', type: 'Core Interactives', 
        imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Sanctuary%20(Revive).png', 
        defaultProperties: { interactionId: 'sanctuary_revive_point', interactionType: 'revive' }
    },
    entranceBlue: { scale: 0.75, yOffset: -3, color: '#4287f5', name: 'Entrance (Blue)', type: 'Core Interactives', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Entrance%20(Blue).png' },
    entranceBlack: { scale: 0.75, yOffset: -3, color: '#333333', name: 'Entrance (Black)', type: 'Core Interactives', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Entrance%20(Black).png' },
    entranceRed: { scale: 0.75, yOffset: -3, color: '#f54242', name: 'Entrance (Red)', type: 'Core Interactives', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Entrance%20(Red).png' },
    gemCutter1: { scale: 1, yOffset: 0, color: '#B9F2FF', name: 'The Gem Cutter 1', type: 'Core Interactives', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Gem%20Cutter%201.png' },
    gemCutter2: { scale: 1, yOffset: 0, color: '#B9F2FF', name: 'The Gem Cutter 2', type: 'Core Interactives', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Gem%20Cutter%202.png' },
    soulforgeNew: { scale: 1, yOffset: 0, color: '#E6E6FA', name: 'The SoulForge', type: 'Core Interactives', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Soul%20Forge.png' },

    // --- Estate Buildings ---
    estateHall: { scale: 1, yOffset: 0, color: '#FFD700', name: 'Estate Hall', type: 'Estate Buildings', svgPath: 'M2 22 L2 12 L6 12 L6 8 L18 8 L18 12 L22 12 L22 22 Z M10 12 L14 12 L14 22 L10 22 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Estate%20Hall.png' },
    researchCottage: { scale: 1, yOffset: 0, color: '#8A2BE2', name: 'Research Cottage', type: 'Estate Buildings', svgPath: 'M12 2 L2 8 L2 22 L22 22 L22 8 Z M16 14 A4 4 0 1 1 8 14 A4 4 0 0 1 16 14', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Research%20Cottage.png' },
    storehouse: { scale: 1, yOffset: 0, color: '#A0522D', name: 'Storehouse', type: 'Estate Buildings', svgPath: 'M3 8 L12 2 L21 8 L21 22 L3 22 Z M8 12 H16 V18 H8Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Store%20House.png' },
    tannery: { scale: 1, yOffset: 0, color: '#D2B48C', name: 'Tannery', type: 'Estate Buildings', svgPath: 'M4 4 h16 v16 h-16 z M8 8 v8 h8 v-8 z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Tannery%20.png' },
    questBoard: { scale: 1, yOffset: 0, color: '#DEB887', name: 'Quest Board', type: 'Estate Buildings', svgPath: 'M5 3 H19 V21 H5 Z M8 7 H16 M8 11 H16 M8 15 H12', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Quest%20board.png' },
    estateBank: { scale: 1, yOffset: 0, color: '#C0C0C0', name: 'Estate Bank', type: 'Estate Buildings', svgPath: 'M12 2 L2 7 L2 9 L22 9 L22 7 Z M4 10 H20 V22 H4 Z M7 12 H9 V18 H7 Z M11 12 H13 V18 H11 Z M15 12 H17 V18 H15 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Estate%20Resource%20Bank.png' },
    gemcutter: { scale: 1, yOffset: 0, color: '#B9F2FF', name: 'Gemcutter', type: 'Estate Buildings', svgPath: 'M12 2 L18 8 L12 14 L6 8 Z M6 10 L18 10 L18 16 L12 22 L6 16 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/The%20Gem%20Cutter%201.png' },
    arcanistsAltar: { scale: 1, yOffset: 0, name: "Arcanist's Altar", type: 'Estate Buildings', color: '#8A2BE2', svgPath: '', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Arcanists%20Alter.png' },
    
    // --- Resource Generators ---
    dragonwoodGrove: { scale: 1, yOffset: 0, color: '#006400', name: 'Dragonwood Grove', type: 'Resource Generators', svgPath: 'M12 22 L12 12 M12 12 L6 6 M12 12 L18 6 M6 6 A6 6 0 1 1 18 6 A6 6 0 0 1 6 6', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dragonwood%20Grove.png' },
    bedrockQuarry: { scale: 1, yOffset: 0, color: '#696969', name: 'Bedrock Quarry', type: 'Resource Generators', svgPath: 'M2 12 L12 2 L22 12 L12 22 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Bedrock%20Quarry.png' },
    estateMine: { scale: 1, yOffset: 0, color: '#8B4513', name: 'Estate Mine', type: 'Resource Generators', svgPath: 'M4 10 H20 L12 22 Z M10 4 L14 4 L14 10 L10 10 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Estate%20Mine.png' },
    huntingPreserve: { scale: 1, yOffset: 0, color: '#556B2F', name: 'Hunting Preserve', type: 'Resource Generators', svgPath: 'M12 2 A10 10 0 0 0 2 12 A10 10 0 0 0 12 22 A10 10 0 0 0 22 12 A10 10 0 0 0 12 2 M22 2 L12 12 L2 22', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Hunting%20Preserve.png' },
    
    // --- Clan Buildings ---
    greatHall: { scale: 1, yOffset: 0, color: '#B8860B', name: 'Great Hall', type: 'Clan Buildings', svgPath: 'M2 22 L2 10 L12 3 L22 10 L22 22 Z M6 10 L6 22 M18 10 L18 22 M10 10 L10 22 M14 10 L14 22', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Great%20Hall.png' },
    bastionWalls: { scale: 1, yOffset: 0, color: '#808080', name: 'Bastion Walls', type: 'Clan Buildings', svgPath: 'M2 8 H22 V16 H2 Z M8 8 V16 M16 8 V16', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Bastion%20Walls1.png' },
    warCamp: { scale: 1, yOffset: 0, color: '#FF4500', name: 'War Camp', type: 'Clan Buildings', svgPath: 'M2 22 L12 2 L22 22 Z M4 22 L12 12 L20 22', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/War%20Camp.png' },
    forceOfFriendship: { scale: 1, yOffset: 0, name: "Force of Friendship", type: 'Clan Buildings', color: '#4CAF50', svgPath: '', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Force%20of%20Friendship.png' },
    trackerAcademy: { scale: 1, yOffset: 0, name: "Tracker Academy", type: 'Clan Buildings', color: '#FF9800', svgPath: '', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Tracker%20Academy.png' },
    blackMarket: { scale: 1, yOffset: 0, name: "Black Market", type: 'Clan Buildings', color: '#607D8B', svgPath: '', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Black%20Market.png' },
    clanMine: { scale: 1, yOffset: 0, name: "Clan Mine", type: 'Clan Buildings', color: '#795548', svgPath: '', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Clan%20Mine.png' },
    
    // --- Resource Nodes ---
    dragonboneTimber: { scale: 1, yOffset: 0, name: "Dragonbone Timber", type: 'Resource Nodes', color: '#5D4037', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dragonbone%20Timber.png' },
    primordialMire: { scale: 1, yOffset: 0, name: "Primordial Mire", type: 'Resource Nodes', color: '#4E342E', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Primordial%20Mire.png' },
    earthRootRock: { scale: 1, yOffset: 0, name: "Earth-Root Rock", type: 'Resource Nodes', color: '#6D4C41', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Earth-Root%20Rock.png' },
    dwarfForgedIron: { scale: 1, yOffset: 0, name: "Dwarf-Forged Iron", type: 'Resource Nodes', color: '#455A64', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dwarf-Forged%20Iron.png' },
    rawhide: { scale: 1, yOffset: 0, name: "Rawhide", type: 'Resource Nodes', color: '#A1887F', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Rawhide.png' },
    heartwoodLog: { scale: 1, yOffset: 0, name: "Heartwood Log", type: 'Resource Nodes', color: '#3E2723', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Heartwood%20Log.png' },
    quarryStone: { scale: 1, yOffset: 0, name: "Quarry Stone", type: 'Resource Nodes', color: '#757575', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Quarry%20Stone.png' },
    duneTitanDust: { scale: 1, yOffset: 0, name: "Dune-Titan Dust", type: 'Resource Nodes', color: '#FFC107', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dune-Titan%20Dust.png' },
    infernalEmberlump: { scale: 1, yOffset: 0, name: "Infernal Emberlump", type: 'Resource Nodes', color: '#F44336', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Infernal%20Embrlump.png' },
    astralDust: { scale: 1, yOffset: 0, name: "Astral Dust", type: 'Resource Nodes', color: '#9C27B0', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Astral%20Dust.png' },
    siegeGradeTimber: { scale: 1, yOffset: 0, name: "Siege-Grade Timber", type: 'Resource Nodes', color: '#8D6E63', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Siege-Grade%20Timber.png' },
    fortressGranite: { scale: 1, yOffset: 0, name: "Fortress Granite", type: 'Resource Nodes', color: '#9E9E9E', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Fortress%20Granite.png' },
    voidHeartAdamant: { scale: 1, yOffset: 0, name: "Void-Heart Adamant", type: 'Resource Nodes', color: '#212121', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Void-Heart%20Adamant.png' },
    titansBloodOre: { scale: 1, yOffset: 0, name: "Titans-Blood Ore", type: 'Resource Nodes', color: '#B71C1C', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Titans-Blood%20Ore%20.png' },
    nightWhisperEssence: { scale: 1, yOffset: 0, name: "Night Whisper Essence", type: 'Resource Nodes', color: '#4A148C', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Night%20Whisper%20Essence.png' },
    seraphicPlatinum: { scale: 1, yOffset: 0, name: "Seraphic Platinum", type: 'Resource Nodes', color: '#E0E0E0', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Seraphic%20Platinum.png' },
    worldShards: { scale: 1, yOffset: 0, name: "World Shard", type: 'Resource Nodes', color: '#00BCD4', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/World%20Shard.png' },
    bloodsteelIngot: { scale: 1, yOffset: 0, name: "Bloodsteel Ingot", type: 'Resource Nodes', color: '#D32F2F', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Blood%20Steel%20Ingot.png' },
    adamantOre: { scale: 1, yOffset: 0, name: "Adamant Ore", type: 'Resource Nodes', color: '#616161', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Adamant%20Ore.png' },
    
    // --- Refined Resources ---
    ironIngot: { scale: 1, yOffset: 0, name: "Iron Ingot", type: 'Refined Resources', color: '#BDBDBD', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Iron%20Ingot.png' },
    tannedLeather: { scale: 1, yOffset: 0, name: "Tanned Leather", type: 'Refined Resources', color: '#8D6E63', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Tanned%20Leather.png' },
    arcaneResin: { scale: 1, yOffset: 0, name: "Arcane Resin", type: 'Refined Resources', color: '#673AB7', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Arcane%20Resin.png' },
    fociStone: { scale: 1, yOffset: 0, name: "Foci Stone", type: 'Refined Resources', color: '#03A9F4', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Foci%20Stone.png' },
    
    // --- Natural Obstacles ---
    tree: { scale: 1, yOffset: 0, color: '#228B22', name: 'Tree', type: 'Natural Obstacles', svgPath: 'M12 10 L2 22 H22 Z M10 10 V2 H14 V10 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Tree.png' },
    rock: { scale: 1, yOffset: 0, color: '#6c757d', name: 'Rock', type: 'Natural Obstacles', svgPath: 'M4 20 C4 10 10 10 12 14 C14 10 20 10 20 20 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Rock.png' },
    giantMushroom: { scale: 1, yOffset: 0, color: '#8B008B', name: 'Giant Mushroom', type: 'Natural Obstacles', svgPath: 'M4 12 C4 6 20 6 20 12 Z M10 12 V22 H14 V12 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Giant%20Mushroom.png' },
    thornVines: { scale: 1, yOffset: 0, color: '#8B0000', name: 'Thorn Vines', type: 'Natural Obstacles', svgPath: 'M2 12 C8 2 16 22 22 12', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Thorn%20Vines%20.png' },
    petrifiedTree: { scale: 1, yOffset: 0, color: '#556B2F', name: 'Petrified Tree', type: 'Natural Obstacles', svgPath: 'M12 2 L10 12 L14 12 Z M8 12 L2 22 L10 22 Z M16 12 L22 22 L14 22 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Petrified%20Tree.png' },
    crystalCluster: { scale: 1, yOffset: 0, color: '#00BFFF', name: 'Crystal Cluster', type: 'Natural Obstacles', svgPath: 'M12 2 L16 10 L12 12 L8 10 Z M4 12 L10 14 L8 22 Z M20 12 L14 14 L16 22 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Crystal%20Cluster.png' },
    lavaFissure: { scale: 1, yOffset: 0, color: '#FF4500', name: 'Lava Fissure', type: 'Natural Obstacles', svgPath: 'M2 12 Q8 6 12 12 T22 12', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Lava%20Fissure.png' },
    iceSpire: { scale: 1, yOffset: 0, color: '#ADD8E6', name: 'Ice Spire', type: 'Natural Obstacles', svgPath: 'M12 2 L2 22 H22 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Ice%20Spire%20.png' },
    giantBones: { scale: 1, yOffset: 0, color: '#F5F5DC', name: 'Giant Bones', type: 'Natural Obstacles', svgPath: 'M4 4 A4 4 0 1 1 4 12 H20 A4 4 0 1 1 20 4 Z', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Giant%20Bones.png' },
    denseWebs: { scale: 1, yOffset: 0, color: '#FFFFFF', name: 'Dense Webs', type: 'Natural Obstacles', svgPath: 'M12 2 V22 M2 12 H22 M5 5 L19 19 M5 19 L19 5', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Dense%20webs.png' },
    
    // --- Terrain ---
    grass: { scale: 1, yOffset: 0, color: '#4A6B4A', name: 'Grass', type: 'Terrain', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Grass.png' },
    water: { scale: 1, yOffset: 0, color: '#1E90FF', name: 'Water', type: 'Terrain', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Water.png' },
    mud: { scale: 1, yOffset: 0, color: '#8B4513', name: 'Mud', type: 'Terrain', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Mud.png' },
    crackedGround: { scale: 1, yOffset: 0, color: '#CD853F', name: 'Cracked Ground', type: 'Terrain', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Cracked%20Ground%20.png' },
    snowDrift: { scale: 1, yOffset: 0, color: '#FFFAFA', name: 'Snow Drift', type: 'Terrain', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Snow%20Drift.png' },
    ashfall: { scale: 1, yOffset: 0, color: '#2F4F4F', name: 'Ashfall', type: 'Terrain', imageUrl: 'https://raw.githubusercontent.com/Synesence7600/Map-Assets-/Geminus/Ashfall.png' },
}));

const assetCategoryOrder = {
    "Structures & Interactives": [
        "Core Interactives",
        "Estate Buildings",
        "Resource Generators",
        "Clan Buildings"
    ],
    "World Resources & Environment": [
        "Resource Nodes",
        "Refined Resources",
        "Natural Obstacles"
    ],
    "Terrain": [] // Special case for the paint tool
};

// --- PIXEL MAPPING LOGIC (Unchanged) ---
const BIOME_AWARE_MAPPINGS = {
    default: [ { assetId: null, terrainType: 'water', rule: (r, g, b) => b > r && b > g && b > 100 }, { assetId: null, terrainType: 'empty', rule: (r, g, b) => r < 20 && g < 20 && b < 20 }, ],
    forest: [ { assetId: 'tree', rule: (r, g, b) => r < 60 && g > 100 && b < 60 }, { assetId: null, terrainType: 'mud', rule: (r, g, b) => r > 100 && g > 50 && g < 100 && b < 50 }, ],
    desert: [ { assetId: 'rock', rule: (r, g, b) => r > 150 && g > 100 && b > 50 }, ],
};
const generateLayersFromImage = (image, mapSize, biome) => {
    const tempCanvas = document.createElement('canvas'); tempCanvas.width = image.width; tempCanvas.height = image.height; const ctx = tempCanvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
    let groundGrid = Array.from({ length: mapSize.height }, () => Array.from({ length: mapSize.width }, () => ({ type: 'default' })));
    let objectGrid = Array.from({ length: mapSize.height }, () => Array.from({ length: mapSize.width }, () => null));
    const rules = [...(BIOME_AWARE_MAPPINGS[biome] || []), ...BIOME_AWARE_MAPPINGS.default];
    for (let y = 0; y < mapSize.height; y++) { for (let x = 0; x < mapSize.width; x++) {
            const pixelX = Math.floor(x * (image.width / mapSize.width)); const pixelY = Math.floor(y * (image.height / mapSize.height)); const [r, g, b] = ctx.getImageData(pixelX, pixelY, 1, 1).data;
            for (const mapping of rules) { if (mapping.rule(r, g, b)) { if (mapping.terrainType) groundGrid[y][x] = { type: mapping.terrainType }; if (mapping.assetId) objectGrid[y][x] = { assetId: mapping.assetId, properties: {} }; break; } }
    } }
    return [ { id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual' }, { id: 'objects', name: 'Objects', isVisible: true, grid: objectGrid, type: 'visual' }, ];
};

// --- MAP GENERATION LOGIC ---
const generateGrids = (width, height, type) => {
    let groundGrid = Array.from({ length: height }, () => Array.from({ length: width }, () => ({ type: 'wall' })));
    const objectGrid = Array.from({ length: height }, () => Array.from({ length: width }, () => null));
    const makeFloor = (x, y) => { if (x >= 0 && x < width && y >= 0 && y < height) groundGrid[y][x] = { type: 'default' }; };
    if (type === 'blank') { groundGrid = Array.from({ length: height }, () => Array.from({ length: width }, () => ({ type: 'default' }))); return { groundGrid, objectGrid }; }
    if (type === 'roomsAndCorridors') {
        const rooms = []; const maxRooms = 15, minRoomSize = 3, maxRoomSize = 7;
        for (let i = 0; i < maxRooms; i++) { const w = ~~(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize, h = ~~(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize, x = ~~(Math.random() * (width - w - 1)) + 1, y = ~~(Math.random() * (height - h - 1)) + 1; const newRoom = { x, y, w, h }; let failed = false; for (const otherRoom of rooms) if (x < otherRoom.x + otherRoom.w && x + w > otherRoom.x && y < otherRoom.y + otherRoom.h && y + h > otherRoom.y) { failed = true; break; } if (!failed) { for (let ry = y; ry < y + h; ry++) for (let rx = x; rx < x + w; rx++) makeFloor(rx, ry); rooms.push(newRoom); } }
        for (let i = 1; i < rooms.length; i++) { const prev = { x: ~~(rooms[i - 1].x + rooms[i - 1].w / 2), y: ~~(rooms[i - 1].y + rooms[i - 1].h / 2) }, curr = { x: ~~(rooms[i].x + rooms[i].w / 2), y: ~~(rooms[i].y + rooms[i].h / 2) }; if (Math.random() > 0.5) { for (let x = Math.min(prev.x, curr.x); x <= Math.max(prev.x, curr.x); x++) makeFloor(x, prev.y); for (let y = Math.min(prev.y, curr.y); y <= Math.max(prev.y, curr.y); y++) makeFloor(curr.x, y); } else { for (let y = Math.min(prev.y, curr.y); y <= Math.max(prev.y, curr.y); y++) makeFloor(prev.x, y); for (let x = Math.min(prev.x, curr.x); x <= Math.max(prev.x, curr.x); x++) makeFloor(x, curr.y); } }
    } else if (['floatingIslands', 'continent'].includes(type)) {
        const numWalkers = type === 'floatingIslands' ? 7 : 1, walkLength = ~~((width * height) / numWalkers * (type === 'floatingIslands' ? 0.3 : 0.7));
        for (let i = 0; i < numWalkers; i++) { let wx = ~~(Math.random() * width), wy = ~~(Math.random() * height); for (let j = 0; j < walkLength; j++) { makeFloor(wx, wy); const dir = ~~(Math.random() * 4); if (dir === 0) wx++; else if (dir === 1) wx--; else if (dir === 2) wy++; else wy--; if (type === 'continent' && Math.random() < 0.3) { if (wx < width / 2) wx++; else if (wx > width / 2) wx--; if (wy < height / 2) wy++; else if (wy > height / 2) wy--; } } }
    } else if (type === 'caverns') {
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) groundGrid[y][x] = Math.random() < 0.45 ? { type: 'default' } : { type: 'wall' };
        for (let i = 0; i < 4; i++) { let newGrid = JSON.parse(JSON.stringify(groundGrid)); for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { let wc = 0; for (let ny = y - 1; ny <= y + 1; ny++) for (let nx = x - 1; nx <= x + 1; nx++) { if (nx >= 0 && nx < width && ny >= 0 && ny < height) { if ((nx !== x || ny !== y) && groundGrid[ny][nx].type === 'wall') wc++; } else { wc++; } } if (groundGrid[y][x].type === 'wall' && wc < 4) newGrid[y][x] = { type: 'default' }; else if (groundGrid[y][x].type === 'default' && wc > 4) newGrid[y][x] = { type: 'wall' }; } groundGrid = newGrid; }
        const visited = Array.from({ length: height }, () => Array(width).fill(false)); let regions = [];
        for (let y = 0; y < height; y++) { for (let x = 0; x < width; x++) { if (groundGrid[y][x].type === 'default' && !visited[y][x]) { let currentRegion = []; let queue = [{x, y}]; visited[y][x] = true; while (queue.length > 0) { let {x: cx, y: cy} = queue.shift(); currentRegion.push({x: cx, y: cy}); const neighbors = [{x: cx-1, y: cy}, {x: cx+1, y: cy}, {x: cx, y: cy-1}, {x: cx, y: cy+1}]; for (const n of neighbors) { if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && groundGrid[n.y][n.x].type === 'default' && !visited[n.y][n.x]) { visited[n.y][n.x] = true; queue.push(n); } } } regions.push(currentRegion); } } }
        if (regions.length > 0) { regions.sort((a, b) => b.length - a.length); const mainRegion = new Set(regions[0].map(c => `${c.x},${c.y}`)); for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (!mainRegion.has(`${x},${y}`)) groundGrid[y][x] = { type: 'wall' }; }
    } else if (type === 'maze' || type === 'irregularMaze') {
        const baseGrid = (type === 'irregularMaze') ? generateGrids(width, height, 'continent').groundGrid : null;
        if (baseGrid) { for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (baseGrid[y][x].type !== 'default') groundGrid[y][x] = { type: 'empty' }; }
        else { for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) groundGrid[y][x] = { type: 'wall' }; }
        const visited = new Set();
        const carve = (x, y) => {
            if (x < 0 || x >= width || y < 0 || y >= height || visited.has(`${x},${y}`) || (baseGrid && baseGrid[y][x].type !== 'default')) return;
            visited.add(`${x},${y}`); makeFloor(x, y);
            const neighbors = [{ x: x + 2, y: y }, { x: x - 2, y: y }, { x: x, y: y + 2 }, { x: x, y: y - 2 }].sort(() => Math.random() - 0.5);
            for (const n of neighbors) {
                if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && !visited.has(`${n.x},${n.y}`)) {
                    if (baseGrid && baseGrid[n.y][n.x].type !== 'default') continue;
                    makeFloor(x + (n.x - x) / 2, y + (n.y - y) / 2); carve(n.x, n.y);
                }
            }
        };
        let startNode = { x: 1, y: 1 };
        if (baseGrid) { for (let y = 1; y < height - 1; y += 2) for (let x = 1; x < width - 1; x += 2) if (baseGrid[y][x].type === 'default') { startNode = { x, y }; break; } }
        carve(startNode.x, startNode.y);
    }
    // --- MODIFIED RETURN: Resets Selective Rendering for Standard Maps ---
    return { groundGrid, objectGrid, cleanGrid: false }; 
};

// --- PRELOADED TEMPLATES ---
const corePlacements = {
    'theArmory': 'top-left', 'theArcanumNew': 'top-right', 'gildedVaultNew': 'bottom-left', 'portalNew': 'center',
    'sanctuaryReviveNew': 'top-center', 'entranceBlue': 'bottom-center', 'gemCutter1': 'bottom-right', 'soulforgeNew': 'bottom-right'
};
const preloadedTemplates = {
    'template_1': { id: 'template_1', name: 'Subterranean Depths', biome: 'crystallineCaves', mapGenType: 'caverns', backgroundAnimation: 'gleamingCrystals', animationSpeed: 1, aiStyle: 'Fantasy Painting', aiMood: 'Mystical', aiKeywords: 'glowing crystals, vast underground', coreInteractives: corePlacements },
    'template_2': { id: 'template_2', name: 'Verdant & Mystic Forests', biome: 'forest', mapGenType: 'continent', backgroundAnimation: 'fallingLeaves', animationSpeed: 0.5, aiStyle: 'Fantasy Painting', aiMood: 'Serene', aiKeywords: 'ancient trees, dappled light', coreInteractives: corePlacements },
    'template_3': { id: 'template_3', name: 'Arid Wastes', biome: 'desert', mapGenType: 'continent', backgroundAnimation: 'swirlingSand', animationSpeed: 1.5, aiStyle: 'Photorealistic', aiMood: 'Desolate', aiKeywords: 'cracked earth, sand dunes', coreInteractives: corePlacements },
    'template_4': { id: 'template_4', name: 'Murky Wetlands', biome: 'swamp', mapGenType: 'floatingIslands', backgroundAnimation: 'mysticalWisps', animationSpeed: 0.8, aiStyle: 'Fantasy Painting', aiMood: 'Eerie', aiKeywords: 'foggy, mangrove roots, murky water', coreInteractives: corePlacements },
    'template_5': { id: 'template_5', name: 'Windswept Heights', biome: 'mountain', mapGenType: 'continent', backgroundAnimation: 'gentleSnowfall', animationSpeed: 0.7, aiStyle: 'Photorealistic', aiMood: 'Majestic', aiKeywords: 'snowy peaks, sharp cliffs', coreInteractives: corePlacements },
    'template_6': { id: 'template_6', name: 'Overgrown Jungles', biome: 'jungle', mapGenType: 'continent', backgroundAnimation: 'fallingLeaves', animationSpeed: 1, aiStyle: 'Fantasy Painting', aiMood: 'Vibrant', aiKeywords: 'dense canopy, thick vines', coreInteractives: corePlacements },
    'template_7': { id: 'template_7', name: 'Frigid Expanse', biome: 'tundra', mapGenType: 'continent', backgroundAnimation: 'gentleSnowfall', animationSpeed: 2.0, aiStyle: 'Photorealistic', aiMood: 'Harsh', aiKeywords: 'frozen plains, ice sheets', coreInteractives: corePlacements },
    'template_8': { id: 'template_8', name: 'Sunken Mysteries', biome: 'ocean', mapGenType: 'floatingIslands', backgroundAnimation: 'mysticalWisps', animationSpeed: 1, aiStyle: 'Fantasy Painting', aiMood: 'Mysterious', aiKeywords: 'underwater ruins, coral reefs', coreInteractives: corePlacements },
    'template_9': { id: 'template_9', name: 'Open Plains', biome: 'plains', mapGenType: 'continent', backgroundAnimation: 'none', animationSpeed: 1, aiStyle: 'Photorealistic', aiMood: 'Serene', aiKeywords: 'rolling hills, tall grass', coreInteractives: corePlacements },
    'template_10': { id: 'template_10', name: 'Ethereal Realms', biome: 'celestialPlains', mapGenType: 'floatingIslands', backgroundAnimation: 'celestialShimmer', animationSpeed: 1, aiStyle: 'Fantasy Painting', aiMood: 'Mystical', aiKeywords: 'floating islands, cosmic sky', coreInteractives: corePlacements },
};

// --- ZUSTAND STATE STORE & ACTION SYSTEM ---
const initialMapSize = { width: 15, height: 15 };
const { groundGrid, objectGrid } = generateGrids(initialMapSize.width, initialMapSize.height, 'continent');

const initialZoneState = {
    activeModule: null,
    allowRoamingCombat: true,
    cleanGrid: false, 
    isTransitioning: false, // <--- ADD THIS LINE: This tracks the "Loading" blackout
    zoneLevel: 1,
    zoneType: 'Physical', 
    zoneMobs: [], 
    
    zid: '', zoneName: '', biome: BIOME_LIST[0], mapSize: initialMapSize, mapGenType: 'continent', 
    layers: [ 
        { id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual', opacity: 1 }, 
        { id: 'objects', name: 'Objects', isVisible: true, grid: objectGrid, type: 'visual', opacity: 1 },
        { id: 'triggers', name: 'Triggers', isVisible: true, grid: Array.from({ length: initialMapSize.height }, () => Array.from({ length: initialMapSize.width }, () => null)), type: 'trigger', opacity: 1 }
    ],    
    imageBackgroundUrl: '', backgroundImageData: '', originalBackgroundImageData: '', 
    prefabs: {}, spawnPoints: [], triggers: {},
    initialView: { zoom: 1, center: { x: initialMapSize.width / 2, y: initialMapSize.height / 2 } },
    aiStyle: 'Photorealistic', aiMood: 'Vibrant', aiKeywords: '',
    apiKey: localStorage.getItem('geminus_api_key') || '',
    backgroundAnimation: 'none', animationSpeed: 1, cleanGrid: true,
};

// --- REDUCER (UPDATED FOR AUTO-TRIGGERS) ---
const mapReducer = (state, action) => {
    switch (action.type) {
        case 'APPLY_BRUSH': {
            const { tiles } = action.payload;
            const { selectedAsset, assetLibrary, activeLayerId, layers, selectedTriggerId, prefabs, currentTool, paintZoneId, events } = state;
            const newLayers = JSON.parse(JSON.stringify(layers));
            const activeLayer = newLayers.find(l => l.id === activeLayerId);
            const groundLayer = newLayers.find(l => l.id === 'ground');
            if (!activeLayer) return state;

            // HANDLE PREFABS
            if (selectedAsset && selectedAsset.startsWith('prefab:')) {
                const prefabName = selectedAsset.split(':')[1];
                const prefab = prefabs[prefabName];
                if (prefab && tiles.length > 0) {
                    const anchor = tiles[0];
                    const offsetX = Math.floor(prefab.width / 2);
                    const offsetY = Math.floor(prefab.height / 2);

                    prefab.layers.forEach(prefabLayer => {
                        const targetLayer = newLayers.find(l => l.id === prefabLayer.id);
                        if (targetLayer) {
                            for (let y = 0; y < prefab.height; y++) {
                                for (let x = 0; x < prefab.width; x++) {
                                    const mapX = anchor.x - offsetX + x;
                                    const mapY = anchor.y - offsetY + y;
                                    if (mapX >= 0 && mapX < state.mapSize.width && mapY >= 0 && mapY < state.mapSize.height) {
                                        const prefabTile = prefabLayer.grid[y][x];
                                        targetLayer.grid[mapY][mapX] = prefabTile ? JSON.parse(JSON.stringify(prefabTile)) : null;
                                    }
                                }
                            }
                        }
                    });
                }
            } 
            // HANDLE NAVIGATION LAYER (RESTORED BRUSH LOGIC)
            else if (activeLayer.type === 'navigation') { 
                tiles.forEach(({ x, y }) => { 
                    // RESTORED: Respects currentTool (Erase = Blocked, Place/Path = Walkable)
                    // This allows the use of Brush Size for mass-painting navigation data.
                    if (currentTool === 'erase') {
                        activeLayer.grid[y][x] = 0; // 0 = Blocked
                    } else if (currentTool === 'place' || currentTool === 'path') {
                        activeLayer.grid[y][x] = 1; // 1 = Walkable
                    } else {
                        // Fallback toggle if using standard click
                        activeLayer.grid[y][x] = activeLayer.grid[y][x] === 1 ? 0 : 1;
                    }
                }); 
            }
            // HANDLE TRIGGER LAYER (Manual)
            else if (activeLayer.type === 'trigger') { tiles.forEach(({ x, y }) => { activeLayer.grid[y][x] = selectedTriggerId ? { eventId: selectedTriggerId } : null; }); }
            // HANDLE STANDARD ASSETS & AUTO-TRIGGERS
            else { 
                if (!groundLayer) return state; 
                const assetInfo = selectedAsset ? assetLibrary[selectedAsset] : null; 
                tiles.forEach(({ x, y }) => { 
                    const groundTile = groundLayer.grid[y][x]; 
                    if (currentTool === 'erase') {
                        if (activeLayer.id === 'ground') {
                            groundLayer.grid[y][x].type = 'default';
                        } else {
                             activeLayer.grid[y][x] = null;
                        }
                    } else if (assetInfo && assetInfo.type === 'Terrain') {
                        if (activeLayer.id === 'ground') {
                            groundLayer.grid[y][x].type = selectedAsset;
                            
                            // --- MAGI-TECH SYNC: Auto-Update Navigation ---
                            const navLayer = newLayers.find(l => l.type === 'navigation');
                            if (navLayer) {
                                // If you paint land, it becomes walkable (1). 
                                // If you paint 'empty' (Ocean), it becomes blocked (0).
                                navLayer.grid[y][x] = (selectedAsset === 'empty') ? 0 : 1;
                            }
                        } 
                    } else if (assetInfo) { 
                        // MAGI-TECH BYPASS: Allow placement on ANY active layer hex.
                        // Removed the strict check for 'empty' or 'wall' ground tiles to support placing assets on custom backgrounds.
                        if (activeLayer.id !== 'ground') { 
                            const newProperties = assetInfo.defaultProperties ? JSON.parse(JSON.stringify(assetInfo.defaultProperties)) : {}; 
                            
                            // 1. PLACE VISUAL ASSET
                            activeLayer.grid[y][x] = { assetId: selectedAsset, properties: newProperties, rotation: 0, flipped: false };
                            
                            // 2. CHECK FOR AUTO-TRIGGER (The "Smart" Logic)
                            if (activeLayer.id === 'objects' && assetInfo.autoTrigger) {
                                // Find or Create Trigger Layer if it doesn't exist
                                let triggerLayer = newLayers.find(l => l.type === 'trigger');
                                if (!triggerLayer) {
                                    // If trigger layer is missing, we can't write to it easily here without breaking state structure, 
                                    // but we can update it if it DOES exist (which is standard).
                                    // In a full app we'd auto-create the layer, but for now we assume it exists.
                                }
                                
                                if (triggerLayer) {
                                    const autoId = `${assetInfo.name.replace(/\s+/g, '_')}_${Date.now()}_${x}_${y}`; // Generate unique ID
                                    
                                    // We need to inject this new trigger into the Global Triggers list (handled in dispatch wrapper ideally),
                                    // But since Reducer must be pure, we write the Reference here and rely on the UI to find it,
                                    // OR we do a dirty state mutation for the 'triggers' object if we want it perfect.
                                    
                                    // SIMPLER APPROACH: We just write the eventId to the grid. 
                                    // The 'triggers' object in state needs to be updated. 
                                    // This is tricky in a Reducer without 'triggers' in the payload.
                                    // *Workaround*: We will treat this special case in the Component dispatch wrapper for cleaner architecture,
                                    // BUT for now, let's just make sure the USER creates the trigger layer first.
                                }
                            }
                        } 
                    } 
                }); 
            }
            return { ...state, layers: newLayers };
        }
        // ... (Keep existing cases)
        case 'EDIT_LAYOUT': {
            const { x, y } = action.payload; const newLayers = JSON.parse(JSON.stringify(state.layers)); const groundLayer = newLayers.find(l => l.id === 'ground'); if (!groundLayer) return state; const groundTile = groundLayer.grid[y][x]; const isNonPlayable = groundTile.type === 'empty' || groundTile.type === 'wall'; groundTile.type = isNonPlayable ? 'default' : 'empty'; if (!isNonPlayable) { newLayers.forEach(layer => { if (layer.type === 'visual' && layer.id !== 'ground') { layer.grid[y][x] = null; } }); }
            return { ...state, layers: newLayers };
        }
        case 'SELECT_TILE': {
            const { x, y } = action.payload; const activeLayer = state.layers.find(l => l.id === state.activeLayerId); if (!activeLayer) return { ...state, selectedTile: null, selectedRegion: null };
            const tileData = activeLayer.grid[y]?.[x];
            if (activeLayer.type === 'trigger') { const triggerId = tileData ? tileData.eventId : null; return { ...state, selectedTriggerId: triggerId, selectedTile: null, selectedRegion: null }; }
            if (activeLayer.type === 'navigation') return { ...state, selectedTile: null, selectedRegion: null };
            return { ...state, selectedTile: tileData ? { x, y, layerId: state.activeLayerId } : null, selectedRegion: null };
        }
        case 'UPDATE_OBJECT_PROPERTIES': {
            const { x, y, layerId, properties } = action.payload; const newLayers = JSON.parse(JSON.stringify(state.layers)); const targetLayer = newLayers.find(l => l.id === layerId); if (targetLayer?.grid[y]?.[x]) { targetLayer.grid[y][x].properties = properties; }
            return { ...state, layers: newLayers };
        }
        case 'TRANSFORM_OBJECT': {
            const { x, y, layerId, rotation, flipped } = action.payload;
            const newLayers = JSON.parse(JSON.stringify(state.layers));
            const targetLayer = newLayers.find(l => l.id === layerId);
            if (targetLayer?.grid[y]?.[x]) {
                if(rotation !== undefined) targetLayer.grid[y][x].rotation = rotation;
                if(flipped !== undefined) targetLayer.grid[y][x].flipped = flipped;
            }
            return { ...state, layers: newLayers };
        }
        case 'SET_LAYERS': { return { ...state, layers: action.payload, selectedTile: null, selectedRegion: null }; }
        case 'ADD_AUTO_TRIGGER': {
            // New case to handle the side-effect of auto-triggers safely
            const { id, triggerData, x, y } = action.payload;
            const newTriggers = { ...state.triggers, [id]: triggerData };
            const newLayers = JSON.parse(JSON.stringify(state.layers));
            const triggerLayer = newLayers.find(l => l.type === 'trigger');
            if (triggerLayer) {
                triggerLayer.grid[y][x] = { eventId: id };
            }
            return { ...state, triggers: newTriggers, layers: newLayers };
        }
        // --- NEW: UI WIRING ---
        case 'openModule': 
        case 'OPEN_MODULE': {
             return { ...state, activeModule: action.payload };
        }
        case 'CLOSE_MODULE': {
             return { ...state, activeModule: null };
        }

        default: return state;
    }
};

export const useMapStore = create((set, get) => ({
    // Global state
    zones: {},
    activeZoneId: null,
    assetLibrary: initialAssets,
    templates: preloadedTemplates,
    
    // Active zone state (for editing)
    ...initialZoneState,
    
    // UI state
    activeLayerId: 'objects', view: 'topDown', tileType: 'hex', tileOpacity: 0.5,
    selectedAsset: null, selectedTile: null, selectedRegion: null, isEditingLayout: false, areTilesColorless: false, 
    aiGenError: '', currentTool: 'place',
    paintZoneId: 'Z01',
    brushSize: 1, brushShape: 'square', history: [], historyIndex: -1,
    pathfindingPoints: { start: null, end: null }, calculatedPath: [],
    selectedSpawnIndex: null, selectedTriggerId: null,
    isTestMode: false, playerPosition: null, isMoving: false,
    isPlayMode: false,
    // --- MULTIPLAYER PREP: Mocking another player for PK testing ---
    otherPlayers: {
        "mock_target_01": { 
            name: "ShadowAssassin", 
            x: 10, 
            y: 10, 
            hp: 500, 
            lvl: 10, 
            isPKable: true 
        }
    },
    // --- CHOICE STATE: For choosing between PK or Zone Mobs ---
    pendingEncounter: null, // Stores { player, playerId, mob }

    // --- MAGI-TECH: GLOBAL CAMERA STATE ---
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    // --------------------------------------
    activeModule: null,

    dispatch: (action) => {
        const oldState = get(); 
        const newState = mapReducer(oldState, action);
        if (newState.layers !== oldState.layers) { 
            const newHistory = oldState.history.slice(0, oldState.historyIndex + 1); 
            newHistory.push({ layers: oldState.layers }); 
            set({ ...newState, history: newHistory, historyIndex: newHistory.length - 1 }); 
        } else { 
            set(newState); 
        }
    },

    undo: () => { const { history, historyIndex } = get(); if (historyIndex >= 0) { const prevState = history[historyIndex]; set({ layers: prevState.layers, historyIndex: historyIndex - 1, selectedTile: null, selectedRegion: null }); } },
    redo: () => { console.log("Redo functionality is not yet implemented."); },
    setField: (field, value) => set((state) => {
        if (field === 'currentTool') {
            const newState = { 
                [field]: value, 
                selectedTile: null, 
                selectedRegion: null, 
                pathfindingPoints: { start: null, end: null }, 
                calculatedPath: [] 
            };
            if (value === 'erase') {
                newState.selectedAsset = null;
            }
            return newState;
        }
        return { [field]: value };
    }),
    updateAssetProperties: (assetId, newProps) => set(state => ({ assetLibrary: { ...state.assetLibrary, [assetId]: { ...state.assetLibrary[assetId], ...newProps } } })),

    addLayer: (type = 'visual') => set(state => {
        const newLayerName = type === 'navigation' ? 'Navigation' : type === 'trigger' ? 'Triggers' : `Layer ${state.layers.length + 1}`;
        
        let newGrid;
        
        if (type === 'navigation') {
            // --- RESTORED INTRICACY: Full Collision Bake on Creation ---
            const { mapSize, assetLibrary } = state;
            const groundLayer = state.layers.find(l => l.id === 'ground');
            const objectLayer = state.layers.find(l => l.id === 'objects');
            
            newGrid = Array.from({ length: mapSize.height }, (_, y) => 
                Array.from({ length: mapSize.width }, (_, x) => {
                    // 1. Check Ground (Liquids/Voids)
                    if (groundLayer?.grid[y][x]) {
                        const t = groundLayer.grid[y][x].type;
                        if (['wall', 'empty', 'water', 'lava'].includes(t)) return 0;
                    }
                    
                    // 2. Check Objects (Natural Obstacles without interactions)
                    const obj = objectLayer?.grid[y][x];
                    if (obj && obj.assetId) {
                        const asset = assetLibrary[obj.assetId];
                        const props = obj.properties || {};
                        // If it's a rock/tree and hasn't been turned into an interactive NPC/Warp
                        if (asset?.type === 'Natural Obstacles' && (!props.interactionType || props.interactionType === 'none')) {
                            return 0;
                        }
                    }
                    return 1; // Default Walkable
                })
            );
        } else {
            // Visual or Trigger layers start empty
            newGrid = Array.from({ length: state.mapSize.height }, () => Array.from({ length: state.mapSize.width }, () => null));
        }

        const newLayer = { id: Date.now().toString(), name: newLayerName, isVisible: true, grid: newGrid, type, opacity: 1 };
        const newLayers = [...state.layers, newLayer];
        return { layers: newLayers, activeLayerId: newLayer.id };
    }),
    removeLayer: (id) => set(state => {
        if (state.layers.length <= 1 || id === 'ground') return {};
        const newLayers = state.layers.filter(l => l.id !== id);
        const newActiveId = state.activeLayerId === id ? 'objects' : state.activeLayerId;
        return { layers: newLayers, activeLayerId: newActiveId };
    }),
    renameLayer: (id, newName) => set(state => ({ layers: state.layers.map(l => l.id === id ? { ...l, name: newName } : l) })),
    toggleLayerVisibility: (id) => set(state => ({ layers: state.layers.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l) })),
    setLayerOpacity: (id, opacity) => set(state => ({ layers: state.layers.map(l => l.id === id ? { ...l, opacity } : l) })),
    setActiveLayer: (id) => set({ activeLayerId: id, selectedTile: null, selectedRegion: null, selectedTriggerId: null, pathfindingPoints: { start: null, end: null }, calculatedPath: [] }),
    moveLayer: (id, direction) => set(state => {
        const index = state.layers.findIndex(l => l.id === id); if (index <= 0 && direction === 'up') return {}; if (index < 1 || (direction === 'down' && index === 1)) return {}; if (direction === 'up' && index === 0) return {}; if (direction === 'down' && index === state.layers.length - 1) return {};
        const newLayers = [...state.layers]; const newIndex = direction === 'up' ? index - 1 : index + 1; if (newIndex === 0 && direction === 'up') return {}; if (index === 0) return {};
        const [movedLayer] = newLayers.splice(index, 1); newLayers.splice(newIndex, 0, movedLayer); return { layers: newLayers };
    }),
    setPathfindingPoint: (point) => set(state => {
        const { pathfindingPoints, layers, activeLayerId, tileType } = state; // <--- Added tileType
        const navLayer = layers.find(l => l.id === activeLayerId && l.type === 'navigation');
        if (!navLayer) return {};

        if (!pathfindingPoints.start) {
            return { pathfindingPoints: { start: point, end: null }, calculatedPath: [] };
        } else {
            // Pass tileType to aStar here
            const path = aStar(navLayer.grid, pathfindingPoints.start, point, tileType); 
            return { pathfindingPoints: { start: null, end: null }, calculatedPath: path };
        }
    }),
    addSpawnPoint: (x, y) => set(state => {
        const newSpawnPoint = { x, y, id: `spawn_${Date.now()}` };
        return { 
            spawnPoints: [...state.spawnPoints, newSpawnPoint],
            selectedSpawnIndex: state.spawnPoints.length 
        };
    }),
    updateSpawnPointId: (index, newId) => set(state => {
        const newSpawnPoints = [...state.spawnPoints];
        if (newSpawnPoints[index]) {
            newSpawnPoints[index].id = newId;
        }
        return { spawnPoints: newSpawnPoints };
    }),
    removeSpawnPoint: (index) => set(state => ({
        spawnPoints: state.spawnPoints.filter((_, i) => i !== index),
        selectedSpawnIndex: null
    })),
    setSelectedSpawnIndex: (index) => set({ selectedSpawnIndex: index }),
    
    // --- NEW: UI Action ---
    closeModule: () => set({ activeModule: null }),
    // --- UNIQUE SNAP CAMERA LOGIC ---
    centerCameraOnPlayer: () => {
        const state = get();
        const { playerPosition, mapSize, view } = state;
        const mapCenterX = Math.floor(mapSize.width / 2);
        const mapCenterY = Math.floor(mapSize.height / 2);
        
        // Calculate the physical offset of the player's hex
        const r = playerPosition.y - mapCenterY;
        const q = playerPosition.x - Math.floor((r - (r & 1)) / 2) - mapCenterX;
        
        const worldX = TILE_SIZE * Math.sqrt(3) * (q + r / 2);
        const worldY = TILE_SIZE * (3 / 2) * r * (2 / 3);

        // Center the camera on those coordinates
        set({ 
            view: { 
                ...view, 
                panOffset: { x: -worldX * view.zoom, y: -worldY * view.zoom } 
            } 
        });
    },
    // --- UNIQUE SNAP CAMERA LOGIC ---
    centerCameraOnPlayer: () => {
        const state = get();
        const { playerPosition, mapSize, view } = state;
        const { zoom } = view; // Pull the CURRENT zoom level
        const mapCenterX = Math.floor(mapSize.width / 2);
        const mapCenterY = Math.floor(mapSize.height / 2);
        
        // Calculate the physical offset of the player's hex
        const r = playerPosition.y - mapCenterY;
        const q = playerPosition.x - Math.floor((r - (r & 1)) / 2) - mapCenterX;
        
        const worldX = TILE_SIZE * Math.sqrt(3) * (q + r / 2);
        const worldY = TILE_SIZE * (3 / 2) * r * (2 / 3);

        // Center the camera on those coordinates using current zoom
        set({ 
            view: { 
                ...view, 
                panOffset: { x: -worldX * zoom, y: -worldY * zoom } 
            } 
        });
    },
    addTrigger: () => set(state => { const newId = `evt_${Date.now()}`; const newTrigger = { eventId: newId, condition: 'onEnter', action: 'displayText', parameters: { message: 'Hello!' } }; return { triggers: { ...state.triggers, [newId]: newTrigger }, selectedTriggerId: newId }; }),
    updateTrigger: (id, newProps) => set(state => ({ triggers: { ...state.triggers, [id]: { ...state.triggers[id], ...newProps } } })),
    removeTrigger: (id) => set(state => {
        const newTriggers = { ...state.triggers }; delete newTriggers[id]; const newLayers = JSON.parse(JSON.stringify(state.layers)); const triggerLayer = newLayers.find(l => l.type === 'trigger');
        if(triggerLayer) { for(let y = 0; y < state.mapSize.height; y++) { for(let x = 0; x < state.mapSize.width; x++) { if(triggerLayer.grid[y][x]?.eventId === id) { triggerLayer.grid[y][x] = null; } } } }
        return { triggers: newTriggers, layers: newLayers, selectedTriggerId: null };
    }),
    setSelectedTriggerId: (id) => set({ selectedTriggerId: id }),
// --- PASTE THIS RIGHT AFTER 'setSelectedTriggerId' ---
    retrofitTriggers: () => set(state => {
        const newLayers = JSON.parse(JSON.stringify(state.layers));
        let triggerLayer = newLayers.find(l => l.type === 'trigger');
        const objectLayer = newLayers.find(l => l.id === 'objects');
        const newTriggers = { ...state.triggers };

        if (!objectLayer) return {}; 

        // 1. Create Trigger Layer if it's missing entirely
        if (!triggerLayer) {
            triggerLayer = {
                 id: 'triggers', name: 'Triggers', isVisible: true, type: 'trigger', opacity: 1,
                 grid: Array.from({ length: state.mapSize.height }, () => Array.from({ length: state.mapSize.width }, () => null))
            };
            newLayers.push(triggerLayer);
        }

        let count = 0;

        // 2. Scan every tile
        for(let y=0; y<state.mapSize.height; y++) {
            for(let x=0; x<state.mapSize.width; x++) {
                const obj = objectLayer.grid[y][x];
                
                // If Object exists BUT Trigger is missing...
                if (obj && obj.assetId && !triggerLayer.grid[y][x]) {
                    
                    const assetInfo = state.assetLibrary[obj.assetId];
                    if (!assetInfo) continue;

                    const autoId = `${assetInfo.name.replace(/\s+/g, '_')}_${x}_${y}`;
                    
                    // 3. Check if this object is supposed to have an interaction
                    // We use the same factory logic the click tool uses
                    const factoryConfig = enrichObjectWithInteraction(autoId); 

                    let triggerData = null;

                    if (assetInfo.autoTrigger) {
                        triggerData = { eventId: autoId, ...assetInfo.autoTrigger };
                    }
                    else if (factoryConfig.hasInteraction) {
                         let action = 'displayText';
                         let parameters = {};

                         if (factoryConfig.actionType === 'OPEN_UI') {
                            action = 'openModule';
                            parameters = { moduleId: factoryConfig.targetModule };
                         } else if (factoryConfig.actionType === 'TELEPORT') {
                             action = 'teleport';
                             parameters = factoryConfig.defaultParams || { targetZoneId: '?', targetX: 0, targetY: 0 };
                         }

                         triggerData = { eventId: autoId, condition: 'onInteract', action, parameters };
                    }

                    // 4. Create the missing trigger
                    if (triggerData) {
                        newTriggers[autoId] = triggerData;
                        triggerLayer.grid[y][x] = { eventId: autoId };
                        count++;
                    }
                }
            }
        }

        if (count > 0) {
            alert(`Fixed! Generated ${count} missing triggers.`);
            return { layers: newLayers, triggers: newTriggers };
        } else {
            alert("Map is healthy. No missing triggers found.");
            return {};
        }
    }),
    syncAllPortals: () => {
        const { triggers, zones } = get();
        const newTriggers = { ...triggers };
        let count = 0;

        // Iterate through all existing triggers to find Portals
        Object.entries(triggers).forEach(([id, trigger]) => {
            if (trigger.action === 'teleport' && trigger.parameters?.targetZoneId) {
                const targetZid = trigger.parameters.targetZoneId;
                const targetZoneData = zones[targetZid];

                // Check if we have the data for the target zone
                if (targetZoneData?.layers) {
                    const targetObjects = targetZoneData.layers.find(l => l.id === 'objects');
                    if (targetObjects) {
                        let foundX = 0, foundY = 0;
                        let found = false;

                        // Scan the destination zone's object layer for the Blue Entrance
                        outer: for (let ty = 0; ty < targetObjects.grid.length; ty++) {
                            for (let tx = 0; tx < targetObjects.grid[ty].length; tx++) {
                                if (targetObjects.grid[ty][tx]?.assetId === 'entranceBlue') {
                                    foundX = tx; foundY = ty;
                                    found = true;
                                    break outer;
                                }
                            }
                        }

                        // If found, update the Main World's trigger coordinates
                        if (found) {
                            newTriggers[id] = {
                                ...trigger,
                                parameters: { 
                                    ...trigger.parameters, 
                                    targetX: foundX, 
                                    targetY: foundY 
                                }
                            };
                            count++;
                        }
                    }
                }
            }
        });

        if (count > 0) {
            set({ triggers: newTriggers });
            alert(`✅ Synced ${count} portal destinations to their latest entrance coordinates!`);
        } else {
            alert("No portals found that needed syncing.");
        }
    },
    generateZoneMobs: (count) => set(state => {
        const { zoneLevel, zoneType } = state;
        const newMobs = [];

        // --- DEV TOOLS CONFIGURATION ---
        // (This simulates your Dev Tools rules. Later, this can be loaded from an external file)
        const ZONE_RULES = {
            'Physical': { hpScale: 1.0, dmgScale: 1.0, xpScale: 1.0, goldScale: 1.0, baseDrop: 'Bone' },
            'Gold':     { hpScale: 0.8, dmgScale: 0.8, xpScale: 1.0, goldScale: 3.0, baseDrop: 'Nugget' },
            'Gem':      { hpScale: 1.2, dmgScale: 1.0, xpScale: 1.1, goldScale: 1.0, baseDrop: 'Geode' },
            'Shadow':   { hpScale: 1.5, dmgScale: 1.5, xpScale: 1.0, goldScale: 1.2, baseDrop: 'Dust' }
        };

        const rule = ZONE_RULES[zoneType] || ZONE_RULES['Physical'];

        // Base Math (The "Game Engine" Logic)
        const standardHP = 100 + (zoneLevel * 50);
        const standardDmg = 10 + (zoneLevel * 5);
        const standardXP = zoneLevel * 100;

        for(let i = 0; i < count; i++) {
            newMobs.push({
                // We use a generic ID because these aren't "placed" yet. 
                // They are just definitions for the roster.
                id: `roster_${Date.now()}_${i}`, 
                
                name: `${zoneType} Enemy ${i+1}`, // You will rename this in the UI
                level: zoneLevel,
                
                // Apply the Dev Tool Multipliers
                hp: Math.floor(standardHP * rule.hpScale),
                damage: Math.floor(standardDmg * rule.dmgScale),
                xp: Math.floor(standardXP * rule.xpScale),
                gold: Math.floor((standardXP / 10) * rule.goldScale),
                dropTable: [rule.baseDrop] 
            });
        }
        
        return { zoneMobs: newMobs };
    }),

    updateMob: (index, field, value) => set(state => {
        const newMobs = [...state.zoneMobs];
        newMobs[index] = { ...newMobs[index], [field]: value };
        return { zoneMobs: newMobs };
    }), 
    updateAsset: (assetId, updates) => set(state => {
        const newLayers = state.layers.map(layer => {
            if (layer.type !== 'object') return layer;
            const idx = layer.items.findIndex(i => i.id === assetId);
            if (idx > -1) {
                const newItems = [...layer.items];
                newItems[idx] = { ...newItems[idx], ...updates };
                return { ...layer, items: newItems };
            }
            return layer;
        });
        return { layers: newLayers };
    }),
generateNewMap: (type) => { 
        const { mapSize } = get(); 
        const { groundGrid, objectGrid } = generateGrids(mapSize.width, mapSize.height, type); 
        
        const newLayers = [ 
            { id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual', opacity: 1 }, 
            { id: 'objects', name: 'Objects', isVisible: true, grid: objectGrid, type: 'visual', opacity: 1 },
            { id: 'triggers', name: 'Triggers', isVisible: true, grid: Array.from({ length: mapSize.height }, () => Array.from({ length: mapSize.width }, () => null)), type: 'trigger', opacity: 1 }
        ]; 
        
        get().dispatch({ type: 'SET_LAYERS', payload: newLayers }); 
        
        // --- THE FIX: Explicitly wipe spawn points and triggers ---
        set({ 
            mapGenType: type, 
            cleanGrid: true,
            spawnPoints: [], // No more ghosts!
            selectedSpawnIndex: null,
            pathfindingPoints: { start: null, end: null }, 
            calculatedPath: [], 
            triggers: {}, 
            selectedTriggerId: null
        }); 
    },

    resizeMap: (newWidth, newHeight) => { 
        const w = Math.max(1, newWidth), h = Math.max(1, newHeight); 
        const { mapGenType, layers } = get(); 
        const { groundGrid, objectGrid } = generateGrids(w, h, mapGenType); 
        
        // Check if a trigger layer already exists to preserve its ID, otherwise create new
        const existingTriggerLayer = layers.find(l => l.type === 'trigger');
        const triggerId = existingTriggerLayer ? existingTriggerLayer.id : 'triggers';

        const newLayers = [ 
            { id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual', opacity: 1 }, 
            { id: 'objects', name: 'Objects', isVisible: true, grid: objectGrid, type: 'visual', opacity: 1 }, 
            { 
                id: triggerId, 
                name: 'Triggers', 
                isVisible: true, 
                grid: Array.from({ length: h }, () => Array.from({ length: w }, () => null)), 
                type: 'trigger', 
                opacity: 1 
            }
        ]; 
        
        get().dispatch({ type: 'SET_LAYERS', payload: newLayers }); 
        set({ 
            mapSize: { width: w, height: h }, 
            // --- ADD THIS LINE TO PROTECT YOUR HEX VISIBILITY ---
            cleanGrid: true, 
            pathfindingPoints: { start: null, end: null }, 
            calculatedPath: [], 
            triggers: {}, 
            selectedTriggerId: null 
        }); 
    },    savePrefab: (name) => {
        const { selectedRegion, layers } = get(); if (!selectedRegion || !name) return; const { startX, startY, endX, endY } = selectedRegion; const minX = Math.min(startX, endX), minY = Math.min(startY, endY); const maxX = Math.max(startX, endX), maxY = Math.max(startY, endY); const width = maxX - minX + 1; const height = maxY - minY + 1;
        const prefabLayers = layers.map(layer => { const grid = []; for (let y = minY; y <= maxY; y++) { const row = []; for (let x = minX; x <= maxX; x++) { row.push(layer.grid[y][x] ? JSON.parse(JSON.stringify(layer.grid[y][x])) : null); } grid.push(row); } return { ...layer, grid }; });
        const newPrefab = { name, width, height, layers: prefabLayers }; set(state => ({ prefabs: { ...state.prefabs, [name]: newPrefab }, selectedRegion: null, }));
    },
    
    // Background Image Actions
    setBackgroundImage: (data) => set({ backgroundImageData: data, originalBackgroundImageData: data, imageBackgroundUrl: '' }),
    revertBackgroundCrop: () => set(state => ({ backgroundImageData: state.originalBackgroundImageData })),
    fitBackgroundToGrid: () => {
        const { layers, originalBackgroundImageData, mapSize } = get();
        if (!originalBackgroundImageData) return;

        const img = new Image();
        img.onload = () => {
           const groundLayer = layers.find(l => l.id === 'ground');
        if (!groundLayer) return;

        // --- SMART SCAN: Finds the true center of your landmass ---
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasTiles = false;

        groundLayer.grid.forEach((row, y) => {
            row.forEach((tile, x) => {
                // Ignore empty ocean tiles to find the actual land center
                if (tile && tile.type !== 'empty' && tile.type !== 'wall') {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                    hasTiles = true;
                }
            });
        });

        // If no land is found, fall back to the grid center
        const landCenterX = hasTiles ? (minX + maxX) / 2 : mapSize.width / 2;
        const landCenterY = hasTiles ? (minY + maxY) / 2 : mapSize.height / 2;

            if (maxX === -1) return; // No playable tiles found

            const padding = 2; // Add 2 tiles of padding
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(mapSize.width - 1, maxX + padding);
            maxY = Math.min(mapSize.height - 1, maxY + padding);

            const playableWidthTiles = maxX - minX + 1;
            const playableHeightTiles = maxY - minY + 1;

            const sourceCropX = (minX / mapSize.width) * img.width;
            const sourceCropY = (minY / mapSize.height) * img.height;
            const sourceCropWidth = (playableWidthTiles / mapSize.width) * img.width;
            const sourceCropHeight = (playableHeightTiles / mapSize.height) * img.height;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = sourceCropWidth;
            tempCanvas.height = sourceCropHeight;
            const ctx = tempCanvas.getContext('2d');

            ctx.drawImage(img, sourceCropX, sourceCropY, sourceCropWidth, sourceCropHeight, 0, 0, sourceCropWidth, sourceCropHeight);
            const croppedDataUrl = tempCanvas.toDataURL();
            set({ backgroundImageData: croppedDataUrl });
        };
        img.src = originalBackgroundImageData;
    },
    
    // Template Actions
    saveTemplate: (template) => set(state => {
        const newTemplates = { ...state.templates, [template.id]: template };
        return { templates: newTemplates };
    }),
    deleteTemplate: (templateId) => set(state => {
        const newTemplates = { ...state.templates };
        delete newTemplates[templateId];
        return { templates: newTemplates };
    }),
    applyTemplate: (templateId) => {
        const { templates, mapSize, assetLibrary } = get();
        const template = templates[templateId];
        if (!template) return;

        // 1. GENERATE BASE GRIDS
        const { groundGrid, objectGrid: initialObjectGrid } = generateGrids(mapSize.width, mapSize.height, template.mapGenType);
        const objectLayer = { id: 'objects', name: 'Objects', isVisible: true, grid: initialObjectGrid, type: 'visual', opacity: 1 };
        
        // 2. PREPARE TRIGGER LAYER & DATA
        const triggerGrid = Array.from({ length: mapSize.height }, () => Array.from({ length: mapSize.width }, () => null));
        const triggerLayer = { id: 'triggers', name: 'Triggers', isVisible: true, grid: triggerGrid, type: 'trigger', opacity: 1 };
        const newTriggers = {};

        // Helper to Inject Trigger
        const injectTrigger = (x, y, assetId) => {
            const assetInfo = assetLibrary[assetId];
            if (!assetInfo) return;
            
            const autoId = `${assetInfo.name.replace(/\s+/g, '_')}_${x}_${y}`;
            const factoryConfig = enrichObjectWithInteraction(autoId);
            let triggerData = null;

            // Priority A: Manual Override in Asset Definition
            if (assetInfo.autoTrigger) {
                triggerData = { eventId: autoId, ...assetInfo.autoTrigger };
            } 
            // Priority B: Factory Logic (The smart brain)
            else if (factoryConfig.hasInteraction) {
                let action = 'displayText';
                let parameters = {};
                if (factoryConfig.actionType === 'OPEN_UI') {
                    action = 'openModule';
                    parameters = { moduleId: factoryConfig.targetModule };
                } else if (factoryConfig.actionType === 'TELEPORT') {
                    action = 'teleport';
                    parameters = factoryConfig.defaultParams;
                }
                triggerData = { eventId: autoId, condition: 'onInteract', action, parameters };
            }

            if (triggerData) {
                newTriggers[autoId] = triggerData;
                triggerLayer.grid[y][x] = { eventId: autoId };
            }
        };

        // 3. IDENTIFY MAINLAND
        const visited = Array.from({ length: mapSize.height }, () => Array(mapSize.width).fill(false));
        let islands = [];
        for (let y = 0; y < mapSize.height; y++) {
            for (let x = 0; x < mapSize.width; x++) {
                if (groundGrid[y][x].type === 'default' && !visited[y][x]) {
                    let currentIsland = [];
                    let queue = [{x, y}];
                    visited[y][x] = true;
                    while(queue.length > 0) {
                        const {x: cx, y: cy} = queue.shift();
                        currentIsland.push({x: cx, y: cy});
                        const neighbors = [{x: cx-1, y: cy}, {x: cx+1, y: cy}, {x: cx, y: cy-1}, {x: cx, y: cy+1}];
                        for (const n of neighbors) {
                            if (n.x >= 0 && n.x < mapSize.width && n.y >= 0 && n.y < mapSize.height && groundGrid[n.y][n.x].type === 'default' && !visited[n.y][n.x]) {
                                visited[n.y][n.x] = true;
                                queue.push(n);
                            }
                        }
                    }
                    islands.push(currentIsland);
                }
            }
        }
        
        if (islands.length === 0) {
            const newLayers = [ { id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual', opacity: 1 }, objectLayer, triggerLayer ];
            set({ layers: newLayers, triggers: {} });
            return;
        }

        islands.sort((a, b) => b.length - a.length);
        const mainlandTiles = islands[0];
        
        // 4. PLACE CORE INTERACTIVES
        const occupiedSpots = new Set();
        let mainlandFloorTiles = [...mainlandTiles];
        
        const coreAssetIds = Object.keys(template.coreInteractives);
        
        for (const assetId of coreAssetIds) {
            if (mainlandFloorTiles.length === 0) break;
            const spotIndex = Math.floor(Math.random() * mainlandFloorTiles.length);
            const { x, y } = mainlandFloorTiles.splice(spotIndex, 1)[0];
            
            // Place Visual
            objectLayer.grid[y][x] = { assetId, properties: assetLibrary[assetId]?.defaultProperties || {}, rotation: 0, flipped: false };
            
            // Inject Trigger
            injectTrigger(x, y, assetId);
            
            occupiedSpots.add(`${x},${y}`);
        }
        
        // 5. PLACE THEMED OBSTACLES
        mainlandFloorTiles = mainlandTiles.filter(t => !occupiedSpots.has(`${t.x},${t.y}`));
        const obstacleTypes = BIOME_OBSTACLES[template.biome] || BIOME_OBSTACLES.default;
        const obstacleCount = Math.floor(mainlandFloorTiles.length * 0.10);
        for (let i = 0; i < obstacleCount && mainlandFloorTiles.length > 0; i++) {
            const spotIndex = Math.floor(Math.random() * mainlandFloorTiles.length);
            const { x, y } = mainlandFloorTiles.splice(spotIndex, 1)[0];
            const randomObstacleId = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            if (assetLibrary[randomObstacleId]) {
                objectLayer.grid[y][x] = { assetId: randomObstacleId, properties: {}, rotation: 0, flipped: false };
                // Obstacles usually don't have triggers, but if we added "Mineable Rock" later, this would support it automatically
                injectTrigger(x, y, randomObstacleId);
            }
        }
        
        // 6. SET FINAL STATE
        const newLayers = [ { id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual', opacity: 1 }, objectLayer, triggerLayer ];
        set({
            biome: template.biome, mapGenType: template.mapGenType, backgroundAnimation: template.backgroundAnimation, animationSpeed: template.animationSpeed,
            aiStyle: template.aiStyle, aiMood: template.aiMood, aiKeywords: template.aiKeywords,
            layers: newLayers, triggers: newTriggers, // <--- SAVES TRIGGERS
            activeLayerId: 'objects', selectedTile: null, selectedRegion: null, history: [], historyIndex: -1, currentTool: 'select'
        });
    },

    // BATCH PROCESSING
    importZonesFromZip: (zonesData) => {
        const massagedZones = {};
        for (const key in zonesData) {
            let newKey = key;
            const zone = zonesData[key];
            if (!isNaN(key)) { // Check if key is a number
                newKey = `Z${String(key).padStart(2, '0')}`;
                zone.zid = newKey;
            }
            massagedZones[newKey] = zone;
        }
        const firstZoneId = Object.keys(massagedZones)[0];
        set({
            zones: massagedZones,
            activeZoneId: firstZoneId,
            ...{...initialZoneState, ...massagedZones[firstZoneId]},
            history: [],
            historyIndex: -1
        });
    },
    updateActiveZoneData: () => {
        const { activeZoneId, zones, ...activeState } = get();
        if (activeZoneId) {
            const updatedZoneData = {
                // Core Map Data
                zid: activeState.zid, 
                zoneName: activeState.zoneName, 
                biome: activeState.biome, 
                mapSize: activeState.mapSize, 
                mapGenType: activeState.mapGenType, 
                
                // --- RPG DATA (Added for Backend) ---
                zoneLevel: activeState.zoneLevel,
                zoneType: activeState.zoneType,
                zoneMobs: activeState.zoneMobs,
                // ------------------------------------

                // Layers & Assets
                layers: activeState.layers, 
                imageBackgroundUrl: activeState.imageBackgroundUrl, 
                backgroundImageData: activeState.backgroundImageData,
                originalBackgroundImageData: activeState.originalBackgroundImageData, 
                prefabs: activeState.prefabs, 
                spawnPoints: activeState.spawnPoints,
                triggers: activeState.triggers, 
                initialView: activeState.initialView, 
                
                // AI & Animation
                aiStyle: activeState.aiStyle, 
                aiMood: activeState.aiMood,
                aiKeywords: activeState.aiKeywords, 
                backgroundAnimation: activeState.backgroundAnimation, 
                animationSpeed: activeState.animationSpeed
            };
            set(state => ({
                zones: { ...state.zones, [activeZoneId]: updatedZoneData }
            }));
        }
    },
    setActiveZone: async (newZoneId) => {
    const state = get();
    const target = state.zones[newZoneId];

    // 1. Check if we need to download the full JSON
    if (target && target.isLazy) {
        console.log(`📡 Lazy-Loading Zone Data: ${newZoneId}...`);
        try {
            const res = await fetch(`/data/zones/${newZoneId}.json`);
            if (!res.ok) throw new Error(`Could not find ${newZoneId}.json`);
            
            const fullData = await res.json();
            
            // 2. Inject full data and remove the lazy flag
            set(s => ({ 
                zones: { 
                    ...s.zones, 
                    [newZoneId]: { ...fullData, isLazy: false } 
                } 
            }));
            console.log(`✅ ${newZoneId} Materialized.`);
        } catch (e) {
            console.error("🛑 Lazy load failed:", e.message);
            alert(`Error: Could not load ${newZoneId}. Check if the file exists in /public/data/zones/`);
            return;
        }
    }

    // 3. Standard Activation Sequence (Preserving all intricacies)
    get().updateActiveZoneData(); // Save current work before switching
    const activeData = get().zones[newZoneId];
    
    if (activeData) {
        set({
            ...initialZoneState,
            ...activeData,
            activeZoneId: newZoneId,
            history: [],
            historyIndex: -1,
            selectedTile: null,
            selectedRegion: null,
        });
        
        // Ensure the camera centers on the new map
        if (activeData.mapSize) {
            // Trigger a re-center if your handleCenterView is available globally
            window.dispatchEvent(new Event('resize'));
        }
    }
},
    rerollPlacements: () => set(state => {
        const { layers, biome, mapSize, assetLibrary } = state;
        const groundLayer = layers.find(l => l.id === 'ground');
        if (!groundLayer) return {};

        // 1. Reset Object Grid
        const newObjectGrid = Array.from({ length: mapSize.height }, () => Array.from({ length: mapSize.width }, () => null));
        const objectLayer = { id: 'objects', name: 'Objects', isVisible: true, grid: newObjectGrid, type: 'visual', opacity: 1 };
        
        // 2. Prepare Trigger Grid (Find existing or create new)
        let triggerLayer = layers.find(l => l.type === 'trigger');
        let newTriggerGrid;
        if (triggerLayer) {
            // Clear existing triggers from grid
            newTriggerGrid = Array.from({ length: mapSize.height }, () => Array.from({ length: mapSize.width }, () => null));
            triggerLayer = { ...triggerLayer, grid: newTriggerGrid };
        } else {
            newTriggerGrid = Array.from({ length: mapSize.height }, () => Array.from({ length: mapSize.width }, () => null));
            triggerLayer = { id: 'triggers', name: 'Triggers', isVisible: true, grid: newTriggerGrid, type: 'trigger', opacity: 1 };
        }
        const newTriggers = {}; // Start fresh for re-roll

        // Helper to Inject Trigger
        const injectTrigger = (x, y, assetId) => {
            const assetInfo = assetLibrary[assetId];
            if (!assetInfo) return;
            
            const autoId = `${assetInfo.name.replace(/\s+/g, '_')}_${x}_${y}`;
            const factoryConfig = enrichObjectWithInteraction(autoId);
            let triggerData = null;

            if (assetInfo.autoTrigger) {
                triggerData = { eventId: autoId, ...assetInfo.autoTrigger };
            } else if (factoryConfig.hasInteraction) {
                let action = 'displayText';
                let parameters = {};
                if (factoryConfig.actionType === 'OPEN_UI') {
                    action = 'openModule';
                    parameters = { moduleId: factoryConfig.targetModule };
                } else if (factoryConfig.actionType === 'TELEPORT') {
                    action = 'teleport';
                    parameters = factoryConfig.defaultParams;
                }
                triggerData = { eventId: autoId, condition: 'onInteract', action, parameters };
            }

            if (triggerData) {
                newTriggers[autoId] = triggerData;
                triggerLayer.grid[y][x] = { eventId: autoId };
            }
        };
        
        // 3. ISLAND LOGIC (Same as before)
        const visited = Array.from({ length: mapSize.height }, () => Array(mapSize.width).fill(false));
        let islands = [];
        for (let y = 0; y < mapSize.height; y++) {
            for (let x = 0; x < mapSize.width; x++) {
                if (groundLayer.grid[y][x].type === 'default' && !visited[y][x]) {
                    let currentIsland = [];
                    let queue = [{x, y}];
                    visited[y][x] = true;
                    while(queue.length > 0) {
                        const {x: cx, y: cy} = queue.shift();
                        currentIsland.push({x: cx, y: cy});
                        const neighbors = [{x: cx-1, y: cy}, {x: cx+1, y: cy}, {x: cx, y: cy-1}, {x: cx, y: cy+1}];
                        for (const n of neighbors) {
                            if (n.x >= 0 && n.x < mapSize.width && n.y >= 0 && n.y < mapSize.height && groundLayer.grid[n.y][n.x].type === 'default' && !visited[n.y][n.x]) {
                                visited[n.y][n.x] = true;
                                queue.push(n);
                            }
                        }
                    }
                    islands.push(currentIsland);
                }
            }
        }
        
        if (islands.length === 0) return {};

        islands.sort((a, b) => b.length - a.length);
        const mainlandTiles = islands[0];
        
        const occupiedSpots = new Set();
        let mainlandFloorTiles = [...mainlandTiles];
        
        // 4. PLACE CORE INTERACTIVES
        const coreAssetIds = Object.keys(corePlacements);
        for (const assetId of coreAssetIds) {
            if (mainlandFloorTiles.length === 0) break;
            const spotIndex = Math.floor(Math.random() * mainlandFloorTiles.length);
            const { x, y } = mainlandFloorTiles.splice(spotIndex, 1)[0];
            
            objectLayer.grid[y][x] = { assetId, properties: assetLibrary[assetId]?.defaultProperties || {}, rotation: 0, flipped: false };
            injectTrigger(x, y, assetId); // <--- INJECT TRIGGER
            
            occupiedSpots.add(`${x},${y}`);
        }
        
        // 5. PLACE OBSTACLES
        mainlandFloorTiles = mainlandTiles.filter(t => !occupiedSpots.has(`${t.x},${t.y}`));
        const obstacleTypes = BIOME_OBSTACLES[biome] || BIOME_OBSTACLES.default;
        const obstacleCount = Math.floor(mainlandFloorTiles.length * 0.10);
        for (let i = 0; i < obstacleCount && mainlandFloorTiles.length > 0; i++) {
            const spotIndex = Math.floor(Math.random() * mainlandFloorTiles.length);
            const { x, y } = mainlandFloorTiles.splice(spotIndex, 1)[0];
            const randomObstacleId = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            if (assetLibrary[randomObstacleId]) {
                objectLayer.grid[y][x] = { assetId: randomObstacleId, properties: {}, rotation: 0, flipped: false };
                injectTrigger(x, y, randomObstacleId);
            }
        }

        // 6. ASSEMBLE LAYERS
        // We filter out old objects/triggers and replace them with new ones
        const otherLayers = layers.filter(l => l.id !== 'objects' && l.type !== 'trigger');
        const newLayers = [...otherLayers, objectLayer, triggerLayer].sort((a, b) => {
            // Keep Ground at bottom, then Objects, then Triggers
            if (a.id === 'ground') return -1;
            if (b.id === 'ground') return 1;
            return 0; 
        });

        // --- PART OF CODE NOT CHANGING (ALIGNMENT) ---
        return { 
            layers: newLayers, 
            triggers: newTriggers,
            // --- PROTECTS GRID VISIBILITY DURING REROLL ---
            cleanGrid: true 
        };
    }),
    // --- MAGI-TECH: SNAP CAMERA TO COORDINATES ---
    snapToCoord: (x, y) => {
        const { mapSize } = get();
        // 1. Calculate the world position of the target hex
        const target = getTileCenter(x, y, 'topDown', 'hex', mapSize);
        
        // 2. Center the camera on those coordinates and reset zoom
        // We use negative coordinates to "pull" the map to the center of the screen
        set({
            panOffset: { x: -target.x, y: -target.y },
            zoom: 1.0
        });
    },
    batchResizeZones: (newSize) => {
        const { zones, assetLibrary } = get();
        const newZones = {};
        for(const zid in zones) {
            const zone = zones[zid];
            const { groundGrid, objectGrid } = generateGrids(newSize.width, newSize.height, zone.mapGenType);
            const newObjectLayer = { id: 'objects', name: 'Objects', isVisible: true, grid: objectGrid, type: 'visual', opacity: 1 };
            
            const visited = Array.from({ length: newSize.height }, () => Array(newSize.width).fill(false));
            let islands = [];
            for (let y = 0; y < newSize.height; y++) {
                for (let x = 0; x < newSize.width; x++) {
                    if (groundGrid[y][x].type === 'default' && !visited[y][x]) {
                        let currentIsland = [];
                        let queue = [{x, y}];
                        visited[y][x] = true;
                        while(queue.length > 0) {
                            const {x: cx, y: cy} = queue.shift();
                            currentIsland.push({x: cx, y: cy});
                            const neighbors = [{x: cx-1, y: cy}, {x: cx+1, y: cy}, {x: cx, y: cy-1}, {x: cx, y: cy+1}];
                            for (const n of neighbors) {
                                if (n.x >= 0 && n.x < newSize.width && n.y >= 0 && n.y < newSize.height && groundGrid[n.y][n.x].type === 'default' && !visited[n.y][n.x]) {
                                    visited[n.y][n.x] = true;
                                    queue.push(n);
                                }
                            }
                        }
                        islands.push(currentIsland);
                    }
                }
            }
            if (islands.length > 0) {
                islands.sort((a, b) => b.length - a.length);
                const mainlandTiles = islands[0];
                const occupiedSpots = new Set();
                let mainlandFloorTiles = [...mainlandTiles];
                const coreAssetIds = Object.keys(corePlacements);

                for (const assetId of coreAssetIds) {
                    if (mainlandFloorTiles.length === 0) break;
                    const spotIndex = Math.floor(Math.random() * mainlandFloorTiles.length);
                    const { x, y } = mainlandFloorTiles.splice(spotIndex, 1)[0];
                    newObjectLayer.grid[y][x] = { assetId, properties: assetLibrary[assetId]?.defaultProperties || {}, rotation: 0, flipped: false };
                    occupiedSpots.add(`${x},${y}`);
                }
            }

            newZones[zid] = {
                ...zone,
                mapSize: newSize,
                layers: [ { id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual', opacity: 1 }, newObjectLayer ]
            };
        }
        set({ zones: newZones });
        get().setActiveZone(get().activeZoneId); // Refresh current view
    }
}));
// --- GDD MASTER MODULE LIST ---
const GAME_MODULES = [
    { id: 'armory', label: 'The Armory (Equipment)' },
    { id: 'arcanum', label: 'The Arcanum (Spells)' },
    { id: 'gilded_vault', label: 'The Gilded Vault (Treasury)' },
    { id: 'estate_bank', label: 'Estate Resource Bank' },
    { id: 'teleport_ui', label: 'Teleport Station (World Map)' },
    { id: 'mob_select', label: 'Battle / Mob Selection' },
    { id: 'crafting', label: 'Crafting Station' },
    { id: 'quest_board', label: 'Quest Board' },
    { id: 'clan_hall', label: 'Clan Great Hall' },
    { id: 'market', label: 'Black Market' },
    { id: 'soul_forge', label: 'The Soul Forge' },
    { id: 'gem_cutter', label: 'Gem Cutter' },
    { id: 'research', label: 'Research Cottage' },
    { id: 'storehouse', label: 'Storehouse' },
    { id: 'tannery', label: 'Tannery' },
    { id: 'sanctuary', label: 'Sanctuary (Revive Point)' }
];
// --- COLLISION BAKING LOGIC ---
// 0 = Blocked (Rock, Water, Boss, Void)
// 1 = Walkable (Ground, Buildings, Resources, Shops)
// 0 = Blocked (Rock, Water, Boss, Void, Locked Gate, NPC)
// 1 = Walkable (Ground, Buildings, Resources, Shops, Open Doors)
const bakeCollisionData = (layers, mapSize, assetLibrary) => {
    // 1. Initialize Grid as Walkable (1)
    const navigationGrid = Array.from({ length: mapSize.height }, () => Array(mapSize.width).fill(1));

    const objectLayer = layers.find(l => l.id === 'objects');
    const groundLayer = layers.find(l => l.id === 'ground');

    for (let y = 0; y < mapSize.height; y++) {
        for (let x = 0; x < mapSize.width; x++) {
            
            // --- CHECK 1: TERRAIN (Liquids and Voids) ---
            if (groundLayer?.grid[y][x]) {
                const type = groundLayer.grid[y][x].type;
                if (['wall', 'empty', 'water', 'lava'].includes(type)) {
                    navigationGrid[y][x] = 0;
                    continue; 
                }
            }

            // --- CHECK 2: OBJECTS (Buildings, Obstacles, NPCs) ---
            const objectTile = objectLayer?.grid[y][x];
            if (objectTile && objectTile.assetId) {
                const asset = assetLibrary[objectTile.assetId];
                const props = objectTile.properties || {};

                if (asset) {
                    // We only block the tile if it is a Natural Obstacle AND has no interaction assigned
                    const isNaturalObstacle = asset.type === 'Natural Obstacles';
                    const hasInteraction = props.interactionType && props.interactionType !== 'none';

                    // ALLOW walking on Buildings, Portals, NPCs, and Quest Items
                    // BLOCK only if it is a pure obstacle (Rock/Tree) with no interaction
                    if (isNaturalObstacle && !hasInteraction) {
                        navigationGrid[y][x] = 0;
                    }

                    // MANUAL OVERRIDE: If you explicitly set 'isTraversable' to false in God Tools
                    if (props.isTraversable === false) {
                        navigationGrid[y][x] = 0;
                    }
                }
            }
        }
    }
    return navigationGrid;
};
// --- MAIN APP COMPONENT ---
// --- MODULE RENDERER (Connected to Public HTMLs) ---
// --- MODULE RENDERER ---
const ModuleRenderer = ({ moduleId, onClose }) => {
    
    // LEFT: The ID from the Map
    // RIGHT: The EXACT filename in public/modules/
    const FILE_MAP = {
        'armory_shop':             'armory.html',
        'theArmory':               'armory.html', 
        'arcanum_shop':            'arcanum.html',
        'theArcanumNew':           'arcanum.html',
        'gilded_vault_storage':    'gilded_vault.html',
        'gildedVaultNew':          'gilded_vault.html',
        'soulforge':               'soul_forge.html', 
        'soulforgeNew':            'soul_forge.html',
        'sanctuary_revive_point':  'sanctuary.html',
        'sanctuaryReviveNew':      'sanctuary.html',
        'RESURRECTION_UI':         'sanctuary.html',
        'estate_bank':             'estate_bank.html',
        'teleport_ui':             'world_map.html',
        'mob_select':              'bestiary.html',
        'quest_board':             'quest_board.html',
        'black_market':            'market.html',    
        // Add exact matches for your other files here:
        'market':                  'market.html',
        'clan_hall':               'clan_hall.html',
        'quest_board':             'quest_board.html'
    };

    // LOGIC: If it's in the map, use the map. If not, add .html
    const fileName = FILE_MAP[moduleId] || `${moduleId}.html`;
    const filePath = `/modules/${fileName}`;

    return (
        <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col border border-gray-700">
            {/* DEBUG BAR: Tells you exactly what file it wants */}
            <div className="bg-black text-xs text-green-400 p-2 font-mono border-b border-gray-700">
                Requesting: <strong>{filePath}</strong>
            </div>
            <iframe 
                src={filePath}
                className="w-full h-full border-0 bg-white/5"
                title={`Module: ${moduleId}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
        </div>
    );
};

// --- CONVERGENCE MANIFEST: ALL 24 HARDCODED RACE SPAWNS ---
const CONVERGENCE_RACE_SPAWNS = {
    // --- QUADRANT: CRYO-INDUSTRIAL (SW) ---
    "Z01": { x: 5,  y: 40, name: "Crystal Caves (Dwarf)" },
    "Z10": { x: 8,  y: 35, name: "Screaming Crags (Troll)" },
    "Z17": { x: 5,  y: 45, name: "Gravefrost Tundra (Draugr)" },
    "Z21": { x: 12, y: 42, name: "Echoing Chasms (Banshee)" },
    "Z22": { x: 15, y: 48, name: "Sunken Ruins (Paladin)" },

    // --- QUADRANT: PRIMORDIAL (NW) ---
    "Z02": { x: 5,  y: 5,  name: "Glimmerwood (Elf)" },
    "Z05": { x: 10, y: 10, name: "Mana Springs (Gnome)" },
    "Z08": { x: 15, y: 5,  name: "Whispering Woods (Hobbit)" },
    "Z11": { x: 8,  y: 15, name: "The Great Vine Labyrinth (Minotaur)" },
    "Z15": { x: 12, y: 8,  name: "Aetherial Forests (Unicorn)" },
    "Z20": { x: 18, y: 12, name: "Corrupted Jungles (Werewolf)" },

    // --- QUADRANT: CELESTIAL (NE) ---
    "Z03": { x: 40, y: 5,  name: "The Shifting Maze (Halfling)" },
    "Z12": { x: 45, y: 8,  name: "The Howling Steppes (Centaur)" },
    "Z13": { x: 42, y: 12, name: "Cloud Peaks (Angel)" },
    "Z14": { x: 38, y: 5,  name: "Emberfall Forest (Phoenix)" },
    "Z24": { x: 48, y: 15, name: "Cloud Peaks (Angel - Alt)" },

    // --- QUADRANT: INFERNAL (SE) ---
    "Z04": { x: 45, y: 45, name: "Chromatic Badlands (Human)" },
    "Z06": { x: 40, y: 40, name: "Blazefire Wastes (Demon)" },
    "Z07": { x: 35, y: 48, name: "Shadow Mire (Tiefling)" },
    "Z09": { x: 38, y: 42, name: "Ashfall Barrens (Orc)" },
    "Z16": { x: 42, y: 48, name: "Grimwater Swamps (Baba Yaga)" },
    "Z19": { x: 35, y: 35, name: "Gloomwood (Vampire)" },
    "Z23": { x: 48, y: 40, name: "Blazefire Wastes (Demon - Alt)" },

    // --- COASTAL / NEUTRAL ---
    "Z18": { x: 25, y: 45, name: "The Sunken City of Lumina (Mermaid)" }
};

export default function MapEditor() {
    // --- CONNECT TO BRAIN ---
    // 1. Get the data from the store
    const { masterData } = useStudioStore();
    const bestiary = masterData.bestiary || {};
    const launchPlayerUI = () => {
    // We add '?mode=player' to the URL so the app knows NOT to load the editor
    const playerWindow = window.open('/?mode=player', '_blank');
        
        setTimeout(() => {
            if (playerWindow) {
                console.log("📤 Sanitizing and Sending Map data to Player UI...");
                
                // MAGI-TECH SANITIZATION: Strip functions (dispatch, etc) so postMessage doesn't crash
                const rawState = useMapStore.getState();
                const cleanMapData = JSON.parse(JSON.stringify({
                    zid: rawState.zid,
                    zoneName: rawState.zoneName,
                    biome: rawState.biome,
                    mapSize: rawState.mapSize,
                    layers: rawState.layers,
                    triggers: rawState.triggers,
                    spawnPoints: rawState.spawnPoints,
                    backgroundImageData: rawState.backgroundImageData,
                    assetLibrary: rawState.assetLibrary,
                    tileType: rawState.tileType
                }));

                playerWindow.postMessage({
                    type: 'INIT_STUDIO_BRIDGE',
                    payload: {
                        races: masterData.races, 
                        constants: masterData.gddConstants,
                        map: cleanMapData
                    }
                }, '*');
            }
        }, 1000);
    };
    
    // 2. DATA (State from Store) - DEFINED FIRST
    const { 
        activeModule, zid, zoneName, biome, mapSize, mapGenType, view, tileType, tileOpacity,
        selectedTile, selectedRegion, isEditingLayout, areTilesColorless, aiGenError, imageBackgroundUrl, backgroundImageData, originalBackgroundImageData, currentTool,
        brushSize, brushShape, historyIndex, isTestMode, playerPosition, initialView,
        aiStyle, aiMood, aiKeywords, backgroundAnimation, animationSpeed, zones, activeZoneId,
        zoneLevel, zoneType, zoneMobs, allowRoamingCombat, paintZoneId, triggers, isPlayMode, otherPlayers, pendingEncounter
    } = useMapStore();
    
    // ==========================================

    // 3. LOCAL STATE & HOOKS - DEFINED SECOND
    const [selectedEntityId, setSelectedEntityId] = useState("");
    const [worldSearchQuery, setWorldSearchQuery] = useState("");
    const [groupWorldSearch, setGroupWorldSearch] = useState(true);
    const [isMmDocked, setIsMmDocked] = useState(false);
    const [isMmLarge, setIsMmLarge] = useState(false);
    // --- MAGI-TECH: EXPORT WORLD DATA TO CSV ---
    const exportSearchToCSV = () => {
        // 1. Collect all assets and entities from the visual/trigger layers
        const allItems = layers.filter(l => l.type === 'visual' || l.type === 'trigger').flatMap(layer => 
            layer.grid.flatMap((row, y) => row.map((tile, x) => ({ tile, x, y, layerName: layer.name })))
        ).filter(item => item.tile?.assetId || item.tile?.type === 'enemy');

        if (allItems.length === 0) {
            alert("No assets found to export!");
            return;
        }

        // 2. Define CSV headers
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Name,Type,X,Y,Layer,Properties\n";

        // 3. Populate rows
        allItems.forEach(item => {
            const asset = assetLibrary[item.tile.assetId];
            const name = asset?.name || (item.tile.type === 'enemy' ? "Enemy Entity" : "Unknown");
            const type = asset?.type || item.tile.type || "N/A";
            const props = JSON.stringify(item.tile.properties || {}).replace(/"/g, '""'); // Escape quotes for CSV

            csvContent += `"${name}","${type}",${item.x},${item.y},"${item.layerName}","${props}"\n`;
        });

        // 4. Trigger Download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Geminus_${zid || 'World'}_Manifest.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    // --- MAGI-TECH AUTO-LOADER: FULL MANIFEST SYNC ---
useEffect(() => {
    // 🛡️ NO-STRIP GUARD: If we are the player, do not auto-fetch.
    if (window.location.pathname.includes('player.html')) {
        console.log("🛰️ System: Player Client detected. Skipping internal loader.");
        return; 
    }

    const bootEditorWithManifest = async () => {
        try {
            console.log("📂 System: Fetching manifest from ./data/zones/manifest.json");
            const manifestRes = await fetch('/data/zones/manifest.json');
            if (!manifestRes.ok) throw new Error("Manifest file not found");
            
            const zoneIds = await manifestRes.json();
            console.log("📝 System: Syncing full world list:", zoneIds);
            
            // 1. Create a "Shell" for every zone
            const worldShells = {};
            zoneIds.forEach(zid => {
                worldShells[zid] = { 
                    zid, 
                    zoneName: zid, 
                    isLazy: true 
                };
            });

            // 2. Update store with shells
            useMapStore.setState({ zones: worldShells });

            // 3. Auto-load first zone (Z01)
            const firstZid = zoneIds[0];
            const zoneRes = await fetch(`/data/zones/${firstZid}.json`);
            if (zoneRes.ok) {
                const data = await zoneRes.json();
                useMapStore.setState(s => ({
                    zones: { 
                        ...s.zones, 
                        [firstZid]: { ...data, isLazy: false } 
                    }
                }));
                useMapStore.getState().setActiveZone(firstZid);
            }
        } catch (err) {
            console.warn("⚠️ Auto-Loader Failed:", err.message);
        }
    };

    bootEditorWithManifest();
}, []); 
// Empty array ensures this only runs once on mount
    const [showCombat, setShowCombat] = useState(false);
    const [activeBattleMob, setActiveBattleMob] = useState(null); // Added for CombatScreen link
    const [mobGenCount, setMobGenCount] = useState(5);
    const [selectedObject, setSelectedObject] = useState(null);
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');

    // Auto-sync selection with first available mob in the roster
    useEffect(() => {
        if (!selectedEntityId && zoneMobs && zoneMobs.length > 0) {
            setSelectedEntityId(zoneMobs[0].id);
        }
    }, [zoneMobs, selectedEntityId]);

    // 4. ACTIONS (Functions)
    const { 
        dispatch, setField, generateNewMap, resizeMap, resetState, undo, redo, savePrefab, 
        setPathfindingPoint, setBackgroundImage, fitBackgroundToGrid, revertBackgroundCrop, 
        addSpawnPoint, setSelectedSpawnIndex, updateAssetProperties, applyTemplate, 
        importZonesFromZip, setActiveZone, updateActiveZoneData, rerollPlacements, batchResizeZones,
        generateZoneMobs, updateMob, updateAsset
    } = useMapStore.getState();

    // 5. OTHER SELECTORS (This is where the other 'selectedAsset' lives, which is fine now)
    const layers = useMapStore(state => state.layers);
    const assetLibrary = useMapStore(state => state.assetLibrary);
    const prefabs = useMapStore(state => state.prefabs);
    const selectedAsset = useMapStore(state => state.selectedAsset); // <--- No longer conflicts!
    const activeLayerId = useMapStore(state => state.activeLayerId);
    const pathfindingPoints = useMapStore(state => state.pathfindingPoints);
    const calculatedPath = useMapStore(state => state.calculatedPath);
    const spawnPoints = useMapStore(state => state.spawnPoints);
    const selectedSpawnIndex = useMapStore(state => state.selectedSpawnIndex);
    // --- MAGI-TECH: Subscribing to Global Movement State ---
    const isMoving = useMapStore(state => state.isMoving);


    const [openAccordions, setOpenAccordions] = useState({ identification: false, tools: false, brush: false, layers: false, properties: false, view: false, gen: false, size: false, assets: false, customize: false, background: false, data: false, prefabs: false, initialView: false, templates: false, search: false });
    const [openAssetTypes, setOpenAssetTypes] = useState({});
    const [imageAssetCache, setImageAssetCache] = useState({});
    const [backgroundImage, setLocalBackgroundImage] = useState(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const zoom = useMapStore(state => state.zoom);
    const panOffset = useMapStore(state => state.panOffset);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartCoords, setDragStartCoords] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [isSpacebarDown, setIsSpacebarDown] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    const canvasRef = useRef(null), animationCanvasRef = useRef(null), canvasContainerRef = useRef(null), fileInputRef = useRef(null), pinchDist = useRef(0), touchStartPos = useRef({ x: 0, y: 0 }), didDrag = useRef(false);

    const activeLayer = layers.find(l => l.id === activeLayerId);
    
    const minZoom = canvasSize.width > 0 ? Math.min(canvasSize.width / (mapSize.width * TILE_SIZE), canvasSize.height / (mapSize.height * TILE_SIZE)) * 0.9 : 0.2;

    const constructedAiPrompt = useMemo(() => {
        const parts = [
            `Epic, hyperrealistic top-down map background for a game zone named "${zoneName || 'unnamed zone'}"`,
            `Environment: ${biome}`,
            `Style: ${aiStyle}`,
            `Mood: ${aiMood}`,
            aiKeywords
        ];
        return parts.filter(Boolean).join(', ');
    }, [zoneName, biome, aiStyle, aiMood, aiKeywords]);
    const handleSaveAsset = (updates) => {
        if (selectedObject) {
            dispatch({ 
                type: 'UPDATE_OBJECT_PROPERTIES', 
                payload: { 
                    x: selectedObject.x, 
                    y: selectedObject.y, 
                    layerId: selectedObject.layerId, 
                    properties: updates 
                } 
            });
            setSelectedObject(null);
        }
    };
    // --- EVENT HANDLERS ---
    // --- PASTE THIS HELPER FUNCTION ---
    const handleImportRoster = () => {
        try {
            // Attempt to parse the text as JSON
            const parsed = JSON.parse(importText);
            
            // Basic validation: Must be an array
            if (Array.isArray(parsed)) {
                // Ensure they have unique IDs if your external data doesn't have them
                const formatted = parsed.map((mob, idx) => ({
                    ...mob,
                    id: mob.id || `imported_${Date.now()}_${idx}`
                }));
                
                // Update the store
                setField('zoneMobs', formatted);
                alert(`Successfully imported ${formatted.length} enemies!`);
                setShowImport(false); // Close the box
                setImportText('');    // Clear the box
            } else {
                alert("Error: Data must be a list (Array) of enemies. e.g. [{ name: 'Goblin' }, ...]");
            }
        } catch (e) {
            alert("Invalid JSON format. Please check your syntax.");
        }
    };
    // ----------------------------------
    // --- MAGI-TECH: Store-Linked Camera Reset ---
    const handleCenterView = () => { 
        useMapStore.setState({
            zoom: 1, 
            panOffset: { x: 0, y: 0 } 
        });
    };
    const handleMouseDown = (e) => {
        // 1. Pan Logic (Always allowed)
        if (e.button === 0 && isSpacebarDown) { 
            setIsPanning(true); 
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }); 
            return; 
        }
        if (e.button !== 0) return;

        // 2. Get Coordinates
        const coords = getCoordsFromEvent(e);
        if (coords.x === -1) return;

        // 3. TEST MODE LOCK: Send click to Game Logic and EXIT
        if (isTestMode) {
            handleTileClick(e);
            return;
        }

        // 4. EDITOR MODE: Proceed to Object Selection
        // Loop through Visual layers (ignoring Ground) from Top to Bottom
        const objectLayers = layers.filter(l => l.type === 'visual' && l.id !== 'ground').reverse();
        let found = null;

        for (const layer of objectLayers) {
            const tile = layer.grid[coords.y]?.[coords.x];
            if (tile && tile.assetId) {
                found = { ...tile, x: coords.x, y: coords.y, layerId: layer.id };
                break; 
            }
        }

        if (found) {
            // We clicked an object! Open the editor.
            setSelectedObject(found);
            return; 
        } else {
            // Clicked empty space
            setSelectedObject(null);
        }

        // 4. Paint/Stamp Logic
        if (currentTool === 'stamp') { 
            setIsDragging(true); 
            setDragStartCoords(coords); 
            setField('selectedRegion', { startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y }); 
        } else { 
            handleTileClick(e); 
        } 
    };
    const handleMouseMove = (e) => {
        // --- MAGI-TECH: Store-Linked Panning ---
        if (isPanning) {
            useMapStore.setState(state => ({
                panOffset: {
                    x: e.clientX - panStart.x,
                    y: e.clientY - panStart.y
                }
            }));
            return; 
        } else {
            const coords = getCoordsFromEvent(e);
            setMouseCoords(coords);
            
            if (isDragging && currentTool === 'stamp' && dragStartCoords) {
                setField('selectedRegion', { ...selectedRegion, endX: coords.x, endY: coords.y });
            } else if (e.buttons === 1 && ['place', 'erase'].includes(currentTool)) {
                handleTileClick(e);
            }
        }
    };
    const handleMouseUp = (e) => { if (e.button === 0) { setIsPanning(false); setIsDragging(false); setDragStartCoords(null); } };
    const handleWheel = (e) => {
        const zoomFactor = 1.1;
        // Use the store's zoom for calculation
        const currentZoom = useMapStore.getState().zoom;
        const newZoom = Math.max(minZoom, Math.min(3, e.deltaY > 0 ? currentZoom / zoomFactor : currentZoom * zoomFactor));
        
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
        
        const mousePointTo = { 
            x: (mouseX - panOffset.x - canvasSize.width / 2) / zoom, 
            y: (mouseY - panOffset.y - canvasSize.height / 2) / zoom 
        };

        // UPDATED: Sync to Global Store
        useMapStore.setState({
            zoom: newZoom,
            panOffset: { 
                x: -mousePointTo.x * newZoom + mouseX - canvasSize.width / 2, 
                y: -mousePointTo.y * newZoom + mouseY - canvasSize.height / 2 
            }
        });
    };
    const handleTouchStart = (e) => { if (e.touches.length === 1) { touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; didDrag.current = false; } else if (e.touches.length === 2) { setIsPanning(true); const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY; pinchDist.current = Math.sqrt(dx * dx + dy * dy); setPanStart({ x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - panOffset.x, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - panOffset.y }); } };
    const handleTouchMove = (e) => {
        e.preventDefault();
    
        if (e.touches.length === 1 && !isPanning) {
            const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
            const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
            if (dx > 5 || dy > 5) didDrag.current = true;
    
            if (['place', 'erase'].includes(currentTool) && didDrag.current) {
                handleTileClick(null, { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
            } 
        } else if (e.touches.length === 2) {
            didDrag.current = true;
            setIsPanning(true);
            const touchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const touchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            setPanOffset({ x: touchCenterX - panStart.x, y: touchCenterY - panStart.y });
            
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDist = Math.sqrt(dx * dx + dy * dy);
            const zoomFactor = newDist / pinchDist.current;
            const newZoom = Math.max(minZoom, Math.min(3, zoom * zoomFactor));
            setZoom(newZoom);
            pinchDist.current = newDist;
        }
    };
    const handleTouchEnd = (e) => { 
        if (!didDrag.current && e.changedTouches.length === 1) handleTileClick(null, { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }); 
        setIsPanning(false); 
        pinchDist.current = 0; 
    };

    const getCoordsFromEvent = (e, coords = null) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: -1, y: -1 };
        const rect = canvas.getBoundingClientRect();
        const clientX = coords ? coords.clientX : e.clientX;
        const clientY = coords ? coords.clientY : e.clientY;

        // --- MATH FIX: ALIGN MOUSE WITH RENDERER ---
        // We use raw canvas.width / 2 (no floor) to match the ctx.translate 
        // in your main render loop (Line 1606). This kills the NW drift.
        const worldX = (clientX - rect.left - canvas.width / 2 - panOffset.x) / zoom;
        const worldY = (clientY - rect.top - canvas.height / 2 - panOffset.y) / zoom;

        // Use Math.floor to match the whole-number drawing center from Step 1
        const mapCenterX = Math.floor(mapSize.width / 2);
        const mapCenterY = Math.floor(mapSize.height / 2);

        if (tileType === 'hex') {
            const s = TILE_SIZE / Math.sqrt(3);
            
            // 1. Convert Screen Space to Axial Math
            const q = (Math.sqrt(3) / 3 * worldX - 1 / 3 * worldY) / s;
            const r = (2 / 3 * worldY) / s;

            // 2. Cube rounding for pixel-perfect targeting
            let x = q, z = r, y = -x - z;
            let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
            const xDiff = Math.abs(rx - x), yDiff = Math.abs(ry - y), zDiff = Math.abs(rz - z);

            if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
            else if (yDiff > zDiff) ry = -rx - rz;
            else rz = -rx - ry;

            // 3. Convert back to Grid (Synchronized with your Step 1 floor math)
            const gx = rx + Math.floor((rz - (rz & 1)) / 2) + mapCenterX;
            const gy = rz + mapCenterY;

            // 4. Safety Bounds Check
            if (gx < 0 || gx >= mapSize.width || gy < 0 || gy >= mapSize.height) return { x: -1, y: -1 };
            return { x: gx, y: gy };
        } else {
            // Square Math Fallback
            const gx = Math.floor(worldX / TILE_SIZE + mapCenterX);
            const gy = Math.floor(worldY / TILE_SIZE + mapCenterY);
            if (gx < 0 || gx >= mapSize.width || gy < 0 || gy >= mapSize.height) return { x: -1, y: -1 };
            return { x: gx, y: gy };
        }
    };

    const getTilesInBrush = (centerX, centerY) => {
        const tiles = []; 
        const radius = Math.floor((brushSize - 1) / 2);
        for (let y = centerY - radius; y <= centerY + radius; y++) { 
            for (let x = centerX - radius; x <= centerX + radius; x++) { 
                if (x >= 0 && x < mapSize.width && y >= 0 && y < mapSize.height) { 
                    if (brushShape === 'square') { tiles.push({ x, y }); } 
                    else if (brushShape === 'circle') { 
                        const dx = x - centerX; const dy = y - centerY; 
                        if (dx * dx + dy * dy <= radius * radius) { tiles.push({ x, y }); } 
                    } 
                } 
            } 
        }
        return tiles;
    };

    const handleTileClick = (e, coords = null) => {
        if (isPanning && !coords) return;
        const closest = getCoordsFromEvent(e, coords);
        if (closest.x === -1) return;

// ===============================================
        //           TEST MODE: INTERACTION LOGIC
        // ===============================================
        if (isTestMode) {
            if (!playerPosition) return;
            const dx = Math.abs(playerPosition.x - closest.x);
            const dy = Math.abs(playerPosition.y - closest.y);
            const isOnTile = dx === 0 && dy === 0;
            const isNeighbor = dx <= 1 && dy <= 1;

            // --- 1. DETECTION: Find ALL players on this specific hex ---
            const playersOnHex = Object.entries(otherPlayers || {})
                .filter(([id, p]) => {
                    // MATH FIX: Force integer comparison to prevent decimal ghosting
                    return Math.floor(p.x) === Math.floor(closest.x) && 
                           Math.floor(p.y) === Math.floor(closest.y);
                })
                .map(([id, p]) => ({ id, ...p }));

            const activeZID = zid || activeZoneId || "Z01";
            // Check if ANY mobs exist in this zone's roster
            const hasRoster = (zoneMobs && zoneMobs.length > 0) || 
                             (useStudioStore.getState().getEncounterAt(activeZID, `${closest.x},${closest.y}`)?.length > 0);

            // --- 2. THE CHOICE TRIGGER ---
            // If a player is found on the hex, show the choice modal
            if (playersOnHex.length > 0 && (isOnTile || zoneType === 'Shadow')) {
                setField('pendingEncounter', { 
                    x: closest.x, 
                    y: closest.y, 
                    targets: playersOnHex, 
                    // Set to true so the "Zone Mob List" button always appears if a player is present
                    hasEnemies: true 
                });
                return;
            }

            // --- 3. ADJACENT INTERACTION (YOUR FULL ORIGINAL LOGIC RESTORED) ---
            if (isOnTile || isNeighbor) {
                const triggerLayer = layers.find(l => l.type === 'trigger');
                const tileTrigger = triggerLayer?.grid?.[closest.y]?.[closest.x];
                const currentTriggers = useMapStore.getState().triggers || {};
                
                if (tileTrigger?.eventId && currentTriggers[tileTrigger.eventId]) {
                    const config = currentTriggers[tileTrigger.eventId];
                    
                    if (config.action === 'teleport') {
                        const { targetZoneId, targetX, targetY } = config.parameters;
                        if (window.confirm(`🌍 Travel to ${targetZoneId || "this zone"}?`)) {
                            setField('isTransitioning', true);
                            setToastMessage(`Entering ${targetZoneId || "new zone"}...`);
                            setTimeout(() => {
                                setActiveZone(targetZoneId);
                                const targetSize = useMapStore.getState().mapSize;
                                setField('initialView', { 
                                    zoom: 1, 
                                    center: { x: Math.floor(targetSize.width / 2), y: Math.floor(targetSize.height / 2) } 
                                });
                                const tx = parseInt(targetX), ty = parseInt(targetY);
                                const newPos = { x: !isNaN(tx) ? tx : 0, y: !isNaN(ty) ? ty : 0 };
                                setField('playerPosition', newPos);
                                const currentStore = useMapStore.getState();
                                setField('view', { ...currentStore.view, zoom: 1.5 }); 
                                currentStore.centerCameraOnPlayer(); 
                                requestAnimationFrame(() => {
                                    setTimeout(() => {
                                        setField('isTransitioning', false);
                                        setToastMessage(""); 
                                    }, 600); 
                                });
                            }, 800);
                        }
                        return; 
                    }
                    if (config.action === 'openModule') {
                        dispatch({ type: 'openModule', payload: config.parameters });
                        return;
                    }
                }

                const objectLayer = layers.find(l => l.id === 'objects');
                const obj = objectLayer?.grid?.[closest.y]?.[closest.x];
                if (obj?.properties?.interactionType === 'warp') {
                    const p = obj.properties;
                    const targetZid = p.warpZoneId || zid;
                    if (targetZid === zid) {
                        const tx = parseInt(p.warpX) || 0, ty = parseInt(p.warpY) || 0;
                        if (window.confirm(`Door Warp to (${tx}, ${ty})?`)) setField('playerPosition', { x: tx, y: ty });
                    } else {
                        if (window.confirm(`🌍 Travel to Zone: ${targetZid}?`)) {
                            setActiveZone(targetZid);
                            setField('playerPosition', { x: parseInt(p.warpX) || 0, y: parseInt(p.warpY) || 0 });
                        }
                    }
                    return;
                }
            }

            // --- 4. SELF-CLICK: Default Environment Interaction (No Players Found) ---
            if (isOnTile) {
                if (isMoving) { setField('isMoving', false); return; }
                if (zoneMobs && zoneMobs.length > 0) {
                    setActiveBattleMob(zoneMobs[0].id);
                } else {
                    const encounterList = useStudioStore.getState().getEncounterAt(activeZID, `${closest.x},${closest.y}`);
                    if (encounterList?.length > 0) setActiveBattleMob(encounterList[0].eid);
                }
                setShowCombat(true);
                return; 
            }

            // --- 5. MOVEMENT FALLTHROUGH ---
            const groundLayer = layers.find(l => l.id === 'ground');
            const targetHex = groundLayer?.grid?.[closest.y]?.[closest.x];
            const isWalkable = targetHex && targetHex.type !== 'empty' && targetHex.type !== 'wall';
            if (isWalkable) {
                handleTestModeMove(closest);
            } else {
                console.warn(`🚫 Movement Blocked: [${closest.x}, ${closest.y}] is ${targetHex?.type || 'Void'}`);
            }
            return;
        }

        // ===============================================
        //           EDITOR MODE (TOOLS)
        // ===============================================
        const spawnIndex = spawnPoints.findIndex(p => p.x === closest.x && p.y === closest.y);

        // --- FIXED SPAWN POINT LOGIC ---
        if (currentTool === 'spawn') {
            const spawnIndex = spawnPoints.findIndex(p => p.x === closest.x && p.y === closest.y);
            
            if (spawnIndex === -1) {
                // If we click empty ground, add a new point
                addSpawnPoint(closest.x, closest.y);
            } else {
                // If we click an existing point, just select it so we can delete it in the sidebar
                setSelectedSpawnIndex(spawnIndex);
            }
            return; 
        }
        // --- MONSTER PAINTING LOGIC ---
        if (currentTool === 'combat') {
            const zones = masterData.zones;
            const selectedZone = zones[paintZoneId];
            
            if (selectedZone) {
                const tilesToPaint = getTilesInBrush(closest.x, closest.y);
                const newLayers = JSON.parse(JSON.stringify(layers));
                const groundLayer = newLayers.find(l => l.id === 'ground');
                
                tilesToPaint.forEach(({ x, y }) => {
                    const hex = groundLayer.grid[y][x];
                    // This binds the zone's monster roster to this specific hex
                    hex.bestiaryOverride = selectedZone.mobs; 
                    hex.assignedZoneId = paintZoneId;
                });
                
                // Update the map with the new data
                useMapStore.setState({ layers: newLayers });
            }
            return; // Exit so we don't trigger other tools
        }
        // --- EYEDROPPER COLOR SCANNER ---
        if (currentTool === 'eyedropper') {
            const img = new Image();
            img.src = backgroundImageData;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Map the click to the actual image pixels
                const px = Math.floor((closest.x / mapSize.width) * img.width);
                const py = Math.floor((closest.y / mapSize.height) * img.height);
                const p = ctx.getImageData(px, py, 1, 1).data;
                
                console.log(`%c Biome Color Found: r: ${p[0]}, g: ${p[1]}, b: ${p[2]} `, 
                    `background: rgb(${p[0]},${p[1]},${p[2]}); color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;`);
                alert(`Color Sampled! RGB: ${p[0]}, ${p[1]}, ${p[2]}. Check your console (F12) to copy it.`);
            };
            return;
        }
        if (currentTool === 'select') {
            if (spawnIndex !== -1) setSelectedSpawnIndex(spawnIndex);
            else {
                setSelectedSpawnIndex(null);
                dispatch({ type: 'SELECT_TILE', payload: { x: closest.x, y: closest.y } });
            }
            return;
        }

        if (!activeLayer) return;
        const tilesToPaint = getTilesInBrush(closest.x, closest.y);
        if (tilesToPaint.length > 0) {
            dispatch({ type: 'APPLY_BRUSH', payload: { tiles: tilesToPaint } });

            if (currentTool === 'enemy' || currentTool === 'loot') {
                tilesToPaint.forEach(({ x, y }) => {
                    dispatch({ 
                        type: 'UPDATE_OBJECT_PROPERTIES', 
                        payload: { 
                            x, y, 
                            layerId: activeLayerId,
                            properties: { 
                                type: currentTool, 
                                entityId: selectedEntityId 
                            } 
                        } 
                    });
                });
            }
        }
    };

    // --- OTHER MAP FUNCTIONS ---
    const handleGenMap = (type) => { 
        generateNewMap(type); 
        setOpenAccordions(prev => ({ ...prev, gen: true })); 
    };

  const handleGenFromImage = () => { 
    if (!backgroundImage) return; 
    const newLayers = generateLayersFromImage(backgroundImage, mapSize, biome); 
    dispatch({ type: 'SET_LAYERS', payload: newLayers }); 
  };
  
  // FIX: Implemented functional reset to clear specific zone grids
  const handleReset = () => { 
    if (window.confirm("🚨 Wipe this map? All layers will be cleared.")) {
        const { groundGrid, objectGrid } = generateGrids(mapSize.width, mapSize.height, 'blank');
        const resetLayers = [
            { id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual', opacity: 1 },
            { id: 'objects', name: 'Objects', isVisible: true, grid: objectGrid, type: 'visual', opacity: 1 },
            { id: 'triggers', name: 'Triggers', isVisible: true, grid: Array.from({ length: mapSize.height }, () => Array(mapSize.width).fill(null)), type: 'trigger', opacity: 1 }
        ];
        dispatch({ type: 'SET_LAYERS', payload: resetLayers });
        setField('triggers', {});
        setField('spawnPoints', []);
        handleCenterView();
    }
  };

  // NEW: Logical Deletion of Current Zone
  const handleDeleteZone = () => {
    if (window.confirm(`⚠️ Permanently DELETE zone ${zid}? This cannot be undone.`)) {
        const { zones, activeZoneId } = useMapStore.getState();
        const updatedZones = { ...zones };
        delete updatedZones[activeZoneId];
        
        const remainingIds = Object.keys(updatedZones);
        const nextId = remainingIds.length > 0 ? remainingIds[0] : null;
        
        useMapStore.setState({ zones: updatedZones });
        if (nextId) setActiveZone(nextId);
        else window.location.reload(); // Force refresh if last zone is gone
    }
  };
  const handleConvergenceSampling = async () => {
        const { mapSize, layers, backgroundImageData } = useMapStore.getState();
        const currentW = mapSize.width;
        const currentH = mapSize.height;

        if (!backgroundImageData) {
            alert("🛑 Upload your image first!");
            return;
        }

        const img = new Image();
        img.src = backgroundImageData;
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const pixData = ctx.getImageData(0, 0, img.width, img.height).data;

        const newGroundGrid = Array(currentH).fill(null).map(() => Array(currentW).fill(null));
        const newNavGrid = Array(currentH).fill(0).map(() => Array(currentW).fill(0));

        for (let y = 0; y < currentH; y++) {
            for (let x = 0; x < currentW; x++) {
                const px = Math.min(img.width - 1, Math.floor((x / (currentW - 1)) * img.width));
                const py = Math.min(img.height - 1, Math.floor((y / (currentH - 1)) * img.height));

                const i = (py * img.width + px) * 4;
                const r = pixData[i], g = pixData[i+1], b = pixData[i+2];

                let terrainType = 'grass';
                let isWalkable = true;

                // MAGI-TECH RGB SENSING
                if (r > 150 && g < 100 && b < 100) terrainType = 'ashfall'; 
                else if (g > r + 10 && g > 150) terrainType = 'grass'; 
                else if (r > 120 && g > 120 && b > 120 && r < 200) { 
                    terrainType = 'mud'; // mountain visual
                    isWalkable = false; 
                }
                // --- VOID LOGIC: If it's blue, set to 'empty' so it disappears ---
                else if (b > g && b > r) {
                    terrainType = 'empty'; 
                    isWalkable = false;
                }

                newGroundGrid[y][x] = { type: terrainType };
                newNavGrid[y][x] = isWalkable ? 1 : 0;
            }
        }

        // Stamp Race Spawns (Force these to be usable land)
        Object.entries(CONVERGENCE_RACE_SPAWNS).forEach(([zid, pos]) => {
            if (pos.x < currentW && pos.y < currentH) {
                newGroundGrid[pos.y][pos.x] = { type: 'grass', zid: zid }; 
                newNavGrid[pos.y][pos.x] = 1;
            }
        });

        const updatedLayers = layers.map(l => {
            if (l.id === 'ground') return { ...l, grid: newGroundGrid };
            if (l.type === 'navigation') return { ...l, grid: newNavGrid };
            return l;
        });

        // Add the flag here to tell the renderer to clean the grid
        useMapStore.setState({ 
            layers: updatedLayers, 
            zid: "Z00", 
            zoneName: "The Convergence",
            cleanGrid: true // <--- THIS FLAG IS THE KEY
        });

        alert(`✨ Magi-Tech: Sampling complete. Ocean hexes are now hidden.`);
    };
    // --- AUTO-POPULATE ENTRANCES LOGIC ---
// --- SMARTER AUTO-POPULATE (WITH COMBAT INFLUENCE) ---
const autoPopulateEntrances = () => {
    if (!backgroundImageData) {
        alert("Error: Please upload a background map image first!");
        return;
    }

    // --- 1. USE MANIFEST-LOADED ZONES FROM MAP STORE ---
    const { zones, triggers, layers, mapSize } = useMapStore.getState();
    const triggerLayer = layers.find(l => l.type === 'trigger');
    const objectLayer = layers.find(l => l.id === 'objects');
    
    // --- 2. DOUBLE-CONFIRM MASS DELETE SAFETY ---
    const existingAutoPortals = Object.keys(triggers).filter(id => id.startsWith('Z') && id.includes('_'));
    if (existingAutoPortals.length > 0) {
        if (window.confirm(`⚠️ ${existingAutoPortals.length} portals already exist. Wipe and re-roll locations?`)) {
            if (!window.confirm("☢️ FINAL WARNING: This will permanently delete all current portals and combat convergence data. Proceed?")) return;
        } else {
            return; 
        }
    }

    const img = new Image();
    img.src = backgroundImageData;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const pix = ctx.getImageData(0, 0, img.width, img.height).data;

        const getBiomeBucket = (r, g, b) => {
            if (r > 210 && g > 210 && b > 210) return 'tundra';
            if (b > 180 && g > 180 && r > 180) return 'tundra';
            if (g > r + 5 && g > b + 5) return 'forest';
            if (r > 150 && g > 130 && b < 100) return 'desert';
            if (r > 110 && g > 110 && b > 110 && r < 200) return 'mountain';
            return 'plains';
        };

        const newTriggers = {}; 
        const newLayers = JSON.parse(JSON.stringify(layers));
        const groundLayer = newLayers.find(l => l.id === 'ground');
        const activeTriggerLayer = newLayers.find(l => l.type === 'trigger');
        const activeObjectLayer = newLayers.find(l => l.id === 'objects');

        // CLEAR OLD WAND DATA (Prevents double-stacking icons/triggers)
        [activeTriggerLayer, activeObjectLayer].forEach(layer => {
            if (!layer) return;
            for(let y=0; y<mapSize.height; y++) {
                for(let x=0; x<mapSize.width; x++) {
                    const cell = layer.grid[y][x];
                    if (cell?.eventId?.startsWith('Z') || cell?.assetId === 'entranceBlue') {
                        layer.grid[y][x] = null;
                    }
                }
            }
        });

        const worldBuckets = {};
        for (let y = 0; y < mapSize.height; y++) {
            for (let x = 0; x < mapSize.width; x++) {
                const hex = groundLayer.grid[y][x];
                if (hex.type === 'default' || hex.type === 'mud') {
                    const px = Math.floor((x / mapSize.width) * img.width);
                    const py = Math.floor((y / mapSize.height) * img.height);
                    const i = (py * img.width + px) * 4;
                    const bucket = getBiomeBucket(pix[i], pix[i+1], pix[i+2]);
                    if (!worldBuckets[bucket]) worldBuckets[bucket] = [];
                    worldBuckets[bucket].push({ x, y });
                }
            }
        }

        let placementCount = 0;
        Object.values(zones).forEach(zone => {
            // Ensure we are looking at a valid zone ID from the manifest
            const currentZid = zone.zid || zone.id;
            if (currentZid === 'ZMW00' || currentZid === 'Z00' || !currentZid) return;
            
            const style = zone.hexStyle?.toLowerCase() || '';
            const targetBucket = Object.keys(worldBuckets).find(b => style.includes(b)) || 'plains';
            const availableSpots = worldBuckets[targetBucket] || worldBuckets['plains'] || [];

            if (availableSpots.length > 0) {
                const pickIndex = Math.floor(Math.random() * availableSpots.length);
                const pick = availableSpots.splice(pickIndex, 1)[0];
                
                // --- THE FIX: Cross-reference with Master Data for the real name ---
                const dbZone = masterData.zones[currentZid];
                const realName = dbZone?.zoneName || zone.zoneName || "Portal";
                const safeName = realName.replace(/\s+/g, '_');
                
                const eventId = `${currentZid}_${safeName}`;

                // --- SMART DESTINATION SCAN: Link to the target zone's Blue Entrance ---
                let targetX = 0, targetY = 0;
                const targetZoneData = zones[currentZid]; 
                
                if (targetZoneData?.layers) {
                    const targetObjects = targetZoneData.layers.find(l => l.id === 'objects');
                    if (targetObjects) {
                        // Scan destination zone for Blue Entrance icon to get arrival coords
                        outer: for (let ty = 0; ty < targetObjects.grid.length; ty++) {
                            for (let tx = 0; tx < targetObjects.grid[ty].length; tx++) {
                                if (targetObjects.grid[ty][tx]?.assetId === 'entranceBlue') {
                                    targetX = tx; targetY = ty;
                                    break outer;
                                }
                            }
                        }
                    }
                }
                
                newTriggers[eventId] = {
                    eventId, condition: "onInteract", action: "teleport",
                    parameters: { targetZoneId: currentZid, targetX, targetY }
                };

                if (activeTriggerLayer) activeTriggerLayer.grid[pick.y][pick.x] = { eventId };
                if (activeObjectLayer) activeObjectLayer.grid[pick.y][pick.x] = { assetId: 'entranceBlue' };

                // Apply Combat Convergence (Radius 4)
                const spreadRadius = 4;
                for (let sy = pick.y - spreadRadius; sy <= pick.y + spreadRadius; sy++) {
                    for (let sx = pick.x - spreadRadius; sx <= pick.x + spreadRadius; sx++) {
                        if (sx >= 0 && sx < mapSize.width && sy >= 0 && sy < mapSize.height) {
                            const dist = Math.sqrt(Math.pow(sx - pick.x, 2) + Math.pow(sy - pick.y, 2));
                            if (dist <= spreadRadius) {
                                const targetHex = groundLayer.grid[sy][sx];
                                const currentDist = targetHex.distToPortal || 999;
                                if (dist < currentDist) {
                                    targetHex.bestiaryOverride = zone.mobs || []; 
                                    targetHex.assignedZoneId = currentZid;
                                    targetHex.distToPortal = dist; 
                                }
                            }
                        }
                    }
                }
                placementCount++;
            }
        });

        useMapStore.setState({ layers: newLayers, triggers: newTriggers }); 
        alert(`✨ Manifest Sync Success! ${placementCount} portals linked to their destination Blue Entrances.`);
    };
};

// Helper to check if two colors are "close enough" (since images have slight variations)
const isColorMatch = (c1, c2) => {
    const threshold = 50; // Confirming the 50 here! ✅
    return Math.abs(c1.r - c2.r) < threshold && 
           Math.abs(c1.g - c2.g) < threshold && 
           Math.abs(c1.b - c2.b) < threshold;
};
    const handleExport = () => {
        updateActiveZoneData();
        const state = useMapStore.getState();
        
        // 1. ADDED: Pull Global Axioms from the Studio Store
        const masterConstants = useStudioStore.getState().masterData.constants || {};
        
        const groundLayer = state.layers.find(l => l.id === 'ground');

        // --- 1. CALC BOUNDING BOX CENTER (CENTERS MAP ON VISIBLE HEXES) ---
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasTiles = false;

        groundLayer.grid.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile && tile.type !== 'empty' && tile.type !== 'wall') {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                    hasTiles = true;
                }
            });
        });

        const boundingCenter = hasTiles ? {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        } : { x: state.mapSize.width / 2, y: state.mapSize.height / 2 };

        // 2. Calculate Collision Grid
        const bakedNavGrid = bakeCollisionData(state.layers, state.mapSize, state.assetLibrary);
        
        // 3. Inject into Export Layers
        const exportLayers = state.layers.map(layer => {
            if (layer.type === 'navigation') return { ...layer, grid: bakedNavGrid };
            return layer;
        });

        if (!exportLayers.find(l => l.type === 'navigation')) {
            exportLayers.push({
                id: 'navigation', name: 'Navigation', type: 'navigation', 
                isVisible: false, grid: bakedNavGrid, opacity: 0.5
            });
        }

        // 4. CONSTRUCT: Expanded Export Data (Preserving all original fields)
        const exportData = {
            zid: state.zid, 
            zoneName: state.zoneName, 
            biome: state.biome, 
            boundingCenter, 
            zoneLevel: state.zoneLevel,
            zoneType: state.zoneType,
            zoneMobs: state.zoneMobs,
            
            // --- NEW CONTENT INJECTED HERE ---
            // These laws are required by the engine for 'Play Ready' state
            baseShadowRate: masterConstants.SHADOW_DROP_BASE || 100,
            baseGemRate: masterConstants.GEM_DROP_BASE || 500,
            globalGoldMult: masterConstants.GLOBAL_GOLD_MULT || 1.0,
            // ---------------------------------

            mapSize: state.mapSize,
            imageBackgroundUrl: state.imageBackgroundUrl, 
            backgroundImageData: state.backgroundImageData, 
            originalBackgroundImageData: state.originalBackgroundImageData, 
            assetLibrary: state.assetLibrary,
            prefabs: state.prefabs, 
            layers: exportLayers,
            
            // SYNC: Ensure triggers have stable eventIds for the Interaction Bridge
            triggers: Object.fromEntries(
                Object.entries(state.triggers || {}).map(([id, t]) => [
                    id, 
                    { ...t, eventId: id || `TRG_${Date.now()}` }
                ])
            ),

            spawnPoints: state.spawnPoints, 
            initialView: state.initialView,
            aiStyle: state.aiStyle, 
            aiMood: state.aiMood, 
            aiKeywords: state.aiKeywords,
            backgroundAnimation: state.backgroundAnimation, 
            animationSpeed: state.animationSpeed,
            templates: state.templates,
            
            // METADATA
            lastModified: new Date().toISOString(),
            studioVersion: "2.5.0-MagiTech",
            isReadyForEngine: true
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${state.zid || 'geminus_map'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.name.toLowerCase().endsWith('.zip')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const zip = await JSZip.loadAsync(e.target.result);
                    const zonesData = {};
                    for (const filename in zip.files) {
                        if (filename.toLowerCase().endsWith('.json') && !zip.files[filename].dir) {
                           try {
                                const content = await zip.files[filename].async('string');
                                const data = JSON.parse(content);
                                let zid = data.zid;
                                if (!isNaN(zid)) {
                                    zid = `Z${String(zid).padStart(2, '0')}`;
                                    data.zid = zid;
                                }
                                if (zid) {
                                    zonesData[zid] = data;
                                }
                           } catch (jsonErr) {
                               console.warn(`Skipping invalid JSON file in zip: ${filename}`, jsonErr);
                           }
                        }
                    }
                    if (Object.keys(zonesData).length > 0) {
                        importZonesFromZip(zonesData);
                        const zoneList = Object.entries(zonesData).map(([id, data]) => ({ 
                            id, 
                            name: data.zoneName || id 
                        }));
                        useStudioStore.getState().syncImportedZones(zoneList);
                        showToast(`${Object.keys(zonesData).length} zones imported successfully!`);
                    } else {
                        showToast("No valid zone files found in the zip.");
                    }
                } catch (err) {
                    showToast(`ZIP Import Error: ${err.message}`);
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (file.name.toLowerCase().endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    let zid = data.zid;
                    if (!isNaN(zid)) {
                        zid = `Z${String(zid).padStart(2, '0')}`;
                        data.zid = zid;
                    }
                    if (zid) {
                        const zonesData = { [zid]: data };
                        importZonesFromZip(zonesData);
                        useStudioStore.getState().importHierarchicalData({ [zid]: data });
                        showToast("Map & Monsters synced to Dev Tools!");
                    } else {
                        showToast("Import Error: JSON file must have a 'zid'.");
                    }
                } catch (err) {
                    showToast(`JSON Import Error: ${err.message}`);
                }
            };
            reader.readAsText(file);
        }
        event.target.value = null;
    };

    const handleExportAll = () => {
        updateActiveZoneData();
        const { zones, assetLibrary } = useMapStore.getState();
        // 1. Fetch Global Axioms from the Studio Store
        const masterConstants = useStudioStore.getState().masterData.constants || {};
        
        if (Object.keys(zones).length === 0) {
            showToast("No zones to export.");
            return;
        }

        const zip = new JSZip();
        
        for (const zid in zones) {
            const zone = zones[zid];
            const groundLayer = zone.layers.find(l => l.id === 'ground');

            // --- BATCH CENTERING LOGIC --- (PRESERVED)
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            let hasTiles = false;

            groundLayer.grid.forEach((row, y) => {
                row.forEach((tile, x) => {
                    if (tile && tile.type !== 'empty' && tile.type !== 'wall') {
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                        hasTiles = true;
                    }
                });
            });

            const boundingCenter = hasTiles ? {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2
            } : { x: zone.mapSize.width / 2, y: zone.mapSize.height / 2 };
            // -----------------------------

            // 2. Calculate Collision Grid (PRESERVED)
            const bakedNavGrid = bakeCollisionData(zone.layers, zone.mapSize, assetLibrary);
            const exportLayers = zone.layers.map(layer => {
                if (layer.type === 'navigation') return { ...layer, grid: bakedNavGrid };
                return layer;
            });

            if (!exportLayers.find(l => l.type === 'navigation')) {
                exportLayers.push({
                    id: 'navigation', name: 'Navigation', type: 'navigation', 
                    isVisible: false, grid: bakedNavGrid, opacity: 0.5
                });
            }
            
            // 3. CONSTRUCT: GDD-Standardized Export (PRESERVED + INJECTED)
            const zoneExport = { 
                ...zone, 
                layers: exportLayers, 
                boundingCenter,
                // INJECT: Axioms required by the Engine (Appendix C1)
                baseShadowRate: masterConstants.SHADOW_DROP_BASE || 100,
                baseGemRate: masterConstants.GEM_DROP_BASE || 500,
                globalGoldMult: masterConstants.GLOBAL_GOLD_MULT || 1.0,
                // METADATA
                lastModified: new Date().toISOString(),
                isReadyForEngine: true
            };

            zip.file(`${zid}.json`, JSON.stringify(zoneExport, null, 2));
        }

        zip.generateAsync({ type: "blob" }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "geminus_zones.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showToast(`${Object.keys(zones).length} zones exported with global axioms!`);
        });
    };
    const handleQuickCreateZone = () => {
        const id = prompt("Assign New Zone ID (e.g., Z02):")?.toUpperCase();
        if (!id) return;

        // 1. Fetch live laws to seed the new territory
        const masterConstants = useStudioStore.getState().masterData.constants || {};
        const mapState = useMapStore.getState();
        
        // 2. Define the Complete Template
        const newZoneTemplate = {
            id,
            zid: id, 
            zoneName: "New Territory",
            minLevel: 1,
            type: "Gold Zone",
            dangerRating: 1.0,
            goldMultiplier: 1.0,
            shadowDropRate: masterConstants.SHADOW_DROP_BASE || 600,
            gemDropRate: masterConstants.GEM_DROP_BASE || 100,
            mobs: [],
            mapSize: { ...mapState.mapSize },
            layers: mapState.layers.map(layer => ({
                ...layer,
                grid: layer.id === 'navigation' 
                    ? Array(mapState.mapSize.height).fill(0).map(() => Array(mapState.mapSize.width).fill(0))
                    : Array(mapState.mapSize.height).fill(null).map(() => Array(mapState.mapSize.width).fill(null))
            })),
            triggers: {},
            spawnPoints: [],
            assetLibrary: { ...mapState.assetLibrary }
        };
        
        // 3. FORCE STATE INJECTION
        // This puts it into the Editor's immediate memory so it renders NOW
        useMapStore.setState({
            zones: { ...mapState.zones, [id]: newZoneTemplate },
            zid: id,
            zoneName: newZoneTemplate.zoneName,
            layers: newZoneTemplate.layers,
            triggers: {},
            spawnPoints: [],
            backgroundImageData: null
        });

        // 4. Update StudioStore (Master Database)
        updateData('zones', id, { ...newZoneTemplate, layers: undefined }); // Don't store heavy grids in masterData

        alert(`📡 Magi-Tech: ${id} initialized. Canvas wiped and focused.`);
    };
    
    const handleBatchResize = () => {
        const numZones = Object.keys(zones).length;
        if (numZones === 0) {
            showToast("No zones loaded to resize.");
            return;
        }
        batchResizeZones({ width: 15, height: 15 });
        showToast(`${numZones} zones have been resized and regenerated.`);
    };

    const toggleAccordion = (key) => setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleAssetTypeAccordion = (key) => setOpenAssetTypes(prev => ({ ...prev, [key]: !prev[key] }));
    
    // --- AI & IMAGE PROCESSING ---
    const handleImageLoad = (url) => {
        if (!url || !url.trim()) {
            setBackgroundImage('');
            return;
        }

        // MAGI-TECH SANITIZER: Automatically convert GitHub UI links to Raw links
        // Converts /blob/ to raw.githubusercontent.com and removes /refs/heads/ if present
        let sanitizedUrl = url
            .replace('github.com', 'raw.githubusercontent.com')
            .replace('/blob/', '/')
            .replace('/refs/heads/', '/');

        const img = new Image();
        // CRITICAL: Set crossOrigin BEFORE setting src to prevent "Tainted Canvas" errors
        img.crossOrigin = 'Anonymous'; 
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            setBackgroundImage(dataUrl);
            setField('aiGenError', ''); // Clear errors on success
        };
        img.onerror = () => {
            setField('aiGenError', 'Failed to load image. Check URL or CORS settings.');
            setIsGenerating(false);
        };
        img.src = sanitizedUrl;
    };
    const handleAIGenerateBackground = async () => {
        if (!constructedAiPrompt.trim()) { setField('aiGenError', "The AI prompt cannot be empty."); return; }
        setField('aiGenError', ''); setIsGenerating(true);
        try { 
            // Now calls the Robust generator which handles fallbacks automatically
            const imageUrl = await generateImageRobust(constructedAiPrompt); 
            handleImageLoad(imageUrl); 
        } 
        catch (error) { 
            console.error("AI background generation failed:", error); 
            setField('aiGenError', `AI generation failed: ${error.message}`); 
        } 
        finally { 
            setIsGenerating(false); 
        }
    };

    // New Robust Generator with Pollinations.ai Fallback
    const generateImageRobust = async (prompt) => {
        const { apiKey, mapSize } = useMapStore.getState();
        const width = mapSize.width * TILE_SIZE;
        const height = mapSize.height * TILE_SIZE;

        // 1. Try Google Imagen (Primary) - Only if Key exists
        if (apiKey) {
            try {
                // Attempting Legacy Model 003
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/image-generation-003:predict?key=${apiKey}`;
                const payload = { instances: [{ prompt: prompt }], parameters: { sampleCount: 1 } };
                
                const response = await fetch(apiUrl, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(payload) 
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.predictions?.[0]?.bytesBase64Encoded) {
                        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
                    }
                }
                // If response was not OK, we silently fall through to fallback
                console.warn("Google API failed, switching to Pollinations fallback...");
            } catch (e) {
                console.warn("Google API Error, switching to fallback:", e);
            }
        }

        // 2. Pollinations.ai (Fallback) - No Key Required, Free, Open Source
        // We encode the prompt and append dimensions to match your map size exactly
        const encodedPrompt = encodeURIComponent(prompt);
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
        
        // We fetch it first to ensure it generates, then return the URL
        // (Pollinations generates on request, so we can just return the URL directly, 
        // but fetching ensures we catch network errors before setting it)
        const check = await fetch(fallbackUrl);
        if(check.ok) {
            return fallbackUrl;
        } else {
            throw new Error("Both Google API and Pollinations Fallback failed.");
        }
    };
    const togglePlayMode = () => {
        const { isPlayMode, spawnPoints } = useMapStore.getState();
        
        if (!isPlayMode) {
            // Entering Play Mode
            if (spawnPoints.length === 0) {
                showToast("Cannot enter Play Mode: No Spawn Point set.");
                return;
            }
            
            // 1. Force Test Mode ON
            // 2. Set tool to 'interact' (The Play tool we added)
            // 3. Snap camera to player
            useMapStore.setState({ 
                isPlayMode: true, 
                isTestMode: true, 
                currentTool: 'interact',
                playerPosition: { x: spawnPoints[0].x, y: spawnPoints[0].y }
            });
            
            setTimeout(() => useMapStore.getState().centerCameraOnPlayer(), 100);
            showToast("🎮 Play Mode Active (Alt-Z to Center)");
        } else {
            // Returning to Editor
            useMapStore.setState({ isPlayMode: false, isTestMode: false, currentTool: 'select' });
            showToast("🛠️ Editor Restored");
        }
    };
    // --- TEST MODE ---
    const toggleTestMode = () => {
        const { isTestMode, layers, spawnPoints, mapSize, assetLibrary } = useMapStore.getState();

        if (!isTestMode) {
            // 1. Ensure a starting point exists
            if (spawnPoints.length === 0) { 
                showToast("Add a Spawn Point to enter Test Mode."); 
                return; 
            }

            // --- MAGI-TECH FIX: RESPECT MANUAL PATHING ---
            // We check if you already have a Navigation Layer
            let navLayer = layers.find(l => l.type === 'navigation');
            let finalLayers = [...layers];

            // 2. ONLY "Bake" if the layer is missing
            // This prevents your painted blue paths from being deleted
            if (!navLayer) {
                const bakedGrid = bakeCollisionData(layers, mapSize, assetLibrary);
                navLayer = {
                    id: 'navigation', 
                    name: 'Navigation', 
                    type: 'navigation', 
                    isVisible: false, 
                    grid: bakedGrid, 
                    opacity: 0.5 
                };
                finalLayers.push(navLayer);
            }

            // 3. Start Test Mode using YOUR paths
            useMapStore.setState({ 
                isTestMode: true, 
                playerPosition: { x: spawnPoints[0].x, y: spawnPoints[0].y },
                layers: finalLayers
            });

        } else {
            // Exit Test Mode
            useMapStore.setState({ isTestMode: false, playerPosition: null });
        }
    };
    const handleTestModeMove = (target) => {
        const state = useMapStore.getState();
        const { playerPosition, layers, isMoving, tileType } = state; 
        
        // --- THE INTERRUPT ---
        // If the player is already walking, we force the movement state to false 
        // to break the old 'setInterval' before starting the new path.
        if (isMoving) {
            setField('isMoving', false);
        }

        if (!playerPosition) return;

        const navLayer = layers.find(l => l.type === 'navigation');
        
        // 1. TARGET GUARD: Ensure the target hex exists within the coordinate system.
        if (!target || target.y === undefined || target.x === undefined) return;

        // 2. PATHFINDER PREP: Normalize grid (Treat everything not-Red as Walkable)
        const gridForPathfinder = navLayer 
            ? navLayer.grid.map(row => row.map(cell => (cell === 0 ? 0 : 1)))
            : Array.from({ length: state.mapSize.height }, () => Array(state.mapSize.width).fill(1));

        // 3. START/END NODES: Force pathfinder to treat origin and destination as walkable.
        if (gridForPathfinder[playerPosition.y]) gridForPathfinder[playerPosition.y][playerPosition.x] = 1;

        const path = aStar(gridForPathfinder, playerPosition, target, tileType);
        
        if (path && path.length > 0) {
            movePlayerAlongPath(path);
        } else {
            // 4. NEIGHBORHOOD FALLBACK: Direct step for adjacent hexes if pathfinding logic fails
            const dx = Math.abs(playerPosition.x - target.x);
            const dy = Math.abs(playerPosition.y - target.y);
            if (dx <= 1 && dy <= 1) {
                movePlayerAlongPath([target]);
            } else {
                console.warn("No path found to distant target.");
            }
        }
    };
    const movePlayerAlongPath = (path) => {
        if (!path || path.length === 0) return;
        setField('isMoving', true);
        
        let step = 0;
        const walkInterval = setInterval(() => {
            // Check if the user toggled isMoving to false manually
            const currentIsMoving = useMapStore.getState().isMoving;
            
            if (step < path.length && currentIsMoving) {
                const nextPos = { x: path[step].x, y: path[step].y };
                setField('playerPosition', nextPos);
                useMapStore.getState().snapToCoord(nextPos.x, nextPos.y);
                step++;
            } else {
                clearInterval(walkInterval);
                setField('isMoving', false);
                window.dispatchEvent(new Event('resize')); 
            }
        }, 80);
    };

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleSetInitialView = () => {
        const { x: panX, y: panY } = panOffset;
        const center = getCoordsFromEvent(null, {clientX: canvasRef.current.width / 2, clientY: canvasRef.current.height / 2});

        setField('initialView', {
            zoom: parseFloat(zoom.toFixed(2)),
            center: {
                x: center.x,
                y: center.y
            }
        });
        showToast("Initial view set!");
    };


    // --- LIFECYCLE HOOKS ---
    useEffect(() => {
        const initialOpenState = {};
        Object.keys(assetCategoryOrder).forEach(mainCat => {
            initialOpenState[mainCat] = false;
            if (Array.isArray(assetCategoryOrder[mainCat])) {
                assetCategoryOrder[mainCat].forEach(subCat => {
                    initialOpenState[subCat] = false;
                });
            }
        });
        initialOpenState["Structures & Interactives"] = true;
        initialOpenState["Core Interactives"] = true;
        setOpenAssetTypes(initialOpenState);
    }, []);
    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        // --- MAGI-TECH FIX: Explicitly non-passive listeners to stop browser scrolling ---
        const onWheel = (e) => e.preventDefault();
        const onTouch = (e) => { if (e.touches.length > 1) e.preventDefault(); };

        container.addEventListener('wheel', onWheel, { passive: false });
        container.addEventListener('touchmove', onTouch, { passive: false });

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) setCanvasSize(entry.contentRect);
        });
        resizeObserver.observe(container);

        return () => {
            container.removeEventListener('wheel', onWheel);
            container.removeEventListener('touchmove', onTouch);
            resizeObserver.disconnect();
        };
    }, []);
    useEffect(() => {
        if (!backgroundImageData) {
            setLocalBackgroundImage(null);
            return;
        }
        const img = new Image();
        img.onload = () => setLocalBackgroundImage(img);
        img.onerror = () => setLocalBackgroundImage(null);
        img.src = backgroundImageData;
    }, [backgroundImageData]);
    useEffect(() => { Object.values(assetLibrary).forEach(asset => { if (asset.imageUrl && !imageAssetCache[asset.imageUrl]) { const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = asset.imageUrl; img.onload = () => setImageAssetCache(prev => ({ ...prev, [asset.imageUrl]: img })); img.onerror = () => console.warn(`Failed to load image: ${asset.imageUrl}`); } }); }, [assetLibrary]);
    useEffect(() => { 
        const handleKeyDown = (e) => { 
            // --- 1. TYPING SAFETY ---
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            // --- 2. CAMERA SNAP HOTKEY (ALT-Z) ---
            if (e.altKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                useMapStore.getState().centerCameraOnPlayer();
                setToastMessage("Camera Centered");
                return;
            }

            // --- 3. EDITOR SHORTCUTS ---
            if (e.code === 'Space') { setIsSpacebarDown(true); e.preventDefault(); }
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); } 
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }

            // --- 4. PLAYER MOVEMENT & AUTO-FOLLOW ---
            if (isTestMode && playerPosition && !isMoving) {
                const { x, y } = playerPosition;
                let newPos = { ...playerPosition };
                
                // WASD + Arrow Support
                const key = e.key.toLowerCase();
                if (key === 'arrowup' || key === 'w') newPos.y--;
                else if (key === 'arrowdown' || key === 's') newPos.y++;
                else if (key === 'arrowleft' || key === 'a') newPos.x--;
                else if (key === 'arrowright' || key === 'd') newPos.x++;
                
                const isMovementKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key);

                const navLayer = layers.find(l => l.type === 'navigation');
                if (navLayer && navLayer.grid[newPos.y]?.[newPos.x] === 1) {
                    setField('playerPosition', newPos);

                    // AUTO-FOLLOW: Snap camera to new position after movement
                    if (isMovementKey) {
                        // This uses your CURRENT zoom level from centerCameraOnPlayer
                        setTimeout(() => useMapStore.getState().centerCameraOnPlayer(), 10);
                    }
                }
            }
        };
        const handleKeyUp = (e) => { if (e.code === 'Space') setIsSpacebarDown(false); };
        window.addEventListener('keydown', handleKeyDown); 
        window.addEventListener('keyup', handleKeyUp); 
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        }; 
    }, [undo, redo, isTestMode, playerPosition, isMoving, layers]);

    // Cursor Style Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (isPanning) { canvas.style.cursor = 'grabbing'; return; }
        if (isSpacebarDown) { canvas.style.cursor = 'grab'; return; }
        if (isTestMode) { canvas.style.cursor = 'pointer'; return; }
        switch (currentTool) {
            case 'place': canvas.style.cursor = 'copy'; break;
            case 'erase': canvas.style.cursor = 'crosshair'; break;
            case 'select': canvas.style.cursor = 'pointer'; break;
            case 'stamp': canvas.style.cursor = 'crosshair'; break;
            case 'path': canvas.style.cursor = 'move'; break;
            case 'eyedropper': canvas.style.cursor = 'crosshair'; break;
            case 'spawn': canvas.style.cursor = 'crosshair'; break;
            default: canvas.style.cursor = 'default';
        }
    }, [currentTool, isPanning, isTestMode, isSpacebarDown]);

    // --- RENDER LOGIC ---
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;
        canvas.width = canvasSize.width; canvas.height = canvasSize.height; const ctx = canvas.getContext('2d');
        try {
            ctx.fillStyle = '#1d1d1d'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.save();
            ctx.translate(canvas.width / 2 + panOffset.x, canvas.height / 2 + panOffset.y); ctx.scale(zoom, zoom);
            // --- MATH FIX: Synchronize Image Scale to Hex Geometry ---
            // --- SMART CENTERING RENDERER ---
            if (backgroundImage) {
                let totalGridWidth, totalGridHeight;
                let offsetShiftX = 0;
                let offsetShiftY = 0;

                // 1. Calculate the Visual Footprint of the actual grid
                const s = TILE_SIZE / Math.sqrt(3); 
                const w = Math.sqrt(3) * s;
                const h = 2 * s;

                if (zid === "Z00" || zoneName === "The Convergence") {
                    // MODE A: Proportional Sync (Edge-to-Edge for Mega-Map)
                    totalGridWidth = (mapSize.width + 0.5) * w;
                    totalGridHeight = (mapSize.height * 0.75 + 0.25) * h;
                } else {
                    // MODE B: Smart Centered Background (For Standard Zones)
                    // We draw the image to match the Map Size, but centered on the grid center.
                    totalGridWidth = mapSize.width * TILE_SIZE;
                    totalGridHeight = mapSize.height * (tileType === 'hex' ? TILE_SIZE * 1.5 : TILE_SIZE);
                    
                    // This shift ensures the "dead space" is shared equally on all sides
                    offsetShiftY = (totalGridHeight - (mapSize.height * 0.75 * h)) / 4;
                }

                // Draw the image using the calculated offsets
                ctx.drawImage(
                    backgroundImage, 
                    -totalGridWidth / 2, 
                    (-totalGridHeight / 2) + offsetShiftY, 
                    totalGridWidth, 
                    totalGridHeight
                );
            }
            if (!layers || layers.length === 0) { ctx.restore(); return; }
            
            const groundLayer = layers.find(l => l.id === 'ground');

            layers.forEach(layer => {
                if (!layer.isVisible) return;
                
                ctx.globalAlpha = layer.opacity;

                if (layer.type === 'visual') {
                    const renderList = [];
                    const state = useMapStore.getState();
                    const isCleanMode = state.cleanGrid || false;

                    // --- VIEW FRUSTUM CULLING (O(Visible) Logic) ---
                    const s = TILE_SIZE / Math.sqrt(3); 
                    const w = Math.sqrt(3) * s;
                    const h = 2 * s;
                    const mapCenterX = mapSize.width / 2;
                    const mapCenterY = mapSize.height / 2;

                    const buffer = 2;
                    const startX = Math.max(0, Math.floor(((-canvas.width / 2 - panOffset.x) / zoom) / w + mapCenterX) - buffer);
                    const endX = Math.min(mapSize.width - 1, Math.ceil(((canvas.width / 2 - panOffset.x) / zoom) / w + mapCenterX) + buffer);
                    const startY = Math.max(0, Math.floor(((-canvas.height / 2 - panOffset.y) / zoom) / (h * 0.75) + mapCenterY) - buffer);
                    const endY = Math.min(mapSize.height - 1, Math.ceil(((canvas.height / 2 - panOffset.y) / zoom) / (h * 0.75) + mapCenterY) + buffer);

                    for (let y = startY; y <= endY; y++) {
                        for (let x = startX; x <= endX; x++) {
                            const tile = layer.grid[y][x];
                            if (!tile) continue;

                            const groundTile = groundLayer?.grid[y]?.[x];
                            const isVoid = !groundTile || groundTile.type === 'empty' || groundTile.type === 'wall';
                            const assetInfo = assetLibrary[tile.assetId];
                            const isCoreModule = assetInfo?.type === 'Core Interactives' || 
                                               assetInfo?.type === 'Estate Buildings' || 
                                               assetInfo?.type === 'Clan Buildings';

                            const isOnEmptyVoid = groundTile?.type === 'empty';
                            const shouldHide = isCleanMode && !isEditingLayout && (isOnEmptyVoid || (isVoid && !isCoreModule));

                            if (!shouldHide) {
                                if (layer.id === 'ground') {
                                    renderList.push({ type: 'tile', tile, x, y, depth: y + x });
                                } else if (tile.assetId) {
                                    renderList.push({ type: 'asset', tile, x, y, depth: y + x + 0.5 });
                                }
                            }
                        }
                    }
                    renderList.sort((a, b) => a.depth - b.depth);
                    // ... rest of item.type === 'tile' rendering logic follows ...
                    
                    renderList.forEach(item => {
                        const { tile, x, y } = item; 
                        const center = getTileCenter(x, y, view, tileType, mapSize);
                        
                        if (item.type === 'tile') {
                            const isNonPlayable = tile.type === 'empty' || tile.type === 'wall';
                            let fillStyle;
                            const terrainAsset = assetLibrary[tile.type];
                            const terrainImage = terrainAsset ? imageAssetCache[terrainAsset.imageUrl] : null;

                            if (isEditingLayout && isNonPlayable) {
                                fillStyle = 'rgba(60, 71, 72, 0.5)';
                            } else if (biome === 'Clear') {
                                fillStyle = 'rgba(0,0,0,0)';
                            } else if (areTilesColorless) {
                                fillStyle = 'rgba(0, 0, 0, 0)';
                            } else if (terrainImage && tile.type !== 'default' && terrainImage.complete) {
                                fillStyle = ctx.createPattern(terrainImage, 'repeat');
                            } else {
                                const biomeColor = BIOME_COLORS[biome] || BIOME_COLORS.forest;
                                fillStyle = hexToRgba(biomeColor, tileOpacity);
                            }
                            
                            // --- ZOOM OPTIMIZATION: Hide borders when zoomed out far to kill lag ---
                            const isSelected = selectedTile?.x === x && selectedTile?.y === y && selectedTile?.layerId === layer.id;
                            const zoomThreshold = 0.25; // Adjust this: Lower means borders stay visible longer

                            ctx.strokeStyle = isSelected ? 'var(--glow-vibrant-teal)' : 'rgba(29, 29, 29, 0.7)';
                            ctx.lineWidth = isSelected ? 4 / zoom : 2 / zoom;

                            // Skip drawing the stroke if we are too far out and it's not the selected tile
                            const shouldDrawBorder = zoom > zoomThreshold || isSelected;
                            
                            ctx.save();
                            
                            if (tileType === 'square') {
                                const TILE_WIDTH = TILE_SIZE, TILE_HEIGHT = view === 'isometric' ? TILE_SIZE / 2 : TILE_SIZE;
                                ctx.translate(center.x - TILE_WIDTH / 2, center.y - TILE_HEIGHT / 2);
                                ctx.beginPath();
                                if (view === 'isometric') {
                                    ctx.moveTo(TILE_WIDTH / 2, 0);
                                    ctx.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
                                    ctx.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
                                    ctx.lineTo(0, TILE_HEIGHT / 2);
                                } else {
                                    ctx.rect(0, 0, TILE_WIDTH, TILE_HEIGHT);
                                }
                                ctx.closePath();
                            } else {
                                ctx.translate(center.x, center.y);
                                const hexSize = view === 'isometric' ? TILE_SIZE / 2 : TILE_SIZE / Math.sqrt(3);
                                const points = hexUtils.getHexPoints(hexSize);
                                ctx.beginPath();
                                ctx.moveTo(points[0], points[1]);
                                for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
                                ctx.closePath();
                            }
                            ctx.fillStyle = fillStyle;
                            ctx.fill();
                            if (shouldDrawBorder) ctx.stroke();
                            ctx.restore();

                        } else if (item.type === 'asset') {
                            const asset = assetLibrary[tile.assetId]; 
                            const loadedImage = imageAssetCache[asset?.imageUrl]; // Fetches preloaded image
                            
                            ctx.save();
                            ctx.translate(center.x, center.y); // Centers the asset on the hex
                            
                            // Apply object transformations
                            if (tile.rotation) ctx.rotate(tile.rotation * Math.PI / 180);
                            if (tile.flipped) ctx.scale(-1, 1);

                            if (loadedImage && loadedImage.complete) {
                                // Correctly calculates scale and yOffset to prevent assets from "floating" too high
                                const scale = asset.scale || 1;
                                const yOffset = asset.yOffset || 0;
                                const imgSize = TILE_SIZE * scale;
                                const aspectRatio = loadedImage.height / loadedImage.width;
                                
                                ctx.drawImage(
                                    loadedImage, 
                                    -imgSize / 2, 
                                    -(imgSize * aspectRatio) / 2 + yOffset, 
                                    imgSize, 
                                    imgSize * aspectRatio
                                );
                            } else if (asset?.svgPath) {
                                // Fallback for vector-based legacy assets
                                const path = new Path2D(asset.svgPath);
                                ctx.scale(TILE_SIZE / 32, TILE_SIZE / 32);
                                ctx.translate(-12, -12);
                                ctx.fillStyle = asset.color || '#fff';
                                ctx.fill(path);
                            }
                            ctx.restore();
                        }

                        // --- RESTORED INTERACTION BADGES (FIXED OFFSET) ---
                        if (tile.properties && tile.properties.interactionType && tile.properties.interactionType !== 'none') {
                            const type = tile.properties.interactionType;
                            const badgeSize = (TILE_SIZE / 4) / zoom; // Scaled to zoom
                            const offset = (TILE_SIZE / 3);
                            
                            const badgeX = center.x + offset;
                            const badgeY = center.y - offset;

                            ctx.save();
                            ctx.beginPath();
                            ctx.arc(badgeX, badgeY, badgeSize, 0, 2 * Math.PI);
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                            ctx.fill();
                            
                            let icon = '!';
                            let color = '#fff';
                            switch(type) {
                                case 'warp': icon = '🚪'; color = '#4fd1c5'; break;
                                case 'npc': icon = '💬'; color = '#63b3ed'; break;
                                case 'boss': icon = '💀'; color = '#fc8181'; break;
                                case 'quest_item': icon = '!'; color = '#d6bcfa'; break;
                            }

                            ctx.strokeStyle = color;
                            ctx.lineWidth = 1.5 / zoom;
                            ctx.stroke();

                            ctx.fillStyle = color;
                            ctx.font = `bold ${badgeSize * 1.2}px sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(icon, badgeX, badgeY + (1/zoom)); 
                            ctx.restore();
                        }
                        // ------------------------------------

                    });
                    // ==========================================
           // --- MAGI-TECH CULLING: Optimized Enemy & Badge Scan ---
            try {
                // Re-calculate visible bounds for this sub-loop
                const s = TILE_SIZE / Math.sqrt(3);
                const w = Math.sqrt(3) * s;
                const h = 2 * s;
                const buffer = 2;
                const startX = Math.max(0, Math.floor((-panOffset.x - canvas.width / 2) / (zoom * w)) - buffer);
                const endX = Math.min(mapSize.width - 1, Math.ceil((-panOffset.x + canvas.width / 2) / (zoom * w)) + buffer);
                const startY = Math.max(0, Math.floor((-panOffset.y - canvas.height / 2) / (zoom * h * 0.75)) - buffer);
                const endY = Math.min(mapSize.height - 1, Math.ceil((-panOffset.y + canvas.height / 2) / (zoom * h * 0.75)) + buffer);

                layers.forEach(layer => {
                    if (!layer.isVisible || !layer.grid) return;
                    
                    // Only scan the visible segment of the 300x500 grid
                    for (let y = startY; y <= endY; y++) {
                        for (let x = startX; x <= endX; x++) {
                            const cellData = layer.grid[y]?.[x];
                            if (cellData && cellData.type === 'enemy') {
                                const center = getTileCenter(x, y, view, tileType, mapSize);
                                ctx.fillStyle = "rgba(220, 38, 38, 0.7)"; 
                                ctx.beginPath();
                                ctx.arc(center.x, center.y, TILE_SIZE * 0.4, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.fillStyle = "white";
                                ctx.font = "16px Arial";
                                ctx.textAlign = "center";
                                ctx.textBaseline = "middle";
                                ctx.fillText("💀", center.x, center.y);
                            }
                        }
                    }
                });
            } catch (e) { 
                console.error("Enemy draw error:", e);
            }
                } else if (layer.type === 'navigation') {
                    // --- NAVIGATION LAYER RENDERER (RESTORED INTRICACY) ---
                    const showNav = layer.isVisible && (currentTool === 'path' || isTestMode || activeLayerId === layer.id);
                    
                    if (showNav) {
                        for (let y = 0; y < mapSize.height; y++) {
                            for (let x = 0; x < mapSize.width; x++) {
                                const center = getTileCenter(x, y, view, tileType, mapSize);
                                const isWalkable = layer.grid[y][x] === 1;
                                
                                ctx.save();
                                ctx.globalAlpha = layer.opacity * 0.6;
                                ctx.fillStyle = isWalkable ? 'rgba(0, 255, 150, 0.4)' : 'rgba(255, 50, 50, 0.5)';
                                ctx.strokeStyle = isWalkable ? 'rgba(0, 255, 150, 0.8)' : 'rgba(255, 50, 50, 0.8)';
                                ctx.lineWidth = 1 / zoom;

                                ctx.beginPath();
                                if (tileType === 'square') {
                                    ctx.rect(center.x - TILE_SIZE / 2, center.y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
                                } else {
                                    const hexSize = view === 'isometric' ? TILE_SIZE / 2 : TILE_SIZE / Math.sqrt(3);
                                    const points = hexUtils.getHexPoints(hexSize);
                                    ctx.moveTo(center.x + points[0], center.y + points[1]);
                                    for (let i = 2; i < points.length; i += 2) ctx.lineTo(center.x + points[i], center.y + points[i + 1]);
                                }
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                ctx.restore();
                            }
                        }
                    }
                } else if (layer.type === 'trigger') {
                    for (let y = 0; y < mapSize.height; y++) { for (let x = 0; x < mapSize.width; x++) {
                        const tile = layer.grid[y][x];
                        if (tile && tile.eventId) {
                            const center = getTileCenter(x, y, view, tileType, mapSize);
                            const color = stringToColor(tile.eventId);
                            ctx.fillStyle = hexToRgba(color, 0.4);
                            ctx.beginPath();
                            if (tileType === 'square') { ctx.rect(center.x - TILE_SIZE / 2, center.y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE); } 
                            else { const hexSize = view === 'isometric' ? TILE_SIZE / 2 : TILE_SIZE / Math.sqrt(3); const points = hexUtils.getHexPoints(hexSize); ctx.moveTo(center.x + points[0], center.y + points[1]); for (let i = 2; i < points.length; i += 2) ctx.lineTo(center.x + points[i], center.y + points[i + 1]); }
                            ctx.closePath(); ctx.fill();
                        }
                    }}
                }
                ctx.globalAlpha = 1;
            });
            
            if (pathfindingPoints.start) { const center = getTileCenter(pathfindingPoints.start.x, pathfindingPoints.start.y, view, tileType, mapSize); ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'; ctx.beginPath(); ctx.arc(center.x, center.y, TILE_SIZE / 4, 0, 2 * Math.PI); ctx.fill(); }
            if (calculatedPath.length > 0) { ctx.strokeStyle = 'yellow'; ctx.lineWidth = 4 / zoom; ctx.beginPath(); const startCenter = getTileCenter(calculatedPath[0].x, calculatedPath[0].y, view, tileType, mapSize); ctx.moveTo(startCenter.x, startCenter.y); for (let i = 1; i < calculatedPath.length; i++) { const center = getTileCenter(calculatedPath[i].x, calculatedPath[i].y, view, tileType, mapSize); ctx.lineTo(center.x, center.y); } ctx.stroke(); }
            if (selectedRegion) { const { startX, startY, endX, endY } = selectedRegion; const minX = Math.min(startX, endX); const minY = Math.min(startY, endY); const maxX = Math.max(startX, endX); const maxY = Math.max(startY, endY); const startCenter = getTileCenter(minX, minY, view, tileType, mapSize); const endCenter = getTileCenter(maxX, maxY, view, tileType, mapSize); const rectWidth = (endCenter.x - startCenter.x) + TILE_SIZE; const rectHeight = (endCenter.y - startCenter.y) + TILE_SIZE; ctx.fillStyle = 'rgba(32, 140, 140, 0.3)'; ctx.strokeStyle = 'var(--glow-vibrant-teal)'; ctx.lineWidth = 2 / zoom; ctx.fillRect(startCenter.x - TILE_SIZE / 2, startCenter.y - TILE_SIZE / 2, rectWidth, rectHeight); ctx.strokeRect(startCenter.x - TILE_SIZE / 2, startCenter.y - TILE_SIZE / 2, rectWidth, rectHeight); }
            
            spawnPoints.forEach((point, index) => {
                const center = getTileCenter(point.x, point.y, view, tileType, mapSize);
                const radius = TILE_SIZE / 4;
                ctx.beginPath();
                ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
                
                if (index === selectedSpawnIndex) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 3 / zoom;
                } else {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1 / zoom;
                }
                
                ctx.fill();
                ctx.stroke();
            });
            // --- DRAW OTHER PLAYERS (FOR PK TESTING) ---
            // Pulling data from the store we just updated
            Object.values(otherPlayers).forEach(p => {
                const center = getTileCenter(p.x, p.y, view, tileType, mapSize);
                
                // Red glow if in a combat zone, blue if safe
                ctx.fillStyle = (zoneType === 'Shadow') ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 150, 255, 0.8)';
                ctx.shadowColor = (zoneType === 'Shadow') ? 'red' : 'cyan';
                ctx.shadowBlur = 10;
                
                ctx.beginPath();
                ctx.arc(center.x, center.y, TILE_SIZE / 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset for performance

                // Player Name
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Cinzel';
                ctx.textAlign = 'center';
                ctx.fillText(p.name, center.x, center.y - 25);
            });    
            if (isTestMode && playerPosition) {
                const center = getTileCenter(playerPosition.x, playerPosition.y, view, tileType, mapSize);
                
                // 1. Draw Player (Standardizing size for Hex/Square)
                const playerRadius = tileType === 'hex' ? TILE_SIZE / 2.5 : TILE_SIZE / 3;
                ctx.fillStyle = 'rgba(255, 105, 180, 0.9)';
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2 / zoom;
                ctx.beginPath();
                ctx.arc(center.x, center.y, playerRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                // 2. Draw Interaction Badge (Sync with Adjacency Logic)
                const objectLayer = layers.find(l => l.id === 'objects');
                const triggerLayer = layers.find(l => l.type === 'trigger');
                
                const hasObjectInt = objectLayer?.grid?.[playerPosition.y]?.[playerPosition.x]?.properties?.interactionType !== 'none';
                const hasTriggerInt = triggerLayer?.grid?.[playerPosition.y]?.[playerPosition.x]?.eventId;

                if (hasObjectInt || hasTriggerInt) {
                    ctx.save();
                    ctx.translate(center.x, center.y - (TILE_SIZE * 0.7));
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, 10 / zoom, 0, Math.PI * 2);
                    ctx.fillStyle = '#00f2ff';
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1.5 / zoom;
                    ctx.stroke();
                    
                    ctx.fillStyle = '#000';
                    ctx.font = `bold ${12 / zoom}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('!', 0, 0);
                    ctx.restore();
                }
            }

            if (mouseCoords.x !== -1 && mouseCoords.y !== -1 && !isPanning && !isDragging) {
                const center = getTileCenter(mouseCoords.x, mouseCoords.y, view, tileType, mapSize);
                ctx.fillStyle = 'rgba(202, 233, 234, 0.25)';
                ctx.strokeStyle = 'rgba(202, 233, 234, 0.75)';
                ctx.lineWidth = 2 / zoom;
                ctx.beginPath();
                if (tileType === 'square') {
                    const TILE_WIDTH = TILE_SIZE;
                    const TILE_HEIGHT = view === 'isometric' ? TILE_SIZE / 2 : TILE_SIZE;
                    if (view === 'isometric') {
                        ctx.moveTo(center.x, center.y);
                        ctx.lineTo(center.x + TILE_WIDTH / 2, center.y + TILE_HEIGHT / 2);
                        ctx.lineTo(center.x, center.y + TILE_HEIGHT);
                        ctx.lineTo(center.x - TILE_WIDTH / 2, center.y + TILE_HEIGHT / 2);
                    } else {
                        ctx.rect(center.x - TILE_WIDTH / 2, center.y - TILE_HEIGHT / 2, TILE_WIDTH, TILE_HEIGHT);
                    }
                } else {
                    const hexSize = view === 'isometric' ? TILE_SIZE / 2 : TILE_SIZE / Math.sqrt(3);
                    const points = hexUtils.getHexPoints(hexSize);
                    ctx.moveTo(center.x + points[0], center.y + points[1]);
                    for (let i = 2; i < points.length; i += 2) {
                        ctx.lineTo(center.x + points[i], center.y + points[i + 1]);
                    }
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();

            if (zoneName) {
                const fontName = BIOME_FONTS[biome] || BIOME_FONTS.default;
                const dynamicFontSize = Math.min(canvas.width / 15, 40);
                const yPos = 20;

                const computedStyle = getComputedStyle(document.body);
                const highlightColor = computedStyle.getPropertyValue('--highlight-powder-blue').trim();

                const gradient = ctx.createLinearGradient(0, yPos, 0, yPos + dynamicFontSize);
                gradient.addColorStop(0, '#FFFDE4');
                gradient.addColorStop(1, highlightColor || '#cae9ea');
                
                ctx.font = `${dynamicFontSize}px ${fontName}`;
                ctx.fillStyle = gradient;
                ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
                ctx.lineWidth = 4;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.shadowColor = 'rgba(0, 0, 0, 1)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 3;

                ctx.strokeText(zoneName, canvas.width / 2, yPos);
                ctx.fillText(zoneName, canvas.width / 2, yPos);
            }

        } catch (e) { console.error("Error rendering map:", e); }
    }, [layers, view, tileType, tileOpacity, mapSize, canvasSize, zoom, panOffset, assetLibrary, imageAssetCache, backgroundImage, isEditingLayout, areTilesColorless, biome, selectedTile, selectedRegion, pathfindingPoints, calculatedPath, mouseCoords, isPanning, isDragging, zoneName, spawnPoints, selectedSpawnIndex, isTestMode, playerPosition, activeZoneId]);

    // --- Animation Logic ---
    useEffect(() => {
        const canvas = animationCanvasRef.current;
        if (!canvas || canvasSize.width === 0 || canvasSize.height === 0 || backgroundAnimation === 'none') {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        let particles = [];
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particleDensity = 0.3 * animationSpeed;
            if (Math.random() < particleDensity && particles.length < 200) { // Cap particles
                const p = {
                    life: 0,
                    maxLife: 60 + Math.random() * 120, // 1 to 3 seconds
                    update: function() { this.life++; }
                };

                switch(backgroundAnimation) {
                    case 'fallingLeaves':
                        p.x = Math.random() * canvas.width;
                        p.y = -10;
                        p.vx = (Math.random() - 0.5) * 0.5 * animationSpeed;
                        p.vy = (0.5 + Math.random() * 0.5) * animationSpeed;
                        p.size = 4 + Math.random() * 4;
                        p.color = `rgba(${100 + Math.random() * 50}, ${150 + Math.random() * 50}, ${50}, 0.7)`;
                        p.angle = Math.random() * Math.PI * 2;
                        p.spin = (Math.random() - 0.5) * 0.1;
                        p.update = function() {
                            this.life++;
                            this.x += this.vx + Math.sin(this.life * 0.05) * 0.3;
                            this.y += this.vy;
                            this.angle += this.spin;
                            if (this.y > canvas.height + 10) this.life = this.maxLife;
                        };
                        p.draw = function(c) {
                            c.save();
                            c.translate(this.x, this.y);
                            c.rotate(this.angle);
                            c.fillStyle = this.color;
                            c.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
                            c.restore();
                        }
                        break;
                    case 'swirlingSand':
                        p.x = -10;
                        p.y = Math.random() * canvas.height;
                        p.vx = (1 + Math.random() * 2) * animationSpeed;
                        p.vy = (Math.random() - 0.5) * 0.2 * animationSpeed;
                        p.color = `rgba(210, 180, 140, ${0.2 + Math.random() * 0.3})`;
                        p.size = 1 + Math.random() * 2;
                        p.update = function() {
                            this.life++;
                            this.x += this.vx;
                            this.y += this.vy;
                            if (this.x > canvas.width + 10) this.life = this.maxLife;
                        };
                        break;
                    case 'gentleSnowfall':
                        p.x = Math.random() * canvas.width;
                        p.y = -10;
                        p.size = 1 + Math.random() * 3;
                        p.vy = p.size * 0.2 * animationSpeed; // Parallax
                        p.vx = (Math.random() - 0.5) * 0.2 * animationSpeed;
                        p.color = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.3})`;
                        p.update = function() {
                            this.life++;
                            this.x += this.vx;
                            this.y += this.vy;
                            if (this.y > canvas.height + 10) this.life = this.maxLife;
                        };
                        break;
                    case 'floatingEmbers':
                        p.x = Math.random() * canvas.width;
                        p.y = canvas.height + 10;
                        p.vy = (-0.2 - Math.random() * 0.5) * animationSpeed;
                        p.vx = (Math.random() - 0.5) * 0.3 * animationSpeed;
                        p.color = `rgba(255, ${100 + Math.random() * 50}, 0, 0.8)`;
                        p.size = 1 + Math.random() * 2;
                        p.update = function() {
                            this.life++;
                            this.x += this.vx;
                            this.y += this.vy;
                            if (this.y < -10) this.life = this.maxLife;
                        };
                        break;
                    case 'mysticalWisps':
                        p.x = Math.random() * canvas.width;
                        p.y = Math.random() * canvas.height;
                        p.vx = (Math.random() - 0.5) * 0.3 * animationSpeed;
                        p.vy = (Math.random() - 0.5) * 0.3 * animationSpeed;
                        p.color = `rgba(150, 200, 255, ${0.1 + Math.random() * 0.2})`;
                        p.size = 10 + Math.random() * 15;
                        p.update = function() {
                            this.life++;
                            this.x += this.vx + Math.sin(this.life * 0.02) * 0.2;
                            this.y += this.vy + Math.cos(this.life * 0.02) * 0.2;
                        };
                        break;
                    case 'celestialShimmer':
                    case 'gleamingCrystals':
                    default:
                        p.x = Math.random() * canvas.width;
                        p.y = Math.random() * canvas.height;
                        p.size = 1 + Math.random() * 2;
                        p.color = backgroundAnimation === 'celestialShimmer' ? `rgba(255, 240, 200, 0.8)` : `rgba(255, 255, 220, 0.8)`;
                        break;
                }
                particles.push(p);
            }

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                if (p.life >= p.maxLife) {
                    particles.splice(i, 1);
                    continue;
                }

                const progress = p.life / p.maxLife;
                const opacity = Math.sin(progress * Math.PI); // Fade in and out
                
                if (p.draw) {
                    p.draw(ctx);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    const originalColor = p.color.substring(0, p.color.lastIndexOf(','));
                    ctx.fillStyle = `${originalColor}, ${opacity * parseFloat(p.color.substring(p.color.lastIndexOf(',') + 1, p.color.length - 1))})`;
                    ctx.fill();
                }
            }
            
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [backgroundAnimation, canvasSize, animationSpeed]);

// --- AUTO-CENTER FIX ---
    // This snaps the camera to the center whenever you change zones or load a map
    useEffect(() => {
        if (mapSize && mapSize.width > 0) {
            handleCenterView();
        }
    }, [activeZoneId, zid, mapGenType]);

    // --- JSX (UI) ---
    return (
        <>
            <StyleInjector />
            <CDNScriptLoader />
            <div className="fixed inset-0 bg-black/80 flex flex-col p-2 sm:p-4">
                {/* --- NEW POPUP WINDOW --- */}
                {activeModule && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-10">
                        <div className="relative w-full max-w-5xl h-full max-h-[85vh] glass-panel shadow-2xl rounded-xl flex flex-col animate-in fade-in zoom-in duration-200">
                             <button 
                                onClick={() => dispatch({ type: 'CLOSE_MODULE' })} 
                                // UPDATED CLASSES:
                                // z-[200]: Ensures it sits way above the iframe content.
                                // p-4: Larger hit area (easier for thumbs).
                                // active:scale-90: shrinking effect gives visual confirmation you clicked it.
                                // shadow-xl: Pops it off the screen visually.
                                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[200] p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-xl border-2 border-white/20 active:scale-90 transition-all"
                                aria-label="Close Module"
                            >
                                <X size={24} strokeWidth={3} />
                            </button>
                            <ModuleRenderer moduleId={activeModule.moduleId} onClose={() => dispatch({ type: 'CLOSE_MODULE' })} />
                        </div>
                    </div>
                )}
                {toastMessage && (
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-teal-600/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300">
                        {toastMessage}
                    </div>
                )}
                {isBatchModalOpen && <BatchCreateModal setIsOpen={setIsBatchModalOpen} showToast={showToast} />}
                {selectedObject && (
                    <AssetEditor 
                        object={selectedObject} 
                        onSave={handleSaveAsset} 
                        onClose={() => setSelectedObject(null)} 
                    />
                )}
                <div className="w-full h-full glass-panel rounded-lg flex flex-col">
                    {/* --- THE HEADER HIDER: Only shows when NOT playing --- */}
                    {!isPlayMode && (
                        <div className="flex-shrink-0 flex justify-between items-center p-3 border-b border-[var(--shadow-dark-grey)]">
                            <h2 className="font-cinzel text-xl sm:text-2xl">Map Editor</h2>
                            <ZoneSelector />
                            <div className="flex items-center gap-2">
                               <GlassButton onClick={undo} disabled={historyIndex < 0} className="p-2"><Undo size={16} /></GlassButton>
                               <GlassButton onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2"><Redo size={16} /></GlassButton>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-1 min-h-0">
                {/* MAP EDITOR RESPONSIVE DRAWER */}
                <div className={`fixed md:relative z-[50] md:z-auto transition-all duration-300 ease-in-out bg-[#0c101d] 
                    ${(isPanelCollapsed || isPlayMode) ? 'w-0 -translate-x-full md:w-0' : 'w-full md:w-64 translate-x-0'} 
                    flex-shrink-0 flex flex-col border-r border-[var(--shadow-dark-grey)] h-full overflow-hidden shadow-2xl md:shadow-none`}
                >
                    {/* MOBILE-ONLY CLOSE TAB */}
                    <div className="md:hidden p-4 flex justify-end border-b border-cyan-900/30">
                        <button 
                            onClick={() => setIsPanelCollapsed(true)} 
                            className="p-2 bg-red-900/20 border border-red-500/40 text-red-400 rounded-full"
                        >
                            ✕
                        </button>
                    </div>

                    {/* TOOLBAR HEADER */}
                    <div className="p-4 border-b border-[var(--shadow-dark-grey)] bg-[#1a1f2e]">
                        <h3 className="text-xs font-cinzel text-cyan-400 tracking-widest uppercase">Terrain Palette</h3>
                    </div>
                            <div className={`flex-grow overflow-y-auto custom-scrollbar p-2 min-h-0 ${isPanelCollapsed ? 'hidden' : ''}`}>
                                {/* --- NEW COMBINED ID & SETTINGS PANEL --- */}
                    <div className="p-1 rounded-md accordion-item-bg">
                        <Accordion title="Zone ID & Settings" isOpen={openAccordions['id']} onToggle={() => toggleAccordion('id')}>
                            <div className="space-y-2">
                                {/* ID Inputs */}
                                <input type="text" placeholder="ZID (e.g., Z01)" value={zid} onChange={(e) => setField('zid', e.target.value)} className="editor-input" />
                                <input type="text" placeholder="Zone Name" value={zoneName} onChange={(e) => setField('zoneName', e.target.value)} className="editor-input" />
                                <select value={biome} onChange={(e) => setField('biome', e.target.value)} className="editor-select">
                                    {BIOME_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>

                                {/* Config Inputs */}
                                <div className="border-t border-gray-700 pt-2 mt-1">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase">Lvl</label>
                                            <input type="number" value={zoneLevel} onChange={e => setField('zoneLevel', parseInt(e.target.value))} className="editor-input" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase">Type</label>
                                            <select value={zoneType} onChange={e => setField('zoneType', e.target.value)} className="editor-select">
                                                <option value="Physical">Physical</option>
                                                <option value="Gold">Gold</option>
                                                <option value="Gem">Gem</option>
                                                <option value="Shadow">Shadow</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2 bg-black/20 p-1 rounded border border-gray-800">
    <input 
        type="checkbox" 
        checked={allowRoamingCombat} 
        onChange={(e) => setField('allowRoamingCombat', e.target.checked)}
        className="rounded bg-gray-800 border-gray-600 text-teal-500 focus:ring-0 w-3 h-3"
    />
    <span className="text-[10px] text-gray-300">Allow Roaming Combat</span>
</div>
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            type="number" 
                                            value={mobGenCount} 
                                            onChange={(e) => setMobGenCount(parseInt(e.target.value))}
                                            className="editor-input w-12 text-center"
                                        />
                                        <GlassButton onClick={() => generateZoneMobs(mobGenCount)} className="flex-1 bg-red-900/40 border-red-500/60 text-xs">
                                            <Sparkles size={12} className="mr-1"/> Generate
                                        </GlassButton>
                                    </div>
                                    {/* --- NEW IMPORT SECTION --- */}
                                    <div className="border-t border-gray-800 pt-2 mt-2">
                                        <button 
                                            onClick={() => setShowImport(!showImport)} 
                                            className="text-[10px] text-teal-400 hover:text-teal-300 underline w-full text-center mb-1"
                                        >
                                            {showImport ? "Cancel Import" : "Paste Existing Roster Data"}
                                        </button>

                                        {showImport && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <textarea
                                                    value={importText}
                                                    onChange={(e) => setImportText(e.target.value)}
                                                    placeholder='Paste JSON here... e.g. [{"name":"Goblin", "hp":50}, {"name":"Wolf", "hp":30}]'
                                                    className="w-full h-24 bg-black/40 border border-gray-700 rounded text-[10px] text-gray-300 p-1 font-mono resize-none focus:border-teal-500 focus:outline-none"
                                                />
                                                <GlassButton onClick={handleImportRoster} className="w-full bg-teal-900/40 border-teal-500/60 text-xs">
                                                    Load Data
                                                </GlassButton>
                                            </div>
                                        )}
                                    </div>
                                    {/* -------------------------- */}

                                    {/* Mob Preview List */}
                                    {zoneMobs.length > 0 && (
                                        <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1 bg-black/20 p-1 rounded border border-gray-800">
                                            {zoneMobs.map((mob, idx) => (
                                                <div key={mob.id} className="text-[10px] text-gray-400 flex justify-between items-center p-1 hover:bg-white/5 rounded">
                                                    <input type="text" value={mob.name} onChange={e => updateMob(idx, 'name', e.target.value)} className="bg-transparent border-none p-0 w-24 focus:ring-0 text-gray-300" />
                                                    <span className="text-red-400">HP:{mob.hp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Accordion>
                    </div>

                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                    <Accordion title="Tools" isOpen={openAccordions.tools} onToggle={() => toggleAccordion('tools')}>
                                        <div className="grid grid-cols-2 gap-2">
                                            <GlassButton onClick={toggleTestMode} isActive={isTestMode} className="col-span-2 bg-green-900/50 border-green-500/80">
                                                <Gamepad2 size={14} className="mr-1"/> Editor Test
                                            </GlassButton>
                                            <GlassButton 
                                                onClick={launchPlayerUI} 
                                                className="col-span-2 bg-cyan-900/40 border-cyan-500/50 text-cyan-400 font-bold tracking-widest"
                                            >
                                                <User size={14} className="mr-1"/> LAUNCH PLAYER UI
                                            </GlassButton>
                                            <GlassButton onClick={() => setField('currentTool', 'place')} isActive={currentTool === 'place'} disabled={isTestMode} title="Paint / Place Asset"><Brush size={14} /></GlassButton>
                                            <GlassButton onClick={() => setField('currentTool', 'erase')} isActive={currentTool === 'erase'} disabled={isTestMode} title="Erase Hex / Asset"><Eraser size={14} /></GlassButton>
                                            <GlassButton onClick={() => setField('currentTool', 'select')} isActive={currentTool === 'select'} disabled={isTestMode} title="Select / Inspect Hex"><MousePointer size={14} /></GlassButton>
                                            <GlassButton onClick={() => setField('currentTool', 'stamp')} isActive={currentTool === 'stamp'} disabled={isTestMode} title="Stamp Tool"><Stamp size={14} /></GlassButton>
                                            <GlassButton onClick={() => setField('currentTool', 'path')} isActive={currentTool === 'path'} disabled={isTestMode || !activeLayer || activeLayer.type !== 'navigation'} title="Pathing Layer Tool"><Footprints size={14} /></GlassButton>
                                            <GlassButton onClick={() => setField('currentTool', 'spawn')} isActive={currentTool === 'spawn'} disabled={isTestMode} title="Spawn Point Tool"><MapPin size={14} /></GlassButton>
                                            <GlassButton onClick={() => setField('currentTool', 'eyedropper')} isActive={currentTool === 'eyedropper'} disabled={isTestMode} title="Eyedropper / Color Sampler"><Pipette size={14} /></GlassButton>
                                            {/* --- MANUAL COMBAT BRUSH --- */}
                                            <GlassButton 
                                                onClick={() => setField('currentTool', 'combat')} 
                                                isActive={currentTool === 'combat'} 
                                                disabled={isTestMode} 
                                                title="Monster Paint Brush"
                                            >
                                                <Sword size={14} />
                                            </GlassButton>

                                            {/* ZONE SELECTOR: This appears when the Sword is active so you can pick which monsters to paint */}
                                            {currentTool === 'combat' && (
                                                <div className="absolute left-16 bg-black/80 border border-cyan-500/30 p-2 rounded-lg backdrop-blur-md z-50 shadow-2xl">
                                                    <label className="text-[8px] text-cyan-500 block mb-1 font-bold tracking-tighter uppercase">Roster Selection</label>
                                                    <select 
                                                        value={paintZoneId} 
                                                        onChange={(e) => setField('paintZoneId', e.target.value)}
                                                        className="editor-select text-[10px] bg-cyan-950/20 text-cyan-400 border-none outline-none custom-scrollbar max-h-40"
                                                    >
                                                        {Object.values(masterData.zones).map(z => (
                                                            <option key={z.id} value={z.id} className="bg-slate-900">
                                                                {z.id}: {z.zoneName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            {/* --- ONE-CLICK PORTAL TOOL --- */}
                                            <GlassButton 
                                                onClick={autoPopulateEntrances}
                                                className="bg-cyan-900/40 border-cyan-500/50 text-cyan-400"
                                                title="Magic Portal Placement"
                                            >
                                                <Wand2 size={14} />
                                            </GlassButton>
                                        </div>
                                    </Accordion>
                                </div>

                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                    <Accordion title="Brush" isOpen={openAccordions.brush} onToggle={() => toggleAccordion('brush')}>
                                        <div className="space-y-3">
                                            <div> <label className="text-xs text-gray-400">Size: {brushSize}</label> <input type="range" min="1" max="9" step="2" value={brushSize} onChange={(e) => setField('brushSize', parseInt(e.target.value))} className="w-full" /> </div>
                                            <div className="flex gap-2"> <GlassButton onClick={() => setField('brushShape', 'square')} isActive={brushShape === 'square'}><Square size={14} /></GlassButton> <GlassButton onClick={() => setField('brushShape', 'circle')} isActive={brushShape === 'circle'}><Circle size={14} /></GlassButton> </div>
                                        </div>
                                    </Accordion>
                                    {/* --- ENTITIES & NPCS MENU --- */}
<Accordion title="Entities & NPCs" isOpen={true} onToggle={() => {}}>
    <div className="space-y-3 p-1">
        
        {/* 1. TOOL BUTTONS */}
        <div className="flex gap-2 mb-2">
            <GlassButton 
                onClick={() => setField('currentTool', 'enemy')} 
                isActive={currentTool === 'enemy'}
                title="Place Enemies"
            >
                <div className="flex flex-col items-center gap-1">
                    <Skull size={16} className="text-red-400" />
                    <span className="text-[10px]">Enemy</span>
                </div>
            </GlassButton>

            <GlassButton 
                onClick={() => setField('currentTool', 'loot')} 
                isActive={currentTool === 'loot'}
                title="Place Loot"
            >
                <div className="flex flex-col items-center gap-1">
                    <Coins size={16} className="text-yellow-400" />
                    <span className="text-[10px]">Loot</span>
                </div>
            </GlassButton>

            <GlassButton 
                onClick={() => setField('currentTool', 'interact')} 
                isActive={currentTool === 'interact'}
                title="Play Mode"
            >
                <div className="flex flex-col items-center gap-1">
                    <Sword size={16} className="text-cyan-400" />
                    <span className="text-[10px]">Play</span>
                </div>
            </GlassButton>
        </div>

        {/* 2. ENEMY DROPDOWN */}
        {currentTool === 'enemy' && (
            <div className="animate-in fade-in duration-300">
                <label className="text-[10px] text-gray-400 uppercase font-bold">Select Monster</label>
                <select 
                    className="w-full bg-black/50 text-white text-xs p-2 rounded border border-gray-600 outline-none focus:border-red-500 mt-1"
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    value={selectedEntityId}
                >
                    <option value="">-- Generic Enemy --</option>
                    {Object.keys(bestiary).map(key => (
                        <option key={key} value={key}>
                            [{bestiary[key].tier}] {bestiary[key].name}
                        </option>
                    ))}
                </select>
            </div>
        )}

        {/* 3. LOOT DROPDOWN */}
        {currentTool === 'loot' && (
            <div className="animate-in fade-in duration-300">
                <label className="text-[10px] text-gray-400 uppercase font-bold">Select Item</label>
                <select 
                    className="w-full bg-black/50 text-white text-xs p-2 rounded border border-gray-600 outline-none focus:border-yellow-500 mt-1"
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    value={selectedEntityId}
                >
                    <option value="">-- Generic Loot --</option>
                    {Object.keys(items).map(key => (
                        <option key={key} value={key}>
                            {items[key].name} ({items[key].rarity})
                        </option>
                    ))}
                </select>
            </div>
        )}
    </div>
</Accordion>


                                </div>
                                
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                    <Accordion title="Layers" isOpen={openAccordions.layers} onToggle={() => toggleAccordion('layers')}> <LayersPanel /> </Accordion>
                                </div>
                                
                                {activeLayer?.type === 'trigger' ? <TriggerPanel /> : (selectedTile || selectedRegion) && <PropertiesPanel />}
                                <SpawnPointPanel />
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
<Accordion title="World Search" isOpen={openAccordions.search} onToggle={() => toggleAccordion('search')}>
    <div className="space-y-2 p-1">
        <div className="flex gap-1 mb-2">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="Search name or [x,y]..." 
                    value={worldSearchQuery}
                    onChange={(e) => setWorldSearchQuery(e.target.value)}
                    className="editor-input pl-7 border-teal-500/30 h-8"
                />
                <div className="absolute left-2 top-2 text-teal-500/50"><MousePointer size={12}/></div>
            </div>
            <button 
                onClick={() => setGroupWorldSearch(!groupWorldSearch)}
                className={`p-1.5 rounded border transition-all ${groupWorldSearch ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' : 'bg-black/40 border-gray-700 text-gray-500'}`}
                title="Toggle Grouping"
            >
                <Layers size={14} />
            </button>
            <button onClick={exportSearchToCSV} className="p-1.5 rounded border bg-black/40 border-gray-700 text-gray-400 hover:text-teal-300" title="Export to CSV">
                <Download size={14} />
            </button>
        </div>

        <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2 bg-black/30 p-1 rounded border border-gray-800">
            {(() => {
                const query = worldSearchQuery.trim().toLowerCase();
                if (query.length < 2) return <div className="text-[9px] text-center text-gray-600 py-4 italic">Type 2+ characters to search...</div>;

                const items = [];
                const searchLayers = layers.filter(l => l.type === 'visual' || l.type === 'trigger');

                for (const layer of searchLayers) {
                    for (let y = 0; y < layer.grid.length; y++) {
                        const row = layer.grid[y];
                        for (let x = 0; x < row.length; x++) {
                            const tile = row[x];
                            if (!tile || (!tile.assetId && !tile.eventId)) continue;

                            const eventId = tile.eventId ? tile.eventId.toLowerCase() : "";
                            const asset = assetLibrary[tile.assetId];
                            const assetName = asset?.name?.toLowerCase() || "";
                            const assetType = asset?.type?.toLowerCase() || "";
                            const coords = `${x},${y}`;

                            if (eventId.includes(query) || assetName.includes(query) || assetType.includes(query) || coords.includes(query)) {
                                items.push({ tile, x, y, layerId: layer.id });
                            }
                            if (items.length >= 100) break; // PERFORMANCE BREAK
                        }
                        if (items.length >= 100) break;
                    }
                    if (items.length >= 100) break;
                }

                if (items.length === 0) return <div className="text-[9px] text-center text-gray-600 py-4 italic">No matches found.</div>;

                if (!groupWorldSearch) {
                    return items.map((item, i) => {
                        const label = item.tile.eventId || assetLibrary[item.tile.assetId]?.name || `Object @ ${item.x},${item.y}`;
                        return (
                            <button key={i} onClick={() => useMapStore.getState().snapToCoord(item.x, item.y)} className="w-full text-left text-[10px] p-1.5 hover:bg-teal-500/20 text-teal-300 border-b border-white/5 flex justify-between items-center group">
                                <span className="truncate flex-1"><span className="text-gray-500 mr-1">[{item.x},{item.y}]</span> {label}</span>
                                <span className="text-[9px] opacity-0 group-hover:opacity-100 text-gray-500 uppercase">Jump ⚡</span>
                            </button>
                        );
                    });
                }

                const groups = items.reduce((acc, item) => {
                    const cat = item.tile.eventId ? "Portals" : (assetLibrary[item.tile.assetId]?.type || "Environment");
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(item);
                    return acc;
                }, {});

                return Object.entries(groups).map(([category, catItems]) => (
                    <div key={category} className="space-y-1">
                        <div className="text-[9px] text-gray-500 uppercase font-bold px-1 py-1 bg-white/5 flex justify-between">
                            <span>{category}</span>
                            <span>{catItems.length}</span>
                        </div>
                        {catItems.map((item, i) => {
                            const label = item.tile.eventId || assetLibrary[item.tile.assetId]?.name || "Unknown Object";
                            return (
                                <button key={i} onClick={() => useMapStore.getState().snapToCoord(item.x, item.y)} className="w-full text-left text-[10px] p-1.5 hover:bg-teal-500/20 text-teal-300 border-b border-white/5 flex justify-between items-center group ml-1">
                                    <span className="truncate flex-1"><span className="text-gray-500 mr-1">[{item.x},{item.y}]</span> {label}</span>
                                    <span className="text-[9px] opacity-0 group-hover:opacity-100 text-gray-500 uppercase">Jump ⚡</span>
                                </button>
                            );
                        })}
                    </div>
                ));
            })()}
        </div>
    </div>
</Accordion>
                                </div>
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                    <Accordion title="Docked Navigator" isOpen={isMmDocked} onToggle={() => setIsMmDocked(!isMmDocked)}>
                                        <div className="p-1">
                                            <MiniMap 
                                                canvasSize={canvasSize} 
                                                isDocked={true} 
                                                setDocked={setIsMmDocked} 
                                                isLarge={isMmLarge} 
                                                setLarge={setIsMmLarge} 
                                            />
                                        </div>
                                    </Accordion>
                                </div>
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                <Accordion title="View & Grid" isOpen={openAccordions.view} onToggle={() => toggleAccordion('view')}>
                                    <div className="space-y-2">
                                        <div className="flex gap-2"><GlassButton onClick={() => setField('view', 'topDown')} isActive={view === 'topDown'}><Eye size={14} /></GlassButton><GlassButton onClick={() => setField('view', 'isometric')} isActive={view === 'isometric'}><RefreshCcw size={14} /></GlassButton></div>
                                        <div className="flex gap-2"><GlassButton onClick={() => setField('tileType', 'square')} isActive={tileType === 'square'}><Square size={14} /></GlassButton><GlassButton onClick={() => setField('tileType', 'hex')} isActive={tileType === 'hex'}><Hexagon size={14} /></GlassButton></div>
                                        <input type="range" min="0" max="1" step="0.05" value={tileOpacity} onChange={(e) => setField('tileOpacity', parseFloat(e.target.value))} className="w-full" />
                                        <GlassButton onClick={() => setField('isEditingLayout', !isEditingLayout)} isActive={isEditingLayout}><Pencil size={14} />Layout</GlassButton>
                                        <GlassButton onClick={() => setField('areTilesColorless', !areTilesColorless)} isActive={areTilesColorless}><Droplet size={14} />Color</GlassButton>
                                        <GlassButton onClick={handleCenterView}><Focus size={14} />Center</GlassButton>
                                    </div>
                                </Accordion>
                                </div>
                                
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                <Accordion title="Initial View" isOpen={openAccordions.initialView} onToggle={() => toggleAccordion('initialView')}>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-400 w-12">Zoom:</label>
                                            <input type="number" step="0.1" value={initialView.zoom} onChange={(e) => setField('initialView', { ...initialView, zoom: parseFloat(e.target.value) })} className="editor-input" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-400 w-12">Center:</label>
                                            <input type="number" value={initialView.center.x} onChange={(e) => setField('initialView', { ...initialView, center: { ...initialView.center, x: parseInt(e.target.value) } })} className="editor-input" placeholder="X" />
                                            <input type="number" value={initialView.center.y} onChange={(e) => setField('initialView', { ...initialView, center: { ...initialView.center, y: parseInt(e.target.value) } })} className="editor-input" placeholder="Y" />
                                        </div>
                                        <GlassButton onClick={handleSetInitialView}><Camera size={14} className="mr-1" />Set</GlassButton>
                                    </div>
                                </Accordion>
                                </div>

                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                <Accordion title="Generation" isOpen={openAccordions.gen} onToggle={() => toggleAccordion('gen')}>
                                    <div className="flex flex-col gap-2">
                                        <GlassButton onClick={() => handleGenMap('blank')} isActive={mapGenType === 'blank'}><File size={14} />Blank</GlassButton>
                                        <GlassButton onClick={() => handleGenMap('continent')} isActive={mapGenType === 'continent'}><Globe size={14} />Continent</GlassButton>
                                        <GlassButton onClick={() => handleGenMap('floatingIslands')} isActive={mapGenType === 'floatingIslands'}><LayoutGrid size={14} />Islands</GlassButton>
                                        <GlassButton onClick={() => handleGenMap('caverns')} isActive={mapGenType === 'caverns'}><Route size={14} />Caverns</GlassButton>
                                        <GlassButton onClick={() => handleGenMap('maze')} isActive={mapGenType === 'maze'}><Torus size={14} />Maze</GlassButton>
                                        <GlassButton onClick={() => handleGenMap('irregularMaze')} isActive={mapGenType === 'irregularMaze'}><GitMerge size={14} />Irregular</GlassButton>
                                        <GlassButton onClick={() => handleGenMap('roomsAndCorridors')} isActive={mapGenType === 'roomsAndCorridors'}><Building2 size={14} />Rooms</GlassButton>
                                        <GlassButton onClick={rerollPlacements}><Repeat size={14} />Re-roll Placements</GlassButton>
                                        <GlassButton onClick={handleGenFromImage} disabled={!backgroundImage}><ImageIcon size={14} />From Img</GlassButton>
                                        <button 
                                            onClick={handleConvergenceSampling}
                                            className="w-full mt-2 py-2 bg-purple-900/40 border border-purple-400/50 text-purple-100 text-[10px] uppercase font-black hover:bg-purple-500 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>✨</span> Convergence Sampler (50x50)
                                        </button>
                                    </div>
                                </Accordion>
                                </div>

                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                <Accordion title="Map Size" isOpen={openAccordions.size} onToggle={() => toggleAccordion('size')}>
                                    <div className="flex gap-2"><input type="number" value={mapSize.width} onChange={(e) => resizeMap(Number(e.target.value), mapSize.height)} className="editor-input" placeholder="W" /><input type="number" value={mapSize.height} onChange={(e) => resizeMap(mapSize.width, Number(e.target.value))} className="editor-input" placeholder="H" /></div>
                                </Accordion>
                                </div>
                                
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                <Accordion title="Prefabs" isOpen={openAccordions.prefabs} onToggle={() => toggleAccordion('prefabs')}>
                                    <div className="grid grid-cols-1 gap-1">
                                        {Object.keys(prefabs).map(prefabName => ( <GlassButton key={prefabName} onClick={() => { setField('currentTool', 'place'); setField('selectedAsset', `prefab:${prefabName}`); }} isActive={selectedAsset === `prefab:${prefabName}`}> <span className="capitalize text-xs truncate">{prefabName}</span> </GlassButton> ))}
                                        {Object.keys(prefabs).length === 0 && <p className="text-xs text-gray-500 col-span-1 text-center">No prefabs saved.</p>}
                                    </div>
                                </Accordion>
                                </div>

                                {activeLayer?.type === 'visual' && (
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                    <Accordion title="Assets" isOpen={openAccordions.assets} onToggle={() => toggleAccordion('assets')}>
                                        {Object.entries(assetCategoryOrder).map(([mainCategory, subCategories]) => (
                                            <div key={mainCategory} className="p-1 rounded-md accordion-item-bg mt-1">
                                            <Accordion title={mainCategory} isOpen={!!openAssetTypes[mainCategory]} onToggle={() => toggleAssetTypeAccordion(mainCategory)} isSub={true}>
                                                {subCategories.length > 0 ? (
                                                    subCategories.map(subCategory => {
                                                        const assetsOfType = Object.entries(assetLibrary).filter(([, asset]) => asset.type === subCategory);
                                                        if (assetsOfType.length === 0) return null;
                                                        return (
                                                            <div key={subCategory} className="p-1 rounded-md accordion-item-bg mt-1">
                                                            <Accordion title={subCategory} isOpen={!!openAssetTypes[subCategory]} onToggle={() => toggleAssetTypeAccordion(subCategory)} isSub={true}>
                                                                <div className="grid grid-cols-1 gap-1">
                                                                    {assetsOfType.map(([key, asset]) => (
                                                                        <GlassButton key={key} onClick={() => { setField('currentTool', 'place'); setField('selectedAsset', selectedAsset === key ? null : key); }} isActive={selectedAsset === key}>
                                                                            <span className="capitalize text-xs truncate">{asset.name}</span>
                                                                        </GlassButton>
                                                                    ))}
                                                                </div>
                                                            </Accordion>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    (() => {
                                                        const assetsOfType = Object.entries(assetLibrary).filter(([, asset]) => asset.type === mainCategory);
                                                        return (
                                                            <div className="grid grid-cols-1 gap-1 pt-2">
                                                                {assetsOfType.map(([key, asset]) => (
                                                                    <GlassButton key={key} onClick={() => { setField('currentTool', 'place'); setField('selectedAsset', selectedAsset === key ? null : key); }} isActive={selectedAsset === key}>
                                                                        <span className="capitalize text-xs truncate">{asset.name}</span>
                                                                    </GlassButton>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </Accordion>
                                            </div>
                                        ))}
                                    </Accordion>
                                </div>
                                )}

                                {selectedAsset && assetLibrary[selectedAsset] && assetLibrary[selectedAsset]?.type !== 'Terrain' && (
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                    <Accordion title="Customize" isOpen={openAccordions.customize} onToggle={() => toggleAccordion('customize')}>
                                        <div className="space-y-2 mt-1">
                                            <input type="text" value={assetLibrary[selectedAsset].imageUrl || ''} onChange={(e) => updateAssetProperties(selectedAsset, { imageUrl: e.target.value })} className="editor-input" placeholder="Image URL..." />
                                            <div>
                                                <label className="text-xs text-gray-400">Scale: {assetLibrary[selectedAsset].scale.toFixed(2)}</label>
                                                <input type="range" min="0.25" max="3" step="0.05" value={assetLibrary[selectedAsset].scale} onChange={(e) => updateAssetProperties(selectedAsset, { scale: parseFloat(e.target.value) })} className="w-full" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">Y-Offset: {assetLibrary[selectedAsset].yOffset}</label>
                                                <input type="range" min="-50" max="50" step="1" value={assetLibrary[selectedAsset].yOffset} onChange={(e) => updateAssetProperties(selectedAsset, { yOffset: parseInt(e.target.value) })} className="w-full" />
                                            </div>
                                        </div>
                                    </Accordion>
                                </div>
                                )}
                                
                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                <Accordion title="Background" isOpen={openAccordions.background} onToggle={() => toggleAccordion('background')}>
                                    <div className="flex flex-col gap-2">
                                        {/* API KEY INPUT */}
                                    <div className="bg-red-900/20 border border-red-500/30 p-2 rounded mb-2">
                                        <label className="text-[10px] text-red-300 uppercase font-bold tracking-wider mb-1 block">Gemini API Key</label>
                                        <input 
                                            type="password" 
                                            value={useMapStore(state => state.apiKey)} 
                                            onChange={(e) => {
                                                setField('apiKey', e.target.value);
                                                // SAVES TO BROWSER MEMORY HERE:
                                                localStorage.setItem('geminus_api_key', e.target.value); 
                                            }} 
                                            className="editor-input border-red-500/50 text-white" 
                                            placeholder="Paste Key Here..." 
                                        />
                                    </div>
                                        <input type="text" placeholder="Image URL" value={imageBackgroundUrl} onChange={(e) => setField('imageBackgroundUrl', e.target.value)} className="editor-input" />
                                        <GlassButton onClick={() => handleImageLoad(imageBackgroundUrl)}>Apply</GlassButton>
                                        
                                        <div className="pt-2 border-t border-gray-700 space-y-2">
                                            <select value={aiStyle} onChange={e => setField('aiStyle', e.target.value)} className="editor-select">
                                                <option>Photorealistic</option>
                                                <option>Fantasy Painting</option>
                                                <option>Pixel Art</option>
                                                <option>Anime</option>
                                                <option>Technical Blueprint</option>
                                            </select>
                                            <select value={aiMood} onChange={e => setField('aiMood', e.target.value)} className="editor-select">
                                                <option>Vibrant</option>
                                                <option>Eerie</option>
                                                <option>Mystical</option>
                                                <option>Grimdark</option>
                                                <option>Serene</option>
                                            </select>
                                            <input type="text" value={aiKeywords} onChange={e => setField('aiKeywords', e.target.value)} className="editor-input" placeholder="Custom keywords..."/>
                                            <textarea value={constructedAiPrompt} rows="3" className="editor-textarea" readOnly />
                                        </div>
                                        
                                        <GlassButton onClick={handleAIGenerateBackground} disabled={isGenerating || !constructedAiPrompt.trim()} className="bg-purple-900/50 border-purple-500/80"><Sparkles size={14} />{isGenerating ? '...' : 'Generate'}</GlassButton>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700">
                                            <GlassButton onClick={fitBackgroundToGrid} disabled={!backgroundImageData}><Crop size={14} /></GlassButton>
                                            <GlassButton onClick={revertBackgroundCrop} disabled={!originalBackgroundImageData || backgroundImageData === originalBackgroundImageData}><RefreshCw size={14} /></GlassButton>
                                        </div>
                                        {aiGenError && <p className="text-red-400 text-xs mt-2 text-center">{aiGenError}</p>}
                                        
                                        <div className="pt-2 border-t border-gray-700 space-y-2">
                                            <label className="text-xs text-gray-400">Animation</label>
                                            <select value={backgroundAnimation} onChange={e => setField('backgroundAnimation', e.target.value)} className="editor-select">
                                                <option value="none">None</option>
                                                <option value="gleamingCrystals">Gleaming Crystals</option>
                                                <option value="fallingLeaves">Falling Leaves</option>
                                                <option value="swirlingSand">Swirling Sand</option>
                                                <option value="gentleSnowfall">Gentle Snowfall</option>
                                                <option value="floatingEmbers">Floating Embers</option>
                                                <option value="mysticalWisps">Mystical Wisps</option>
                                                <option value="celestialShimmer">Celestial Shimmer</option>
                                            </select>
                                            <div>
                                                <label className="text-xs text-gray-400">Speed: {animationSpeed.toFixed(1)}x</label>
                                                <input type="range" min="0.1" max="5" step="0.1" value={animationSpeed} onChange={(e) => setField('animationSpeed', parseFloat(e.target.value))} className="w-full" disabled={backgroundAnimation === 'none'} />
                                            </div>
                                        </div>
                                    </div>
                                </Accordion>
                                </div>

                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                <Accordion title="Zone Templates" isOpen={openAccordions.templates} onToggle={() => toggleAccordion('templates')}>
                                    <TemplateManagerPanel />
                                </Accordion>
                                </div>

                                <div className="p-1 rounded-md accordion-item-bg mt-1">
                                <Accordion title="Data" isOpen={openAccordions.data} onToggle={() => toggleAccordion('data')}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <GlassButton onClick={handleExport}><Download size={14} />Export Current</GlassButton>
                                        <GlassButton onClick={handleExportAll}><FolderArchive size={14} />Export All</GlassButton>
                                        <button 
                                            onClick={handleQuickCreateZone}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/40 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all text-[10px] font-bold uppercase tracking-wider rounded"
                                        >
                                            <PlusCircle size={14} /> New Zone
                                        </button>
                                        <GlassButton onClick={() => fileInputRef.current?.click()} className="col-span-2"><Upload size={14} />Import .zip/.json</GlassButton>
                                        <GlassButton onClick={() => setIsBatchModalOpen(true)} className="col-span-2"><FileArchive size={14} />Batch Create</GlassButton>
                                        <GlassButton onClick={handleBatchResize} className="col-span-2"><Crop size={14} />Resize All (15x15)</GlassButton>
                                        <div className="col-span-2 flex gap-2">
                                            <GlassButton onClick={handleReset} className="bg-red-900/30 border-red-500/40"><RotateCcw size={14} /> Wipe Map</GlassButton>
                                            <GlassButton onClick={handleDeleteZone} className="bg-red-600/50 border-red-400/50"><Trash2 size={14} /> Delete Zone</GlassButton>
                                        </div>
                                    </div>
                                </Accordion>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-w-0 relative">
                            {/* FLOATING MOBILE TOGGLE - Only visible on small screens */}
                            <button 
                            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                            className="md:hidden fixed top-24 left-4 z-[60] p-3 bg-cyan-600/80 backdrop-blur-sm text-white rounded-full shadow-lg border border-cyan-400/50 active:scale-95 transition-all"
                            >
                            <MapIcon size={20} />
                            </button>                
                            <button onClick={() => setIsPanelCollapsed(!isPanelCollapsed)} className="absolute top-2 left-2 z-10 glass-button p-2 rounded-full">{isPanelCollapsed ? <PanelRight size={18} /> : <PanelLeft size={18} />}</button>
                            <div ref={canvasContainerRef} className="flex-1 w-full h-full bg-black/20 rounded-b-lg overflow-hidden touch-none relative">
                                <canvas ref={canvasRef} className="w-full h-full absolute top-0 left-0" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => setMouseCoords({x:-1, y:-1})} onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />
                                <canvas ref={animationCanvasRef} className="w-full h-full absolute top-0 left-0 pointer-events-none" />
                            </div>
                           {/* --- MAGI-TECH: Minimap Navigator --- */}
                            {!isMmDocked && (
                                <MiniMap 
                                    canvasSize={canvasSize} 
                                    isDocked={isMmDocked} 
                                    setDocked={setIsMmDocked} 
                                    isLarge={isMmLarge} 
                                    setLarge={setIsMmLarge} 
                                />
                            )}
                            {/* FLOATING PLAY MODE TOGGLE */}
                            <button 
                                onClick={togglePlayMode}
                                className={`fixed top-4 right-4 z-[100] px-4 py-2 rounded-full font-cinzel text-xs tracking-widest shadow-2xl border-2 transition-all active:scale-95 ${
                                    isPlayMode 
                                    ? 'bg-red-600/80 border-white/40 text-white' 
                                    : 'bg-green-600/80 border-white/40 text-white'
                                }`}
                            >
                                {isPlayMode ? "EXIT PLAY MODE" : "ENTER PLAY MODE"}
                            </button>
                        {/* --- CONSOLIDATED TARGET SELECTION --- */}
        {pendingEncounter && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-md">
                <div className="glass-panel p-6 rounded-xl border-2 border-teal-500/50 max-w-sm w-full shadow-2xl">
                    <h3 className="font-cinzel text-xl text-teal-400 mb-2 text-center">Select Target</h3>
                    <p className="text-[9px] text-teal-500/60 uppercase tracking-widest text-center mb-4">Hex: [{pendingEncounter.x}, {pendingEncounter.y}]</p>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block border-b border-gray-800 pb-1">Players on Hex</label>
                            <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                                {pendingEncounter.targets.map(target => (
                                    <button 
                                        key={target.id}
                                        onClick={() => {
                                            setActiveBattleMob(target.id);
                                            setField('pendingEncounter', null);
                                            setShowCombat(true);
                                        }}
                                        className="w-full p-3 bg-red-900/20 hover:bg-red-600/40 border border-red-500/30 rounded text-left transition-all flex justify-between items-center group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-red-100 group-hover:text-white">{target.name}</span>
                                            <span className="text-[9px] text-red-400/70 uppercase tracking-tighter">Lvl {target.lvl} Challenger</span>
                                        </div>
                                        <Sword size={14} className="text-red-500 group-hover:scale-125 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {pendingEncounter.hasEnemies && (
                            <div className="space-y-2 pt-2 border-t border-gray-800">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block pb-1">Environment</label>
                                <button 
                                    onClick={() => {
                                        setField('pendingEncounter', null);
                                        setActiveBattleMob(null); // Clear selection to show full list
                                        setShowCombat(true);
                                    }}
                                    className="w-full p-3 bg-teal-900/20 hover:bg-teal-600/40 border border-teal-500/30 rounded text-left transition-all group flex justify-between items-center"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-teal-100 group-hover:text-white">Zone Mob List</span>
                                        <span className="text-[9px] text-teal-400/70 uppercase tracking-tighter">Attack local enemies</span>
                                    </div>
                                    <Skull size={14} className="text-teal-500 group-hover:scale-125 transition-transform" />
                                </button>
                            </div>
                        )}

                        <button onClick={() => setField('pendingEncounter', null)} className="w-full py-2 text-gray-500 hover:text-white uppercase text-[10px] font-bold tracking-[0.2em] mt-2 transition-colors">
                            [ CANCEL ]
                        </button>
                    </div>
                </div>
            </div>
        )}   
                            <StatusBar mouseCoords={mouseCoords} />
                        </div>
                    </div>
                {/* GLOBAL COMBAT OVERLAY - Sits above everything */}
{/* GLOBAL COMBAT OVERLAY - Sits above everything */}
{showCombat && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="relative w-full max-w-4xl h-[80vh] glass-panel border-2 border-red-500/50 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.3)]">
            <button 
                onClick={() => setShowCombat(false)} 
                className="absolute top-4 right-4 z-[210] p-2 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg active:scale-95 transition-all"
            >
                <X size={20} strokeWidth={3} />
            </button>
            <CombatScreen 
                onClose={() => setShowCombat(false)} 
                initialEnemyId={activeBattleMob} 
                // ADD THIS LINE: Tells CombatScreen which zone we are in
                currentZoneId={zid || activeZoneId} 
            />
        </div>
    </div>
)}
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json,.zip" style={{ display: 'none' }} />

                {/* --- THE CONTENT JIVE OVERLAY --- */}
                {useMapStore(s => s.isTransitioning) && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center transition-all duration-500 animate-in fade-in fill-mode-forwards loading-bridge">
                        <div className="text-center">
                            <div className="loading-spinner mb-4"></div>
                            <h2 className="font-cinzel text-3xl text-teal-400 animate-pulse tracking-widest">
                                {useMapStore.getState().zones[useMapStore.getState().activeZone]?.zoneName || "Traveling..."}
                            </h2>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </>
);
}


// --- Zone Selector Component ---
function ZoneSelector() {
    const { zones, activeZoneId, setActiveZone } = useMapStore();

    // Get all IDs from the store
    const zoneIds = Object.keys(zones).sort();

    if (zoneIds.length === 0) {
        return <span className="text-sm text-gray-500 italic">Materializing World...</span>;
    }

    return (
        <select
            value={activeZoneId || ''}
            onChange={(e) => setActiveZone(e.target.value)}
            className="editor-select max-w-xs bg-black text-cyan-400 border-cyan-900/50"
        >
            {zoneIds.map(zid => {
                const zone = zones[zid];
                // Show zid and name (if name isn't just the zid)
                const displayName = zone.zoneName && zone.zoneName !== zid 
                    ? `${zone.zoneName} (${zid})` 
                    : `Zone ${zid}`;
                    
                return (
                    <option key={zid} value={zid} className="bg-gray-900">
                        {displayName} {zone.isLazy ? '☁️' : '💾'}
                    </option>
                );
            })}
        </select>
    );
}


// --- Layers Panel Component ---
function LayersPanel() {
    const { layers, activeLayerId, addLayer, removeLayer, renameLayer, toggleLayerVisibility, setActiveLayer, moveLayer, setLayerOpacity } = useMapStore();
    const [editingLayerId, setEditingLayerId] = useState(null); const [editingName, setEditingName] = useState(''); 
    const hasNavLayer = layers.some(l => l.type === 'navigation');
    const hasTriggerLayer = layers.some(l => l.type === 'trigger');

    const handleRename = (layer) => { setEditingLayerId(layer.id); setEditingName(layer.name); };
    const handleSaveName = () => { if (editingLayerId && editingName.trim()) { renameLayer(editingLayerId, editingName.trim()); } setEditingLayerId(null); setEditingName(''); };
    
    return (
        <div className="space-y-2">
            <div className="flex justify-end gap-2">
                <GlassButton onClick={() => addLayer('trigger')} disabled={hasTriggerLayer} className="flex-grow-0 p-1"><Zap size={14}/></GlassButton>
                <GlassButton onClick={() => addLayer('navigation')} disabled={hasNavLayer} className="flex-grow-0 p-1"><Footprints size={14}/></GlassButton>
                <GlassButton onClick={() => addLayer('visual')} className="flex-grow-0 p-1"><PlusCircle size={14}/></GlassButton>
            </div>
            <div className="space-y-1">
                {[...layers].reverse().map((layer, index) => (
                    <div key={layer.id} className={`p-1 rounded-md transition-colors ${activeLayerId === layer.id ? 'accordion-item-bg-active' : 'accordion-item-bg'}`}>
                        <div onClick={() => setActiveLayer(layer.id)} className={`flex items-center cursor-pointer`}>
                            {editingLayerId === layer.id ? ( <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="editor-input text-xs flex-1" autoFocus /> ) : ( <span className="text-xs flex-1 truncate">{layer.name}</span> )}
                            <div className="flex items-center gap-1 ml-1">
                                {layer.id !== 'ground' && <button onClick={(e) => { e.stopPropagation(); handleRename(layer);}} className="p-1 hover:text-white"><Edit size={12} /></button>}
                                <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="p-1 hover:text-white">{layer.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                                {layer.id !== 'ground' && <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>}
                                {layer.id !== 'ground' && <div className="flex flex-col"> <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up');}} className="p-0 h-3 hover:text-white disabled:text-gray-600" disabled={index === 0}><ChevronUp size={12}/></button> <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down');}} className="p-0 h-3 hover:text-white disabled:text-gray-600" disabled={layers.length - index -1 === 1}><ChevronDownIcon size={12}/></button> </div>}
                            </div>
                        </div>
                        {layer.type === 'visual' && (
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-gray-400">Op</span>
                                <input type="range" min="0" max="1" step="0.05" value={layer.opacity} onChange={e => setLayerOpacity(layer.id, parseFloat(e.target.value))} className="w-full" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Trigger Panel Component (GDD INTEGRATED) ---
function TriggerPanel() {
    const { triggers, selectedTriggerId, addTrigger, updateTrigger, removeTrigger, setSelectedTriggerId, retrofitTriggers } = useMapStore();
    const selectedTrigger = triggers[selectedTriggerId];

    const handleParamChange = (key, value) => {
        if (!selectedTrigger) return;
        const newParams = { ...selectedTrigger.parameters, [key]: value };
        updateTrigger(selectedTriggerId, { parameters: newParams });
    };

    return (
        <div className="p-1 rounded-md accordion-item-bg mt-1">
        <Accordion title="Triggers & Interactions" isOpen={true} onToggle={() => {}}>
            <div className="space-y-2">
                <div className="flex gap-2">
                    <GlassButton onClick={addTrigger}><PlusCircle size={14} className="mr-1" />New</GlassButton>
                    <GlassButton onClick={retrofitTriggers} className="bg-blue-900/50 border-blue-500/80">
                        <RefreshCw size={14} className="mr-1" /> Scan & Fix
                    </GlassButton>
                    <GlassButton 
                        onClick={() => useMapStore.getState().syncAllPortals()} 
                        className="bg-purple-900/50 border-purple-500/80"
                        title="Update Portal Exit Coordinates"
                    >
                        <GitMerge size={14} className="mr-1" /> Sync Portals
                    </GlassButton>
                </div>
                <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {Object.values(triggers).map(trigger => (
                        <div key={trigger.eventId} onClick={() => setSelectedTriggerId(trigger.eventId)} className={`p-1 rounded-md text-xs cursor-pointer truncate ${selectedTriggerId === trigger.eventId ? 'accordion-item-bg-active' : 'accordion-item-bg'}`}>
                            {trigger.eventId}
                        </div>
                    ))}
                </div>
                {selectedTrigger && (
                    <div className="space-y-2 pt-2 border-t border-gray-700">
                        <div className="flex items-center">
                            <h4 className="font-bold text-xs flex-1 truncate">{selectedTrigger.eventId}</h4>
                            <button onClick={() => removeTrigger(selectedTriggerId)} className="p-1 text-red-400 hover:text-red-200"><Trash2 size={14}/></button>
                        </div>
                        
                        {/* Trigger Condition */}
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Condition</label>
                            <select value={selectedTrigger.condition} onChange={e => updateTrigger(selectedTriggerId, { condition: e.target.value })} className="editor-select">
                                <option value="onInteract">On Player Interact (Click/Tap)</option>
                                <option value="onEnter">On Player Enter (Step On)</option>
                                <option value="onZoneLoad">On Zone Load (Auto)</option>
                            </select>
                        </div>

                        {/* Trigger Action */}
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Action</label>
                            <select value={selectedTrigger.action} onChange={e => updateTrigger(selectedTriggerId, { action: e.target.value, parameters: {} })} className="editor-select">
                                <option value="openModule">Open UI Module</option>
                                <option value="teleport">Teleport Player (Instant)</option>
                                <option value="displayText">Display Text</option>
                                <option value="spawnNpc">Spawn NPC</option>
                                <option value="startQuest">Start Quest</option>
                                <option value="playCinematic">Play Cinematic</option>
                                <option value="customEvent">Custom / Other</option>
                            </select>
                        </div>

                        {/* Parameters based on Action */}
                        <div className="p-2 bg-black/20 rounded border border-gray-700/50 space-y-2">
                            
                            {/* --- OPEN MODULE ACTION --- */}
                            {selectedTrigger.action === 'openModule' && (
                                <>
                                    <label className="text-xs text-gray-400">Target Module</label>
                                    <select 
                                        value={GAME_MODULES.some(m => m.id === selectedTrigger.parameters.moduleId) ? selectedTrigger.parameters.moduleId : 'custom'} 
                                        onChange={e => {
                                            if(e.target.value !== 'custom') handleParamChange('moduleId', e.target.value);
                                            else handleParamChange('moduleId', '');
                                        }} 
                                        className="editor-select"
                                    >
                                        {GAME_MODULES.map(module => (
                                            <option key={module.id} value={module.id}>{module.label}</option>
                                        ))}
                                        <option value="custom">Custom ID...</option>
                                    </select>
                                    
                                    {/* Custom ID Input appears if Custom is selected OR if the ID isn't in the list */}
                                    {(!GAME_MODULES.some(m => m.id === selectedTrigger.parameters.moduleId)) && (
                                        <input type="text" value={selectedTrigger.parameters.moduleId || ''} onChange={e => handleParamChange('moduleId', e.target.value)} className="editor-input mt-1 border-teal-500/50" placeholder="Type ID (e.g. pet_shop)" />
                                    )}
                                </>
                            )}

                            {/* --- TELEPORT ACTION --- */}
                            {selectedTrigger.action === 'teleport' && (
                                <>
                                    <input type="text" value={selectedTrigger.parameters.targetZoneId || ''} onChange={e => handleParamChange('targetZoneId', e.target.value)} className="editor-input" placeholder="Target Zone ID (e.g. Z02)" />
                                    <div className="flex gap-2">
                                        <input type="number" value={selectedTrigger.parameters.targetX || 0} onChange={e => handleParamChange('targetX', parseInt(e.target.value))} className="editor-input" placeholder="X" />
                                        <input type="number" value={selectedTrigger.parameters.targetY || 0} onChange={e => handleParamChange('targetY', parseInt(e.target.value))} className="editor-input" placeholder="Y" />
                                    </div>
                                </>
                            )}

                            {/* --- GENERIC TEXT PARAMS --- */}
                            {selectedTrigger.action === 'displayText' && (
                                <textarea rows="2" value={selectedTrigger.parameters.message || ''} onChange={e => handleParamChange('message', e.target.value)} className="editor-textarea" placeholder="Message to player..." />
                            )}
                            {(selectedTrigger.action === 'spawnNpc' || selectedTrigger.action === 'customEvent') && (
                                <>
                                    <input type="text" value={selectedTrigger.parameters.eventId || ''} onChange={e => handleParamChange('eventId', e.target.value)} className="editor-input" placeholder="ID (e.g. boss_spawn_01)" />
                                    <textarea rows="2" value={selectedTrigger.parameters.payload || ''} onChange={e => handleParamChange('payload', e.target.value)} className="editor-textarea" placeholder="Optional Data (JSON)..." />
                                </>
                            )}
                            {selectedTrigger.action === 'startQuest' && (
                                <input type="text" value={selectedTrigger.parameters.questId || ''} onChange={e => handleParamChange('questId', e.target.value)} className="editor-input" placeholder="Quest ID..." />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Accordion>
        </div>
    );
}

// --- Properties Inspector Component ---
function PropertiesPanel() {
    const { selectedTile, selectedRegion, layers, assetLibrary, dispatch, savePrefab, updateAssetProperties } = useMapStore();
    const [newKey, setNewKey] = useState(''); const [newValue, setNewValue] = useState(''); const [prefabName, setPrefabName] = useState('');
    const handleSavePrefab = () => { if (prefabName.trim()) { savePrefab(prefabName.trim()); setPrefabName(''); } };
    if (selectedRegion) { const { startX, startY, endX, endY } = selectedRegion; const width = Math.abs(endX - startX) + 1; const height = Math.abs(endY - startY) + 1; return ( <div className="p-1 rounded-md accordion-item-bg mt-1"><Accordion title="Region" isOpen={true} onToggle={() => {}}> <div className="space-y-2 p-2 bg-black/20 rounded-md"> <h3 className="font-bold text-sm text-center font-cinzel">Region</h3> <p className="text-xs text-center text-gray-400">{width}x{height}</p> <div className="flex items-center gap-1 pt-2 border-t border-gray-700"> <input type="text" value={prefabName} onChange={(e) => setPrefabName(e.target.value)} placeholder="Prefab Name" className="editor-input flex-1" /> <button onClick={handleSavePrefab} className="p-1 text-green-400 hover:text-green-200" disabled={!prefabName.trim()}><Save size={14}/></button> </div> </div> </Accordion></div> ); }
    if (!selectedTile) return null; const activeLayer = layers.find(l => l.id === selectedTile.layerId); if (!activeLayer) return null; const selectedObject = activeLayer.grid[selectedTile.y]?.[selectedTile.x]; if (!selectedObject || !selectedObject.assetId) return null;
    const assetInfo = assetLibrary[selectedObject.assetId]; const properties = selectedObject.properties || {};
    const handleUpdateProperty = (key, value) => { const newProperties = { ...properties, [key]: value }; dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', payload: { ...selectedTile, properties: newProperties } }); };
    const handleDeleteProperty = (key) => { const newProperties = { ...properties }; delete newProperties[key]; dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', payload: { ...selectedTile, properties: newProperties } }); };
    const handleAddProperty = () => { if (newKey && !properties.hasOwnProperty(newKey)) { handleUpdateProperty(newKey, newValue); setNewKey(''); setNewValue(''); } };
    const handleRotate = () => { const newRotation = ((selectedObject.rotation || 0) + 90) % 360; dispatch({ type: 'TRANSFORM_OBJECT', payload: { ...selectedTile, rotation: newRotation } }); };
    const handleFlip = () => { dispatch({ type: 'TRANSFORM_OBJECT', payload: { ...selectedTile, flipped: !selectedObject.flipped } }); };

    return ( <div className="p-1 rounded-md accordion-item-bg mt-1"><Accordion title="Properties" isOpen={true} onToggle={() => {}}> <div className="space-y-2 p-2 bg-black/20 rounded-md"> <h3 className="font-bold text-sm text-center font-cinzel truncate">{assetInfo.name}</h3> <p className="text-xs text-center text-gray-400">({selectedTile.x}, {selectedTile.y})</p> <div className="flex gap-2"> <GlassButton onClick={handleRotate}><RotateCcw size={14} /></GlassButton> <GlassButton onClick={handleFlip}><FlipHorizontal size={14} /></GlassButton> </div> {Object.entries(properties).map(([key, value]) => ( <div key={key} className="flex items-center gap-1"> <input type="text" value={key} readOnly className="editor-input w-1/3 bg-gray-700/50" /> <input type="text" value={value} onChange={(e) => handleUpdateProperty(key, e.target.value)} className="editor-input flex-1" /> <button onClick={() => handleDeleteProperty(key)} className="p-1 text-red-400 hover:text-red-200"><Trash2 size={12}/></button> </div> ))} <div className="flex items-center gap-1 pt-2 border-t border-gray-700"> <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Key" className="editor-input w-1/3" /> <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value" className="editor-input flex-1" /> <button onClick={handleAddProperty} className="p-1 text-green-400 hover:text-green-200"><PlusCircle size={14}/></button> </div> </div> </Accordion></div> );
}

// --- Spawn Point Panel Component ---
function SpawnPointPanel() {
    const { selectedSpawnIndex, spawnPoints, updateSpawnPointId, removeSpawnPoint } = useMapStore();
    const spawnPoint = selectedSpawnIndex !== null ? spawnPoints[selectedSpawnIndex] : null;

    if (!spawnPoint) return null;

    const handleIdChange = (e) => {
        updateSpawnPointId(selectedSpawnIndex, e.target.value);
    };

    return (
        <div className="p-1 rounded-md accordion-item-bg mt-1">
        <Accordion title="Spawn Point" isOpen={true} onToggle={() => {}}>
            <div className="space-y-2 p-2 bg-black/20 rounded-md">
                <h3 className="font-bold text-sm text-center font-cinzel">Spawn Point</h3>
                <p className="text-xs text-center text-gray-400">({spawnPoint.x}, {spawnPoint.y})</p>
                <div>
                    <label className="text-xs text-gray-400">Spawn ID</label>
                    <input 
                        type="text" 
                        value={spawnPoint.id} 
                        onChange={handleIdChange} 
                        className="editor-input"
                        placeholder="e.g., quest_boss_spawn"
                    />
                </div>
                <GlassButton onClick={() => removeSpawnPoint(selectedSpawnIndex)} className="bg-red-900/50 border-red-500/80">
                    <Trash2 size={14} /> Delete
                </GlassButton>
            </div>
        </Accordion>
        </div>
    );
}
    
// --- Status Bar Component ---
function StatusBar({ mouseCoords }) {
    const { currentTool, selectedAsset, assetLibrary, prefabs, layers, activeLayerId } = useMapStore();
    let toolText = currentTool.charAt(0).toUpperCase() + currentTool.slice(1);
    if (currentTool === 'place' && selectedAsset) { if (selectedAsset.startsWith('prefab:')) { const prefabName = selectedAsset.split(':')[1]; toolText += `: ${prefabs[prefabName]?.name || 'Unknown Prefab'}`; } else { toolText += `: ${assetLibrary[selectedAsset].name}`; } }
    const activeLayer = layers.find(l => l.id === activeLayerId);
    return ( <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/30 backdrop-blur-sm border-t border-[var(--shadow-dark-grey)] flex items-center justify-between px-4 text-xs text-gray-400"> <span className="truncate">{toolText} on "{activeLayer?.name || 'None'}"</span> <span>{mouseCoords.x !== -1 ? `(${mouseCoords.x}, ${mouseCoords.y})` : ''}</span> </div> );
}

// --- Template Manager Component ---
function TemplateManagerPanel() {
    const { templates, saveTemplate, deleteTemplate, applyTemplate } = useMapStore();
    const { biome, mapGenType, backgroundAnimation, animationSpeed, aiStyle, aiMood, aiKeywords } = useMapStore();
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);

    const coreInteractivesList = ['theArmory', 'theArcanumNew', 'gildedVaultNew', 'portalNew', 'sanctuaryReviveNew', 'entranceBlue', 'gemCutter1', 'soulforgeNew'];

    const handleNew = () => {
        setCurrentTemplate({
            id: `template_${Date.now()}`,
            name: 'New Template',
            biome, mapGenType, backgroundAnimation, animationSpeed, aiStyle, aiMood, aiKeywords,
            coreInteractives: {
                'theArmory': 'top-left', 'theArcanumNew': 'top-right', 'gildedVaultNew': 'bottom-left', 'portalNew': 'center',
                'sanctuaryReviveNew': 'top-center', 'entranceBlue': 'bottom-center', 'gemCutter1': 'bottom-right', 'soulforgeNew': 'bottom-right'
            }
        });
        setIsEditing(true);
    };

    const handleEdit = (template) => {
        setCurrentTemplate(JSON.parse(JSON.stringify(template)));
        setIsEditing(true);
    };

    const handleSave = () => {
        if (currentTemplate.name.trim() === '') return;
        saveTemplate(currentTemplate);
        setIsEditing(false);
        setCurrentTemplate(null);
    };
    
    const handleDelete = (templateId) => {
        const password = prompt("Enter password to delete template:");
        if (password === "asdf") {
            deleteTemplate(templateId);
        } else if (password !== null) {
            alert("Incorrect password.");
        }
    };

    const handleUpdateField = (field, value) => {
        setCurrentTemplate(prev => ({ ...prev, [field]: value }));
    };
    
    const handleUpdateInteractivePos = (assetId, pos) => {
        setCurrentTemplate(prev => ({
            ...prev,
            coreInteractives: {
                ...prev.coreInteractives,
                [assetId]: pos
            }
        }));
    };

    if (isEditing) {
        return (
            <div className="space-y-2 p-1 bg-black/20 rounded">
                <input type="text" value={currentTemplate.name} onChange={e => handleUpdateField('name', e.target.value)} className="editor-input" />
                <select value={currentTemplate.biome} onChange={e => handleUpdateField('biome', e.target.value)} className="editor-select capitalize"> {BIOME_LIST.map(b => <option key={b} value={b} className="capitalize bg-black">{b.replace(/([A-Z])/g, ' $1').trim()}</option>)} </select>
                <select value={currentTemplate.mapGenType} onChange={e => handleUpdateField('mapGenType', e.target.value)} className="editor-select capitalize">
                    <option value="continent">Continent</option><option value="floatingIslands">Islands</option><option value="caverns">Caverns</option><option value="roomsAndCorridors">Rooms</option>
                </select>
                <select value={currentTemplate.backgroundAnimation} onChange={e => handleUpdateField('backgroundAnimation', e.target.value)} className="editor-select">
                    <option value="none">None</option><option value="gleamingCrystals">Gleaming Crystals</option><option value="fallingLeaves">Falling Leaves</option><option value="swirlingSand">Swirling Sand</option><option value="gentleSnowfall">Gentle Snowfall</option><option value="floatingEmbers">Floating Embers</option><option value="mysticalWisps">Mystical Wisps</option><option value="celestialShimmer">Celestial Shimmer</option>
                </select>
                <input type="range" min="0.1" max="5" step="0.1" value={currentTemplate.animationSpeed} onChange={(e) => handleUpdateField('animationSpeed', parseFloat(e.target.value))} className="w-full" />
                
                <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">Core Placements:</div>
                {coreInteractivesList.map(assetId => (
                    <div key={assetId} className="flex items-center gap-2">
                        <label className="text-xs flex-1 truncate">{initialAssets[assetId].name}</label>
                        <select value={currentTemplate.coreInteractives[assetId]} onChange={e => handleUpdateInteractivePos(assetId, e.target.value)} className="editor-select w-2/3">
                            <option value="top-left">Top-L</option><option value="top-right">Top-R</option><option value="bottom-left">Bot-L</option><option value="bottom-right">Bot-R</option><option value="center">Center</option><option value="top-center">Top-C</option><option value="bottom-center">Bot-C</option>
                        </select>
                    </div>
                ))}

                <div className="flex gap-2 pt-2 border-t border-gray-700">
                    <GlassButton onClick={() => setIsEditing(false)} className="bg-gray-700/50"><X size={14} /></GlassButton>
                    <GlassButton onClick={handleSave} className="bg-green-800/50"><Save size={14} /></GlassButton>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <GlassButton onClick={handleNew}><Plus size={14} /> New Template</GlassButton>
            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {Object.values(templates).map(template => (
                    <div key={template.id} className="p-1 rounded accordion-item-bg flex items-center gap-1">
                        <span className="text-xs flex-1 truncate">{template.name}</span>
                        <button onClick={() => applyTemplate(template.id)} className="p-1 hover:text-teal-300"><Wand2 size={14} /></button>
                        <button onClick={() => handleEdit(template)} className="p-1 hover:text-blue-300"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(template.id)} className="p-1 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Batch Create Modal Component ---
function BatchCreateModal({ setIsOpen, showToast }) {
    const { templates } = useMapStore();
    const [zoneList, setZoneList] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const templateIds = Object.keys(templates);
        if (templateIds.length > 0) {
            setSelectedTemplateId(templateIds[0]);
        }
    }, [templates]);

    const handleGenerate = async () => {
        if (!selectedTemplateId || !zoneList.trim()) {
            showToast("Please select a template and provide a zone list.");
            return;
        }
        if (typeof JSZip === 'undefined') {
            showToast("Error: JSZip library not loaded. Please wait and try again.");
            return;
        }
        setIsProcessing(true);

        const zones = zoneList.split('\n').map(line => {
            const parts = line.split(',');
            return { zid: parts[0]?.trim(), zoneName: parts[1]?.trim() };
        }).filter(z => z.zid && z.zoneName);

        if (zones.length === 0) {
            showToast("No valid zones found in the list.");
            setIsProcessing(false);
            return;
        }

        const zip = new JSZip();
        const template = templates[selectedTemplateId];

        for (const zone of zones) {
            const { groundGrid, objectGrid } = generateGrids(initialMapSize.width, initialMapSize.height, template.mapGenType);
            const objectLayer = { id: 'objects', name: 'Objects', isVisible: true, grid: objectGrid, type: 'visual', opacity: 1 };
            
            const quadrants = {
                'top-left': { startX: 1, endX: Math.floor(initialMapSize.width / 2), startY: 1, endY: Math.floor(initialMapSize.height / 2) },
                'top-right': { startX: Math.floor(initialMapSize.width / 2), endX: initialMapSize.width - 1, startY: 1, endY: Math.floor(initialMapSize.height / 2) },
                'bottom-left': { startX: 1, endX: Math.floor(initialMapSize.width / 2), startY: Math.floor(initialMapSize.height / 2), endY: initialMapSize.height - 1 },
                'bottom-right': { startX: Math.floor(initialMapSize.width / 2), endX: initialMapSize.width - 1, startY: Math.floor(initialMapSize.height / 2), endY: initialMapSize.height - 1 },
                'center': { startX: Math.floor(initialMapSize.width / 4), endX: Math.floor(initialMapSize.width * 3 / 4), startY: Math.floor(initialMapSize.height / 4), endY: Math.floor(initialMapSize.height * 3 / 4) },
            };

            const findValidSpot = (quadrant, grid, occupiedSpots) => {
                const { startX, endX, startY, endY } = quadrant;
                const potentialSpots = [];
                for (let y = startY; y < endY; y++) { for (let x = startX; x < endX; x++) { if (grid[y]?.[x]?.type === 'default' && !occupiedSpots.has(`${x},${y}`)) { potentialSpots.push({ x, y }); } } }
                if(potentialSpots.length > 0) {
                    const spot = potentialSpots[Math.floor(Math.random() * potentialSpots.length)];
                    occupiedSpots.add(`${spot.x},${spot.y}`);
                    return spot;
                }
                return null;
            };
            
            const occupiedSpots = new Set();
            Object.entries(template.coreInteractives).forEach(([assetId, position]) => {
                if (position && quadrants[position]) {
                    const spot = findValidSpot(quadrants[position], groundGrid, occupiedSpots);
                    if (spot) objectLayer.grid[spot.y][spot.x] = { assetId, properties: {}, rotation: 0, flipped: false };
                }
            });

            const zoneData = {
                zid: zone.zid,
                zoneName: zone.zoneName,
                biome: template.biome,
                mapSize: initialMapSize,
                layers: [{ id: 'ground', name: 'Ground', isVisible: true, grid: groundGrid, type: 'visual', opacity: 1 }, objectLayer],
                activeLayerId: 'objects',
                aiStyle: template.aiStyle,
                aiMood: template.aiMood,
                aiKeywords: template.aiKeywords,
                backgroundAnimation: template.backgroundAnimation,
                animationSpeed: template.animationSpeed,
                triggers: {}, spawnPoints: [], prefabs: {}, templates: {},
                initialView: { zoom: 1, center: { x: initialMapSize.width / 2, y: initialMapSize.height / 2 } },
            };
            zip.file(`${zone.zid}.json`, JSON.stringify(zoneData, null, 2));
        }

        zip.generateAsync({ type: "blob" }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "geminus_zones.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            setIsProcessing(false);
            setIsOpen(false);
            showToast(`${zones.length} zones generated!`);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="glass-panel rounded-lg w-full max-w-md flex flex-col">
                <div className="flex justify-between items-center p-3 border-b border-[var(--shadow-dark-grey)]">
                    <h3 className="font-cinzel text-lg">Batch Create Zones</h3>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:text-red-400"><X size={18} /></button>
                </div>
                <div className="p-4 space-y-4">
                    <textarea value={zoneList} onChange={e => setZoneList(e.target.value)} rows="8" className="editor-textarea" placeholder="Paste zone list here, one per line.&#10;Format: ZID,Zone Name&#10;Example:&#10;Z01,The Glimmerwood&#10;Z02,Ashfall Barrens" />
                    <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="editor-select">
                        <option value="" disabled>Select a Template</option>
                        {Object.values(templates).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <GlassButton onClick={handleGenerate} disabled={isProcessing} className="w-full">
                        {isProcessing ? 'Processing...' : `Generate ${zoneList.split('\n').filter(Boolean).length} Zones`}
                    </GlassButton>
                </div>
            </div>
        </div>
    );
} // This closes BatchCreateModal

// This closes the main MapEditor function

// --- EVERYTHING BELOW THIS IS INDEPENDENT ---

function AssetEditor({ object, onSave, onClose }) {
    const initialProps = object.properties || {};
    
    // ONE STATE TO RULE THEM ALL
    const [data, setData] = useState({
        interactionType: initialProps.interactionType || 'none',
        
        // Warp Props
        warpZoneId: initialProps.warpZoneId || '',
        warpSpawnId: initialProps.warpSpawnId || '',
        warpX: initialProps.warpX || 0,
        warpY: initialProps.warpY || 0,
        
        // Sign/Text Props
        signText: initialProps.signText || '',
        
        // Container/Loot Props
        lootItem: initialProps.lootItem || '',
        
        // NPC Props
        npcName: initialProps.npcName || '',
        dialogueText: initialProps.dialogueText || '',
        
        // Quest Props
        questId: initialProps.questId || '',
        
        // Boss & Lock Props
        triggerEventId: initialProps.triggerEventId || '', // What event fires when this dies?
        requiredEventId: initialProps.requiredEventId || '' // What event is needed to pass?
    });

    const handleSave = () => {
        onSave(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-teal-500/50 p-4 rounded-lg w-80 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h3 className="text-teal-400 font-bold uppercase text-xs tracking-wider">
                        Edit Object: {object.assetId}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>

                {/* 1. MASTER INTERACTION SELECTOR */}
                <div className="mb-4">
                    <label className="text-[10px] text-gray-400 uppercase block mb-1">Interaction Type</label>
                    <select 
                        className="w-full bg-black/40 border border-gray-700 rounded text-xs text-gray-200 p-1 focus:border-teal-500 outline-none"
                        value={data.interactionType}
                        onChange={e => setData({...data, interactionType: e.target.value})}
                    >
                        <option value="none">None (Decoration)</option>
                        <option value="warp">Warp / Door</option>
                        <option value="sign">Sign / Readable</option>
                        <option value="container">Container / Loot</option>
                        <option value="npc">NPC / Character</option>
                        <option value="quest_item">Quest Item</option>
                        <option value="boss">Boss / Trigger</option>
                        <option value="locked_gate">Locked Gate / Barrier</option>
                    </select>
                </div>

                {/* --- DYNAMIC EDITOR SECTIONS --- */}

                {/* A. WARP EDITOR */}
                {data.interactionType === 'warp' && (
                    <div className="space-y-3 mb-4 bg-teal-900/10 p-2 rounded border border-teal-500/20">
                        <div>
                            <label className="text-[10px] text-teal-300 uppercase">Target Zone ID</label>
                            <input type="text" placeholder="e.g. Z02" value={data.warpZoneId} onChange={e => setData({...data, warpZoneId: e.target.value})} className="editor-input" />
                        </div>
                        <div>
                            <label className="text-[10px] text-teal-300 uppercase">Target Spawn ID</label>
                            <input type="text" placeholder="e.g. main_entrance" value={data.warpSpawnId} onChange={e => setData({...data, warpSpawnId: e.target.value})} className="editor-input" />
                        </div>
                        <div className="flex items-center gap-2 py-1"><div className="h-px bg-teal-500/20 flex-1"></div><span className="text-[9px] text-teal-500/50">OR COORDS</span><div className="h-px bg-teal-500/20 flex-1"></div></div>
                        <div className="flex gap-2">
                            <div><label className="text-[10px] text-teal-300 uppercase">Target X</label><input type="number" value={data.warpX} onChange={e => setData({...data, warpX: parseInt(e.target.value)})} className="editor-input" /></div>
                            <div><label className="text-[10px] text-teal-300 uppercase">Target Y</label><input type="number" value={data.warpY} onChange={e => setData({...data, warpY: parseInt(e.target.value)})} className="editor-input" /></div>
                        </div>
                    </div>
                )}

                {/* B. NPC EDITOR */}
                {data.interactionType === 'npc' && (
                    <div className="mb-4 space-y-2 bg-blue-900/10 p-2 rounded border border-blue-500/20">
                        <div>
                            <label className="text-[10px] text-blue-300 uppercase">NPC Name</label>
                            <input type="text" placeholder="e.g. Elder Oryn" value={data.npcName} onChange={e => setData({...data, npcName: e.target.value})} className="editor-input" />
                        </div>
                        <div>
                            <label className="text-[10px] text-blue-300 uppercase">Dialogue / Script</label>
                            <textarea rows={3} placeholder="Hello traveler..." value={data.dialogueText} onChange={e => setData({...data, dialogueText: e.target.value})} className="editor-textarea" />
                        </div>
                    </div>
                )}

                {/* C. BOSS / TRIGGER EDITOR */}
                {data.interactionType === 'boss' && (
                    <div className="mb-4 space-y-2 bg-red-900/10 p-2 rounded border border-red-500/20">
                        <p className="text-[10px] text-red-300 italic mb-2">Use this for enemies that unlock things when defeated.</p>
                        <div>
                            <label className="text-[10px] text-red-400 uppercase font-bold">Event Trigger ID</label>
                            <input type="text" placeholder="e.g. boss_dragon_dead" value={data.triggerEventId} onChange={e => setData({...data, triggerEventId: e.target.value})} className="editor-input border-red-500/50" />
                            <p className="text-[9px] text-gray-500 mt-1">When this unit dies, this ID becomes TRUE.</p>
                        </div>
                    </div>
                )}

                {/* D. LOCKED GATE EDITOR */}
                {data.interactionType === 'locked_gate' && (
                    <div className="mb-4 space-y-2 bg-orange-900/10 p-2 rounded border border-orange-500/20">
                        <p className="text-[10px] text-orange-300 italic mb-2">This object blocks the path until an event happens.</p>
                        <div>
                            <label className="text-[10px] text-orange-400 uppercase font-bold">Required Event ID</label>
                            <input type="text" placeholder="e.g. boss_dragon_dead" value={data.requiredEventId} onChange={e => setData({...data, requiredEventId: e.target.value})} className="editor-input border-orange-500/50" />
                            <p className="text-[9px] text-gray-500 mt-1">The player can only pass if this ID is TRUE.</p>
                        </div>
                    </div>
                )}

                {/* E. QUEST ITEM EDITOR */}
                {data.interactionType === 'quest_item' && (
                    <div className="mb-4 space-y-2 bg-purple-900/10 p-2 rounded border border-purple-500/20">
                        <div>
                            <label className="text-[10px] text-purple-300 uppercase">Quest ID</label>
                            <input type="text" placeholder="e.g. quest_find_relic" value={data.questId} onChange={e => setData({...data, questId: e.target.value})} className="editor-input" />
                        </div>
                        <div>
                            <label className="text-[10px] text-purple-300 uppercase">Item Name</label>
                            <input type="text" placeholder="e.g. Ancient Relic" value={data.lootItem} onChange={e => setData({...data, lootItem: e.target.value})} className="editor-input" />
                        </div>
                    </div>
                )}

                {/* F. STANDARD SIGN */}
                {data.interactionType === 'sign' && (
                    <div className="mb-4">
                        <label className="text-[10px] text-yellow-300 uppercase">Message Text</label>
                        <textarea rows={3} value={data.signText} onChange={e => setData({...data, signText: e.target.value})} className="editor-textarea" />
                    </div>
                )}

                {/* G. CONTAINER */}
                {data.interactionType === 'container' && (
                    <div className="mb-4">
                        <label className="text-[10px] text-purple-300 uppercase">Item ID / Name</label>
                        <input type="text" placeholder="e.g. Iron Sword" value={data.lootItem} onChange={e => setData({...data, lootItem: e.target.value})} className="editor-input" />
                    </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                    <button onClick={onClose} className="px-3 py-1 rounded text-xs text-gray-400 hover:text-white">Cancel</button>
                    <button onClick={handleSave} className="px-3 py-1 rounded text-xs bg-teal-600 text-white hover:bg-teal-500 shadow-lg shadow-teal-900/50">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- MAGI-TECH MINIMAP: Dockable & Scalable Navigator ---
function MiniMap({ canvasSize, isDocked, setDocked, isLarge, setLarge }) {
    const { layers, mapSize, zoom, panOffset } = useMapStore();
    const mmCanvasRef = useRef(null);
    
    // Default size vs Double size (384x192)
    const baseWidth = isLarge ? 384 : 192;
    const baseHeight = baseWidth * (mapSize.height / mapSize.width);
    const [mmDim, setMmDim] = useState({ w: baseWidth, h: baseHeight });
    const [isResizing, setIsResizing] = useState(false);

    // Sync dimensions when "Large" toggle is clicked
    useEffect(() => {
        setMmDim({ w: baseWidth, h: baseHeight });
    }, [isLarge, mapSize]);

    useEffect(() => {
        const canvas = mmCanvasRef.current;
        if (!canvas || !layers.length || !canvasSize) return;
        const ctx = canvas.getContext('2d');
        const state = useMapStore.getState();
        
        const scaleX = canvas.width / mapSize.width;
        const scaleY = canvas.height / mapSize.height;

        ctx.save();
        
        // 1. FORCE CLIPPING: This stops the cyan box from bleeding outside the navigator
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.clip();

        ctx.fillStyle = '#000'; // Black background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const groundLayer = layers.find(l => l.id === 'ground');
        if (!groundLayer) { ctx.restore(); return; }

        // 2. DRAW TERRAIN (Only actual placed land)
        groundLayer.grid.forEach((row, y) => {
            row.forEach((tile, x) => {
                // MAGI-TECH: Only draw if it's not empty/default/void
                if (tile.type !== 'empty' && tile.type !== 'default' && tile.type !== 'wall') {
                    ctx.fillStyle = BIOME_COLORS[state.biome] || '#4A6B4A';
                    ctx.fillRect(x * scaleX, y * scaleY, scaleX + 0.5, scaleY + 0.5);
                }
            });
        });

        // 3. DRAW "YOU ARE HERE" BOX
        const viewW = (canvasSize.width / (zoom * TILE_SIZE)) * scaleX;
        const viewH = (canvasSize.height / (zoom * TILE_SIZE)) * scaleY;
        const viewX = ((-panOffset.x - canvasSize.width / 2) / (zoom * TILE_SIZE)) * scaleX + (mapSize.width * scaleX / 2);
        const viewY = ((-panOffset.y - canvasSize.height / 2) / (zoom * TILE_SIZE)) * scaleY + (mapSize.height * scaleY / 2);

        // Logic: Only draw the viewport box if it's smaller than the total map
        if (viewW < canvas.width || viewH < canvas.height) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(viewX, viewY, viewW, viewH);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
            ctx.fillRect(viewX, viewY, viewW, viewH);
        // 4. DRAW PLAYER BLIP
        if (state.isTestMode && state.playerPosition) {
            const blipX = (state.playerPosition.x / mapSize.width) * canvas.width;
            const blipY = (state.playerPosition.y / mapSize.height) * canvas.height;
            
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(blipX, blipY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for next draw
        }
        }

        ctx.restore();
    }, [layers, mapSize, zoom, panOffset, canvasSize, mmDim, BIOME_COLORS]);

    const handleMinimapClick = (e) => {
        const rect = mmCanvasRef.current.getBoundingClientRect();
        const gridX = Math.floor(((e.clientX - rect.left) / rect.width) * mapSize.width);
        const gridY = Math.floor(((e.clientY - rect.top) / rect.height) * mapSize.height);
        useMapStore.getState().snapToCoord(gridX, gridY);
    };

    return (
        <div 
            style={{ width: isDocked ? '100%' : mmDim.w, height: isDocked ? 'auto' : mmDim.h + 22 }}
            className={`${isDocked ? 'relative' : 'absolute bottom-10 right-4'} bg-black/60 border border-teal-500/30 rounded-lg overflow-hidden shadow-2xl backdrop-blur-md z-40 group hover:border-teal-400 transition-all`}
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
                    <span className="group-hover:text-teal-400">Jump ⚡</span>
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