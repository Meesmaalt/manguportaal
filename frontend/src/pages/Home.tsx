import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { Sparkles, Tv, Layers, Play, User, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'

/** Featured on homepage — full list is on /dashboard */
const FEATURED: GameType[] = ['kuldvillak', 'blitz', 'kinnistu_deal']

const EMOJI: Record<GameType, string> = {
  kuldvillak: '🏆',
  roosidesoda: '🌹',
  sonaseletus: '🗣️',
  ma_ei_ole_kunagi: '🙅',
  viimane_pusti: '🧍',
  tode_voi_tegu: '🎲',
  kinnistu_deal: '🏠',
  blitz: '⚡',
}

export default function Home() {
  const { isLoggedIn } = useAuth()
  const { t } = useI18n()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 ohtu-page-enter">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-display text-5xl md:text-7xl font-black text-gold tracking-wide mb-4 drop-shadow-[0_0_30px_rgba(223,179,66,0.4)]">
          {t('homeTitle')}
        </h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">{t('homeSubtitle')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard" className="btn-gold text-lg px-8 py-3 flex items-center gap-2">
            <Play size={20} /> {t('homePlay')}
          </Link>
          <Link to="/gallery" className="btn-outline text-lg px-6 py-3">
            {t('galleryTitle')}
          </Link>
          {!isLoggedIn && (
            <Link to="/login" className="btn-outline text-lg px-6 py-3">
              {t('homeAccount')}
            </Link>
          )}
        </div>
      </motion.div>

      {/* Steps — informational, not buttons */}
      <div className="grid sm:grid-cols-3 gap-3 mb-10 max-w-3xl mx-auto">
        {[t('homeStep1'), t('homeStep2'), t('homeStep3')].map((step, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-white/70"
          >
            <span className="text-gold font-display font-bold text-lg block mb-1">{i + 1}</span>
            {step.replace(/^\d+\.\s*/, '')}
          </div>
        ))}
      </div>

      {/* Feature notes — clearly not clickable */}
      <div className="grid md:grid-cols-3 gap-4 mb-14">
        {[
          { icon: <User className="text-gold/80" size={22} />, title: t('homeFeatureGuest'), text: t('homeFeatureGuestText') },
          { icon: <Tv className="text-gold/80" size={22} />, title: t('homeFeatureTv'), text: t('homeFeatureTvText') },
          { icon: <Layers className="text-gold/80" size={22} />, title: t('homeFeaturePacks'), text: t('homeFeaturePacksText') },
        ].map((f, i) => (
          <div
            key={i}
            className="rounded-xl border border-dashed border-white/15 bg-transparent p-5 text-center"
          >
            <div className="flex justify-center mb-2 opacity-90">{f.icon}</div>
            <h3 className="font-display text-base text-gold/90 mb-1">{f.title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{f.text}</p>
          </div>
        ))}
      </div>

      <h2
        id="mangud"
        className="font-display text-2xl text-gold text-center mb-2 flex items-center justify-center gap-2 scroll-mt-24"
      >
        <Sparkles size={22} /> {t('homeGamesFeatured')}
      </h2>
      <p className="text-center text-white/40 text-sm mb-6">{t('homeGamesFeaturedHint')}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {FEATURED.map((key) => {
          const titleKey = `game_${key}` as TranslationKey
          const subKey = `game_${key}_sub` as TranslationKey
          const descKey = `game_${key}_desc` as TranslationKey
          return (
            <Link
              key={key}
              to={`/play/${key}`}
              className="card-panel p-5 hover:border-gold/50 transition group cursor-pointer"
            >
              <span className="text-2xl">{EMOJI[key]}</span>
              <p className="text-gold/60 text-xs uppercase tracking-widest mt-1">{t(subKey)}</p>
              <h3 className="font-display text-xl text-gold group-hover:text-gold-hover">{t(titleKey)}</h3>
              <p className="text-white/55 text-sm mt-1">{t(descKey)}</p>
              <span className="inline-block mt-3 text-gold text-sm font-bold">{t('homePlayCta')}</span>
            </Link>
          )
        })}
      </div>

      <div className="text-center mb-12">
        <Link to="/dashboard" className="btn-outline text-sm px-5 py-2 inline-flex items-center gap-2">
          {t('homeAllGames')} →
        </Link>
      </div>

      <p className="text-center text-white/40 text-sm flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <Info size={12} className="text-white/30" />
        <span>{t('homeGuestTruth')}</span>
      </p>

      <p className="text-center text-white/35 text-sm mt-6">
        <Link to="/playlist" className="hover:text-gold/80 underline-offset-2 hover:underline">
          {t('navPlaylist')}
        </Link>
        <span className="mx-2">·</span>
        {t('playlistHint')}{' '}
        <Link to="/dashboard" className="text-gold/70 hover:text-gold">
          {t('playlistGames')}
        </Link>
      </p>
    </div>
  )
}
