import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Salvesta võti andmekausta (docker volume), et see säiliks uuendustel; loe vajadusel ka vanast asukohast.
const DATA_DIR = process.env.AI_SETTINGS_DIR || path.join(__dirname, 'data');
const LEGACY_FILE = path.join(__dirname, 'ai_settings.json');
const NEW_FILE = path.join(DATA_DIR, 'ai_settings.json');
const SETTINGS_FILE = fs.existsSync(NEW_FILE) || !fs.existsSync(LEGACY_FILE) ? NEW_FILE : LEGACY_FILE;

export function getGlobalApiKey(): string {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      if (data.GEMINI_API_KEY !== undefined) return data.GEMINI_API_KEY;
    }
  } catch (e) {
    console.error('Error reading settings file', e);
  }
  return process.env.GEMINI_API_KEY || '';
}

export function getGlobalModel(): string {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      if (data.GEMINI_MODEL) return data.GEMINI_MODEL;
    }
  } catch (e) {
    console.error('Error reading settings file', e);
  }
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // defaulting to what was currently used in handlers
}

export function setGlobalSettings(key: string, model: string): void {
  let data: any = {};
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch (e) {}
  data.GEMINI_API_KEY = key;
  data.GEMINI_MODEL = model;
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
}
