import React, { useState, useEffect } from 'react';
import { AlertTriangle, FastForward, PlusCircle } from 'lucide-react';
import { Button } from './Button';

interface DebatePhaseProps {
  timerDuration: number;
  onTimerEnd: () => void;
}

export const DebatePhase: React.FC<DebatePhaseProps> = ({ timerDuration, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const addMinute = () => {
    setTimeLeft(prev => prev + 60);
    setIsActive(true);
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