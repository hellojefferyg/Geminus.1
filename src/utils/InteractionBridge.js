import { useStudioStore } from '../stores/StudioStore';

/**
 * InteractionBridge: The synchronization layer between React state and HTML Views.
 * Prevents data drift and ensures the "GDD Golden Rule" of a single source of truth.
 */
export const InteractionBridge = {
    /**
     * Initializes the bridge. Call this in your App root or InteractionModal.
     * @param {HTMLIFrameElement} iframeRef - The target HTML module iframe.
     */
    sync: (iframeRef) => {
        if (!iframeRef || !iframeRef.contentWindow) return;

        const state = useStudioStore.getState();
        
        // --- UPDATED GDD_PAYLOAD (No-Strip Version) ---
// 1. Construct the GDD Global Object for the iframe
const GDD_PAYLOAD = {
    // A. Keep ALL your existing Master Data constants
    ...state.masterData.constants,

    // B. INJECT: Partner's balanced constants and formulas from gdd.js
    formulas: {
        BASE_GEM_DROP: 1/250,      // Matches gdd.js BASE_GEM_DROP_CHANCE
        BASE_SHADOW_DROP: 1/600,   // Matches gdd.js BASE_SHADOW_DROP_CHANCE
        XP_GROWTH: 1.12            // Matches gdd.js XP_GROWTH_RATE
    },

    // C. PRESERVE: All your existing engine properties
    races: state.masterData.races,
    armory: state.masterData.armory,
    arcanum: state.masterData.arcanum,
    jewelry: state.masterData.jewelry,
    gems: state.masterData.gems,
    zones: state.masterData.zones,
    bestiary: state.masterData.bestiary,
    monsterTitles: state.masterData.monsterTitles,
    vault: state.masterData.vault,
    soulforge: state.masterData.soulforge,
    enchantments: state.masterData.enchantments,
    clans: state.masterData.clans,
    portal: state.masterData.portal
};

        // 2. Construct the Game Player Object (Matches your UI logic)
        const GAME_PAYLOAD = {
            player: state.masterData.player,
            clans: state.masterData.clans || [],
            // Add helper methods to the iframe context if needed
            save: () => InteractionBridge.dispatchAction('SAVE_GAME', {}),
        };

        // 3. Inject into Iframe Window
        const target = iframeRef.contentWindow;
        target.GDD = GDD_PAYLOAD;
        target.game = GAME_PAYLOAD;
        
        // Trigger the "DOMContentLoaded" equivalent in the HTML if it already loaded
        if (target.initModule) target.initModule(GAME_PAYLOAD, GDD_PAYLOAD);
        
        console.log("⚛️ Bridge: State injected into HTML Module.");
    },

    /**
     * Listens for messages sent from HTML modules via window.parent.postMessage
     */
    listen: () => {
        window.addEventListener('message', (event) => {
            const { type, payload } = event.data;
            if (!type) return;

            const store = useStudioStore.getState();

            switch (type) {
                case 'BUY_ITEM':
                    // Logic: Validate gold -> Update inventory -> Update store
                    if (store.masterData.player.gold >= payload.cost) {
                        store.addReward(0, -payload.cost, payload.item);
                        InteractionBridge.sendNotification('Purchase Successful!', 'success');
                    }
                    break;

                case 'SHATTER_ITEM':
                    // Logic: Remove item -> Add essence
                    // Implementation in StudioStore addReward/updatePlayer
                    break;

                case 'UPGRADE_BUILDING':
                    store.updateData(`clans.buildings.${payload.id}`, 'level', payload.newLevel);
                    break;

                default:
                    console.warn(`⚠️ Bridge: Unknown action type "${type}"`);
            }
        });
    },

    sendNotification: (msg, theme) => {
        // Dispatches to your UI notification system
        console.log(`[${theme.toUpperCase()}] ${msg}`);
    }
};