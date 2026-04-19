import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // In local dev (npm run dev), proxy /api/* to the Express server.
      // When using `vercel dev`, Vercel handles /api/* natively and this proxy
      // is ignored because vercel dev runs its own server.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
})
