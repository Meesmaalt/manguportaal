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

const basePath = process.env.BASE_PATH || '/';

const staticOptions = {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('env.js')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  }
};

// Serve static files from the basePath (e.g. /mangud)
if (basePath !== '/' && basePath !== '') {
  app.use(basePath, express.static(path.join(__dirname, 'dist'), staticOptions));
}
// Also serve static files from root, so /env.js can be found even if basePath is /mangud
app.use(express.static(path.join(__dirname, 'dist'), staticOptions));

app.use((req, res) => {
  // Do not return index.html for missing JS/CSS assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.status(404).send('Not found');
    return;
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
