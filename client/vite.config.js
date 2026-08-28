import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Dev server proxies /api and /assets to the Express server (see ../server)
// so `npm run dev` in this folder talks to the same backend as production.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    proxy: {
      '/api': {
        target: 'https://borukva-news-github-io.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
