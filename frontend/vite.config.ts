import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { generateQuizWithGemini } from './src/server/aiQuizHandler.ts'
import { translatePackWithGemini } from './src/server/aiTranslateHandler.ts'
import { listAvailableGeminiModels } from './src/server/aiModelsHandler.ts'
import { generateContentWithGemini } from './src/server/aiGenerateHandler.ts'
import { getGlobalApiKey, getGlobalModel, setGlobalSettings } from '../aiSettings.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  let base = env.VITE_BASE_PATH || '/'
  if (base !== './' && base !== '/') {
    if (!base.startsWith('/')) base = '/' + base
    if (!base.endsWith('/')) base = base + '/'
  }
  if (base === './') base = '/'

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
            req.on('data', (chunk) => { body += chunk })
            req.on('end', async () => {
              try {
                const data = body ? JSON.parse(body) : {}
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

          server.middlewares.use('/api/ai/key', async (req, res) => {
            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true, key: getGlobalApiKey(), model: getGlobalModel() }))
              return
            }
            if (req.method === 'POST') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', () => {
                const data = body ? JSON.parse(body) : {}
                setGlobalSettings(data.key || '', data.model || 'gemini-2.5-flash')
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true }))
              })
            }
          })

          server.middlewares.use('/api/ai/models', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', async () => {
              try {
                const data = body ? JSON.parse(body) : {}
                const models = await listAvailableGeminiModels(data.key)
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, models }))
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 500
                res.end(JSON.stringify({ ok: false, error: err?.message || 'Mudelite pärimine ebaõnnestus' }))
              }
            })
          })

          server.middlewares.use('/api/ai/generate', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', async () => {
              try {
                const data = body ? JSON.parse(body) : {}
                const text = await generateContentWithGemini(data)
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, text }))
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
            req.on('data', (chunk) => { body += chunk })
            req.on('end', async () => {
              try {
                const data = body ? JSON.parse(body) : {}
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
      }
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
