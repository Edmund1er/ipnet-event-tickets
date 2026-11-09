import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Le front et l'API partagent la même origine en développement (proxy) :
// le cookie HttpOnly du refresh token (SameSite=Strict, Path=/api/auth) fonctionne sans CORS.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_CIBLE ?? 'http://localhost:8081',
        changeOrigin: false,
      },
    },
  },
})
