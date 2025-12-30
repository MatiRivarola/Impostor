import React, { useEffect } from 'react';
import { Skull, Heart, Drama } from 'lucide-react';
import { EliminationData } from '../types';
import { PlayerAvatar } from './PlayerAvatar';

interface EliminationPhaseProps {
  eliminationData: EliminationData;
  onContinue: () => void;
}

const ARGENTINE_PHRASES = {
  impostor: [
    "¡Lo hicieron pelota al impostor!",
    "¡Cayó el buchón!",
    "¡Le dieron con todo al impostor!",
    "¡Qué manera de mandarlo al muere!",
    "¡Chau impostor, a la B!",
  ],
  citizen: [
    "¡La pifiaron! Era un ciudadano...",
    "¡Se fueron al muere! Era inocente",
    "¡Qué papelón! Eliminaron a un ciudadano",
    "¡La pegaron de lleno! Era del equipo",
    "¡Nooo, era uno de los nuestros!",
  ],
  undercover: [
    "¡Eliminaron al encubierto!",
    "¡Le sacaron la careta!",
    "¡Descubrieron al doble agente!",
    "¡Cayó el gil del undercover!",
    "¡Adiós infiltrado!",
  ],
};

export const EliminationPhase: React.FC<EliminationPhaseProps> = ({
  eliminationData,
  onContinue,
}) => {
  const { victimName, victimRole, victimAvatar, victimColor } = eliminationData;

  const phrases = ARGENTINE_PHRASES[victimRole];
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

  const isImpostor = victimRole === 'impostor';
  const isUndercover = victimRole === 'undercover';

  const roleLabel = isImpostor ? 'IMPOSTOR' : isUndercover ? 'ENCUBIERTO' : 'CIUDADANO';

  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white px-4 animate-fade-in">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-3xl md:text-4xl font-black mb-8 text-slate-200 leading-tight">
          {randomPhrase}
        </h1>

        <div className="mb-6 flex justify-center">
          <div className="relative">
            <PlayerAvatar
              avatar={victimAvatar}
              color={victimColor}
              isHost={false}
              size="lg"
              showCrown={false}
            />
            <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-2 border-2 border-slate-700">
              <Skull size={24} className="text-red-500" />
            </div>
          </div>
        </div>

        <h2 className="text-4xl font-black mb-2 text-white">{victimName}</h2>

        <div className={`inline-block px-6 py-3 rounded-2xl border-2 mb-8 ${
          isImpostor
            ? 'bg-red-900/20 border-red-500 text-red-400'
            : isUndercover
            ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400'
            : 'bg-blue-900/20 border-blue-500 text-blue-400'
        }`}>
          <div className="flex items-center gap-2">
            {isImpostor ? <Skull size={20} /> : isUndercover ? <Drama size={20} /> : <Heart size={20} />}
            <span className="font-black text-xl uppercase">{roleLabel}</span>
          </div>
        </div>

        <p className="text-slate-500 text-sm">
          El juego continúa en <span className="text-white font-bold">4 segundos...</span>
        </p>

        <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
          <div
            className={`h-full ${
              isImpostor ? 'bg-red-500' : isUndercover ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ animation: 'shrink 4s linear' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
