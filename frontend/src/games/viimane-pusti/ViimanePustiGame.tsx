import type { ViimanePustiPackData } from '@/data/official-packs'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'

type Player = { name: string; lives: number; standing: boolean }

export type ViimanePustiState = {
  players: Player[]
  statements: string[]
  index: number
  startingLives: number
  packData: ViimanePustiPackData
  code?: string
}

type Props = {
  state: ViimanePustiState
  update: (p: Partial<ViimanePustiState> | ((s: ViimanePustiState) => ViimanePustiState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function ViimanePustiGame({ state, update, isHost = true, sessionCode }: Props) {
  const { players, statements, index } = state
  const { t } = useI18n()
  const standing = players.filter((p) => p.standing && p.lives > 0)
  const winner = standing.length === 1 ? standing[0] : null

  function next() {
    if (!isHost) return
    update({ index: (index + 1) % statements.length })
  }

  function hit(i: number) {
    if (!isHost) return
    update((prev) => {
      const players = prev.players.map((p, idx) => {
        if (idx !== i) return p
        const lives = Math.max(0, p.lives - 1)
        return { ...p, lives, standing: lives > 0 }
      })
      return { ...prev, players }
    })
  }

  function addPlayer() {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        { name: `Mängija ${prev.players.length + 1}`, lives: prev.startingLives, standing: true },
      ],
    }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {isHost && <SessionCodeBadge code={sessionCode} />}
      {isHost && <GameToolbar />}

      {winner ? (
        <div className="card-panel p-10 text-center mb-6 border-gold shadow-gold">
          <p className="text-gold font-display text-xl mb-2">{t('lastStanding')}</p>
          <h2 className="text-4xl font-black text-white">{winner.name}</h2>
        </div>
      ) : (
        <div className="card-panel p-8 text-center mb-6">
          <p className="text-white/50 text-sm uppercase tracking-widest mb-3">{t('statement')}</p>
          <h2 className="text-2xl font-bold text-white">{statements[index]}</h2>
          {isHost && (
            <button onClick={next} className="btn-gold mt-6">
              {t('next')}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {players.map((p, i) => (
          <button
            key={i}
            disabled={!isHost || !p.standing}
            onClick={() => hit(i)}
            className={`card-panel p-4 text-center ${!p.standing ? 'opacity-25' : 'hover:border-accent-red'}`}
          >
            <div className="font-bold text-gold">{p.name}</div>
            <div className="text-xl mt-1">{p.standing ? '❤️'.repeat(p.lives) : '❌'}</div>
          </button>
        ))}
      </div>

      {isHost && (
        <button onClick={addPlayer} className="btn-outline text-sm mx-auto block">
          {t('addPlayer')}
        </button>
      )}
    </div>
  )
}
