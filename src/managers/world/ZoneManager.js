/**
 * @file src/managers/world/ZoneManager.js
 * @description Master controller for the current map zone, player positioning, and canvas rendering.
 */
import { MASTER_ASSET_LIBRARY } from '../../config/MasterAssets.js';
import { bestiaryData } from '../../data/bestiaryData.js';
export class ZoneManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.MapRenderer = deps.MapRenderer;
    this.MapDataStore = deps.MapDataStore;
    this.WorldMapManager = null; // Set later via setManagers
    this.UIManager = null; // Set later
    this.CombatManager = null; // Set later
    this.isInitialized = false;
    this.mapRenderer = null;
    this.isLoaded = false;
    
    // Pan and zoom state
    this.panOffset = { x: 0, y: 0 };
    this.zoom = 1;
    this.minZoom = 0.2;
    this.maxZoom = 3;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.isMoving = false;
    this.moveInterval = null;
  }

  /**
   * Bridges late-initialized managers after instantiation in main.js.
   */
  setManagers(managers) {
    this.WorldMapManager = managers.WorldMapManager;
    this.UIManager = managers.UIManager;
    this.CombatManager = managers.CombatManager;
  }

 init() {
    if (this.isInitialized || !this.ui.zoneCanvas) return;

    // 1. Instance the renderer
    this.mapRenderer = new this.MapRenderer(this.ui.zoneCanvas, false);
    this.isInitialized = true;
    
    // 2. Set up event handlers
    this.setupEventHandlers();

    // 3. Start Animation Loop
    this.startRenderLoop();
    
    // 4. [NEW] Start the Dedicated Data Sync Service
    this.startCombatSyncService();

    console.log("🎬 World: Zone Manager initialized for main view.");
  }

  // [NEW] ANIMATION LOOP LOGIC
  startRenderLoop() {
    const loop = (timestamp) => {
      // 1. Draw the scene (passing timestamp for particles)
      if (this.mapRenderer && this.state.player) {
        // We pass the timestamp to draw() so particles can calculate movement
        this.draw(timestamp);
      }
      // 2. Schedule the next frame (infinite loop)
      this.animationFrameId = requestAnimationFrame(loop);
    };

    // Kickstart the loop if not already running
    if (!this.animationFrameId) {
        this.animationFrameId = requestAnimationFrame(loop);
    }
  }

  stopRenderLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // [NEW] AUTO-GENERATE COLLISION LAYER
  // Checks ground/objects and creates invisible walls for water/cliffs if navigation data is missing.
  bakeCollisionData(layers, mapSize, assetLibrary) {
    const navigationGrid = Array.from({ length: mapSize.height }, () => Array(mapSize.width).fill(1));
    const objectLayer = layers.find(l => l.id === 'objects');
    const groundLayer = layers.find(l => l.id === 'ground');

    for (let y = 0; y < mapSize.height; y++) {
        for (let x = 0; x < mapSize.width; x++) {
            // 1. Check Ground (Liquids/Voids)
            if (groundLayer?.grid[y]?.[x]) {
                const type = groundLayer.grid[y][x].type;
                if (['wall', 'empty', 'water', 'lava'].includes(type)) {
                    navigationGrid[y][x] = 0;
                    continue; 
                }
            }
            // 2. Check Objects (Natural Obstacles without interactions)
            const objectTile = objectLayer?.grid[y]?.[x];
            if (objectTile && objectTile.assetId) {
                const asset = assetLibrary[objectTile.assetId];
                const props = objectTile.properties || {};
                if (asset) {
                    const isNaturalObstacle = asset.type === 'Natural Obstacles';
                    const hasInteraction = props.interactionType && props.interactionType !== 'none';
                    
                    // Block if it's a rock/tree with no interaction
                    if (isNaturalObstacle && !hasInteraction) navigationGrid[y][x] = 0;
                    // Block if explicitly marked non-traversable
                    if (props.isTraversable === false) navigationGrid[y][x] = 0;
                }
            }
        }
    }
    return navigationGrid;
  }

  /**
   * Sets up mouse and keyboard event handlers for pan, zoom, and interaction
   */
  setupEventHandlers() {
    if (!this.ui.zoneCanvas) return;

    const canvas = this.ui.zoneCanvas;
    
    // [NEW] Variables for Drag Threshold
    let rawDragStartX = 0;
    let rawDragStartY = 0;

    // Mouse wheel for zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * delta));
      this.draw();
    });

    // Mouse down for panning
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left mouse button
        this.isPanning = true;
        
        // Standard Pan Logic
        this.panStart = { x: e.clientX - this.panOffset.x, y: e.clientY - this.panOffset.y };
        
        // [FIX] Capture Start Position for Click Validation
        rawDragStartX = e.clientX;
        rawDragStartY = e.clientY;
        
        canvas.style.cursor = 'grabbing';
      }
    });

    // Mouse move for panning
    canvas.addEventListener('mousemove', (e) => {
      if (this.reportDiagnostics) this.reportDiagnostics(e); 

      if (this.isPanning) {
        this.panOffset.x = e.clientX - this.panStart.x;
        this.panOffset.y = e.clientY - this.panStart.y;
        this.draw();
      } else {
        this.updateMouseCoords(e);
      }
    });

    // Mouse up
    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isPanning = false;
        canvas.style.cursor = 'default';
      }
    });

    // Mouse leave
    canvas.addEventListener('mouseleave', () => {
      this.isPanning = false;
      canvas.style.cursor = 'default';
    });

    // [FIX] SMART CLICK HANDLER
    // Only triggers if the mouse moved less than 10 pixels (preventing drag-clicks)
    canvas.addEventListener('click', (e) => {
      const dist = Math.hypot(e.clientX - rawDragStartX, e.clientY - rawDragStartY);

      // If moved > 10px, it was a Drag/Pan. STOP.
      if (dist > 10) return;

      // OTHERWISE: It's a valid click.
      this.handleMapClick(e);
    });

    // Keyboard movement (WASD/Arrow keys)
    window.addEventListener('keydown', (e) => {
      if (!this.state.player || this.isMoving) return;
      
      const key = e.key.toLowerCase();
      let dx = 0, dy = 0;
      
      if (key === 'w' || key === 'arrowup') dy = -1;
      else if (key === 's' || key === 'arrowdown') dy = 1;
      else if (key === 'a' || key === 'arrowleft') dx = -1;
      else if (key === 'd' || key === 'arrowright') dx = 1;
      
      if (dx !== 0 || dy !== 0) {
        const newPos = { x: this.state.player.pos.x + dx, y: this.state.player.pos.y + dy };
        this.handleMovement(newPos);
      }
    });
  }

  /**
   * Update mouse coordinates for hover effects
   */
  updateMouseCoords(e) {
    // Can be used for hover effects later
  }

