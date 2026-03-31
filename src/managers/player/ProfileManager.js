// src/managers/player/ProfileManager.js
import { races, gddConstants } from '../../config/gdd.js';

export class ProfileManager {
  constructor(deps) {
    this.state = deps.state;
    this.showToast = deps.showToast;
    this.Systems = deps.Systems;
    this.DataManager = deps.DataManager;
    this.CombatManager = null; // Set later via GameManager.setManagers
    this.StatsManager = null; // Set later
    this.UIManager = null; // Set later
  }

  setManagers(managers) {
    this.CombatManager = managers.CombatManager;
    this.StatsManager = managers.StatsManager;
    this.UIManager = managers.UIManager;

    // [CRITICAL FIX] Run integrity check immediately on load to fix Save Data
    this.fixDataIntegrity();
  }
  /**
   * [NEW] Dynamic Visual Sync: Updates the global hero video source based on player race.
   * Follows the GDD Race naming convention for file paths.
   */
  syncHeroVideo() {
    const p = this.state.player;
    if (!p || !p.race) return;

    const video = document.getElementById('game-player-video');
    if (!video) return;

    // Path Pattern: /Visual-Effects/Animations/Races/[Race]/Female_[Race]_Idle_Walk.mp4
    const raceFolder = p.race.charAt(0).toUpperCase() + p.race.slice(1).toLowerCase();
    const raceFile = `Female_${raceFolder}_Idle_Walk.mp4`;
    const fullPath = `/Visual-Effects/Animations/Races/${raceFolder}/${raceFile}`;

    // Only update the source if it actually changes to prevent reset flickers
    if (video.getAttribute('src') !== fullPath) {
        console.log(`🎬 Visual Engine: Materializing ${raceFolder} Avatar...`);
        video.src = fullPath;
        video.load();
        
        // Ensure the video starts playing immediately so the Canvas can 
        // capture movement, not just a static frame.
        video.play().catch(err => {
            console.warn("🎬 Visual Engine: Autoplay blocked. Interaction required.", err);
        });
    }
  }
  /**
   * [NEW] Self-Healing Routine
   * 1. Grants "Birthright" stats to fresh characters (Fixes NaN bug).
   * 2. Wipes "Ghost Levels" from corrupted saves (Fixes 40 levels bug).
   */
  fixDataIntegrity() {
    const p = this.state.player;
    if (!p) return;

    // Fix 1: Ghost Levels (The "40 Points" Bug)
    // If a Level 1 player has more than 5 points, it's legacy data. Wipe it.
    if (p.level === 1 && (p.attributePoints || 0) > 5) {
        console.warn("⚠️ ProfileManager: Detected Ghost Levels. Exorcising...");
        p.attributePoints = 0;
        this.DataManager.updatePlayer({ attributePoints: 0 });
    }

    // Fix 2: Missing Birthright Stats (The "NaN" Bug)
    const hasValidStats = p.baseStats && Object.values(p.baseStats).some(val => val > 0);
    
    if (!hasValidStats) {
        console.log("🌱 ProfileManager: Seeding Birthright Stats...");
        
        // [FIX] Handle Case Sensitivity (e.g., "Orc" vs "ORC")
        const raceKey = p.race.toUpperCase(); 
        const racialData = races[raceKey];

        if (racialData && racialData.apWeights) {
            // [NEW] Permanently fix the casing in the save file
            p.race = raceKey; 

            // Clone the racial weights as the starting stats
            p.baseStats = { ...racialData.apWeights };
            
            // Recalculate derived stats immediately
            this.Systems.calculateDerivedStats(p);
            p.hp = p.derivedStats.maxHp; // Full heal on birth
            
            // Save immediately
            this.DataManager.updatePlayer({ 
                baseStats: p.baseStats,
                derivedStats: p.derivedStats,
                hp: p.hp
            });
            
            // Force a UI Refresh so you see the numbers instantly
            this.updateAllProfileUI();
        } else {
            console.error(`❌ ProfileManager: Could not find racial data for '${raceKey}'`);
        }
    }
  }

  addXp(amount) {
    if (!this.state.player) return;

    this.state.player.xp += amount;

    if (this.CombatManager) {
      this.CombatManager.logToGame(`You gained <span class="log-xp">${Math.floor(amount)} XP</span>!`);
    }

    // [UPDATED] Banked Leveling Logic
    // We removed the 'while' loop that auto-leveled the player.
    // Now we just update the UI. The 'Level Up' availability is calculated
    // visually by the Systems logic, but the actual Level number stays static
    // until the user clicks 'Allocate'.
    
    this.updateAllProfileUI();
    
    this.DataManager.updatePlayer({
      xp: this.state.player.xp,
      attributePoints: this.state.player.attributePoints,
      level: this.state.player.level // Ensure level is synced but NOT incremented here
    });
  }

  addGold(amount) {
    if (!this.state.player) return;

    this.state.player.gold += amount;

    if (this.CombatManager) {
      this.CombatManager.logToGame(`You found <span class="log-gold">${Math.floor(amount)} Gold</span>!`);
    }

    this.updateAllProfileUI();
    this.DataManager.updatePlayer({ gold: this.state.player.gold });
  }

  // NOTE: The old levelUp() method is removed because leveling now happens
  // transactionally inside allocateAllPoints() to support the Banking System.

