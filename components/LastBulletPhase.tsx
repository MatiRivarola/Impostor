import React, { useState } from 'react';
import { Target, Skull } from 'lucide-react';
import { Button } from './Button';

interface LastBulletPhaseProps {
  impostorName: string;
  onGuess: (word: string) => void;
}

export const LastBulletPhase: React.FC<LastBulletPhaseProps> = ({ impostorName, onGuess }) => {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onGuess(guess);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-6 animate-fade-in w-full max-w-md mx-auto">
      <div className="w-28 h-28 bg-red-600 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.5)]">
        <Target size={64} className="text-white" />
      </div>

      <h1 className="text-4xl font-black text-red-500 mb-2 uppercase text-center tracking-tight">
        ¡ÚLTIMA BALA!
      </h1>
      <p className="text-slate-300 text-center mb-8 text-lg">
        <span className="font-bold text-red-400">{impostorName}</span> ha sido atrapado.<br/>
        Si adivina la palabra secreta, <br/>
        <span className="font-bold text-white">LOS IMPOSTORES GANAN.</span>
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-500 ml-1">¿Cuál es la palabra?</label>
            <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Escribí tu respuesta..."
            className="w-full bg-slate-800/80 border-2 border-red-500/50 rounded-xl px-4 py-4 focus:outline-none focus:border-red-500 text-white placeholder-slate-500 text-xl font-bold text-center shadow-inner"
            autoFocus
            />
        </div>

        <Button 
            type="submit"
            disabled={!guess.trim()}
            fullWidth 
            variant="danger"
            className="py-4 text-lg shadow-lg shadow-red-900/40"
        >
            DISPARAR <Skull className="ml-2 inline" size={20}/>
        </Button>
      </form>
      
      <p className="mt-6 text-xs text-slate-500 text-center italic">
        Cuidado... si le pifiás, pierden.
      </p>
    </div>
  );
};