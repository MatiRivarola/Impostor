import React, { useState } from 'react';
import { Skull, Fingerprint, CheckCircle2 } from 'lucide-react';
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
    <div className="flex flex-col h-full animate-fade-in pb-24 pt-4 px-2 w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-white mb-2 uppercase italic">Votación</h1>
        <p className="text-slate-400 text-sm md:text-base">¿Quién es el impostor? Seleccionen con sabiduría.</p>
      </div>

      {/* Grid Layout: 1 column on Mobile, 2 columns on Desktop/Tablet */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {livingPlayers.map((player) => {
              const isSelected = selectedSuspect === player.id;
              
              return (
                <button
                    key={player.id}
                    onClick={() => setSelectedSuspect(player.id)}
                    className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-200 group ${
                    isSelected
                        ? 'bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] scale-[1.02] z-10'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750'
                    }`}
                >
                    {/* Selection Indicator Icon */}
                    <div className={`absolute top-3 right-3 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                        <CheckCircle2 className="text-red-500" size={24} />
                    </div>

                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mr-4 transition-colors border-2 ${
                        isSelected 
                        ? 'bg-red-500 text-white border-red-400' 
                        : 'bg-slate-700 text-slate-400 border-slate-600 group-hover:border-slate-500'
                    }`}>
                        <Fingerprint size={28} />
                    </div>
                    
                    <div className="text-left">
                        <span className={`text-lg font-bold block transition-colors ${
                            isSelected ? 'text-white' : 'text-slate-200'
                        }`}>
                            {player.name}
                        </span>
                        <span className={`text-xs uppercase font-bold transition-colors ${
                            isSelected ? 'text-red-400' : 'text-slate-500'
                        }`}>
                            {isSelected ? 'OBJETIVO SELECCIONADO' : 'SOSPECHOSO'}
                        </span>
                    </div>
                </button>
              );
            })}
          </div>
      </div>
      
      {/* Footer / Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-20">
        <div className="max-w-md mx-auto">
            <Button 
            fullWidth 
            onClick={() => selectedSuspect && onVote(selectedSuspect)} 
            disabled={!selectedSuspect}
            variant="danger"
            className="text-xl py-4 shadow-xl shadow-red-900/30 flex items-center justify-center gap-2 font-black italic tracking-wide transition-all"
            >
            {selectedSuspect ? 'CONFIRMAR ELIMINACIÓN' : 'SELECCIONÁ UN JUGADOR'} <Skull size={24}/>
            </Button>
        </div>
      </div>
    </div>
  );
};