export type ThemeId = 'classic' | 'wedding' | 'midnight' | 'emerald'

export type ThemeDef = {
  id: ThemeId
  label: { et: string; en: string; ru: string }
}

export const THEMES: ThemeDef[] = [
  { id: 'classic', label: { et: 'Klassikaline kuld', en: 'Classic gold', ru: 'Классическое золото' } },
  { id: 'wedding', label: { et: 'Pulm / romantika', en: 'Wedding', ru: 'Свадьба' } },
  { id: 'midnight', label: { et: 'Kesköö sinine', en: 'Midnight', ru: 'Полночь' } },
  { id: 'emerald', label: { et: 'Smaragd', en: 'Emerald', ru: 'Изумруд' } },
]

const KEY = 'ohtu_theme'

export function getStoredTheme(): ThemeId {
  try {
    const t = localStorage.getItem(KEY) as ThemeId | null
    if (t && THEMES.some((x) => x.id === t)) return t
  } catch {}
  return 'classic'
}

export function applyTheme(id: ThemeId) {
  const theme = THEMES.find((x) => x.id === id) || THEMES[0]
  document.documentElement.dataset.theme = theme.id
  try {
    localStorage.setItem(KEY, theme.id)
  } catch {}
}
