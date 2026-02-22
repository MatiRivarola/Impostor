import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { Button } from './Button';

interface VoteRevealPhaseProps {
  votes: Record<string, string>; // voterId → victimId
  players: Player[];
  onRevealComplete: (victimId: string) => void;
  playSound?: (type: 'vote_tally') => void;
}

export const VoteRevealPhase: React.FC<VoteRevealPhaseProps> = ({
  votes,
  players,
  onRevealComplete,
  playSound,
}) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const voteEntries = Object.entries(votes) as [string, string][];
  const livingPlayers = players.filter(p => !p.isDead);

  // Tally votes
  const tally: Record<string, number> = {};
  (Object.values(votes) as string[]).forEach((victimId: string) => {
    tally[victimId] = (tally[victimId] || 0) + 1;
  });

  const tallyValues = Object.values(tally) as number[];
  const maxVotes = Math.max(...tallyValues, 0);
  const topCandidates = (Object.entries(tally) as [string, number][])
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id);

  // In case of tie, pick random
  const victimId = topCandidates.length === 1
    ? topCandidates[0]
    : topCandidates[Math.floor(Math.random() * topCandidates.length)];

  const victimPlayer = players.find(p => p.id === victimId);

  // Reveal votes one by one
  useEffect(() => {
    if (revealedCount >= voteEntries.length) {
      const timer = setTimeout(() => setShowResult(true), 800);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      playSound?.('vote_tally');
      setRevealedCount(prev => prev + 1);
    }, 600);
    return () => clearTimeout(timer);
  }, [revealedCount, voteEntries.length]);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '???';

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center animate-fade-in">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-black text-white uppercase italic mb-2">Resultado de Votos</h1>
        <p className="text-slate-400 text-sm mb-8">Revelando uno por uno...</p>

        {/* Vote reveals */}
        <div className="space-y-3 mb-8">
          {voteEntries.slice(0, revealedCount).map(([voterId, votedId], index) => (
            <div
              key={voterId}
              className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 animate-fade-in flex items-center justify-between"
            >
              <span className="text-slate-300 font-bold">{getPlayerName(voterId)}</span>
              <span className="text-slate-500 mx-2">votó a</span>
              <span className="text-red-400 font-black">{getPlayerName(votedId)}</span>
            </div>
          ))}

          {revealedCount < voteEntries.length && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 animate-pulse">
              <span className="text-slate-500">Revelando voto...</span>
            </div>
          )}
        </div>

        {/* Tally summary */}
        {revealedCount >= voteEntries.length && (
          <div className="bg-slate-800/80 rounded-2xl p-6 border-2 border-slate-700 mb-6 animate-fade-in">
            <p className="text-xs text-slate-500 uppercase font-bold mb-4">Conteo Final</p>
            <div className="space-y-2">
              {livingPlayers
                .filter(p => tally[p.id])
                .sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0))
                .map(p => {
                  const count = tally[p.id] || 0;
                  const isTop = p.id === victimId;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                        isTop && showResult
                          ? 'bg-red-900/30 border-red-500 animate-dramatic-enter'
                          : 'bg-slate-900/50 border-slate-700'
                      }`}
                    >
                      <span className={`font-bold text-lg ${isTop && showResult ? 'text-red-400' : 'text-slate-200'}`}>
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: count }).map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full ${isTop ? 'bg-red-500' : 'bg-slate-500'}`} />
                          ))}
                        </div>
                        <span className={`font-black text-xl ${isTop && showResult ? 'text-red-400' : 'text-slate-400'}`}>
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {topCandidates.length > 1 && showResult && (
              <div className="mt-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-300 text-sm font-bold">
                  ¡Empate! Se eligió al azar entre los empatados.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Result and continue */}
        {showResult && victimPlayer && (
          <div className="animate-dramatic-enter">
            <div className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-6 mb-6">
              <p className="text-xs text-red-300 uppercase font-bold mb-2">ELIMINADO</p>
              <p className="text-4xl font-black text-red-400">{victimPlayer.name}</p>
            </div>

            <Button
              onClick={() => onRevealComplete(victimId)}
              fullWidth
              variant="danger"
              className="py-5 text-lg font-black uppercase tracking-wide shadow-xl"
            >
              REVELAR ROL
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
