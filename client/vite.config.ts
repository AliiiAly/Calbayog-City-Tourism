
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module",
      },

      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "logo.png",
        "logo2.png",
        "app-icon.png",
      ],

      manifest: {
        id: "/",
        name: "Calbayog City Tourism",
        short_name: "Calbayog Tourism",
        description:
          "Explore Calbayog City, discover beautiful destinations, plan your trip, and experience the culture and attractions of Samar.",
        lang: "en",
        dir: "ltr",
        theme_color: "#263A9F",
        background_color: "#263A9F",
        display: "standalone",
        display_override: ["standalone"],
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/logo2.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],

        categories: ["travel", "lifestyle"],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        globPatterns: [
          "**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,avif,woff,woff2}",
        ],

        navigateFallback: "index.html",

        runtimeCaching: [
          {
            // Public tourism API responses.
            // Private/user-specific API data is intentionally excluded.
            urlPattern: ({ url }) =>
              /^\/api\/(destinations|events|accommodations|guides)(\/|$)/.test(
                url.pathname,
              ),

            handler: "NetworkFirst",

            options: {
              cacheName: "calbayog-public-api",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            // Public tourism API when deployed on Render.
            urlPattern: ({ url }) =>
              url.origin ===
                "https://calbayog-city-tourism.onrender.com" &&
              /^\/api\/(destinations|events|accommodations|guides)(\/|$)/.test(
                url.pathname,
              ),

            handler: "NetworkFirst",

            options: {
              cacheName: "calbayog-render-public-api",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            // Cache public images so previously viewed photos
            // may remain available without a connection.
            urlPattern: ({ request, url }) =>
              request.destination === "image" &&
              (url.origin === self.location.origin ||
                url.hostname.endsWith(".supabase.co")),

            handler: "CacheFirst",

            options: {
              cacheName: "calbayog-public-images",
              expiration: {
                maxEntries: 250,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            // OpenStreetMap tiles: only previously cached tiles
            // can be shown offline.
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,

            handler: "CacheFirst",

            options: {
              cacheName: "calbayog-map-tiles",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        timeout: 180000,
      },

      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        timeout: 180000,
      },
    },
  },
});
