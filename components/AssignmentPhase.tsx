import React, { useState } from 'react';
import { Eye, EyeOff, ChevronRight, MousePointerClick } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

interface AssignmentPhaseProps {
  player: Player;
  onNext: () => void;
}

export const AssignmentPhase: React.FC<AssignmentPhaseProps> = ({ player, onNext }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isImpostor = player.role === 'impostor';
  
  // NOTE: Undercover players think they are citizens in the UI, 
  // but they see the 'undercover' word (which is passed in player.word).
  // Only the Impostor explicitly knows they are the enemy.
  const displayRole = isImpostor ? 'IMPOSTOR' : 'CIUDADANO';

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
        {/* Front of Card (Closed) */}
        <div className="absolute inset-0 backface-hidden w-full h-full bg-slate-800 rounded-3xl border border-slate-600 shadow-2xl flex flex-col items-center justify-between p-8 text-center">
          <div className="mt-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-6 text-white border-4 border-slate-700 shadow-lg animate-bounce-slow">
              <span className="text-4xl">📱</span>
            </div>
            <h3 className="text-slate-400 uppercase text-xs tracking-[0.2em] font-bold mb-3">CONFIDENCIAL</h3>
            <h1 className="text-4xl font-black text-white leading-tight">
              Che, pasale el fono a<br/>
              <span className="text-blue-400">{player.name}</span>
            </h1>
          </div>
          
          <div className="w-full space-y-4">
            <p className="text-slate-500 text-sm italic">Que nadie más relojee la pantalla...</p>
            <Button 
                onClick={() => setIsFlipped(true)}
                variant="secondary"
                fullWidth
                className="py-4 border-2 border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 font-bold tracking-wide"
            >
                <MousePointerClick className="inline mr-2" size={20}/> TOCÁ PARA REVELAR
            </Button>
          </div>
        </div>

        {/* Back of Card (Revealed) */}
        <div className={`absolute inset-0 backface-hidden w-full h-full rounded-3xl border-2 shadow-2xl flex flex-col items-center justify-between p-6 text-center rotate-y-180 bg-slate-900 ${
          isImpostor 
            ? 'border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.25)]' 
            : 'border-blue-500 shadow-[0_0_50px_rgba(37,99,235,0.25)]'
        }`}>
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="mb-6">
                {isImpostor ? (
                <div className="w-28 h-28 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border-2 border-red-500/30">
                    <EyeOff size={56} />
                </div>
                ) : (
                <div className="w-28 h-28 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500 border-2 border-blue-500/30">
                    <Eye size={56} />
                </div>
                )}
            </div>

            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">TU ROL ES</h2>
            <h1 className={`text-4xl font-black mb-8 uppercase tracking-tight ${isImpostor ? 'text-red-500' : 'text-blue-500'}`}>
                {displayRole}
            </h1>

            {isImpostor ? (
                <div className="bg-red-900/20 p-6 rounded-2xl border border-red-500/30 w-full animate-pulse">
                <p className="text-red-200 text-lg font-medium">
                    No tenés idea qué es.<br/>
                    <span className="font-black text-red-400 block mt-2 text-xl">¡Chamuyá con confianza!</span>
                </p>
                </div>
            ) : (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-2">La palabra posta es</p>
                    <p className="text-3xl font-black text-white tracking-tight break-words">{player.word}</p>
                </div>
            )}
          </div>

          <Button 
            onClick={handleNext}
            variant={isImpostor ? 'danger' : 'primary'}
            fullWidth
            className="mt-6 py-4 text-lg shadow-xl"
          >
            LISTO, BORRAR <ChevronRight className="inline ml-1" size={24} />
          </Button>
        </div>
      </div>
      
      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .animate-bounce-slow { animation: bounce 2s infinite; }
      `}</style>
    </div>
  );
};