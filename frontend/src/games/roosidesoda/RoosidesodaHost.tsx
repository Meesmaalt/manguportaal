import confetti from 'canvas-confetti'
import { useEffect, useRef, useState } from 'react'
import type { RoosidesodaState } from './types'
import { Plus, Minus, SkipForward, Banknote, Volume2, VolumeX } from 'lucide-react'
import { playSound, sounds, createBgm } from '@/lib/audio'
import TvJoinPanel from '@/components/TvJoinPanel'
import GameToolbar from '@/components/GameToolbar'
import GameShowFrame from '@/components/GameShowFrame'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import { useI18n } from '@/i18n/I18nContext'
import { playFx } from '@/lib/audio'

type Props = {
  state: RoosidesodaState
  update: (partial: Partial<RoosidesodaState> | ((p: RoosidesodaState) => RoosidesodaState)) => void
  isHost?: boolean
  sessionCode?: string
  connection?: ConnectionStatus
  lastSync?: number
}

export default function RoosidesodaHost({
  state,
  update,
  isHost = true,
  sessionCode,
  connection = 'offline',
  lastSync = 0,
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

  const [musicOn, setMusicOn] = useState(false)
  const [sfxOn, setSfxOn] = useState(true)
  const [pulseTeam, setPulseTeam] = useState<number | null>(null)
  const lastConfetti = useRef(0)
  const bgmRef = useRef<ReturnType<typeof createBgm> | null>(null)

  useEffect(() => {
    if (isHost) return
    if (confettiAt && confettiAt !== lastConfetti.current) {
      lastConfetti.current = confettiAt
      confetti({ particleCount: 140, spread: 85, origin: { y: 0.55 }, spread: 75 })
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
      const timer = setTimeout(() => update({ showStrikeOverlay: false }), 1400)
      return () => clearTimeout(timer)
    }
  }, [showStrikeOverlay])

  useEffect(() => {
    if (!isHost) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') toggleMusic()
      if (e.key.toLowerCase() === 'r') resetGame()
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        addStrike()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isHost, musicOn, strikes, bank, currentRoundIdx])

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
    if (!isHost || !round || revealed.includes(idx)) return
    const pts = round.answers[idx].points * round.multiplier
    sfx(sounds.roosCorrect)
    try {
      playFx('correct')
    } catch {}
    update((prev) => ({
      ...prev,
      revealed: [...prev.revealed, idx],
      bank: prev.bank + pts,
    }))
  }

  function addStrike() {
    if (!isHost) return
    const next = strikes + 1
    sfx(sounds.roosError)
    try {
      playFx('wrong')
    } catch {}
    update({ strikes: next, showStrikeOverlay: true })
    if (next >= 3) {
      setTimeout(() => update({ bank: 0, strikes: 0 }), 1500)
    }
  }

  function awardBank() {
    if (!isHost || bank === 0) return
    setPulseTeam(activeTeam)
    setTimeout(() => setPulseTeam(null), 800)
    try {
      playFx('victory')
    } catch {}
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((tm, i) =>
        i === prev.activeTeam ? { ...tm, score: tm.score + prev.bank } : tm
      ),
      bank: 0,
      strikes: 0,
      confettiAt: Date.now(),
    }))
  }

  function nextRound() {
    if (!isHost || currentRoundIdx >= rounds.length - 1) return
    update({
      currentRoundIdx: currentRoundIdx + 1,
      revealed: [],
      strikes: 0,
      bank: 0,
    })
  }

  function prevRound() {
    if (!isHost || currentRoundIdx <= 0) return
    update({
      currentRoundIdx: currentRoundIdx - 1,
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
      showStrikeOverlay: false,
    }))
  }

  const leader =
    teams.length > 0
      ? teams.reduce((a, b) => (a.score >= b.score ? a : b))
      : null

  return (
    <GameShowFrame display={!isHost} title={t('game_roosidesoda').toUpperCase()}>
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
                {musicOn ? t('toolbarBgmOn') : t('toolbarBgm')}
              </button>
              <button
                type="button"
                onClick={() => setSfxOn((v) => !v)}
                className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5"
              >
                {sfxOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {sfxOn ? t('toolbarSfxOn') : t('toolbarSfx')}
              </button>
            </>
          }
        />
      )}

      {isHost && (
        <TvJoinPanel code={sessionCode} connection={connection} lastSync={lastSync} />
      )}

      <div id="game-scale-root" className="relative">
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
            <div className="text-center mb-5">
              <div className="font-display text-xl md:text-2xl text-gold/90 font-bold">
                {round.title}
                <span className="text-gold/50 text-base ml-2">({round.multiplier}×)</span>
              </div>
              <p className="text-white text-lg md:text-2xl mt-2 max-w-2xl mx-auto font-semibold leading-snug animate-[fadeIn_0.35s_ease]">
                {round.question}
              </p>
              <p className="text-white/35 text-xs mt-2">
                {currentRoundIdx + 1} / {rounds.length}
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="px-10 py-4 text-center rounded-2xl border-2 border-dashed border-gold/60 bg-gold/10 shadow-[0_0_30px_rgba(223,179,66,0.15)]">
                <div className="text-gold/70 text-xs uppercase tracking-widest mb-0.5">{t('bank')}</div>
                <div className="font-display text-5xl md:text-6xl font-black text-gold tabular-nums">
                  {bank}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7 max-w-3xl mx-auto">
              {round.answers.map((ans, idx) => {
                const isRevealed = revealed.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!isHost || isRevealed}
                    onClick={() => reveal(idx)}
                    className={`
                      flex items-center justify-between px-5 py-4 rounded-xl border-2 text-left transition-all min-h-[68px]
                      ${
                        isRevealed
                          ? 'bg-gradient-to-r from-accent-green/40 to-accent-green/10 border-accent-green/70 scale-[1.01]'
                          : 'bg-gradient-to-br from-[#0d182b] to-[#1b2a47] border-gold/40 hover:border-gold hover:shadow-gold cursor-pointer'
                      }
                    `}
                  >
                    <span className="font-bold text-lg uppercase tracking-wide">
                      {isRevealed ? (
                        ans.text
                      ) : (
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gold text-bg font-display font-black">
                          {idx + 1}
                        </span>
                      )}
                    </span>
                    <span className="font-display font-black text-gold text-2xl tabular-nums">
                      {isRevealed ? ans.points * round.multiplier : ''}
                    </span>
                  </button>
                )
              })}
            </div>

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

            {isHost && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <button
                  type="button"
                  onClick={addStrike}
                  className="btn-outline border-accent-red text-accent-red hover:bg-accent-red hover:text-white"
                >
                  {t('strike')} ✕
                </button>
                <button type="button" onClick={awardBank} className="btn-gold flex items-center gap-2">
                  <Banknote size={16} /> {t('awardBank')} ({teams[activeTeam]?.name})
                </button>
                <button type="button" onClick={switchTeam} className="btn-outline">
                  {t('switchTeam')}
                </button>
                <button type="button" onClick={prevRound} className="btn-outline text-sm">
                  ◄ {t('round')}
                </button>
                <button type="button" onClick={nextRound} className="btn-outline flex items-center gap-1">
                  {t('round')} ► <SkipForward size={14} />
                </button>
              </div>
            )}

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

      {showStrikeOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 pointer-events-none">
          <div className="text-accent-red text-8xl md:text-[10rem] font-black animate-pulse drop-shadow-[0_0_40px_rgba(230,46,77,0.9)]">
            {'✕'.repeat(Math.min(strikes, 3))}
          </div>
        </div>
      )}
    </GameShowFrame>
  )
}
