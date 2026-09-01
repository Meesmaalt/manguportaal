import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { pb, type Pack } from '@/lib/pocketbase'
import { Plus, Layers, Upload, RotateCcw } from 'lucide-react'
import { getRememberedHostSession, clearRememberedHostSession } from '@/hooks/useGameSession'
import { getStats } from '@/lib/stats'
import { motion } from 'framer-motion'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'

const ORDER: GameType[] = [
  'kuldvillak',
  'roosidesoda',
  'sonaseletus',
  'ma_ei_ole_kunagi',
  'viimane_pusti',
  'tode_voi_tegu',
  'kinnistu_deal',
  'blitz',
]

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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl md:text-4xl text-gold mb-2">
          {isLoggedIn
            ? t('dashHello', { name: user?.name || user?.email || '' })
            : t('dashTitle')}
        </h1>
        <p className="text-white/60 mb-8">{isLoggedIn ? t('dashSubLogged') : t('dashSubGuest')}</p>

        {remembered && (
          <div className="card-panel p-4 mb-6 border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-gold font-medium text-sm">{t('resumeSessionTitle')}</p>
              <p className="text-white/50 text-xs mt-0.5">
                {t('sessionCode')}: <span className="font-mono text-gold">{remembered.code}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-gold text-sm flex items-center gap-1"
                onClick={() => navigate(`/play/${remembered.gameType}/${remembered.sessionId}`)}
              >
                <RotateCcw size={14} /> {t('resumeSession')}
              </button>
              <button
                type="button"
                className="btn-outline text-sm"
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

        {!isLoggedIn && (
          <div className="card-panel p-4 mb-8 border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-white/70 text-sm">
              {t('dashAccountHint')}{' '}
              <Link to="/login" className="text-gold font-semibold hover:underline">
                {t('dashCreateAccount')}
              </Link>
            </p>
            <Link to="/login" className="btn-outline text-sm shrink-0">
              {t('dashEnter')}
            </Link>
          </div>
        )}

        {(stats.sessionsStarted > 0 || stats.questionsResolved > 0) && (
          <div className="card-panel p-4 mb-8 border-white/10 text-sm text-white/55 flex flex-wrap gap-4">
            <span>{t('statsSessions')}: <strong className="text-gold">{stats.sessionsStarted}</strong></span>
            <span>{t('statsQuestions')}: <strong className="text-gold">{stats.questionsResolved}</strong></span>
            {stats.lastPlayedAt && (
              <span className="text-white/35 text-xs w-full sm:w-auto">
                {t('statsLast')}: {new Date(stats.lastPlayedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {isLoggedIn && myPacks.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-xl text-gold mb-3 flex items-center gap-2">
              <Layers size={20} /> {t('myPacks')}
            </h2>
            <div className="space-y-2">
              {myPacks.map((p) => (
                <div
                  key={p.id}
                  className="card-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-display text-gold">{p.name}</div>
                    <div className="text-white/45 text-xs">
                      {t(('game_' + p.game_type) as TranslationKey)} · {p.description || ''}
                    </div>
                  </div>
                  <Link to={`/play/${p.game_type}`} className="btn-gold text-sm shrink-0">
                    {t('packPlay')}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {ORDER.map((key) => {
            const titleKey = `game_${key}` as TranslationKey
            const subKey = `game_${key}_sub` as TranslationKey
            const descKey = `game_${key}_desc` as TranslationKey
            return (
              <Link
                key={key}
                to={`/play/${key}`}
                className="card-panel p-6 hover:border-gold/60 hover:shadow-gold transition group"
              >
                <div className="text-3xl mb-2">{EMOJI[key]}</div>
                <p className="text-gold/60 text-xs uppercase tracking-widest">{t(subKey)}</p>
                <h2 className="font-display text-xl text-gold mb-1 group-hover:text-gold-hover">
                  {t(titleKey)}
                </h2>
                <p className="text-white/50 text-sm">{t(descKey)}</p>
                <span className="inline-block mt-3 text-gold text-sm font-bold">{t('homePlayCta')}</span>
              </Link>
            )
          })}
        </div>

        <div className="card-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="text-gold" size={24} />
            <div>
              <h3 className="font-semibold text-white">{t('dashPacksTitle')}</h3>
              <p className="text-white/50 text-sm">
                {isLoggedIn ? t('dashPacksLogged') : t('dashPacksGuest')}
              </p>
            </div>
          </div>
          {isLoggedIn ? (
            <div className="flex flex-wrap gap-2">
              <Link to="/packs/new" className="btn-outline flex items-center gap-2 text-sm">
                <Plus size={16} /> {t('dashNewPack')}
              </Link>
              <Link to="/packs/import" className="btn-outline flex items-center gap-2 text-sm">
                <Upload size={16} /> {t('importPack')}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="btn-outline text-sm">
              {t('dashLogin')}
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
