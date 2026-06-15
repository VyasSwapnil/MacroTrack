import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/MacroTrack/', 
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the app when you push new code
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // Optional extra assets
      manifest: {
        name: 'MacroTrack',
        short_name: 'MacroTrack',
        description: 'Track your daily macros and meal plans',
        theme_color: '#1976d2', // Matches your Material UI primary blue
        background_color: '#f8f9fa',
        display: 'standalone', // This is the magic word that hides the browser address bar!
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})