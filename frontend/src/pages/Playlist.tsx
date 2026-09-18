import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nContext'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'
import { Play, Plus, Trash2, ArrowLeft, GripVertical, Clock3, RotateCcw, SkipForward, Sparkles, Wand2, ChevronUp, ChevronDown } from 'lucide-react'
import {
  getPlaylist,
  savePlaylist,
  getPlaylistIndex,
  setPlaylistIndex,
} from '@/lib/playlist'
import { motion, AnimatePresence } from 'framer-motion'

const ALL: GameType[] = [
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

const GAME_DURATIONS: Record<GameType, number> = {
  kuldvillak: 35,
  miljonar: 20,
  roosidesoda: 25,
  blitz: 15,
  kinnistu_deal: 25,
  sonaseletus: 20,
  ma_ei_ole_kunagi: 20,
  viimane_pusti: 15,
  tode_voi_tegu: 25,
}

interface Preset {
  id: string
  title: string
  emoji: string
  games: GameType[]
}

const PRESETS: Preset[] = [
  {
    id: 'tv_classics',
    title: 'Klassikaline TV õhtu',
    emoji: '📺',
    games: ['kuldvillak', 'miljonar', 'roosidesoda'],
  },
  {
    id: 'party_frenzy',
    title: 'Meeleolukas peomängude hitt',
    emoji: '🎉',
    games: ['sonaseletus', 'ma_ei_ole_kunagi', 'viimane_pusti', 'tode_voi_tegu'],
  },
  {
    id: 'quiz_speed',
    title: 'Teadmised & kiirus',
    emoji: '⚡',
    games: ['blitz', 'kuldvillak', 'miljonar'],
  },
  {
    id: 'board_show',
    title: 'Lauamäng & TV show',
    emoji: '🎲',
    games: ['kinnistu_deal', 'roosidesoda', 'blitz'],
  },
]

export default function Playlist() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [list, setList] = useState<GameType[]>(() => getPlaylist())
  const [idx, setIdx] = useState(() => getPlaylistIndex())

  const totalMinutes = useMemo(() => {
    return list.reduce((acc, g) => acc + (GAME_DURATIONS[g] || 20), 0)
  }, [list])

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

  function applyPreset(preset: Preset) {
    save(preset.games)
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
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 ohtu-page-enter">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/50 hover:text-gold mb-6 text-sm transition">
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Sparkles className="text-gold animate-pulse" size={24} />
            <h1 className="font-display text-3xl md:text-4xl font-black text-gold">{t('playlistTitle')}</h1>
          </div>
          <p className="text-white/60 text-sm">{t('playlistSub')}</p>
        </div>
        {list.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-white/40 hover:text-accent-red text-xs flex items-center gap-1.5 transition self-start sm:self-auto py-1 px-2 rounded-lg hover:bg-white/5"
          >
            <RotateCcw size={13} /> {t('playlistClear')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-white/40 mb-8 border-b border-white/10 pb-4">
        <span className="inline-flex items-center gap-1.5 font-medium text-white/60">
          <Clock3 size={14} className="text-gold" />
          Kogukestus: <strong className="text-gold font-mono text-sm">{totalMinutes} min</strong> (~{(totalMinutes / 60).toFixed(1)} h)
        </span>
        <span>•</span>
        <span>{list.length} {list.length === 1 ? 'mäng kavas' : 'mängu kavas'}</span>
      </div>

      {/* Preset Recommendations */}
      <div className="mb-7">
        <span className="text-[11px] uppercase tracking-wider text-gold/70 font-bold block mb-2.5 flex items-center gap-1.5">
          <Wand2 size={13} /> Valmis mänguõhtu kavad
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-left p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-gold/50 hover:bg-white/[0.06] transition group"
            >
              <div className="text-xl mb-1">{p.emoji}</div>
              <div className="text-xs font-bold text-white/90 group-hover:text-gold transition-colors line-clamp-1">{p.title}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{p.games.length} mängu</div>
            </button>
          ))}
        </div>
      </div>

      {/* Add game pills */}
      <div className="mb-6">
        <span className="text-[11px] uppercase tracking-wider text-white/40 font-bold block mb-2">Lisa mäng kavva</span>
        <div className="flex flex-wrap gap-2">
          {ALL.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => add(g)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] text-white/75 hover:text-white border border-white/10 hover:border-gold/40 flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus size={12} className="text-gold" /> {EMOJI[g]} {t(('game_' + g) as TranslationKey)}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card-panel p-8 text-center text-white/50 text-sm mb-8 border-dashed border-white/15">
          <p className="mb-2">{t('playlistEmpty')}</p>
          <p className="text-xs text-white/35">Vali ülalt valmis kava või klõpsa mängudel, mida soovid täna mängida.</p>
        </div>
      ) : (
        <ol className="space-y-2.5 mb-8">
          <AnimatePresence>
            {list.map((g, i) => (
              <motion.li
                key={`${g}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-all ${
                  i === idx
                    ? 'border-gold/60 bg-gold/[0.08] shadow-[0_0_20px_rgba(223,179,66,0.15)]'
                    : 'border-white/[0.08] bg-[#081528]/80 hover:border-white/20'
                }`}
              >
                <div className="text-white flex items-center gap-3 min-w-0">
                  <GripVertical size={16} className="text-white/25 shrink-0" />
                  <span className="font-mono text-gold font-bold text-sm w-5">{i + 1}.</span>
                  <div className="truncate">
                    <span className="font-display font-bold text-base text-white mr-2">
                      {EMOJI[g]} {t(('game_' + g) as TranslationKey)}
                    </span>
                    <span className="text-[11px] text-white/40 hidden sm:inline">
                      ~{GAME_DURATIONS[g]} min
                    </span>
                  </div>
                  {i === idx && (
                    <span className="text-[10px] uppercase tracking-wide text-gold font-bold border border-gold/40 bg-gold/10 rounded-full px-2.5 py-0.5">
                      {t('playlistCurrent')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startFrom(i)}
                    className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold hover:text-bg transition"
                    title={t('playlistPlayFrom')}
                  >
                    <Play size={14} className="fill-current" />
                  </button>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="text-white/40 hover:text-white disabled:opacity-20 p-1.5 rounded-lg hover:bg-white/5 transition"
                    title="Liiguta üles"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={i === list.length - 1}
                    onClick={() => move(i, 1)}
                    className="text-white/40 hover:text-white disabled:opacity-20 p-1.5 rounded-lg hover:bg-white/5 transition"
                    title="Liiguta alla"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-white/40 hover:text-accent-red p-1.5 rounded-lg hover:bg-accent-red/10 transition"
                    title="Eemalda kavast"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={list.length === 0}
          onClick={start}
          className="btn-gold flex items-center gap-2 text-base px-6 py-2.5 font-bold shadow-[0_4px_20px_rgba(223,179,66,0.3)] disabled:opacity-40 active:scale-95 transition-all"
        >
          <Play size={17} className="fill-bg" /> {t('playlistStart')}
        </button>
        {list.length > 0 && idx > 0 && (
          <button
            type="button"
            onClick={continueEvening}
            className="btn-outline flex items-center gap-2 text-sm px-5 py-2.5 border-gold/40 text-gold hover:border-gold active:scale-95 transition-all"
          >
            <SkipForward size={16} /> {t('playlistContinue')}
          </button>
        )}
      </div>

      <p className="mt-10 text-center text-white/40 text-xs border-t border-white/[0.08] pt-6">
        {t('playlistHint')}{' '}
        <Link to="/dashboard" className="text-gold hover:underline">
          {t('playlistGames')}
        </Link>
      </p>
    </div>
  )
}
