import { useState } from 'react'
import type { TodeVoiTeguPackData } from '@/data/official-packs'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'

type Player = { name: string }

export type TodeVoiTeguState = {
  players: Player[]
  currentPlayer: number
  truths: string[]
  dares: string[]
  currentCard: { type: 'truth' | 'dare'; text: string } | null
  packData: TodeVoiTeguPackData
  code?: string
}

type Props = {
  state: TodeVoiTeguState
  update: (p: Partial<TodeVoiTeguState> | ((s: TodeVoiTeguState) => TodeVoiTeguState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function TodeVoiTeguGame({ state, update, isHost = true, sessionCode }: Props) {
  const { players, currentPlayer, truths, dares, currentCard } = state
  const { t } = useI18n()
  const player = players[currentPlayer]

  function draw(type: 'truth' | 'dare') {
    if (!isHost) return
    const pool = type === 'truth' ? truths : dares
    const text = pool[Math.floor(Math.random() * pool.length)] || '—'
    update({ currentCard: { type, text } })
  }

  function nextPlayer() {
    if (!isHost) return
    update({
      currentPlayer: (currentPlayer + 1) % players.length,
      currentCard: null,
    })
  }

  function addPlayer() {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: [...prev.players, { name: `Mängija ${prev.players.length + 1}` }],
    }))
  }

  function rename(i: number, name: string) {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: prev.players.map((p, idx) => (idx === i ? { name } : p)),
    }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {isHost && <SessionCodeBadge code={sessionCode} />}
      {isHost && <GameToolbar />}

      <div className="text-center mb-6">
        <p className="text-white/50 text-sm uppercase tracking-widest">{t('nowPlaying')}</p>
        <h2 className="font-display text-3xl text-gold font-black">{player?.name || '—'}</h2>
      </div>

      {currentCard ? (
        <div className="card-panel p-8 text-center mb-6 border-gold/50">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">
            {currentCard.type === 'truth' ? t('truth') : t('dare')}
          </p>
          <p className="text-2xl font-bold text-white leading-snug">{currentCard.text}</p>
          {isHost && (
            <button onClick={nextPlayer} className="btn-gold mt-6">
              {t('doneNextPlayer')}
            </button>
          )}
        </div>
      ) : (
        isHost && (
          <div className="flex justify-center gap-4 mb-8">
            <button onClick={() => draw('truth')} className="btn-gold text-lg px-8 py-4">
              Tõde
            </button>
            <button onClick={() => draw('dare')} className="btn-outline text-lg px-8 py-4 border-accent-red text-accent-red hover:bg-accent-red hover:text-white">
              Tegu
            </button>
          </div>
        )
      )}

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {players.map((p, i) =>
          isHost ? (
            <input
              key={i}
              className={`input-field w-auto max-w-[140px] text-center text-sm ${
                i === currentPlayer ? 'border-gold' : ''
              }`}
              value={p.name}
              onChange={(e) => rename(i, e.target.value)}
            />
          ) : (
            <span
              key={i}
              className={`px-3 py-1.5 rounded-full text-sm ${
                i === currentPlayer ? 'bg-gold text-bg font-bold' : 'bg-white/10'
              }`}
            >
              {p.name}
            </span>
          )
        )}
      </div>

      {isHost && (
        <button onClick={addPlayer} className="btn-outline text-sm mx-auto block">
          {t('addPlayer')}
        </button>
      )}
    </div>
  )
}
