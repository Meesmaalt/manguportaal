import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'
import { THEMES, applyTheme, getStoredTheme, type ThemeId } from '@/lib/themes'
import { useI18n } from '@/i18n/I18nContext'

export default function ThemePicker() {
  const { lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeId>(() => getStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function pick(id: ThemeId) {
    setTheme(id)
    setOpen(false)
  }

  const L = lang === 'en' || lang === 'ru' ? lang : 'et'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-full border border-gold/30 text-gold/80 hover:bg-gold/10 transition"
        title="Theme"
        aria-label="Theme"
      >
        <Palette size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 card-panel p-2 min-w-[200px] shadow-xl border-gold/40">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  theme === t.id ? 'bg-gold/20 text-gold font-bold' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                {t.label[L]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
