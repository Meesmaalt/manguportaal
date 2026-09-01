import { useEffect, useMemo, useRef, useState } from 'react'
import type { BlitzState } from './types'
import { CHOICE_COLORS, sortedPlayers } from './types'
import { teamTotals } from './logic'
import confetti from 'canvas-confetti'
import { playFx } from '@/lib/audio'
import { Trophy, Zap } from 'lucide-react'

export default function BlitzTv({ state, sessionCode }: { state: BlitzState; sessionCode?: string }) {
  const code = sessionCode || state.code || ''
  const q = state.questions[state.qIndex]
  const ranked = useMemo(() => sortedPlayers(state.players), [state.players])
  const remaining = useCountdown(
    state.phase === 'question' ? state.questionStartedAt : undefined,
    state.secondsPerQuestion
  )
  const answered = Object.keys(state.answers || {}).length
  const lastTick = useRef<number | null>(null)
  useEffect(() => {
    if (state.phase !== 'question' || remaining == null) return
    if (remaining <= 5 && remaining > 0 && lastTick.current !== remaining) {
      lastTick.current = remaining
      playFx('tick')
    }
    if (remaining === 0) lastTick.current = null
  }, [remaining, state.phase])

  useEffect(() => {
    if (state.phase === 'podium') {
      confetti({ particleCount: 140, spread: 85, origin: { y: 0.55 }, spread: 85 })
      playFx('drumroll')
      setTimeout(() => playFx('victory'), 400)
    }
    if (state.phase === 'reveal') playFx('reveal')
    if (state.phase === 'countdown') playFx('jingle')
  }, [state.phase, state.qIndex])

  return (
    <div className="min-h-screen bg-[#03070f] text-white flex flex-col px-4 md:px-8 py-5">
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full mb-4">
        <div className="flex items-center gap-2 font-display font-black text-2xl text-gold">
          <Zap /> Blitz
        </div>
        <div className="flex items-center gap-3 text-sm text-white/40">
          {state.phase === 'question' && (
            <span>
              {answered}/{state.players.length} vastanud
            </span>
          )}
          <span className="tracking-widest border border-white/15 rounded-full px-3 py-1">{code}</span>
        </div>
      </div>

      {state.phase === 'countdown' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-white/40 text-lg mb-4">
            Küsimus {(state.qIndex || 0) + 1}/{state.questions.length}
          </p>
          <CountdownBig state={state} />
        </div>
      )}

      {state.phase === 'lobby' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-white/50 text-lg mb-2">Liitu telefoniga</p>
          <p className="font-display text-5xl md:text-7xl text-gold font-black tracking-wider mb-6">
            {code}
          </p>
          <p className="text-white/60 text-xl mb-6">{state.players.length} mängijat</p>
          {state.teamsEnabled && (
            <div className="flex gap-8 mb-6 font-display font-black text-2xl">
              <span className="text-red-400">Tiim A</span>
              <span className="text-blue-400">Tiim B</span>
            </div>
          )}
          <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
            {state.players.map((p) => (
              <span
                key={p.id}
                className={`px-4 py-2 rounded-full border font-semibold text-lg ${
                  p.team === 'a'
                    ? 'bg-red-600/40 border-red-400 text-red-100'
                    : p.team === 'b'
                      ? 'bg-blue-600/40 border-blue-400 text-blue-100'
                      : 'bg-white/10 border-gold/30 text-gold'
                }`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {(state.phase === 'question' || state.phase === 'reveal') && q && (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3 text-sm text-white/40">
            <span>
              {state.qIndex + 1} / {state.questions.length}
            </span>
            {state.phase === 'question' && remaining != null && (
              <span
                className={`font-display font-black text-5xl tabular-nums ${
                  remaining <= 5 ? 'text-accent-red animate-pulse' : 'text-gold'
                }`}
              >
                {remaining}
              </span>
            )}
            {state.phase === 'reveal' && (
              <span className="text-emerald-300 font-bold uppercase tracking-wide">Õige vastus</span>
            )}
          </div>

          {q.imageUrl && (
            <img
              src={q.imageUrl}
              alt=""
              className="max-h-48 md:max-h-56 mx-auto mb-4 rounded-2xl object-contain border border-white/10 shadow-xl"
            />
          )}

          <h1 className="font-display font-black text-3xl md:text-5xl leading-tight text-center mb-8">
            {q.q}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1 content-center">
            {q.choices.map((c, i) => {
              const isCorrect = q.correct === i
              const show = state.phase === 'reveal'
              return (
                <div
                  key={i}
                  className={`rounded-2xl border-4 px-5 py-6 md:py-8 text-xl md:text-2xl font-bold flex items-center gap-3 transition-all ${
                    CHOICE_COLORS[i].bg
                  } ${CHOICE_COLORS[i].border} ${
                    show && isCorrect
                      ? 'ring-4 ring-white scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.25)]'
                      : show && !isCorrect
                        ? 'opacity-35'
                        : ''
                  }`}
                >
                  <span className="text-white/80 w-8">{CHOICE_COLORS[i].label}</span>
                  <span className="flex-1">{c}</span>
                  {show && isCorrect && <span className="text-3xl">✓</span>}
                </div>
              )
            })}
          </div>

          {state.teamsEnabled && (state.phase === 'reveal' || state.phase === 'question' || state.phase === 'countdown') && (
            <div className="flex justify-center gap-10 mb-2 font-display font-black text-2xl">
              <span className="text-red-400">A · {teamTotals(state).a}</span>
              <span className="text-blue-400">B · {teamTotals(state).b}</span>
            </div>
          )}
          {state.phase === 'reveal' && state.lastAnswerDist && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full border ${
                    q.correct === i ? 'border-white text-white' : 'border-white/20 text-white/50'
                  }`}
                >
                  {CHOICE_COLORS[i].label}: {state.lastAnswerDist?.[i] || 0}
                </span>
              ))}
            </div>
          )}
          {state.phase === 'reveal' && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {ranked.slice(0, 5).map((p, i) => (
                <div
                  key={p.id}
                  className="rounded-xl bg-black/40 border border-white/15 px-4 py-2 text-center min-w-[5.5rem]"
                >
                  <div className="text-[10px] text-white/40">{i + 1}.</div>
                  <div className="text-gold font-bold truncate max-w-[9rem]">{p.name}</div>
                  <div className="font-display font-black text-lg">{p.score}</div>
                  {(state.lastRoundPoints[p.id] || 0) > 0 && (
                    <div className="text-emerald-300 text-xs">+{state.lastRoundPoints[p.id]}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {state.phase === 'podium' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Trophy className="text-gold mb-4" size={56} />
          <h1 className="font-display text-4xl md:text-6xl text-gold font-black mb-4">Podium</h1>
          {state.teamsEnabled && (
            <p className="text-xl mb-6 font-display font-bold">
              {teamTotals(state).a >= teamTotals(state).b ? (
                <span className="text-red-400">Tiim A võidab · {teamTotals(state).a} – {teamTotals(state).b}</span>
              ) : (
                <span className="text-blue-400">Tiim B võidab · {teamTotals(state).b} – {teamTotals(state).a}</span>
              )}
            </p>
          )}
          <div className="flex items-end justify-center gap-3 md:gap-6 mb-10">
            {[1, 0, 2].map((place) => {
              const p = ranked[place]
              if (!p) return <div key={place} className="w-24 md:w-36" />
              const h = place === 0 ? 'h-40 md:h-52' : place === 1 ? 'h-32 md:h-40' : 'h-24 md:h-32'
              return (
                <div key={p.id} className="flex flex-col items-center w-24 md:w-36">
                  <div className="font-display font-black text-gold text-xl md:text-2xl mb-1 truncate max-w-full">
                    {p.name}
                  </div>
                  <div className="text-white/50 text-sm mb-2">{p.score} p</div>
                  <div
                    className={`${h} w-full rounded-t-2xl border-2 border-gold/50 bg-gradient-to-t from-gold/40 to-gold/10 flex items-start justify-center pt-3 font-display font-black text-3xl text-gold`}
                  >
                    {place + 1}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="w-full max-w-md space-y-1">
            {ranked.map((p, i) => (
              <div key={p.id} className="flex justify-between px-3 py-1.5 rounded-lg bg-white/5 text-sm">
                <span>
                  {i + 1}. {p.name}
                </span>
                <span className="font-display font-bold">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function useCountdown(startedAt: number | undefined, seconds: number): number | null {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!startedAt || seconds <= 0) return
    const id = window.setInterval(() => setNow(Date.now()), 150)
    return () => clearInterval(id)
  }, [startedAt, seconds])
  if (!startedAt || seconds <= 0) return null
  return Math.max(0, Math.ceil(seconds - (now - startedAt) / 1000))
}


function CountdownBig({ state }: { state: BlitzState }) {
  const left = useCountdown(state.countdownStartedAt, state.preCountdownSeconds ?? 3)
  const n = left == null ? 3 : left <= 0 ? 0 : left
  return (
    <div className="font-display font-black text-[8rem] md:text-[12rem] text-gold tabular-nums leading-none animate-pulse">
      {n > 0 ? n : 'GO'}
    </div>
  )
}
