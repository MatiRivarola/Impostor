import React, { useState } from 'react';
import { Eye, EyeOff, ChevronRight, MousePointerClick, Check, Lock, ShieldAlert } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

interface AssignmentPhaseProps {
  player: Player;
  onNext: () => void;
  revealMode?: 'pass-and-play' | 'single-player'; // Default: pass-and-play
}

export const AssignmentPhase: React.FC<AssignmentPhaseProps> = ({
  player,
  onNext,
  revealMode = 'pass-and-play'
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isImpostor = player.role === 'impostor';
  const isUndercover = player.role === 'undercover';
  const isCitizen = player.role === 'citizen';

  // El encubierto ve "CIUDADANO" para no saber que es encubierto
  const displayRole = isImpostor ? 'IMPOSTOR' : 'CIUDADANO';
  const isSinglePlayer = revealMode === 'single-player';

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from bubbling anywhere else
    setIsFlipped(true);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-md mx-auto px-4 perspective-1000 py-6">
      
      {/* Card Container */}
      <div 
        className={`relative w-full aspect-[3/4.5] transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* --- FRONT OF CARD (CLOSED) --- */}
        {/* Added cursor-default to prevent implying the whole card is clickable */}
        <div className="absolute inset-0 backface-hidden w-full h-full bg-slate-800 rounded-3xl border-2 border-slate-600 shadow-2xl flex flex-col items-center justify-between p-8 text-center cursor-default">
          {/* Leyenda instructiva */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 w-full">
            <p className="text-blue-300 text-[11px] leading-tight font-medium">
              Cada jugador recibe su rol en secreto. Pasá el celular al jugador indicado y que solo esa persona mire.
            </p>
          </div>
          <div className="mt-4 flex flex-col items-center w-full">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mb-6 text-white border-4 border-slate-700 shadow-lg relative">
              <Lock size={40} className="animate-pulse" />
              <div className="absolute -bottom-2 bg-slate-900 text-xs px-2 py-1 rounded-full border border-slate-600 font-bold uppercase tracking-widest text-slate-400">
                Secreto
              </div>
            </div>
            
            <h3 className="text-slate-500 uppercase text-xs tracking-[0.3em] font-bold mb-4">MISIÓN CONFIDENCIAL</h3>
            
            {isSinglePlayer ? (
               <h1 className="text-3xl font-black text-white leading-tight mb-2">
                 Identidad<br/>
                 <span className="text-blue-400">Oculta</span>
               </h1>
            ) : (
               <>
                 <h1 className="text-2xl font-bold text-slate-300 leading-tight mb-1">
                   Pasale el fono a:
                 </h1>
                 <p className="text-4xl font-black text-white bg-slate-900/50 px-6 py-2 rounded-xl border border-slate-700/50">
                    {player.name}
                 </p>
               </>
            )}
          </div>
          
          <div className="w-full space-y-4">
            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                <p className="text-slate-400 text-xs italic flex items-center justify-center gap-2">
                    <ShieldAlert size={14} className="text-yellow-500"/>
                    {isSinglePlayer ? 'Mirá tu pantalla solo vos.' : 'Asegurate que nadie más esté mirando.'}
                </p>
            </div>
            
            {/* Explicit Button - The ONLY way to reveal */}
            <Button 
                onClick={handleReveal}
                variant="primary"
                fullWidth
                className="py-5 text-lg font-black tracking-wide border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
            >
                <MousePointerClick className="inline mr-2" size={24}/> REVELAR ROL
            </Button>
          </div>
        </div>

        {/* --- BACK OF CARD (REVEALED) --- */}
        <div className={`absolute inset-0 backface-hidden w-full h-full rounded-3xl border-2 shadow-2xl flex flex-col items-center justify-between p-6 text-center rotate-y-180 bg-slate-900 cursor-default ${
          isImpostor
            ? 'border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.25)]'
            : 'border-blue-500 shadow-[0_0_50px_rgba(37,99,235,0.25)]'
        }`}>
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="mb-6">
                {isImpostor ? (
                <div className="w-28 h-28 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border-2 border-red-500/30 animate-pulse">
                    <EyeOff size={56} />
                </div>
                ) : (
                <div className="w-28 h-28 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500 border-2 border-blue-500/30">
                    <Eye size={56} />
                </div>
                )}
            </div>

            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">TU ROL ES</h2>
            <h1 className={`text-4xl font-black mb-6 uppercase tracking-tight ${
              isImpostor ? 'text-red-500' : 'text-blue-500'
            }`}>
                {displayRole}
            </h1>

            {isImpostor ? (
                <div className="bg-red-900/20 p-6 rounded-2xl border border-red-500/30 w-full">
                    <p className="text-red-200 text-lg font-medium leading-relaxed">
                        No sabés la palabra secreta.
                    </p>
                    <div className="mt-4 bg-red-950/50 p-3 rounded-lg">
                        <p className="text-red-400 text-sm font-bold uppercase">Objetivo</p>
                        <p className="text-red-200 text-sm">Escuchá, deducí y mentí para que no te descubran.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-2">La palabra secreta es</p>
                    <p className="text-3xl font-black text-white tracking-tight break-words select-all">{player.word}</p>
                </div>
            )}
          </div>

          <Button
            onClick={handleNext}
            variant={isImpostor ? 'danger' : 'primary'}
            fullWidth
            className="mt-6 py-4 text-lg shadow-xl font-bold tracking-wide"
          >
            {isSinglePlayer ? (
                <><Check className="inline mr-1" size={24} /> ENTENDIDO, ESPERAR</>
            ) : (
                <>OCULTAR Y PASAR <ChevronRight className="inline ml-1" size={24} /></>
            )}
          </Button>
        </div>
      </div>
      
      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};