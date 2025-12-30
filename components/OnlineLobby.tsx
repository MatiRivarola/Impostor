import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Copy, Share2, Users, Crown, LogIn, Plus, Play, RotateCcw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Button } from './Button';
import { Player, Role, EliminationData } from '../types';
import { AssignmentPhase } from './AssignmentPhase';
import { DebatePhase } from './DebatePhase';
import { VotingPhase } from './VotingPhase';
import { EliminationPhase } from './EliminationPhase';
import { ResultPhase } from './ResultPhase';
import { PlayerAvatar } from './PlayerAvatar';
import { getGameWords } from '../services/wordService';
import { THEMES } from '../constants';

// --- CONFIGURATION ---
// URL del servidor Socket.IO (desde variable de entorno)
const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'; 

interface OnlineLobbyProps {
  onBack: () => void;
}

type OnlinePhase = 'LOBBY' | 'ASSIGNMENT' | 'DEBATE' | 'VOTING' | 'ELIMINATION' | 'RESULT';

interface GameConfig {
  themes: string[];
  impostorCount: number;
  undercoverCount: number;
  gameMode: 'classic' | 'chaos' | 'hardcore';
}

interface RoomData {
  code: string;
  hostId: string;
  phase: OnlinePhase;
  players: Player[];
  secretWord: string;
  undercoverWord: string;
  winner: 'citizens' | 'impostor' | null;
  gameConfig?: GameConfig;
  eliminationData?: EliminationData;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onBack }) => {
  // Navigation & Auth State
  const [view, setView] = useState<'menu' | 'join' | 'create'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  
  // Lobby State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [isInRoom, setIsInRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Connection State Management
  const [connectionState, setConnectionState] = useState<'initial' | 'connecting' | 'connected' | 'creating_room' | 'joining_room' | 'reconnecting' | 'failed'>('initial');
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Game Configuration (for host only)
  const [selectedThemes, setSelectedThemes] = useState<string[]>(['argentina']);
  const [impostorCount, setImpostorCount] = useState(1);
  const [undercoverCount, setUndercoverCount] = useState(0);
  const [gameMode, setGameMode] = useState<'classic' | 'chaos' | 'hardcore'>('classic');

  // --- WEBSOCKET CONNECTION ---

  useEffect(() => {
    setConnectionState('connecting');

    // 1. Initialize Socket con opciones de reconexión
    const newSocket = io(SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    });
    setSocket(newSocket);

    // 2. Event Listeners
    newSocket.on('connect', () => {
        setIsConnected(true);
        setConnectionState('connected');
        setConnectionAttempts(0);
        console.log("Conectado al servidor WS:", newSocket.id);

        // NUEVO: Reconectar a sala si estábamos en una
        const savedRoom = sessionStorage.getItem('current_room_code');
        const savedPlayerId = sessionStorage.getItem('my_player_id');

        if (savedRoom && savedPlayerId) {
            setConnectionState('reconnecting');
            console.log("Intentando reconexión a sala", savedRoom);
            newSocket.emit('reconnect_player', {
                code: savedRoom,
                playerId: savedPlayerId
            });
        }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
        setConnectionAttempts(attemptNumber);
        setConnectionState('reconnecting');
    });

    newSocket.on('disconnect', (reason) => {
        setIsConnected(false);

        if (reason === 'io server disconnect') {
            setConnectionState('failed');
            setErrorMsg("El servidor cerró la conexión.");
        } else {
            const savedRoom = sessionStorage.getItem('current_room_code');
            if (savedRoom) {
                setConnectionState('reconnecting');
            } else {
                setConnectionState('connecting');
            }
        }
    });

    newSocket.on('reconnect_failed', () => {
        setConnectionState('failed');
        setErrorMsg("No se pudo conectar después de varios intentos.");
    });

    newSocket.on('error_msg', (msg: string) => {
        setErrorMsg(msg);
        // Si falla la reconexión, limpiar sessionStorage y volver al menú
        if (connectionState === 'reconnecting') {
            sessionStorage.removeItem('current_room_code');
            sessionStorage.removeItem('my_player_id');
            setConnectionState('connected');
            setIsInRoom(false);
            setCurrentRoom(null);
            setView('menu');
        }
        // Si falla crear/unirse, volver a connected
        if (connectionState === 'creating_room' || connectionState === 'joining_room') {
            setConnectionState('connected');
        }
    });

    newSocket.on('room_joined', ({ room, playerId }: { room: RoomData, playerId: string }) => {
        // NUEVO: Guardar en sessionStorage para reconexión
        sessionStorage.setItem('current_room_code', room.code);
        sessionStorage.setItem('my_player_id', playerId);

        setCurrentRoom(room);
        setMyPlayerId(playerId);
        setIsInRoom(true);
        setErrorMsg(null);
        setConnectionState('connected'); // IMPORTANTE: Volver a connected después de room_joined
    });

    newSocket.on('room_updated', (updatedRoom: RoomData) => {
        setCurrentRoom(updatedRoom);
    });

    // NUEVO: Listeners para desconexión/reconexión de jugadores
    newSocket.on('player_disconnected', ({ playerId, playerName, timeWindow }) => {
        console.log(`${playerName} se desconectó. Puede reconectar en ${timeWindow/1000}s`);
    });

    newSocket.on('player_reconnected', ({ playerId, playerName }) => {
        console.log(`${playerName} se reconectó`);
    });

    newSocket.on('host_transferred', ({ newHostId, newHostName, message }) => {
        console.log(message);
        // Opcional: Mostrar modal o toast
    });

    newSocket.on('room_closing', ({ reason, timeRemaining }) => {
        console.log(`La sala se cerrará en ${timeRemaining/1000}s. Razón: ${reason}`);
    });

    // Cleanup
    return () => {
        newSocket.disconnect();
    };
  }, []);


  // --- ACTIONS (Emitting Events) ---

  const handleCreate = () => {
    if (!playerName.trim() || !socket) return;
    setConnectionState('creating_room');
    setErrorMsg(null);
    socket.emit('create_room', { playerName });
  };

  const handleJoin = () => {
    if (!playerName.trim() || roomCode.length !== 4 || !socket) return;
    setConnectionState('joining_room');
    setErrorMsg(null);
    socket.emit('join_room', { code: roomCode.toUpperCase(), playerName });
  };

  const handleCancelReconnect = () => {
    sessionStorage.removeItem('current_room_code');
    sessionStorage.removeItem('my_player_id');
    setConnectionState('connected');
    setIsInRoom(false);
    setCurrentRoom(null);
    setView('menu');
    setErrorMsg(null);
  };

  // NUEVO: El servidor ahora maneja TODA la lógica del juego
  // El cliente solo emite intenciones, el servidor valida y ejecuta

  const handleStartGame = () => {
    if (!currentRoom || !socket) return;

    const config: GameConfig = {
      themes: selectedThemes,
      impostorCount: impostorCount,
      undercoverCount: undercoverCount,
      gameMode: gameMode,
    };

    socket.emit('start_game', { code: currentRoom.code, config });
  };

  const handleNextPhase = (nextPhase: OnlinePhase) => {
    if (!currentRoom || !socket) return;
    socket.emit('change_phase', { code: currentRoom.code, nextPhase });
  };

  const handleVote = (victimId: string) => {
    if (!currentRoom || !socket) return;
    // El servidor validará el voto y calculará el resultado
    socket.emit('cast_vote', { code: currentRoom.code, votedPlayerId: victimId });
  };

  const handleExitRoom = () => {
    // NUEVO: Limpiar sessionStorage
    sessionStorage.removeItem('current_room_code');
    sessionStorage.removeItem('my_player_id');

    if(socket) socket.disconnect();
    // Re-connect for menu
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    setIsInRoom(false);
    setCurrentRoom(null);
    setMyPlayerId('');
    setView('menu');
  };

  const handlePlayAgain = () => {
    if (!currentRoom || !socket) return;
    // El servidor reiniciará el juego
    socket.emit('reset_game', { code: currentRoom.code });
  };

  // Utilities
  const copyCode = () => currentRoom && navigator.clipboard.writeText(currentRoom.code);
  const shareCode = () => {
    if (currentRoom && navigator.share) {
        navigator.share({
            title: 'Impostor Cordobés',
            text: `¡Entrá a mi sala! Código: ${currentRoom.code}`,
            url: window.location.href
        }).catch(() => {});
    } else {
        copyCode();
    }
  };

  // --- RENDER PHASES ---

  // Estado: Conectando inicialmente
  if (connectionState === 'initial' || connectionState === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Conectando al servidor...</h2>
        <p className="text-slate-400 mb-6">
          <span className="font-mono bg-slate-900 px-2 py-1 rounded">{SERVER_URL}</span>
        </p>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Estado: Armando sala
  if (connectionState === 'creating_room') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Armando sala...</h2>
        <p className="text-slate-400">Preparando todo para jugar</p>
        <div className="flex gap-2 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-green-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Estado: Uniéndose a sala
  if (connectionState === 'joining_room') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Uniéndose a la sala...</h2>
        <p className="text-slate-400 mb-2">Código: <span className="font-mono font-bold text-white">{roomCode.toUpperCase()}</span></p>
        <div className="flex gap-2 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Estado: Reconectando
  if (connectionState === 'reconnecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Reconectando a tu sala...</h2>
        <p className="text-slate-400 mb-2">Intentando restablecer conexión</p>
        {errorMsg && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg px-4 py-2 mt-4 max-w-md">
            <p className="text-red-300 text-sm">{errorMsg}</p>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button onClick={handleCancelReconnect} variant="secondary">
            Volver al Menú
          </Button>
          <Button onClick={() => window.location.reload()} variant="primary">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Estado: Error/Fallo
  if (connectionState === 'failed' || (!isConnected && connectionAttempts >= 5)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center animate-fade-in">
        <WifiOff size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error de Conexión</h2>
        <p className="text-slate-400 mb-4">{errorMsg || "No se pudo conectar"}</p>
        <p className="text-slate-500 text-sm mb-6">
          Verificá que el backend esté en <span className="font-mono bg-slate-900 px-2 py-1 rounded">{SERVER_URL}</span>
        </p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} variant="primary">Reintentar</Button>
          <Button onClick={onBack} variant="secondary">Volver</Button>
        </div>
      </div>
    );
  }

  // 1. ASSIGNMENT (Single Player View)
  if (isInRoom && currentRoom?.phase === 'ASSIGNMENT') {
      const myPlayer = currentRoom.players.find(p => p.id === myPlayerId);
      
      // Handle edge case if player data is missing locally
      if (!myPlayer) return <div className="p-10 text-center text-white">Cargando datos del jugador...</div>;

      return (
          <div className="min-h-screen bg-slate-950 flex flex-col pt-8">
              <AssignmentPhase 
                player={myPlayer} 
                onNext={() => {
                    // Waiting state logic is handled by UI below
                }} 
                revealMode="single-player" 
              />
              
              {/* Sync Control for Host */}
              {myPlayerId === currentRoom.hostId ? (
                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 border-t border-slate-800 z-50">
                      <Button onClick={() => handleNextPhase('DEBATE')} fullWidth variant="primary">
                         INICIAR DEBATE (Todos listos)
                      </Button>
                  </div>
              ) : (
                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 border-t border-slate-800 z-50 text-center">
                      <p className="text-slate-400 animate-pulse text-sm font-bold uppercase tracking-wider">Esperando al anfitrión...</p>
                  </div>
              )}
          </div>
      );
  }

  // 2. DEBATE
  if (isInRoom && currentRoom?.phase === 'DEBATE') {
      const isHost = myPlayerId === currentRoom.hostId;
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col pt-4">
              <DebatePhase
                timerDuration={180}
                onTimerEnd={() => {
                    if (isHost) handleNextPhase('VOTING');
                }}
                players={currentRoom.players}
              />
              {!isHost && (
                <div className="text-center p-4 text-slate-500 text-sm">
                    El anfitrión controla el tiempo.
                </div>
              )}
          </div>
      );
  }

  // 3. VOTING
  if (isInRoom && currentRoom?.phase === 'VOTING') {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col pt-4">
              <VotingPhase
                players={currentRoom.players}
                myPlayerId={myPlayerId}
                onVote={handleVote}
                socket={socket}
              />
          </div>
      );
  }

  // 3.5. ELIMINATION
  if (isInRoom && currentRoom?.phase === 'ELIMINATION' && currentRoom.eliminationData) {
      return (
          <EliminationPhase
            eliminationData={currentRoom.eliminationData}
            onContinue={handleChangePhase('DEBATE')}
          />
      );
  }

  // 4. RESULTS
  if (isInRoom && currentRoom?.phase === 'RESULT') {
      const isHost = myPlayerId === currentRoom.hostId;
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col pt-4">
              <ResultPhase 
                winner={currentRoom.winner || 'impostor'} 
                players={currentRoom.players} 
                secretWord={currentRoom.secretWord} 
                scores={{}} 
                onPlayAgain={isHost ? handlePlayAgain : () => {}} 
                onChangeSetup={handleExitRoom} 
              />
              {!isHost && (
                  <div className="p-4 text-center text-slate-400 bg-slate-900">
                      Esperando que el anfitrión reinicie...
                  </div>
              )}
          </div>
      );
  }

  // 5. LOBBY VIEW (WAITING ROOM)
  if (isInRoom && currentRoom) {
      const isHost = myPlayerId === currentRoom.hostId;

      return (
        <div className="flex flex-col min-h-screen p-4 animate-fade-in relative bg-slate-950 text-slate-100">
            {/* Header/Back */}
            <button onClick={handleExitRoom} className="absolute top-4 left-4 p-3 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20">
                <ArrowLeft size={20} />
            </button>

            {/* Connection Status Indicator */}
            <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] text-green-500 font-bold uppercase">Online</span>
            </div>

            {/* Content Wrapper */}
            <div className="flex-1 flex flex-col md:flex-row items-center md:items-start md:justify-center max-w-6xl mx-auto w-full gap-6 md:gap-12 mt-16 md:mt-24">
                
                {/* Left Column: Code & Actions */}
                <div className="w-full max-w-md md:w-1/3 flex flex-col gap-6">
                    <div className="text-center md:text-left">
                        <p className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-3 pl-1">Sala de Espera</p>
                        <div 
                            onClick={copyCode}
                            className="bg-slate-800 border-2 border-blue-500/50 rounded-3xl p-8 cursor-pointer hover:bg-slate-800/80 transition-all active:scale-95 flex flex-col items-center gap-3 group shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h1 className="text-7xl font-black text-white tracking-widest relative z-10">{currentRoom.code}</h1>
                            <p className="text-blue-400 text-xs font-bold uppercase flex items-center gap-2 group-hover:text-blue-300 relative z-10">
                                <Copy size={14} /> Tocar para copiar
                            </p>
                        </div>
                    </div>

                    <div className="w-full space-y-3">
                        {isHost ? (
                            <Button
                              onClick={handleStartGame}
                              disabled={
                                currentRoom.players.length < 3 ||
                                selectedThemes.length === 0 ||
                                impostorCount >= currentRoom.players.length
                              }
                              variant="primary"
                              fullWidth
                              className="flex items-center justify-center gap-2 py-4 text-lg font-black shadow-lg shadow-blue-900/40 animate-pulse"
                            >
                                <Play size={24} fill="currentColor" /> INICIAR PARTIDA
                            </Button>
                        ) : (
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
                                <p className="text-slate-400 text-sm animate-pulse mb-1">Esperando al anfitrión...</p>
                                <p className="text-xs text-slate-600">Mínimo 3 jugadores</p>
                            </div>
                        )}
                        
                        <Button onClick={shareCode} variant="ghost" fullWidth className="flex items-center justify-center gap-2 border border-slate-700">
                            <Share2 size={18} /> Invitar Amigos
                        </Button>
                    </div>

                    {/* Panel de Configuración - Solo host en LOBBY */}
                    {isHost && (
                      <div className="mt-6 bg-slate-800/50 rounded-2xl border border-slate-700 p-4 space-y-4">
                        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wide">
                          Configuración del Juego
                        </h3>

                        {/* Selector de Modo */}
                        <div>
                          <label className="text-xs text-slate-400 mb-2 block">Modo de Juego</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'classic', label: 'CLÁSICO' },
                              { id: 'chaos', label: 'CAOS' },
                              { id: 'hardcore', label: 'HARDCORE' }
                            ].map((mode) => (
                              <button
                                key={mode.id}
                                onClick={() => setGameMode(mode.id as any)}
                                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                  gameMode === mode.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                {mode.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Cantidad de Impostores */}
                        <div>
                          <label className="text-xs text-slate-400 mb-2 block">
                            Impostores: {impostorCount}
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setImpostorCount(Math.max(1, impostorCount - 1))}
                              className="w-8 h-8 bg-slate-700 rounded text-white hover:bg-slate-600"
                            >
                              -
                            </button>
                            <div className="flex-1 bg-slate-900 rounded h-8 flex items-center justify-center font-bold text-white">
                              {impostorCount}
                            </div>
                            <button
                              onClick={() => setImpostorCount(Math.min(Math.floor(currentRoom.players.length / 2), impostorCount + 1))}
                              className="w-8 h-8 bg-slate-700 rounded text-white hover:bg-slate-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Cantidad de Encubiertos - Solo chaos/hardcore */}
                        {(gameMode === 'chaos' || gameMode === 'hardcore') && (
                          <div>
                            <label className="text-xs text-slate-400 mb-2 block">
                              Encubiertos: {undercoverCount}
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setUndercoverCount(Math.max(0, undercoverCount - 1))}
                                className="w-8 h-8 bg-slate-700 rounded text-white hover:bg-slate-600"
                              >
                                -
                              </button>
                              <div className="flex-1 bg-slate-900 rounded h-8 flex items-center justify-center font-bold text-yellow-400">
                                {undercoverCount}
                              </div>
                              <button
                                onClick={() => {
                                  const maxUndercover = Math.max(0, Math.floor(currentRoom.players.length * 0.4) - impostorCount);
                                  setUndercoverCount(Math.min(maxUndercover, undercoverCount + 1));
                                }}
                                className="w-8 h-8 bg-slate-700 rounded text-white hover:bg-slate-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Selector de Temas */}
                        <div>
                          <label className="text-xs text-slate-400 mb-2 block">
                            Temas ({selectedThemes.length} seleccionados)
                          </label>
                          <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                            {THEMES.map((theme) => (
                              <button
                                key={theme.id}
                                onClick={() => {
                                  if (selectedThemes.includes(theme.id)) {
                                    if (selectedThemes.length > 1) {
                                      setSelectedThemes(selectedThemes.filter(t => t !== theme.id));
                                    }
                                  } else {
                                    setSelectedThemes([...selectedThemes, theme.id]);
                                  }
                                }}
                                className={`p-2 rounded text-xs transition-all ${
                                  selectedThemes.includes(theme.id)
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                }`}
                                title={theme.label}
                              >
                                {theme.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* Right Column: Players List */}
                <div className="w-full max-w-md md:max-w-none md:w-2/3 bg-slate-900/50 rounded-3xl border border-slate-800 p-6 md:p-8 flex flex-col h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-300 flex items-center gap-3 text-xl">
                            <Users size={24} /> Jugadores Conectados
                        </h3>
                        <span className="bg-slate-800 border border-slate-700 text-sm px-3 py-1 rounded-full text-slate-300 font-mono font-bold">
                            {currentRoom.players.length}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                        {currentRoom.players.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 animate-fade-in hover:border-slate-500 transition-colors">
                                <PlayerAvatar
                                  avatar={p.avatar}
                                  color={p.color}
                                  isHost={p.id === currentRoom.hostId}
                                  size="lg"
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg truncate flex items-center gap-2">
                                        {p.name}
                                        {p.id === myPlayerId && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700">VOS</span>}
                                    </span>
                                    {p.id === currentRoom.hostId && <span className="text-xs text-yellow-500 font-bold uppercase">Anfitrión</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- MENU / JOIN / CREATE FLOW (Initial Screen) ---
  return (
    <div className="flex flex-col min-h-screen p-4 animate-fade-in bg-slate-950 text-slate-100">
        <div className="flex items-center mb-6 md:absolute md:top-6 md:left-6 z-10">
            <button onClick={onBack} className="p-2 -ml-2 md:ml-0 text-slate-400 hover:text-white flex items-center gap-2 hover:bg-slate-900 rounded-lg transition-colors pr-4">
                <ArrowLeft size={24} />
                <span className="font-bold hidden md:inline">Volver al Inicio</span>
            </button>
            <h1 className="text-xl font-bold ml-2 md:hidden">Modo Online</h1>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl mx-auto gap-8 md:gap-12 relative z-0">
            
            {view === 'menu' && (
                <>
                    <div className="text-center mb-4 md:mb-8">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-800 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-slate-700 shadow-2xl rotate-3">
                            <Users size={48} className="text-green-400 md:w-16 md:h-16" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic mb-2 tracking-tight">Multiplayer</h2>
                        <p className="text-slate-400 text-sm md:text-lg max-w-md mx-auto">
                            Jugá con amigos.<br/>Creá una sala y compartí el código.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-md md:max-w-2xl">
                        <button 
                            onClick={() => setView('create')}
                            className="w-full bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-green-500 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 transition-all group shadow-xl hover:-translate-y-1"
                        >
                            <div className="bg-green-500/20 p-4 rounded-full text-green-400 group-hover:scale-110 transition-transform">
                                <Plus size={32} />
                            </div>
                            <div className="text-center md:text-left">
                                <span className="block font-black text-white text-xl uppercase mb-1">Crear Sala</span>
                                <span className="text-slate-400 text-sm">Sos el anfitrión.</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => setView('join')}
                            className="w-full bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-blue-500 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 transition-all group shadow-xl hover:-translate-y-1"
                        >
                            <div className="bg-blue-500/20 p-4 rounded-full text-blue-400 group-hover:scale-110 transition-transform">
                                <LogIn size={32} />
                            </div>
                            <div className="text-center md:text-left">
                                <span className="block font-black text-white text-xl uppercase mb-1">Unirse</span>
                                <span className="text-slate-400 text-sm">Tengo código.</span>
                            </div>
                        </button>
                    </div>
                </>
            )}

            {(view === 'create' || view === 'join') && (
                <div className="animate-fade-in w-full max-w-md bg-slate-900/80 p-6 md:p-10 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-sm">
                     <h2 className="text-3xl font-black text-white uppercase italic text-center mb-8">
                        {view === 'create' ? 'Crear Sala' : 'Unirse a Sala'}
                     </h2>
                     
                     <div className="space-y-6">
                        <div>
                            <label className="text-xs uppercase font-bold text-slate-500 ml-1 mb-2 block">Tu Nombre</label>
                            <input 
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder={view === 'create' ? "Ej: El Messi" : "Ej: La Scaloneta"}
                                className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl p-4 text-white focus:border-green-500 focus:outline-none transition-colors text-lg"
                                autoFocus
                            />
                        </div>

                        {view === 'join' && (
                             <div>
                                <label className="text-xs uppercase font-bold text-slate-500 ml-1 mb-2 block">Código de Sala</label>
                                <input 
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                                    placeholder="ABCD"
                                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl p-4 text-white font-mono text-center text-3xl tracking-widest focus:border-blue-500 focus:outline-none transition-colors uppercase"
                                />
                            </div>
                        )}
                        
                        {errorMsg && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg text-center font-bold">
                                {errorMsg}
                            </div>
                        )}

                        <div className="pt-4 space-y-3">
                            <Button 
                                onClick={view === 'create' ? handleCreate : handleJoin} 
                                disabled={!playerName.trim() || (view === 'join' && roomCode.length < 4)} 
                                fullWidth 
                                variant="primary" 
                                className="py-4 text-lg font-bold"
                            >
                                {view === 'create' ? 'Generar Código' : 'Entrar a la Sala'}
                            </Button>
                            <button onClick={() => { setView('menu'); setErrorMsg(null); }} className="w-full text-center text-slate-500 text-sm hover:text-white py-3 transition-colors font-medium">
                                Cancelar
                            </button>
                        </div>
                     </div>
                </div>
            )}

        </div>
    </div>
  );
};