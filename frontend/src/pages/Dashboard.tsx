import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { Plus, Layers } from 'lucide-react'
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
]

const EMOJI: Record<GameType, string> = {
  kuldvillak: '🏆',
  roosidesoda: '🌹',
  sonaseletus: '🗣️',
  ma_ei_ole_kunagi: '🙅',
  viimane_pusti: '🧍',
  tode_voi_tegu: '🎲',
}

export default function Dashboard() {
  const { user, isLoggedIn } = useAuth()
  const { t } = useI18n()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl md:text-4xl text-gold mb-2">
          {isLoggedIn
            ? t('dashHello', { name: user?.name || user?.email || '' })
            : t('dashTitle')}
        </h1>
        <p className="text-white/60 mb-8">{isLoggedIn ? t('dashSubLogged') : t('dashSubGuest')}</p>

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
            <Link to="/packs/new" className="btn-outline flex items-center gap-2 text-sm">
              <Plus size={16} /> {t('dashNewPack')}
            </Link>
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
