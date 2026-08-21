import confetti from 'canvas-confetti'
import { useEffect, useRef, useState } from 'react'
import type { RoosidesodaState } from './types'
import { Plus, Minus, SkipForward, Banknote, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { playSound, sounds, createBgm } from '@/lib/audio'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import { useFontScale } from '@/hooks/useFontScale'

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

  const [musicOn, setMusicOn] = useState(false)
  const { smaller, reset, larger } = useFontScale()
  const [sfxOn, setSfxOn] = useState(true)
  const bgmRef = useRef<ReturnType<typeof createBgm> | null>(null)

  useEffect(() => {
    bgmRef.current = createBgm(sounds.roosBgm, 0.28)
    return () => bgmRef.current?.pause()
  }, [])

  useEffect(() => {
    if (showStrikeOverlay) {
      const t = setTimeout(() => update({ showStrikeOverlay: false }), 1400)
      return () => clearTimeout(t)
    }
  }, [showStrikeOverlay])

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

  if (!round) {
    return (
      <div className="text-center py-20 text-gold font-display text-2xl">Mäng läbi! 🎉</div>
    )
  }

  function reveal(idx: number) {
    if (!isHost || revealed.includes(idx)) return
    const pts = round.answers[idx].points * round.multiplier
    sfx(sounds.roosCorrect)
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
    update({ strikes: next, showStrikeOverlay: true })
    if (next >= 3) {
      setTimeout(() => update({ bank: 0, strikes: 0 }), 1500)
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
    confetti({ particleCount: 110, spread: 65, origin: { y: 0.6 } })
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
    if (!confirm('Nulli mäng? Skoorid, bank ja avatud vastused nullitakse.')) return
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => ({ ...t, score: 0 })),
      currentRoundIdx: 0,
      revealed: [],
      strikes: 0,
      bank: 0,
      activeTeam: 0,
      showStrikeOverlay: false,
    }))
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 relative">
      {isHost && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-1 bg-bg-card border border-gold/40 rounded-full px-2 py-1">
            <span className="text-gold text-xs px-1">Tekst</span>
            <button
              type="button"
              className="text-gold font-bold px-2 py-0.5 rounded-full hover:bg-gold hover:text-bg text-sm"
              onClick={smaller}
            >
              A−
            </button>
            <button
              type="button"
              className="text-gold font-bold px-2 py-0.5 rounded-full hover:bg-gold hover:text-bg text-sm"
              onClick={reset}
            >
              A
            </button>
            <button
              type="button"
              className="text-gold font-bold px-2 py-0.5 rounded-full hover:bg-gold hover:text-bg text-sm"
              onClick={larger}
            >
              A+
            </button>
          </div>
          <button type="button" onClick={toggleMusic} className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5">
            {musicOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {musicOn ? 'Taust sees' : 'Taust'}
          </button>
          <button
            type="button"
            onClick={() => setSfxOn((v) => !v)}
            className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5"
          >
            {sfxOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {sfxOn ? 'Efektid sees' : 'Efektid'}
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 border-accent-red/60 text-accent-red"
          >
            <RotateCcw size={14} />
            Taasta algseis
          </button>
        </div>
      )}

      <SessionCodeBadge code={sessionCode} />

      <h1 className="font-display text-center text-3xl md:text-4xl font-black text-gold mb-2 tracking-wide">
        🌹 ROOSIDE SÕDA 🌹
      </h1>

      <div className="text-center mb-5">
        <div className="font-display text-xl md:text-2xl text-gold/90 font-bold">
          {round.title}
          <span className="text-gold/50 text-base ml-2">({round.multiplier}×)</span>
        </div>
        <p className="text-white text-lg md:text-xl mt-2 max-w-2xl mx-auto font-semibold leading-snug">
          {round.question}
        </p>
      </div>

      {/* Bank */}
      <div className="flex justify-center mb-6">
        <div className="px-10 py-4 text-center rounded-2xl border-2 border-dashed border-gold/60 bg-gold/10">
          <div className="text-gold/70 text-xs uppercase tracking-widest mb-0.5">Punkti pank</div>
          <div className="font-display text-5xl font-black text-gold">{bank}</div>
        </div>
      </div>

      {/* Answers */}
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
                flex items-center justify-between px-5 py-4 rounded-xl border-2 text-left transition-all min-h-[64px]
                ${
                  isRevealed
                    ? 'bg-gradient-to-r from-accent-green/35 to-accent-green/10 border-accent-green/70'
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
              <span className="font-display font-black text-gold text-2xl">
                {isRevealed ? ans.points * round.multiplier : ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* Strikes */}
      <div className="flex justify-center gap-4 mb-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-3xl font-black transition ${
              i < strikes
                ? 'border-accent-red bg-accent-red/25 text-accent-red shadow-[0_0_20px_rgba(230,46,77,0.5)]'
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
            Streik ✕
          </button>
          <button type="button" onClick={awardBank} className="btn-gold flex items-center gap-2">
            <Banknote size={16} /> Anna bank ({teams[activeTeam]?.name})
          </button>
          <button type="button" onClick={switchTeam} className="btn-outline">
            Vaheta meeskonda
          </button>
          <button type="button" onClick={prevRound} className="btn-outline text-sm">
            ◄ Voor
          </button>
          <button type="button" onClick={nextRound} className="btn-outline flex items-center gap-1">
            Voor ► <SkipForward size={14} />
          </button>
        </div>
      )}

      {/* Teams centered */}
      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        {teams.map((team, i) => (
          <div
            key={i}
            className={`card-panel p-4 text-center transition ${
              i === activeTeam ? 'border-gold shadow-gold ring-1 ring-gold/40' : 'border-white/10 opacity-85'
            }`}
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
            <div className="text-4xl md:text-5xl font-display font-black mt-1 tabular-nums">{team.score}</div>
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
              <div className="text-xs text-gold/70 mt-1 uppercase tracking-wider">Aktiivne</div>
            )}
          </div>
        ))}
      </div>

      {showStrikeOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 pointer-events-none">
          <div className="text-accent-red text-8xl md:text-[10rem] font-black animate-pulse drop-shadow-[0_0_40px_rgba(230,46,77,0.9)]">
            {'✕'.repeat(Math.min(strikes, 3))}
          </div>
        </div>
      )}
    </div>
  )
}
