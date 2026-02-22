import React, { useEffect } from 'react';
import { RotateCcw, Settings, Trophy } from 'lucide-react';
import { Button } from './Button';
import { Player, ScoreMap } from '../types';

const VICTORY_PHRASES = {
  citizens: [
    "¡La pegaron! Ganaron los ciudadanos",
    "¡Qué equipo! Los ciudadanos se llevaron la victoria",
    "¡Chau impostor! Los buenos ganaron",
    "¡Victoria épica de los ciudadanos!",
  ],
  impostor: [
    "¡Los engañó a todos! Ganó el impostor",
    "¡Qué actor! El impostor se los fumó",
    "¡Tremendo! El impostor los hizo pelota",
    "¡Impostor campeón! Los ciudadanos se fueron al muere",
  ],
};

interface ResultPhaseProps {
  winner: 'citizens' | 'impostor';
  players: Player[];
  secretWord: string;
  scores: ScoreMap;
  onPlayAgain: () => void;
  onChangeSetup: () => void;
  isHost?: boolean;
  currentRound?: number;
  playSound?: (type: 'victory' | 'defeat') => void;
}

export const ResultPhase: React.FC<ResultPhaseProps> = ({
  winner,
  players,
  secretWord,
  scores,
  onPlayAgain,
  onChangeSetup,
  isHost = true,
  currentRound = 1,
  playSound,
}) => {
  const isImpostorWin = winner === 'impostor';
  const impostors = players.filter(p => p.role === 'impostor');
  const undercovers = players.filter(p => p.role === 'undercover');

  useEffect(() => {
    playSound?.(isImpostorWin ? 'defeat' : 'victory');
  }, []);

  const phrases = VICTORY_PHRASES[winner];
  const victoryPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  
  const getPointsEarned = (player: Player) => {
    const roundsSurvived = currentRound;
    if (winner === 'citizens') {
        if (player.role === 'citizen') return 100;
        if (player.role === 'undercover') return player.isDead ? 50 : 150;
        if (player.role === 'impostor') return roundsSurvived * 25;
    } else {
        if (player.role === 'impostor') return 100 + (roundsSurvived * 50);
        if (player.role === 'undercover') return player.isDead ? 0 : 25;
    }
    return 0;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-6 animate-fade-in text-center">
      
      <div className="mb-8 relative">
        <div className={`absolute inset-0 blur-3xl opacity-30 rounded-full ${isImpostorWin ? 'bg-red-600' : 'bg-blue-600'}`}></div>
        {isImpostorWin ? (
           <Skull size={80} className="relative z-10 text-red-500" />
        ) : (
           <Trophy size={80} className="relative z-10 text-blue-500" />
        )}
      </div>

      <h1 className={`text-4xl font-black mb-8 leading-tight ${isImpostorWin ? 'text-red-500' : 'text-blue-500'}`}>
        {victoryPhrase}
      </h1>

      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8 space-y-4">
         <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Palabra Secreta</p>
            <p className="text-2xl font-bold text-white tracking-wide">{secretWord}</p>
         </div>
         <div className="h-px bg-slate-700 w-full"></div>
         <div>
            <p className="text-xs text-slate-500 uppercase font-bold mb-3">Roles & Puntos</p>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-thin">
                {players.map(p => {
                    const points = getPointsEarned(p);
                    const total = scores[p.name] || 0;
                    let badgeColor = 'bg-slate-700 text-slate-300';
                    let roleLabel = 'Ciudadano';

                    if (p.role === 'impostor') {
                        badgeColor = 'bg-red-900/30 text-red-300 border border-red-900/50';
                        roleLabel = 'Impostor';
                    } else if (p.role === 'undercover') {
                        badgeColor = 'bg-yellow-900/30 text-yellow-300 border border-yellow-900/50';
                        roleLabel = `Encubierto (${p.word})`;
                    }

                    return (
                        <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${badgeColor}`}>
                            <div className="text-left flex flex-col">
                                <span className="font-bold">{p.name}</span>
                                <span className="text-[10px] uppercase opacity-70">{roleLabel}</span>
                            </div>
                            <div className="text-right">
                                {points > 0 && <span className="text-green-400 font-bold text-sm block">+{points}</span>}
                                <span className="text-xs font-mono opacity-60">Total: {total}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
         </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {isHost ? (
          <>
            <Button onClick={onPlayAgain} fullWidth variant="primary" className="flex items-center justify-center gap-2">
              <RotateCcw size={20} /> Jugar otra ronda
            </Button>
            <Button onClick={onChangeSetup} fullWidth variant="secondary" className="flex items-center justify-center gap-2">
              <Settings size={20} /> Cambiar configuración
            </Button>
          </>
        ) : (
          <>
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-3 text-center">
              <p className="text-blue-300 text-sm">Esperando al anfitrión...</p>
            </div>
            <Button onClick={onChangeSetup} fullWidth variant="secondary" className="flex items-center justify-center gap-2">
              <Settings size={20} /> Salir de la Sala
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Helper component for icon
function Skull({ size, className }: { size: number, className: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M12 2c-3.3 0-6 2.7-6 6v3c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V8c0-3.3-2.7-6-6-6z"/>
            <path d="M8 15v5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-5"/>
            <path d="M9 22v-3"/>
            <path d="M15 22v-3"/>
        </svg>
    )
}