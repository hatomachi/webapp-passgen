import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'PassGen - 安心・爆速パスワード生成',
        short_name: 'PassGen',
        description: '開いて0秒、通信ゼロ、漏洩リスクゼロ。暗号学的Web Crypto APIで生成する完全ローカル完結PWA。',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
