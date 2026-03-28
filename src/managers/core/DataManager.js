/**
 * @file src/managers/core/DataManager.js
 * @description MERGED VERSION: Combines Firebase Persistence with Local Seed Data access.
 */
import * as SeedData from '../../data/gdd_seed.js'; 
// Example: importing specific bestiary for the CombatManager to use
import { bestiaryData } from '../../data/bestiaryData.js';

export class DataManager {
  constructor(deps) {
    this.state = deps.state;
    this.showToast = deps.showToast;
    this.ModalManager = deps.ModalManager;
    this.GameManager = null; 
    this.CreationManager = null; 
  }

  setManagers(managers) {
    this.GameManager = managers.GameManager;
    this.CreationManager = managers.CreationManager;
    if (managers.ModalManager) this.ModalManager = managers.ModalManager;
  }

  /**
   * FIREBASE CORE: Initializes the cloud connection.
   */
  async init() {
    try {
      // Check if Firebase is available (may not be loaded in player mode)
      if (!window.firebase) {
        console.log("⚠️ Firebase not available. Using local storage mode.");
        await this.loadPlayer();
        return;
      }

      const firebaseConfig = {
        apiKey: "AIzaSyCTkAvrEXs86AxsfdPJCh7ztg_sLA9htvU",
        authDomain: "geminus-online-game-6cbaa.firebaseapp.com",
        projectId: "geminus-online-game-6cbaa",
        storageBucket: "geminus-online-game-6cbaa.firebasestorage.app",
        messagingSenderId: "944055170590",
        appId: "1:944055170590:web:c58245636ee3643832200f"
      };

      if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR_")) {
        this.showConfigNeededModal();
        return;
      }

      const appId = 'geminus-game';
      
      // Initialize Firebase via window globals
      const app = window.firebase.initializeApp(firebaseConfig);
      this.state.firebase.db = window.firebase.getFirestore(app);
      this.state.firebase.auth = window.firebase.getAuth(app);
      
      await window.firebase.signInAnonymously(this.state.firebase.auth);
      this.state.firebase.userId = this.state.firebase.auth.currentUser.uid;

      if (!this.state.firebase.userId) throw new Error("Anonymous authentication failed.");

      const userDocPath = `/artifacts/${appId}/users/${this.state.firebase.userId}`;
      this.state.firebase.playerDocRef = window.firebase.doc(this.state.firebase.db, userDocPath);

      console.log("🔥 Firebase: Authenticated as", this.state.firebase.userId);
      await this.loadPlayer();
    } catch (error) {
      console.error("❌ Firebase Init Error:", error);
      this.showToast("Connection to Aetherial Stream failed.", true);
      if (this.CreationManager) this.CreationManager.init();
    }
  }

  /**
   * VISIONARY ADDITION: Provides global access to your local JS data files.
   * This allows the MapEditor to "Live Link" to the engine.
   */
  getGameConfig() {
    return SeedData.gameConfig || {};
  }

  getBestiary() {
    return bestiaryData || {};
  }

  showConfigNeededModal() {
    const content = `
      <div class="text-center p-4">
        <p class="mb-4 text-glow-label text-xl">Developer Handshake Required</p>
        <p class="mb-2">Firebase configuration is missing or invalid.</p>
        <p class="text-sm text-gray-400">Add your project credentials to DataManager.js to enable cloud saves.</p>
      </div>`;

    if (this.ModalManager) {
      this.ModalManager.show("System Configuration", content);
    }
  }

  /**
   * PLAYER SYNC: Loads and sanitizes Firestore data.
   */
  async loadPlayer() {
    try {
      // If Firebase is not available, skip to character creation
      if (!window.firebase || !this.state.firebase.playerDocRef) {
        console.log("🌑 No Firebase connection. Initiating Character Creation.");
        if (this.CreationManager) this.CreationManager.init();
        return;
      }

      const docSnap = await window.firebase.getDoc(this.state.firebase.playerDocRef);
      if (docSnap.exists()) {
        console.log("💾 Player Record Found. Resonating...");
        const rawData = docSnap.data();

        // Data Sanitization: Convert JSON strings back to objects (Essential for mobile/app storage)
        this.state.player = {
          ...rawData,
          inventory: typeof rawData.inventory === 'string' ? JSON.parse(rawData.inventory) : rawData.inventory || [],
          equipment: typeof rawData.equipment === 'string' ? JSON.parse(rawData.equipment) : rawData.equipment || {},
          gems: typeof rawData.gems === 'string' ? JSON.parse(rawData.gems) : rawData.gems || []
        };

        if (this.GameManager) this.GameManager.init();
      } else {
        console.log("🌑 No Echo Found. Initiating Character Creation.");
        if (this.CreationManager) this.CreationManager.init();
      }
    } catch (error) {
      console.error("❌ Player Load Error:", error);
      this.showToast("Failed to retrieve player echo.", true);
      if (this.CreationManager) this.CreationManager.init();
    }
  }

  /**
   * PERSISTENCE: Saves the current state to the cloud.
   */
  async savePlayer(playerData) {
    if (!this.state.firebase.playerDocRef) return;

    try {
      const dataToSave = {
        ...playerData,
        inventory: JSON.stringify(playerData.inventory),
        equipment: JSON.stringify(playerData.equipment),
        gems: JSON.stringify(playerData.gems),
        lastUpdated: window.firebase.serverTimestamp()
      };

      await window.firebase.setDoc(this.state.firebase.playerDocRef, dataToSave, { merge: true });
      console.log("✅ Echo Saved to Cloud.");
    } catch (error) {
      console.error("❌ Save Error:", error);
      this.showToast("Failed to synchronize progress.", true);
    }
  }

  async updatePlayer(updates) {
    if (!this.state.player) return;
    this.state.player = { ...this.state.player, ...updates };
    await this.savePlayer(this.state.player);
  }
}