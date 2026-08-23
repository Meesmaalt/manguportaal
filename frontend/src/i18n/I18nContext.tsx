import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'
import { translations, type Lang, type TranslationKey, LANG_LABELS } from './translations'

type I18nCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey, vars?: Record<string, string>) => string
  langs: typeof LANG_LABELS
}

const Ctx = createContext<I18nCtx | null>(null)
const STORAGE_KEY = 'ohtu_lang'

function loadLang(): Lang {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s === 'et' || s === 'en' || s === 'ru') return s
  } catch {}
  return 'et'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {}
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>) => {
      const table = translations[lang] || translations.et
      let s: string = (table as any)[key] ?? (translations.et as any)[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(`{${k}}`, v)
        }
      }
      return s
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t, langs: LANG_LABELS }), [lang, setLang, t])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n outside provider')
  return ctx
}
