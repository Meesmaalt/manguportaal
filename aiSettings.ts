import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, 'ai_settings.json');

export function getGlobalApiKey(): string {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return data.GEMINI_API_KEY || '';
    }
  } catch (e) {
    console.error('Error reading settings file', e);
  }
  return process.env.GEMINI_API_KEY || '';
}

export function setGlobalApiKey(key: string): void {
  let data: any = {};
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch (e) {}
  data.GEMINI_API_KEY = key;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
}
