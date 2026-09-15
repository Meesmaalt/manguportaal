import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { generateQuizWithGemini } from './frontend/src/server/aiQuizHandler.ts';
import { translatePackWithGemini } from './frontend/src/server/aiTranslateHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Proxy Pocketbase requests before body parsing (important for realtime / SSE)
const pbProxy = createProxyMiddleware({
  target: 'http://pocketbase:8090',
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    '^/mangud/pb': '', // if mounted at /mangud/pb
    '^/pb': ''         // if mounted at /pb
  }
});

app.use('/pb', pbProxy);
app.use('/mangud/pb', pbProxy);

app.use(express.json({ limit: '10mb' }));

app.post('/api/ai/quiz', async (req, res) => {
  try {
    const questions = await generateQuizWithGemini(req.body);
    res.json({ ok: true, questions });
  } catch (err: any) {
    console.error('Quiz AI Error:', err);
    res.status(500).json({ ok: false, error: err?.message || 'AI genereerimine ebaõnnestus' });
  }
});

app.post('/api/ai/translate', async (req, res) => {
  try {
    const translatedData = await translatePackWithGemini(req.body);
    res.json({ ok: true, translatedData });
  } catch (err: any) {
    console.error('Translate AI Error:', err);
    res.status(500).json({ ok: false, error: err?.message || 'AI tõlkimine ebaõnnestus' });
  }
});

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.join(__dirname, 'frontend'),
  });
  app.use(vite.middlewares);
} else {
  const basePath = process.env.BASE_PATH || '/';
  
  if (basePath !== '/' && basePath !== '') {
    app.use(basePath, express.static(path.join(__dirname, 'dist')));
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
  }
  
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
