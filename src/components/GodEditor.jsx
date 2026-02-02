import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { GDD } from '../data/masterGDD';
import { 
  Map as MapIcon, User, ShoppingBag, Portal, Eraser, 
  MousePointer2, Save, Database, Settings, ShieldAlert,
  Sword, Play, PencilRuler, Info, ChevronRight, X
} from 'lucide-react';

const GodEditor = () => {
  const { 
    currentMap, width, height, tileSize, 
    selectedTool, setTool, updateTile, addObject, removeObject,
    roamingBattleEnabled, setField, playerPos, isBattleCapableZone, canTriggerBattle 
  } = useGameStore();

  const [inspecting, setInspecting] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);

  // Asset configuration for visual rendering
  const assetIcons = {
    warp: <Portal className="text-purple-400 animate-pulse" size={20} />,
    npc: <User className="text-green-400" size={20} />,
    shop: <ShoppingBag className="text-yellow-400" size={20} />,
    boss: <ShieldAlert className="text-red-500" size={20} />
  };

  const handleCellClick = (x, y) => {
    if (isTestMode) {
      setField('playerPos', { x, y });
      return;
    }

    if (selectedTool === 'brush' || selectedTool === 'eraser') {
      updateTile(x, y);
    } else if (['warp', 'npc', 'shop', 'boss'].includes(selectedTool)) {
      setPendingCoords({ x, y });
      setShowConfig(true);
    } else if (selectedTool === 'inspect') {
      const obj = currentMap.objects.find(o => o.x === x && o.y === y);
      setInspecting(obj || null);
    }
  };

  const submitConfig = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    addObject(pendingCoords.x, pendingCoords.y, selectedTool, Object.fromEntries(formData));
    setShowConfig(false);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR: TOOLBOX */}
      <div className="w-72 bg-slate-900 border-r border-cyan-900/30 flex flex-col shadow-2xl z-30">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <Database className="text-cyan-400" size={22} />
            <h1 className="font-cinzel text-xl font-bold tracking-widest text-white">GEMINUS GOD</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Engine Link: Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 bg-black rounded-xl p-1 border border-slate-800">
            <button onClick={() => setIsTestMode(false)} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black transition ${!isTestMode ? 'bg-cyan-600 shadow-lg text-white' : 'text-slate-500'}`}>
              <PencilRuler size={14} /> EDITOR
            </button>
            <button onClick={() => setIsTestMode(true)} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black transition ${isTestMode ? 'bg-green-600 shadow-lg text-white' : 'text-slate-500'}`}>
              <Play size={14} /> TEST MODE
            </button>
          </div>

          {!isTestMode ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <section>
                <Label text="World Painting" />
                <div className="grid grid-cols-2 gap-2">
                  <ToolBtn active={selectedTool === 'brush'} onClick={() => setTool('brush')} icon={<MousePointer2 size={18}/>} label="Brush" />
                  <ToolBtn active={selectedTool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={18}/>} label="Eraser" />
                </div>
              </section>

              <section>
                <Label text="GDD Interactives" />
                <div className="grid grid-cols-2 gap-2">
                  <ToolBtn active={selectedTool === 'warp'} onClick={() => setTool('warp')} icon={<Portal size={18}/>} label="Warp" />
                  <ToolBtn active={selectedTool === 'npc'} onClick={() => setTool('npc')} icon={<User size={18}/>} label="NPC" />
                  <ToolBtn active={selectedTool === 'shop'} onClick={() => setTool('shop')} icon={<ShoppingBag size={18}/>} label="Shop" />
                  <ToolBtn active={selectedTool === 'boss'} onClick={() => setTool('boss')} icon={<ShieldAlert size={18}/>} label="Boss" />
                </div>
                <div className="mt-3">
                    <ToolBtn active={selectedTool === 'inspect'} onClick={() => setTool('inspect')} icon={<Settings size={18}/>} label="Inspect Object Data" fullWidth />
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
              <Label text="Live Simulation" color="text-green-500" />
              <div className="bg-black/40 border border-green-900/30 p-4 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Roaming Battle:</span>
                  <input type="checkbox" checked={roamingBattleEnabled} onChange={(e) => setField('roamingBattleEnabled', e.target.checked)} className="w-5 h-5 accent-green-500 cursor-pointer" />
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">COORDINATES</span>
                  <div className="font-mono text-cyan-400 text-lg tracking-tighter bg-black px-2 py-1 rounded">X: {playerPos.x} Y: {playerPos.y}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-black text-[11px] shadow-xl shadow-cyan-950 transition flex items-center justify-center gap-2 group">
            <Save size={16} className="group-hover:scale-110 transition" /> EXPORT TO ENGINE
          </button>
        </div>
      </div>

      {/* CENTER: VIEWPORT */}
      <div className="flex-1 relative overflow-auto bg-[#020617] flex justify-center items-start p-16">
        <div 
          className="relative border border-slate-800 bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-500"
          style={{ 
            width: width * tileSize, height: height * tileSize,
            backgroundSize: `${tileSize}px ${tileSize}px`,
            backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)'
          }}
        >
          {/* Tiles */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${width}, ${tileSize}px)` }}>
            {currentMap.tiles.map((tile, i) => (
              <div 
                key={`t-${i}`}
                onClick={() => handleCellClick(i % width, Math.floor(i / width))}
                className={`w-full h-full border border-transparent hover:border-cyan-400/20 transition-colors cursor-crosshair ${tile > 0 ? 'bg-slate-700/40 shadow-inner' : ''}`}
              />
            ))}
          </div>

          {/* Player Sprite */}
          {isTestMode && (
            <div className="absolute z-40 transition-all duration-300 pointer-events-none" style={{ left: playerPos.x * tileSize, top: playerPos.y * tileSize, width: tileSize, height: tileSize }}>
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_20px_#22d3ee] border-2 border-white animate-bounce" />
              </div>
            </div>
          )}

          {/* Objects Layer */}
          {currentMap.objects.map((obj, i) => (
            <div key={`o-${i}`} className="absolute z-30 flex items-center justify-center pointer-events-none" style={{ left: obj.x * tileSize, top: obj.y * tileSize, width: tileSize, height: tileSize }}>
              <div className="scale-110 drop-shadow-lg">{assetIcons[obj.type]}</div>
            </div>
          ))}
        </div>

        {/* BATTLE SELECTION DROPDOWN (VISIONARY LOGIC) */}
        {canTriggerBattle() && isTestMode && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 animate-in zoom-in slide-in-from-top-4 duration-300">
             <div className="bg-slate-900 border-2 border-red-500/40 p-4 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.3)] backdrop-blur-xl flex flex-col gap-3 min-w-[240px]">
               <div className="flex items-center gap-2 text-red-500">
                 <Sword size={16} />
                 <span className="text-[10px] font-black uppercase tracking-tighter">Wild Encounter Imminent</span>
               </div>
               <select className="bg-black border border-slate-800 text-white rounded-xl p-3 text-xs outline-none focus:border-red-500 transition-all cursor-pointer">
                 <option>-- Select Zone Monster --</option>
                 <option>Giant Rat (Z01)</option>
                 <option>Crystal Cultist (Z01)</option>
               </select>
               <button className="bg-red-600 hover:bg-red-500 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95">Initiate Combat</button>
             </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: INSPECTOR */}
      {inspecting && (
        <div className="w-80 bg-slate-900 border-l border-cyan-900/30 p-5 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h3 className="font-cinzel text-cyan-400 text-sm font-bold tracking-widest uppercase">Object Link</h3>
            <button onClick={() => setInspecting(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
          </div>
          
          <div className="space-y-4">
            <DataRow label="Core Type" value={inspecting.type.toUpperCase()} />
            <DataRow label="World Pos" value={`${inspecting.x}, ${inspecting.y}`} />
            
            <div className="pt-4 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-3">Engine JSON Metadata</span>
              <pre className="text-[11px] bg-black p-4 rounded-2xl border border-slate-800 text-green-400 font-mono leading-relaxed overflow-x-auto shadow-inner">
                {JSON.stringify(inspecting.data, null, 2)}
              </pre>
            </div>
          </div>

          <button onClick={() => { removeObject(inspecting.x, inspecting.y); setInspecting(null); }} className="mt-auto w-full bg-red-950/20 hover:bg-red-900/40 text-red-500 border border-red-900/40 py-3 rounded-xl text-[10px] font-black tracking-widest transition">
            DESTROY IN WORLD
          </button>
        </div>
      )}

      {/* GDD CONFIG MODAL */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-cyan-500/40 p-8 rounded-[2rem] w-full max-w-lg shadow-[0_0_100px_rgba(34,211,238,0.1)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-cyan-600/20 rounded-2xl">{assetIcons[selectedTool]}</div>
              <h2 className="text-2xl font-cinzel text-white font-bold uppercase tracking-widest">Map Configuration</h2>
            </div>

            <form onSubmit={submitConfig} className="space-y-6">
              {selectedTool === 'warp' && (
                <div className="space-y-4">
                  <SelectGroup label="Target Zone" name="targetZID" options={Object.keys(GDD.zones).map(z => ({val: z, label: `${z}: ${GDD.zones[z].name}`}))} />
                  <InputGroup label="Arrival Coords (X,Y)" name="coords" placeholder="10,5" />
                </div>
              )}

              {selectedTool === 'npc' && (
                <div className="space-y-4">
                  <SelectGroup label="Linked Quest" name="questId" options={GDD.quests.map(q => ({val: q.id, label: q.name}))} />
                  <SelectGroup label="Role" name="role" options={[{val: 'giver', label: 'Quest Giver'}, {val: 'trader', label: 'Merchant'}, {val: 'guard', label: 'Guard/Dialogue'}]} />
                </div>
              )}

              {selectedTool === 'shop' && (
                 <SelectGroup label="Shop Module" name="moduleId" options={Object.keys(GDD.shopTypes).map(s => ({val: s.toLowerCase(), label: GDD.shopTypes[s]}))} />
              )}

              <div className="flex gap-4 pt-4 font-cinzel">
                <button type="button" onClick={() => setShowConfig(false)} className="flex-1 py-4 border border-slate-700 text-slate-500 font-bold rounded-2xl hover:bg-slate-800">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-cyan-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-900/40 hover:bg-cyan-500 transition-all">Apply Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// UI ATOMS
const ToolBtn = ({ active, onClick, icon, label, fullWidth }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${fullWidth ? 'w-full' : ''} ${active ? 'bg-cyan-600 border-cyan-300 text-white shadow-xl scale-105 z-10' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-500'}`}>
    {icon}
    <span className="text-[9px] mt-2 font-black uppercase tracking-widest">{label}</span>
  </button>
);

const Label = ({ text, color = "text-slate-500" }) => (
  <h3 className={`text-[10px] uppercase font-black mb-3 tracking-[0.25em] ${color}`}>{text}</h3>
);

const DataRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-slate-500 font-bold uppercase tracking-tighter">{label}:</span>
    <span className="text-cyan-400 font-mono font-bold bg-cyan-950/30 px-2 py-0.5 rounded">{value}</span>
  </div>
);

const InputGroup = ({ label, name, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</label>
    <input name={name} required placeholder={placeholder} className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-sm text-white focus:border-cyan-500 outline-none transition-all shadow-inner" />
  </div>
);

const SelectGroup = ({ label, name, options }) => (
  <div className="space-y-2">
    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</label>
    <select name={name} className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-sm text-white focus:border-cyan-500 outline-none cursor-pointer">
      {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
    </select>
  </div>
);

export default GodEditor;