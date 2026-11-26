import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The dev and preview servers proxy /api and /health to the backend, so the browser only ever talks
// to one origin. In production the same two paths are proxied by nginx (see nginx.conf).
const target =
  process.env.SITEHUB_DEV_API_TARGET ?? `http://localhost:${process.env.API_PORT ?? 3000}`
// Set by the Aspire AppHost when the dev UI is opened from another machine on the LAN.
const lanHost = process.env.SITEHUB_LAN_HOST
const port = Number(process.env.SITEHUB_DEV_PORT ?? 8111)
const proxy = { '/api': target, '/health': target }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 600 },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: true,
    port,
    strictPort: true,
    allowedHosts: lanHost ? [lanHost] : undefined,
    proxy,
  },
  preview: { host: true, port, strictPort: true, proxy },
})
