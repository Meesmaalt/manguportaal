import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateQuizWithGemini } from './frontend/src/server/aiQuizHandler.ts';
import { translatePackWithGemini } from './frontend/src/server/aiTranslateHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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
  app.use(express.static(path.join(__dirname, 'dist')));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
