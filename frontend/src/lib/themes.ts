export type ThemeId = 'classic' | 'wedding' | 'midnight' | 'emerald'

export type ThemeDef = {
  id: ThemeId
  label: { et: string; en: string; ru: string }
  /** CSS variables applied to documentElement */
  vars: Record<string, string>
  bodyBg: string
}

export const THEMES: ThemeDef[] = [
  {
    id: 'classic',
    label: { et: 'Klassikaline kuld', en: 'Classic gold', ru: 'Классическое золото' },
    vars: {
      '--bg': '#030a16',
      '--gold': '#dfb342',
      '--gold-rgb': '223, 179, 66',
      '--accent': '#5ee7a1',
    },
    bodyBg: 'radial-gradient(ellipse at center, #0a1b36 0%, #081426 55%, #030a16 100%)',
  },
  {
    id: 'wedding',
    label: { et: 'Pulm / romantika', en: 'Wedding', ru: 'Свадьба' },
    vars: {
      '--bg': '#1a0f14',
      '--gold': '#e8b4bc',
      '--gold-rgb': '232, 180, 188',
      '--accent': '#f5d0c5',
    },
    bodyBg: 'radial-gradient(ellipse at 30% 20%, #3d2030 0%, #1a0f14 50%, #0d080a 100%)',
  },
  {
    id: 'midnight',
    label: { et: 'Kesköö sinine', en: 'Midnight', ru: 'Полночь' },
    vars: {
      '--bg': '#020617',
      '--gold': '#7dd3fc',
      '--gold-rgb': '125, 211, 252',
      '--accent': '#a78bfa',
    },
    bodyBg: 'radial-gradient(ellipse at center, #0c1929 0%, #020617 70%)',
  },
  {
    id: 'emerald',
    label: { et: 'Smaragd', en: 'Emerald', ru: 'Изумруд' },
    vars: {
      '--bg': '#04140f',
      '--gold': '#34d399',
      '--gold-rgb': '52, 211, 153',
      '--accent': '#fbbf24',
    },
    bodyBg: 'radial-gradient(ellipse at center, #0a2e22 0%, #04140f 70%)',
  },
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
  const theme = THEMES.find((t) => t.id === id) || THEMES[0]
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  document.body.style.background = theme.bodyBg
  document.body.style.backgroundAttachment = 'fixed'
  try {
    localStorage.setItem(KEY, theme.id)
  } catch {}
  root.dataset.theme = theme.id
}
