import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    port: Number(process.env.SITEHUB_DEV_PORT || 8111),
    strictPort: true,
    proxy: {
      '/api':
        process.env.SITEHUB_DEV_API_TARGET || `http://localhost:${process.env.API_PORT || 3000}`,
      '/health':
        process.env.SITEHUB_DEV_API_TARGET || `http://localhost:${process.env.API_PORT || 3000}`,
    },
  },
})
