import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { pb, type Pack } from '@/lib/pocketbase'
import { Plus, Layers, Upload, RotateCcw, Sparkles } from 'lucide-react'
import { getRememberedHostSession, clearRememberedHostSession } from '@/hooks/useGameSession'
import { getStats } from '@/lib/stats'
import { motion } from 'framer-motion'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'

const ORDER: GameType[] = [
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
  sonaseletus: '🗣️',
  ma_ei_ole_kunagi: '🙅',
  viimane_pusti: '🧍',
  tode_voi_tegu: '🎲',
  kinnistu_deal: '🏠',
  blitz: '⚡',
}

export default function Dashboard() {
  const { user, isLoggedIn } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [myPacks, setMyPacks] = useState<Pack[]>([])
  const remembered = getRememberedHostSession()
  const stats = getStats()

  useEffect(() => {
    if (!user?.id) {
      setMyPacks([])
      return
    }
    pb.collection('packs')
      .getList<Pack>(1, 50, { filter: `owner = "${user.id}"` })
      .then((r) => setMyPacks(r.items))
      .catch(() => setMyPacks([]))
  }, [user?.id])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 ohtu-page-enter">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {remembered && (
          <div className="card-panel p-4 mb-6 border-gold/50 bg-gold/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <p className="text-gold font-bold text-sm flex items-center gap-2">
                <RotateCcw size={16} /> {t('resumeSessionTitle')}
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                {t('sessionCode')}: <span className="font-mono text-gold font-bold tracking-wider">{remembered.code}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-gold text-sm flex items-center gap-1.5 !py-1.5 px-4 font-bold"
                onClick={() => navigate(`/play/${remembered.gameType}/${remembered.sessionId}`)}
              >
                {t('resumeSession')}
              </button>
              <button
                type="button"
                className="btn-outline text-sm !py-1.5 px-3"
                onClick={() => {
                  clearRememberedHostSession()
                  window.location.reload()
                }}
              >
                {t('resumeDismiss')}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-gold/15 pb-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-gold font-bold">
              {isLoggedIn
                ? t('dashHello', { name: user?.name || user?.email || '' })
                : t('dashTitle')}
            </h1>
            <p className="text-white/60 text-sm mt-1">{isLoggedIn ? t('dashSubLogged') : t('dashSubGuest')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/gallery" className="btn-outline text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5 text-gold border-gold/40 hover:bg-gold/10">
              <Sparkles size={14} /> {t('galleryTitle')}
            </Link>
          </div>
        </div>

        {isLoggedIn && myPacks.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display text-lg text-gold mb-3 flex items-center gap-2 font-bold">
              <Layers size={18} /> {t('myPacks')}
            </h2>
            <div className="space-y-2">
              {myPacks.map((p) => (
                <div
                  key={p.id}
                  className="card-panel p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-display text-gold font-bold">{p.name}</div>
                    <div className="text-white/45 text-xs">
                      {t(('game_' + p.game_type) as TranslationKey)} · {p.description || ''}
                    </div>
                  </div>
                  <Link to={`/play/${p.game_type}`} className="btn-gold text-xs shrink-0 !py-1.5 px-3 font-semibold">
                    {t('packPlay')}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Games Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10">
          {ORDER.map((key) => {
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
                  <h2 className="font-display text-xl text-gold mb-1 group-hover:text-gold-hover font-bold transition-colors">
                    {t(titleKey)}
                  </h2>
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

        {/* Custom Packs Bar */}
        <div className="card-panel p-5 border-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Layers className="text-gold shrink-0" size={22} />
            <div>
              <h3 className="font-semibold text-white text-sm md:text-base">{t('dashPacksTitle')}</h3>
              <p className="text-white/50 text-xs">
                {isLoggedIn ? t('dashPacksLogged') : t('dashPacksGuest')}
              </p>
            </div>
          </div>
          {isLoggedIn ? (
            <div className="flex flex-wrap gap-2">
              <Link to="/packs/new" className="btn-outline flex items-center gap-1.5 text-xs !py-1.5 px-3">
                <Plus size={14} /> {t('dashNewPack')}
              </Link>
              <Link to="/packs/import" className="btn-outline flex items-center gap-1.5 text-xs !py-1.5 px-3">
                <Upload size={14} /> {t('importPack')}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="btn-outline text-xs !py-1.5 px-3 border-gold/40 text-gold hover:bg-gold/10">
              {t('dashLogin')}
            </Link>
          )}
        </div>

        {/* Subtle footer stats */}
        {(stats.sessionsStarted > 0 || stats.questionsResolved > 0) && (
          <div className="text-center text-xs text-white/30 space-x-3 pb-4">
            <span>{t('statsSessions')}: <strong className="text-white/50">{stats.sessionsStarted}</strong></span>
            <span>·</span>
            <span>{t('statsQuestions')}: <strong className="text-white/50">{stats.questionsResolved}</strong></span>
          </div>
        )}
      </motion.div>
    </div>
  )
}
