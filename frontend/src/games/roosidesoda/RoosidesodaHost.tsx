import { confettiBurst } from '@/lib/confettiBurst'
import { useEffect, useRef, useState } from 'react'
import type { RoosidesodaState } from './types'
import {
  Plus,
  Minus,
  SkipForward,
  Banknote,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Zap,
  Flame,
  Check,
  X,
  RotateCcw,
  Sliders,
  HelpCircle,
  Tv,
} from 'lucide-react'
import { playSound, sounds, createBgm, playFx } from '@/lib/audio'
import TvJoinPanel from '@/components/TvJoinPanel'
import GameToolbar from '@/components/GameToolbar'
import GameShowFrame from '@/components/GameShowFrame'
import RoosidesodaFastMoney from './RoosidesodaFastMoney'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import { useI18n } from '@/i18n/I18nContext'
import GameAiModal from '@/components/GameAiModal'
import { generateRoosidesodaAi } from '@/lib/aiGameGenerators'
import { getGameSettings, getFontCssFamily } from '@/lib/gameSettings'

type Props = {
  state: RoosidesodaState
  update: (partial: Partial<RoosidesodaState> | ((p: RoosidesodaState) => RoosidesodaState)) => void
  isHost?: boolean
  sessionCode?: string
  connection?: ConnectionStatus
  onRetry?: () => void
  lastSync?: number
}

