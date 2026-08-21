import { useEffect, useRef, useState } from 'react'
import type { SonaseletusPackData } from '@/data/official-packs'

type Team = { name: string; score: number }

export type SonaseletusState = {
  teams: Team[]
  activeTeam: number
  words: string[]
  wordIndex: number
  roundSeconds: number
  timeLeft: number
  running: boolean
  packData: SonaseletusPackData
  code?: string
}

type Props = {
  state: SonaseletusState
  update: (p: Partial<SonaseletusState> | ((s: SonaseletusState) => SonaseletusState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function SonaseletusGame({ state, update, isHost = true, sessionCode }: Props) {
  const { teams, activeTeam, words, wordIndex, roundSeconds, timeLeft, running } = state
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running || !isHost) return
    timerRef.current = window.setInterval(() => {
      update((prev) => {
        if (prev.timeLeft <= 1) {
          return { ...prev, timeLeft: 0, running: false }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running, isHost])

  function startRound() {
    if (!isHost) return
    update({ timeLeft: roundSeconds, running: true })
  }

  function correct() {
    if (!isHost || !running) return
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((t, i) =>
        i === prev.activeTeam ? { ...t, score: t.score + 1 } : t
      ),
      wordIndex: (prev.wordIndex + 1) % prev.words.length,
    }))
  }

  function skip() {
    if (!isHost || !running) return
    update((prev) => ({
      ...prev,
      wordIndex: (prev.wordIndex + 1) % prev.words.length,
    }))
  }

  function nextTeam() {
    if (!isHost) return
    update({
      activeTeam: (activeTeam + 1) % teams.length,
      running: false,
      timeLeft: roundSeconds,
    })
  }

  const word = words[wordIndex] || '—'

  return (
    <div className="max-w-2xl mx-auto px-4">
      {sessionCode && (
        <div className="text-center mb-4">
          <span className="inline-block bg-gold/15 border border-gold/40 text-gold px-4 py-1 rounded-full text-sm font-bold tracking-widest">
            Kood: {sessionCode}
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-white/50 text-sm uppercase tracking-widest mb-1">
          {teams[activeTeam]?.name} · voor
        </div>
        <div
          className={`font-display text-6xl font-black tabular-nums ${
            timeLeft <= 10 && running ? 'text-accent-red animate-pulse' : 'text-gold'
          }`}
        >
          {timeLeft}
        </div>
        <div className="text-white/40 text-sm">sekundit</div>
      </div>

      <div className="card-panel p-10 text-center mb-6 min-h-[140px] flex items-center justify-center">
        <h2 className="font-display text-4xl md:text-5xl text-white font-black">
          {running || !isHost ? word : '—'}
        </h2>
      </div>

      {isHost && (
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {!running ? (
            <button onClick={startRound} className="btn-gold text-lg px-8">
              Start ({roundSeconds}s)
            </button>
          ) : (
            <>
              <button onClick={correct} className="btn-gold bg-accent-green border-0 text-lg px-6">
                ✓ Õige
              </button>
              <button onClick={skip} className="btn-outline text-lg px-6">
                → Vahele
              </button>
            </>
          )}
          <button onClick={nextTeam} className="btn-outline text-sm">
            Järgmine tiim
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {teams.map((t, i) => (
          <div
            key={i}
            className={`card-panel p-4 text-center ${
              i === activeTeam ? 'border-gold shadow-gold' : 'opacity-70'
            }`}
          >
            <div className="font-display text-gold font-bold">{t.name}</div>
            <div className="text-3xl font-display font-black">{t.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
