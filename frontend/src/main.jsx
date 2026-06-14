import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Capturar el evento de instalación ANTES de que React monte.
// beforeinstallprompt se dispara muy temprano — si esperamos al useEffect lo perdemos.
window.__pwaInstallEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallEvent = e;
  // Notificar a cualquier listener que ya esté escuchando
  window.dispatchEvent(new CustomEvent('pwaInstallReady'));
});

if ('serviceWorker' in navigator) {
  let reloading = false;

  // Cuando el SW nuevo toma control → recargar para servir el código nuevo
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloading) {
      reloading = true;
      window.location.reload();
    }
  });

  // Revisar actualizaciones al volver a la pestaña (el caso más común en mobile)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.ready.then(reg => reg.update());
    }
  });

  // Revisión cada hora por si el usuario deja la app abierta mucho tiempo
  setInterval(() => {
    navigator.serviceWorker.ready.then(reg => reg.update());
  }, 60 * 60 * 1000);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
