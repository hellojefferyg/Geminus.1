/**
 * @file src/managers/world/MapRenderer.js
 * @description Full-featured map renderer.
 * INTEGRITY CHECK: Restored Particle System, Multiplayer Entities, and Cursor Logic.
 */

// --- VIDEO ASSET REGISTRY ---
// This maps the GDD Race Name to the corresponding Video Asset Path.
const RACE_VIDEO_ASSETS = {
    'vampire': '/Visual-Effects/Animations/Races/Vampire/Female_Vampire_Idle_Walk.mp4',
    'human': '/Visual-Effects/Animations/Human_Idle_Walk.mp4', // Placeholder
    'orc': '/Visual-Effects/Animations/Orc_Idle_Walk.mp4',     // Placeholder
    // Add all 24 races here as you generate them...
};

export class MapRenderer {
  constructor(canvas, isMiniMap = false) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.isMiniMap = isMiniMap;
    this.assetImageCache = {}; // Cache for asset images
    this.backgroundImage = null; // Cached background image
    
    // EDITOR CONSTANTS
    this.TILE_SIZE = 64;
    
    // PARTICLE SYSTEM STATE
    this.particles = [];
    this.lastFrameTime = 0;
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const container = this.canvas.parentElement;
    if (!container) return;
    
    // Exact sizing to parent container
    this.canvas.width = container.clientWidth * dpr;
    this.canvas.height = container.clientHeight * dpr;
    
