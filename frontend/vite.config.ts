import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // ALAMTEE: peab olema absoluutne kaldkriipsudega, nt "/mangud/"
  // "./" EI TOHI kasutada – rikub /ekraan/XYZ deep-linkid
  let base = env.VITE_BASE_PATH || '/'
  if (base !== './' && base !== '/') {
    if (!base.startsWith('/')) base = '/' + base
    if (!base.endsWith('/')) base = base + '/'
  }
  if (base === './') base = '/' // safety

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
  }
})
