import React from 'react';
import { Users, Globe, Smartphone, Shield, Zap } from 'lucide-react';
import { Button } from './Button';

interface LandingPhaseProps {
  onSelectLocal: () => void;
  onSelectOnline: () => void;
}

export const LandingPhase: React.FC<LandingPhaseProps> = ({ onSelectLocal, onSelectOnline }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in text-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-md flex flex-col h-full justify-center">
            
            <div className="mb-12">
                <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-tr from-slate-800 to-slate-900 p-4 rounded-3xl border border-slate-700 shadow-2xl rotate-3">
                        <Shield size={64} className="text-blue-500" />
                    </div>
                </div>
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-tighter italic drop-shadow-2xl mb-2">
                    IMPOSTOR
                </h1>
                <p className="text-slate-400 font-bold tracking-[0.5em] uppercase text-sm">Edición Córdoba</p>
            </div>

            <div className="space-y-6 w-full">
                {/* Local Mode Card */}
                <button 
                    onClick={onSelectLocal}
                    className="w-full group relative overflow-hidden bg-slate-800 hover:bg-slate-800/80 border-2 border-slate-700 hover:border-blue-500 rounded-3xl p-6 text-left transition-all duration-300 shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-900/30 p-3 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform duration-300">
                            <Smartphone size={32} />
                        </div>
                        <span className="bg-slate-900/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-slate-400 border border-slate-700">Recomendado</span>
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase mb-1">Jugar Local</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Pasando el teléfono.<br/>
                        Ideal para juntadas, previas y asados.
                    </p>
                    <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={80} />
                    </div>
                </button>

                {/* Online Mode Card */}
                <button 
                    onClick={onSelectOnline}
                    className="w-full group relative overflow-hidden bg-slate-800 hover:bg-slate-800/80 border-2 border-slate-700 hover:border-green-500 rounded-3xl p-6 text-left transition-all duration-300 shadow-xl hover:shadow-green-500/20 hover:-translate-y-1"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-900/30 p-3 rounded-2xl text-green-400 group-hover:scale-110 transition-transform duration-300">
                            <Globe size={32} />
                        </div>
                        <span className="bg-green-900/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-green-400 border border-green-500/30 animate-pulse">Nuevo</span>
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase mb-1">Sala Online</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Cada uno en su celu.<br/>
                        Creá una sala y compartí el código.
                    </p>
                    <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={80} />
                    </div>
                </button>
            </div>

            <div className="mt-12 text-center opacity-40">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Hecho con ❤️ y Fernet</p>
            </div>
        </div>
    </div>
  );
};