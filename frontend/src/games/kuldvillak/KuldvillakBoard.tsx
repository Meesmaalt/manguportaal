import confetti from 'canvas-confetti'
import { useEffect, useRef, useState } from 'react'
import type { KuldvillakState } from './types'
import { X, Eye, EyeOff, Plus, Minus, Trophy, Volume2, VolumeX, Eye as EyeIcon } from 'lucide-react'
import { createBgm, sounds } from '@/lib/audio'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'

type Props = {
  state: KuldvillakState
  update: (partial: Partial<KuldvillakState> | ((p: KuldvillakState) => KuldvillakState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function KuldvillakBoard({ state, update, isHost = true, sessionCode }: Props) {
  const { teams, disabledCards, currentQuestion, showAnswer, packData, confettiAt, hostPeek } = state
  const categories = packData?.categories || []
  const maxRows = Math.max(...categories.map((c) => c.questions.length), 0)

  const [musicOn, setMusicOn] = useState(false)
  const bgmRef = useRef<ReturnType<typeof createBgm> | null>(null)
  const lastConfetti = useRef<number>(0)

  useEffect(() => {
    bgmRef.current = createBgm(sounds.kuldvillakBgm, 0.3)
    return () => bgmRef.current?.pause()
  }, [])

  // Display (not host): react to confetti triggers from host
  useEffect(() => {
    if (isHost) return
    if (confettiAt && confettiAt !== lastConfetti.current) {
      lastConfetti.current = confettiAt
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 }, spread: 70 })
    }
  }, [confettiAt, isHost])

  function toggleMusic() {
    if (!bgmRef.current) return
    if (musicOn) {
      bgmRef.current.pause()
      setMusicOn(false)
    } else {
      bgmRef.current.play()
      setMusicOn(true)
    }
  }

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
      const next: KuldvillakState = { ...prev }
      if (!prev.disabledCards.includes(cardId)) {
        next.disabledCards = [...prev.disabledCards, cardId]
      }
      if (awardTo !== undefined) {
        next.teams = prev.teams.map((t, i) =>
          i === awardTo ? { ...t, score: t.score + currentQuestion.points } : t
        )
        // Trigger confetti on Display screens via state sync
        next.confettiAt = Date.now()
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

  function resetGame() {
    if (!isHost) return
    if (!confirm('Taasta algseis? Skoorid ja avatud kaardid nullitakse.')) return
    update((prev) => ({
      ...prev,
      disabledCards: [],
      currentQuestion: null,
      showAnswer: false,
      teams: prev.teams.map((t) => ({ ...t, score: 0 })),
    }))
  }

  const teamCols =
    teams.length <= 2
      ? 'grid-cols-2 max-w-xl mx-auto'
      : teams.length === 3
        ? 'grid-cols-3 max-w-3xl mx-auto'
        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-5xl mx-auto'

  const showPeek = isHost && hostPeek

  return (
    <div className="w-full max-w-6xl mx-auto px-2">
      {isHost && (
        <GameToolbar
          onReset={resetGame}
          extra={
            <>
              <button
                type="button"
                onClick={toggleMusic}
                className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5"
              >
                {musicOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {musicOn ? 'Muusika sees' : 'Muusika'}
              </button>
              <button
                type="button"
                onClick={() => update({ hostPeek: !hostPeek })}
                className={`btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 ${
                  hostPeek ? 'bg-gold text-bg border-gold' : ''
                }`}
              >
                <EyeIcon size={14} />
                {hostPeek ? 'Vastused peidus' : 'Näita vastuseid'}
              </button>
              <button
                type="button"
                className="btn-outline text-xs !py-1.5 !px-3"
                onClick={() =>
                  update((prev) => ({
                    ...prev,
                    teams: [...prev.teams, { name: `Meeskond ${prev.teams.length + 1}`, score: 0 }],
                  }))
                }
              >
                + Meeskond
              </button>
              <button
                type="button"
                className="btn-outline text-xs !py-1.5 !px-3"
                onClick={() =>
                  update((prev) => ({
                    ...prev,
                    teams: prev.teams.length > 1 ? prev.teams.slice(0, -1) : prev.teams,
                  }))
                }
              >
                − Meeskond
              </button>
            </>
          }
        />
      )}

      {isHost && <SessionCodeBadge code={sessionCode} />}

      <div id="game-scale-root">
        <h1 className="font-display text-center text-3xl md:text-4xl font-black text-gold mb-5 tracking-wide drop-shadow-[0_0_20px_rgba(223,179,66,0.4)]">
          🏆 KULDVILLAK 🏆
        </h1>

        <div
          className="grid gap-2.5 mb-8"
          style={{ gridTemplateColumns: `repeat(${Math.max(categories.length, 1)}, minmax(0, 1fr))` }}
        >
          {categories.map((cat, col) => (
            <div
              key={col}
              className="bg-gradient-to-b from-[#1e3a8a]/95 to-[#0a192f] border-2 border-gold rounded-xl py-3 px-1 text-center font-display text-gold text-sm md:text-base font-black shadow-lg min-h-[52px] flex items-center justify-center leading-tight"
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
                    min-h-[72px] md:min-h-[96px] rounded-xl font-display font-black
                    transition-all duration-200 border-2 relative overflow-hidden
                    ${
                      disabled
                        ? 'bg-black/40 border-white/5 cursor-default'
                        : 'bg-gradient-to-br from-[#0d1f3c] to-[#061018] border-gold/70 text-gold hover:bg-gold hover:text-bg hover:scale-[1.04] hover:shadow-gold cursor-pointer'
                    }
                  `}
                >
                  <span className={`text-2xl md:text-3xl ${disabled && !showPeek ? 'text-transparent' : ''}`}>
                    {disabled && !showPeek ? '' : q.points}
                  </span>
                  {showPeek && (
                    <span className="absolute inset-x-1 bottom-1 text-[0.55rem] md:text-[0.65rem] leading-tight text-accent-green font-sans font-bold opacity-90 line-clamp-2">
                      {q.a}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className={`grid ${teamCols} gap-4 mb-4 justify-items-stretch`}>
          {teams.map((team, i) => (
            <div
              key={i}
              className="card-panel p-4 flex flex-col items-center gap-1 border-gold/50 bg-gradient-to-b from-[#0c1a30]/95 to-[#07101c]"
            >
              {isHost ? (
                <input
                  className="bg-transparent text-center font-display text-gold text-lg font-bold border-b border-gold/30 focus:outline-none focus:border-gold w-full max-w-[160px]"
                  value={team.name}
                  onChange={(e) => renameTeam(i, e.target.value)}
                />
              ) : (
                <div className="font-display text-gold text-lg font-bold">{team.name}</div>
              )}
              <div className="text-4xl md:text-5xl font-display font-black text-white tabular-nums drop-shadow-[0_0_12px_rgba(223,179,66,0.35)]">
                {team.score}
              </div>
              {isHost && (
                <div className="flex gap-2 mt-1">
                  <button type="button" onClick={() => adjustScore(i, -100)} className="p-1.5 rounded-full border border-white/25 hover:border-accent-red hover:text-accent-red">
                    <Minus size={14} />
                  </button>
                  <button type="button" onClick={() => adjustScore(i, 100)} className="p-1.5 rounded-full border border-white/25 hover:border-accent-green hover:text-accent-green">
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {currentQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="card-panel max-w-2xl w-full p-6 md:p-10 relative border-2 border-gold/60 shadow-gold-lg bg-gradient-to-b from-[#0c1a30] to-[#050c18]">
            <button type="button" onClick={() => closeQuestion()} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={24} />
            </button>

            <div className="text-accent-cyan text-sm font-semibold uppercase tracking-[0.2em] mb-1">
              {currentQuestion.category}
            </div>
            <div className="font-display text-3xl text-gold mb-6 font-black">
              {currentQuestion.points} PUNKTI
            </div>

            <p className="text-xl md:text-2xl text-white leading-relaxed mb-8 font-semibold">
              {currentQuestion.q}
            </p>

            {isHost && (
              <>
                <button
                  type="button"
                  onClick={() => update({ showAnswer: !showAnswer })}
                  className="btn-outline text-sm mb-4 flex items-center gap-2"
                >
                  {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showAnswer ? 'Peida vastus' : 'Näita vastust'}
                </button>

                {showAnswer && (
                  <div className="bg-accent-green/15 border-2 border-accent-green/50 rounded-xl px-5 py-4 mb-6 text-lg text-accent-green font-bold">
                    Vastus: {currentQuestion.a}
                  </div>
                )}

                {showAnswer && (
                  <div className="flex flex-wrap gap-3 justify-center">
                    {teams.map((t, i) => (
                      <button key={i} type="button" onClick={() => closeQuestion(i)} className="btn-gold flex items-center gap-2">
                        <Trophy size={16} />
                        {t.name} (+{currentQuestion.points})
                      </button>
                    ))}
                    <button type="button" onClick={() => closeQuestion()} className="btn-outline">
                      Keegi ei tea
                    </button>
                  </div>
                )}
              </>
            )}

            {!isHost && showAnswer && (
              <div className="bg-accent-green/15 border-2 border-accent-green/50 rounded-xl px-5 py-4 text-lg text-accent-green font-bold text-center">
                Vastus: {currentQuestion.a}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
