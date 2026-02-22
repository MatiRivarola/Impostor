import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Skull } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

interface LocalVotingPhaseProps {
  player: Player;
  allPlayers: Player[];
  onVoteSubmitted: (voterId: string, victimId: string) => void;
  playSound?: (type: 'vote_confirm') => void;
}

export const LocalVotingPhase: React.FC<LocalVotingPhaseProps> = ({
  player,
  allPlayers,
  onVoteSubmitted,
  playSound,
}) => {
  const [phase, setPhase] = useState<'waiting' | 'voting'>('waiting');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const votablePlayers = allPlayers.filter(p => !p.isDead && p.id !== player.id);

  if (phase === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center animate-fade-in">
        <div className="w-full max-w-md bg-slate-900/95 p-8 rounded-3xl border-2 border-purple-500/50 shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-purple-500/20 text-purple-400 border-2 border-purple-500/50 animate-pulse">
            <ShieldAlert size={40} />
          </div>

          <h1 className="text-2xl font-black text-purple-400 uppercase mb-2">Votación Secreta</h1>
          <p className="text-slate-400 text-sm mb-6">Pasale el fono a:</p>

          <div className="bg-slate-800/80 rounded-2xl p-6 mb-6 border-2 border-slate-700">
            <p className="text-4xl font-black text-white tracking-tight">{player.name}</p>
          </div>

          <p className="text-slate-500 text-xs mb-6 flex items-center justify-center gap-2">
            <ShieldAlert size={14} className="text-yellow-500" />
            Asegurate que nadie más esté mirando.
          </p>

          <Button
            onClick={() => setPhase('voting')}
            fullWidth
            variant="primary"
            className="py-5 text-lg font-black uppercase tracking-wide"
          >
            LISTO, SOY YO
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[85vh] px-4 pt-6 pb-28 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black text-white uppercase italic mb-1">
          {player.name}, ¿quién es el gil?
        </h1>
        <p className="text-slate-400 text-sm">Elegí a quién querés eliminar</p>
      </div>

      <div className="w-full max-w-md grid grid-cols-1 gap-3 flex-1">
        {votablePlayers.map(p => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'bg-red-900/30 border-red-500 shadow-2xl shadow-red-500/30 ring-2 ring-red-500/50'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 px-3 py-1 rounded-full shadow-lg z-10">
                  <span className="text-white font-black text-xs uppercase tracking-wider">TU VOTO</span>
                </div>
              )}
              {isSelected && (
                <div className="absolute top-2 right-2 animate-pulse">
                  <CheckCircle2 className="text-red-400" size={28} />
                </div>
              )}

              <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mr-4 text-xl font-black text-slate-300">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left flex-1">
                <span className={`text-lg font-bold block ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {p.name}
                </span>
                <span className={`text-xs uppercase font-bold ${isSelected ? 'text-red-400' : 'text-slate-500'}`}>
                  {isSelected ? 'OBJETIVO SELECCIONADO' : 'SOSPECHOSO'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-20">
        <div className="max-w-md mx-auto">
          <Button
            fullWidth
            onClick={() => {
              if (!selectedId) return;
              playSound?.('vote_confirm');
              onVoteSubmitted(player.id, selectedId);
            }}
            disabled={!selectedId}
            variant="danger"
            className="text-xl py-4 flex items-center justify-center gap-2 font-black"
          >
            {selectedId ? 'CONFIRMAR VOTO' : 'SELECCIONÁ UN JUGADOR'} <Skull size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};
