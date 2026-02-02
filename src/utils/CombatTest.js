/**
 * GEMINUS COMBAT INTEGRATION TEST
 * This script verifies the link between:
 * 1. CombatScreen.jsx (Visuals/React)
 * 2. CombatManager.js (Backend/Managers)
 * 3. Systems.js (Math/Formulas)
 */

export const triggerTestCombat = () => {
    console.log("⚔️ Geminus: Initializing Integration Test...");

    // 1. Get current state from window (set by initializeGlobals)
    const { state, Systems, CombatManager, showToast } = window;

    if (!CombatManager || !Systems) {
        console.error("❌ Test Failed: Managers not found on window. Check managers.js!");
        return;
    }

    // 2. Mock a basic enemy from your Bestiary (matches gdd.js)
    const testEnemy = {
        id: "shadow_assassin_test",
        name: "Test Shadow Assassin",
        hp: 500,
        level: 5,
        baseDamage: 25
    };

    console.log(`👾 Targeting: ${testEnemy.name}`);

    // 3. Trigger the Combat Manager
    // This should theoretically open your CombatScreen.jsx modal
    try {
        CombatManager.initiateBattle(testEnemy);
        showToast(`Battle Started: ${testEnemy.name}`, false);
        
        // 4. Verify Math Bridge
        const playerPower = Systems.calculateDerivedStats(state.player);
        console.log("📊 Player Combat Stats calculated via Systems.js:", playerPower);
        
    } catch (err) {
        console.error("❌ Integration Bridge Broken:", err.message);
    }
};

// Auto-run if pasted in console
// triggerTestCombat();