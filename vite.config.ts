import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import versionManifest from './VERSION.json';

const isCapacitor = process.env.CAPACITOR === 'true' || process.env.VITE_CAPACITOR === 'true';
const base = isCapacitor ? '/' : '/ScentCap/';
const startUrl = isCapacitor ? '/' : '/ScentCap/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'mark.svg',
        'icon.svg',
        'apple-touch-icon-180.png',
        'icon-192.png',
        'icon-512.png',
        'icon-1024.png',
        'icon-maskable-192.png',
        'icon-maskable-512.png',
      ],
      manifest: {
        name: 'ScentCap',
        short_name: 'ScentCap',
        description: 'Your personal fragrance operating system',
        theme_color: '#12100f',
        background_color: '#12100f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: startUrl,
        categories: ['lifestyle', 'personalization'],
        shortcuts: [
          { name: 'My Collection', short_name: 'Collection', url: `${startUrl}collection`, icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          { name: 'Daily Pick', short_name: 'Daily', url: `${startUrl}daily`, icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        cacheId: versionManifest.swCache,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api\//, /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'weather-cache-v121', networkTimeoutSeconds: 5, expiration: { maxEntries: 5, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
