import React, { useState, useEffect, useRef } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { useMapStore } from './MapEditor';
import { Sword, Shield, Skull, Zap, X, Trophy, User } from 'lucide-react';

export default function CombatScreen({ onClose, initialEnemyId = null, currentZoneId = null }) {
    const { masterData, addReward } = useStudioStore();
    const { bestiary, player, items } = masterData;

    // --- BATTLE STATE ---
    const [selectedMobId, setSelectedMobId] = useState(initialEnemyId || "");
    const [combatActive, setCombatActive] = useState(false);
    const [enemy, setEnemy] = useState(null); 
    const [playerHp, setPlayerHp] = useState(player.hp);
    const [combatLog, setCombatLog] = useState([]);
    
    // Auto-scroll log
    const logEndRef = useRef(null);
    useEffect(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), [combatLog]);

    // --- AUTO-START BRIDGE ---
    // This watches for the ID from the Map (like ShadowAssassin) and starts the fight immediately
    useEffect(() => {
        if (initialEnemyId && !combatActive) {
            // This forces the battle logic to trigger the moment the window opens
            startBattle();
        }
    }, [initialEnemyId]);
    const log = (msg, type='neutral') => {
        setCombatLog(prev => [...prev, { text: msg, type, id: Date.now() + Math.random() }]);
    };

    const startBattle = () => {
        const targetId = selectedMobId || initialEnemyId;
        if (!targetId) return;

        const monsterTemplate = bestiary[targetId];
        const pkTarget = useMapStore.getState().otherPlayers[targetId];
        const template = monsterTemplate || pkTarget;
        
        if (!template) {
            log("Error: Target data not found.", 'danger');
            return;
        }

        setEnemy({
            ...template,
            currentHp: template.hp || 50,
            // Map both hp and maxHp to the same value for the mock player
            hp: template.hp || 50,
            maxHp: template.hp || 50, 
            isPlayer: !!pkTarget
        });
        
        setPlayerHp(player.hp); 
        setCombatActive(true);
        setCombatLog([]);
        log(`Battle started against ${template.name}!`, pkTarget ? 'danger' : 'alert');
    };

    const handleAttack = (type) => {
        if (!enemy || playerHp <= 0) return;

        // 1. PLAYER TURN
        // Player deals damage to the enemy (using placeholder formula)
        const playerDmg = Math.floor(Math.random() * 10) + 5; 
        const newEnemyHp = enemy.currentHp - playerDmg;
        
        log(`You ${type === 'cast' ? 'blast' : 'hit'} ${enemy.name} for ${playerDmg} dmg.`, 'player');
        setEnemy(prev => ({ ...prev, currentHp: newEnemyHp }));

        // 2. VICTORY CHECK
        if (newEnemyHp <= 0) {
            handleVictory();
            return;
        }

        // 3. ENEMY TURN (Delay)
        setTimeout(() => {
            // Re-check in case the enemy died during the timeout
            if (newEnemyHp <= 0) return; 

            // FIX: Access .damage directly from the enemy (flat data structure)
            const enemyAttackPower = Math.max(1, (enemy.damage || 5)); 
            const newPlayerHp = playerHp - enemyAttackPower;
            
            setPlayerHp(newPlayerHp);
            log(`${enemy.name} attacks you for ${enemyAttackPower} dmg!`, 'enemy');

            if (newPlayerHp <= 0) {
                log("You have been defeated...", 'danger');
                setCombatActive(false);
            }
        }, 600);
    };

    const handleVictory = () => {
        const xp = enemy.stats?.xp || 10;
        const gold = enemy.stats?.gold || 5;
        
        // Loot Roll (30% chance)
        let drop = null;
        if (Math.random() > 0.7 && Object.keys(items).length > 0) {
             const itemKeys = Object.keys(items);
             const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
             drop = items[randomKey];
        }

        log(`${enemy.name} defeated!`, 'victory');
        log(`Gained ${gold} Gold and ${xp} XP.`, 'loot');
        if (drop) log(`Looted: ${drop.name}!`, 'loot');

        addReward(xp, gold, drop);
        setCombatActive(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm font-sans">
            <div className="w-[800px] h-[600px] bg-[#0c101d] border border-cyan-900/50 rounded-lg shadow-2xl flex flex-col overflow-hidden relative text-white">
                
                {/* CLOSE */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
                    <X size={24} />
                </button>

                {/* HEADER */}
                <div className="p-4 border-b border-cyan-900/30 bg-cyan-950/20 flex justify-between items-center">
                    <h2 className="font-cinzel text-2xl text-cyan-400 flex items-center gap-2">
                        <Sword size={24} /> BATTLE SIMULATION
                    </h2>
                    
                    {/* SETUP MODE */}
                    {!combatActive && (
                        <div className="flex gap-2">
                            <select 
    className="bg-black border border-gray-700 text-gray-300 p-1 text-sm rounded w-48"
    value={selectedMobId}
    onChange={(e) => setSelectedMobId(e.target.value)}
>
    <option value="">Select Opponent...</option>
    {Object.entries(bestiary)
        // FIX: Match by ZID prefix (e.g., "Z01:")
        .filter(([id]) => {
    if (!currentZoneId) return true;
    // Matches the new "Z01:" prefix in the ID key
    return id.startsWith(`${currentZoneId}:`);
})
        .map(([id, mob]) => (
            <option key={id} value={id}>
                {mob.name} (HP: {mob.hp || 0})
            </option>
        ))
    }
</select>
                            <button 
                                onClick={startBattle}
                                disabled={!selectedMobId}
                                className="px-6 py-1 bg-red-700 hover:bg-red-600 text-white font-bold rounded disabled:opacity-50 tracking-wider font-cinzel"
                            >
                                FIGHT
                            </button>
                        </div>
                    )}
                </div>

                {/* ARENA */}
                <div className="flex-1 flex p-6 gap-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                    
                    {/* PLAYER */}
                    <div className="flex-1 flex flex-col items-center justify-center border border-blue-900/30 rounded bg-blue-950/10 p-4">
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <Shield size={48} className="text-blue-300" />
                        </div>
                        <h3 className="font-cinzel text-xl text-blue-200">{player.name}</h3>
                        <div className="w-full h-4 bg-gray-800 rounded-full mt-2 overflow-hidden border border-gray-600">
                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(playerHp / player.maxHp) * 100}%` }} />
                        </div>
                        <p className="text-sm text-blue-300 mt-1">{playerHp} / {player.maxHp} HP</p>

                        <div className="flex gap-2 mt-8 w-full">
                            <button onClick={() => handleAttack('phys')} disabled={!combatActive} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded flex flex-col items-center gap-1 disabled:opacity-50">
                                <Sword size={20} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-300">ATTACK</span>
                            </button>
                        </div>
                    </div>

                   {/* ENEMY - Updates icon based on target type */}
                    <div className="flex-1 flex flex-col items-center justify-center border border-red-900/30 rounded bg-red-950/10 p-4 relative">
                        {enemy ? (
                            <>
                                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse-slow">
                                    {enemy.isPlayer ? (
                                        <User size={48} className="text-blue-300" />
                                    ) : (
                                        <Skull size={48} className="text-red-300" />
                                    )}
                                </div>
                                <h3 className="font-cinzel text-xl text-red-200">{enemy.name}</h3>
                                <div className="w-full h-4 bg-gray-800 rounded-full mt-2 overflow-hidden border border-gray-600">
                                    {/* Using maxHp from Step 2 for the bar percentage */}
                                    <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }} />
                                </div>
                                <p className="text-sm text-red-300 mt-1">{enemy.currentHp} / {enemy.maxHp} HP</p>
                            </>
                        ) : (
                            <div className="text-gray-600 italic font-cinzel">Awaiting Challenger...</div>
                        )}
                    </div>
                </div>

                {/* LOG */}
                <div className="h-40 bg-black border-t border-gray-800 p-4 overflow-y-auto font-mono text-sm">
                    {combatLog.map(entry => (
                        <div key={entry.id} className={`mb-1 ${
                            entry.type === 'player' ? 'text-blue-300' :
                            entry.type === 'enemy' ? 'text-red-400' :
                            entry.type === 'alert' ? 'text-yellow-400 font-bold' :
                            entry.type === 'victory' ? 'text-green-400 font-bold text-lg' :
                            entry.type === 'loot' ? 'text-purple-400' :
                            entry.type === 'danger' ? 'text-red-600 font-bold' : 'text-gray-400'
                        }`}>
                            {entry.text}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>
    );
}