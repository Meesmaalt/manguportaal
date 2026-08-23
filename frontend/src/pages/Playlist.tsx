import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nContext'
import type { GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'
import { Play, Plus, Trash2, ArrowLeft, GripVertical, Clock3, RotateCcw } from 'lucide-react'

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
  const [list, setList] = useState<GameType[]>(() => { try { return JSON.parse(localStorage.getItem('ohtu-playlist') || '[]') } catch { return [] } })

  function save(next: GameType[]) { setList(next); localStorage.setItem('ohtu-playlist', JSON.stringify(next)) }

  function add(g: GameType) {
    save([...list, g])
  }

  function remove(i: number) {
    save(list.filter((_, idx) => idx !== i))
  }

  function move(i: number, dir: -1 | 1) { const next=[...list]; const j=i+dir; if(j<0||j>=next.length)return; [next[i],next[j]]=[next[j],next[i]]; save(next) }

  function clear() { save([]) }

  function start() {
    if (list.length === 0) return
    navigate(`/play/${list[0]}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-gold mb-6 text-sm">
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>

      <div className="flex items-end justify-between gap-3 mb-2"><div><h1 className="font-display text-3xl text-gold">ÕHTU KAVA</h1><p className="text-white/50 text-sm mt-1">Pane terve õhtu mängud ühte järjekorda.</p></div>{list.length>0 && <button type="button" onClick={clear} className="text-white/40 hover:text-accent-red text-xs flex items-center gap-1"><RotateCcw size={13}/> Tühjenda</button>}</div>
      <div className="flex items-center gap-3 text-xs text-white/35 mb-7"><span className="inline-flex items-center gap-1"><Clock3 size={13}/> ~15–30 min / mäng</span><span>•</span><span>Salvestub selles seadmes</span></div>

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
            <li key={`${g}-${i}`} className="card-panel p-3 flex items-center justify-between gap-3 border-white/10">
              <span className="text-white flex items-center gap-2"><GripVertical size={15} className="text-white/20" />
                <span className="text-gold font-bold mr-2">{i + 1}.</span>
                {EMOJI[g]} {t(('game_' + g) as TranslationKey)}
              </span>
              <div className="flex items-center gap-1"><button type="button" disabled={i===0} onClick={()=>move(i,-1)} className="text-white/35 hover:text-gold disabled:opacity-20 p-1">↑</button><button type="button" disabled={i===list.length-1} onClick={()=>move(i,1)} className="text-white/35 hover:text-gold disabled:opacity-20 p-1">↓</button><button type="button" onClick={() => remove(i)} className="text-accent-red/70 hover:text-accent-red p-1"><Trash2 size={16} /></button></div>
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
