import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, FastForward, PlusCircle, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';
import { PlayerAvatar } from './PlayerAvatar';

interface DebatePhaseProps {
  timerDuration: number;
  onTimerEnd: () => void;
  players?: Player[];
  socket?: any;
  roomCode?: string;
  serverTimeRemaining?: number;
}

export const DebatePhase: React.FC<DebatePhaseProps> = ({
  timerDuration,
  onTimerEnd,
  players,
  socket,
  roomCode,
  serverTimeRemaining
}) => {
  // Usar tiempo del servidor si está disponible, sino usar el local
  const [timeLeft, setTimeLeft] = useState(serverTimeRemaining || timerDuration);
  const [isActive, setIsActive] = useState(true);

  // Generar orden aleatorio de jugadores vivos (solo una vez)
  const speakingOrder = useMemo(() => {
    if (!players) return [];
    const alivePlayers = players.filter(p => !p.isDead);
    return [...alivePlayers].sort(() => Math.random() - 0.5);
  }, [players]);

  // Sincronizar tiempo desde el servidor
  useEffect(() => {
    if (serverTimeRemaining !== undefined) {
      setTimeLeft(serverTimeRemaining);
    }
  }, [serverTimeRemaining]);

  // Escuchar actualizaciones del timer desde el servidor
  useEffect(() => {
    if (!socket) return;

    const handleTimerUpdate = ({ timeRemaining }: { timeRemaining: number }) => {
      setTimeLeft(timeRemaining);
      if (timeRemaining === 0) {
        setIsActive(false);
        // Send notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("¡Tiempo cumplido!", {
            body: "El debate ha terminado. El impostor gana.",
            icon: "/icon-192.png"
          });
        }
      }
    };

    const handleTimerExpired = ({ message }: { message: string }) => {
      console.log(message);
      // El servidor ya cambió la fase a RESULT, el componente se desmontará
    };

    socket.on('timer_update', handleTimerUpdate);
    socket.on('timer_expired', handleTimerExpired);

    return () => {
      socket.off('timer_update', handleTimerUpdate);
      socket.off('timer_expired', handleTimerExpired);
    };
  }, [socket]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Timer local de fallback (solo si no hay socket)
  useEffect(() => {
    if (socket) return; // Si hay socket, usar timer del servidor

    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Send notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("¡Tiempo cumplido!", {
            body: "El debate ha terminado. Es hora de votar.",
            icon: "/icon-192.png"
        });
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, socket]);

  const addMinute = () => {
    if (socket && roomCode) {
      // Emitir al servidor para añadir tiempo
      socket.emit('add_debate_time', { code: roomCode, seconds: 60 });
    } else {
      // Fallback local
      setTimeLeft(prev => prev + 60);
      setIsActive(true);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  
  // Calculate progress based on the initial duration or current max (in case time was added)
  const maxTime = Math.max(timerDuration, timeLeft); 
  const progress = (timeLeft / maxTime) * 100;
  const strokeDashoffset = 2 * Math.PI * 120 * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] py-6 animate-fade-in px-4 w-full max-w-lg mx-auto">
      <div className="text-center space-y-1 mb-4">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">¡A DISCUTIR!</h1>
        <p className="text-slate-400 text-sm">Sáquenle la ficha al que miente.</p>
      </div>

      {/* Orden de turnos */}
      {speakingOrder.length > 0 && (
        <div className="w-full bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-blue-400 mb-3">
            <ArrowRight size={18} />
            <h3 className="font-bold text-sm uppercase">Orden de Turnos</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {speakingOrder.map((player, index) => (
              <div key={player.id} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <PlayerAvatar
                      avatar={player.avatar}
                      color={player.color}
                      isHost={false}
                      size="sm"
                      showCrown={false}
                    />
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                        <span className="text-[10px] font-black text-white">1°</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">{player.name}</span>
                </div>
                {index < speakingOrder.length - 1 && (
                  <ArrowRight size={14} className="text-slate-600" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 text-center mt-3">
            <span className="font-bold text-green-400">{speakingOrder[0]?.name}</span> arranca la ronda
          </p>
        </div>
      )}

      {/* Timer Container */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-6">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="#1e293b"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-linear ${timeLeft < 60 ? 'text-red-500' : 'text-blue-500'}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-black font-mono tracking-tighter ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
            {formattedTime}
            </span>
            <button 
                onClick={addMinute}
                className="mt-2 flex items-center gap-1 text-xs font-bold uppercase bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1 rounded-full transition-colors border border-slate-700"
            >
                <PlusCircle size={14} /> 1 Min
            </button>
        </div>
      </div>

      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 w-full mb-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-2 text-yellow-500 mb-3">
          <AlertTriangle size={20} />
          <h3 className="font-bold text-base uppercase">Cómo no cagarla</h3>
        </div>
        <ul className="text-slate-300 space-y-2 text-sm list-disc pl-4 marker:text-yellow-500/50">
          <li>Tiren data pero <strong>no sean tan obvios</strong>.</li>
          <li>Si sos muy específico, el Impostor la saca al toque.</li>
          <li>Si sos muy vago, van a pensar que sos vos.</li>
        </ul>
      </div>

      <div className="w-full mt-auto">
        <Button 
            fullWidth 
            onClick={onTimerEnd} 
            variant={timeLeft === 0 ? "primary" : "secondary"}
            className={`py-4 text-lg shadow-lg ${timeLeft === 0 ? "animate-pulse border-2 border-blue-400" : ""}`}
        >
            {timeLeft === 0 ? "¡TIEMPO! A VOTAR" : "Terminar Debate Ya"} <FastForward className="ml-2" size={20} />
        </Button>
      </div>
    </div>
  );
};