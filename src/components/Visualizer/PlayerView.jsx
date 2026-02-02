import React, { useRef, useEffect, useState } from 'react';
import { useMapStore, TILE_SIZE, hexUtils, getTileCenter } from './MapEditor'; 
import CombatScreen from './CombatScreen';

export default function PlayerView() {
    const canvasRef = useRef(null);
    const { 
        layers, mapSize, view, tileType, zoom, panOffset, 
        playerPosition, assetLibrary, biome, triggers, isPlayMode 
    } = useMapStore();
    
    const [imageAssetCache, setImageAssetCache] = useState({});
    const [showCombat, setShowCombat] = useState(false);

    // --- ASSET CACHE (Preserves Intricacies) ---
    useEffect(() => { 
        Object.values(assetLibrary).forEach(asset => { 
            if (asset.imageUrl && !imageAssetCache[asset.imageUrl]) { 
                const img = new Image(); 
                img.crossOrigin = 'Anonymous'; 
                img.src = asset.imageUrl; 
                img.onload = () => setImageAssetCache(prev => ({ ...prev, [asset.imageUrl]: img })); 
            } 
        }); 
    }, [assetLibrary]);

    // --- ENGINE RENDER LOOP ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const render = () => {
            ctx.fillStyle = '#1d1d1d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            
            // Sync Camera
            ctx.translate(canvas.width / 2 + panOffset.x, canvas.height / 2 + panOffset.y);
            ctx.scale(zoom, zoom);

            // Layer Logic (Ground -> Objects -> Player)
            layers.forEach(layer => {
                if (!layer.isVisible || layer.type === 'navigation') return;
                
                const renderList = [];
                for (let y = 0; y < mapSize.height; y++) {
                    for (let x = 0; x < mapSize.width; x++) {
                        const tile = layer.grid[y][x];
                        if (!tile) continue;
                        renderList.push({ tile, x, y, depth: y + x + (layer.id === 'objects' ? 0.5 : 0) });
                    }
                }
                
                // Depth Sorting for Z-Axis consistency
                renderList.sort((a, b) => a.depth - b.depth);

                renderList.forEach(item => {
                    const center = getTileCenter(item.x, item.y, view, tileType, mapSize);
                    
                    if (layer.id === 'ground') {
                        // Render Terrain Hexes
                        ctx.save();
                        ctx.translate(center.x, center.y);
                        const points = hexUtils.getHexPoints(TILE_SIZE / Math.sqrt(3));
                        ctx.beginPath();
                        ctx.moveTo(points[0], points[1]);
                        for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
                        ctx.closePath();
                        ctx.fillStyle = 'rgba(74, 107, 74, 0.3)'; 
                        ctx.fill();
                        ctx.restore();
                    } else if (item.tile.assetId) {
                        // Render Assets with established yOffsets
                        const asset = assetLibrary[item.tile.assetId];
                        const img = imageAssetCache[asset?.imageUrl];
                        if (img && img.complete) {
                            const scale = asset.scale || 1;
                            const yOffset = asset.yOffset || 0;
                            const imgSize = TILE_SIZE * scale;
                            const aspectRatio = img.height / img.width;
                            ctx.drawImage(img, center.x - imgSize/2, center.y - (imgSize * aspectRatio)/2 + yOffset, imgSize, imgSize * aspectRatio);
                        }
                    }
                });
            });

            // Player Blip
            if (playerPosition) {
                const pCenter = getTileCenter(playerPosition.x, playerPosition.y, view, tileType, mapSize);
                ctx.fillStyle = '#ff69b4';
                ctx.beginPath();
                ctx.arc(pCenter.x, pCenter.y, TILE_SIZE / 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        };

        const animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [layers, zoom, panOffset, playerPosition, imageAssetCache, mapSize, view, tileType]);

    return (
        <div className="relative w-full h-full bg-[#1d1d1d] overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full" width={window.innerWidth} height={window.innerHeight} />
            
            {/* PLAYER HUD (Minimalist) */}
            <div className="absolute top-4 left-4 glass-panel p-3 rounded-lg border-teal-500/30">
                <h1 className="font-cinzel text-teal-400 text-lg">GEMINUS</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Zone: {biome}</p>
            </div>
        </div>
    );
}