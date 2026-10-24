import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
const basePath = process.env.GITHUB_ACTIONS === 'true' ? '/viewscanner/' : '/';

export default defineConfig({
  server: { allowedHosts: ['terminal.local'] },
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'pwa-64x64.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
        'apple-touch-icon-180x180.png',
        'apple-touch-icon.png',
        'pdf.worker.min.js',
      ],
      manifest: {
        name: 'OmniPDF',
        short_name: 'OmniPDF',
        description: 'Universal client-side PDF & document workspace. Edit, organize, OCR, scan, convert, sign, and compress PDFs 100% in your browser.',
        start_url: basePath,
        scope: basePath,
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        background_color: '#0f172a',
        theme_color: '#4f46e5',
        orientation: 'any',
        lang: 'en',
        dir: 'ltr',
        categories: ['productivity', 'utilities', 'business'],
        icons: [
          {
            src: `${basePath}pwa-64x64.png`,
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: `${basePath}pwa-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${basePath}pwa-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${basePath}maskable-icon-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${basePath}apple-touch-icon-180x180.png`,
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        shortcuts: [
          {
            name: 'PDF Editor',
            short_name: 'Editor',
            description: 'Edit text and vector elements in PDF',
            url: `${basePath}#/editor`,
            icons: [{ src: `${basePath}pwa-192x192.png`, sizes: '192x192' }],
          },
          {
            name: 'Page Organizer',
            short_name: 'Organize',
            description: 'Reorder, rotate, and delete pages',
            url: `${basePath}#/organize`,
            icons: [{ src: `${basePath}pwa-192x192.png`, sizes: '192x192' }],
          },
          {
            name: 'Document Scanner',
            short_name: 'Scanner',
            description: 'Scan physical documents using camera',
            url: `${basePath}#/scanner`,
            icons: [{ src: `${basePath}pwa-192x192.png`, sizes: '192x192' }],
          },
          {
            name: 'Neural OCR',
            short_name: 'OCR',
            description: 'Extract and edit text in scanned documents',
            url: `${basePath}#/scanned-editor`,
            icons: [{ src: `${basePath}pwa-192x192.png`, sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,ttf,eot}', 'pdf.worker.min.js'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: `${basePath}index.html`,
        navigateFallbackDenylist: [/^\/api\//, /\.[a-z0-9]+$/i],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cdn-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/tessdata\.projectnaptha\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-traineddata',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 60,
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
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib'],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs-vendor';
          }
          if (id.includes('pdf-lib')) {
            return 'pdflib-vendor';
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
})
