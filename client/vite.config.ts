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
      // Keep the existing branding asset: logo2.png.
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "logo2.png"],
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
        // This entry is accurate if public/logo2.png is a 512x512 PNG.
        // For best Chromium installability, also provide a real 192x192
        // resized copy of logo2.png and list that file as a 192x192 icon.
        icons: [
  {
    src: "/LOGO 192X192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/LOGO 512X512.png",
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
            urlPattern: ({ url }) =>
              /^\/api\/(destinations|events|accommodations|guides)(\/|$)/.test(
                url.pathname,
              ),
            handler: "NetworkFirst",
            options: {
              cacheName: "calbayog-public-api",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === "https://calbayog-city-tourism.onrender.com" &&
              /^\/api\/(destinations|events|accommodations|guides)(\/|$)/.test(
                url.pathname,
              ),
            handler: "NetworkFirst",
            options: {
              cacheName: "calbayog-render-public-api",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === "image" &&
              (url.origin === self.location.origin ||
                url.hostname.endsWith(".supabase.co")),
            handler: "CacheFirst",
            options: {
              cacheName: "calbayog-public-images",
              expiration: { maxEntries: 250, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "calbayog-map-tiles",
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
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
