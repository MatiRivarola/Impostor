import React, { useState } from 'react';
import { ArrowLeft, Copy, Share2, Users, Crown, LogIn, Plus, Play, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { Player, Role } from '../types';
import { AssignmentPhase } from './AssignmentPhase';
import { DebatePhase } from './DebatePhase';
import { VotingPhase } from './VotingPhase';
import { ResultPhase } from './ResultPhase';
import { getGameWords } from '../services/wordService';

interface OnlineLobbyProps {
  onBack: () => void;
}

type OnlinePhase = 'LOBBY' | 'ASSIGNMENT' | 'DEBATE' | 'VOTING' | 'RESULT';

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onBack }) => {
  // Navigation & Auth State
  const [view, setView] = useState<'menu' | 'join' | 'create'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  
  // Lobby State
  const [isInRoom, setIsInRoom] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [hostName, setHostName] = useState('');
  
  // Game Logic State
  const [phase, setPhase] = useState<OnlinePhase>('LOBBY');
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [secretWord, setSecretWord] = useState('');
  const [winner, setWinner] = useState<'citizens' | 'impostor' | null>(null);

  // --- ACTIONS ---

  const handleCreate = () => {
    if (!playerName.trim()) return;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setGeneratedCode(code);
    setHostName(playerName);
    setMyPlayerId('host');
    // Simulating other players for the demo
    setPlayers([
        { id: 'host', name: playerName, role: 'citizen', isDead: false },
        { id: 'p2', name: 'Jugador 2', role: 'citizen', isDead: false },
        { id: 'p3', name: 'Jugador 3', role: 'citizen', isDead: false },
        { id: 'p4', name: 'Jugador 4', role: 'citizen', isDead: false },
    ]);
    setIsInRoom(true);
  };

  const handleJoin = () => {
    if (!playerName.trim() || roomCode.length !== 4) return;
    setGeneratedCode(roomCode.toUpperCase());
    setHostName('Anfitrión'); // We don't know the host name in this demo logic
    setMyPlayerId('me');
    // Simulating joining an existing room
    setPlayers([
        { id: 'host', name: 'Anfitrión', role: 'citizen', isDead: false },
        { id: 'me', name: playerName, role: 'citizen', isDead: false },
        { id: 'p3', name: 'Jugador 3', role: 'citizen', isDead: false },
        { id: 'p4', name: 'Jugador 4', role: 'citizen', isDead: false },
    ]);
    setIsInRoom(true);
  };

  const handleStartGame = () => {
    // 1. Setup Game Data (Simulating Server Logic)
    const { secretWord: word } = getGameWords(['argentina', 'cordoba']); // Default themes for demo
    setSecretWord(word);

    // 2. Assign Roles Randomly
    const newPlayers = [...players];
    const impostorIndex = Math.floor(Math.random() * newPlayers.length);
    
    newPlayers.forEach((p, index) => {
        p.isDead = false;
        if (index === impostorIndex) {
            p.role = 'impostor';
            p.word = undefined;
        } else {
            p.role = 'citizen';
            p.word = word;
        }
    });

    setPlayers(newPlayers);
    setPhase('ASSIGNMENT');
  };

  const handleVote = (victimId: string) => {
    // In a real app, we would send the vote to the server.
    // For this demo, we simulate the result immediately.
    
    const victim = players.find(p => p.id === victimId);
    if (!victim) return;

    // Simulate outcome
    if (victim.role === 'impostor') {
        setWinner('citizens');
    } else {
        setWinner('impostor');
    }
    setPhase('RESULT');
  };

  const resetGame = () => {
      setPhase('LOBBY');
  };

  // Utilities
  const copyCode = () => navigator.clipboard.writeText(generatedCode);
  const shareCode = () => {
    if (navigator.share) {
        navigator.share({
            title: 'Impostor Cordobés',
            text: `¡Entrá a mi sala! Código: ${generatedCode}`,
            url: window.location.href
        }).catch(() => {});
    } else {
        copyCode();
    }
  };

  // --- RENDER PHASES ---

  // 1. ASSIGNMENT (Single Player View)
  if (phase === 'ASSIGNMENT') {
      const myPlayer = players.find(p => p.id === myPlayerId);
      if (!myPlayer) return <div>Error loading player data</div>;

      return (
          <div className="min-h-screen bg-slate-950 flex flex-col pt-8">
              <AssignmentPhase 
                player={myPlayer} 
                onNext={() => setPhase('DEBATE')} 
                revealMode="single-player" // Critical: prevents "Pass Phone" UI
              />
          </div>
      );
  }

  // 2. DEBATE
  if (phase === 'DEBATE') {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col pt-4">
              <DebatePhase 
                timerDuration={180} 
                onTimerEnd={() => setPhase('VOTING')} 
              />
          </div>
      );
  }

  // 3. VOTING
  if (phase === 'VOTING') {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col pt-4">
              <VotingPhase 
                players={players} 
                onVote={handleVote} 
              />
          </div>
      );
  }

  // 4. RESULTS
  if (phase === 'RESULT') {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col pt-4">
              <ResultPhase 
                winner={winner || 'impostor'} 
                players={players} 
                secretWord={secretWord} 
                scores={{}} // No scoring in demo
                onPlayAgain={resetGame} 
                onChangeSetup={() => { setIsInRoom(false); setPhase('LOBBY'); }} 
              />
          </div>
      );
  }

  // 5. LOBBY VIEW (WAITING ROOM)
  if (isInRoom) {
      const isHost = myPlayerId === 'host';

      return (
        <div className="flex flex-col min-h-screen p-4 animate-fade-in relative bg-slate-950 text-slate-100">
            {/* Header/Back */}
            <button onClick={() => setIsInRoom(false)} className="absolute top-4 left-4 p-3 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20">
                <ArrowLeft size={20} />
            </button>

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
                            <h1 className="text-7xl font-black text-white tracking-widest relative z-10">{generatedCode}</h1>
                            <p className="text-blue-400 text-xs font-bold uppercase flex items-center gap-2 group-hover:text-blue-300 relative z-10">
                                <Copy size={14} /> Tocar para copiar
                            </p>
                        </div>
                    </div>

                    <div className="w-full space-y-3">
                        {isHost ? (
                            <Button onClick={handleStartGame} variant="primary" fullWidth className="flex items-center justify-center gap-2 py-4 text-lg font-black shadow-lg shadow-blue-900/40 animate-pulse">
                                <Play size={24} fill="currentColor" /> INICIAR PARTIDA
                            </Button>
                        ) : (
                            <Button disabled variant="secondary" fullWidth className="opacity-70 cursor-not-allowed py-4 text-lg">
                                Esperando al Host...
                            </Button>
                        )}
                        
                        <Button onClick={shareCode} variant="ghost" fullWidth className="flex items-center justify-center gap-2 border border-slate-700">
                            <Share2 size={18} /> Invitar Amigos
                        </Button>
                    </div>
                </div>

                {/* Right Column: Players List */}
                <div className="w-full max-w-md md:max-w-none md:w-2/3 bg-slate-900/50 rounded-3xl border border-slate-800 p-6 md:p-8 flex flex-col h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-300 flex items-center gap-3 text-xl">
                            <Users size={24} /> Jugadores Conectados
                        </h3>
                        <span className="bg-slate-800 border border-slate-700 text-sm px-3 py-1 rounded-full text-slate-300 font-mono font-bold">
                            {players.length}/10
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                        {players.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 animate-fade-in hover:border-slate-500 transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${i === 0 ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                                    {i === 0 ? <Crown size={20} /> : <Users size={20} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg truncate flex items-center gap-2">
                                        {p.name}
                                        {p.id === myPlayerId && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700">VOS</span>}
                                    </span>
                                    {i === 0 && <span className="text-xs text-yellow-500 font-bold uppercase">Anfitrión</span>}
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
                            Jugá con amigos a distancia.<br/>Cada uno desde su dispositivo.
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
                                <span className="text-slate-400 text-sm">Sos el anfitrión. Configurá la partida y pasá el código.</span>
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
                                <span className="text-slate-400 text-sm">Ya tenés un código de sala para entrar.</span>
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
                            <button onClick={() => setView('menu')} className="w-full text-center text-slate-500 text-sm hover:text-white py-3 transition-colors font-medium">
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