  /**
   * Dumps ALL banked levels into a specific stat focus.
   * [UPDATED] Now handles the Level Increment (Bank Levels).
   */
  allocateAllPoints(targetStat) {
    const p = this.state.player;
    const levelsToSpend = p.attributePoints || 0;

    if (levelsToSpend <= 0) {
      this.showToast("No levels available to allocate.", true);
      return false;
    }

    const racialData = races[p.race];
    
    if (!racialData || !racialData.apWeights) {
        console.error("ProfileManager: Missing racial data for allocation.");
        return false;
    }

    const weights = racialData.apWeights;
    const mainStat = racialData.primaryStat;

    // Calculate Gains Per Level
    let levelGains = { ...weights };

    // --- APPLY GDD 1.4.2 CLICK MODIFIERS (The Focus Rule) ---
    if (targetStat === 'VIT') {
        // [RULE] Clicking VIT grants 1.5x VIT, deducted from Main Stat
        const vitBonus = levelGains.VIT * 0.5; // The extra 50%
        levelGains.VIT += vitBonus;
        // Deduct from Main Stat (clamped to 0)
        levelGains[mainStat] = Math.max(0, levelGains[mainStat] - vitBonus);
    } 
    else if (targetStat !== 'VIT' && targetStat !== mainStat) {
        // [RULE] Clicking Off-Stat swaps gains with Main Stat + 25% Penalty
        // Example: Clicking STR (15) as Human (DEX 20).
        // New STR = 20 (Old Main). New DEX = 15 * 0.75 (Old Off * Penalty).
        
        const oldMainVal = levelGains[mainStat];
        const oldTargetVal = levelGains[targetStat];

        levelGains[targetStat] = oldMainVal; // Clicked stat gets the "Big Number"
        levelGains[mainStat] = oldTargetVal * 0.75; // Main stat gets the "Small Number" + Penalty
    }
    // If clicking Main Stat, no changes needed. Standard weights apply.

    // Apply Multiplier (Bulk Dump) based on levels banked
    for (const stat in levelGains) {
        if (!p.baseStats[stat]) p.baseStats[stat] = 0;
        p.baseStats[stat] += (levelGains[stat] * levelsToSpend);
    }

    // [CRITICAL CHANGE] Level Up Happens HERE now, not automatically
    p.level += levelsToSpend;
    
    // Reset Bank
    p.attributePoints = 0;

    // Recalculate Power
    this.Systems.calculateDerivedStats(p);
    p.hp = p.derivedStats.maxHp; // Full Heal on Level Up
    
    // Refresh UI
    if (this.StatsManager) this.StatsManager.render();
    if (this.UIManager) this.UIManager.updatePlayerStatusUI();
    
    this.showToast(`Rank Up! You are now Level ${p.level}.`, false);
    
    // Save everything
    this.DataManager.updatePlayer({
      baseStats: p.baseStats,
      attributePoints: p.attributePoints,
      level: p.level,
      hp: p.hp,
      derivedStats: p.derivedStats
    });

    return true;
  }
  /**
   * [NEW] Combat Animation Trigger: Seeks to the specific action timestamp.
   * Based on the 8-second Action Video: 
   * 0.0s: Attack (Bite) | 3.1s: Cast (Vortex) | 6.1s: Emote (Laugh)
   */
  triggerCombatAnimation(actionType) {
    const video = document.getElementById('game-player-video');
    if (!video) return;

    // Switch path to the Action video
    const raceFolder = this.state.player.race.charAt(0).toUpperCase() + this.state.player.race.slice(1).toLowerCase();
    video.src = `/Visual-Effects/Animations/Races/${raceFolder}/Female_${raceFolder}_Actions.mp4`;
    video.load();

    // Seek to the timestamp
    video.onloadeddata = () => {
        if (actionType === 'attack') video.currentTime = 0.0;
        if (actionType === 'cast') video.currentTime = 3.1;
        if (actionType === 'emote') video.currentTime = 6.1;
        video.play();
    };

    // Return to Idle/Walk after 3 seconds
    setTimeout(() => this.syncHeroVideo(), 3000);
  }
  /**
   * [FIXED] Standardized Avatar Sync: 
   * Handles multi-word capitalization and prevents path mismatches.
   */
  syncHeroAvatar() {
    const p = this.state.player;
    if (!p || !p.race) return;

    const avatarImg = document.getElementById('game-player-avatar');
    if (!avatarImg) return;

    // 1. Handle Race: 'baba_yaga' -> 'Baba_Yaga'
    const formattedRace = p.race.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_');
    
    // 2. Handle Gender: 'male' -> 'Male'
    const gender = p.gender || 'female';
    const genderPrefix = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    
    // 3. Final Path Construction
    const fullPath = `/Visual-Effects/Images/Races/${formattedRace}/${formattedRace}_${genderPrefix}.webp`;

    if (avatarImg.getAttribute('src') !== fullPath) {
        console.log(`🖼️ Avatar Engine: Loading /Races/${formattedRace}/${formattedRace}_${genderPrefix}.webp`);
        avatarImg.src = fullPath;
    }
  }
  /**
   * Refreshes all UI components and syncs the 2D Avatar Image
   */
  updateAllProfileUI() {
    // 1. We are defaulting to the Static Image system for all 24 races.
    // This ensures Gender parity (Male/Female) is respected immediately.
    this.syncHeroAvatar(); 

    // 2. Ensure the video element is hidden and paused to save resources
    const video = document.getElementById('game-player-video');
    if (video) {
        video.style.display = 'none';
        video.pause();
    }
    
    // 3. Keep the image hidden; MapRenderer draws it to the canvas manually.
    const img = document.getElementById('game-player-avatar');
    if (img) img.style.display = 'none';

    if (this.UIManager) {
      this.UIManager.updatePlayerStatusUI();
    }

    if (this.UIManager) {
      this.UIManager.updatePlayerStatusUI();
    }

    if (this.CombatManager?.isInitialized) {
      this.CombatManager.updateCombatInfoPanel();
    }

    if (this.StatsManager?.isInitialized) {
      this.StatsManager.render();
    }
  }

}