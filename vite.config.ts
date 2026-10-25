/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TCP ContaCuba',
        short_name: 'ContaCuba',
        description: 'Contabilidad y tributos para TCP en Cuba',
        theme_color: '#14324a',
        background_color: '#f2f5f4',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg}'] }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
