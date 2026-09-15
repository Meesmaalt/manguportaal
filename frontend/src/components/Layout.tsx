import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import type { Lang } from '@/i18n/translations'
import { LogOut, User, Zap, X } from 'lucide-react'
import ThemePicker from '@/components/ThemePicker'
import QuickJoinCard from '@/components/QuickJoinCard'
import { APP_VERSION } from '@/lib/version'
import { useEffect, useState } from 'react'
import { getRememberedHostSession, clearRememberedHostSession } from '@/hooks/useGameSession'

export default function Layout() {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const hideFooter = /\/play\/[^/]+\/[^/]+/.test(location.pathname)
  const { t, lang, setLang, langs } = useI18n()
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  const [hostResume, setHostResume] = useState(() => getRememberedHostSession())

  useEffect(() => {
    setHostResume(getRememberedHostSession())
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col layout-has-header relative overflow-x-hidden">
      {/* Cinematic ambient background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gold/[0.07] rounded-full blur-[120px]" />
        <div className="absolute top-[30%] -right-[150px] w-[500px] h-[500px] bg-blue-900/[0.12] rounded-full blur-[140px]" />
        <div className="absolute bottom-[5%] -left-[150px] w-[600px] h-[600px] bg-amber-900/[0.06] rounded-full blur-[160px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#030a16]/80 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 relative z-10">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold via-gold to-amber-500 flex items-center justify-center text-bg font-black text-base shadow-md shadow-gold/20 group-hover:scale-105 group-hover:shadow-gold/40 transition-all duration-300">
              Õ
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl sm:text-2xl font-black text-gold tracking-wider group-hover:text-gold-hover transition leading-none">
                {t('brand')}
              </span>
              <span className="text-white/40 text-[9px] tracking-[0.2em] uppercase font-bold leading-tight sm:inline hidden">
                {t('brandSub')}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-gold hover:text-white border border-gold/40 hover:border-gold rounded-full px-3 py-1.5 transition-all duration-200 bg-gold/10 hover:bg-gold/20 active:scale-95 shadow-[0_0_15px_rgba(223,179,66,0.15)] font-bold tracking-wide"
              title="Liitu mängu koodiga"
            >
              <Zap size={14} className="text-gold animate-pulse" />
              <span>Liitu koodiga</span>
            </button>

            <div className="h-4 w-[1px] bg-white/10 mx-0.5 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <ThemePicker />
              <div className="relative">
                <select
                  className="bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-full px-2.5 py-1.5 appearance-none cursor-pointer transition pr-6"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  aria-label="Language"
                >
                  {Object.entries(langs).map(([code, label]) => (
                    <option key={code} value={code} className="bg-[#030a16] text-white">
                      {label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 pl-1">
                <span className="text-white/50 text-xs hidden md:inline max-w-[120px] truncate font-medium">
                  {user?.name || user?.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="flex items-center gap-1 text-xs text-white/60 hover:text-gold px-2.5 py-1.5 rounded-full hover:bg-white/[0.05] transition"
                  title={t('navLogout')}
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">{t('navLogout')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs text-gold/90 hover:text-gold px-2.5 py-1.5 rounded-full hover:bg-gold/10 transition font-semibold"
              >
                <User size={15} />
                <span className="hidden sm:inline">{t('navLogin')}</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Quick Join Modal */}
      {joinModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setJoinModalOpen(false)}
        >
          <div
            className="w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-bg border border-gold/40 text-white/70 hover:text-white flex items-center justify-center z-10 shadow-lg"
              aria-label="Sulge aken"
            >
              <X size={16} />
            </button>
            <QuickJoinCard compact onJoined={() => setJoinModalOpen(false)} />
          </div>
        </div>
      )}

      {hostResume &&
        !location.pathname.includes(`/play/${hostResume.gameType}/${hostResume.sessionId}`) &&
        !location.pathname.startsWith('/ekraan') &&
        !location.pathname.startsWith('/blitz') &&
        !location.pathname.startsWith('/buzzer') &&
        !location.pathname.startsWith('/buzz') &&
        !location.pathname.startsWith('/deal/') && (
        <div className="bg-gold/15 border-b border-gold/40 px-4 py-2 text-center sticky top-[52px] z-40 flex items-center justify-center gap-2">
          <Link
            to={`/play/${hostResume.gameType}/${hostResume.sessionId}`}
            className="text-gold font-bold text-sm hover:underline inline-flex items-center gap-2"
          >
            ← {t('resumeHostCta')}
            <span className="text-white/50 font-normal text-xs">({hostResume.code})</span>
          </Link>
          <span className="text-white/40 text-xs ml-2 hidden sm:inline">{t('resumeHostHint')}</span>
          <button
            type="button"
            onClick={() => {
              clearRememberedHostSession()
              setHostResume(null)
            }}
            className="ml-3 text-white/40 hover:text-white p-1 rounded hover:bg-white/10 transition"
            title="Sulge teavitus"
            aria-label="Sulge teavitus"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {!hideFooter && (
      <footer className="border-t border-gold/10 py-6 text-center text-white/40 text-xs sm:text-sm">
        {t('footer')}
        <span className="mx-2 opacity-40">·</span>
        <Link to="/changelog" className="text-white/25 text-xs tabular-nums hover:text-gold/60">v{APP_VERSION}</Link>
        <span className="mx-2 opacity-40">·</span>
        <Link to="/admin" className="text-white/20 text-xs hover:text-gold/60">
          admin
        </Link>
      </footer>
      )}
    </div>
  )
}