getCoordsFromEvent(e) {
    if (!this.ui.zoneCanvas || !this.MapDataStore?.data) return { x: -1, y: -1 };
    
    const canvas = this.ui.zoneCanvas;
    const rect = canvas.getBoundingClientRect();
    const mapData = this.MapDataStore.data;
    const mapSize = mapData.mapSize || { width: 15, height: 15 };
    const tileType = mapData.tileType || 'hex';
    const TILE_SIZE = 64;
    const dpr = window.devicePixelRatio || 1;

    // MAGI-TECH ABSOLUTE ANCHOR: Accounts for scroll, padding, and centered offsets
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate the absolute visual center of the canvas element on the screen
    const centerX = rect.left + scrollLeft + (rect.width / 2);
    const centerY = rect.top + scrollTop + (rect.height / 2);

    // Project mouse relative to that absolute center
    const worldX = (e.pageX - centerX - this.panOffset.x) / this.zoom;
    const worldY = (e.pageY - centerY - this.panOffset.y) / this.zoom;
    
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

      const gx = rx + Math.floor((rz - (rz & 1)) / 2) + mapCenterX;
      const gy = rz + mapCenterY;

      if (gx < 0 || gx >= mapSize.width || gy < 0 || gy >= mapSize.height) return { x: -1, y: -1 };
      return { x: gx, y: gy };
    } else {
      const gx = Math.floor(worldX / TILE_SIZE + mapCenterX);
      const gy = Math.floor(worldY / TILE_SIZE + mapCenterY);
      if (gx < 0 || gx >= mapSize.width || gy < 0 || gy >= mapSize.height) return { x: -1, y: -1 };
      return { x: gx, y: gy };
    }
  }

  reportDiagnostics(e) {
    const canvas = this.ui.zoneCanvas;
    if (!canvas || !this.MapDataStore?.data) return;
    const rect = canvas.getBoundingClientRect();

    // MAGI-TECH ABSOLUTE ANCHOR: Accounts for scroll, padding, and centered offsets
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate absolute midpoint to align with Renderer's Visual Center
    const centerX = rect.left + scrollLeft + (rect.width / 2);
    const centerY = rect.top + scrollTop + (rect.height / 2);

    // 1. RAW: Pixels from top-left of the canvas box
    const rawX = Math.round(e.clientX - rect.left);
    const rawY = Math.round(e.clientY - rect.top);

    // 2. WORLD: Matching the MapEditor.jsx [0,0] center-origin logic
    const worldX = (e.pageX - centerX - this.panOffset.x) / this.zoom;
    const worldY = (e.pageY - centerY - this.panOffset.y) / this.zoom;

    const grid = this.getCoordsFromEvent(e);
    const hero = this.state.player?.pos || {x: 0, y: 0};

    // 3. Update the Monitor labels in player.html
    const rawEl = document.getElementById('debug-raw');
    const worldEl = document.getElementById('debug-world');
    const gridEl = document.getElementById('debug-grid');
    const heroEl = document.getElementById('debug-hero');

    if(rawEl) rawEl.innerText = `RAW MOUSE: ${rawX}, ${rawY}`;
    if(worldEl) worldEl.innerText = `WORLD SPACE: ${Math.round(worldX)}, ${Math.round(worldY)}`;
    if(gridEl) gridEl.innerText = `GRID INDEX: [${grid.x}, ${grid.y}]`;
    if(heroEl) heroEl.innerText = `HERO INDEX: [${hero.x}, ${hero.y}]`;
  }
  /**
   * [NEW] Dedicated Sync Service
   * Polls every 1 second to ensure Combat UI matches the Current Zone.
   * decoupling this from the draw loop prevents race conditions.
   */
  startCombatSyncService() {
      setInterval(() => {
          // 1. Get current resources
          const zoneData = this.MapDataStore?.data;
          
          // Check BOTH local injection (setManagers) and global window
          const combatMgr = this.CombatManager || (window.gameManager ? window.gameManager.CombatManager : null);

          // 2. Only proceed if BOTH Map and UI are ready
          if (zoneData && combatMgr) {
              const currentZoneId = zoneData.zid || zoneData.zoneId || 'Z01';
              
              // 3. If we are in a new zone (or haven't synced this one yet)
              if (this.lastSyncedZoneId !== currentZoneId) {
                  console.log(`🔄 Auto-Sync Service: Updating Combat List for ${currentZoneId}`);
                  
                  // Call the sync
                  this.syncCombatData();
                  
                  // Lock it so we don't spam updates
                  this.lastSyncedZoneId = currentZoneId;
              }
          }
      }, 1000); // Check every 1 second
  }
  /**
   * [NEW] Call this immediately after your Map Data loads!
   * It pushes the zone's monster list to the Combat Manager's dropdown.
   */
  syncCombatData() {
      // 1. Get Data
      let zoneData = this.MapDataStore?.data || {};
      let zoneId = zoneData.zid || zoneData.zoneId || 'Z01';
      
      // 2. Fallback Logic (Same as before)
      const mapZoneMobs = zoneData.zoneMobs || []; 
      let staticFallback = [];
      if (typeof bestiaryData !== 'undefined') {
          staticFallback = Object.values(bestiaryData).filter(mob => 
              mob.id && mob.id.startsWith(zoneId)
          );
      }
      
      // 3. Combine
      let validMobs = (mapZoneMobs.length > 0) ? mapZoneMobs : staticFallback;

      // 4. Send to Combat Manager (Main UI)
      if (window.gameManager && window.gameManager.CombatManager) {
          if (window.gameManager.CombatManager.populateMonsterListFromZone) {
               console.log(`🔄 ZoneManager: Syncing ${validMobs.length} mobs to Combat Tab.`);
               window.gameManager.CombatManager.populateMonsterListFromZone(zoneId, validMobs);
          }
      }
      
      return validMobs; // Return list in case we need it
  }

  /**
   * Handle map click for interactions
   */
  handleMapClick(e) {
    if (!this.state.player || !this.MapDataStore?.data) {
      console.log("ZoneManager: Cannot handle click - missing player or map data");
      return;
    }
    
    const closest = this.getCoordsFromEvent(e);
    if (closest.x === -1) {
      console.log("ZoneManager: Click outside map bounds");
      return;
    }
    
    console.log(`ZoneManager: Click detected at [${closest.x}, ${closest.y}]`);
    
    const mapData = this.MapDataStore.data;
    const layers = mapData.layers || [];
    const playerPos = this.state.player.pos;
    
    const dx = Math.abs(playerPos.x - closest.x);
    const dy = Math.abs(playerPos.y - closest.y);
    const isOnTile = dx === 0 && dy === 0;
    const isNeighbor = dx <= 1 && dy <= 1;
    
    console.log(`ZoneManager: Player at [${playerPos.x}, ${playerPos.y}], clicked [${closest.x}, ${closest.y}], isOnTile: ${isOnTile}, isNeighbor: ${isNeighbor}`);
    
    // 1. Check for triggers (portals, etc.)
    if (isOnTile || isNeighbor) {
      const triggerLayer = layers.find(l => l.type === 'trigger');
      const tileTrigger = triggerLayer?.grid?.[closest.y]?.[closest.x];
      const triggers = mapData.triggers || {};
      
      if (tileTrigger?.eventId && triggers[tileTrigger.eventId]) {
        const config = triggers[tileTrigger.eventId];
        
        if (config.action === 'teleport') {
          const { targetZoneId, targetX, targetY } = config.parameters || {};
          if (window.confirm(`🌍 Travel to ${targetZoneId || "this zone"}?`)) {
            this.handleZoneTransition(targetZoneId, targetX, targetY);
          }
          return;
        }
        
        if (config.action === 'openModule') {
          // Handle module opening (shop, NPC, etc.)
          this.handleModuleInteraction(config.parameters);
          return;
        }
      }
      
      // 2. Check for object interactions (warp doors, NPCs, etc.)
      const objectLayer = layers.find(l => l.id === 'objects');
      const obj = objectLayer?.grid?.[closest.y]?.[closest.x];
      
      if (obj?.properties?.interactionType) {
        const interactionType = obj.properties.interactionType;
        
        if (interactionType === 'warp') {
          const p = obj.properties;
          const targetZid = p.warpZoneId || mapData.zid;
          if (targetZid === mapData.zid) {
            const tx = parseInt(p.warpX) || 0, ty = parseInt(p.warpY) || 0;
            if (window.confirm(`Door Warp to (${tx}, ${ty})?`)) {
              this.movePlayerTo({ x: tx, y: ty });
            }
          } else {
            if (window.confirm(`🌍 Travel to Zone: ${targetZid}?`)) {
              this.handleZoneTransition(targetZid, parseInt(p.warpX) || 0, parseInt(p.warpY) || 0);
            }
          }
          return;
        }
        
        if (interactionType === 'npc') {
          // Open NPC dialog
          this.handleNPCInteraction(obj);
          return;
        }
        
        if (interactionType === 'boss') {
          // Trigger boss battle
          this.handleBossInteraction(obj);
          return;
        }
      }
    }
    
    // 3. Self-click: Default environment interaction (combat)
    if (isOnTile) {
      console.log("ZoneManager: Player clicked on own tile - triggering combat interaction");
      if (this.isMoving) {
        this.isMoving = false;
        if (this.moveInterval) {
          clearInterval(this.moveInterval);
          this.moveInterval = null;
        }
        return;
      }
      this.handleCombatInteraction(closest);
      return;
    }
    
    // 4. Navigation-Priority Movement
    const navLayer = layers.find(l => l.type === 'navigation');
    const groundLayer = layers.find(l => l.id === 'ground');
    
    // Check nav layer first, fallback to ground type logic
    const isBlockedByNav = navLayer && navLayer.grid?.[closest.y]?.[closest.x] === 0;
    const targetHex = groundLayer?.grid?.[closest.y]?.[closest.x];
    const isWalkableType = targetHex && targetHex.type !== 'empty' && targetHex.type !== 'wall';
    
    const isWalkable = !isBlockedByNav && isWalkableType;
    
    if (isWalkable) {
      console.log(`ZoneManager: Moving to [${closest.x}, ${closest.y}]`);
      this.handleMovement(closest);
    } else {
      console.warn(`🚫 Movement Blocked: [${closest.x}, ${closest.y}] is ${targetHex?.type || 'Void'}`);
      // If not walkable, try direct movement for testing
      if (window.confirm(`Hex [${closest.x}, ${closest.y}] is not walkable. Move player there anyway for testing?`)) {
        this.movePlayerTo(closest);
      }
    }
  }

  /**
   * Handle player movement with pathfinding
   */
  handleMovement(target) {
    if (!this.state.player || this.isMoving) return;
    
    const mapData = this.MapDataStore.data;
    if (!mapData) return;
    
    const layers = mapData.layers || [];
    const navLayer = layers.find(l => l.type === 'navigation');
    const tileType = mapData.tileType || 'hex';
    const playerPos = this.state.player.pos;
    
    // Build pathfinding grid
    const mapSize = mapData.mapSize || { width: 25, height: 25 };
    const gridForPathfinder = navLayer 
      ? navLayer.grid.map(row => row.map(cell => (cell === 0 ? 0 : 1)))
      : Array.from({ length: mapSize.height }, () => Array(mapSize.width).fill(1));
    
    // Ensure start/end are walkable
    if (gridForPathfinder[playerPos.y]) gridForPathfinder[playerPos.y][playerPos.x] = 1;
    if (gridForPathfinder[target.y]) gridForPathfinder[target.y][target.x] = 1;
    
    // MAGI-TECH SYNC: Pass 'hex' explicitly to ensure the pathfinder uses 
// the staggered neighbor logic instead of square grid logic.
const path = this.aStarPathfind(gridForPathfinder, playerPos, target, tileType || 'hex');
    
    if (path && path.length > 0) {
      this.movePlayerAlongPath(path);
    } else {
      // Direct step for adjacent hexes
      const dx = Math.abs(playerPos.x - target.x);
      const dy = Math.abs(playerPos.y - target.y);
      if (dx <= 1 && dy <= 1) {
        this.movePlayerAlongPath([target]);
      }
    }
  }

  /**
   * A* pathfinding algorithm (simplified version)
   */
  aStarPathfind(grid, start, end, tileType = 'hex') {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    if (!rows || !cols) return [];
    
    const nodes = [];
    for (let y = 0; y < rows; y++) {
      nodes[y] = [];
      for (let x = 0; x < cols; x++) {
        nodes[y][x] = { x, y, f: 0, g: 0, h: 0, parent: null, isWall: grid[y][x] === 0, closed: false, opened: false };
      }
    }
    
    const heuristic = (a, b) => {
      if (tileType === 'square') return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      
      // Pointy-Top Axial to Cube conversion for accurate distance
      const a_q = a.x - (a.y + (a.y & 1)) / 2;
      const a_r = a.y;
      const b_q = b.x - (b.y + (b.y & 1)) / 2;
      const b_r = b.y;
      
      return (Math.abs(a_q - b_q) + 
              Math.abs(a_q + a_r - (b_q + b_r)) + 
              Math.abs(a_r - b_r)) / 2;
    };
    
    const startNode = nodes[start.y]?.[start.x];
    const endNode = nodes[end.y]?.[end.x];
    if (!startNode || !endNode) return [];
    
    let openSet = [startNode];
    startNode.opened = true;
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
        while (current.parent) { path.push({ x: current.x, y: current.y }); current = current.parent; }
        return path.reverse();
      }
      
      openSet.splice(lowestIndex, 1);
      current.closed = true;
      
      const { x, y } = current;
      // SYNCED HEX ADJACENCY: Pointy-Top Offset logic for A* Parity
      const dirs = (tileType === 'hex') 
        ? (y % 2 !== 0 
            ? [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]] // Odd rows (Staggered Right)
            : [[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]]) // Even rows (Staggered Left)
        : [[0, -1], [0, 1], [-1, 0], [1, 0]]; // Standard Square Neighbors
      
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          const neighbor = nodes[ny]?.[nx];
          if (!neighbor || neighbor.closed || neighbor.isWall) continue;
          
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
  }

  /**
   * Move player along a path
   */
  movePlayerAlongPath(path) {
    if (!path || path.length === 0 || !this.state.player) return;
    
    this.isMoving = true;
    let step = 0;
    
    if (this.moveInterval) clearInterval(this.moveInterval);
    
    this.moveInterval = setInterval(() => {
      if (step >= path.length) {
        this.isMoving = false;
        clearInterval(this.moveInterval);
        this.moveInterval = null;
        
        // Final position update
        const finalPos = path[path.length - 1];
        this.state.player.pos.x = finalPos.x;
        this.state.player.pos.y = finalPos.y;
        
        console.log(`ZoneManager: Player moved to [${finalPos.x}, ${finalPos.y}]`);
        this.draw();
        if (this.WorldMapManager) this.WorldMapManager.draw();
        return;
      }
      
      const nextPos = path[step];
      
      // MAGI-TECH SYNC: Update player coordinates in the shared state
      this.state.player.pos.x = nextPos.x;
      this.state.player.pos.y = nextPos.y;

      // [NEW] Check spatial boundaries and fetch chunks seamlessly
      this.updateActiveSpatialChunks(nextPos);
      
      // MANDATORY: Immediately snap the camera to the player's new centered position.
      // This prevents the "NW Drift" by ensuring the viewport origin remains 
      // locked to the player's hex index in Z01.json.
      this.centerCameraOnPlayer(this.MapDataStore.data);

      // Redraw both views to maintain visual parity
      this.draw();
      if (this.WorldMapManager) this.WorldMapManager.draw();
      
      step++;
    }, 80); // MAGI-TECH Standard: 80ms for smooth Editor-parity movement
  }

  /**
   * Move player directly to a position
   */
  movePlayerTo(pos) {
    if (!this.state.player) return;
    console.log(`ZoneManager: Moving player directly to [${pos.x}, ${pos.y}]`);
    this.state.player.pos.x = pos.x;
    this.state.player.pos.y = pos.y;
    this.draw();
    if (this.WorldMapManager) this.WorldMapManager.draw();
  }

  /**
   * Handle zone transition
   */
  async handleZoneTransition(targetZoneId, targetX, targetY) {
    if (!this.MapDataStore) return;
    
    try {
      // Load the target zone master configuration file
      const response = await fetch(`./data/zones/${targetZoneId}_master.json`);
      if (!response.ok) throw new Error(`Zone ${targetZoneId} not found`);
      
      const zoneData = await response.json();
      
      // Ensure layers array is initialized so the engine doesn't crash on length checks
      if (!zoneData.layers) zoneData.layers = [];
      
      await this.MapDataStore.load(zoneData);
      
      // Update zone state
      this.state.zone.id = zoneData.zid || targetZoneId;
      this.state.zone.name = zoneData.zoneName || zoneData.name;
      this.state.game.currentZoneId = targetZoneId;
      
      // Move player to target position
      if (this.state.player) {
        this.state.player.pos.x = parseInt(targetX) || 0;
        this.state.player.pos.y = parseInt(targetY) || 0;
        this.state.player.currentZoneId = targetZoneId;
      }
      
      // Reset pan/zoom
      this.panOffset = { x: 0, y: 0 };
      this.zoom = 1;
      
      // Reload zone
      await this.loadZone(zoneData);
      
      if (this.UIManager) this.UIManager.updatePlayerStatusUI();
    } catch (err) {
      console.error("Zone transition failed:", err);
    }
  }

  /**
   * Handle module interaction (shop, NPC, etc.)
   * Replaces the old "TODO" with a direct call to GameManager.
   */
  handleModuleInteraction(parameters) {
    if (!parameters || !parameters.moduleId) {
        console.warn("⚠️ ZoneManager: Interaction missing moduleId", parameters);
        return;
    }

    console.log(`⚡ ZoneManager: Requesting Module Open -> ${parameters.moduleId}`);

    // Call the global GameManager to handle the UI Overlay
    if (window.gameManager) {
        // This function doesn't exist in GameManager yet (we will add it next!)
        if (window.gameManager.openModule) {
            window.gameManager.openModule(parameters.moduleId);
        } else {
            console.error("❌ GameManager: openModule() method is missing.");
        }
    } else {
        console.error("❌ ZoneManager: window.gameManager is missing!");
    }
  }

  /**
   * Handle NPC interaction
   */
  handleNPCInteraction(obj) {
    console.log("NPC interaction:", obj);
    // TODO: Open NPC dialog
  }

  /**
   * Handle boss interaction
   */
  handleBossInteraction(obj) {
    console.log("Boss interaction:", obj);
    // Trigger boss battle
    this.handleCombatInteraction({ x: obj.x, y: obj.y }, true);
  }

 /**
   * [UPDATED] Trigger Combat - Opens Teleporting Vanilla UI
   */
  handleCombatInteraction(coords, isBoss = false) {
    console.log(`⚔️ ZoneManager: Interaction at [${coords.x}, ${coords.y}]`);
    
    const validMobs = this.syncCombatData(); 

    if (!validMobs || validMobs.length === 0) {
        if (window.showToast) window.showToast("The area is safe.", false);
        return;
    }

    if (window.gameManager && window.gameManager.CombatManager) {
        // Deprecated React Bridge: window.gameManager.openModule('combat_encounter');
        // Direct Vanilla Teleportation Integration:
        window.gameManager.CombatManager.openWildEncounter(validMobs, isBoss);
    }
  }

 /**
   * Center camera on player - Synchronized with Center-Origin DNA
   */
  centerCameraOnPlayer(zoneData) {
    if (!this.state.player || !zoneData || !this.ui.zoneCanvas) return;
    
    const tileType = zoneData.tileType || 'hex';
    
    // 1. Ask the Renderer for the literal world position of the player.
    // This ensures we use the exact same math that draws the hero.
    const playerWorldPos = this.mapRenderer.getTileCenter(
        this.state.player.pos.x, 
        this.state.player.pos.y, 
        zoneData.mapSize, 
        tileType
    );
    
    // 2. MAGI-TECH SYNC: Set panOffset to the negative of the player's world position.
    // Because the Renderer already translates to canvas.width/2, setting panOffset 
    // to -playerWorldPos perfectly centers the player.
    this.panOffset = { 
      x: -playerWorldPos.x, 
      y: -playerWorldPos.y 
    };
    
    this.zoom = 1; // Default zoom level
    this.draw();
  }

  /**
   * Get bestiary override at specific coordinates
   */
  getBestiaryAtCoords(coords) {
    const mapData = this.MapDataStore.data;
    if (!mapData) return null;
    
    const groundLayer = mapData.layers?.find(l => l.id === 'ground');
    const hex = groundLayer?.grid?.[coords.y]?.[coords.x];
    
    if (hex?.bestiaryOverride) {
      return hex.bestiaryOverride;
    }
    
    // Check for encounter data from StudioStore
    if (window.useStudioStore) {
      const store = window.useStudioStore.getState();
      const zoneId = mapData.zid || mapData.zoneId;
      const encounterKey = `${coords.x},${coords.y}`;
      const encounter = store.getEncounterAt?.(zoneId, encounterKey);
      if (encounter && encounter.length > 0) {
        return encounter;
      }
    }
    
    return null;
  }

  /**
   * [NEW] Calculates current chunk and fetches adjacent terrain to eliminate pop-in.
   */
  async updateActiveSpatialChunks(pos) {
    if (!this.MapDataStore?.data) return;
    const zoneId = this.state.zone.id;
    const CHUNK_SIZE = 50;

    const cx = Math.floor(pos.x / CHUNK_SIZE);
    const cy = Math.floor(pos.y / CHUNK_SIZE);

    const fetchPromises = [];
    for (let y = cy - 1; y <= cy + 1; y++) {
      for (let x = cx - 1; x <= cx + 1; x++) {
        if (x >= 0 && y >= 0) {
          fetchPromises.push(this.MapDataStore.fetchSpatialChunk(zoneId, x, y));
        }
      }
    }

    const results = await Promise.all(fetchPromises);
    
    // If new terrain was downloaded, refresh the canvas and collision data
    if (results.some(renderedNewData => renderedNewData === true)) {
      const mapData = this.MapDataStore.data;
      const navLayer = mapData.layers.find(l => l.type === 'navigation');
      
      // Update collision boundaries silently in the background
      if (navLayer && navLayer.id === 'nav-auto-baked') {
        navLayer.grid = this.bakeCollisionData(mapData.layers, mapData.mapSize, mapData.assetLibrary || {});
      }
      
      this.draw();
      if (this.WorldMapManager) this.WorldMapManager.draw();
    }
  }

  /**
   * Loads a specific zone, resets player spawn, and triggers a full UI/Map refresh.
   * @param {Object} zoneData - Raw JSON data from the MapDataStore.
   */
  async loadZone(zoneData) {
    this.isLoaded = false;
    if (!zoneData) return;

    // Support both 'zoneName' (GDD format) and 'name' (Editor format)
    const resolvedName = zoneData.zoneName || zoneData.name || "Unknown Region";
    console.log(`🗺️ World: Resonating Zone - ${resolvedName}`);

    // 1. Update Global State so UIManager can see it
    this.state.zone.name = resolvedName;
    // Support zid (MapEditor format), zoneId (GDD format), and id (legacy format)
    this.state.zone.id = zoneData.zid || zoneData.zoneId || zoneData.id;

    // Update the UI Title element if it exists in the HUD
    const titleEl = document.getElementById('world-map-title');
    if (titleEl) {
      titleEl.textContent = resolvedName;
    }

    // 2. Handle Player Spawning (Priority: entranceBlue > spawnPoints > 0,0)
    if (this.state.player) {
        let spawnFound = false;

        // A. Search for "entranceBlue" in the layers (fully bulletproof against non-iterable grids)
        if (!Array.isArray(zoneData.layers) && zoneData.layers) {
            zoneData.layers = Object.values(zoneData.layers);
        }
        const safeLayers = Array.isArray(zoneData.layers) ? zoneData.layers : [];
        if (safeLayers.length > 0) {
            for (const layer of safeLayers) {
                if (!layer.grid) continue;
                
                try {
                    // Normalize rows whether grid is a 2D array or an object dictionary
                    const rows = Array.isArray(layer.grid) 
                        ? layer.grid.map((r, i) => [i, r]) 
                        : Object.entries(layer.grid);
                        
                    for (const [yStr, row] of rows) {
                        if (!row) continue;
                        const y = parseInt(yStr, 10);
                        
                        const cols = Array.isArray(row) 
                            ? row.map((t, i) => [i, t]) 
                            : (typeof row === 'object' ? Object.entries(row) : []);
                        
                        for (const [xStr, tile] of cols) {
                            const x = parseInt(xStr, 10);
                            if (tile && tile.assetId === 'entranceBlue') {
                                this.state.player.pos.x = x;
                                this.state.player.pos.y = y;
                                spawnFound = true;
                                console.log(`📍 Spawn: Found Blue Entrance at [${x}, ${y}]`);
                                break;
                            }
                        }
                        if (spawnFound) break;
                    }
                } catch (e) {
                    // Suppress interim iterator errors while spatial chunks stream in asynchronously
                }
                if (spawnFound) break;
            }
        }

        // B. Fallback to Map Data Spawn Points
        if (!spawnFound && zoneData.spawnPoints && zoneData.spawnPoints.length > 0) {
            this.state.player.pos.x = zoneData.spawnPoints[0].x;
            this.state.player.pos.y = zoneData.spawnPoints[0].y;
            spawnFound = true;
        }

        // C. Last Resort (Safe Center)
        if (!spawnFound) {
            this.state.player.pos.x = Math.floor((zoneData.mapSize?.width || 10) / 2);
            this.state.player.pos.y = Math.floor((zoneData.mapSize?.height || 10) / 2);
        }
    }
    // [NEW] FORCE VISUAL CLEANUP
    // Ensure the Navigation Grid is ALWAYS hidden in Player Mode,
    // even if it was saved as "Visible" in the Editor.
    if (zoneData.layers) {
        zoneData.layers.forEach(layer => {
            if (layer.type === 'navigation') {
                layer.isVisible = false;
                layer.opacity = 0; 
            }
        });
    }
    // 3. Pre-load assets for renderer (background is loaded in MapDataStore)

    // [FIX] MASTER ASSET INJECTION
    // If the map file is empty (Total Assets: 0), merge in the Master Library.
    if (!zoneData.assetLibrary || Object.keys(zoneData.assetLibrary).length === 0) {
        console.log("⚠️ ZoneManager: Map missing assets. Injecting Master Library from config...");
        // Shallow merge: Map assets take priority, Master assets fill gaps
        zoneData.assetLibrary = { ...MASTER_ASSET_LIBRARY, ...(zoneData.assetLibrary || {}) };
    }

    // Now load them as normal
    if (this.mapRenderer && zoneData && zoneData.assetLibrary) {
      await this.mapRenderer.preloadAssets(zoneData.assetLibrary);
    }

    // [NEW] FORCE COLLISION BAKE
    // If the map has no navigation data, create it now so players don't walk through walls.
    if (!zoneData.layers.find(l => l.type === 'navigation')) {
        console.log("🛡️ ZoneManager: No Navigation Layer found. Baking collision data...");
        const bakedGrid = this.bakeCollisionData(zoneData.layers, zoneData.mapSize, zoneData.assetLibrary || {});
        
        // Inject the baked layer into the data temporarily
        zoneData.layers.push({ 
            id: 'nav-auto-baked', 
            type: 'navigation', 
            grid: bakedGrid, 
            isVisible: false, 
            opacity: 0 
        });
    }

    // [NEW] Fetch initial chunks before rendering the zone
    await this.updateActiveSpatialChunks(this.state.player.pos);

    // 4. Center camera on player (matching MapEditor's test mode behavior)
    if (this.state.player) {
      this.centerCameraOnPlayer(zoneData);
    }

    this.isLoaded = true;
    this.resizeCanvas();
    this.draw();

    // 4. Trigger secondary map updates (Mini-map)
    if (this.WorldMapManager) {
      this.WorldMapManager.draw();
    }

    // 5. Update Global HUD info (Fixes the "No Zone Loaded" label)
    if (this.UIManager) {
      this.UIManager.updatePlayerStatusUI();
    }
  }

  /**
   * Resizes the main canvas context.
   */
  resizeCanvas() {
    if (this.mapRenderer) {
      this.mapRenderer.resize();
    }
  }

/**
   * Directs the MapRenderer to draw the main player view.
   * [CLEANED] Removed logic logic. Now focuses only on rendering.
   */
  draw(timestamp) {
    if (!this.state.player || !this.mapRenderer) return;
    
    // Check if MapDataStore exists and has data
    if (!this.MapDataStore || !this.MapDataStore.data) {
      return;
    }
    
    this.mapRenderer.draw(
      this.MapDataStore.data, 
      this.state.player.pos, 
      this.MapDataStore,
      { panOffset: this.panOffset, zoom: this.zoom }
    );
  }
  
}