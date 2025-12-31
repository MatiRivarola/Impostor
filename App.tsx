import React, { useState, useEffect } from 'react';
import { GameState, Player, ScoreMap, GameMode, AppMode } from './types';
import { SetupPhase } from './components/SetupPhase';
import { AssignmentPhase } from './components/AssignmentPhase';
import { DebatePhase } from './components/DebatePhase';
import { VotingPhase } from './components/VotingPhase';
import { ResultPhase } from './components/ResultPhase';
import { LastBulletPhase } from './components/LastBulletPhase';
import { Scoreboard } from './components/Scoreboard';
import { LandingPhase } from './components/LandingPhase';
import { OnlineLobby } from './components/OnlineLobby';
import { ReloadPrompt } from './components/ReloadPrompt';
import { getGameWords } from './services/wordService';
import { THEMES } from './constants';
import { Button } from './components/Button';
import { PlayCircle, AlertOctagon, Settings, ArrowLeft, RefreshCw, Trophy, Skull, CheckCircle, Home, ArrowRight, ArrowBigRight, Users } from 'lucide-react';

interface RoundFeedback {
    type: 'success' | 'danger' | 'info' | 'round_start';
    title: string;
    subtitle: string;
    description: string;
    role?: string; // Rol del jugador eliminado
    extraInfo?: string; // Información adicional
    direction?: 'derecha' | 'izquierda'; // Dirección de la ronda
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
  };

  // State Persistence Initialization
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
        const saved = localStorage.getItem('impostor_game_state');
        return saved ? JSON.parse(saved) : initialGameState;
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

  const updateScores = (winner: 'citizens' | 'impostor', players: Player[]) => {
    setScores(prevScores => {
        const newScores = { ...prevScores };
        players.forEach(p => {
            if (newScores[p.name] === undefined) newScores[p.name] = 0;

            if (winner === 'citizens') {
                if (p.role === 'citizen' || p.role === 'undercover') {
                    newScores[p.name] += 100;
                }
            } else {
                if (p.role === 'impostor') {
                    newScores[p.name] += 200;
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

  const startGame = (names: string[], impostorCount: number, undercoverCount: number, selectedThemes: string[], mode: GameMode) => {
    const { secretWord, undercoverWord, themeLabel } = getGameWords(selectedThemes);
    
    // Initialize Players
    const newPlayers: Player[] = names.map((name, i) => ({
      id: `p-${i}`,
      name,
      role: 'citizen',
      word: secretWord, 
      isDead: false,
    }));

    const indices = Array.from({ length: names.length }, (_, i) => i);
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    let i = 0;
    for (let count = 0; count < impostorCount; count++) {
      const idx = indices[i++];
      newPlayers[idx].role = 'impostor';
      newPlayers[idx].word = undefined; 
    }

    for (let count = 0; count < undercoverCount; count++) {
       if (i >= indices.length) break;
       const idx = indices[i++];
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
      gameId: `game-${Date.now()}-${Math.random()}`, // Unique ID to force AssignmentPhase reset
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
      // Al terminar de asignar roles, mostrar mensaje de inicio
      if (!gameState.roundStartShown) {
        // Elegir jugador aleatorio que arranca
        const alivePlayers = gameState.players.filter(p => !p.isDead);
        const randomPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        // Elegir dirección aleatoria
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
    updateScores(winner, finalPlayers);
    setGameState(prev => ({
        ...prev,
        players: finalPlayers,
        winner: winner,
        phase: 'GAME_OVER'
    }));
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
    setGameState(prev => ({ ...prev, phase: 'DEBATE' }));
  };

  const handleReplay = () => {
     const currentNames = gameState.players.map(p => p.name);
     startGame(currentNames, gameState.impostorCount, gameState.undercoverCount, selectedThemeIds, gameState.gameMode);
  };

  const handleResetToSetup = () => {
     setGameState(prev => ({ ...prev, phase: 'SETUP' }));
     setShowInGameSettings(false);
     localStorage.removeItem('impostor_game_state');
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
        // Para CIUDADANO o ENCUBIERTO (error)
        if (feedback.role === 'CIUDADANO') {
            roleColorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        } else if (feedback.role === 'ENCUBIERTO') {
            roleColorClass = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        }
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
        <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${gradientFrom} via-slate-950 to-slate-950`}></div>

        {/* Mensaje de INICIO DE RONDA */}
        {isRoundStart ? (
          <div className="relative z-10 w-full max-w-lg bg-slate-900/95 p-8 rounded-3xl border-2 border-blue-500/50 shadow-2xl backdrop-blur-xl">
            {/* Ícono principal */}
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 ${bgClass} ${colorClass} border-2 animate-pulse`}>
                <Icon size={56} strokeWidth={2.5} />
            </div>

            {/* Título principal */}
            <h1 className={`text-4xl font-black mb-6 uppercase italic tracking-tight ${colorClass}`}>
                {feedback.title}
            </h1>

            {/* Card con la información de inicio */}
            <div className="bg-slate-800/80 rounded-2xl p-6 mb-6 border-2 border-slate-700">
                {/* Jugador que arranca */}
                <div className="mb-6">
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-2">ARRANCA</p>
                    <p className="text-4xl text-blue-400 font-black tracking-tight mb-2">{feedback.subtitle}</p>
                </div>

                {/* Dirección con flechas */}
                <div className="bg-blue-500/10 rounded-xl p-5 border-2 border-blue-500/30">
                    <p className="text-xs uppercase tracking-widest font-bold text-blue-300 mb-3">Dirección de turnos</p>
                    <div className="flex items-center justify-center gap-3">
                        {feedback.direction === 'derecha' ? (
                            <>
                                <div className="flex items-center gap-2 animate-pulse">
                                    <ArrowBigRight size={40} className="text-blue-400" fill="currentColor" />
                                    <span className="text-3xl font-black uppercase text-blue-400">DERECHA</span>
                                    <ArrowBigRight size={40} className="text-blue-400" fill="currentColor" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 animate-pulse">
                                    <ArrowBigRight size={40} className="text-blue-400 rotate-180" fill="currentColor" />
                                    <span className="text-3xl font-black uppercase text-blue-400">IZQUIERDA</span>
                                    <ArrowBigRight size={40} className="text-blue-400 rotate-180" fill="currentColor" />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Descripción */}
                <div className="bg-slate-900/50 rounded-lg p-4 mt-4 border border-slate-700/50">
                    <p className="text-slate-300 text-base leading-relaxed font-medium">{feedback.description}</p>
                </div>
            </div>

            {/* Botón para empezar */}
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
          /* Mensajes de ELIMINACIÓN (success/danger/info) */
          <div className="relative z-10 w-full max-w-lg bg-slate-900/95 p-8 rounded-3xl border-2 border-slate-800 shadow-2xl backdrop-blur-xl">
            {/* Ícono principal */}
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 ${bgClass} ${colorClass} border-2 ${isSuccess ? 'animate-bounce-slow' : 'animate-pulse'}`}>
                <Icon size={56} strokeWidth={2.5} />
            </div>

            {/* Título principal */}
            <h1 className={`text-4xl font-black mb-6 uppercase italic tracking-tight ${colorClass}`}>
                {feedback.title}
            </h1>

            {/* Card del jugador eliminado */}
            <div className="bg-slate-800/80 rounded-2xl p-6 mb-6 border-2 border-slate-700">
                {/* Nombre del eliminado */}
                <div className="mb-4">
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-2">ELIMINADO</p>
                    <p className="text-3xl text-white font-black tracking-tight">{feedback.subtitle}</p>
                </div>

                {/* Rol revelado - GRANDE Y CLARO */}
                {feedback.role && (
                    <div className={`rounded-xl p-4 border-2 mb-4 ${roleColorClass}`}>
                        <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-1">Su rol era:</p>
                        <p className="text-3xl font-black uppercase tracking-tight">{feedback.role}</p>
                    </div>
                )}

                {/* Descripción */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <p className="text-slate-300 text-base leading-relaxed font-medium">{feedback.description}</p>
                </div>

                {/* Info extra (contadores) */}
                {feedback.extraInfo && (
                    <div className="mt-4 bg-slate-950/50 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-slate-400 text-sm font-bold">{feedback.extraInfo}</p>
                    </div>
                )}
            </div>

            {/* Botón para continuar */}
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
  const isGameActive = ['ASSIGNMENT_WAIT', 'ASSIGNMENT_REVEAL', 'DEBATE', 'VOTING', 'LAST_BULLET'].includes(gameState.phase);
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
      {/* Show settings always if game is running OR if we are in SETUP (to go back to menu) */}
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
                onStartGame={startGame} 
                scores={scores}
                onResetScores={resetScores}
            />
          </div>
        )}

        {(gameState.phase === 'ASSIGNMENT_WAIT' || gameState.phase === 'ASSIGNMENT_REVEAL') && (
          <AssignmentPhase
            key={`${gameState.gameId}-${gameState.players[gameState.currentPlayerIndex].id}`}
            player={gameState.players[gameState.currentPlayerIndex]}
            onNext={handleNextPlayer}
            revealMode='pass-and-play'
          />
        )}

        {gameState.phase === 'DEBATE' && (
          <DebatePhase
            timerDuration={timerDuration}
            onTimerEnd={() => setGameState(prev => ({ ...prev, phase: 'VOTING' }))}
            isLocalMode={true}
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
          />
        )}
      </div>
    </div>
  );
}