import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'logo.png',
        'app-icon.svg',
      ],

      manifest: {
        id: '/',
        name: 'Calbayog City Tourism',
        short_name: 'Calbayog City Tourism',

        description:
          'Explore Calbayog City, discover beautiful destinations, plan your trip, and experience the culture and attractions of Samar.',

        lang: 'en',
        dir: 'ltr',

        /*
         * Blue branding matching the Calbayog City Tourism logo.
         */
        theme_color: '#263A9F',
        background_color: '#263A9F',

        display: 'standalone',
        orientation: 'portrait-primary',

        start_url: '/',
        scope: '/',

        icons: [
          {
            src: 'app-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'app-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],

        screenshots: [
          {
            src: 'pwa-screenshot-home.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Calbayog City Tourism home page',
          },
          {
            src: 'pwa-screenshot-destinations.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Explore destinations in Calbayog City',
          },
          {
            src: 'pwa-screenshot-wide.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Calbayog City Tourism on desktop',
          },
        ],

        categories: [
          'travel',
          'lifestyle',
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp}',
        ],

        runtimeCaching: [
          {
            urlPattern:
              /^https?:\/\/localhost:5000\/api\/(destinations|events|accommodations|guides)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 86400,
              },
            },
          },

          {
            urlPattern:
              /^https?:\/\/tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 604800,
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 180000,
      },

      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 180000,
      },
    },
  },
});
