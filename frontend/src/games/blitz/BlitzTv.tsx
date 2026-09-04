import { useEffect, useMemo, useRef, useState } from 'react'
import type { BlitzState } from './types'
import { sortedPlayers } from './types'
import { teamTotals } from './logic'
import { BlitzStage, AnswerShape, BLITZ_ANSWER_STYLE } from './BlitzStage'
import { confettiBurst } from '@/lib/confettiBurst'
import { playFx } from '@/lib/audio'
import { appUrl } from '@/lib/config'
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
  const prevPlayerCount = useRef(0)

  useEffect(() => {
    const n = state.players?.length || 0
    if (state.phase === 'lobby' && n > prevPlayerCount.current) playFx('join')
    prevPlayerCount.current = n
  }, [state.players?.length, state.phase])

  useEffect(() => {
    if (state.streakEvent && state.phase === 'reveal' && state.streakEvent.streak >= 3) {
      confettiBurst({ particleCount: 60, spread: 55, y: 0.35 })
      playFx('correct')
    }
  }, [state.streakEvent?.at])

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
        <div className="max-w-6xl mx-auto w-full mb-1">
          <div className="blitz-header-bar w-full !mb-2">
            <div className="flex items-center gap-2 font-display text-2xl md:text-3xl blitz-logo">
              <Zap className="text-amber-300" style={{ filter: 'none', color: '#fcd34d' }} />
              BLITZ
            </div>
            <div className="flex items-center gap-3 text-sm text-white/60">
              {state.phase === 'question' && (
                <span className="blitz-glass rounded-full px-3 py-1 text-xs font-bold">
                  {answered}/{state.players.length} vastanud
                </span>
              )}
              {(state.phase === 'lobby' || state.phase === 'podium') && (
                <span className="blitz-code-pill text-sm md:text-base">{code}</span>
              )}
            </div>
          </div>
        </div>

        {state.streakEvent && state.phase === 'reveal' && state.streakEvent.streak >= 3 && (
          <div className="text-center mb-3">
            <span className="blitz-final-banner inline-block font-display font-black text-amber-300 text-lg md:text-2xl">
              🔥 {state.streakEvent.name} · streak {state.streakEvent.streak}!
            </span>
          </div>
        )}
        {state.isWarmup && state.phase !== 'lobby' && state.phase !== 'podium' && (
          <div className="text-center mb-2">
            <span className="inline-block font-display font-black text-cyan-300 text-sm uppercase tracking-widest">
              Proovivoor — punktid ei loe
            </span>
          </div>
        )}
        {state.suddenDeathActive && state.phase !== 'podium' && state.phase !== 'lobby' && (
          <div className="text-center mb-2">
            <span className="blitz-final-banner inline-block font-display font-black text-rose-300 text-sm md:text-base uppercase">
              ★ Äkk-surm — viik ★
            </span>
          </div>
        )}
        {isFinal && !state.suddenDeathActive && !state.isWarmup && state.phase !== 'podium' && state.phase !== 'lobby' && (
          <div className="text-center mb-2">
            <span className="blitz-final-banner inline-block font-display font-black text-rose-300 text-sm md:text-base uppercase">
              ★ Viimane küsimus ★
            </span>
          </div>
        )}

        {state.phase === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-white/60 text-lg mb-2">Liitu telefoniga — skanni QR</p>
            <div className="bg-white p-3 rounded-2xl mb-4 shadow-[0_0_40px_rgba(251,191,36,0.25)]">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&margin=8&data=${encodeURIComponent(appUrl(`/blitz/${code}`))}`}
                width={200}
                height={200}
                alt="Join"
                className="rounded-lg"
              />
            </div>
            <p className="blitz-code-pill text-3xl md:text-5xl mb-4 inline-block tracking-[0.35em]">
              {code}
            </p>
            <p className="text-white/50 text-sm mb-6">või ava telefonis ja sisesta kood</p>
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
                  className={`blitz-chip blitz-lobby-chip text-lg ${
                    p.team === 'a'
                      ? '!bg-rose-600/55 !border-rose-300 text-rose-50'
                      : p.team === 'b'
                        ? '!bg-sky-600/55 !border-sky-300 text-sky-50'
                        : 'text-amber-100'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {p.avatar ? p.avatar + ' ' : ''}{p.name}
                      {state.teamsEnabled && p.team && state.captains?.[p.team] === p.id && (
                        <span className="ml-1 text-amber-300" title="Kapten">★</span>
                      )}
                  {state.requireReady && (p.ready ? ' ✓' : '')}
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
                <div className="text-right">
                  <span
                    className={`blitz-timer-ring font-display font-black text-5xl md:text-6xl ${
                      remaining <= 5 ? 'blitz-timer-urgent' : 'text-amber-300'
                    }`}
                  >
                    {remaining}
                  </span>
                  <div className="blitz-progress mt-1 w-24 ml-auto">
                    <i style={{ width: `${Math.max(0, Math.min(100, (remaining / state.secondsPerQuestion) * 100))}%` }} />
                  </div>
                </div>
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

            <div className="blitz-q-card blitz-q-enter mb-6 max-w-4xl mx-auto w-full">
              <h1
                key={q.id + state.phase}
                className="font-display font-black text-2xl md:text-4xl lg:text-5xl leading-tight text-center text-white"
              >
                {q.difficulty ? (
                  <span className={`inline-block text-xs font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border mb-2 ${
                    q.difficulty === 'easy' ? 'border-emerald-400/50 text-emerald-300' :
                    q.difficulty === 'hard' ? 'border-red-400/50 text-red-300' :
                    'border-amber-400/50 text-amber-200'
                  }`}>{q.difficulty}</span>
                ) : null}
                <span className="block">{q.q}</span>
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1 content-center max-w-5xl mx-auto w-full">
              {q.choices.map((c, i) => {
                const isCorrect = q.correct === i
                const show = state.phase === 'reveal'
                const st = BLITZ_ANSWER_STYLE[i]
                return (
                  <div
                    key={i}
                    className={`blitz-answer ${st.bg} blitz-answer-tile text-xl md:text-2xl ${
                      show && isCorrect ? 'blitz-answer-correct' : ''
                    } ${show && !isCorrect ? 'blitz-answer-wrong' : ''}`}
                  >
                    <span className="blitz-shape-badge">
                      <AnswerShape index={i} className="text-white w-6 h-6" />
                    </span>
                    <span className="flex-1">{c}</span>
                    {show && isCorrect && <span className="text-3xl font-black">✓</span>}
                  </div>
                )
              })}
            </div>

            {state.phase === 'question' && state.players.length > 0 && (
              <div className="mt-4 text-center text-sm text-white/45">
                {(() => {
                  const waiting = state.players.filter((pl) => !state.answers?.[pl.id])
                  if (!waiting.length) return <span className="text-emerald-300 font-bold">Kõik vastanud!</span>
                  return (
                    <span>
                      Ootame veel:{' '}
                      {waiting.map((pl) => (pl.avatar || '') + pl.name).join(', ')}
                    </span>
                  )
                })()}
              </div>
            )}

            {state.phase === 'reveal' && (state.lastPhotoFinish?.length || 0) > 0 && (
              <div className="mt-4 mx-auto max-w-md rounded-2xl border border-cyan-400/40 bg-cyan-950/50 px-4 py-3 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <p className="text-cyan-200 text-sm md:text-base font-black uppercase tracking-[0.2em] mb-2 text-center">
                  ⚡ Photo finish
                </p>
                <ol className="space-y-1.5">
                  {state.lastPhotoFinish!.slice(0, 5).map((row, i) => (
                    <li
                      key={row.playerId}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-1.5 ${
                        i === 0 ? 'bg-cyan-400/20 text-white' : 'bg-white/5 text-white/85'
                      }`}
                    >
                      <span className="font-black text-cyan-300 w-6">{i + 1}.</span>
                      <span className="flex-1 font-bold truncate">{row.name}</span>
                      <span className="text-xs text-white/50 tabular-nums">{(row.atMs / 1000).toFixed(2)}s</span>
                      <span className="text-emerald-300 font-black tabular-nums">+{row.points}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

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

        {state.phase === 'midboard' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="font-display text-4xl md:text-5xl text-amber-300 font-black mb-6">Vaheseis</p>
            <div className="w-full max-w-md space-y-2">
              {ranked.slice(0, 8).map((pl, i) => (
                <div
                  key={pl.id}
                  className="flex justify-between px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-lg"
                >
                  <span className="font-bold">
                    {i + 1}. {pl.name}
                  </span>
                  <span className="font-display font-black text-amber-200">{pl.score}</span>
                </div>
              ))}
            </div>
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
                      {p.avatar ? p.avatar + ' ' : ''}{p.name}
                    </div>
                    <div className="text-white/55 text-sm mb-2">{p.score} p</div>
                    <div
                      className={`${h} w-full rounded-t-2xl border-2 border-amber-300/50 bg-gradient-to-t from-amber-500/60 to-amber-100/10 flex items-start justify-center pt-3 font-display font-black text-3xl text-amber-100 blitz-podium-glow`}
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
