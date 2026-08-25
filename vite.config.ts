import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

// Project is deployed as a GitHub Pages *project* site
// (https://hanstydecks.github.io/card-creator/), so all asset URLs need
// this prefix. Override with VITE_BASE=/ for local dev at the domain root.
const BASE = process.env.VITE_BASE ?? '/card-creator/';

export default defineConfig({
  base: BASE,
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        impressum: resolve(import.meta.dirname, 'impressum.html'),
        datenschutz: resolve(import.meta.dirname, 'datenschutz.html'),
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Card Creator',
        short_name: 'Card Creator',
        description: 'Lernkarten gestalten und drucken – schnell, offline-faehig, ohne Konto.',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        lang: 'de',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // No navigateFallback: this is a 3-page static site (app + 2 legal
        // pages), not an SPA, so every route is precached individually and
        // should be served as itself offline rather than falling back to index.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
});
