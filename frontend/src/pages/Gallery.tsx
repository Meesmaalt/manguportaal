import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { pb, type Pack } from '@/lib/pocketbase'
import { useI18n } from '@/i18n/I18nContext'
import type { TranslationKey } from '@/i18n/translations'
import { GAME_META, type GameType } from '@/lib/types'
import { ArrowLeft, Play, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Public pack gallery — browse is_official / is_public packs across games.
 */
export default function Gallery() {
  const { t } = useI18n()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await pb.collection('packs').getList<Pack>(1, 200, { requestKey: null })
        if (!cancelled) {
          setPacks(
            list.items.filter((p) => p.is_official || p.is_public)
          )
        }
      } catch {
        if (!cancelled) setPacks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (gameFilter === 'all') return packs
    return packs.filter((p) => p.game_type === gameFilter)
  }, [packs, gameFilter])

  const games = useMemo(() => {
    const s = new Set(packs.map((p) => p.game_type))
    return (Object.keys(GAME_META) as GameType[]).filter((g) => s.has(g))
  }, [packs])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm mb-6">
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="text-gold" size={28} />
        <h1 className="font-display text-3xl text-gold">{t('galleryTitle')}</h1>
      </div>
      <p className="text-white/55 text-sm mb-6">{t('gallerySub')}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setGameFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full border ${
            gameFilter === 'all' ? 'bg-gold text-bg border-gold font-bold' : 'border-gold/35 text-gold'
          }`}
        >
          {t('packFilterAll')} ({packs.length})
        </button>
        {games.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGameFilter(g)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              gameFilter === g ? 'bg-gold text-bg border-gold font-bold' : 'border-gold/35 text-gold'
            }`}
          >
            {GAME_META[g]?.emoji} {t(('game_' + g) as TranslationKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gold animate-pulse">{t('packLoading')}</p>
      ) : filtered.length === 0 ? (
        <div className="card-panel p-6 text-center text-white/50 text-sm">
          {t('galleryEmpty')}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="card-panel p-4 border-gold/25 flex flex-col gap-3"
            >
              <div>
                <div className="text-xs text-white/40 mb-1">
                  {GAME_META[pack.game_type as GameType]?.emoji}{' '}
                  {t(('game_' + pack.game_type) as TranslationKey)}
                </div>
                <h3 className="font-display text-gold text-lg leading-snug">{pack.name}</h3>
                {pack.description && (
                  <p className="text-white/45 text-xs mt-1 line-clamp-2">{pack.description}</p>
                )}
              </div>
              <Link
                to={`/play/${pack.game_type}`}
                className="btn-gold text-sm !py-2 flex items-center justify-center gap-1 mt-auto"
              >
                <Play size={14} /> {t('packPlay')}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
