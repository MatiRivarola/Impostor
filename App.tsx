import React, { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react"
import { GameState, Player, ScoreMap, GameMode, AppMode, GameEvent } from './types';
import { SetupPhase } from './components/SetupPhase';
import { AssignmentPhase } from './components/AssignmentPhase';
import { DebatePhase } from './components/DebatePhase';
import { VotingPhase } from './components/VotingPhase';
import { LocalVotingPhase } from './components/LocalVotingPhase';
import { VoteRevealPhase } from './components/VoteRevealPhase';
import { ResultPhase } from './components/ResultPhase';
import { LastBulletPhase } from './components/LastBulletPhase';
import { Scoreboard } from './components/Scoreboard';
import { LandingPhase } from './components/LandingPhase';
import { OnlineLobby } from './components/OnlineLobby';
import { ReloadPrompt } from './components/ReloadPrompt';
import { getGameWords } from './services/wordService';
import { THEMES } from './constants';
import { Button } from './components/Button';
import { useSound } from './hooks/useSound';
import { PlayCircle, AlertOctagon, Settings, ArrowLeft, RefreshCw, Trophy, Skull, CheckCircle, Home, ArrowRight, ArrowBigRight, Users, Zap } from 'lucide-react';

const GAME_EVENTS: GameEvent[] = [
  { id: 'lightning', name: 'Ronda Relámpago', description: 'El timer se reduce a la mitad. ¡Apúrense!', emoji: '⚡', effect: 'half_timer' },
  { id: 'silent', name: 'Ronda Muda', description: 'Solo se pueden comunicar con gestos. Prohibido hablar.', emoji: '🤫', effect: 'silent' },
  { id: 'one_word', name: 'Una Palabra', description: 'Solo pueden decir UNA palabra por turno.', emoji: '☝️', effect: 'one_word' },
  { id: 'confessional', name: 'Confesionario', description: 'El primer jugador dice 3 palabras sobre su palabra antes de empezar.', emoji: '🎤', effect: 'confessional' },
  { id: 'no_timer', name: 'Sin Tiempo', description: '¡Sin límite de tiempo! Discutan hasta que quieran.', emoji: '♾️', effect: 'no_timer' },
];

interface RoundFeedback {
    type: 'success' | 'danger' | 'info' | 'round_start' | 'event';
    title: string;
    subtitle: string;
    description: string;
    role?: string;
    extraInfo?: string;
    direction?: 'derecha' | 'izquierda';
    event?: GameEvent;
}

export default function App() {
  const initialGameState: GameState = {
    phase: 'SETUP',
    players: [],
    impostorCount: 1,
    undercoverCount: 0,
    gameMode: 'classic',
    theme: '',
    secretWord: '',
    undercoverWord: '',
    currentPlayerIndex: 0,
    winner: null,
    currentRound: 1,
    maxRounds: null,
    votes: {},
    votingPlayerIndex: 0,
    activeEvent: null,
    timerOverride: null,
    useSecretVoting: true,
  };

  const { playSound, vibrate, soundEnabled, vibrationEnabled, toggleSound, toggleVibration } = useSound();

  // State Persistence Initialization
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
        const saved = localStorage.getItem('impostor_game_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Ensure new fields exist for backwards compat
          return {
            ...initialGameState,
            ...parsed,
            votes: parsed.votes || {},
            votingPlayerIndex: parsed.votingPlayerIndex || 0,
            activeEvent: parsed.activeEvent || null,
            timerOverride: parsed.timerOverride || null,
          };
        }
        return initialGameState;
    } catch {
        return initialGameState;
    }
  });

  // App Mode State (Landing, Local, Online)
  const [appMode, setAppMode] = useState<AppMode>('LANDING');

  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [timerDuration, setTimerDuration] = useState(180);

  // Feedback State Object
  const [feedback, setFeedback] = useState<RoundFeedback | null>(null);

  // Elimination animation states
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);

  const [showInGameSettings, setShowInGameSettings] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Persist Game State
  useEffect(() => {
    localStorage.setItem('impostor_game_state', JSON.stringify(gameState));
  }, [gameState]);

  // Scoring State
  const [scores, setScores] = useState<ScoreMap>(() => {
    try {
        const saved = localStorage.getItem('impostor_scores');
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('impostor_scores', JSON.stringify(scores));
  }, [scores]);

  // Historial de impostores para selección ponderada
  const [impostorHistory, setImpostorHistory] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('impostor_history');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('impostor_history', JSON.stringify(impostorHistory));
  }, [impostorHistory]);

  // Elimination animation trigger
  useEffect(() => {
    if (feedback && (feedback.type === 'success' || feedback.type === 'danger' || feedback.type === 'info')) {
      setRoleRevealed(false);
      setShowContinueButton(false);

      if (feedback.type === 'success') {
        playSound('elimination_success');
      } else if (feedback.type === 'danger') {
        playSound('elimination_danger');
      }

      const revealTimer = setTimeout(() => setRoleRevealed(true), 1500);
      const btnTimer = setTimeout(() => setShowContinueButton(true), 2500);
      return () => { clearTimeout(revealTimer); clearTimeout(btnTimer); };
    }
  }, [feedback]);

  const updateScores = (winner: 'citizens' | 'impostor', players: Player[], roundsSurvived: number) => {
    setScores(prevScores => {
        const newScores = { ...prevScores };
        players.forEach(p => {
            if (newScores[p.name] === undefined) newScores[p.name] = 0;

            if (winner === 'citizens') {
                if (p.role === 'citizen') {
                    newScores[p.name] += 100;
                } else if (p.role === 'undercover') {
                    newScores[p.name] += p.isDead ? 50 : 150;
                } else if (p.role === 'impostor') {
                    newScores[p.name] += roundsSurvived * 25;
                }
            } else {
                if (p.role === 'impostor') {
                    newScores[p.name] += 100 + (roundsSurvived * 50);
                } else if (p.role === 'undercover') {
                    newScores[p.name] += p.isDead ? 0 : 25;
                }
            }
        });
        return newScores;
    });
  };

  const resetScores = () => {
    setScores({});
    localStorage.removeItem('impostor_scores');
  };

  const startGame = (names: string[], impostorCount: number, undercoverCount: number, selectedThemes: string[], mode: GameMode, roundLimit: number | null = null, useSecretVoting: boolean = true) => {
    const { secretWord, undercoverWord, themeLabel } = getGameWords(selectedThemes);

    const newPlayers: Player[] = names.map((name, i) => ({
      id: `p-${i}`,
      name,
      role: 'citizen',
      word: secretWord,
      isDead: false,
    }));

    const weightedSelect = (count: number, pool: number[]): number[] => {
      const selected: number[] = [];
      const remaining = [...pool];
      for (let c = 0; c < count && remaining.length > 0; c++) {
        const weights = remaining.map(idx => {
          const name = names[idx];
          const timesImpostor = impostorHistory[name] || 0;
          return 1 / (timesImpostor + 1);
        });
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let rand = Math.random() * totalWeight;
        let chosenIdx = 0;
        for (let w = 0; w < weights.length; w++) {
          rand -= weights[w];
          if (rand <= 0) { chosenIdx = w; break; }
        }
        selected.push(remaining[chosenIdx]);
        remaining.splice(chosenIdx, 1);
      }
      return selected;
    };

    const allIndices = Array.from({ length: names.length }, (_, i) => i);
    const impostorIndices = weightedSelect(impostorCount, allIndices);

    const newHistory = { ...impostorHistory };
    impostorIndices.forEach(idx => {
      const name = names[idx];
      newHistory[name] = (newHistory[name] || 0) + 1;
    });
    setImpostorHistory(newHistory);

    impostorIndices.forEach(idx => {
      newPlayers[idx].role = 'impostor';
      newPlayers[idx].word = undefined;
    });

    const remainingIndices = allIndices.filter(idx => !impostorIndices.includes(idx));
    for (let i = remainingIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingIndices[i], remainingIndices[j]] = [remainingIndices[j], remainingIndices[i]];
    }

    for (let count = 0; count < undercoverCount; count++) {
       if (count >= remainingIndices.length) break;
       const idx = remainingIndices[count];
       newPlayers[idx].role = 'undercover';
       newPlayers[idx].word = undercoverWord;
    }

    const dynamicTime = Math.max(180, names.length * 60);
    setTimerDuration(dynamicTime);
    setSelectedThemeIds(selectedThemes);

    setGameState({
      phase: 'ASSIGNMENT_WAIT',
      players: newPlayers,
      impostorCount,
      undercoverCount,
      gameMode: mode,
      theme: themeLabel,
      secretWord,
      undercoverWord,
      currentPlayerIndex: 0,
      winner: null,
      gameId: `game-${Date.now()}-${Math.random()}`,
      currentRound: 1,
      maxRounds: roundLimit,
      votes: {},
      votingPlayerIndex: 0,
      activeEvent: null,
      timerOverride: null,
      useSecretVoting,
    });
  };

  const handleNextPlayer = () => {
    const nextIndex = gameState.currentPlayerIndex + 1;
    if (nextIndex < gameState.players.length) {
      setGameState(prev => ({
        ...prev,
        currentPlayerIndex: nextIndex,
        phase: 'ASSIGNMENT_WAIT'
      }));
    } else {
      if (!gameState.roundStartShown) {
        const alivePlayers = gameState.players.filter(p => !p.isDead);
        const randomPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        const direction = Math.random() < 0.5 ? 'derecha' : 'izquierda';

        setGameState(prev => ({
          ...prev,
          roundStartShown: true,
          turnDirection: direction,
          startingPlayer: randomPlayer.name
        }));

        setFeedback({
          type: 'round_start',
          title: '¡ARRANCA LA RONDA!',
          subtitle: randomPlayer.name,
          description: `Sigan el orden hacia la ${direction}`,
          direction: direction
        });
      } else {
        setGameState(prev => ({ ...prev, phase: 'DEBATE' }));
      }
    }
  };

  const handleVote = (victimId: string) => {
    const updatedPlayers = gameState.players.map(p =>
      p.id === victimId ? { ...p, isDead: true } : p
    );
    const victim = gameState.players.find(p => p.id === victimId);

    if (victim?.role === 'impostor') {
        if (gameState.gameMode === 'hardcore') {
            setGameState(prev => ({
                ...prev,
                players: updatedPlayers,
                phase: 'LAST_BULLET'
            }));
            return;
        }

        const remainingImpostors = updatedPlayers.filter(p => !p.isDead && p.role === 'impostor').length;
        if (remainingImpostors === 0) {
            finishGame('citizens', updatedPlayers);
        } else {
            setGameState(prev => ({ ...prev, players: updatedPlayers }));
            setFeedback({
                type: 'success',
                title: '¡IMPOSTOR ELIMINADO!',
                subtitle: victim.name,
                role: 'IMPOSTOR',
                description: remainingImpostors === 1
                  ? `¡Excelente! Pero cuidado... todavía queda ${remainingImpostors} impostor suelto.`
                  : `¡Bien jugado! Pero ojo... todavía quedan ${remainingImpostors} impostores sueltos.`
            });
        }
    }
    else {
        const livingPlayers = updatedPlayers.filter(p => !p.isDead).length;
        const livingImpostors = updatedPlayers.filter(p => !p.isDead && p.role === 'impostor').length;

        if (livingPlayers <= 2 || livingImpostors >= livingPlayers) {
            finishGame('impostor', updatedPlayers);
        } else {
            setGameState(prev => ({ ...prev, players: updatedPlayers }));
            setFeedback({
                type: 'danger',
                title: '¡SE EQUIVOCARON!',
                subtitle: victim?.name || '',
                role: victim?.role === 'undercover' ? 'ENCUBIERTO' : 'CIUDADANO',
                description: victim?.role === 'undercover'
                  ? `Era un encubierto, no un impostor. El impostor sigue entre ustedes...`
                  : `Era un ciudadano inocente. El impostor está riéndose de ustedes.`,
                extraInfo: `Quedan ${livingImpostors} impostor(es) y ${livingPlayers - livingImpostors} ciudadano(s)`
            });
        }
    }
  };

  const finishGame = (winner: 'citizens' | 'impostor', finalPlayers: Player[]) => {
    setGameState(prev => {
        updateScores(winner, finalPlayers, prev.currentRound);
        return {
            ...prev,
            players: finalPlayers,
            winner: winner,
            phase: 'GAME_OVER'
        };
    });
    localStorage.removeItem('impostor_game_state');
  };

  const handleLastBulletGuess = (guess: string) => {
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    if (normalize(guess) === normalize(gameState.secretWord)) {
        finishGame('impostor', gameState.players);
    } else {
        const remainingImpostors = gameState.players.filter(p => !p.isDead && p.role === 'impostor').length;

        if (remainingImpostors === 0) {
            finishGame('citizens', gameState.players);
        } else {
            setFeedback({
                type: 'info',
                title: '¡FALLÓ EL TIRO!',
                subtitle: 'Se equivocó de palabra',
                description: `El impostor ha sido eliminado, pero todavía quedan ${remainingImpostors} dando vueltas.`
            });
            setGameState(prev => ({ ...prev, phase: 'DEBATE' }));
        }
    }
  };

  const continueRound = () => {
    setFeedback(null);
    setGameState(prev => {
      const nextRound = prev.currentRound + 1;
      if (prev.maxRounds !== null && nextRound > prev.maxRounds) {
        finishGame('impostor', prev.players);
        return prev;
      }

      // 40% chance of random event
      let activeEvent: GameEvent | null = null;
      let timerOverride: number | null = null;

      if (Math.random() < 0.4) {
        activeEvent = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
        if (activeEvent.effect === 'half_timer') {
          timerOverride = Math.floor(timerDuration / 2);
        } else if (activeEvent.effect === 'no_timer') {
          timerOverride = 9999;
        }
      }

      if (activeEvent) {
        playSound('round_event');
        // Show event feedback, then transition to DEBATE
        setFeedback({
          type: 'event',
          title: activeEvent.name,
          subtitle: activeEvent.emoji,
          description: activeEvent.description,
          event: activeEvent,
        });
        return { ...prev, currentRound: nextRound, activeEvent, timerOverride };
      }

      return { ...prev, currentRound: nextRound, phase: 'DEBATE', activeEvent: null, timerOverride: null };
    });
  };

  // Local voting handlers
  const handleLocalVote = (voterId: string, victimId: string) => {
    setGameState(prev => {
      const newVotes = { ...prev.votes, [voterId]: victimId };
      const alivePlayers = prev.players.filter(p => !p.isDead);
      const nextVotingIndex = prev.votingPlayerIndex + 1;

      if (nextVotingIndex >= alivePlayers.length) {
        // All voted → go to reveal
        return { ...prev, votes: newVotes, votingPlayerIndex: nextVotingIndex, phase: 'VOTING_REVEAL' as const };
      }

      return { ...prev, votes: newVotes, votingPlayerIndex: nextVotingIndex };
    });
  };

  const handleVoteRevealComplete = (victimId: string) => {
    handleVote(victimId);
  };

  const handleReplay = () => {
     const currentNames = gameState.players.map(p => p.name);
     startGame(currentNames, gameState.impostorCount, gameState.undercoverCount, selectedThemeIds, gameState.gameMode, gameState.maxRounds);
  };

  const handleResetToSetup = () => {
     setGameState(prev => ({ ...prev, phase: 'SETUP' }));
     setShowInGameSettings(false);
     localStorage.removeItem('impostor_game_state');
     setImpostorHistory({});
     localStorage.removeItem('impostor_history');
  };

  const handleFullReset = () => {
     handleReplay();
     setShowInGameSettings(false);
  };

  const handleReturnToMenu = () => {
    setAppMode('LANDING');
    setShowInGameSettings(false);
  };

  // -- Feedback Overlay --
  if (feedback) {
    const isSuccess = feedback.type === 'success';
    const isInfo = feedback.type === 'info';
    const isDanger = feedback.type === 'danger';
    const isRoundStart = feedback.type === 'round_start';
    const isEvent = feedback.type === 'event';

    let Icon = AlertOctagon;
    let colorClass = 'text-red-500';
    let bgClass = 'bg-red-500/20 border-red-500/50';
    let gradientFrom = 'from-red-900';
    let roleColorClass = 'text-red-500 bg-red-500/10 border-red-500/30';

    if (isRoundStart) {
        Icon = Users;
        colorClass = 'text-blue-400';
        bgClass = 'bg-blue-500/20 border-blue-500/50';
        gradientFrom = 'from-blue-900';
    } else if (isEvent) {
        Icon = Zap;
        colorClass = 'text-purple-400';
        bgClass = 'bg-purple-500/20 border-purple-500/50';
        gradientFrom = 'from-purple-900';
    } else if (isSuccess) {
        Icon = CheckCircle;
        colorClass = 'text-green-500';
        bgClass = 'bg-green-500/20 border-green-500/50';
        gradientFrom = 'from-green-900';
        roleColorClass = 'text-red-500 bg-red-500/10 border-red-500/30';
    } else if (isInfo) {
        Icon = Skull;
        colorClass = 'text-blue-500';
        bgClass = 'bg-blue-500/20 border-blue-500/50';
        gradientFrom = 'from-blue-900';
        roleColorClass = 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    } else if (isDanger) {
        if (feedback.role === 'CIUDADANO') {
            roleColorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        } else if (feedback.role === 'ENCUBIERTO') {
            roleColorClass = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        }
    }

    // Event overlay
    if (isEvent) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
          <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${gradientFrom} via-slate-950 to-slate-950`}></div>
          <div className="relative z-10 w-full max-w-lg bg-slate-900/95 p-8 rounded-3xl border-2 border-purple-500/50 shadow-2xl backdrop-blur-xl animate-event-slide-in">
            <div className="text-7xl mb-6">{feedback.subtitle}</div>
            <h1 className="text-3xl font-black text-purple-400 uppercase italic tracking-tight mb-4">
              {feedback.title}
            </h1>
            <div className="bg-purple-500/10 rounded-xl p-5 border-2 border-purple-500/30 mb-6">
              <p className="text-slate-300 text-lg leading-relaxed font-medium">{feedback.description}</p>
            </div>
            <Button
              onClick={() => {
                setFeedback(null);
                setGameState(prev => ({ ...prev, phase: 'DEBATE' }));
              }}
              fullWidth
              variant="primary"
              className="py-5 text-lg font-black uppercase tracking-wide shadow-xl"
            >
              <PlayCircle className="inline mr-2" size={24} />
              ¡EMPEZAR LA RONDA!
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
        <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${gradientFrom} via-slate-950 to-slate-950`}></div>

        {/* Mensaje de INICIO DE RONDA */}
        {isRoundStart ? (
          <div className="relative z-10 w-full max-w-lg bg-slate-900/95 p-8 rounded-3xl border-2 border-blue-500/50 shadow-2xl backdrop-blur-xl">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 ${bgClass} ${colorClass} border-2 animate-pulse`}>
                <Icon size={56} strokeWidth={2.5} />
            </div>

            <h1 className={`text-4xl font-black mb-6 uppercase italic tracking-tight ${colorClass}`}>
                {feedback.title}
            </h1>

            <div className="bg-slate-800/80 rounded-2xl p-6 mb-6 border-2 border-slate-700">
                <div className="mb-6">
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-2">ARRANCA</p>
                    <p className="text-4xl text-blue-400 font-black tracking-tight mb-2">{feedback.subtitle}</p>
                </div>

                <div className="bg-blue-500/10 rounded-xl p-5 border-2 border-blue-500/30">
                    <p className="text-xs uppercase tracking-widest font-bold text-blue-300 mb-3">Dirección de turnos</p>
                    <div className="flex items-center justify-center gap-3">
                        {feedback.direction === 'derecha' ? (
                            <div className="flex items-center gap-2 animate-pulse">
                                <ArrowBigRight size={40} className="text-blue-400" fill="currentColor" />
                                <span className="text-3xl font-black uppercase text-blue-400">DERECHA</span>
                                <ArrowBigRight size={40} className="text-blue-400" fill="currentColor" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 animate-pulse">
                                <ArrowBigRight size={40} className="text-blue-400 rotate-180" fill="currentColor" />
                                <span className="text-3xl font-black uppercase text-blue-400">IZQUIERDA</span>
                                <ArrowBigRight size={40} className="text-blue-400 rotate-180" fill="currentColor" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 mt-4 border border-slate-700/50">
                    <p className="text-slate-300 text-base leading-relaxed font-medium">{feedback.description}</p>
                </div>
            </div>

            <Button
                onClick={() => {
                    setFeedback(null);
                    setGameState(prev => ({ ...prev, phase: 'DEBATE' }));
                }}
                fullWidth
                variant="primary"
                className="py-5 text-lg font-black uppercase tracking-wide shadow-xl"
            >
                <PlayCircle className="inline mr-2" size={24} />
                ¡EMPEZAR A DISCUTIR!
            </Button>
          </div>
        ) : (
          /* Mensajes de ELIMINACIÓN (success/danger/info) - Animación mejorada */
          <div className={`relative z-10 w-full max-w-lg bg-slate-900/95 p-8 rounded-3xl border-2 border-slate-800 shadow-2xl backdrop-blur-xl animate-dramatic-enter ${isDanger && roleRevealed ? 'animate-shake' : ''}`}>
            {/* Spotlight pulse background */}
            <div className={`absolute inset-0 rounded-3xl ${isSuccess ? 'bg-green-500/5' : isDanger ? 'bg-red-500/5' : 'bg-blue-500/5'} animate-spotlight-pulse`}></div>

            {/* Confetti for success */}
            {isSuccess && roleRevealed && (
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      bottom: '20%',
                      backgroundColor: ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#f97316'][i % 6],
                      animation: `confettiPiece ${0.8 + Math.random() * 0.6}s ease-out ${Math.random() * 0.3}s forwards`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Ícono principal */}
            <div className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 ${bgClass} ${colorClass} border-2 ${isSuccess ? 'animate-bounce-slow' : 'animate-pulse'}`}>
                <Icon size={56} strokeWidth={2.5} />
            </div>

            {/* Título principal */}
            <h1 className={`relative z-10 text-4xl font-black mb-6 uppercase italic tracking-tight ${colorClass}`}>
                {feedback.title}
            </h1>

            {/* Card del jugador eliminado */}
            <div className="relative z-10 bg-slate-800/80 rounded-2xl p-6 mb-6 border-2 border-slate-700">
                <div className="mb-4">
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-2">ELIMINADO</p>
                    <p className="text-3xl text-white font-black tracking-tight">{feedback.subtitle}</p>
                </div>

                {/* Rol - oculto hasta reveal */}
                {feedback.role && (
                    <div className={`rounded-xl p-4 border-2 mb-4 ${roleColorClass}`}>
                        <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-1">Su rol era:</p>
                        {roleRevealed ? (
                          <p className="text-3xl font-black uppercase tracking-tight animate-role-reveal">{feedback.role}</p>
                        ) : (
                          <p className="text-3xl font-black uppercase tracking-tight animate-pulse text-slate-500">???</p>
                        )}
                    </div>
                )}

                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <p className="text-slate-300 text-base leading-relaxed font-medium">{feedback.description}</p>
                </div>

                {feedback.extraInfo && (
                    <div className="mt-4 bg-slate-950/50 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-slate-400 text-sm font-bold">{feedback.extraInfo}</p>
                    </div>
                )}
            </div>

            {/* Botón - aparece con delay */}
            {showContinueButton && (
              <div className="relative z-10 animate-fade-in">
                <Button
                    onClick={continueRound}
                    fullWidth
                    variant={isSuccess ? "primary" : "danger"}
                    className="py-5 text-lg font-black uppercase tracking-wide shadow-xl"
                >
                    <PlayCircle className="inline mr-2" size={24} />
                    {isSuccess ? 'Continuar Cazando' : 'Otra Ronda'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -- RENDER: LANDING --
  if (appMode === 'LANDING') {
      return (
          <LandingPhase
            onSelectLocal={() => setAppMode('LOCAL')}
            onSelectOnline={() => setAppMode('ONLINE_LOBBY')}
          />
      );
  }

  // -- RENDER: ONLINE LOBBY --
  if (appMode === 'ONLINE_LOBBY') {
      return (
          <OnlineLobby onBack={() => setAppMode('LANDING')} />
      );
  }

  // -- RENDER: GAME (Local) --
  const isGameActive = ['ASSIGNMENT_WAIT', 'ASSIGNMENT_REVEAL', 'DEBATE', 'VOTING', 'VOTING_PASS', 'VOTING_REVEAL', 'LAST_BULLET'].includes(gameState.phase);
  const isAssignmentPhase = ['ASSIGNMENT_WAIT', 'ASSIGNMENT_REVEAL'].includes(gameState.phase);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      <ReloadPrompt />

      {/* FLOATING SCOREBOARD */}
      {!isAssignmentPhase && (
        <div className="fixed top-4 right-4 z-50">
            <button
                onClick={() => setShowScoreboard(true)}
                className="bg-slate-800/80 p-3 rounded-full text-yellow-400 hover:text-yellow-300 border border-yellow-500/50 hover:bg-slate-700 transition-all shadow-lg backdrop-blur-sm animate-fade-in"
            >
                <Trophy size={20} />
            </button>
        </div>
      )}

      {/* SCOREBOARD MODAL */}
      {showScoreboard && (
        <Scoreboard
            scores={scores}
            onReset={() => { resetScores(); if(gameState.phase === 'SETUP') setGameState(prev => ({...prev})); }}
            onClose={() => setShowScoreboard(false)}
        />
      )}

      {/* IN-GAME SETTINGS */}
      <div className="fixed top-4 left-4 z-50">
            <button
                onClick={() => setShowInGameSettings(!showInGameSettings)}
                className="bg-slate-800/80 p-3 rounded-full text-slate-300 hover:text-white border border-slate-600 hover:bg-slate-700 transition-all shadow-lg backdrop-blur-sm"
            >
                <Settings size={20} />
            </button>

            {showInGameSettings && (
                <div className="absolute top-14 left-0 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 flex flex-col gap-2 animate-fade-in z-50">
                    <button
                        onClick={handleReturnToMenu}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-left text-sm font-bold text-slate-300 hover:text-white transition-colors"
                    >
                        <Home size={16} /> Menú Principal
                    </button>
                    {isGameActive && (
                        <>
                        <button
                            onClick={handleResetToSetup}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-left text-sm font-bold text-slate-300 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={16} /> Volver a Configurar
                        </button>
                        <button
                            onClick={handleFullReset}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-left text-sm font-bold text-slate-300 hover:text-white transition-colors"
                        >
                            <RefreshCw size={16} /> Reiniciar Partida
                        </button>
                        </>
                    )}
                </div>
            )}

            {showInGameSettings && (
                <div className="fixed inset-0 z-40" onClick={() => setShowInGameSettings(false)}></div>
            )}
        </div>

      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">

        {gameState.phase === 'SETUP' && (
          <div className="p-4 flex-1 flex flex-col justify-center">
            <SetupPhase
                onStartGame={(names, ic, uc, themes, mode, limit, secret) => startGame(names, ic, uc, themes, mode, limit, secret)}
                scores={scores}
                onResetScores={resetScores}
                soundEnabled={soundEnabled}
                vibrationEnabled={vibrationEnabled}
                onToggleSound={toggleSound}
                onToggleVibration={toggleVibration}
            />
          </div>
        )}

        {(gameState.phase === 'ASSIGNMENT_WAIT' || gameState.phase === 'ASSIGNMENT_REVEAL') && (
          <AssignmentPhase
            key={`${gameState.gameId}-${gameState.players[gameState.currentPlayerIndex].id}`}
            player={gameState.players[gameState.currentPlayerIndex]}
            onNext={handleNextPlayer}
            revealMode='pass-and-play'
            playSound={playSound}
          />
        )}

        {gameState.phase === 'DEBATE' && (
          <DebatePhase
            timerDuration={gameState.timerOverride || timerDuration}
            onTimerEnd={() => {
              setGameState(prev => ({
                ...prev,
                phase: prev.useSecretVoting ? 'VOTING_PASS' : 'VOTING',
                votes: {},
                votingPlayerIndex: 0,
              }));
            }}
            isLocalMode={true}
            currentRound={gameState.currentRound}
            maxRounds={gameState.maxRounds}
            activeEvent={gameState.activeEvent}
            playSound={playSound}
          />
        )}

        {gameState.phase === 'VOTING_PASS' && (() => {
          const alivePlayers = gameState.players.filter(p => !p.isDead);
          const currentVoter = alivePlayers[gameState.votingPlayerIndex];
          if (!currentVoter) return null;
          return (
            <LocalVotingPhase
              key={currentVoter.id}
              player={currentVoter}
              allPlayers={gameState.players}
              onVoteSubmitted={handleLocalVote}
              playSound={playSound}
            />
          );
        })()}

        {gameState.phase === 'VOTING_REVEAL' && (
          <VoteRevealPhase
            votes={gameState.votes}
            players={gameState.players}
            onRevealComplete={handleVoteRevealComplete}
            playSound={playSound}
          />
        )}

        {gameState.phase === 'VOTING' && (
          <VotingPhase
            players={gameState.players}
            onVote={handleVote}
          />
        )}

        {gameState.phase === 'LAST_BULLET' && (
            <LastBulletPhase
                impostorName={gameState.players.find(p => p.role === 'impostor' && p.isDead)?.name || 'El Impostor'}
                onGuess={handleLastBulletGuess}
            />
        )}

        {gameState.phase === 'GAME_OVER' && (
          <ResultPhase
            winner={gameState.winner!}
            players={gameState.players}
            secretWord={gameState.secretWord}
            scores={scores}
            onPlayAgain={handleReplay}
            onChangeSetup={handleResetToSetup}
            currentRound={gameState.currentRound}
            playSound={playSound}
          />
        )}
      </div>
      <Analytics />
    </div>
  );
}