export default function RoosidesodaHost({
  state,
  update,
  isHost = true,
  sessionCode,
  connection = 'offline',
  lastSync = 0,
  onRetry,
}: Props) {
  const {
    teams,
    currentRoundIdx,
    revealed,
    strikes,
    bank,
    activeTeam,
    packData,
    showStrikeOverlay,
    confettiAt,
  } = state

  const { t } = useI18n()
  const rounds = packData?.rounds || []
  const round = rounds[currentRoundIdx]
  const finished = currentRoundIdx >= rounds.length && rounds.length > 0

  const roundPhase = state.roundPhase || 'main'
  const stealTeam = state.stealTeam ?? (activeTeam === 0 ? 1 : 0)
  const turnTimer = state.turnTimer || null

  const [musicOn, setMusicOn] = useState(false)
  const [sfxOn, setSfxOn] = useState(true)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [pulseTeam, setPulseTeam] = useState<number | null>(null)
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null)
  const lastConfetti = useRef(0)
  const bgmRef = useRef<ReturnType<typeof createBgm> | null>(null)

  const currentSettings = (state as any).gameSettings || getGameSettings('roosidesoda')
  const activeFont = (state as any).displayFont || currentSettings.displayFont || 'cinzel'
  const activeFontFamily = getFontCssFamily(activeFont)

  useEffect(() => {
    if (isHost) return
    if (confettiAt && confettiAt !== lastConfetti.current) {
      lastConfetti.current = confettiAt
      confettiBurst({ particleCount: 150, spread: 80, y: 0.55 })
      try {
        playFx('victory')
      } catch {}
    }
  }, [confettiAt, isHost])

  useEffect(() => {
    bgmRef.current = createBgm(sounds.roosBgm, 0.28)
    return () => bgmRef.current?.pause()
  }, [])

  useEffect(() => {
    if (showStrikeOverlay) {
      const timer = setTimeout(() => update({ showStrikeOverlay: false }), 1500)
      return () => clearTimeout(timer)
    }
  }, [showStrikeOverlay])

  // Turn timer countdown ticker
  useEffect(() => {
    if (!turnTimer?.running || !turnTimer?.endsAt) {
      setTimerRemaining(null)
      return
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((turnTimer.endsAt - Date.now()) / 1000))
      setTimerRemaining(rem)
      if (rem <= 3 && rem > 0) {
        try { playFx('tick') } catch {}
      }
      if (rem <= 0) {
        try {
          playFx('buzz')
          playSound(sounds.roosError)
        } catch {}
        if (isHost) {
          update((prev) => ({
            ...prev,
            turnTimer: null,
          }))
        }
      }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [turnTimer?.running, turnTimer?.endsAt, isHost])

  function startTurnTimer(sec: number) {
    if (!isHost) return
    try { playFx('ding') } catch {}
    update({
      turnTimer: {
        running: true,
        seconds: sec,
        endsAt: Date.now() + sec * 1000,
      },
    })
  }

  function stopTurnTimer() {
    if (!isHost) return
    update({ turnTimer: null })
  }

  const [animatingBank, setAnimatingBank] = useState<{ amount: number; toTeam: number } | null>(null)

  // Sound sync effect on TV
  const lastSoundRef = useRef<number>(0)
  useEffect(() => {
    if (isHost || !state.soundEffectTrigger) return
    if (state.soundEffectTrigger.at !== lastSoundRef.current) {
      lastSoundRef.current = state.soundEffectTrigger.at
      const t = state.soundEffectTrigger.type
      if (t === 'buzz') {
        try {
          playSound(sounds.roosError)
          playFx('buzz')
        } catch {}
      } else {
        try {
          playFx(t as any)
        } catch {}
      }
    }
  }, [state.soundEffectTrigger, isHost])

  function triggerSoundFx(fx: 'applause' | 'drumroll' | 'ding' | 'buzz' | 'victory') {
    if (fx === 'buzz') {
      try {
        playSound(sounds.roosError)
        playFx('buzz')
      } catch {}
    } else {
      try {
        playFx(fx)
      } catch {}
    }
    update({ soundEffectTrigger: { type: fx, at: Date.now() } })
  }

  function revealRemaining() {
    if (!isHost || !round) return
    const unrevealed = round.answers
      .map((_, i) => i)
      .filter((i) => !revealed.includes(i))
    if (unrevealed.length === 0) return
    try {
      playFx('reveal')
      playSound(sounds.roosCorrect)
    } catch {}
    update((prev) => ({
      ...prev,
      revealedCuriosity: [
        ...(prev.revealedCuriosity || []),
        ...unrevealed.filter((i) => !(prev.revealedCuriosity || []).includes(i)),
      ],
    }))
  }

  function handleFaceoffBuzzer(teamIdx: number) {
    if (!isHost || roundPhase !== 'faceoff') return
    try {
      playFx('ding')
      playSound(sounds.roosCorrect)
    } catch {}
    update({
      faceoffWinner: teamIdx,
      faceoffBuzzerTeam: teamIdx,
      faceoffBuzzerName: teams[teamIdx]?.name,
    })
  }

  // Keyboard shortcuts for host
  useEffect(() => {
    if (!isHost) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const k = e.key.toLowerCase()
      if (k === 'm') toggleMusic()
      if (k === 'r') resetGame()
      if (k === 'b') awardBank()
      if (k === 'o') revealRemaining()
      if (k === 'a') triggerSoundFx('applause')
      if (k === 'd' && !e.ctrlKey && !e.metaKey) triggerSoundFx('drumroll')
      if (k === 'z' && roundPhase === 'faceoff') handleFaceoffBuzzer(0)
      if (k === 'x' && roundPhase === 'faceoff') handleFaceoffBuzzer(1)
      if (k === 's') {
        if (roundPhase === 'steal') resolveSteal(true)
        else switchTeam()
      }
      if (k === 't') {
        if (e.shiftKey) startTurnTimer(10)
        else startTurnTimer(5)
      }
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        if (e.shiftKey) removeStrike()
        else addStrike()
      }
      // Keys 1..8 for revealing answers
      const num = parseInt(e.key, 10)
      if (!isNaN(num) && num >= 1 && num <= (round?.answers.length || 0)) {
        e.preventDefault()
        reveal(num - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isHost, musicOn, strikes, bank, currentRoundIdx, roundPhase, activeTeam, stealTeam, round, revealed])

  function sfx(src: string) {
    if (sfxOn) playSound(src, 0.85)
  }

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

  function reveal(idx: number) {
    if (!isHost || !round) return
    const pts = round.answers[idx].points * round.multiplier
    
    if (revealed.includes(idx)) {
      // Undo reveal
      update((prev) => ({
        ...prev,
        revealed: prev.revealed.filter((i) => i !== idx),
        bank: Math.max(0, prev.bank - pts),
      }))
    } else {
      sfx(sounds.roosCorrect)
      try {
        playFx('correct')
        if (idx === 0) setTimeout(() => playFx('ding'), 220)
      } catch {}
      update((prev) => ({
        ...prev,
        revealed: [...prev.revealed, idx],
        bank: prev.bank + pts,
        lastBankAdded: { amount: pts, at: Date.now() },
      }))
    }
  }

  function addStrike() {
    if (!isHost) return
    const next = strikes + 1
    sfx(sounds.roosError)
    try {
      playFx('wrong')
    } catch {}

    // When 3 strikes happen in main phase, transition to Steal phase!
    if (next >= 3 && roundPhase === 'main') {
      const otherTeam = activeTeam === 0 ? 1 : 0
      update({
        strikes: 3,
        showStrikeOverlay: true,
        roundPhase: 'steal',
        stealTeam: otherTeam,
      })
    } else {
      update({ strikes: next, showStrikeOverlay: true })
    }
  }

  function removeStrike() {
    if (!isHost || strikes <= 0) return
    update({ strikes: strikes - 1 })
  }

  function resolveSteal(success: boolean) {
    if (!isHost) return
    const winningTeamIdx = success ? stealTeam : activeTeam
    setPulseTeam(winningTeamIdx)
    setTimeout(() => setPulseTeam(null), 1000)

    if (success) {
      try { playFx('victory') } catch {}
      confettiBurst({ particleCount: 160, spread: 80, y: 0.55 })
    } else {
      try {
        playFx('buzz')
        playSound(sounds.roosError)
      } catch {}
    }

    update((prev) => {
      const awardTo = success
        ? (prev.stealTeam ?? (prev.activeTeam === 0 ? 1 : 0))
        : prev.activeTeam
      return {
        ...prev,
        teams: prev.teams.map((tm, i) =>
          i === awardTo ? { ...tm, score: tm.score + prev.bank } : tm
        ),
        bank: 0,
        strikes: 0,
        roundPhase: 'main',
        confettiAt: success ? Date.now() : prev.confettiAt,
      }
    })
  }

  function cancelSteal() {
    if (!isHost) return
    update({ roundPhase: 'main', strikes: 2 })
  }

  function startFaceoff() {
    if (!isHost) return
    update({
      roundPhase: 'faceoff',
      faceoffWinner: null,
      strikes: 0,
    })
  }

  function setFaceoffWinner(teamIdx: number) {
    if (!isHost) return
    try { playFx('ding') } catch {}
    update({ faceoffWinner: teamIdx })
  }

  function chooseFaceoffAction(play: boolean) {
    if (!isHost) return
    const winner = state.faceoffWinner ?? activeTeam
    const chosenActive = play ? winner : (winner === 0 ? 1 : 0)
    try { playFx('reveal') } catch {}
    update({
      roundPhase: 'main',
      activeTeam: chosenActive,
      strikes: 0,
    })
  }

  function awardBank() {
    if (!isHost || bank === 0) return
    const targetTeam = activeTeam
    setPulseTeam(targetTeam)
    setAnimatingBank({ amount: bank, toTeam: targetTeam })
    try {
      playFx('deal_coins')
    } catch {}

    setTimeout(() => {
      try {
        playFx('victory')
      } catch {}
      setPulseTeam(null)
      setAnimatingBank(null)
      update((prev) => ({
        ...prev,
        teams: prev.teams.map((tm, i) =>
          i === targetTeam ? { ...tm, score: tm.score + prev.bank } : tm
        ),
        bank: 0,
        strikes: 0,
        roundPhase: 'main',
        revealedCuriosity: [],
        lastBankAdded: null,
        confettiAt: Date.now(),
      }))
    }, 700)
  }

  function nextRound() {
    if (!isHost || currentRoundIdx >= rounds.length - 1) return
    update({
      currentRoundIdx: currentRoundIdx + 1,
      revealed: [],
      revealedCuriosity: [],
      lastBankAdded: null,
      strikes: 0,
      bank: 0,
      roundPhase: 'main',
    })
  }

  function prevRound() {
    if (!isHost || currentRoundIdx <= 0) return
    update({
      currentRoundIdx: currentRoundIdx - 1,
      revealed: [],
      revealedCuriosity: [],
      lastBankAdded: null,
      strikes: 0,
      bank: 0,
      roundPhase: 'main',
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
      teams: prev.teams.map((tm, i) =>
        i === teamIdx ? { ...tm, score: Math.max(0, tm.score + delta) } : tm
      ),
    }))
  }

  function renameTeam(idx: number, name: string) {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((tm, i) => (i === idx ? { ...tm, name } : tm)),
    }))
  }

  function resetGame() {
    if (!isHost) return
    if (!confirm(t('toolbarReset') + '?')) return
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((tm) => ({ ...tm, score: 0 })),
      currentRoundIdx: 0,
      revealed: [],
      strikes: 0,
      bank: 0,
      activeTeam: 0,
      roundPhase: 'main',
      showStrikeOverlay: false,
    }))
  }

  const leader =
    teams.length > 0
      ? teams.reduce((a, b) => (a.score >= b.score ? a : b))
      : null

  if (state.finalPhase && state.finalPhase !== 'none') {
    return (
      <GameShowFrame display={!isHost} title={t('game_roosidesoda').toUpperCase()} hasSessionBg={!!(state as any).bgMedia?.dataUrl}>
        <div
          data-display-font={activeFont}
          style={{ '--font-display': activeFontFamily } as React.CSSProperties}
          className="w-full h-full"
        >
          <RoosidesodaFastMoney state={state} update={update} isHost={isHost} />
        </div>
      </GameShowFrame>
    )
  }

  return (
    <GameShowFrame display={!isHost} title={t('game_roosidesoda').toUpperCase()} hasSessionBg={!!(state as any).bgMedia?.dataUrl}>
      {isHost && (
        <GameToolbar
          onReset={resetGame}
          gameActions={
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 border-gold text-gold bg-gold/10 hover:bg-gold hover:text-black font-semibold transition"
                title="Loo või täienda küsimusi tehisintellektiga"
              >
                <Sparkles size={13} />
                <span>Loo AI-ga</span>
              </button>
            </div>
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
          }}
          buzzerControl={{
            sessionCode,
            connection,
            lastSync,
            onRetry,
          }}
          audioControl={{
            musicOn,
            onToggleMusic: toggleMusic,
            sfxOn,
            onToggleSfx: () => setSfxOn((v) => !v),
            musicLabel: t('toolbarBgm'),
          }}
        />
      )}

      <div
        id="game-scale-root"
        data-display-font={activeFont}
        style={{ '--font-display': activeFontFamily } as React.CSSProperties}
        className={`relative transition-all duration-200 ${
          showStrikeOverlay ? 'animate-[shake_0.4s_ease-in-out]' : ''
        }`}
      >
        <h1 className="font-display text-center text-3xl md:text-5xl font-black text-gold mb-2 tracking-wide drop-shadow-[0_0_24px_rgba(223,179,66,0.35)]">
          🌹 {t('game_roosidesoda').toUpperCase()} 🌹
        </h1>

        {!round ? (
          <div className="text-center py-16 space-y-4">
            <p className="font-display text-3xl text-gold">{t('gameComplete')}</p>
            {leader && (
              <p className="text-xl text-white">
                {t('winner')}: <span className="text-gold font-black">{leader.name}</span> ({leader.score})
              </p>
            )}
            {isHost && (
              <button type="button" onClick={resetGame} className="btn-gold">
                {t('playAgain')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* STUDIO MARQUEE LED LIGHTS */}
            <div className="flex justify-between items-center px-4 py-1.5 max-w-3xl mx-auto mb-3 opacity-80">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i % 2 === 0
                      ? 'bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-pulse'
                      : 'bg-amber-500 shadow-[0_0_5px_#d97706]'
                  }`}
                  style={{ animationDelay: `${(i * 120) % 1200}ms` }}
                />
              ))}
            </div>

            {/* Round Title & Multiplier */}
            <div className="text-center mb-5">
              <div className="font-display text-xl md:text-2xl text-gold/90 font-bold flex items-center justify-center gap-2 flex-wrap">
                <span>{round.title}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40 text-xs font-mono font-bold tracking-wider">
                  {round.multiplier}× punktid
                </span>
                {round.multiplier >= 3 && (
                  <span className="px-2 py-0.5 rounded bg-accent-red/20 text-accent-red border border-accent-red/40 text-[10px] uppercase font-bold tracking-widest animate-pulse">
                    Kolmekordne
                  </span>
                )}
                {state.suddenDeath && (
                  <span className="px-2.5 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/50 text-[10px] uppercase font-bold tracking-widest animate-bounce">
                    ☠️ Äkksurm
                  </span>
                )}
              </div>

              {/* Question Text or Host Oral Prompt */}
              {!isHost && state.hideQuestionFromTv ? (
                <div className="py-4 px-6 rounded-2xl bg-black/40 border border-gold/30 max-w-xl mx-auto mt-2 animate-pulse">
                  <p className="text-gold font-display text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                    <span>❓ Saatejuht esitab küsimuse suuliselt...</span>
                  </p>
                </div>
              ) : (
                <p className="text-white text-lg md:text-2xl mt-2 max-w-2xl mx-auto font-semibold leading-snug animate-[fadeIn_0.35s_ease]">
                  {round.question}
                </p>
              )}

              <p className="text-white/40 text-xs mt-2 font-mono">
                Voor {currentRoundIdx + 1} / {rounds.length}
              </p>
            </div>

            {/* HOST SOUNDBOARD BAR */}
            {isHost && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-2xl bg-black/40 border border-white/10 mb-5 max-w-2xl mx-auto shadow-inner">
                <span className="text-[10px] uppercase font-bold text-gold/60 px-2 tracking-wider">
                  Helipult:
                </span>
                <button
                  type="button"
                  onClick={() => triggerSoundFx('applause')}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 hover:border-gold hover:text-gold"
                  title="Publiku ovatsioon (Kiirklahv: A)"
                >
                  <span>👏</span>
                  <span>Aplaus</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerSoundFx('drumroll')}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 hover:border-gold hover:text-gold"
                  title="Pinge enne avamist (Kiirklahv: D)"
                >
                  <span>🥁</span>
                  <span>Põrin</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerSoundFx('ding')}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 hover:border-accent-cyan hover:text-accent-cyan"
                  title="Kell"
                >
                  <span>🔔</span>
                  <span>Kell</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerSoundFx('buzz')}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 border-accent-red/40 text-accent-red hover:bg-accent-red/10"
                  title="Vale vastuse signaal"
                >
                  <span>✕</span>
                  <span>Buzzer</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerSoundFx('victory')}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 border-gold/40 text-gold hover:bg-gold/10"
                  title="Võidufanfaar"
                >
                  <span>🎺</span>
                  <span>Fanfaar</span>
                </button>
              </div>
            )}

            {/* FACE-OFF BANNER */}
            {roundPhase === 'faceoff' && (
              <div className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-blue-950/90 border-2 border-gold/50 shadow-[0_0_30px_rgba(223,179,66,0.25)] text-center animate-in zoom-in-95 duration-200">
                <div className="inline-flex items-center gap-2 text-gold font-display font-black text-xs uppercase tracking-widest mb-1 px-3 py-1 rounded-full bg-gold/15 border border-gold/30">
                  <Flame size={14} className="text-amber-400" />
                  <span>VOORU ALGUDELL (FACE-OFF)</span>
                </div>
                <h3 className="text-xl md:text-2xl font-display font-black text-white mt-1">
                  Mõlema meeskonna esindajad laua juurde!
                </h3>
                <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xl mx-auto">
                  Kiirem nupuvajutaja või kõrgema vastuse pakkuja otsustab: kas meeskond mängib ise või annab mängukorra vastastele.
                </p>

                {state.faceoffBuzzerTeam !== null && state.faceoffBuzzerTeam !== undefined && (
                  <div className="my-3 py-2 px-4 rounded-xl bg-gold/20 border border-gold text-gold font-display font-black text-base md:text-lg animate-bounce max-w-md mx-auto">
                    ⚡ {teams[state.faceoffBuzzerTeam]?.name} vajutas esimesena!
                  </div>
                )}

                {isHost && (
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                    <div className="text-xs font-bold text-gold uppercase tracking-wider">
                      {state.faceoffWinner !== null && state.faceoffWinner !== undefined
                        ? `Valitud duelli võitja: ${teams[state.faceoffWinner]?.name}`
                        : 'Vali duelli võitnud meeskond (või vajuta Z / X):'}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {teams.map((tm, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFaceoffWinner(idx)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                            state.faceoffWinner === idx
                              ? 'bg-gold text-black border-gold shadow-md'
                              : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          }`}
                        >
                          {tm.name} võitis duelli ({idx === 0 ? 'Klahv Z' : 'Klahv X'})
                        </button>
                      ))}
                    </div>

                    {state.faceoffWinner !== null && state.faceoffWinner !== undefined && (
                      <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => chooseFaceoffAction(true)}
                          className="btn-gold text-xs !py-2 !px-4 flex items-center gap-1.5 font-bold"
                        >
                          <Check size={14} />
                          <span>Mängime ise ({teams[state.faceoffWinner]?.name})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => chooseFaceoffAction(false)}
                          className="btn-outline text-xs !py-2 !px-4 flex items-center gap-1.5 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 font-bold"
                        >
                          <SkipForward size={14} />
                          <span>Anname vastastele ({teams[state.faceoffWinner === 0 ? 1 : 0]?.name})</span>
                        </button>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => update({ roundPhase: 'main' })}
                        className="text-[11px] text-white/40 hover:text-white underline"
                      >
                        Jäta duell vahele ja alusta vooru otse
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEAL PHASE BANNER */}
            {roundPhase === 'steal' && (
              <div className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-red-950/90 via-amber-950/80 to-red-950/90 border-2 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.4)] text-center animate-in zoom-in-95 duration-200">
                <div className="inline-flex items-center gap-2 text-amber-300 font-display font-black text-sm uppercase tracking-widest mb-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40">
                  <Zap size={15} className="animate-bounce" />
                  <span>VARASTAMISE VÕIMALUS</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-black text-white mt-1">
                  Meeskond <span className="text-amber-300 underline underline-offset-4">{teams[stealTeam]?.name}</span> võib panga ({bank}p) varastada!
                </h3>
                <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xl mx-auto">
                  Esialgne tiim sai 3 viga. Vastased saavad nüüd ühe võimaluse pakkuda avamata vastuse ja võita kogu vooru pank!
                </p>

                {isHost && (
                  <div className="flex flex-wrap justify-center gap-3 mt-4 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => resolveSteal(true)}
                      className="btn-gold !bg-emerald-500 hover:!bg-emerald-400 !text-black font-black text-xs sm:text-sm !py-2.5 !px-5 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <Check size={16} />
                      <span>✓ Vargus õnnestus! (Pank {bank}p tiimile {teams[stealTeam]?.name})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveSteal(false)}
                      className="btn-outline border-accent-red/80 text-accent-red hover:bg-accent-red hover:text-white font-bold text-xs sm:text-sm !py-2.5 !px-4 flex items-center gap-1.5"
                    >
                      <X size={16} />
                      <span>✕ Vargus ebaõnnestus! (Pank {bank}p tiimile {teams[activeTeam]?.name})</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelSteal}
                      className="btn-outline text-xs !py-1 !px-2.5 text-white/50 border-white/20"
                    >
                      Tühista vargus
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TURN TIMER BAR */}
            {turnTimer?.running && (
              <div className="max-w-md mx-auto mb-6 p-3 rounded-2xl bg-black/60 border border-gold/40 shadow-xl space-y-2 text-center animate-in fade-in">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-gold font-bold flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Vastamisaeg:</span>
                  </span>
                  <span className={`font-mono font-black text-lg ${timerRemaining !== null && timerRemaining <= 3 ? 'text-accent-red animate-pulse' : 'text-gold'}`}>
                    {timerRemaining !== null ? `${timerRemaining}s` : `${turnTimer.seconds}s`}
                  </span>
                  {isHost && (
                    <button
                      type="button"
                      onClick={stopTurnTimer}
                      className="text-white/40 hover:text-white text-xs underline"
                    >
                      Peata
                    </button>
                  )}
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      timerRemaining !== null && timerRemaining <= 3
                        ? 'bg-accent-red animate-pulse'
                        : 'bg-gradient-to-r from-gold to-amber-500'
                    }`}
                    style={{
                      width: timerRemaining !== null
                        ? `${(timerRemaining / turnTimer.seconds) * 100}%`
                        : '100%',
                    }}
                  />
                </div>
              </div>
            )}

            {/* BANK DISPLAY WITH FLOATING POINTS */}
            <div className="flex justify-center mb-6 relative">
              {state.lastBankAdded && Date.now() - state.lastBankAdded.at < 2200 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-emerald-400 text-black font-black font-mono text-sm shadow-lg shadow-emerald-400/40 animate-bounce">
                  +{state.lastBankAdded.amount}p
                </div>
              )}
              <div className={`px-10 py-4 text-center rounded-2xl border-2 border-dashed border-gold/60 bg-gold/10 shadow-[0_0_30px_rgba(223,179,66,0.15)] transition-all ${
                animatingBank ? 'scale-95 opacity-50' : ''
              }`}>
                <div className="text-gold/70 text-xs uppercase tracking-widest mb-0.5">{t('bank')}</div>
                <div className="font-display text-5xl md:text-6xl font-black text-gold tabular-nums">
                  {animatingBank ? 0 : bank}
                </div>
              </div>
            </div>

            {/* 3D FLIP ANSWERS BOARD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7 max-w-3xl mx-auto">
              {round.answers.map((ans, idx) => {
                const isRevealed = revealed.includes(idx)
                const isCuriosity = !isRevealed && (state.revealedCuriosity || []).includes(idx)
                const isTopAnswer = idx === 0

                return (
                  <div
                    key={idx}
                    className="relative group min-h-[72px] [perspective:1000px]"
                  >
                    <button
                      type="button"
                      disabled={!isHost}
                      onClick={() => reveal(idx)}
                      className={`w-full h-full flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 text-left transition-all duration-300 shadow-lg ${
                        isRevealed
                          ? 'bg-gradient-to-r from-emerald-900/90 via-emerald-800/80 to-blue-900/90 border-emerald-400/80 shadow-emerald-950/50 scale-[1.01]'
                          : isCuriosity
                          ? 'bg-gradient-to-r from-purple-950/80 to-slate-900/80 border-purple-400/50 opacity-90'
                          : 'bg-gradient-to-br from-[#0a1426] via-[#10203e] to-[#0a1426] border-gold/40 hover:border-gold hover:shadow-[0_0_20px_rgba(223,179,66,0.3)] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {isRevealed ? (
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-display font-black text-lg md:text-2xl uppercase tracking-wider text-white drop-shadow-md truncate">
                              {ans.text}
                            </span>
                            {isTopAnswer && (
                              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-400 text-black uppercase tracking-wider shadow shrink-0">
                                ★ TOP 1
                              </span>
                            )}
                          </div>
                        ) : isCuriosity ? (
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-display font-bold text-base md:text-xl uppercase text-amber-200/90 italic truncate">
                              {ans.text}
                            </span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30 shrink-0">
                              laualt avatud
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-b from-amber-300 via-gold to-amber-600 text-bg font-display font-black text-xl shadow-md border border-white/20">
                              {idx + 1}
                            </span>
                            {isHost && (
                              <span className="text-xs text-white/35 font-medium truncate max-w-[180px] sm:max-w-xs group-hover:text-gold/70 transition">
                                {ans.text} ({ans.points}p)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isRevealed ? (
                          <div className="flex items-center gap-2">
                            {isHost && (
                              <span className="text-[10px] text-white/40 uppercase tracking-widest font-sans opacity-0 group-hover:opacity-100 transition-opacity">
                                (peida)
                              </span>
                            )}
                            <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-xl bg-black/60 border border-gold/50 font-display font-black text-gold text-2xl md:text-3xl tabular-nums shadow-inner">
                              {ans.points * round.multiplier}
                            </span>
                          </div>
                        ) : isCuriosity ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-black/40 border border-white/10 font-mono text-white/60 text-lg tabular-nums">
                            {ans.points * round.multiplier}
                          </span>
                        ) : (
                          <span className="text-white/10 font-display font-bold text-xl">--</span>
                        )}
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* STRIKES DISPLAY */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center text-3xl font-black transition-all ${
                    i < strikes
                      ? 'border-accent-red bg-accent-red/25 text-accent-red shadow-[0_0_24px_rgba(230,46,77,0.55)] scale-110'
                      : 'border-white/20 text-white/15'
                  }`}
                >
                  {i < strikes ? '✕' : ''}
                </div>
              ))}
            </div>

            {/* HOST CONTROLS BAR */}
            {isHost && (
              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap justify-center items-center gap-2">
                  {/* Strike controls */}
                  <div className="flex rounded-xl overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={addStrike}
                      className="bg-accent-red/10 border-2 border-accent-red/50 text-accent-red hover:bg-accent-red hover:text-white px-4 py-2 font-bold uppercase tracking-wider transition-colors"
                      title="Lisa viga (Kiirklahv: TÜHIK)"
                    >
                      {t('strike')} ✕
                    </button>
                    {strikes > 0 && (
                      <button
                        type="button"
                        onClick={removeStrike}
                        title="Eemalda strike (Shift+Tühik)"
                        className="bg-accent-red/10 border-2 border-l-0 border-accent-red/50 text-accent-red hover:bg-accent-red hover:text-white px-3 py-2 transition-colors font-bold"
                      >
                        -1
                      </button>
                    )}
                  </div>

                  {/* Turn timer quick buttons */}
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => startTurnTimer(5)}
                      className="btn-outline text-xs !py-1.5 !px-2.5 flex items-center gap-1 hover:border-gold hover:text-gold"
                      title="Käivita 5-sekundiline vastamisaeg (Kiirklahv: T)"
                    >
                      <Clock size={12} />
                      <span>5s kell</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startTurnTimer(10)}
                      className="btn-outline text-xs !py-1.5 !px-2.5 flex items-center gap-1 hover:border-gold hover:text-gold"
                      title="Käivita 10-sekundiline vastamisaeg (Shift+T)"
                    >
                      <Clock size={12} />
                      <span>10s kell</span>
                    </button>
                  </div>

                  {/* Bank & Steal controls */}
                  <button
                    type="button"
                    onClick={awardBank}
                    className="btn-gold flex items-center gap-2"
                    title="Anna pank aktiivsele tiimile (Kiirklahv: B)"
                  >
                    <Banknote size={16} /> {t('awardBank')} ({teams[activeTeam]?.name})
                  </button>

                  <button
                    type="button"
                    onClick={() => update({
                      roundPhase: roundPhase === 'steal' ? 'main' : 'steal',
                      stealTeam: activeTeam === 0 ? 1 : 0,
                    })}
                    className="btn-outline flex items-center gap-1.5 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                    title="Käivita varastamise võimalus vastastele"
                  >
                    <Zap size={14} />
                    <span>{roundPhase === 'steal' ? 'Lõpeta vargus' : 'Varastamine'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={startFaceoff}
                    className="btn-outline flex items-center gap-1 text-gold/80 hover:text-gold"
                    title="Alusta vooru algusduelli"
                  >
                    <Flame size={14} />
                    <span>Algusduell</span>
                  </button>

                  <button
                    type="button"
                    onClick={revealRemaining}
                    className="btn-outline flex items-center gap-1.5 border-purple-400/50 text-purple-200 hover:bg-purple-500/10 font-medium text-xs"
                    title="Ava kõik vastused mida tiimid ei arvanud ära (Kiirklahv: O)"
                  >
                    <span>👁️</span>
                    <span>Mis veel oli?</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => update({ hideQuestionFromTv: !state.hideQuestionFromTv })}
                    className={`btn-outline flex items-center gap-1 text-xs ${
                      state.hideQuestionFromTv ? 'border-amber-400 text-amber-300 bg-amber-500/10' : 'text-white/60'
                    }`}
                    title="Peida küsimus telerist kuni oled selle suuliselt ette lugenud"
                  >
                    <span>{state.hideQuestionFromTv ? '❓ Küsimus peidus' : '👁️ Küsimus näha'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => update({ suddenDeath: !state.suddenDeath })}
                    className={`btn-outline flex items-center gap-1 text-xs ${
                      state.suddenDeath ? 'border-accent-red text-accent-red bg-accent-red/15 font-bold' : 'text-white/60'
                    }`}
                    title="Lülita sisse äkksurm (viigi lahendamiseks)"
                  >
                    <span>☠️ Äkksurm</span>
                  </button>

                  <button type="button" onClick={switchTeam} className="btn-outline" title="Kiirklahv: S">
                    {t('switchTeam')}
                  </button>

                  <button type="button" onClick={prevRound} className="btn-outline text-sm">
                    ◄ {t('round')}
                  </button>
                  <button type="button" onClick={nextRound} className="btn-outline flex items-center gap-1">
                    {t('round')} ► <SkipForward size={14} />
                  </button>

                  {currentRoundIdx === rounds.length - 1 && packData.finalRound && (
                    <button 
                      type="button" 
                      onClick={() => update({ finalPhase: 'intro' })} 
                      className="btn-gold flex items-center gap-1.5 ml-2 shadow-gold font-bold"
                    >
                      <Sparkles size={14} />
                      <span>SUUR FINAAL</span>
                      <SkipForward size={14} />
                    </button>
                  )}
                </div>

                {/* Host Quick Shortcuts Legend */}
                <div className="text-[11px] text-white/40 flex items-center justify-center gap-3 flex-wrap">
                  <span>Kiirklahvid:</span>
                  <span className="font-mono text-white/60"><kbd className="bg-white/10 px-1 rounded">Tühik</kbd> = Strike</span>
                  <span className="font-mono text-white/60"><kbd className="bg-white/10 px-1 rounded">1..{round.answers.length}</kbd> = Ava</span>
                  <span className="font-mono text-white/60"><kbd className="bg-white/10 px-1 rounded">O</kbd> = Mis veel oli</span>
                  <span className="font-mono text-white/60"><kbd className="bg-white/10 px-1 rounded">B</kbd> = Pank</span>
                  <span className="font-mono text-white/60"><kbd className="bg-white/10 px-1 rounded">T</kbd> = 5s Kell</span>
                  <span className="font-mono text-white/60"><kbd className="bg-white/10 px-1 rounded">Z / X</kbd> = Duell</span>
                  <span className="font-mono text-white/60"><kbd className="bg-white/10 px-1 rounded">A</kbd> = Aplaus</span>
                  <span className="font-mono text-white/60"><kbd className="bg-white/10 px-1 rounded">M</kbd> = Muusika</span>
                </div>
              </div>
            )}

            {/* TEAMS SCOREBOARD */}
            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
              {teams.map((team, i) => (
                <div
                  key={i}
                  className={`card-panel p-4 text-center transition-all ${
                    i === activeTeam ? 'border-gold shadow-gold ring-1 ring-gold/40' : 'border-white/10 opacity-85'
                  } ${pulseTeam === i ? 'animate-pulse scale-105' : ''}`}
                >
                  {isHost ? (
                    <input
                      className="bg-transparent text-center font-display text-gold text-lg font-bold border-b border-gold/30 focus:outline-none w-full max-w-[150px] mx-auto"
                      value={team.name}
                      onChange={(e) => renameTeam(i, e.target.value)}
                    />
                  ) : (
                    <div className="font-display text-gold text-lg font-bold">{team.name}</div>
                  )}
                  <div className="text-4xl md:text-5xl font-display font-black mt-1 tabular-nums">
                    {team.score}
                  </div>
                  {isHost && (
                    <div className="flex justify-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => adjustScore(i, -10)}
                        className="p-1 rounded-full border border-white/20 hover:border-accent-red"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(i, 10)}
                        className="p-1 rounded-full border border-white/20 hover:border-accent-green"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                  {i === activeTeam && (
                    <div className="text-xs text-gold/70 mt-1 uppercase tracking-wider">{t('activeTeam')}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3D STRIKE OVERLAY */}
      {showStrikeOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs pointer-events-none animate-in zoom-in duration-150">
          <div className="flex items-center gap-4 text-accent-red text-8xl md:text-[11rem] font-black drop-shadow-[0_0_60px_rgba(230,46,77,1)]">
            {Array.from({ length: Math.min(strikes, 3) }).map((_, i) => (
              <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 100}ms` }}>
                ✕
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI GENERATION MODAL */}
      <GameAiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Genereeri Rooside Sõda AI-ga"
        subtitle="Sisesta teema ja AI loob 4 vooru küsitlustulemusi koos topelt- ja kolmekordsete punktidega"
        presetTopics={['Eesti argielu ja harjumused', 'Suhted ja kohtingud', 'Puhkus ja reisimine', 'Toidud ja jook', 'Töökoha huumor']}
        defaultTopic="Eesti argielu, suhted ja harjumused"
        promptTemplate='Loo telesaate "Rooside Sõda" (Family Feud) stiilis 4-vooruline mäng teemal: "{TOPIC}". Vasta puhta JSON objektina.'
        generateFn={generateRoosidesodaAi}
        onApply={(data) => {
          update({
            packData: { rounds: data.rounds, finalRound: data.finalRound },
            currentRoundIdx: 0,
            revealed: [],
            strikes: 0,
            bank: 0,
            activeTeam: 0,
            roundPhase: 'main',
            showStrikeOverlay: false,
          })
        }}
        renderPreview={(data) => (
          <div className="space-y-3">
            {data.rounds?.map((r: any, rIdx: number) => (
              <div key={rIdx} className="p-3.5 rounded-xl bg-slate-900/80 border border-gold/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-xs text-gold">
                    {r.title || `VOOR ${rIdx + 1}`} ({r.multiplier}× punktid)
                  </span>
                </div>
                <p className="text-xs text-white font-medium">{r.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {r.answers?.map((ans: any, aIdx: number) => (
                    <div
                      key={aIdx}
                      className="p-1.5 rounded-lg bg-slate-950/60 border border-white/5 text-[11px] flex items-center justify-between"
                    >
                      <span className="text-white/90">
                        {aIdx + 1}. {ans.text}
                      </span>
                      <span className="font-mono font-bold text-amber-400">{ans.points}p</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      />
    </GameShowFrame>
  )
}
