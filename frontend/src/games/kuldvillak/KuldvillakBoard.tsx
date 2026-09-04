import { confettiBurst } from '@/lib/confettiBurst'
import { useEffect, useRef, useState } from 'react'
import type { KuldvillakState } from './types'
import { X, Eye, EyeOff, Plus, Minus, Trophy, Volume2, VolumeX, Eye as EyeIcon } from 'lucide-react'
import { createBgm, sounds, playFx } from '@/lib/audio'
import GameShowFrame from '@/components/GameShowFrame'
import { trackQuestionResolved } from '@/lib/stats'
import TvJoinPanel from '@/components/TvJoinPanel'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import { appUrl } from '@/lib/config'
import BuzzQrOverlay from '@/components/BuzzQrOverlay'
import HostSheet from '@/components/HostSheet'

type Props = {
  state: KuldvillakState
  update: (partial: Partial<KuldvillakState> | ((p: KuldvillakState) => KuldvillakState)) => void
  isHost?: boolean
  sessionCode?: string
  connection?: ConnectionStatus
  onRetry?: () => void
  lastSync?: number
}

export default function KuldvillakBoard({ state, update, isHost = true, sessionCode, connection = 'offline', lastSync = 0, onRetry }: Props) {
  const { teams, disabledCards, currentQuestion, showAnswer, packData, confettiAt, hostPeek, buzzEnabled, showBuzzQr, buzz, finalPhase = 'none', finalWagers = [] } = state
  const { t } = useI18n()
  const categories = packData?.categories || []
  const maxRows = Math.max(...categories.map((c) => c.questions.length), 0)

  const [musicOn, setMusicOn] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pulseTeam, setPulseTeam] = useState<number | null>(null)
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
      confettiBurst({ particleCount: 120, spread: 70, y: 0.65 })
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

  useEffect(() => {
    if (!isHost) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentQuestion) dismissQuestion()
      if (e.key.toLowerCase() === 'm') toggleMusic()
      if (e.key.toLowerCase() === 'r') resetGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isHost, currentQuestion])

  function openCard(col: number, row: number) {
    if (!isHost) return
    const cardId = `${col}-${row}`
    if (disabledCards.includes(cardId)) return
    const cat = categories[col]
    const q = cat.questions[row]
    playFx('reveal', { prefer: 'kuldvillak_open' })
    update({
      currentQuestion: {
        col,
        row,
        category: cat.name,
        q: q.q,
        a: q.a,
        points: q.points,
        hostNote: q.hostNote,
      },
      showAnswer: false,
      buzz: null,
    })
  }

  /** Close modal only — card stays on the board (can reopen). */
  function dismissQuestion() {
    if (!currentQuestion) return
    update({ currentQuestion: null, showAnswer: false })
  }

  /**
   * Finish this card: remove from board.
   * awardTo = team index → points + confetti; undefined → "nobody knows".
   */
  function resolveQuestion(awardTo?: number) {
    if (!currentQuestion) return
    trackQuestionResolved()
    const cardId = `${currentQuestion.col}-${currentQuestion.row}`
    if (awardTo !== undefined) {
      playFx('correct', { prefer: 'kuldvillak_correct' })
      setPulseTeam(awardTo)
      window.setTimeout(() => setPulseTeam(null), 650)
    } else {
      playFx('wrong', { prefer: 'kuldvillak_wrong' })
    }
    update((prev) => {
      const next: KuldvillakState = { ...prev }
      if (!prev.disabledCards.includes(cardId)) {
        next.disabledCards = [...prev.disabledCards, cardId]
      }
      if (awardTo !== undefined) {
        next.teams = prev.teams.map((t, i) =>
          i === awardTo ? { ...t, score: t.score + currentQuestion.points } : t
        )
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
  const totalCards = categories.reduce((n, c) => n + c.questions.length, 0)
  const playedCards = disabledCards.length
  const fj = packData?.finalJeopardy
  const boardClear = totalCards > 0 && playedCards >= totalCards && !currentQuestion
  const finished = boardClear && (!fj || finalPhase === 'done')
  const showFinalPrompt = boardClear && fj && finalPhase === 'none' && isHost
  const leader = [...teams].sort((a,b) => b.score-a.score)[0]

  return (
    <GameShowFrame display={!isHost} title={t('game_kuldvillak').toUpperCase()} hasSessionBg={!!(state as any).bgMedia?.dataUrl}>
    <div className="w-full max-w-6xl mx-auto px-2 py-2">
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
                {musicOn ? t('toolbarMusicOn') : t('toolbarMusic')}
              </button>
              <button
                type="button"
                onClick={() => update({ hostPeek: !hostPeek })}
                className={`btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 ${
                  hostPeek ? 'bg-gold text-bg border-gold' : ''
                }`}
              >
                <EyeIcon size={14} />
                {hostPeek ? t('toolbarHideAnswers') : t('toolbarShowAnswers')}
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="btn-outline text-xs !py-1.5 !px-3"
              >
                {t('hostSheet')}
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
                {t('toolbarAddTeam')}
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
                {t('toolbarRemoveTeam')}
              </button>
              <button
                type="button"
                className={`btn-outline text-xs !py-1.5 !px-3 ${buzzEnabled ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan' : ''}`}
                onClick={() => update({ buzzEnabled: !buzzEnabled, buzz: null })}
              >
                {buzzEnabled ? t('buzzOn') : t('buzzOff')}
              </button>
              <button
                type="button"
                className={`btn-outline text-xs !py-1.5 !px-3 ${showBuzzQr ? 'bg-gold/20 border-gold text-gold' : ''}`}
                onClick={() => update({ showBuzzQr: !showBuzzQr })}
                disabled={!buzzEnabled}
              >
                {showBuzzQr ? t('buzzQrOn') : t('buzzQrOff')}
              </button>
              {packData?.finalJeopardy && finalPhase === 'none' && (
                <button
                  type="button"
                  className="btn-outline text-xs !py-1.5 !px-3 border-gold text-gold"
                  onClick={() =>
                    update({
                      finalPhase: 'wager',
                      finalWagers: teams.map(() => 0),
                      currentQuestion: null,
                      showAnswer: false,
                    })
                  }
                >
                  {t('finalJeopardy')}
                </button>
              )}
            </>
          }
        />
      )}

      {isHost && <TvJoinPanel code={sessionCode} connection={connection} lastSync={lastSync} onRetry={onRetry} />}
      {isHost && sessionCode && (
        <p className="text-center text-white/45 text-xs mb-3">
          {t('buzzLink')}:{' '}
          <a className="text-accent-cyan underline" href={appUrl(`/buzzer/${sessionCode}`)} target="_blank" rel="noreferrer">
            {appUrl(`/buzzer/${sessionCode}`)}
          </a>
        </p>
      )}
      {showBuzzQr && sessionCode && buzzEnabled && (
        <BuzzQrOverlay code={sessionCode} compact />
      )}
      {buzz && (
        <div className="mb-4 text-center animate-pulse">
          <div className="inline-block bg-accent-cyan/20 border-2 border-accent-cyan text-accent-cyan font-display font-black text-2xl md:text-4xl px-6 py-3 rounded-2xl">
            🔔 {buzz.name}
          </div>
          {isHost && (
            <div className="mt-2">
              <button type="button" className="btn-outline text-xs" onClick={() => update({ buzz: null })}>
                {t('buzzClear')}
              </button>
            </div>
          )}
        </div>
      )}

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
              className="bg-gradient-to-b from-[#1e3a8a] to-[#0a192f] border-2 border-gold rounded-xl py-3 px-1 text-center font-display text-gold text-sm md:text-base font-black shadow-lg min-h-[52px] flex items-center justify-center leading-tight opacity-100"
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
                    game-card min-h-[72px] md:min-h-[96px] rounded-xl font-display font-black
                    transition-all duration-200 border-2 relative overflow-hidden
                    ${
                      disabled
                        ? 'bg-[#050a12]/90 border-white/10 cursor-default'
                        : 'bg-gradient-to-br from-[#123056] to-[#0a1628] border-gold/80 text-gold shadow-md hover:bg-gold hover:text-bg hover:scale-[1.04] hover:shadow-gold cursor-pointer'
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
              <div className={`text-4xl md:text-5xl font-display font-black text-white tabular-nums drop-shadow-[0_0_12px_rgba(223,179,66,0.35)] ${pulseTeam === i ? 'score-pulse' : ''}`}>
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

      {showFinalPrompt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md">
          <div className="card-panel max-w-md w-full p-8 text-center border-gold/50">
            <p className="font-display text-2xl text-gold mb-4">{t('boardClear')}</p>
            <p className="text-white/60 text-sm mb-6">{t('finalPrompt')}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                className="btn-gold"
                onClick={() =>
                  update({
                    finalPhase: 'wager',
                    finalWagers: teams.map(() => 0),
                  })
                }
              >
                {t('finalJeopardy')}
              </button>
              <button type="button" className="btn-outline" onClick={() => update({ finalPhase: 'done' })}>
                {t('skipFinal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {finalPhase === 'wager' && fj && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="card-panel max-w-lg w-full p-6 border-gold/50" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl text-gold text-center mb-2">{t('finalJeopardy')}</h2>
            <p className="text-white/50 text-sm text-center mb-6">{t('finalWagerHint')}</p>
            {isHost ? (
              <div className="space-y-3 mb-6">
                {teams.map((tm, i) => (
                  <div key={i} className="flex items-center gap-3 justify-between">
                    <span className="text-gold font-bold">{tm.name}</span>
                    <span className="text-white/40 text-xs">max {tm.score}</span>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(tm.score, 0)}
                      className="input-field w-28 text-center"
                      value={finalWagers[i] ?? 0}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(tm.score, Number(e.target.value) || 0))
                        const next = teams.map((_, j) => (j === i ? v : finalWagers[j] ?? 0))
                        update({ finalWagers: next })
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-gold w-full mt-4"
                  onClick={() => update({ finalPhase: 'question', showAnswer: false })}
                >
                  {t('finalShowQ')}
                </button>
              </div>
            ) : (
              <p className="text-center text-white/70 text-lg py-8">{t('finalWagerWait')}</p>
            )}
          </div>
        </div>
      )}

      {(finalPhase === 'question' || finalPhase === 'reveal') && fj && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="card-panel max-w-2xl w-full p-8 border-2 border-gold/60">
            <div className="text-gold text-xs uppercase tracking-[0.3em] font-bold mb-3 text-center">
              {t('finalJeopardy')}
            </div>
            <p className="text-xl md:text-3xl text-white font-semibold text-center leading-relaxed mb-6">
              {fj.q}
            </p>
            {isHost && fj.hostNote && (
              <div className="mb-4 text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                <span className="font-bold text-xs text-amber-400/80 uppercase">Host · </span>
                {fj.hostNote}
              </div>
            )}
            {isHost && finalPhase === 'question' && (
              <button type="button" className="btn-outline mx-auto block mb-4" onClick={() => update({ finalPhase: 'reveal' })}>
                {t('showAnswer')}
              </button>
            )}
            {(finalPhase === 'reveal' || (!isHost && false)) && isHost && (
              <div className="bg-accent-green/15 border border-accent-green/40 rounded-xl px-4 py-3 mb-6 text-accent-green font-bold text-center">
                {fj.a}
              </div>
            )}
            {isHost && finalPhase === 'reveal' && (
              <div className="space-y-3">
                {teams.map((tm, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 border border-white/10 rounded-xl px-3 py-2">
                    <span className="text-gold font-bold">{tm.name}</span>
                    <span className="text-white/50 text-sm">±{finalWagers[i] ?? 0}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-gold text-xs !py-1"
                        onClick={() => {
                          const w = finalWagers[i] ?? 0
                          update((prev) => ({
                            ...prev,
                            teams: prev.teams.map((x, j) =>
                              j === i ? { ...x, score: x.score + w } : x
                            ),
                            confettiAt: Date.now(),
                          }))
                        }}
                      >
                        ✓ +
                      </button>
                      <button
                        type="button"
                        className="btn-outline text-xs !py-1 border-accent-red text-accent-red"
                        onClick={() => {
                          const w = finalWagers[i] ?? 0
                          update((prev) => ({
                            ...prev,
                            teams: prev.teams.map((x, j) =>
                              j === i ? { ...x, score: Math.max(0, x.score - w) } : x
                            ),
                          }))
                        }}
                      >
                        ✗ −
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-gold w-full mt-2" onClick={() => update({ finalPhase: 'done' })}>
                  {t('finalFinish')}
                </button>
              </div>
            )}
            {!isHost && finalPhase === 'question' && (
              <p className="text-center text-white/50">{t('finalThink')}</p>
            )}
            {!isHost && finalPhase === 'reveal' && (
              <div className="bg-accent-green/15 border border-accent-green/40 rounded-xl px-4 py-3 text-accent-green font-bold text-center">
                {fj.a}
              </div>
            )}
          </div>
        </div>
      )}

      {finished && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg">
          <div className="winner-stage text-center max-w-xl w-full">
            <div className="text-gold text-sm uppercase tracking-[.35em] font-bold mb-4">{t('gameOver')}</div>
            <div className="text-6xl mb-5">🏆</div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-gold mb-3">{leader?.name || t('winner')}</h2>
            <p className="text-white/65 text-lg mb-7">{t('winningScore')} <strong className="text-white">{leader?.score ?? 0}</strong> {t('points')}</p>
            {isHost && <button type="button" onClick={resetGame} className="btn-gold">{t('playAgain')}</button>}
          </div>
        </div>
      )}

      {currentQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => isHost && dismissQuestion()}
          role="presentation"
        >
          <div
            className="question-reveal card-panel max-w-2xl w-full p-6 md:p-10 relative border-2 border-gold/60 shadow-gold-lg bg-gradient-to-b from-[#0c1a30] to-[#050c18]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button type="button" onClick={() => dismissQuestion()} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={24} />
            </button>

            <div className="text-accent-cyan text-sm font-semibold uppercase tracking-[0.2em] mb-1">
              {currentQuestion.category}
            </div>
            <div className="font-display text-3xl text-gold mb-6 font-black">
              {currentQuestion.points} PUNKTI
            </div>

            <p className="text-xl md:text-2xl text-white leading-relaxed mb-6 font-semibold">
              {currentQuestion.q}
            </p>

            {isHost && currentQuestion.hostNote && (
              <div className="mb-6 text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                <span className="font-bold uppercase tracking-wider text-xs text-amber-400/80">Host · </span>
                {currentQuestion.hostNote}
              </div>
            )}

            {isHost && (
              <>
                {/* Host always sees the answer; TV only after reveal */}
                <div className="bg-accent-green/15 border-2 border-accent-green/50 rounded-xl px-5 py-4 mb-4 text-lg text-accent-green font-bold">
                  <div className="text-[10px] uppercase tracking-wider text-accent-green/70 font-sans font-bold mb-1">
                    {t('hostAnswerOnly')}
                  </div>
                  {currentQuestion.a}
                </div>

                <button
                  type="button"
                  onClick={() => update({ showAnswer: !showAnswer })}
                  className="btn-outline text-sm mb-4 flex items-center gap-2"
                >
                  {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showAnswer ? t('hideAnswerTv') : t('showAnswerTv')}
                </button>

                <div className="flex flex-wrap gap-3 justify-center">
                  {teams.map((tm, i) => (
                    <button key={i} type="button" onClick={() => resolveQuestion(i)} className="btn-gold flex items-center gap-2">
                      <Trophy size={16} />
                      {tm.name} (+{currentQuestion.points})
                    </button>
                  ))}
                  <button type="button" onClick={() => resolveQuestion()} className="btn-outline">
                    {t('nobodyKnows')}
                  </button>
                  <button type="button" onClick={() => dismissQuestion()} className="btn-outline text-white/60">
                    {t('closeKeepCard')}
                  </button>
                </div>
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
      {isHost && sheetOpen && packData && (
        <HostSheet packData={packData} onClose={() => setSheetOpen(false)} />
      )}
    </GameShowFrame>
  )
}
