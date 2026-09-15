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
    plugins: [
      react(),
      {
        name: 'ai-quiz-server',
        configureServer(server) {
          server.middlewares.use('/api/ai/quiz', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', async () => {
              try {
                const data = body ? JSON.parse(body) : {}
                const { generateQuizWithGemini } = await import('./src/server/aiQuizHandler')
                const questions = await generateQuizWithGemini(data)
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, questions }))
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 500
                res.end(JSON.stringify({ ok: false, error: err?.message || 'AI genereerimine ebaõnnestus' }))
              }
            })
          })

          server.middlewares.use('/api/ai/translate', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', async () => {
              try {
                const data = body ? JSON.parse(body) : {}
                const { translatePackWithGemini } = await import('./src/server/aiTranslateHandler')
                const translatedData = await translatePackWithGemini(data)
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, translatedData }))
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 500
                res.end(JSON.stringify({ ok: false, error: err?.message || 'AI tõlkimine ebaõnnestus' }))
              }
            })
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  }
})
