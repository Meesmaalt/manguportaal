import { useEffect, useMemo, useRef, useState } from 'react'
import type { BlitzState } from './types'
import { sortedPlayers } from './types'
import { teamTotals } from './logic'
import { BlitzStage, AnswerShape, BLITZ_ANSWER_STYLE } from './BlitzStage'
import { confettiBurst } from '@/lib/confettiBurst'
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
  const isFinal =
    state.questions.length > 0 &&
    state.qIndex === state.questions.length - 1 &&
    (state.phase === 'question' || state.phase === 'countdown' || state.phase === 'reveal')
  const lastTick = useRef<number | null>(null)

  useEffect(() => {
    if (state.phase === 'podium') {
      confettiBurst({ particleCount: 180, spread: 95, y: 0.5 })
      setTimeout(() => confettiBurst({ particleCount: 100, spread: 70, y: 0.7 }), 400)
      playFx('drumroll')
      setTimeout(() => playFx('victory'), 400)
    }
    if (state.phase === 'reveal') playFx('reveal')
    if (state.phase === 'countdown') playFx('jingle')
  }, [state.phase, state.qIndex])

  useEffect(() => {
    if (state.phase !== 'question' || remaining == null) return
    if (remaining <= 5 && remaining > 0 && lastTick.current !== remaining) {
      lastTick.current = remaining
      playFx('tick')
    }
    if (remaining === 0) lastTick.current = null
  }, [remaining, state.phase])

  // Final question entrance confetti
  useEffect(() => {
    if (isFinal && state.phase === 'countdown') {
      confettiBurst({ particleCount: 80, spread: 60, y: 0.3 })
      playFx('jingle')
    }
  }, [isFinal, state.phase, state.qIndex])

  return (
    <BlitzStage final={isFinal}>
      <div className="min-h-screen flex flex-col px-4 md:px-10 py-5">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full mb-3">
          <div className="flex items-center gap-2 font-display font-black text-2xl md:text-3xl text-amber-300 drop-shadow">
            <Zap className="text-yellow-300" /> Blitz
          </div>
          <div className="flex items-center gap-3 text-sm text-white/50">
            {state.phase === 'question' && (
              <span className="rounded-full bg-white/10 px-3 py-1 border border-white/15">
                {answered}/{state.players.length} vastanud
              </span>
            )}
            <span className="tracking-[0.25em] font-bold border border-white/20 rounded-full px-4 py-1 bg-black/20">
              {code}
            </span>
          </div>
        </div>

        {isFinal && state.phase !== 'podium' && state.phase !== 'lobby' && (
          <div className="text-center mb-2">
            <span className="blitz-final-banner inline-block font-display font-black text-rose-300 text-sm md:text-base uppercase">
              ★ Viimane küsimus ★
            </span>
          </div>
        )}

        {state.phase === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-white/60 text-lg mb-2">Liitu telefoniga</p>
            <p className="font-display text-6xl md:text-8xl text-amber-300 font-black tracking-wider mb-4 drop-shadow-[0_0_30px_rgba(251,191,36,0.45)]">
              {code}
            </p>
            <p className="text-white/70 text-xl mb-8">
              <span className="text-amber-200 font-bold">{state.players.length}</span> mängijat ootel
            </p>
            {state.teamsEnabled && (
              <div className="flex gap-10 mb-6 font-display font-black text-2xl">
                <span className="text-rose-400">Tiim A</span>
                <span className="text-sky-400">Tiim B</span>
              </div>
            )}
            <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
              {state.players.map((p, i) => (
                <span
                  key={p.id}
                  className={`blitz-lobby-chip px-4 py-2 rounded-full border font-semibold text-lg backdrop-blur-sm ${
                    p.team === 'a'
                      ? 'bg-rose-600/50 border-rose-300 text-rose-50'
                      : p.team === 'b'
                        ? 'bg-sky-600/50 border-sky-300 text-sky-50'
                        : 'bg-white/15 border-amber-300/40 text-amber-100'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {state.phase === 'countdown' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-white/50 text-lg mb-4">
              Küsimus {(state.qIndex || 0) + 1}/{state.questions.length}
            </p>
            <CountdownBig state={state} />
          </div>
        )}

        {(state.phase === 'question' || state.phase === 'reveal') && q && (
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
            {state.teamsEnabled && (
              <div className="flex justify-center gap-10 mb-2 font-display font-black text-2xl">
                <span className="text-rose-400">A · {teamTotals(state).a}</span>
                <span className="text-sky-400">B · {teamTotals(state).b}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-3 text-sm text-white/45">
              <span className="font-bold tracking-wide">
                {state.qIndex + 1} / {state.questions.length}
              </span>
              {state.phase === 'question' && remaining != null && (
                <span
                  className={`blitz-timer-ring font-display font-black text-5xl md:text-6xl ${
                    remaining <= 5 ? 'blitz-timer-urgent' : 'text-amber-300'
                  }`}
                >
                  {remaining}
                </span>
              )}
              {state.phase === 'reveal' && (
                <span className="text-emerald-300 font-black uppercase tracking-widest text-sm">
                  Õige vastus
                </span>
              )}
            </div>

            {q.imageUrl && (
              <img
                src={q.imageUrl}
                alt=""
                className="max-h-44 md:max-h-52 mx-auto mb-4 rounded-2xl object-contain border-2 border-white/20 shadow-2xl"
              />
            )}

            <h1
              key={q.id + state.phase}
              className="blitz-q-enter font-display font-black text-3xl md:text-5xl leading-tight text-center mb-8 drop-shadow-lg"
            >
              {q.q}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1 content-center">
              {q.choices.map((c, i) => {
                const isCorrect = q.correct === i
                const show = state.phase === 'reveal'
                const st = BLITZ_ANSWER_STYLE[i]
                return (
                  <div
                    key={i}
                    className={`blitz-answer ${st.bg} px-5 py-6 md:py-8 text-xl md:text-2xl flex items-center gap-3 text-white ${
                      show && isCorrect ? 'blitz-answer-correct' : ''
                    } ${show && !isCorrect ? 'blitz-answer-wrong' : ''}`}
                  >
                    <AnswerShape index={i} className="text-white/90 w-8 h-8" />
                    <span className="flex-1">{c}</span>
                    {show && isCorrect && <span className="text-3xl">✓</span>}
                  </div>
                )
              })}
            </div>

            {state.phase === 'reveal' && state.lastAnswerDist && (
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full border font-bold ${
                      q.correct === i
                        ? 'border-white bg-white/20 text-white'
                        : 'border-white/20 text-white/45'
                    }`}
                  >
                    {BLITZ_ANSWER_STYLE[i].label}: {state.lastAnswerDist?.[i] || 0}
                  </span>
                ))}
              </div>
            )}

            {state.phase === 'reveal' && (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {ranked.slice(0, 5).map((p, i) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-black/35 border border-white/20 px-4 py-2 text-center min-w-[5.5rem] backdrop-blur-sm"
                  >
                    <div className="text-[10px] text-white/40">{i + 1}.</div>
                    <div className="text-amber-200 font-bold truncate max-w-[9rem]">{p.name}</div>
                    <div className="font-display font-black text-lg">{p.score}</div>
                    {(state.lastRoundPoints[p.id] || 0) > 0 && (
                      <div className="text-emerald-300 text-xs font-bold">
                        +{state.lastRoundPoints[p.id]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {state.phase === 'podium' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Trophy className="text-amber-300 mb-3 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" size={64} />
            <h1 className="font-display text-4xl md:text-6xl text-amber-300 font-black mb-4">Podium</h1>
            {state.teamsEnabled && (
              <p className="text-xl mb-6 font-display font-bold">
                {teamTotals(state).a >= teamTotals(state).b ? (
                  <span className="text-rose-300">
                    Tiim A võidab · {teamTotals(state).a} – {teamTotals(state).b}
                  </span>
                ) : (
                  <span className="text-sky-300">
                    Tiim B võidab · {teamTotals(state).b} – {teamTotals(state).a}
                  </span>
                )}
              </p>
            )}
            <div className="flex items-end justify-center gap-3 md:gap-6 mb-10">
              {[1, 0, 2].map((place) => {
                const p = ranked[place]
                if (!p) return <div key={place} className="w-24 md:w-36" />
                const h =
                  place === 0 ? 'h-44 md:h-56' : place === 1 ? 'h-32 md:h-40' : 'h-24 md:h-32'
                const anim =
                  place === 0 ? 'blitz-podium-1' : place === 1 ? 'blitz-podium-2' : 'blitz-podium-3'
                const medal = place === 0 ? '🥇' : place === 1 ? '🥈' : '🥉'
                return (
                  <div key={p.id} className={`flex flex-col items-center w-24 md:w-36 ${anim}`}>
                    <div className="text-2xl mb-1">{medal}</div>
                    <div className="font-display font-black text-amber-200 text-lg md:text-2xl mb-1 truncate max-w-full">
                      {p.name}
                    </div>
                    <div className="text-white/55 text-sm mb-2">{p.score} p</div>
                    <div
                      className={`${h} w-full rounded-t-2xl border-2 border-amber-300/50 bg-gradient-to-t from-amber-500/50 to-amber-200/10 flex items-start justify-center pt-3 font-display font-black text-3xl text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.25)]`}
                    >
                      {place + 1}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="w-full max-w-md space-y-1.5">
              {ranked.map((p, i) => (
                <div
                  key={p.id}
                  className="flex justify-between px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm backdrop-blur-sm"
                >
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <span className="font-display font-bold text-amber-200">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BlitzStage>
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
    <div className="font-display font-black text-[8rem] md:text-[12rem] text-amber-300 tabular-nums leading-none drop-shadow-[0_0_40px_rgba(251,191,36,0.5)] animate-pulse">
      {n > 0 ? n : 'GO!'}
    </div>
  )
}
