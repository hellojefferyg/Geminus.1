/**
 * Master ReceiverBridge: The 'Brain' of the Editor-Player connection.
 * Synchronized to handle asynchronous materialization from the MapDataStore.
 */
window.GDD = window.GDD || {};

window.addEventListener('message', async (event) => {
    // Security: Only accept messages from trusted local origins
    if (!event.origin.includes('localhost') && !event.origin.includes('127.0.0.1')) return;

    const { type, payload } = event.data;

    if (type === 'INIT_STUDIO_BRIDGE') {
        console.log("📥 Bridge: Materializing Studio Data...");

        // 1. Sync Global Data for GDD consistency
        window.GDD = { 
            races: payload.races, 
            constants: payload.constants, 
            map: payload.map 
        };

        if (window.game) {
            const managers = window.game.managers;

            // 2. Trigger Materialization via MapDataStore
            if (managers?.mapDataStore) {
                await managers.mapDataStore.load(payload.map);
            }

            // 3. Ensure the ZoneManager is ready for the new map data
            if (managers?.zoneManager) {
                managers.zoneManager.isLoaded = true;
                
                // Sync the zone name display in the UI
                if (window.game.state.zone) {
                    window.game.state.zone.name = payload.map.zoneName || "Studio Preview";
                }
            }

            // 4. Sync Player State from the Editor's perspective
            window.game.state.player = payload.map.player || { 
                name: "Studio_Tester", 
                race: "human", 
                pos: { x: 12, y: 12 } 
            };

            // 5. Force the final Materialized Draw
            // This now uses the warm assetImages cache created in step 2
            if (managers?.zoneManager) {
                managers.zoneManager.draw();
            }
            
            console.log(`✅ Bridge: [${payload.map.zoneName || 'Map'}] Materialized Successfully.`);
        }
    }

    /**
     * Real-time position synchronization for Editor drag-and-drop testing.
     */
    if (type === 'PLAYER_MOVED') {
        if (window.game?.state?.player) {
            window.game.state.player.pos = payload;
            
            // Re-render immediately on movement
            if (window.game.managers?.zoneManager) {
                window.game.managers.zoneManager.draw();
            }
        }
    }
});