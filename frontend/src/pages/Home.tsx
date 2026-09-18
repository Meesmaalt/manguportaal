import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { Play, Search, Users, Tv, Layers, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'
import QuickJoinCard from '@/components/QuickJoinCard'

interface GameMeta {
  type: GameType
  category: 'shows' | 'party' | 'tabletop'
  emoji: string
  players: string
  mode: string
  duration: string
  badge?: string
  badgeColor?: string
  accentColor: string
}

const GAME_METAS: GameMeta[] = [
  {
    type: 'kuldvillak',
    category: 'shows',
    emoji: '🏆',
    players: '2–6 tiimi / mängijat',
    mode: '📺 TV + 📱 Buzzer nupud',
    duration: '25–45 min',
    badge: '🔥 Telesaate lemmik',
    badgeColor: 'border-gold/60 text-gold bg-gold/10',
    accentColor: 'from-amber-500/20 via-gold/10 to-transparent',
  },
  {
    type: 'miljonar',
    category: 'shows',
    emoji: '💰',
    players: '1 mängija + pealtvaatajad',
    mode: '📺 TV + 3 oljavõimalust',
    duration: '15–30 min',
    badge: '💎 1 000 000 €',
    badgeColor: 'border-emerald-400/60 text-emerald-300 bg-emerald-500/10',
    accentColor: 'from-emerald-500/20 via-emerald-900/10 to-transparent',
  },
  {
    type: 'roosidesoda',
    category: 'shows',
    emoji: '🌹',
    players: '2 võistkonda',
    mode: '📺 TV + 100 eestlast vastas',
    duration: '20–35 min',
    badge: '⭐ Peohitt',
    badgeColor: 'border-rose-400/60 text-rose-300 bg-rose-500/10',
    accentColor: 'from-rose-500/20 via-rose-900/10 to-transparent',
  },
  {
    type: 'blitz',
    category: 'shows',
    emoji: '⚡',
    players: '2–50+ mängijat',
    mode: '📱 Igaühe telefon + TV poodium',
    duration: '10–20 min',
    badge: '⚡ Kiirus ja reaktsioon',
    badgeColor: 'border-cyan-400/60 text-cyan-300 bg-cyan-500/10',
    accentColor: 'from-cyan-500/20 via-blue-900/10 to-transparent',
  },
  {
    type: 'kinnistu_deal',
    category: 'tabletop',
    emoji: '🏠',
    players: '2–5 mängijat',
    mode: '📱 Telefon käes + TV laud',
    duration: '15–35 min',
    badge: '🃏 Monopoly kaardimäng',
    badgeColor: 'border-violet-400/60 text-violet-300 bg-violet-500/10',
    accentColor: 'from-violet-500/20 via-purple-900/10 to-transparent',
  },
  {
    type: 'sonaseletus',
    category: 'party',
    emoji: '🗣️',
    players: '4+ mängijat / tiimid',
    mode: '📱 Telefon või ekraan',
    duration: '15–30 min',
    badge: '🎭 Alias seltskonnamäng',
    badgeColor: 'border-amber-400/60 text-amber-300 bg-amber-500/10',
    accentColor: 'from-amber-500/20 via-orange-900/10 to-transparent',
  },
  {
    type: 'ma_ei_ole_kunagi',
    category: 'party',
    emoji: '🙅',
    players: '3–20+ mängijat',
    mode: '📱 Lihtne peomäng',
    duration: '15–30 min',
    badge: '🌶️ Paljastav ja lõbus',
    badgeColor: 'border-pink-400/60 text-pink-300 bg-pink-500/10',
    accentColor: 'from-pink-500/20 via-red-900/10 to-transparent',
  },
  {
    type: 'viimane_pusti',
    category: 'party',
    emoji: '🧍',
    players: '5–50+ mängijat',
    mode: '📺 Suur ekraan + saal',
    duration: '10–20 min',
    badge: '👑 Ellujäämismäng',
    badgeColor: 'border-sky-400/60 text-sky-300 bg-sky-500/10',
    accentColor: 'from-sky-500/20 via-blue-900/10 to-transparent',
  },
  {
    type: 'tode_voi_tegu',
    category: 'party',
    emoji: '🎲',
    players: '3–15 mängijat',
    mode: '📱 Telefon ringis',
    duration: '15–40 min',
    badge: '🎯 Klassikaline julgusmäng',
    badgeColor: 'border-orange-400/60 text-orange-300 bg-orange-500/10',
    accentColor: 'from-orange-500/20 via-amber-900/10 to-transparent',
  },
]

type CategoryTab = 'all' | 'shows' | 'party' | 'tabletop'

export default function Home() {
  const { isLoggedIn } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGames = useMemo(() => {
    return GAME_METAS.filter((g) => {
      if (activeTab !== 'all' && g.category !== activeTab) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const title = t(`game_${g.type}` as TranslationKey).toLowerCase()
      const sub = t(`game_${g.type}_sub` as TranslationKey).toLowerCase()
      const desc = t(`game_${g.type}_desc` as TranslationKey).toLowerCase()
      return title.includes(q) || sub.includes(q) || desc.includes(q)
    })
  }, [activeTab, searchQuery, t])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 ohtu-page-enter">
      {/* Minimalist Hero Section */}
      <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl sm:text-4xl font-bold text-gold tracking-tight mb-2">
          {t('homeTitle')}
        </h1>
        <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
          {t('homeSubtitle')}
        </p>

        <div className="mt-5 flex flex-wrap justify-center items-center gap-2.5">
          <a
            href="#mangud"
            className="btn-gold text-xs sm:text-sm px-4 py-2 flex items-center gap-1.5 font-bold shadow-sm active:scale-95 transition-all"
          >
            <Play size={14} className="fill-bg" /> {t('homePlay')}
          </a>
          <Link
            to="/gallery"
            className="btn-outline text-xs sm:text-sm px-4 py-2 text-white/75 hover:text-gold border-white/15 hover:border-gold/50 transition-all"
          >
            {t('galleryTitle')}
          </Link>
          <Link
            to="/playlist"
            className="btn-outline text-xs sm:text-sm px-4 py-2 text-white/60 hover:text-white border-white/10 hover:border-white/25 transition-all"
          >
            {t('navPlaylist')}
          </Link>
        </div>
      </div>

      {/* Compact Quick Join */}
      <div className="mb-10 max-w-lg mx-auto">
        <QuickJoinCard compact />
      </div>

      {/* Direct Games Grid */}
      <div id="mangud" className="scroll-mt-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold tracking-wide">
              {t('homeGamesFeatured')}
            </h2>
            <span className="text-white/40 text-xs font-sans">
              ({filteredGames.length})
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Otsi mängu..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/10 focus:border-gold/60 rounded-xl text-white placeholder-white/40 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-5 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-gold text-bg font-bold shadow-sm'
                : 'bg-white/[0.03] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            Kõik ({GAME_METAS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shows')}
            className={`px-3.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'shows'
                ? 'bg-gold text-bg font-bold shadow-sm'
                : 'bg-white/[0.03] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            <Tv size={13} /> Telesaated (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('party')}
            className={`px-3.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'party'
                ? 'bg-gold text-bg font-bold shadow-sm'
                : 'bg-white/[0.03] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            <Users size={13} /> Peomängud (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tabletop')}
            className={`px-3.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'tabletop'
                ? 'bg-gold text-bg font-bold shadow-sm'
                : 'bg-white/[0.03] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            <Layers size={13} /> Lauamängud (1)
          </button>
        </div>

        {/* Game Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <AnimatePresence>
            {filteredGames.map((g) => {
              const titleKey = `game_${g.type}` as TranslationKey
              const subKey = `game_${g.type}_sub` as TranslationKey
              const descKey = `game_${g.type}_desc` as TranslationKey
              return (
                <motion.div
                  key={g.type}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <Link
                    to={`/play/${g.type}`}
                    className="group relative h-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.055] border border-white/[0.09] hover:border-gold/50 p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3.5">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shrink-0">
                          {g.emoji}
                        </div>
                        {g.badge && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.04] text-white/70 shrink-0">
                            {g.badge.replace(/[🔥💎⭐⚡🃏🎭🌶️👑🎯]/g, '').trim()}
                          </span>
                        )}
                      </div>

                      <p className="text-gold/60 text-[10px] uppercase tracking-widest font-semibold mb-1">
                        {t(subKey)}
                      </p>
                      <h3 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 group-hover:text-gold-hover transition-colors">
                        {t(titleKey)}
                      </h3>
                      <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2">
                        {t(descKey)}
                      </p>

                      {/* Clean Meta Tags */}
                      <div className="space-y-1.5 pt-3 border-t border-white/[0.07] text-[11px] text-white/50">
                        <div className="flex items-center gap-2">
                          <Users size={12} className="text-gold/60 shrink-0" />
                          <span>{g.players}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tv size={12} className="text-gold/60 shrink-0" />
                          <span>{g.mode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/[0.07] flex items-center justify-between text-xs">
                      <span className="text-gold font-semibold flex items-center gap-1 group-hover:text-gold-hover transition-colors">
                        {t('homePlayCta')}
                      </span>
                      <span className="text-white/30 group-hover:text-gold group-hover:translate-x-1 transition-all">
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Clean footer info */}
      <div className="pt-6 border-t border-white/[0.06] text-center text-white/40 text-xs flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <span>{t('homeGuestTruth')}</span>
        <span>·</span>
        <Link to="/playlist" className="hover:text-gold transition">
          {t('navPlaylist')}
        </Link>
        <span>·</span>
        <Link to="/gallery" className="hover:text-gold transition">
          {t('galleryTitle')}
        </Link>
        <span>·</span>
        <Link to="/dashboard" className="text-gold/70 hover:text-gold transition font-medium">
          {t('navGames')}
        </Link>
      </div>
    </div>
  )
}
