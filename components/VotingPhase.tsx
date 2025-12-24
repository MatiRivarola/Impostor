import React, { useState } from 'react';
import { Skull, Fingerprint } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

interface VotingPhaseProps {
  players: Player[];
  onVote: (playerId: string) => void;
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({ players, onVote }) => {
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  
  const livingPlayers = players.filter(p => !p.isDead);

  return (
    <div className="flex flex-col h-full animate-fade-in pb-20 pt-4 px-2 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black text-white mb-2">Votación</h1>
        <p className="text-slate-400 text-sm">Seleccionen al sospechoso para eliminarlo.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {livingPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelectedSuspect(player.id)}
            className={`w-full flex items-center p-4 rounded-xl border-2 transition-all active:scale-98 ${
              selectedSuspect === player.id
                ? 'bg-red-900/40 border-red-500 shadow-lg shadow-red-900/20'
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors ${
               selectedSuspect === player.id ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              <Fingerprint size={24} />
            </div>
            <div className="text-left">
                <span className={`text-lg font-bold block ${
                selectedSuspect === player.id ? 'text-white' : 'text-slate-200'
                }`}>
                {player.name}
                </span>
                <span className="text-xs text-slate-500 uppercase font-bold">
                    {selectedSuspect === player.id ? 'Objetivo' : 'Sospechoso'}
                </span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-800">
        <Button 
          fullWidth 
          onClick={() => selectedSuspect && onVote(selectedSuspect)} 
          disabled={!selectedSuspect}
          variant="danger"
          className="text-lg py-4 shadow-lg shadow-red-900/20"
        >
          {selectedSuspect ? 'Confirmar Voto' : 'Elige a alguien'} <Skull className="ml-2 inline" size={20}/>
        </Button>
      </div>
    </div>
  );
};