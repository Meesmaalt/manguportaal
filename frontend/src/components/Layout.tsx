import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import type { Lang } from '@/i18n/translations'
import { LogOut, User, LayoutGrid } from 'lucide-react'
import ThemePicker from '@/components/ThemePicker'
import { APP_VERSION } from '@/lib/version'
import { checkPbHealth } from '@/lib/sessions'
import { useEffect, useState } from 'react'
import { getRememberedHostSession } from '@/hooks/useGameSession'

export default function Layout() {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang, setLang, langs } = useI18n()
  const [pbOk, setPbOk] = useState<boolean | null>(null)
  const [hostResume, setHostResume] = useState(() => getRememberedHostSession())

  useEffect(() => {
    setHostResume(getRememberedHostSession())
  }, [location.pathname])

  useEffect(() => {
    checkPbHealth().then(setPbOk)
    const id = window.setInterval(() => checkPbHealth().then(setPbOk), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen flex flex-col layout-has-header">
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
            <ThemePicker />
            <select
              className="bg-transparent text-sm text-white/70 border border-gold/20 rounded-full px-2 py-1"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label="Language"
            >
              {Object.entries(langs).map(([code, label]) => (
                <option key={code} value={code} className="bg-bg text-white">
                  {label}
                </option>
              ))}
            </select>
            {isLoggedIn ? (
              <>
                <span className="text-white/50 text-xs hidden md:inline max-w-[120px] truncate">
                  {user?.name || user?.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="flex items-center gap-1 text-sm text-white/70 hover:text-gold px-2 py-1.5"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">{t('navLogout')}</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-hover px-2 py-1.5"
              >
                <User size={16} />
                <span className="hidden sm:inline">{t('navLogin')}</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {hostResume &&
        !location.pathname.includes(`/play/${hostResume.gameType}/${hostResume.sessionId}`) &&
        !location.pathname.startsWith('/ekraan') &&
        !location.pathname.startsWith('/blitz') &&
        !location.pathname.startsWith('/buzzer') &&
        !location.pathname.startsWith('/buzz') &&
        !location.pathname.startsWith('/deal/') && (
        <div className="bg-gold/15 border-b border-gold/40 px-4 py-2 text-center sticky top-[52px] z-40">
          <Link
            to={`/play/${hostResume.gameType}/${hostResume.sessionId}`}
            className="text-gold font-bold text-sm hover:underline inline-flex items-center gap-2"
          >
            ← {t('resumeHostCta')}
            <span className="text-white/50 font-normal text-xs">({hostResume.code})</span>
          </Link>
          <span className="text-white/40 text-xs ml-2 hidden sm:inline">{t('resumeHostHint')}</span>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gold/10 py-6 text-center text-white/40 text-sm">
        {t('footer')}
        <span className="mx-2 opacity-40">·</span>
        <Link to="/changelog" className="text-white/25 text-xs tabular-nums hover:text-gold/60">v{APP_VERSION}</Link>
        <span className="mx-2 opacity-40">·</span>
        <Link to="/admin" className="text-white/20 text-xs hover:text-gold/60">
          admin
        </Link>
        <span className="mx-2 opacity-40">·</span>
        <span
          className={`text-xs tabular-nums ${
            pbOk === true ? 'text-accent-green/70' : pbOk === false ? 'text-accent-red/80' : 'text-white/25'
          }`}
        >
          PB {pbOk === true ? 'ok' : pbOk === false ? 'fail' : '…'}
        </span>
      </footer>
    </div>
  )
}
