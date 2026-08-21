import type { MaEiOleKunagiPackData } from '@/data/official-packs'
import SessionCodeBadge from '@/components/SessionCodeBadge'

type Player = { name: string; lives: number }

export type MaEiOleKunagiState = {
  players: Player[]
  statements: string[]
  index: number
  packData: MaEiOleKunagiPackData
  code?: string
}

type Props = {
  state: MaEiOleKunagiState
  update: (p: Partial<MaEiOleKunagiState> | ((s: MaEiOleKunagiState) => MaEiOleKunagiState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function MaEiOleKunagiGame({ state, update, isHost = true, sessionCode }: Props) {
  const { players, statements, index } = state
  const current = statements[index]

  function next() {
    if (!isHost) return
    update({ index: (index + 1) % statements.length })
  }

  function loseLife(i: number) {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: prev.players.map((p, idx) =>
        idx === i ? { ...p, lives: Math.max(0, p.lives - 1) } : p
      ),
    }))
  }

  function addPlayer() {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: [...prev.players, { name: `Mängija ${prev.players.length + 1}`, lives: 3 }],
    }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <SessionCodeBadge code={sessionCode} />

      <div className="card-panel p-8 text-center mb-6">
        <p className="text-white/50 text-sm uppercase tracking-widest mb-3">Väide</p>
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">{current}</h2>
        {isHost && (
          <button onClick={next} className="btn-gold mt-6">
            Järgmine väide →
          </button>
        )}
      </div>

      <p className="text-center text-white/50 text-sm mb-4">
        Kes ON teinud – kaotab elu (vajuta nimele)
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {players.map((p, i) => (
          <button
            key={i}
            disabled={!isHost || p.lives <= 0}
            onClick={() => loseLife(i)}
            className={`card-panel p-4 text-center transition ${
              p.lives <= 0 ? 'opacity-30' : 'hover:border-accent-red'
            }`}
          >
            <div className="font-bold text-gold">{p.name}</div>
            <div className="text-2xl mt-1">{'❤️'.repeat(p.lives) || '💀'}</div>
          </button>
        ))}
      </div>

      {isHost && (
        <button onClick={addPlayer} className="btn-outline text-sm mx-auto block">
          + Lisa mängija
        </button>
      )}
    </div>
  )
}
