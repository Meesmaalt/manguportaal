import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { generateQuizWithGemini } from './frontend/src/server/aiQuizHandler.ts';
import { translatePackWithGemini } from './frontend/src/server/aiTranslateHandler.ts';
import { listAvailableGeminiModels } from './frontend/src/server/aiModelsHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const basePath = process.env.BASE_PATH || '/';
const envBasePath = basePath === '/' ? '' : basePath.replace(/\/$/, '');
const pbUrlEnv = process.env.PB_PUBLIC_URL || (envBasePath ? `${envBasePath}/pb` : '/pb');

// Proxy Pocketbase requests before body parsing (important for realtime / SSE)
const pbProxy = createProxyMiddleware({
  target: 'http://pocketbase:8090',
  changeOrigin: true,
  ws: true,
  pathRewrite: (path, req) => {
    if (envBasePath && path.startsWith(`${envBasePath}/pb`)) {
      return path.replace(`${envBasePath}/pb`, '');
    }
    if (path.startsWith('/pb')) {
      return path.replace('/pb', '');
    }
    return path;
  }
});

app.use('/pb', pbProxy);
if (envBasePath) {
  app.use(`${envBasePath}/pb`, pbProxy);
}

app.use(express.json({ limit: '10mb' }));

import { getGlobalApiKey, getGlobalModel, setGlobalSettings } from './aiSettings.ts';

const apiRouter = express.Router();

apiRouter.get('/api/ai/key', (req, res) => {
  res.json({ ok: true, key: getGlobalApiKey(), model: getGlobalModel() });
});

apiRouter.post('/api/ai/key', (req, res) => {
  setGlobalSettings(req.body.key || '', req.body.model || 'gemini-2.5-flash');
  res.json({ ok: true });
});

apiRouter.post('/api/ai/models', async (req, res) => {
  try {
    const models = await listAvailableGeminiModels(req.body.key);
    res.json({ ok: true, models });
  } catch (err: any) {
    console.error('Models AI Error:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Mudelite pärimine ebaõnnestus' });
  }
});

apiRouter.post('/api/ai/quiz', async (req, res) => {
  try {
    const questions = await generateQuizWithGemini(req.body);
    res.json({ ok: true, questions });
  } catch (err: any) {
    console.error('Quiz AI Error:', err);
    res.status(500).json({ ok: false, error: err?.message || 'AI genereerimine ebaõnnestus' });
  }
});

apiRouter.post('/api/ai/translate', async (req, res) => {
  try {
    const translatedData = await translatePackWithGemini(req.body);
    res.json({ ok: true, translatedData });
  } catch (err: any) {
    console.error('Translate AI Error:', err);
    res.status(500).json({ ok: false, error: err?.message || 'AI tõlkimine ebaõnnestus' });
  }
});

app.use(apiRouter);
if (envBasePath) {
  app.use(envBasePath, apiRouter);
}

// Dynamic env.js endpoint
app.get(['/env.js', `${envBasePath}/env.js`].filter(Boolean), (req, res) => {
  const envJs = `
window.__APP_CONFIG__ = {
  basePath: "${envBasePath}",
  pbUrl: "${pbUrlEnv}"
};
window.__BASE_PATH__ = "${envBasePath}";
window.__PB_URL__ = "${pbUrlEnv}";
console.info("[ohtu] Dynamic config loaded: basePath=${envBasePath || '/'} pbUrl=${pbUrlEnv}");
  `;
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.send(envJs);
});

const staticOptions = {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  }
};

// Serve static files from the basePath (e.g. /mangud)
if (envBasePath) {
  app.use(envBasePath, express.static(path.join(__dirname, 'dist'), staticOptions));
}
// Also serve static files from root, so /env.js can be found even if basePath is /mangud
app.use(express.static(path.join(__dirname, 'dist'), staticOptions));

app.use((req, res) => {
  // Do not return index.html for missing JS/CSS assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Not found');
    return;
  }
  
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  let html = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf-8');
  
  // Dynamically inject the correct basePath into asset paths if it's not root
  if (envBasePath) {
    const prefix = envBasePath + '/';
    // Replace src="/xyz" or href="/xyz" with src="/mangud/xyz"
    // Also ignore cases where it already has the prefix (for safety)
    html = html.replace(/(href|src)="\/([^"]*)"/g, (match, attr, p1) => {
      // If it already starts with our envBasePath (e.g., /mangud/...), leave it alone
      if (('/' + p1).startsWith(prefix)) {
        return `${attr}="/${p1}"`;
      }
      return `${attr}="${prefix}${p1}"`;
    });
  }
  
  res.send(html);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}, basePath: ${basePath}`);
});
