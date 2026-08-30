import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nContext'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'
import { Play, Plus, Trash2, ArrowLeft, GripVertical, Clock3, RotateCcw, SkipForward } from 'lucide-react'
import {
  getPlaylist,
  savePlaylist,
  getPlaylistIndex,
  setPlaylistIndex,
} from '@/lib/playlist'

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
  const [list, setList] = useState<GameType[]>(() => getPlaylist())
  const [idx, setIdx] = useState(() => getPlaylistIndex())

  function save(next: GameType[]) {
    setList(next)
    savePlaylist(next)
    if (idx >= next.length) {
      setIdx(0)
      setPlaylistIndex(0)
    }
  }

  function add(g: GameType) {
    save([...list, g])
  }

  function remove(i: number) {
    save(list.filter((_, j) => j !== i))
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...list]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    save(next)
  }

  function clear() {
    save([])
    setIdx(0)
    setPlaylistIndex(0)
  }

  function startFrom(i: number) {
    if (!list.length) return
    setPlaylistIndex(i)
    setIdx(i)
    navigate(`/play/${list[i]}`)
  }

  function start() {
    startFrom(0)
  }

  function continueEvening() {
    const i = Math.min(idx, list.length - 1)
    startFrom(Math.max(0, i))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-gold mb-6 text-sm">
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>

      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <h1 className="font-display text-3xl text-gold">{t('playlistTitle')}</h1>
          <p className="text-white/50 text-sm mt-1">{t('playlistSub')}</p>
        </div>
        {list.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-white/40 hover:text-accent-red text-xs flex items-center gap-1"
          >
            <RotateCcw size={13} /> {t('playlistClear')}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-white/35 mb-7">
        <span className="inline-flex items-center gap-1">
          <Clock3 size={13} /> {t('playlistDuration')}
        </span>
        <span>•</span>
        <span>{t('playlistStored')}</span>
      </div>

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
              className={`card-panel p-3 flex items-center justify-between gap-3 ${
                i === idx ? 'border-gold/50 bg-gold/5' : 'border-white/10'
              }`}
            >
              <span className="text-white flex items-center gap-2 min-w-0">
                <GripVertical size={15} className="text-white/20 shrink-0" />
                <span className="text-gold font-bold mr-1">{i + 1}.</span>
                <span className="truncate">
                  {EMOJI[g]} {t(('game_' + g) as TranslationKey)}
                </span>
                {i === idx && (
                  <span className="text-[10px] uppercase tracking-wide text-gold/80 border border-gold/30 rounded-full px-2 py-0.5">
                    {t('playlistCurrent')}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => startFrom(i)}
                  className="text-gold/70 hover:text-gold p-1"
                  title={t('playlistPlayFrom')}
                >
                  <Play size={14} />
                </button>
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="text-white/35 hover:text-gold disabled:opacity-20 p-1"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === list.length - 1}
                  onClick={() => move(i, 1)}
                  className="text-white/35 hover:text-gold disabled:opacity-20 p-1"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-accent-red/70 hover:text-accent-red p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={list.length === 0}
          onClick={start}
          className="btn-gold flex items-center gap-2 disabled:opacity-40"
        >
          <Play size={16} /> {t('playlistStart')}
        </button>
        {list.length > 0 && idx > 0 && (
          <button
            type="button"
            onClick={continueEvening}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <SkipForward size={16} /> {t('playlistContinue')}
          </button>
        )}
      </div>

      <p className="mt-8 text-center text-white/40 text-sm">
        {t('playlistHint')}{' '}
        <Link to="/dashboard" className="text-gold hover:underline">
          {t('playlistGames')}
        </Link>
      </p>
    </div>
  )
}
