import { confettiBurst } from '@/lib/confettiBurst'
import { useEffect, useRef, useState, useMemo } from 'react'
import type { KuldvillakState } from './types'
import {
  X,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Trophy,
  Volume2,
  VolumeX,
  Eye as EyeIcon,
  Sparkles,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Zap,
  Check,
  Star,
  Crown,
  Maximize2,
  Minimize2,
  HelpCircle,
} from 'lucide-react'
import { createBgm, sounds, playFx } from '@/lib/audio'
import GameShowFrame from '@/components/GameShowFrame'
import { trackQuestionResolved } from '@/lib/stats'
import TvJoinPanel from '@/components/TvJoinPanel'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import { appUrl } from '@/lib/config'
import BuzzQrOverlay from '@/components/BuzzQrOverlay'
import SmartBuzzerPanel from '@/components/SmartBuzzerPanel'
import HostSheet from '@/components/HostSheet'
import GameAiModal from '@/components/GameAiModal'
import { generateKuldvillakAi } from '@/lib/aiGameGenerators'
import BilingualText from '@/components/BilingualText'

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
  const {
    teams,
    disabledCards,
    currentQuestion,
    showAnswer,
    packData,
    confettiAt,
    hostPeek,
    buzzEnabled,
    showBuzzQr,
    buzz,
    finalPhase = 'none',
    finalWagers = [],
    timer,
    dailyDoubleTile,
    dailyDoubleWager,
    dailyDoubleTeam,
    dailyDoubleStep,
    floatingScore,
  } = state
  const { t } = useI18n()
  const categories = packData?.categories || []
  const maxRows = Math.max(...categories.map((c) => c.questions.length), 0)

  const [musicOn, setMusicOn] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [pulseTeam, setPulseTeam] = useState<number | null>(null)
  const [openingTile, setOpeningTile] = useState<string | null>(null)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [now, setNow] = useState<number>(Date.now())
  const [wagerInput, setWagerInput] = useState<number>(100)
  const [selectedWagerTeam, setSelectedWagerTeam] = useState<number>(0)
  const [autoTimerEnabled, setAutoTimerEnabled] = useState(false)

  const bgmRef = useRef<ReturnType<typeof createBgm> | null>(null)
  const lastConfetti = useRef<number>(0)
  const lastTickSec = useRef<number | null>(null)

  useEffect(() => {
    bgmRef.current = createBgm(sounds.kuldvillakBgm, 0.3)
    return () => bgmRef.current?.pause()
  }, [])

  // Live timer tick sync
  useEffect(() => {
    if (!timer?.running) return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [timer?.running])

  // Display (not host): react to confetti triggers from host
  useEffect(() => {
    if (isHost) return
    if (confettiAt && confettiAt !== lastConfetti.current) {
      lastConfetti.current = confettiAt
      confettiBurst({ particleCount: 120, spread: 70, y: 0.65 })
    }
  }, [confettiAt, isHost])

  // Calculate remaining timer seconds
  const remainingSec = useMemo(() => {
    if (!timer) return 0
    if (timer.running && timer.endsAt) {
      return Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
    }
    return timer.remaining ?? 0
  }, [timer, now])

  // Sound effects when timer is running and gets low
  useEffect(() => {
    if (!timer?.running || remainingSec === null) return
    if (remainingSec === 0 && lastTickSec.current !== 0) {
      lastTickSec.current = 0
      playFx('buzz')
      if (isHost) {
        update((prev) => ({
          ...prev,
          timer: prev.timer ? { ...prev.timer, running: false, remaining: 0, endsAt: null } : null,
        }))
      }
    } else if (remainingSec > 0 && remainingSec <= 5 && remainingSec !== lastTickSec.current) {
      lastTickSec.current = remainingSec
      playFx('tick')
    }
  }, [remainingSec, timer?.running, isHost, update])

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

  // Timer controls
  function startTimer(seconds = 25) {
    if (!isHost) return
    playFx('click')
    const endsAt = Date.now() + seconds * 1000
    update({
      timer: {
        endsAt,
        remaining: seconds,
        running: true,
        total: seconds,
      },
    })
  }

  function pauseTimer() {
    if (!isHost || !timer) return
    playFx('click')
    const rem = timer.endsAt ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000)) : timer.remaining
    update({
      timer: {
        ...timer,
        endsAt: null,
        remaining: rem,
        running: false,
      },
    })
  }

  function resumeTimer() {
    if (!isHost) return
    playFx('click')
    const rem = timer && timer.remaining > 0 ? timer.remaining : 25
    const endsAt = Date.now() + rem * 1000
    update({
      timer: {
        endsAt,
        remaining: rem,
        running: true,
        total: timer?.total || 25,
      },
    })
  }

  function resetTimer(seconds = 25) {
    if (!isHost) return
    playFx('click')
    update({
      timer: {
        endsAt: null,
        remaining: seconds,
        running: false,
        total: seconds,
      },
    })
  }

  function addTimerTime(deltaSec = 5) {
    if (!isHost || !timer) return
    playFx('click')
    if (timer.running && timer.endsAt) {
      update({
        timer: {
          ...timer,
          endsAt: timer.endsAt + deltaSec * 1000,
          total: Math.max(timer.total + deltaSec, 10),
        },
      })
    } else {
      update({
        timer: {
          ...timer,
          remaining: Math.max(0, (timer.remaining || 0) + deltaSec),
          total: Math.max(timer.total + deltaSec, 10),
        },
      })
    }
  }

  // Host Keyboard shortcuts
  useEffect(() => {
    if (!isHost) return
    const onKey = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

      if (e.key === 'Escape') {
        if (imageZoomed) setImageZoomed(false)
        else if (currentQuestion) dismissQuestion()
      }
      if (e.key.toLowerCase() === 'm') toggleMusic()
      if (e.key.toLowerCase() === 'r' && !currentQuestion) resetGame()
      if (currentQuestion && e.code === 'Space') {
        e.preventDefault()
        update({ showAnswer: !showAnswer })
        if (!showAnswer) playFx('reveal')
      }
      if (currentQuestion && e.key.toLowerCase() === 't') {
        if (timer?.running) pauseTimer()
        else resumeTimer()
      }
      // Quick team scoring with keys 1..9
      if (currentQuestion && !dailyDoubleStep) {
        const num = parseInt(e.key, 10)
        if (num >= 1 && num <= teams.length) {
          e.preventDefault()
          resolveQuestion(num - 1)
        } else if (e.key === '0') {
          e.preventDefault()
          resolveQuestion()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isHost, currentQuestion, showAnswer, timer, teams.length, imageZoomed, dailyDoubleStep])

  function openCard(col: number, row: number) {
    if (!isHost) return
    const cardId = `${col}-${row}`
    if (disabledCards.includes(cardId)) {
      if (confirm('Kas soovid selle kaardi tagasi lauale panna? (Undo)')) {
        update((prev) => ({
          ...prev,
          disabledCards: prev.disabledCards.filter((id) => id !== cardId),
        }))
      }
      return
    }

    // Immediate tactile feedback
    setOpeningTile(cardId)
    setTimeout(() => setOpeningTile(null), 300)

    const cat = categories[col]
    const q = cat.questions[row]
    const isDaily = dailyDoubleTile === cardId || q.isDailyDouble

    playFx(isDaily ? 'jingle' : 'reveal', { prefer: 'kuldvillak_open' })

    const initialTimer = autoTimerEnabled
      ? {
          endsAt: Date.now() + 25 * 1000,
          remaining: 25,
          running: true,
          total: 25,
        }
      : {
          endsAt: null,
          remaining: 25,
          running: false,
          total: 25,
        }

    update({
      currentQuestion: {
        col,
        row,
        category: cat.name,
        category_tr: cat.name_tr,
        q: q.q,
        q_tr: q.q_tr,
        a: q.a,
        a_tr: q.a_tr,
        points: q.points,
        hostNote: q.hostNote,
        imageUrl: q.imageUrl,
        isDailyDouble: isDaily,
      },
      showAnswer: false,
      buzz: null,
      timer: initialTimer,
      dailyDoubleStep: isDaily ? 'wager' : null,
      dailyDoubleWager: null,
      dailyDoubleTeam: 0,
    })

    if (isDaily) {
      setWagerInput(Math.max(100, Math.min(500, teams[0]?.score || 500)))
      setSelectedWagerTeam(0)
    }
  }

  /** Close modal only — card stays on the board (can reopen). */
  function dismissQuestion() {
    if (!currentQuestion) return
    playFx('click')
    update({
      currentQuestion: null,
      showAnswer: false,
      dailyDoubleStep: null,
      timer: null,
      buzz: null,
    })
  }

  /**
   * Finish this card: remove from board.
   * awardTo = team index → points + confetti; undefined → "nobody knows".
   */
  function resolveQuestion(awardTo?: number, customPoints?: number) {
    if (!currentQuestion) return
    trackQuestionResolved()
    const cardId = `${currentQuestion.col}-${currentQuestion.row}`
    const pointsToAward = customPoints !== undefined ? customPoints : currentQuestion.points

    if (awardTo !== undefined) {
      playFx('correct', { prefer: 'kuldvillak_correct' })
      setPulseTeam(awardTo)
      window.setTimeout(() => setPulseTeam(null), 700)
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
          i === awardTo ? { ...t, score: Math.max(0, t.score + pointsToAward) } : t
        )
        next.confettiAt = Date.now()
        next.floatingScore = {
          teamIdx: awardTo,
          delta: pointsToAward,
          id: Date.now(),
        }
      }
      next.currentQuestion = null
      next.showAnswer = false
      next.dailyDoubleStep = null
      next.timer = null
      next.buzz = null
      return next
    })

    // Clear floating score after 2 seconds
    setTimeout(() => {
      update((prev) => (prev.floatingScore ? { ...prev, floatingScore: null } : prev))
    }, 2000)
  }

  function adjustScore(teamIdx: number, delta: number) {
    if (!isHost) return
    playFx(delta > 0 ? 'correct' : 'wrong')
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === teamIdx ? { ...t, score: Math.max(0, t.score + delta) } : t
      ),
      floatingScore: {
        teamIdx,
        delta,
        id: Date.now(),
      },
    }))
    setTimeout(() => {
      update((prev) => (prev.floatingScore ? { ...prev, floatingScore: null } : prev))
    }, 1800)
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
    playFx('click')
    update((prev) => ({
      ...prev,
      disabledCards: [],
      currentQuestion: null,
      showAnswer: false,
      teams: prev.teams.map((t) => ({ ...t, score: 0 })),
      dailyDoubleStep: null,
      timer: null,
      buzz: null,
      floatingScore: null,
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
          gameActions={
            <>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 hover:text-gold"
                title="Ava küsimuste ja vastuste spikker"
              >
                <BookOpen size={14} className="text-gold" />
                <span>{t('hostSheet')}</span>
              </button>

              <button
                type="button"
                onClick={() => update({ hostPeek: !hostPeek })}
                className={`btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 transition ${
                  hostPeek ? 'bg-gold text-bg border-gold font-bold shadow-md' : 'text-white/80 hover:text-white'
                }`}
                title="Kuva õiged vastused otse mängulaual"
              >
                {hostPeek ? <EyeOff size={14} /> : <EyeIcon size={14} />}
                <span>{hostPeek ? t('toolbarHideAnswers') : t('toolbarShowAnswers')}</span>
              </button>

              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 border-gold text-gold bg-gold/10 hover:bg-gold hover:text-black font-semibold transition"
                title="Loo või täienda küsimusi tehisintellektiga"
              >
                <Sparkles size={13} />
                <span>Loo AI-ga</span>
              </button>

              {packData?.finalJeopardy && finalPhase === 'none' && (
                <button
                  type="button"
                  className="btn-outline text-xs !py-1.5 !px-3 border-gold text-gold hover:bg-gold hover:text-bg font-bold"
                  onClick={() =>
                    update({
                      finalPhase: 'wager',
                      finalWagers: teams.map(() => 0),
                      currentQuestion: null,
                      showAnswer: false,
                    })
                  }
                >
                  🏆 {t('finalJeopardy')}
                </button>
              )}
            </>
          }
          teamsControl={{
            teams,
            onAddTeam: () =>
              update((prev) => ({
                ...prev,
                teams: [...prev.teams, { name: `Meeskond ${prev.teams.length + 1}`, score: 0 }],
              })),
            onRemoveTeam: () =>
              update((prev) => ({
                ...prev,
                teams: prev.teams.length > 1 ? prev.teams.slice(0, -1) : prev.teams,
              })),
            onAdjustScore: (idx, delta) => adjustScore(idx, delta),
            onRenameTeam: (idx, name) => renameTeam(idx, name),
          }}
          buzzerControl={{
            sessionCode,
            buzzEnabled,
            onToggleBuzz: () => update({ buzzEnabled: !buzzEnabled, buzz: null }),
            showBuzzQr,
            onToggleBuzzQr: () => update({ showBuzzQr: !showBuzzQr }),
            connection,
            lastSync,
            onRetry,
            buzz,
            onClearBuzz: () => update({ buzz: null }),
            customBuzzerContent: <SmartBuzzerPanel state={state} update={update} />,
          }}
          audioControl={{
            musicOn,
            onToggleMusic: toggleMusic,
            musicLabel: t('toolbarMusic'),
          }}
        />
      )}

      {showBuzzQr && sessionCode && buzzEnabled && (
        <BuzzQrOverlay code={sessionCode} compact />
      )}

      <div id="game-scale-root">
        <div className="flex flex-col items-center justify-center mb-5">
          <div className="flex items-center gap-3">
            <span className="text-gold text-2xl animate-pulse">★</span>
            <h1 className="font-display text-center text-3xl md:text-5xl font-black kuldvillak-gold-text tracking-wider drop-shadow-[0_0_25px_rgba(223,179,66,0.6)]">
              KULDVILLAK
            </h1>
            <span className="text-gold text-2xl animate-pulse">★</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
            <span>{playedCards} / {totalCards} küsimust mängitud</span>
            {isHost && (
              <label className="flex items-center gap-1.5 cursor-pointer ml-2 text-white/70 hover:text-white">
                <input
                  type="checkbox"
                  checked={autoTimerEnabled}
                  onChange={(e) => setAutoTimerEnabled(e.target.checked)}
                  className="rounded border-white/30 text-gold focus:ring-gold"
                />
                <span>Automaatne 25s taimer</span>
              </label>
            )}
          </div>
        </div>

        {/* Board Grid */}
        <div
          className="grid gap-2.5 md:gap-3 mb-8"
          style={{ gridTemplateColumns: `repeat(${Math.max(categories.length, 1)}, minmax(0, 1fr))` }}
        >
          {categories.map((cat, col) => (
            <div
              key={col}
              className="relative overflow-hidden bg-gradient-to-b from-[#1c3c78] via-[#10274f] to-[#091730] border-2 border-gold/80 rounded-xl py-3 px-2 text-center font-display text-gold text-xs sm:text-sm md:text-base font-black shadow-lg min-h-[58px] flex items-center justify-center leading-tight transition-all duration-300 hover:border-gold"
            >
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
              <BilingualText text={cat.name} translation={cat.name_tr} layout="board" primaryClassName="text-gold drop-shadow" />
            </div>
          ))}

          {Array.from({ length: maxRows }).map((_, row) =>
            categories.map((cat, col) => {
              const q = cat.questions[row]
              if (!q) return <div key={`${col}-${row}`} />
              const cardId = `${col}-${row}`
              const disabled = disabledCards.includes(cardId)
              const isOpening = openingTile === cardId
              const isDaily = dailyDoubleTile === cardId || q.isDailyDouble

              return (
                <button
                  key={cardId}
                  disabled={!isHost}
                  onClick={() => openCard(col, row)}
                  className={`
                    kuldvillak-tile min-h-[76px] sm:min-h-[88px] md:min-h-[104px] rounded-xl font-display font-black
                    border-2 relative overflow-hidden flex items-center justify-center
                    ${
                      disabled
                        ? 'bg-[#040813]/90 border-white/10 cursor-default opacity-50 shadow-inner'
                        : `bg-gradient-to-br from-[#163867] via-[#0d2342] to-[#071324] border-gold/75 text-gold shadow-md hover:border-gold hover:shadow-[0_0_24px_rgba(223,179,66,0.35)] cursor-pointer ${
                            isOpening ? 'kuldvillak-tile-opening ring-4 ring-gold' : ''
                          }`
                    }
                  `}
                >
                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  
                  {/* Subtle Daily Double indicator for host peek */}
                  {showPeek && isDaily && !disabled && (
                    <span className="absolute top-1 right-1.5 text-[9px] font-sans font-bold bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/40">
                      ★ 2X
                    </span>
                  )}

                  <span
                    className={`kuldvillak-gold-text text-2xl sm:text-3xl md:text-4xl font-black ${
                      disabled && !showPeek ? 'opacity-0' : ''
                    }`}
                  >
                    {disabled && !showPeek ? '' : q.points}
                  </span>

                  {showPeek && (
                    <span className="absolute inset-x-1 bottom-1 text-[0.55rem] md:text-[0.65rem] leading-tight text-accent-green font-sans font-bold opacity-95 line-clamp-2 px-1">
                      <BilingualText text={q.a} translation={q.a_tr} layout="inline" />
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Podium Scoreboard */}
        <div className={`grid ${teamCols} gap-4 mb-4 justify-items-stretch`}>
          {teams.map((team, i) => {
            const isLeading = leader && leader.score > 0 && leader.score === team.score
            const isFloating = floatingScore && floatingScore.teamIdx === i

            return (
              <div
                key={i}
                className={`relative card-panel p-4 flex flex-col items-center gap-1 border-2 transition-all duration-300 bg-gradient-to-b from-[#0e2140]/95 to-[#07101c] shadow-lg ${
                  isLeading ? 'border-gold shadow-[0_0_25px_rgba(223,179,66,0.25)]' : 'border-gold/40'
                }`}
              >
                {/* Floating score notification */}
                {isFloating && (
                  <div
                    key={floatingScore.id}
                    className="floating-score-badge absolute -top-10 z-30 font-display font-black text-3xl md:text-4xl text-gold drop-shadow-[0_0_15px_rgba(223,179,66,0.9)]"
                  >
                    {floatingScore.delta > 0 ? `+${floatingScore.delta}` : floatingScore.delta}
                  </div>
                )}

                {/* Crown for leader */}
                {isLeading && (
                  <div className="absolute -top-3.5 right-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-bounce">
                    <Crown size={12} className="fill-black" />
                    <span>LIIDER</span>
                  </div>
                )}

                {isHost ? (
                  <input
                    className="bg-transparent text-center font-display text-gold text-lg font-bold border-b border-gold/30 focus:outline-none focus:border-gold w-full max-w-[170px]"
                    value={team.name}
                    onChange={(e) => renameTeam(i, e.target.value)}
                  />
                ) : (
                  <div className="font-display text-gold text-lg font-bold">{team.name}</div>
                )}

                <div
                  className={`text-4xl md:text-5xl font-display font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(223,179,66,0.4)] ${
                    pulseTeam === i ? 'score-pulse' : ''
                  }`}
                >
                  {team.score}
                </div>

                {isHost && (
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => adjustScore(i, -100)}
                      className="p-1.5 rounded-full border border-white/25 hover:border-accent-red hover:text-accent-red transition active:scale-90"
                      title="-100"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustScore(i, 100)}
                      className="p-1.5 rounded-full border border-white/25 hover:border-accent-green hover:text-accent-green transition active:scale-90"
                      title="+100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
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
            <div className="mb-6 text-center">
              <BilingualText
                text={fj.q}
                translation={fj.q_tr}
                layout="block"
                primaryClassName="text-xl md:text-3xl text-white font-semibold leading-relaxed"
                translationClassName="text-base md:text-xl text-accent-cyan/90 font-medium"
              />
            </div>
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
              <div className="bg-accent-green/15 border border-accent-green/40 rounded-xl px-4 py-3 mb-6">
                <BilingualText
                  text={fj.a}
                  translation={fj.a_tr}
                  layout="answer"
                  primaryClassName="text-lg text-accent-green font-bold text-center"
                />
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
              <div className="bg-accent-green/15 border border-accent-green/40 rounded-xl px-4 py-3">
                <BilingualText
                  text={fj.a}
                  translation={fj.a_tr}
                  layout="answer"
                  primaryClassName="text-lg text-accent-green font-bold text-center"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-1000">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Simple CSS-based confetti effect for outro without external libs */}
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i}
                className="absolute w-3 h-8 rounded-full"
                style={{
                  top: `${Math.random() * -20}%`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#dfb342', '#10b981', '#3b82f6', '#f43f5e', '#a855f7'][Math.floor(Math.random() * 5)],
                  animation: `fall ${Math.random() * 3 + 2}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                  opacity: Math.random() * 0.5 + 0.5,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            ))}
            <style dangerouslySetInnerHTML={{ __html: "@keyframes fall { 0% { transform: translateY(-100px) rotate(0deg); } 100% { transform: translateY(120vh) rotate(360deg); } }" }} />
          </div>
          <div className="winner-stage text-center max-w-2xl w-full relative z-10 p-12 rounded-3xl bg-gradient-to-b from-blue-950/80 to-[#030917]/90 border border-gold/30 shadow-[0_0_80px_rgba(223,179,66,0.2)]">
            <div className="text-gold/80 text-lg uppercase tracking-[.45em] font-bold mb-4 animate-in slide-in-from-bottom-4 duration-700">{t('gameOver')}</div>
            <div className="text-7xl md:text-9xl mb-8 animate-bounce delay-300 drop-shadow-[0_0_30px_rgba(223,179,66,0.6)]">🏆</div>
            <h2 className="font-display text-6xl md:text-8xl font-black text-white mb-4 drop-shadow-xl animate-in zoom-in duration-500 delay-500">
              {leader?.name || t('winner')}
            </h2>
            <p className="text-gold/80 text-xl md:text-2xl mb-10 font-bold uppercase tracking-widest animate-in fade-in duration-700 delay-700">
              {t('winningScore')} <strong className="text-gold text-3xl">{leader?.score ?? 0}</strong> {t('points')}
            </p>
            {isHost && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in duration-1000 delay-1000">
                <button type="button" onClick={resetGame} className="btn-gold text-lg px-8 py-3 rounded-full shadow-[0_0_20px_rgba(223,179,66,0.4)]">
                  {t('playAgain')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg overflow-y-auto"
          onClick={() => isHost && dismissQuestion()}
          role="presentation"
        >
          {/* Studio atmosphere lighting */}
          <div className="kuldvillak-spotlight" />
          <div className="kuldvillak-beam" />

          {/* DAILY DOUBLE WAGER PHASE */}
          {dailyDoubleStep === 'wager' ? (
            <div
              className="daily-double-banner card-panel max-w-xl w-full p-6 sm:p-10 relative border-2 border-gold shadow-[0_0_50px_rgba(223,179,66,0.4)] bg-gradient-to-b from-[#13274c] via-[#0b172d] to-[#050b16] rounded-3xl text-center"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => dismissQuestion()}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition"
              >
                <X size={24} />
              </button>

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-bold uppercase tracking-widest mb-3">
                <Sparkles size={14} className="text-gold" />
                <span>Eriline küsimus</span>
              </div>

              <h2 className="font-display text-3xl sm:text-5xl font-black kuldvillak-gold-text mb-3 tracking-wide drop-shadow-[0_0_25px_rgba(223,179,66,0.6)]">
                KULDVILLAKU DUUBEL!
              </h2>

              <p className="text-white/80 text-sm sm:text-base max-w-md mx-auto mb-6">
                Ainult valitud meeskond saab vastata! Vali tiim ja määra panus enne küsimuse avanemist.
              </p>

              {isHost ? (
                <div className="space-y-5 text-left">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gold font-bold mb-2">
                      1. Vali panustav meeskond:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {teams.map((tm, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedWagerTeam(idx)
                            const maxW = Math.max(tm.score, 500)
                            setWagerInput((prev) => Math.min(prev, maxW))
                          }}
                          className={`p-2.5 rounded-xl border text-sm font-bold text-center transition ${
                            selectedWagerTeam === idx
                              ? 'bg-gold text-black border-gold shadow-md font-black'
                              : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                          }`}
                        >
                          <div>{tm.name}</div>
                          <div className="text-xs opacity-75">{tm.score} p</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs uppercase tracking-wider text-gold font-bold">
                        2. Määra panus (punktid):
                      </label>
                      <span className="text-xs text-white/50">
                        Max: {Math.max(teams[selectedWagerTeam]?.score || 0, 500)} p
                      </span>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        min={100}
                        max={Math.max(teams[selectedWagerTeam]?.score || 0, 500)}
                        step={50}
                        value={wagerInput}
                        onChange={(e) => setWagerInput(Number(e.target.value) || 0)}
                        className="input-field text-xl font-bold font-display text-center text-gold w-full"
                      />
                    </div>

                    {/* Quick wager buttons */}
                    <div className="flex flex-wrap gap-2">
                      {[100, 200, 300, 500].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWagerInput(preset)}
                          className="btn-outline text-xs !py-1 !px-2.5"
                        >
                          {preset}p
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setWagerInput(Math.max(teams[selectedWagerTeam]?.score || 0, 500))}
                        className="btn-outline text-xs !py-1 !px-2.5 text-gold border-gold font-bold"
                      >
                        Kõik mängu ({Math.max(teams[selectedWagerTeam]?.score || 0, 500)}p)
                      </button>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        const validatedWager = Math.max(100, wagerInput)
                        playFx('reveal')
                        update((prev) => ({
                          ...prev,
                          dailyDoubleStep: null,
                          dailyDoubleWager: validatedWager,
                          dailyDoubleTeam: selectedWagerTeam,
                          currentQuestion: prev.currentQuestion
                            ? { ...prev.currentQuestion, points: validatedWager }
                            : null,
                          timer: autoTimerEnabled
                            ? { endsAt: Date.now() + 30 * 1000, remaining: 30, running: true, total: 30 }
                            : { endsAt: null, remaining: 30, running: false, total: 30 },
                        }))
                      }}
                      className="btn-gold w-full text-base sm:text-lg font-black py-3 rounded-xl shadow-[0_0_20px_rgba(223,179,66,0.4)] flex items-center justify-center gap-2"
                    >
                      <Sparkles size={18} />
                      <span>Kinnita panus ja ava küsimus ({wagerInput}p)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <div className="text-gold text-2xl font-bold font-display animate-pulse mb-2">
                    Mängijad teevad panust...
                  </div>
                  <p className="text-white/60 text-sm">
                    Küsimus avaneb peagi suurel ekraanil!
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* STANDARD QUESTION MODAL */
            <div
              className="kuldvillak-card-modal card-panel max-w-3xl w-full p-5 sm:p-8 md:p-10 relative border-2 border-gold/70 shadow-[0_0_60px_rgba(223,179,66,0.3)] bg-gradient-to-b from-[#0e2242] via-[#08152b] to-[#040a16] rounded-3xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => dismissQuestion()}
                className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition z-20"
                title="Sulge küsimus (Esc)"
              >
                <X size={24} />
              </button>

              {/* Header Bar: Category & Points */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs sm:text-sm font-bold uppercase tracking-[0.15em]">
                  <BilingualText
                    text={currentQuestion.category}
                    translation={currentQuestion.category_tr}
                    layout="inline"
                  />
                </div>

                <div className="font-display text-2xl sm:text-3xl kuldvillak-gold-text font-black tracking-wide flex items-center gap-2">
                  {currentQuestion.isDailyDouble && (
                    <span className="text-amber-400 text-sm font-sans font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                      ★ DUUBEL
                    </span>
                  )}
                  <span>{currentQuestion.points} PUNKTI</span>
                </div>
              </div>

              {/* Synchronized Question Timer Bar */}
              {(timer?.running || (timer?.remaining !== undefined && timer.remaining > 0)) && (
                <div className="mb-5 bg-black/40 border border-white/15 rounded-2xl p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className={remainingSec <= 5 ? 'text-red-400 animate-spin' : 'text-accent-cyan'} />
                      <span className="text-white/70 font-semibold uppercase tracking-wider">Mõtlemisaeg:</span>
                      <span
                        className={`font-mono text-base sm:text-lg font-bold ${
                          remainingSec <= 5
                            ? 'text-red-400 kuldvillak-timer-urgent font-black'
                            : remainingSec <= 10
                            ? 'text-amber-300'
                            : 'text-white'
                        }`}
                      >
                        {remainingSec}s
                      </span>
                    </div>

                    {isHost && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => (timer?.running ? pauseTimer() : resumeTimer())}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition"
                        >
                          {timer?.running ? <Pause size={12} /> : <Play size={12} />}
                          <span>{timer?.running ? 'Paus' : 'Käivita'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addTimerTime(5)}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                          title="+5 sekundit"
                        >
                          +5s
                        </button>
                        <button
                          type="button"
                          onClick={() => resetTimer(25)}
                          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
                          title="Lähtesta (25s)"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 rounded-full ${
                        remainingSec <= 5
                          ? 'bg-gradient-to-r from-rose-500 to-red-600 kuldvillak-timer-urgent'
                          : remainingSec <= 10
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                          : 'bg-gradient-to-r from-accent-cyan via-emerald-400 to-accent-green'
                      }`}
                      style={{
                        width: `${Math.min(100, (remainingSec / (timer?.total || 25)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Host timer trigger if timer is off */}
              {isHost && (!timer || (!timer.running && (timer.remaining === undefined || timer.remaining === 0))) && (
                <div className="mb-4 flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => startTimer(25)}
                    className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1.5 text-accent-cyan border-accent-cyan/40 hover:bg-accent-cyan/10"
                  >
                    <Clock size={13} />
                    <span>Käivita 25s taimer</span>
                  </button>
                </div>
              )}

              {/* Smart Buzzer TV Alert Banner */}
              {buzz && (
                <div className="kuldvillak-buzz-banner rounded-2xl p-3 sm:p-4 mb-5 border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/20 via-red-500/20 to-amber-500/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-400 text-black flex items-center justify-center font-black animate-ping">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-amber-300 font-bold">
                        Nupu vajutus!
                      </div>
                      <div className="text-xl sm:text-2xl font-display font-black text-white">
                        {buzz.name}
                      </div>
                    </div>
                  </div>

                  {isHost && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => update({ buzz: null })}
                        className="btn-outline text-xs !py-1.5 !px-3 text-white/80"
                      >
                        Puhasta nupp
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Image with zoom lightbox */}
              {currentQuestion.imageUrl && (
                <div className="mb-6 flex flex-col items-center">
                  <div className="relative group cursor-pointer" onClick={() => setImageZoomed(!imageZoomed)}>
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Küsimuse pilt"
                      className="max-h-[32vh] md:max-h-[42vh] max-w-full object-contain rounded-2xl border-2 border-white/20 shadow-2xl shadow-black/60 bg-black/40 transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute bottom-3 right-3 bg-black/75 hover:bg-black text-white p-2 rounded-xl border border-white/25 shadow-lg flex items-center gap-1.5 text-xs font-semibold backdrop-blur-sm">
                      {imageZoomed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      <span>{imageZoomed ? 'Vähenda' : 'Suurenda'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div className="mb-6 text-center">
                <BilingualText
                  text={currentQuestion.q}
                  translation={currentQuestion.q_tr}
                  layout="block"
                  primaryClassName="text-2xl sm:text-3xl md:text-4xl text-white leading-relaxed font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
                  translationClassName="text-lg sm:text-xl md:text-2xl text-accent-cyan/95 font-medium mt-2"
                />
              </div>

              {/* Host Notes */}
              {isHost && currentQuestion.hostNote && (
                <div className="mb-5 text-sm text-amber-200/95 bg-amber-500/15 border border-amber-500/35 rounded-2xl px-4 py-3">
                  <span className="font-bold uppercase tracking-wider text-xs text-amber-400">Juhi märge · </span>
                  {currentQuestion.hostNote}
                </div>
              )}

              {/* Host Controls Section */}
              {isHost && (
                <div className="space-y-4 pt-2">
                  {/* Host Answer Display */}
                  <div className="bg-accent-green/15 border-2 border-accent-green/50 rounded-2xl px-5 py-3 text-accent-green">
                    <div className="text-[10px] uppercase tracking-wider text-accent-green/80 font-sans font-bold mb-1">
                      {t('hostAnswerOnly')}
                    </div>
                    <BilingualText
                      text={currentQuestion.a}
                      translation={currentQuestion.a_tr}
                      layout="answer"
                      primaryClassName="text-xl text-accent-green font-black"
                    />
                  </div>

                  {/* Toggle TV Reveal */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        playFx(showAnswer ? 'click' : 'reveal')
                        update({ showAnswer: !showAnswer })
                      }}
                      className={`btn-outline text-sm sm:text-base py-2 px-5 flex items-center gap-2 rounded-xl transition ${
                        showAnswer
                          ? 'bg-accent-green/20 border-accent-green text-accent-green font-bold shadow-md'
                          : 'hover:border-gold hover:text-gold'
                      }`}
                    >
                      {showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
                      <span>{showAnswer ? t('hideAnswerTv') : t('showAnswerTv')}</span>
                      <span className="text-xs opacity-60 ml-1 font-mono">[Tühik]</span>
                    </button>
                  </div>

                  {/* Award points to teams */}
                  <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                    {teams.map((tm, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => resolveQuestion(i)}
                        className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition"
                      >
                        <Trophy size={16} />
                        <span>{tm.name}</span>
                        <span className="font-mono font-bold bg-black/20 px-1.5 py-0.5 rounded text-xs">
                          +{currentQuestion.points}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono">[{i + 1}]</span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => resolveQuestion()}
                      className="btn-outline flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white/80 hover:text-white"
                      title="Keegi ei teadnud (0)"
                    >
                      <span>{t('nobodyKnows')}</span>
                      <span className="text-[10px] opacity-60 font-mono">[0]</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => dismissQuestion()}
                      className="btn-outline text-white/50 hover:text-white/80 px-3 py-2.5 rounded-xl text-xs"
                      title="Jäta kaart lauale (Esc)"
                    >
                      {t('closeKeepCard')}
                    </button>
                  </div>
                </div>
              )}

              {/* TV Audience Answer Reveal (Non-Host or on TV) */}
              {!isHost && showAnswer && (
                <div className="kuldvillak-answer-reveal bg-gradient-to-r from-accent-green/20 via-emerald-500/25 to-accent-green/20 border-2 border-accent-green rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(16,185,129,0.35)] mt-4 text-center">
                  <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-accent-green font-sans font-bold mb-2 bg-accent-green/20 px-3 py-1 rounded-full border border-accent-green/40">
                    <Check size={14} />
                    <span>Õige vastus</span>
                  </div>
                  <BilingualText
                    text={currentQuestion.a}
                    translation={currentQuestion.a_tr}
                    layout="answer"
                    primaryClassName="text-2xl sm:text-3xl md:text-4xl text-white font-black text-center drop-shadow"
                    translationClassName="text-lg sm:text-xl text-accent-green/90 font-semibold text-center mt-1"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox Expanded Overlay */}
      {imageZoomed && currentQuestion?.imageUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          onClick={() => setImageZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setImageZoomed(false)}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X size={28} />
          </button>
          <img
            src={currentQuestion.imageUrl}
            alt="Suurendatud küsimuse pilt"
            className="max-h-[85vh] max-w-[92vw] object-contain rounded-2xl border-2 border-gold/60 shadow-[0_0_50px_rgba(223,179,66,0.3)]"
          />
          <div className="text-white/60 text-xs mt-3 flex items-center gap-2">
            <span>Klõpsa pildile või vajuta Esc sulgemiseks</span>
          </div>
        </div>
      )}
    </div>
      {isHost && sheetOpen && packData && (
        <HostSheet packData={packData} onClose={() => setSheetOpen(false)} />
      )}

      {/* AI GENERATION MODAL */}
      <GameAiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Genereeri Kuldvillaku mäng AI-ga"
        subtitle="Sisesta teema ja AI loob täieliku 5x5 küsimuste maatriksi koos finaalküsimusega"
        presetTopics={['Eesti ajalugu & geograafia', 'Filmid ja telesarjad', '90ndate popmuusika', 'Teadus ja loodus', 'Õlle- ja toidukultuur']}
        defaultTopic="Eesti ajalugu, popkultuur ja meelelahutus"
        promptTemplate='Loo telesaate "Kuldvillak" stiilis 5 kategooriat (igas 5 küsimust 100-500p) + finaalküsimus teemal: "{TOPIC}". Vasta puhta JSON objektina.'
        generateFn={generateKuldvillakAi}
        onApply={(data) => {
          update({
            packData: {
              categories: data.categories,
              finalJeopardy: data.finalJeopardy,
            },
            disabledCards: [],
            currentQuestion: null,
            showAnswer: false,
            finalPhase: 'none',
            finalWagers: teams.map(() => 0),
          })
        }}
        renderPreview={(data) => (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {data.categories?.map((cat: any, cIdx: number) => (
                <div key={cIdx} className="p-3 rounded-xl bg-slate-900/80 border border-gold/30">
                  <h4 className="font-display font-bold text-xs text-gold truncate mb-2">
                    {cat.name}
                  </h4>
                  <div className="space-y-1">
                    {cat.questions?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="text-[11px] text-white/80 flex items-start gap-1.5">
                        <span className="font-mono font-bold text-amber-400 shrink-0">{q.points}p:</span>
                        <span className="truncate" title={`${q.q} -> Vastus: ${q.a}`}>
                          {q.q}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {data.finalJeopardy && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/40">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Final Jeopardy küsimus:
                </span>
                <p className="text-xs text-white font-medium">{data.finalJeopardy.q}</p>
                <p className="text-xs text-emerald-400 font-bold mt-0.5">Vastus: {data.finalJeopardy.a}</p>
              </div>
            )}
          </div>
        )}
      />
    </GameShowFrame>
  )
}
