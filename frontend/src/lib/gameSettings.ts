export type DisplayFontId = 'cinzel' | 'montserrat' | 'bebas' | 'playfair' | 'oswald' | 'rubik'

export type DisplayFontOption = {
  id: DisplayFontId
  name: string
  cssFamily: string
  category: 'serif' | 'sans' | 'display'
  description: string
  previewText: string
}

export const DISPLAY_FONTS: DisplayFontOption[] = [
  {
    id: 'cinzel',
    name: 'Cinzel',
    cssFamily: "'Cinzel', serif",
    category: 'serif',
    description: 'Klassikaline Kuldvillaku kuldne antiikva',
    previewText: 'KULDVILLAK 500 PUNKTI',
  },
  {
    id: 'bebas',
    name: 'Bebas Neue',
    cssFamily: "'Bebas Neue', cursive, sans-serif",
    category: 'display',
    description: 'Julge ja lööv telesaate suurtähtede stuudiofont',
    previewText: 'KULDVILLAK 500 PUNKTI',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    cssFamily: "'Montserrat', sans-serif",
    category: 'sans',
    description: 'Kaasaegne selge ja puhas geomeetriline sans-serif',
    previewText: 'Kuldvillak 500 punkti',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    cssFamily: "'Playfair Display', serif",
    category: 'serif',
    description: 'Kuninglik ja elegantne luksuslik serif',
    previewText: 'Kuldvillak 500 punkti',
  },
  {
    id: 'oswald',
    name: 'Oswald',
    cssFamily: "'Oswald', sans-serif",
    category: 'display',
    description: 'Tihe ja jõuline telemängude pealkirjafont',
    previewText: 'KULDVILLAK 500 PUNKTI',
  },
  {
    id: 'rubik',
    name: 'Rubik',
    cssFamily: "'Rubik', sans-serif",
    category: 'sans',
    description: 'Pehmemate nurkadega sõbralik stuudiofont',
    previewText: 'Kuldvillak 500 punkti',
  },
]

export type KuldvillakSettings = {
  displayFont: DisplayFontId
  readingTimeSec: number // Ettelugemise aeg sekundites (nt 5)
  thinkingTimeSec: number // Mõtlemisaeg sekundites (nt 25)
  autoTimer: boolean // Kas taimer käivitub automaatselt küsimuse avamisel
  soundEnabled: boolean // Heliefektid (lugemise algus, mõtlemise algus, tiksumine, buzzer)
}

export const DEFAULT_KULDVILLAK_SETTINGS: KuldvillakSettings = {
  displayFont: 'cinzel',
  readingTimeSec: 5,
  thinkingTimeSec: 25,
  autoTimer: true,
  soundEnabled: true,
}

const SETTINGS_PREFIX = 'game_settings_'

export function getGameSettings(gameType: string = 'kuldvillak'): KuldvillakSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_PREFIX + gameType)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_KULDVILLAK_SETTINGS,
        ...parsed,
      }
    }
  } catch {}
  return { ...DEFAULT_KULDVILLAK_SETTINGS }
}

export function saveGameSettings(gameType: string = 'kuldvillak', updates: Partial<KuldvillakSettings>): KuldvillakSettings {
  const current = getGameSettings(gameType)
  const next = { ...current, ...updates }
  try {
    localStorage.setItem(SETTINGS_PREFIX + gameType, JSON.stringify(next))
    // Trigger storage event or custom event for realtime tab awareness
    window.dispatchEvent(new CustomEvent('gamesettings:changed', { detail: { gameType, settings: next } }))
  } catch {}
  return next
}

export function getFontCssFamily(fontId?: DisplayFontId | string): string {
  const f = DISPLAY_FONTS.find((x) => x.id === fontId)
  return f ? f.cssFamily : "'Cinzel', serif"
}