    // Normalize scale to device pixels
    this.ctx.scale(dpr, dpr);
  }

  getHexPoints(size) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle_deg = 60 * i - 30;
      const angle_rad = Math.PI / 180 * angle_deg;
      points.push(size * Math.cos(angle_rad), size * Math.sin(angle_rad));
    }
    return points;
  }

  /**
   * Calculate tile center position - 1:1 Match with MapEditor.jsx
   */
  getTileCenter(x, y, mapSize, tileType = 'hex', view = 'topdown') {
    const TILE_SIZE = this.isMiniMap ? 15 : this.TILE_SIZE;
    
    // MATH SYNC: Use Math.floor to match the click coordinate math
    const mapCenterX = Math.floor(mapSize.width / 2);
    const mapCenterY = Math.floor(mapSize.height / 2);

    if (view === 'isometric') {
      if (tileType === 'square') {
        // Iso Square
        const center = { 
            x: (x - mapCenterX - (y - mapCenterY)) * (TILE_SIZE / 2), 
            y: (x - mapCenterX + (y - mapCenterY)) * (TILE_SIZE / 4) 
        };
        return center;
      } else { 
        // Iso Hex
        const s = TILE_SIZE / 2;
        const w = Math.sqrt(3) * s; 
        const h = 2 * s; 
        const o = (y % 2 !== 0) ? w / 2 : 0; 
        return { x: (x - mapCenterX) * w + o, y: (y - mapCenterY) * h * 0.75 }; 
      }
    } else {
      // TopDown (Default)
      if (tileType === 'square') {
        return { x: (x - mapCenterX + 0.5) * TILE_SIZE, y: (y - mapCenterY + 0.5) * TILE_SIZE };
      } else { 
        // Hex TopDown - Pointy Top
        const s = TILE_SIZE / Math.sqrt(3); 
        const w = Math.sqrt(3) * s; 
        const h = 2 * s; 
        const o = (y % 2 !== 0) ? w / 2 : 0; 
        return { x: (x - mapCenterX) * w + o, y: (y - mapCenterY) * h * 0.75 }; 
      }
    }
  }

  hexToRgba(hex, alpha) {
    if (!hex) return `rgba(128, 128, 128, ${alpha})`;
    if (hex.startsWith('rgba')) return hex;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  stringToColor(str) {
    let hash = 0; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); } let color = '#'; for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xFF; color += ('00' + value.toString(16)).substr(-2); } return color;
  }

  async loadBackgroundImage(backgroundImageData) {
    if (!backgroundImageData) { this.backgroundImage = null; return; }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.backgroundImage = img; resolve(img); };
      img.onerror = () => { console.warn('Failed to load BG'); this.backgroundImage = null; resolve(null); };
      img.src = backgroundImageData;
    });
  }

  /**
   * Preloads assets with a staggered delay to prevent 429 "Too Many Requests" errors.
   */
  async preloadAssets(assetLibrary) {
    if (!assetLibrary) return;
    const entries = Object.entries(assetLibrary);

    for (const [id, asset] of entries) {
      if (asset.imageUrl && !this.assetImageCache[asset.imageUrl]) {
        // SURGICAL FIX: 50ms stagger prevents the server from blocking your IP
        await new Promise(r => setTimeout(r, 50)); 
        
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        // Wrap the image loading in a promise to ensure it finishes
        await new Promise((resolve) => {
          img.onload = () => { 
            this.assetImageCache[asset.imageUrl] = img; 
            resolve(); 
          };
          img.onerror = () => { 
            console.warn('Asset Load Fail:', id); 
            resolve(); 
          };
          
          // Maintain your existing GitHub Raw Fix logic
          let src = asset.imageUrl;
          if (src.includes('github.com') && !src.includes('raw.githubusercontent.com')) {
            src = src.replace('github.com', 'raw.githubusercontent.com')
                     .replace('/blob/', '/')
                     .replace('/refs/heads/', '/');
          }
          img.src = src;
        });
      }
    }
  }

  /**
   * MAIN DRAW LOOP
   * Matches MapEditor.jsx exactly, including transformations, scaling, depth sorting, AND particles.
   */
  draw(mapData, playerPos, MapDataStore, options = {}) {
    if (!this.ctx || !this.canvas || !mapData) return;

    const ctx = this.ctx;
    // Clear Screen
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    ctx.fillStyle = '#0c101d'; // Darker theme background
    ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    const TILE_SIZE = this.isMiniMap ? 15 : this.TILE_SIZE;
    const mapSize = mapData.mapSize || { width: 15, height: 15 };
    const biome = mapData.biome || 'forest';
    const tileType = mapData.tileType || 'hex';
    const view = mapData.initialView?.view || 'topdown';
    
    // Biome Colors
    const BIOME_COLORS = { 
        forest: '#4A6B4A', desert: '#D2B48C', tundra: '#FFFAFA', mountain: '#696969', swamp: '#556B2F', 
        jungle: '#006400', volcanic: '#2F4F4F', plains: '#90EE90', ocean: '#1E90FF', wasteland: '#CD853F',
        savanna: '#E4A672', taiga: '#465945', wetlands: '#5A6349', badlands: '#B97C5B', archipelago: '#2E8B57',
        fungalForest: '#8A2BE2', crystallineCaves: '#AFEEEE', corruptedLands: '#4B0082', feywild: '#FF69B4', 
        shadowlands: '#483C32', celestialPlains: '#F0E68C', Clear: 'rgba(0,0,0,0)',
    };

    ctx.save();

    // 1. GLOBAL TRANSFORM: Center Origin + Pan + Zoom
    const panOffset = options.panOffset || { x: 0, y: 0 };
    const zoom = options.zoom !== undefined ? options.zoom : 1;
    
    // IMPORTANT: This translate matches the Editor's: canvas.width/2 + pan
    ctx.translate(this.canvas.clientWidth / 2 + panOffset.x, this.canvas.clientHeight / 2 + panOffset.y);
    ctx.scale(zoom, zoom);

    // 2. BACKGROUND IMAGE
    const bgImg = MapDataStore?.getBackgroundImage() || this.backgroundImage;
    if (bgImg && bgImg.complete) {
        const s = TILE_SIZE / Math.sqrt(3); const w = Math.sqrt(3) * s; const h = 2 * s;
        let totalW, totalH, shiftY = 0;

        if (mapData.zid === "Z00" || mapData.zoneName === "The Convergence") {
            totalW = (mapSize.width + 0.5) * w;
            totalH = (mapSize.height * 0.75 + 0.25) * h;
        } else {
            totalW = mapSize.width * TILE_SIZE;
            totalH = mapSize.height * (tileType === 'hex' ? TILE_SIZE * 1.5 : TILE_SIZE);
            shiftY = (totalH - (mapSize.height * 0.75 * h)) / 4;
        }
        
        ctx.drawImage(bgImg, -totalW / 2, (-totalH / 2) + shiftY, totalW, totalH);
    }

    // 3. LAYERS & CULLING
    const groundLayer = mapData.layers.find(l => l.id === 'ground');
    const renderList = [];

    // Frustum Culling
    const s = TILE_SIZE / Math.sqrt(3); const w = Math.sqrt(3) * s; const h = 2 * s;
    const buffer = 2;
    // Reverse math relative to center
    const startX = Math.max(0, Math.floor(((-this.canvas.clientWidth / 2 - panOffset.x) / zoom) / w + mapSize.width/2) - buffer);
    const endX = Math.min(mapSize.width - 1, Math.ceil(((this.canvas.clientWidth / 2 - panOffset.x) / zoom) / w + mapSize.width/2) + buffer);
    const startY = Math.max(0, Math.floor(((-this.canvas.clientHeight / 2 - panOffset.y) / zoom) / (h * 0.75) + mapSize.height/2) - buffer);
    const endY = Math.min(mapSize.height - 1, Math.ceil(((this.canvas.clientHeight / 2 - panOffset.y) / zoom) / (h * 0.75) + mapSize.height/2) + buffer);

    mapData.layers.forEach(layer => {
        if (!layer.isVisible) return;
        ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

        if (layer.type === 'visual') {
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    const tile = layer.grid[y]?.[x];
                    if (!tile) continue;

                    const groundTile = groundLayer?.grid[y]?.[x];
                    const isVoid = !groundTile || groundTile.type === 'empty' || groundTile.type === 'wall';
                    const asset = mapData.assetLibrary?.[tile.assetId];
                    const isCore = asset?.type === 'Core Interactives' || asset?.type === 'Estate Buildings';

                    // Clean Grid Logic
                    if (mapData.cleanGrid && !isCore && (isVoid || groundTile?.type === 'empty')) continue;

                    if (layer.id === 'ground') {
                        renderList.push({ type: 'tile', tile, x, y, depth: y + x });
                    } else if (tile.assetId) {
                        renderList.push({ type: 'asset', tile, x, y, depth: y + x + 0.5 });
                    }
                }
            }
        } else if (layer.type === 'trigger' && !this.isMiniMap) {
            // Render Triggers
             for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    const t = layer.grid[y]?.[x];
                    if (t && t.eventId) {
                        const c = this.getTileCenter(x, y, mapSize, tileType, view);
                        const col = this.stringToColor(t.eventId);
                        ctx.fillStyle = this.hexToRgba(col, 0.3);
                        this.drawPoly(ctx, c.x, c.y, TILE_SIZE, tileType, view);
                        ctx.fill();
                    }
                }
             }
        } else if (layer.type === 'navigation' && layer.isVisible) {
             // Render Nav
             for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    const val = layer.grid[y]?.[x];
                    if (val !== undefined) {
                        const c = this.getTileCenter(x, y, mapSize, tileType, view);
                        const isWalk = val === 1;
                        ctx.fillStyle = isWalk ? 'rgba(0,255,100,0.3)' : 'rgba(255,0,0,0.3)';
                        this.drawPoly(ctx, c.x, c.y, TILE_SIZE, tileType, view);
                        ctx.fill();
                    }
                }
             }
        }
    });

    // 4. EXECUTE RENDER LIST (Sorted)
    renderList.sort((a, b) => a.depth - b.depth);

    renderList.forEach(item => {
        const { tile, x, y } = item;
        const center = this.getTileCenter(x, y, mapSize, tileType, view);

        if (item.type === 'tile') {
            const isNonPlayable = tile.type === 'empty' || tile.type === 'wall';
            if (isNonPlayable) return;

            const color = BIOME_COLORS[biome] || BIOME_COLORS.forest;
            ctx.fillStyle = this.hexToRgba(color, 1);
            
            // Draw Grid Lines (faint)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            this.drawPoly(ctx, center.x, center.y, TILE_SIZE, tileType, view);
            ctx.fill();
            if(!this.isMiniMap) ctx.stroke();

        } else if (item.type === 'asset') {
            const asset = mapData.assetLibrary?.[tile.assetId];
            const img = asset ? (this.assetImageCache[asset.imageUrl] || MapDataStore.assetImages?.[asset.imageUrl]) : null;

            if (asset) {
                // 1. Asset Exists in Library
                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.save();
                    ctx.translate(center.x, center.y);
                    if (tile.rotation) ctx.rotate((tile.rotation * Math.PI) / 180);
                    if (tile.flipped) ctx.scale(-1, 1);

                    const scale = asset.scale || 1;
                    const yOffset = asset.yOffset || 0;
                    const size = TILE_SIZE * scale;
                    const ratio = img.height / img.width;

                    ctx.drawImage(img, -size/2, -(size*ratio)/2 + yOffset, size, size*ratio);
                    ctx.restore();
                } 
                // 2. Debug: Asset found, but Image broken (Pink)
                else {
                    ctx.save();
                    ctx.translate(center.x, center.y);
                    ctx.fillStyle = 'rgba(255, 0, 255, 0.5)'; // Magenta
                    ctx.fillRect(-TILE_SIZE/4, -TILE_SIZE/4, TILE_SIZE/2, TILE_SIZE/2);
                    ctx.restore();
                }
            } 
            // 3. CRITICAL DEBUG: Asset MISSING from Library (Red)
            else {
                ctx.save();
                ctx.translate(center.x, center.y);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Red
                ctx.fillRect(-TILE_SIZE/3, -TILE_SIZE/3, TILE_SIZE/1.5, TILE_SIZE/1.5);
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.strokeRect(-TILE_SIZE/3, -TILE_SIZE/3, TILE_SIZE/1.5, TILE_SIZE/1.5);
                
                // Draw the ID so we know what is missing
                ctx.fillStyle = '#fff';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('MISSING', 0, -5);
                ctx.fillText(tile.assetId?.substring(0, 5) || '???', 0, 5);
                ctx.restore();
            }

            // BADGES
            if (tile.properties?.interactionType && tile.properties.interactionType !== 'none') {
                this.drawBadge(ctx, center, tile.properties.interactionType, zoom, TILE_SIZE);
            }
        }
    });

    // 5. DRAW PLAYER (Hybrid Engine: Video > Static WebP > Fallback)
    if (playerPos) {
        const pc = this.getTileCenter(playerPos.x, playerPos.y, mapSize, tileType, view);
        const video = document.getElementById('game-player-video');
        const img = document.getElementById('game-player-avatar');
        
        ctx.save();
        // Standardized scale for 24-race parity
        const drawWidth = TILE_SIZE * 1.1; 

        // PRIORITY 1: Animated Video (e.g., Vampire)
        if (video && video.readyState >= 2 && !video.paused) {
            const vHeight = drawWidth * (video.videoHeight / video.videoWidth);
            ctx.globalCompositeOperation = 'multiply'; // Removes white background
            ctx.drawImage(
                video, 
                pc.x - drawWidth / 2, 
                pc.y - vHeight + (TILE_SIZE / 2), 
                drawWidth, 
                vHeight
            );
        } 
        // PRIORITY 2: Static WebP Avatar (e.g., Aasimar, Angel, etc.)
        else if (img && img.complete && img.naturalWidth !== 0) {
            const aspect = img.naturalHeight / img.naturalWidth;
            const iHeight = drawWidth * aspect;
            ctx.drawImage(
                img, 
                pc.x - drawWidth / 2, 
                pc.y - iHeight + (TILE_SIZE / 2), 
                drawWidth, 
                iHeight
            );
        } 
        // PRIORITY 3: Manual Fallback Icon (Cyan Bolt)
        else {
            const pRad = tileType === 'hex' ? TILE_SIZE / 2.5 : TILE_SIZE / 3;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(pc.x, pc.y, pRad, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.9)'; 
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.font = `bold ${TILE_SIZE * 0.4}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', pc.x, pc.y + 1);
        }
        ctx.restore();
    }

    // 6. DRAW OTHER PLAYERS (Multiplayer Ghosts)
    // Checks the mapData for otherPlayers which might be injected by the engine
    if (mapData.otherPlayers) {
        Object.values(mapData.otherPlayers).forEach(p => {
            const center = this.getTileCenter(p.x, p.y, mapSize, tileType, view);
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(center.x, center.y, TILE_SIZE / 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Name tag
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.name, center.x, center.y - 25);
            ctx.restore();
        });
    }

    // 7. MOUSE HIGHLIGHT (If coords provided in options)
    if (options.mouseCoords && options.mouseCoords.x !== -1) {
        const mc = this.getTileCenter(options.mouseCoords.x, options.mouseCoords.y, mapSize, tileType, view);
        ctx.save();
        ctx.strokeStyle = 'rgba(202, 233, 234, 0.75)';
        ctx.fillStyle = 'rgba(202, 233, 234, 0.25)';
        ctx.lineWidth = 2 / zoom;
        this.drawPoly(ctx, mc.x, mc.y, TILE_SIZE, tileType, view);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // 8. PARTICLE SYSTEM (Weather Effects)
    if (!this.isMiniMap && mapData.backgroundAnimation && mapData.backgroundAnimation !== 'none') {
        this.updateAndDrawParticles(ctx, mapData.backgroundAnimation, mapData.animationSpeed || 1, zoom, panOffset);
    }

    ctx.restore(); // End Global Transform

    // 9. DRAW ZONE NAME (Overlay on top of transform)
    if (!this.isMiniMap && mapData.zoneName) {
      ctx.save();
      const fontName = 'Cinzel';
      const dynamicFontSize = Math.min(this.canvas.clientWidth / 15, 40);
      const yPos = 20;

      const gradient = ctx.createLinearGradient(0, yPos, 0, yPos + dynamicFontSize);
      gradient.addColorStop(0, '#FFFDE4');
      gradient.addColorStop(1, '#cae9ea');
      
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

      ctx.strokeText(mapData.zoneName, this.canvas.clientWidth / 2, yPos);
      ctx.fillText(mapData.zoneName, this.canvas.clientWidth / 2, yPos);
      ctx.restore();
    }
  }

  // --- HELPER DRAW FUNCTIONS ---

  drawPoly(ctx, x, y, size, type, view) {
    ctx.beginPath();
    if (type === 'square') {
       const TILE_WIDTH = size;
       const TILE_HEIGHT = view === 'isometric' ? size / 2 : size;
       if (view === 'isometric') {
          ctx.moveTo(x, y - TILE_HEIGHT/2);
          ctx.lineTo(x + TILE_WIDTH/2, y);
          ctx.lineTo(x, y + TILE_HEIGHT/2);
          ctx.lineTo(x - TILE_WIDTH/2, y);
       } else {
          ctx.rect(x - size/2, y - size/2, size, size);
       }
    } else {
       // Hex
       const hexSize = view === 'isometric' ? size/2 : size / Math.sqrt(3);
       const points = this.getHexPoints(hexSize);
       ctx.moveTo(x + points[0], y + points[1]);
       for (let i = 2; i < points.length; i += 2) ctx.lineTo(x + points[i], y + points[i+1]);
    }
    ctx.closePath();
  }

  drawBadge(ctx, center, type, zoom, tileSize) {
     const badgeSize = (tileSize / 4) / zoom;
     const offset = (tileSize / 3);
     const bx = center.x + offset;
     const by = center.y - offset;

     ctx.save();
     ctx.beginPath();
     ctx.arc(bx, by, badgeSize, 0, Math.PI*2);
     ctx.fillStyle = 'rgba(0,0,0,0.9)';
     ctx.fill();

     let icon = '!', color = '#fff';
     switch(type) {
        case 'warp': icon = '🚪'; color = '#4fd1c5'; break;
        case 'npc': icon = '💬'; color = '#63b3ed'; break;
        case 'boss': icon = '💀'; color = '#fc8181'; break;
        case 'quest_item': icon = '📦'; color = '#d6bcfa'; break;
     }
     
     ctx.strokeStyle = color;
     ctx.lineWidth = 1.5/zoom;
     ctx.stroke();
     ctx.fillStyle = color;
     ctx.font = `${badgeSize}px sans-serif`;
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(icon, bx, by+1);
     ctx.restore();
  }

  // --- PARTICLE SYSTEM LOGIC (Ported from MapEditor.jsx) ---
  updateAndDrawParticles(ctx, type, speed, zoom, panOffset) {
    const width = this.canvas.clientWidth / zoom;
    const height = this.canvas.clientHeight / zoom;
    
    // Adjust boundaries relative to view
    const left = (-this.canvas.clientWidth / 2 - panOffset.x) / zoom;
    const top = (-this.canvas.clientHeight / 2 - panOffset.y) / zoom;

    // Initialize particles if empty
    if (this.particles.length === 0) {
        for(let i=0; i<100; i++) {
            this.particles.push(this.createParticle(type, left, top, width, height, speed));
        }
    }

    // Update and Draw
    this.particles.forEach(p => {
        p.life++;
        
        // Movement Logic
        switch(type) {
            case 'fallingLeaves':
                p.x += p.vx + Math.sin(p.life * 0.05) * 0.3;
                p.y += p.vy;
                p.angle += p.spin;
                break;
            case 'swirlingSand':
                p.x += p.vx;
                p.y += p.vy;
                break;
            case 'gentleSnowfall':
                p.x += p.vx;
                p.y += p.vy;
                break;
            case 'floatingEmbers':
                p.x += p.vx;
                p.y += p.vy;
                break;
            case 'mysticalWisps':
                p.x += p.vx + Math.sin(p.life * 0.02) * 0.2;
                p.y += p.vy + Math.cos(p.life * 0.02) * 0.2;
                break;
        }

        // Reset if out of bounds or dead
        if (p.life > p.maxLife || p.y > top + height + 50 || p.x > left + width + 50) {
            Object.assign(p, this.createParticle(type, left, top, width, height, speed));
            p.life = 0;
        }

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        const progress = p.life / p.maxLife;
        const opacity = Math.sin(progress * Math.PI);
        
        if (type === 'fallingLeaves') {
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
            ctx.fill();
        }
        ctx.restore();
    });
  }

  createParticle(type, left, top, width, height, speed) {
      // Random start position within view
      const x = left + Math.random() * width;
      const y = top + Math.random() * height;
      
      let p = { x, y, life: Math.random() * 100, maxLife: 100 + Math.random() * 200 };
      
      switch(type) {
        case 'fallingLeaves':
            p.vx = (Math.random() - 0.5) * 0.5 * speed;
            p.vy = (0.5 + Math.random() * 0.5) * speed;
            p.size = 4 + Math.random() * 4;
            p.color = `rgb(${100 + Math.random() * 50}, ${150 + Math.random() * 50}, 50)`;
            p.angle = Math.random() * Math.PI * 2;
            p.spin = (Math.random() - 0.5) * 0.1;
            break;
        case 'swirlingSand':
            p.vx = (1 + Math.random() * 2) * speed;
            p.vy = (Math.random() - 0.5) * 0.2 * speed;
            p.color = `rgb(210, 180, 140)`;
            p.size = 1 + Math.random() * 2;
            break;
        case 'gentleSnowfall':
            p.vx = (Math.random() - 0.5) * 0.2 * speed;
            p.vy = (1 + Math.random()) * speed;
            p.color = `rgb(255, 255, 255)`;
            p.size = 2 + Math.random() * 2;
            break;
        default:
            p.vx = (Math.random() - 0.5) * 0.3 * speed;
            p.vy = (Math.random() - 0.5) * 0.3 * speed;
            p.color = `rgb(200, 200, 255)`;
            p.size = 2 + Math.random() * 4;
      }
      return p;
  }
}