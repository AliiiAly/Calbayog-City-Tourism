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
        'calbayog-app-icon.png',
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
         * Blue branding matching the Calbayog City Tourism app.
         */
        theme_color: '#263A9F',
        background_color: '#263A9F',

        display: 'standalone',
        orientation: 'portrait-primary',

        start_url: '/',
        scope: '/',

        /*
         * Dedicated app icon.
         * The same high-resolution PNG is used for both
         * the standard and maskable PWA icon purposes.
         */
        icons: [
          {
            src: 'calbayog-app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'calbayog-app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
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
