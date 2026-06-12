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

// Cuando el service worker nuevo toma control → recargar para servir la versión nueva.
// Esto dispara el popup de novedades si APP_VERSION fue subida.
if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloading) {
      reloading = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
