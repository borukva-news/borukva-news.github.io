import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Dev server proxies /api and /assets to the Express server (see ../server)
// so `npm run dev` in this folder talks to the same backend as production.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': ' https://borukva-news-github-io.onrender.com',
      '/assets': ' https://borukva-news-github-io.onrender.com',
    },
  },
})
