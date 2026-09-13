import { useEffect, useMemo, useRef, useState } from 'react'
import type { BlitzState } from './types'
import { sortedPlayers } from './types'
import { teamTotals } from './logic'
import { BlitzStage, AnswerShape, BLITZ_ANSWER_STYLE } from './BlitzStage'
import { confettiBurst } from '@/lib/confettiBurst'
import { playFx } from '@/lib/audio'
import {
  isBlitzAudioMuted,
  setBlitzAudioMuted,
  startBlitzBgm,
  stopBlitzBgm,
  playCountdownTick,
  playRevealStinger,
  playPodiumFanfare,
  playReactionPop,
  playStreakSound,
} from './blitzAudio'
import { appUrl } from '@/lib/config'
import { Trophy, Zap, Volume2, VolumeX, Flame, TrendingUp } from 'lucide-react'

export default function BlitzTv({ state, sessionCode }: { state: BlitzState; sessionCode?: string }) {
  const code = sessionCode || state.code || ''
  const q = state.questions[state.qIndex]
  const ranked = useMemo(() => sortedPlayers(state.players), [state.players])
  const currentDuration = q?.timeLimit || state.secondsPerQuestion || 20
  const remaining = useCountdown(
    state.phase === 'question' ? state.questionStartedAt : undefined,
    currentDuration
  )
  const answered = Object.keys(state.answers || {}).length
  const isFinal =
    state.questions.length > 0 &&
    state.qIndex === state.questions.length - 1 &&
    (state.phase === 'question' || state.phase === 'countdown' || state.phase === 'reveal')
  const isGolden = q?.pointsMultiplier === 2 || isFinal
  const [soundEnabled, setSoundEnabled] = useState(!isBlitzAudioMuted())

  const lastTick = useRef<number | null>(null)
  const prevPlayerCount = useRef(0)
  const prevReactionCount = useRef(0)

  // Sound toggle handler
  function toggleSound() {
    const next = !soundEnabled
    setSoundEnabled(next)
    setBlitzAudioMuted(!next)
    if (next) {
      if (state.phase === 'lobby') startBlitzBgm('lobby')
      else if (state.phase === 'question') startBlitzBgm('question')
    } else {
      stopBlitzBgm()
    }
  }

  // React to phase changes for audio
  useEffect(() => {
    if (!soundEnabled) return
    if (state.phase === 'lobby') {
      startBlitzBgm('lobby')
    } else if (state.phase === 'question') {
      startBlitzBgm('question')
    } else if (state.phase === 'reveal') {
      stopBlitzBgm()
      playRevealStinger()
    } else if (state.phase === 'podium') {
      stopBlitzBgm()
      playPodiumFanfare()
    } else {
      stopBlitzBgm()
    }
    return () => {
      stopBlitzBgm()
    }
  }, [state.phase, soundEnabled, state.qIndex])

  // Player join sound
  useEffect(() => {
    const n = state.players?.length || 0
    if (state.phase === 'lobby' && n > prevPlayerCount.current) playFx('join')
    prevPlayerCount.current = n
  }, [state.players?.length, state.phase])

  // Reaction pop sound
  useEffect(() => {
    const rCount = state.reactions?.length || 0
    if (rCount > prevReactionCount.current) {
      playReactionPop()
    }
    prevReactionCount.current = rCount
  }, [state.reactions?.length])

  // Streak celebration
  useEffect(() => {
    if (state.streakEvent && state.phase === 'reveal' && state.streakEvent.streak >= 3) {
      confettiBurst({ particleCount: 60, spread: 55, y: 0.35 })
      playStreakSound(state.streakEvent.streak)
    }
  }, [state.streakEvent?.at])

  // Podium celebration
  useEffect(() => {
    if (state.phase === 'podium') {
      confettiBurst({ particleCount: 180, spread: 95, y: 0.5 })
      setTimeout(() => confettiBurst({ particleCount: 100, spread: 70, y: 0.7 }), 400)
    }
  }, [state.phase])

  // Countdown ticking in final 5 seconds
  useEffect(() => {
    if (state.phase !== 'question' || remaining == null) return
    if (remaining <= 5 && remaining > 0 && lastTick.current !== remaining) {
      lastTick.current = remaining
      playCountdownTick(remaining)
    }
    if (remaining === 0) lastTick.current = null
  }, [remaining, state.phase])

  // Final question entrance confetti
  useEffect(() => {
    if (isFinal && state.phase === 'countdown') {
      confettiBurst({ particleCount: 80, spread: 60, y: 0.3 })
    }
  }, [isFinal, state.phase, state.qIndex])

  // Calculate total answers for bar chart percentages
  const totalAnswersInReveal = useMemo(() => {
    if (!state.lastAnswerDist) return 0
    return Object.values(state.lastAnswerDist).reduce((sum, count) => sum + count, 0)
  }, [state.lastAnswerDist])

  return (
    <BlitzStage final={isFinal}>
      {/* Floating Live Reactions Layer */}
      <FloatingReactions reactions={state.reactions || []} />

      <div className="min-h-screen flex flex-col px-4 md:px-10 py-4 relative z-10">
        {/* Top bar */}
        <div className="max-w-6xl mx-auto w-full mb-1">
          <div className="blitz-header-bar w-full !mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-2xl md:text-3xl blitz-logo">
              <Zap className="text-amber-300" style={{ filter: 'none', color: '#fcd34d' }} />
              BLITZ
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSound}
                className="blitz-glass rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 hover:bg-white/20 transition cursor-pointer text-white/90"
                title={soundEnabled ? 'Vaigista heli' : 'Lülita heli sisse'}
              >
                {soundEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} className="text-white/40" />}
                <span className="hidden sm:inline">{soundEnabled ? 'Heli SEES' : 'Heli VÄLJAS'}</span>
              </button>

              {state.phase === 'question' && (
                <span className="blitz-glass rounded-full px-3 py-1 text-xs font-bold text-amber-200">
                  {answered}/{state.players.length} vastanud
                </span>
              )}

              {(state.phase === 'lobby' || state.phase === 'podium') && (
                <span className="blitz-code-pill text-sm md:text-base">{code}</span>
              )}
            </div>
          </div>
        </div>

        {/* Golden Question Banner */}
        {isGolden && state.phase !== 'lobby' && state.phase !== 'podium' && (
          <div className="text-center mb-2">
            <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full font-display font-black text-amber-300 text-sm md:text-base uppercase bg-amber-500/25 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.4)] animate-pulse">
              ★ 2X PUNKTID · {isFinal ? 'VIIMANE KÜSIMUS' : 'KULDNE KÜSIMUS'} ★
            </span>
          </div>
        )}

        {/* Highest Climber Banner */}
        {state.phase === 'reveal' && state.climber && state.climber.delta >= 2 && (
          <div className="text-center mb-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full font-display font-black text-cyan-300 text-sm md:text-base bg-cyan-950/70 border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <TrendingUp size={18} />
              Päeva tõusja: <strong className="text-white">{state.climber.name}</strong> tõusis +{state.climber.delta} kohta!
            </span>
          </div>
        )}

        {/* Streak Announcement */}
        {state.streakEvent && state.phase === 'reveal' && state.streakEvent.streak >= 3 && (
          <div className="text-center mb-2">
            <span className="blitz-final-banner inline-flex items-center gap-2 font-display font-black text-amber-300 text-lg md:text-xl">
              <Flame className="text-orange-400 fill-orange-400" size={22} />
              {state.streakEvent.name} · {state.streakEvent.streak} järjest õigesti!
            </span>
          </div>
        )}

        {/* LOBBY PHASE */}
        {state.phase === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-white/70 text-lg mb-2">Liitu telefoniga — skanni QR-kood</p>
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
            <p className="text-white/50 text-sm mb-6">või ava brauseris ja sisesta mängukood</p>
            <p className="text-white/80 text-xl mb-6">
              <span className="text-amber-200 font-bold">{state.players.length}</span> mängijat valmis
            </p>

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

        {/* COUNTDOWN PHASE */}
        {state.phase === 'countdown' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-white/60 text-xl font-bold mb-4">
              Küsimus {(state.qIndex || 0) + 1}/{state.questions.length}
            </p>
            <CountdownBig state={state} />
          </div>
        )}

        {/* QUESTION & REVEAL PHASE */}
        {(state.phase === 'question' || state.phase === 'reveal') && q && (
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
            {state.teamsEnabled && (
              <div className="flex justify-center gap-10 mb-2 font-display font-black text-2xl">
                <span className="text-rose-400">A · {teamTotals(state).a}</span>
                <span className="text-sky-400">B · {teamTotals(state).b}</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-3 text-sm text-white/60">
              <span className="font-bold tracking-wide flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 font-mono">
                  {state.qIndex + 1} / {state.questions.length}
                </span>
                {q.type && q.type !== 'quiz' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold uppercase text-xs">
                    {q.type === 'true_false' ? 'Tõene / Väär' :
                     q.type === 'multi' ? 'Mitmikvastus' :
                     q.type === 'slider' ? 'Paku arv' :
                     q.type === 'type_answer' ? 'Kirjuta vastus' :
                     q.type === 'poll' ? 'Küsitlus' : q.type}
                  </span>
                )}
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
                    <i style={{ width: `${Math.max(0, Math.min(100, (remaining / currentDuration) * 100))}%` }} />
                  </div>
                </div>
              )}

              {state.phase === 'reveal' && (
                <span className="text-emerald-300 font-black uppercase tracking-widest text-sm bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-400/50">
                  {q.type === 'poll' ? 'Tulemused' : 'Õige vastus'}
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

            {/* Question Text */}
            <div className="blitz-q-card blitz-q-enter mb-5 max-w-4xl mx-auto w-full">
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

            {/* Kahoot-style Animated Bar Chart on Reveal */}
            {state.phase === 'reveal' && (q.type === 'quiz' || q.type === 'true_false' || q.type === 'multi' || !q.type) && (
              <div className="my-4 max-w-2xl mx-auto w-full bg-black/40 border border-white/20 rounded-2xl p-4 backdrop-blur-md">
                <div className="text-xs uppercase font-bold tracking-widest text-white/50 text-center mb-3">
                  Vastuste jaotus
                </div>
                <div className="grid grid-cols-4 gap-3 h-32 items-end">
                  {[0, 1, 2, 3].map((idx) => {
                    if (q.type === 'true_false' && idx >= 2) return <div key={idx} />
                    const count = state.lastAnswerDist?.[idx] || 0
                    const pct = totalAnswersInReveal > 0 ? Math.round((count / totalAnswersInReveal) * 100) : 0
                    const isCorrect = q.type === 'multi'
                      ? (q.multiCorrect || [q.correct]).includes(idx)
                      : q.correct === idx
                    const style = BLITZ_ANSWER_STYLE[idx]

                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-end">
                        <div className="text-sm font-bold text-white mb-1 tabular-nums">
                          {count} <span className="text-xs text-white/50 font-normal">({pct}%)</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-t-xl overflow-hidden relative flex items-end h-24 border border-white/10">
                          <div
                            className={`w-full transition-all duration-700 rounded-t-lg ${style.bg} ${
                              isCorrect ? 'ring-2 ring-emerald-300 ring-offset-1 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'opacity-60'
                            }`}
                            style={{ height: `${Math.max(12, pct)}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs font-bold text-white/80">
                          <span>{style.label}</span>
                          {isCorrect && <span className="text-emerald-400 font-black">✓</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Slider Reveal info */}
            {state.phase === 'reveal' && q.type === 'slider' && (
              <div className="my-4 max-w-xl mx-auto w-full bg-amber-950/40 border-2 border-amber-400/50 rounded-2xl p-4 text-center backdrop-blur-md shadow-[0_0_30px_rgba(251,191,36,0.25)]">
                <div className="text-xs uppercase font-bold tracking-widest text-amber-300/80 mb-1">
                  Õige number
                </div>
                <div className="text-4xl md:text-5xl font-display font-black text-amber-300">
                  {q.sliderTarget} {q.sliderUnit || ''}
                </div>
                <div className="mt-2 text-sm text-white/70">
                  Vahemik oli: {q.sliderMin ?? 0} – {q.sliderMax ?? 100}
                </div>
              </div>
            )}

            {/* Type Answer Reveal info */}
            {state.phase === 'reveal' && q.type === 'type_answer' && (
              <div className="my-4 max-w-xl mx-auto w-full bg-emerald-950/40 border-2 border-emerald-400/50 rounded-2xl p-4 text-center backdrop-blur-md shadow-[0_0_30px_rgba(52,211,153,0.25)]">
                <div className="text-xs uppercase font-bold tracking-widest text-emerald-300/80 mb-1">
                  Aktsepteeritud vastused
                </div>
                <div className="text-3xl md:text-4xl font-display font-black text-emerald-300">
                  {(q.acceptedAnswers && q.acceptedAnswers.length ? q.acceptedAnswers : [q.choices[q.correct]]).join(' · ')}
                </div>
              </div>
            )}

            {/* Question Choices Grid */}
            <div className={`grid ${q.type === 'true_false' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-3 md:gap-4 flex-1 content-center max-w-5xl mx-auto w-full`}>
              {q.choices.map((c, i) => {
                if (q.type === 'true_false' && i >= 2) return null
                if (!c && (q.type === 'slider' || q.type === 'type_answer')) return null
                const isCorrect = q.type === 'multi'
                  ? (q.multiCorrect || [q.correct]).includes(i)
                  : q.correct === i
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
                    <span className="flex-1">{c || `Valik ${st.label}`}</span>
                    {show && isCorrect && <span className="text-3xl font-black text-emerald-300">✓</span>}
                  </div>
                )
              })}
            </div>

            {/* Waiting for answers note */}
            {state.phase === 'question' && state.players.length > 0 && (
              <div className="mt-4 text-center text-sm text-white/50">
                {(() => {
                  const waiting = state.players.filter((pl) => !state.answers?.[pl.id])
                  if (!waiting.length) return <span className="text-emerald-300 font-bold">Kõik on vastanud!</span>
                  return (
                    <span>
                      Ootame veel:{' '}
                      {waiting.map((pl) => (pl.avatar || '') + ' ' + pl.name).join(', ')}
                    </span>
                  )
                })()}
              </div>
            )}

            {/* Photo finish */}
            {state.phase === 'reveal' && (state.lastPhotoFinish?.length || 0) > 0 && (
              <div className="mt-4 mx-auto max-w-lg rounded-2xl border-2 border-cyan-400/50 bg-gradient-to-b from-cyan-950/80 to-black/80 px-5 py-3.5 shadow-[0_0_35px_rgba(34,211,238,0.25)] backdrop-blur-md">
                <div className="flex items-center justify-center gap-2 text-cyan-200 text-sm md:text-base font-black uppercase tracking-[0.2em] mb-2.5">
                  <Zap className="text-amber-300 fill-amber-300" size={18} />
                  <span>Photo Finish · Kiireimad vastajad</span>
                </div>
                <ol className="space-y-1.5">
                  {state.lastPhotoFinish!.slice(0, 5).map((row, i) => (
                    <li
                      key={row.playerId}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2 transition-all ${
                        i === 0
                          ? 'bg-gradient-to-r from-amber-500/30 via-cyan-500/20 to-transparent border border-amber-400/50 text-white font-bold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                          : 'bg-white/5 text-white/85 border border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-black text-sm w-6 text-center ${i === 0 ? 'text-amber-300 text-base' : 'text-cyan-300'}`}>
                          {i === 0 ? '⚡ 1.' : `${i + 1}.`}
                        </span>
                        <span className="font-bold truncate text-sm md:text-base">{row.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-cyan-200/90 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-400/30 tabular-nums">
                          {(row.atMs / 1000).toFixed(2)}s
                        </span>
                        <span className="text-emerald-300 font-black tabular-nums text-sm md:text-base">
                          +{row.points}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Leaderboard preview on reveal */}
            {state.phase === 'reveal' && (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {ranked.slice(0, 6).map((p, i) => (
                  <div
                    key={p.id}
                    className={`rounded-2xl border px-4 py-2 text-center min-w-[6.5rem] backdrop-blur-sm shadow-md transition ${
                      (p.streak || 0) >= 3
                        ? 'bg-orange-950/40 border-orange-400/60 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                        : 'bg-black/40 border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] text-white/50">
                      <span>{i + 1}.</span>
                      {(p.streak || 0) >= 2 && (
                        <span className="text-orange-400 font-black flex items-center">
                          🔥 {p.streak}
                        </span>
                      )}
                    </div>
                    <div className="text-amber-200 font-bold truncate max-w-[9rem]">
                      {p.avatar ? p.avatar + ' ' : ''}{p.name}
                    </div>
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

        {/* MIDBOARD PHASE */}
        {state.phase === 'midboard' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="font-display text-4xl md:text-5xl text-amber-300 font-black mb-6">Vaheseis</p>
            <div className="w-full max-w-md space-y-2">
              {ranked.slice(0, 8).map((pl, i) => (
                <div
                  key={pl.id}
                  className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-lg backdrop-blur-md"
                >
                  <span className="font-bold flex items-center gap-2">
                    <span className="text-amber-300 font-mono w-6">{i + 1}.</span>
                    {pl.avatar ? <span>{pl.avatar}</span> : null}
                    <span>{pl.name}</span>
                    {(pl.streak || 0) >= 2 && <span className="text-orange-400 text-sm">🔥 {pl.streak}</span>}
                  </span>
                  <span className="font-display font-black text-amber-200">{pl.score} p</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PODIUM PHASE */}
        {state.phase === 'podium' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Trophy className="text-amber-300 mb-3 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce" size={64} />
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
            <div className="flex items-end justify-center gap-3 md:gap-6 mb-8">
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
                    <div className="text-3xl mb-1">{medal}</div>
                    <div className="font-display font-black text-amber-200 text-lg md:text-2xl mb-1 truncate max-w-full">
                      {p.avatar ? p.avatar + ' ' : ''}{p.name}
                    </div>
                    <div className="text-white/60 text-sm mb-2">{p.score} p</div>
                    <div
                      className={`${h} w-full rounded-t-2xl border-2 border-amber-300/50 bg-gradient-to-t from-amber-500/60 to-amber-100/10 flex items-start justify-center pt-3 font-display font-black text-3xl text-amber-100 blitz-podium-glow`}
                    >
                      {place + 1}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Special Honor Titles */}
            {(() => {
              const bestStreakPlayer = [...ranked].sort((a, b) => (b.bestStreak || 0) - (a.bestStreak || 0))[0]
              return (
                <div className="flex flex-wrap justify-center gap-3 mb-6 max-w-2xl">
                  {bestStreakPlayer && (bestStreakPlayer.bestStreak || 0) >= 3 && (
                    <div className="px-4 py-2 rounded-2xl bg-orange-950/50 border border-orange-400/50 flex items-center gap-2 text-xs md:text-sm text-orange-200">
                      <Flame className="text-orange-400 fill-orange-400" size={16} />
                      <span><strong>{bestStreakPlayer.name}</strong> · Pikim seeria ({bestStreakPlayer.bestStreak} järjest!)</span>
                    </div>
                  )}
                  {ranked[0] && (
                    <div className="px-4 py-2 rounded-2xl bg-amber-950/50 border border-amber-400/50 flex items-center gap-2 text-xs md:text-sm text-amber-200">
                      <Trophy className="text-amber-400" size={16} />
                      <span>Mängu meister: <strong>{ranked[0].name}</strong></span>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="w-full max-w-md space-y-1.5">
              {ranked.map((p, i) => (
                <div
                  key={p.id}
                  className="flex justify-between px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-white/50 w-5">{i + 1}.</span>
                    {p.avatar ? <span>{p.avatar}</span> : null}
                    <span>{p.name}</span>
                    {(p.bestStreak || 0) >= 3 && <span className="text-xs text-orange-400">🔥 max {p.bestStreak}</span>}
                  </span>
                  <span className="font-display font-bold text-amber-200">{p.score} p</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BlitzStage>
  )
}

function FloatingReactions({ reactions }: { reactions: { id: string; emoji: string; playerName?: string; at: number }[] }) {
  const [activeList, setActiveList] = useState<{ id: string; emoji: string; left: number }[]>([])

  useEffect(() => {
    if (!reactions.length) return
    const recent = reactions.slice(-10).map((r, i) => ({
      id: r.id,
      emoji: r.emoji,
      left: 10 + ((i * 17 + parseInt(r.id.slice(-2), 16) || 20) % 80),
    }))
    setActiveList(recent)
  }, [reactions])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-30">
      {activeList.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-6 text-4xl md:text-5xl animate-[blitzFloatUp_2.8s_ease-out_forwards]"
          style={{ left: `${r.left}%` }}
        >
          {r.emoji}
        </div>
      ))}
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
    <div className="font-display font-black text-[8rem] md:text-[12rem] text-amber-300 tabular-nums leading-none drop-shadow-[0_0_40px_rgba(251,191,36,0.5)] animate-pulse">
      {n > 0 ? n : 'GO!'}
    </div>
  )
}
