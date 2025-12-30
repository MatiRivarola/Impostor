import React, { useState, useEffect } from 'react';
import { Skull, CheckCircle2, Check, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';
import { PlayerAvatar } from './PlayerAvatar';

interface VoteInfo {
  voterId: string;
  voterName: string;
  voterInitials: string;
  votedPlayerId: string;
  timestamp: number;
}

interface VotingState {
  votes: VoteInfo[];
  totalVoters: number;
  voteCount: number;
}

interface VotingPhaseProps {
  players: Player[];
  myPlayerId: string;
  onVote: (playerId: string) => void;
  socket: any;
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({
  players,
  myPlayerId,
  onVote,
  socket
}) => {
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingState, setVotingState] = useState<VotingState>({
    votes: [],
    totalVoters: 0,
    voteCount: 0,
  });
  const [tieMessage, setTieMessage] = useState<string | null>(null);

  const livingPlayers = players.filter(p => !p.isDead);
  const amIDead = players.find(p => p.id === myPlayerId)?.isDead || false;

  useEffect(() => {
    if (!socket) return;

    const handleVoteCast = (voteInfo: VoteInfo) => {
      console.log(`${voteInfo.voterName} votó`);
    };

    const handleVotingState = (state: VotingState) => {
      setVotingState(state);

      // Check if I already voted
      const myVote = state.votes.find(v => v.voterId === myPlayerId);
      if (myVote) {
        setHasVoted(true);
        setSelectedSuspect(myVote.votedPlayerId);
      } else {
        // Si resetean los votos (empate), resetear estado local
        setHasVoted(false);
        setSelectedSuspect(null);
      }
    };

    const handleVoteTie = ({ message }: { tiedPlayers: string[]; message: string }) => {
      setTieMessage(message);
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setTieMessage(null), 5000);
    };

    socket.on('vote_cast', handleVoteCast);
    socket.on('voting_state', handleVotingState);
    socket.on('vote_tie', handleVoteTie);

    return () => {
      socket.off('vote_cast', handleVoteCast);
      socket.off('voting_state', handleVotingState);
      socket.off('vote_tie', handleVoteTie);
    };
  }, [socket, myPlayerId]);

  const handleConfirmVote = () => {
    if (!selectedSuspect) return;
    onVote(selectedSuspect);
    setHasVoted(true);
  };

  const getVotesForPlayer = (playerId: string): VoteInfo[] => {
    return votingState.votes.filter(v => v.votedPlayerId === playerId);
  };

  const hasPlayerVoted = (playerId: string): boolean => {
    return votingState.votes.some(v => v.voterId === playerId);
  };

  if (amIDead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white px-4 text-center">
        <Skull size={64} className="text-red-500 mb-6 animate-pulse" />
        <h1 className="text-4xl font-black mb-2 uppercase text-red-400">ESTÁS MUERTO</h1>
        <p className="text-slate-400 text-lg mb-6">No podés votar.</p>
        <p className="text-slate-500 text-sm">Esperá hasta que se encuentre al impostor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in pb-24 pt-4 px-2 w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-white mb-2 uppercase italic">¿Quién es el gil?</h1>
        <p className="text-slate-400 text-sm">Votá al sospechoso</p>

        {/* Contador de votos */}
        <div className="mt-4 inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full">
          <Check size={16} className="text-green-400" />
          <span className="text-white font-bold">{votingState.voteCount}/{votingState.totalVoters}</span>
          <span className="text-slate-400 text-sm">jugadores votaron</span>
        </div>

        {/* Mensaje de Empate */}
        {tieMessage && (
          <div className="mt-4 bg-yellow-900/30 border-2 border-yellow-500 rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle size={24} className="text-yellow-400" />
              <p className="text-yellow-200 font-bold text-lg uppercase">{tieMessage}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {livingPlayers.map((player) => {
            const isSelected = selectedSuspect === player.id;
            const votesReceived = getVotesForPlayer(player.id);
            const playerHasVoted = hasPlayerVoted(player.id);
            const isMe = player.id === myPlayerId;

            return (
              <button
                key={player.id}
                onClick={() => !isMe && setSelectedSuspect(player.id)}
                disabled={isMe}
                className={`relative flex items-center p-4 rounded-2xl border-2 transition-all group ${
                  isSelected
                    ? 'bg-red-900/20 border-red-500 shadow-lg scale-[1.02]'
                    : isMe
                    ? 'bg-slate-800/50 border-slate-700/50 opacity-60 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500 cursor-pointer'
                }`}
              >
                {/* Checkmark si ya votó */}
                {playerHasVoted && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}

                {/* Icono de selección */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="text-red-500" size={24} />
                  </div>
                )}

                <div className="relative mr-4">
                  <PlayerAvatar
                    avatar={player.avatar}
                    color={player.color}
                    isHost={false}
                    size="lg"
                    showCrown={false}
                  />

                  {/* Iniciales de votantes */}
                  {votesReceived.length > 0 && (
                    <div className="absolute -bottom-1 -right-1 min-w-[24px] h-6 bg-blue-600 border-2 border-slate-900 rounded-full flex items-center justify-center px-1">
                      <span className="text-xs font-black text-white">
                        {votesReceived.map(v => v.voterInitials).join('')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-left flex-1">
                  <span className={`text-lg font-bold block ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {player.name} {isMe && <span className="text-xs text-blue-400">(VOS)</span>}
                  </span>
                  <span className={`text-xs uppercase font-bold ${isSelected ? 'text-red-400' : 'text-slate-500'}`}>
                    {isSelected ? 'OBJETIVO SELECCIONADO' :
                     votesReceived.length > 0 ? `${votesReceived.length} voto(s)` : 'SOSPECHOSO'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-20">
        <div className="max-w-md mx-auto space-y-3">
          {hasVoted && (
            <div className="bg-green-900/20 border-2 border-green-500 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Check size={20} className="text-green-400" />
                <p className="text-green-300 font-bold text-sm">Voto registrado</p>
              </div>
              <p className="text-green-400/70 text-xs mt-1">Podés cambiarlo si querés</p>
            </div>
          )}
          <Button
            fullWidth
            onClick={handleConfirmVote}
            disabled={!selectedSuspect}
            variant="danger"
            className="text-xl py-4 flex items-center justify-center gap-2 font-black"
          >
            {hasVoted ? 'CAMBIAR VOTO' : selectedSuspect ? 'CONFIRMAR ELIMINACIÓN' : 'SELECCIONÁ UN JUGADOR'} <Skull size={24}/>
          </Button>
        </div>
      </div>
    </div>
  );
};
