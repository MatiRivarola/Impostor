import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Download } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setInstallPrompt(null);
  };

  if (!offlineReady && !needRefresh && !installPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-full animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 flex items-start gap-4">
        <div className="bg-blue-900/50 p-2 rounded-lg text-blue-400">
            {installPrompt ? <Download size={20} /> : <RefreshCw size={20} className={needRefresh ? "animate-spin" : ""} />}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-sm mb-1">
            {installPrompt 
                ? 'Instalar Aplicación' 
                : (offlineReady ? 'Listo para usar sin conexión' : 'Nueva versión disponible')}
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            {installPrompt
              ? 'Instalá la app en tu dispositivo para jugar sin internet y tener una mejor experiencia.'
              : (offlineReady 
                  ? 'La aplicación ha sido guardada en tu dispositivo.' 
                  : 'Hay una actualización pendiente. Recargá para ver los cambios.')}
          </p>
          <div className="flex gap-2">
            {installPrompt && (
                <button 
                onClick={handleInstall}
                className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Instalar
              </button>
            )}
            {needRefresh && (
              <button 
                onClick={() => updateServiceWorker(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Recargar
              </button>
            )}
            <button 
              onClick={close}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
        <button onClick={close} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
        </button>
      </div>
    </div>
  );
};
