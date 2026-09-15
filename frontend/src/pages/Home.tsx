import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { Sparkles, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'
import QuickJoinCard from '@/components/QuickJoinCard'

const GAMES: GameType[] = [
  'kuldvillak',
  'miljonar',
  'roosidesoda',
  'blitz',
  'kinnistu_deal',
  'sonaseletus',
  'ma_ei_ole_kunagi',
  'viimane_pusti',
  'tode_voi_tegu',
]

const EMOJI: Record<GameType, string> = {
  kuldvillak: '🏆',
  miljonar: '💰',
  roosidesoda: '🌹',
  blitz: '⚡',
  kinnistu_deal: '🏠',
  sonaseletus: '🗣️',
  ma_ei_ole_kunagi: '🙅',
  viimane_pusti: '🧍',
  tode_voi_tegu: '🎲',
}

export default function Home() {
  const { isLoggedIn } = useAuth()
  const { t } = useI18n()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 ohtu-page-enter">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center mb-10 relative"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-gold/30 bg-gold/[0.07] text-gold text-xs font-semibold uppercase tracking-widest mb-4 shadow-sm backdrop-blur-md">
          <Sparkles size={13} className="text-gold animate-pulse" />
          <span>Mänguõhtud & peomängud</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-gold tracking-tight mb-3 drop-shadow-[0_0_35px_rgba(223,179,66,0.3)]">
          {t('homeTitle')}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
          {t('homeSubtitle')}
        </p>

        <div className="mt-7 flex flex-wrap justify-center items-center gap-3">
          <a
            href="#mangud"
            className="btn-gold text-sm sm:text-base px-6 py-2.5 flex items-center gap-2 font-bold shadow-[0_4px_20px_rgba(223,179,66,0.3)] hover:shadow-[0_6px_25px_rgba(223,179,66,0.45)] active:scale-95 transition-all"
          >
            <Play size={17} className="fill-bg" /> {t('homePlay')}
          </a>
          <Link
            to="/gallery"
            className="btn-outline text-sm sm:text-base px-5 py-2.5 text-white/80 hover:text-gold border-white/20 hover:border-gold/60 backdrop-blur-sm transition-all"
          >
            {t('galleryTitle')}
          </Link>
          {!isLoggedIn && (
            <Link
              to="/login"
              className="btn-outline text-sm sm:text-base px-5 py-2.5 text-white/70 hover:text-white border-white/10 hover:border-white/30 backdrop-blur-sm transition-all"
            >
              {t('homeAccount')}
            </Link>
          )}
        </div>
      </motion.div>

      {/* Quick Join Card (Players and TV) */}
      <div className="mb-14 max-w-xl mx-auto">
        <QuickJoinCard />
      </div>

      {/* Direct Games Grid */}
      <div id="mangud" className="scroll-mt-24">
        <div className="flex items-center justify-between mb-5 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <h2 className="font-display text-2xl text-gold font-bold tracking-wide">
              {t('homeGamesFeatured')}
            </h2>
          </div>
          <span className="text-white/40 text-xs hidden sm:inline">{t('homeGamesFeaturedHint')}</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12">
          {GAMES.map((key) => {
            const titleKey = `game_${key}` as TranslationKey
            const subKey = `game_${key}_sub` as TranslationKey
            const descKey = `game_${key}_desc` as TranslationKey
            return (
              <Link
                key={key}
                to={`/play/${key}`}
                className="group relative rounded-2xl bg-[#081528]/80 border border-white/[0.08] hover:border-gold/60 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_35px_-8px_rgba(223,179,66,0.18)] flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle top card glow on hover */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/0 group-hover:via-gold/70 to-transparent transition-all duration-500" />

                <div>
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-gold/30 flex items-center justify-center text-2xl mb-3.5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {EMOJI[key]}
                  </div>
                  <p className="text-gold/60 text-[10px] uppercase tracking-widest font-bold mb-1">{t(subKey)}</p>
                  <h3 className="font-display text-xl text-gold group-hover:text-gold-hover font-bold mb-1.5 transition-colors">
                    {t(titleKey)}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">{t(descKey)}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-gold/90 font-bold group-hover:text-gold transition-colors">{t('homePlayCta')}</span>
                  <span className="text-white/30 group-hover:text-gold group-hover:translate-x-1 transition-all">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Clean, subtle footer info */}
      <div className="pt-6 border-t border-white/[0.08] text-center text-white/40 text-xs flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span>{t('homeGuestTruth')}</span>
        <span>·</span>
        <Link to="/playlist" className="hover:text-gold transition underline-offset-2 hover:underline">
          {t('navPlaylist')}
        </Link>
        <span>·</span>
        <Link to="/dashboard" className="text-gold/70 hover:text-gold transition">
          {t('navGames')}
        </Link>
      </div>
    </div>
  )
}
