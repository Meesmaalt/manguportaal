import confetti from 'canvas-confetti'
import type { RoosidesodaState } from './types'
import { X, Plus, Minus, SkipForward, Banknote } from 'lucide-react'
import { useEffect } from 'react'

type Props = {
  state: RoosidesodaState
  update: (partial: Partial<RoosidesodaState> | ((p: RoosidesodaState) => RoosidesodaState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function RoosidesodaHost({ state, update, isHost = true, sessionCode }: Props) {
  const {
    teams,
    currentRoundIdx,
    revealed,
    strikes,
    bank,
    activeTeam,
    packData,
    showStrikeOverlay,
  } = state

  const rounds = packData?.rounds || []
  const round = rounds[currentRoundIdx]

  useEffect(() => {
    if (showStrikeOverlay) {
      const t = setTimeout(() => update({ showStrikeOverlay: false }), 1500)
      return () => clearTimeout(t)
    }
  }, [showStrikeOverlay])

  if (!round) {
    return (
      <div className="text-center py-20 text-gold font-display text-2xl">
        Mäng läbi! 🎉
      </div>
    )
  }

  function reveal(idx: number) {
    if (!isHost || revealed.includes(idx)) return
    const pts = round.answers[idx].points * round.multiplier
    update((prev) => ({
      ...prev,
      revealed: [...prev.revealed, idx],
      bank: prev.bank + pts,
    }))
  }

  function addStrike() {
    if (!isHost) return
    const next = strikes + 1
    update({
      strikes: next,
      showStrikeOverlay: true,
    })
    if (next >= 3) {
      // Lose bank
      setTimeout(() => {
        update({ bank: 0, strikes: 0 })
      }, 1600)
    }
  }

  function awardBank() {
    if (!isHost || bank === 0) return
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === prev.activeTeam ? { ...t, score: t.score + prev.bank } : t
      ),
      bank: 0,
      strikes: 0,
    }))
    confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } })
  }

  function nextRound() {
    if (!isHost) return
    if (currentRoundIdx >= rounds.length - 1) return
    update({
      currentRoundIdx: currentRoundIdx + 1,
      revealed: [],
      strikes: 0,
      bank: 0,
    })
  }

  function switchTeam() {
    if (!isHost) return
    update({ activeTeam: activeTeam === 0 ? 1 : 0, strikes: 0 })
  }

  function adjustScore(teamIdx: number, delta: number) {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === teamIdx ? { ...t, score: Math.max(0, t.score + delta) } : t
      ),
    }))
  }

  function renameTeam(idx: number, name: string) {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) => (i === idx ? { ...t, name } : t)),
    }))
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 relative">
      {sessionCode && (
        <div className="text-center mb-4">
          <span className="inline-block bg-gold/15 border border-gold/40 text-gold px-4 py-1.5 rounded-full text-sm font-bold tracking-widest">
            Kood: {sessionCode}
          </span>
          <p className="text-white/40 text-xs mt-1">Ava /ekraan/{sessionCode}</p>
        </div>
      )}

      {/* Round title */}
      <div className="text-center mb-6">
        <div className="font-display text-2xl md:text-3xl text-gold font-black">
          {round.title}
          <span className="text-gold/60 text-lg ml-2">({round.multiplier}×)</span>
        </div>
        <p className="text-white/80 text-lg mt-2 max-w-xl mx-auto">{round.question}</p>
      </div>

      {/* Bank */}
      <div className="flex justify-center mb-6">
        <div className="card-panel px-8 py-4 text-center border-gold/50">
          <div className="text-gold/70 text-xs uppercase tracking-widest mb-1">Bank</div>
          <div className="font-display text-4xl font-black text-gold">{bank}</div>
        </div>
      </div>

      {/* Answers board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-3xl mx-auto">
        {round.answers.map((ans, idx) => {
          const isRevealed = revealed.includes(idx)
          return (
            <button
              key={idx}
              disabled={!isHost || isRevealed}
              onClick={() => reveal(idx)}
              className={`
                flex items-center justify-between px-5 py-4 rounded-xl border-2 text-left transition-all
                ${
                  isRevealed
                    ? 'bg-gradient-to-r from-accent-green/30 to-accent-green/10 border-accent-green/60'
                    : 'bg-bg-panel border-gold/30 hover:border-gold hover:shadow-gold cursor-pointer'
                }
              `}
            >
              <span className="font-semibold text-lg">
                {isRevealed ? ans.text : `${idx + 1}`}
              </span>
              <span className="font-display font-black text-gold text-xl">
                {isRevealed ? ans.points * round.multiplier : '—'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Strikes */}
      <div className="flex justify-center gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl font-black transition ${
              i < strikes
                ? 'border-accent-red bg-accent-red/30 text-accent-red'
                : 'border-white/20 text-white/20'
            }`}
          >
            {i < strikes ? '✕' : ''}
          </div>
        ))}
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button onClick={addStrike} className="btn-outline border-accent-red text-accent-red hover:bg-accent-red hover:text-white">
            Streik ✕
          </button>
          <button onClick={awardBank} className="btn-gold flex items-center gap-2">
            <Banknote size={16} /> Anna bank ({teams[activeTeam]?.name})
          </button>
          <button onClick={switchTeam} className="btn-outline">
            Vaheta meeskonda
          </button>
          <button onClick={nextRound} className="btn-outline flex items-center gap-2">
            <SkipForward size={16} /> Järgmine voor
          </button>
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-2 gap-4">
        {teams.map((team, i) => (
          <div
            key={i}
            className={`card-panel p-4 text-center transition ${
              i === activeTeam ? 'border-gold shadow-gold' : 'border-white/10 opacity-80'
            }`}
          >
            {isHost ? (
              <input
                className="bg-transparent text-center font-display text-gold text-lg font-bold border-b border-gold/30 focus:outline-none w-full max-w-[160px] mx-auto"
                value={team.name}
                onChange={(e) => renameTeam(i, e.target.value)}
              />
            ) : (
              <div className="font-display text-gold text-lg font-bold">{team.name}</div>
            )}
            <div className="text-4xl font-display font-black mt-1 tabular-nums">{team.score}</div>
            {isHost && (
              <div className="flex justify-center gap-2 mt-2">
                <button
                  onClick={() => adjustScore(i, -10)}
                  className="p-1 rounded-full border border-white/20 hover:border-accent-red"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => adjustScore(i, 10)}
                  className="p-1 rounded-full border border-white/20 hover:border-accent-green"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
            {i === activeTeam && (
              <div className="text-xs text-gold/70 mt-1 uppercase tracking-wider">Aktiivne</div>
            )}
          </div>
        ))}
      </div>

      {/* Strike overlay */}
      {showStrikeOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-accent-red text-8xl md:text-9xl font-black animate-pulse">
            {'✕'.repeat(Math.min(strikes, 3))}
          </div>
        </div>
      )}
    </div>
  )
}
