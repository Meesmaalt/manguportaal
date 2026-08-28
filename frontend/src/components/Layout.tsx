import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import type { Lang } from '@/i18n/translations'
import { LogOut, User, LayoutGrid } from 'lucide-react'
import { APP_VERSION } from '@/lib/version'

export default function Layout() {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const { t, lang, setLang, langs } = useI18n()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-gold/20 bg-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="font-display text-2xl md:text-3xl font-black text-gold tracking-wider group-hover:text-gold-hover transition">
              {t('brand')}
            </span>
            <span className="text-white/60 text-sm hidden sm:inline font-medium">{t('brandSub')}</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm text-white/80 hover:text-gold transition px-2 py-1.5"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">{t('navGames')}</span>
            </Link>

            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-bg-card border border-gold/30 text-gold text-xs rounded-full px-2 py-1.5 cursor-pointer focus:outline-none focus:border-gold"
              aria-label="Language"
            >
              {(Object.keys(langs) as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {langs[l]}
                </option>
              ))}
            </select>

            {isLoggedIn ? (
              <>
                <span className="flex items-center gap-1.5 text-sm text-gold/90 px-2">
                  <User size={16} />
                  <span className="hidden sm:inline max-w-[100px] truncate">{user?.name || user?.email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="btn-outline text-sm !px-3 !py-1.5 flex items-center gap-1.5"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">{t('navLogout')}</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-gold text-sm !px-4 !py-2">
                {t('navLogin')}
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gold/10 py-6 text-center text-white/40 text-sm">
        {t('footer')}
        <span className="mx-2 opacity-40">·</span>
        <span className="text-white/25 text-xs tabular-nums">v{APP_VERSION}</span>
      </footer>
    </div>
  )
}
