import { useState } from 'react'
import confetti from 'canvas-confetti'
import type { KuldvillakState } from './types'
import { X, Eye, EyeOff, Plus, Minus, Trophy } from 'lucide-react'

type Props = {
  state: KuldvillakState
  update: (partial: Partial<KuldvillakState> | ((p: KuldvillakState) => KuldvillakState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function KuldvillakBoard({ state, update, isHost = true, sessionCode }: Props) {
  const { teams, disabledCards, currentQuestion, showAnswer, packData } = state
  const categories = packData?.categories || []
  const maxRows = Math.max(...categories.map((c) => c.questions.length), 0)

  function openCard(col: number, row: number) {
    if (!isHost) return
    const cardId = `${col}-${row}`
    if (disabledCards.includes(cardId)) return
    const cat = categories[col]
    const q = cat.questions[row]
    update({
      currentQuestion: {
        col,
        row,
        category: cat.name,
        q: q.q,
        a: q.a,
        points: q.points,
      },
      showAnswer: false,
    })
  }

  function closeQuestion(awardTo?: number) {
    if (!currentQuestion) return
    const cardId = `${currentQuestion.col}-${currentQuestion.row}`
    update((prev) => {
      const next = { ...prev }
      next.disabledCards = [...prev.disabledCards, cardId]
      if (awardTo !== undefined) {
        next.teams = prev.teams.map((t, i) =>
          i === awardTo ? { ...t, score: t.score + currentQuestion.points } : t
        )
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } })
      }
      next.currentQuestion = null
      next.showAnswer = false
      return next
    })
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
    <div className="w-full max-w-6xl mx-auto px-2">
      {/* Session code badge */}
      {sessionCode && (
        <div className="text-center mb-4">
          <span className="inline-block bg-gold/15 border border-gold/40 text-gold px-4 py-1.5 rounded-full text-sm font-bold tracking-widest">
            Kood: {sessionCode}
          </span>
          <p className="text-white/40 text-xs mt-1">Ava teises seadmes /ekraan/{sessionCode}</p>
        </div>
      )}

      {/* Board */}
      <div
        className="grid gap-2 mb-6"
        style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}
      >
        {categories.map((cat, col) => (
          <div
            key={col}
            className="bg-gradient-to-b from-accent-blue/90 to-bg-panel border-2 border-gold rounded-lg py-3 px-1 text-center font-display text-gold text-sm md:text-base font-black shadow-lg min-h-[48px] flex items-center justify-center"
          >
            {cat.name}
          </div>
        ))}

        {Array.from({ length: maxRows }).map((_, row) =>
          categories.map((cat, col) => {
            const q = cat.questions[row]
            if (!q) return <div key={`${col}-${row}`} />
            const cardId = `${col}-${row}`
            const disabled = disabledCards.includes(cardId)
            return (
              <button
                key={cardId}
                disabled={disabled || !isHost}
                onClick={() => openCard(col, row)}
                className={`
                  aspect-[4/3] md:aspect-[3/2] rounded-lg font-display font-black text-xl md:text-2xl
                  transition-all border-2
                  ${
                    disabled
                      ? 'bg-bg/50 border-white/5 text-white/10 cursor-default'
                      : 'bg-gradient-to-br from-[#0d1f3c] to-[#071428] border-gold/60 text-gold hover:border-gold hover:shadow-gold hover:scale-[1.03] cursor-pointer'
                  }
                `}
              >
                {disabled ? '' : q.points}
              </button>
            )
          })
        )}
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {teams.map((team, i) => (
          <div
            key={i}
            className="card-panel p-4 flex flex-col items-center gap-2 border-gold/40"
          >
            {isHost ? (
              <input
                className="bg-transparent text-center font-display text-gold text-lg font-bold border-b border-gold/30 focus:outline-none focus:border-gold w-full max-w-[180px]"
                value={team.name}
                onChange={(e) => renameTeam(i, e.target.value)}
              />
            ) : (
              <div className="font-display text-gold text-lg font-bold">{team.name}</div>
            )}
            <div className="text-4xl font-display font-black text-white tabular-nums">
              {team.score}
            </div>
            {isHost && (
              <div className="flex gap-2">
                <button
                  onClick={() => adjustScore(i, -100)}
                  className="p-1.5 rounded-full border border-white/20 hover:border-accent-red hover:text-accent-red"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => adjustScore(i, 100)}
                  className="p-1.5 rounded-full border border-white/20 hover:border-accent-green hover:text-accent-green"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Question modal */}
      {currentQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card-panel max-w-2xl w-full p-6 md:p-10 relative border-gold/50 shadow-gold-lg">
            <button
              onClick={() => closeQuestion()}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="text-gold/70 text-sm font-semibold uppercase tracking-widest mb-1">
              {currentQuestion.category}
            </div>
            <div className="font-display text-3xl text-gold mb-6">{currentQuestion.points}</div>

            <p className="text-xl md:text-2xl text-white leading-relaxed mb-8">
              {currentQuestion.q}
            </p>

            {isHost && (
              <>
                <button
                  onClick={() => update({ showAnswer: !showAnswer })}
                  className="btn-outline text-sm mb-4 flex items-center gap-2"
                >
                  {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showAnswer ? 'Peida vastus' : 'Näita vastust'}
                </button>

                {showAnswer && (
                  <div className="bg-accent-green/15 border border-accent-green/40 rounded-xl px-5 py-4 mb-6 text-lg text-accent-green font-semibold">
                    {currentQuestion.a}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 justify-center">
                  {teams.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => closeQuestion(i)}
                      className="btn-gold flex items-center gap-2"
                    >
                      <Trophy size={16} />
                      {t.name} (+{currentQuestion.points})
                    </button>
                  ))}
                  <button onClick={() => closeQuestion()} className="btn-outline">
                    Keegi ei tea
                  </button>
                </div>
              </>
            )}

            {!isHost && showAnswer && (
              <div className="bg-accent-green/15 border border-accent-green/40 rounded-xl px-5 py-4 text-lg text-accent-green font-semibold text-center">
                {currentQuestion.a}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
