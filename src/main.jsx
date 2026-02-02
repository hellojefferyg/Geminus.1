import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// --- TRIGGER THE PLAYER ENGINE ---
// This checks the URL for ?mode=player and starts the game loop
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('mode') === 'player') {
    import('./main.js').then(() => {
        console.log("🎮 Geminus Engine: Player Mode Initialized.");
    });
}