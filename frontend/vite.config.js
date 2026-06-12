import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'badge-72.png', 'favicon.ico'],
      manifest: {
        name: 'FinLibre',
        short_name: 'FinLibre',
        description: 'Tu libertad financiera en la palma de la mano',
        theme_color: '#06100c',
        background_color: '#06100c',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        skipWaiting: true,    // activa el SW nuevo sin esperar que el usuario cierre pestañas
        clientsClaim: true,   // el SW nuevo toma control de todos los clientes inmediatamente
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // activa SW en desarrollo también
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://slategray-moose-734260.hostingersite.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
