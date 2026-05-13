import { VitePWA } from 'vite-plugin-pwa'

export default {
  base: '/Poke/',
  build: {
    sourcemap: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      manifest: {
        name: 'Pokemon Game',
        short_name: 'Pokemon',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',

        icons: [
          {
            src: '/Poke/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/Poke/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
}
