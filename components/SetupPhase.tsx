import React, { useState } from 'react';
import { Plus, X, Users, Ghost, Play, Check, Trophy, VenetianMask, Skull, Shield, Info } from 'lucide-react';
import { Button } from './Button';
import { Scoreboard } from './Scoreboard';
import { THEMES, MIN_PLAYERS } from '../constants';
import { ThemeOption, ScoreMap, GameMode } from '../types';

interface SetupPhaseProps {
  onStartGame: (names: string[], impostorCount: number, undercoverCount: number, selectedThemes: string[], mode: GameMode) => void;
  scores: ScoreMap;
  onResetScores: () => void;
}

export const SetupPhase: React.FC<SetupPhaseProps> = ({ onStartGame, scores, onResetScores }) => {
  const [names, setNames] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [impostorCount, setImpostorCount] = useState(1);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([THEMES[0].id]);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('chaos');

  // Pre-fill names from history if empty
  React.useEffect(() => {
    if (names.length === 0) {
        const historyNames = Object.keys(scores);
        if (historyNames.length > 0) {
            setNames(historyNames);
        }
    }
  }, [scores]);

  const addPlayer = () => {
    if (currentName.trim() && !names.includes(currentName.trim())) {
      setNames([...names, currentName.trim()]);
      setCurrentName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };
  
  const removePlayer = (index: number) => {
    setNames(names.filter((_, i) => i !== index));
  };

  const toggleTheme = (themeId: string) => {
    if (selectedThemes.includes(themeId)) {
      if (selectedThemes.length > 1) {
        setSelectedThemes(selectedThemes.filter(id => id !== themeId));
      }
    } else {
      setSelectedThemes([...selectedThemes, themeId]);
    }
  };

  const handleStart = () => {
    if (names.length < MIN_PLAYERS) return;
    
    // Auto-configure counts based on mode
    let finalUndercoverCount = 0;
    if (gameMode === 'chaos' || gameMode === 'hardcore') {
        finalUndercoverCount = names.length >= 4 ? 1 : 0;
    }

    onStartGame(names, impostorCount, finalUndercoverCount, selectedThemes, gameMode);
  };

  const isValid = names.length >= MIN_PLAYERS;
  
  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in pb-32 px-2 relative">
      {showScoreboard && (
        <Scoreboard 
            scores={scores} 
            onReset={() => { onResetScores(); setNames([]); }} 
            onClose={() => setShowScoreboard(false)} 
        />
      )}

      {/* Header Estilo Original con Gradiente */}
      <div className="text-center py-6 relative">
        <button 
            onClick={() => setShowScoreboard(true)}
            className="absolute top-0 right-0 bg-slate-800/80 p-2.5 rounded-xl text-yellow-400 border border-yellow-500/30 shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
            <Trophy size={20} />
            <span className="text-xs font-bold hidden sm:inline">RANKING</span>
        </button>
        
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-tighter italic transform -rotate-2 drop-shadow-2xl">
          IMPOSTOR
        </h1>
        <p className="text-slate-400 text-xs font-bold tracking-[0.4em] uppercase mt-1">Edición Argentina</p>

        {/* Resumen de Configuración (Badges) */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
            <div className="bg-slate-800/60 backdrop-blur px-3 py-1 rounded-full border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1">
                <Users size={12} /> {names.length} Jugadores
            </div>
            <div className="bg-slate-800/60 backdrop-blur px-3 py-1 rounded-full border border-slate-700 text-xs font-medium text-red-300 flex items-center gap-1">
                <Ghost size={12} /> {names.length > 0 ? impostorCount : '-'} Impostor
            </div>
            <div className="bg-slate-800/60 backdrop-blur px-3 py-1 rounded-full border border-slate-700 text-xs font-medium text-blue-300 flex items-center gap-1">
                {selectedThemes.length > 1 ? '🎨 Mix Temático' : (THEMES.find(t => t.id === selectedThemes[0])?.label || 'Sin Tema')}
            </div>
        </div>
      </div>

      {/* Players Section */}
      <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-inner">
        <div className="flex items-center gap-2 text-blue-400 mb-3">
          <Users size={18} />
          <h2 className="font-bold text-sm uppercase tracking-wide">Jugadores</h2>
        </div>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Nombre..."
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 shadow-inner"
          />
          <button 
            onClick={addPlayer}
            disabled={!currentName.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-900/30"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
            {names.length === 0 && <span className="text-slate-600 text-xs italic">Agregá a la banda...</span>}
            {names.map((name, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm border border-slate-600 shadow-sm animate-fade-in">
                <span>{name}</span>
                <button onClick={() => removePlayer(index)} className="text-slate-400 hover:text-red-400">
                    <X size={14} />
                </button>
                </div>
            ))}
        </div>
      </div>

      {/* Game Modes */}
      <div className="space-y-2">
         <h2 className="font-bold text-sm text-purple-400 uppercase tracking-wide px-1">Modo de Juego</h2>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            
            {/* Classic Mode */}
            <button 
                onClick={() => setGameMode('classic')}
                className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${gameMode === 'classic' ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-slate-800/40 border-slate-700 opacity-60'}`}
            >
                <div className="flex justify-between items-center mb-1 relative z-10">
                    <span className="font-black text-white flex items-center gap-2"><Shield size={16} className="text-blue-400"/> CLÁSICO</span>
                    {gameMode === 'classic' && <Check size={16} className="text-blue-500"/>}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Ciudadanos vs Impostor.</p>
            </button>

            {/* Chaos Mode */}
            <button 
                onClick={() => setGameMode('chaos')}
                className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${gameMode === 'chaos' ? 'bg-yellow-900/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'bg-slate-800/40 border-slate-700 opacity-60'}`}
            >
                <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg z-20">TOP</div>
                <div className="flex justify-between items-center mb-1 relative z-10">
                    <span className="font-black text-white flex items-center gap-2"><VenetianMask size={16} className="text-yellow-400"/> CAOS</span>
                    {gameMode === 'chaos' && <Check size={16} className="text-yellow-500"/>}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Agrega "Encubierto" (Palabra Trampa).</p>
            </button>

            {/* Hardcore Mode */}
            <button 
                onClick={() => setGameMode('hardcore')}
                className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${gameMode === 'hardcore' ? 'bg-red-900/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-slate-800/40 border-slate-700 opacity-60'}`}
            >
                <div className="flex justify-between items-center mb-1 relative z-10">
                    <span className="font-black text-white flex items-center gap-2"><Skull size={16} className="text-red-400"/> HARDCORE</span>
                    {gameMode === 'hardcore' && <Check size={16} className="text-red-500"/>}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Impostor puede robar la victoria.</p>
            </button>
         </div>
      </div>

      {/* Themes Grid */}
      <div className="flex flex-col flex-1 min-h-0 mt-1">
         <h2 className="font-bold text-sm text-green-400 uppercase tracking-wide mb-2 px-1">Temáticas</h2>
         <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-40 pr-1 pb-2 scrollbar-thin">
            {THEMES.map(theme => {
                const isSelected = selectedThemes.includes(theme.id);
                return (
                    <button
                        key={theme.id}
                        onClick={() => toggleTheme(theme.id)}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                            isSelected 
                            ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-600 opacity-70 hover:opacity-100'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xl">{theme.emoji}</span>
                            {isSelected && <div className="bg-emerald-500 rounded-full p-0.5"><Check size={10} className="text-white"/></div>}
                        </div>
                        <span className={`text-[11px] font-bold block leading-tight ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            {theme.label}
                        </span>
                    </button>
                )
            })}
         </div>
      </div>

      {/* Start Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-8 z-10">
        <Button 
          fullWidth 
          onClick={handleStart} 
          disabled={!isValid}
          className="text-xl py-4 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 font-black italic tracking-wide"
        >
          <Play fill="currentColor" size={24} /> JUGAR AHORA
        </Button>
        {names.length > 0 && !isValid && (
           <p className="text-red-400 text-xs text-center mt-2 font-semibold bg-slate-900/80 py-1 rounded">
             ¡Faltan jugadores para armar el quilombo!
           </p>
        )}
      </div>
    </div>
  );
};