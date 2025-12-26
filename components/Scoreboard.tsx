import React from 'react';
import { Trophy, Medal, Trash2, Crown } from 'lucide-react';
import { Button } from './Button';
import { ScoreMap } from '../types';

interface ScoreboardProps {
  scores: ScoreMap;
  onReset: () => void;
  onClose: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ scores, onReset, onClose }) => {
  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 italic uppercase flex items-center gap-2">
                <Trophy className="text-yellow-400" /> Tabla de Posiciones
            </h2>
            <button onClick={onClose} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-colors">
                ✕
            </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-6 scrollbar-thin space-y-3 px-1">
          {sortedScores.length === 0 ? (
            <div className="text-center py-12 opacity-50">
                <Trophy size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-500 italic">Todavía no hay puntos.<br/>¡A jugar se ha dicho!</p>
            </div>
          ) : (
            sortedScores.map(([name, score], index) => {
                let cardStyle = 'bg-slate-800/50 border-slate-700';
                let rankDisplay = <span className="text-slate-500 font-bold text-lg w-8 text-center">#{index + 1}</span>;
                let scoreColor = 'text-blue-400';
                let nameSize = 'text-base';

                // Top 1 styling
                if (index === 0) {
                    cardStyle = 'bg-gradient-to-r from-yellow-900/20 to-slate-800 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
                    rankDisplay = <div className="w-8 flex justify-center"><Crown size={24} className="text-yellow-400 animate-pulse" /></div>;
                    scoreColor = 'text-yellow-400';
                    nameSize = 'text-xl';
                }
                // Top 2 styling
                else if (index === 1) {
                    cardStyle = 'bg-slate-800 border-slate-500/50';
                    rankDisplay = <div className="w-8 flex justify-center"><Medal size={20} className="text-slate-300" /></div>;
                    scoreColor = 'text-slate-300';
                }
                // Top 3 styling
                else if (index === 2) {
                    cardStyle = 'bg-slate-800 border-orange-700/50';
                    rankDisplay = <div className="w-8 flex justify-center"><Medal size={20} className="text-orange-400" /></div>;
                    scoreColor = 'text-orange-400';
                }

                return (
                    <div key={name} className={`flex items-center justify-between p-4 rounded-2xl border ${cardStyle} transition-transform hover:scale-[1.02]`}>
                        <div className="flex items-center gap-3">
                            {rankDisplay}
                            <span className={`font-bold text-white ${nameSize} truncate max-w-[140px]`}>{name}</span>
                        </div>
                        <div className="text-right">
                             <span className={`font-black text-3xl block leading-none ${scoreColor}`}>{score}</span>
                             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Puntos</span>
                        </div>
                    </div>
                );
            })
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
            <Button variant="danger" onClick={onReset} className="flex items-center justify-center gap-2 text-sm">
                <Trash2 size={16} /> Resetear
            </Button>
            <Button variant="secondary" onClick={onClose} className="text-sm font-bold">
                Cerrar
            </Button>
        </div>
      </div>
    </div>
  );
};