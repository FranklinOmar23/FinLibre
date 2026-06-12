import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    // Si el evento ya disparó antes de montar el hook, lo leemos del global
    () => window.__pwaInstallEvent || null,
  );
  const [isInstalled, setIsInstalled] = useState(false);

  // Safari en iOS no soporta beforeinstallprompt — detectar por user agent
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    && !('MSStream' in window)
    && !/CriOS|FxiOS/.test(navigator.userAgent);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || navigator.standalone === true;
    setIsInstalled(standalone);

    // Escuchar eventos futuros (por si no había disparado todavía)
    const onPrompt = (e) => {
      if (e.prompt) {
        // Evento nativo del browser
        e.preventDefault();
        window.__pwaInstallEvent = e;
        setDeferredPrompt(e);
      } else {
        // Nuestro evento custom 'pwaInstallReady'
        setDeferredPrompt(window.__pwaInstallEvent);
      }
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('pwaInstallReady', onPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaInstallEvent = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('pwaInstallReady', onPrompt);
    };
  }, []);

  const promptInstall = async () => {
    const prompt = deferredPrompt || window.__pwaInstallEvent;
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setDeferredPrompt(null);
    window.__pwaInstallEvent = null;
    return outcome === 'accepted';
  };

  const canInstall = !isInstalled && (!!deferredPrompt || !!window.__pwaInstallEvent || isIOS);

  return { canInstall, isIOS, isInstalled, promptInstall };
}
