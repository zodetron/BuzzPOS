import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // No proxy needed — Vercel CLI (`vercel dev`) serves both the Vite frontend
  // and the /api serverless functions on the same port (3000 by default).
  // For plain `vite dev` without Vercel CLI, set VITE_API_BASE in .env.local
  // to point at a local Express server if needed.
})
