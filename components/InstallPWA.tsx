import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Verificar si ya se instaló o si el usuario ya descartó el prompt
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
                        || (window.navigator as any).standalone === true;
    const wasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';

    if (isInstalled || wasDismissed) {
      return;
    }

    const handler = (e: Event) => {
      // Prevenir que el navegador muestre su propio prompt
      e.preventDefault();

      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Mostrar nuestro banner personalizado después de 2 segundos
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Mostrar el prompt de instalación nativo
    deferredPrompt.prompt();

    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
    }

    // Limpiar el prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Guardar en localStorage que el usuario descartó el prompt
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
      <div className="max-w-md mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl border border-blue-500/50 overflow-hidden backdrop-blur-xl">
        <div className="relative p-5">
          {/* Botón de cerrar */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-blue-100 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* Contenido */}
          <div className="flex items-start gap-4 pr-6">
            {/* Icono */}
            <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Download size={28} className="text-white" />
            </div>

            {/* Texto */}
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">
                ¡Instalá Impostor Cordobés!
              </h3>
              <p className="text-blue-100 text-sm mb-4">
                Jugá offline y tené acceso rápido desde tu pantalla de inicio
              </p>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-white text-blue-600 font-bold py-2.5 px-4 rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
                >
                  Instalar
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-white font-semibold hover:bg-white/10 rounded-xl transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra decorativa inferior */}
        <div className="h-1 bg-gradient-to-r from-blue-400 via-white to-blue-400"></div>
      </div>
    </div>
  );
};
