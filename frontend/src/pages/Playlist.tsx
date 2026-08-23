import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nContext'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'
import { Play, Plus, Trash2, ArrowLeft } from 'lucide-react'

const ALL: GameType[] = [
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

export default function Playlist() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [list, setList] = useState<GameType[]>([])

  function add(g: GameType) {
    setList((prev) => [...prev, g])
  }

  function remove(i: number) {
    setList((prev) => prev.filter((_, idx) => idx !== i))
  }

  function start() {
    if (list.length === 0) return
    navigate(`/play/${list[0]}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-gold mb-6 text-sm">
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>

      <h1 className="font-display text-3xl text-gold mb-2">{t('playlistTitle')}</h1>
      <p className="text-white/60 text-sm mb-8">{t('playlistSub')}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {ALL.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => add(g)}
            className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1"
          >
            <Plus size={12} /> {EMOJI[g]} {t(('game_' + g) as TranslationKey)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-white/40 text-sm mb-6">{t('playlistEmpty')}</p>
      ) : (
        <ol className="space-y-2 mb-6">
          {list.map((g, i) => (
            <li
              key={`${g}-${i}`}
              className="card-panel p-3 flex items-center justify-between gap-3"
            >
              <span className="text-white">
                <span className="text-gold font-bold mr-2">{i + 1}.</span>
                {EMOJI[g]} {t(('game_' + g) as TranslationKey)}
              </span>
              <button type="button" onClick={() => remove(i)} className="text-accent-red p-1">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        disabled={list.length === 0}
        onClick={start}
        className="btn-gold flex items-center gap-2 disabled:opacity-40"
      >
        <Play size={16} /> {t('playlistStart')}
      </button>

      <p className="mt-8 text-center text-white/40 text-sm">
        {t('playlistHint')}{' '}
        <Link to="/dashboard" className="text-gold hover:underline">
          {t('playlistGames')}
        </Link>
      </p>
    </div>
  )
}
