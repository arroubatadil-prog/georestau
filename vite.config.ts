import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      devOptions: {
        enabled: true // Activer en développement pour tester les notifications
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              }
            }
          }
        ]
      },
      manifest: {
        name: 'GeoResto', // Le nom complet sur l'écran d'accueil
        short_name: 'GeoResto', // Le nom sous l'icône
        description: 'La plateforme culinaire qui connecte chefs et gourmands.',
        theme_color: '#ea580c', // La couleur Orange exacte de votre design
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png', // Assurez-vous d'avoir ce fichier dans /public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Assurez-vous d'avoir ce fichier dans /public
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})