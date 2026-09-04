import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import type { BlitzChoice, BlitzState, BlitzTeamId } from '@/games/blitz/types'
import { sortedPlayers } from '@/games/blitz/types'
import { joinPlayer, setPlayerTeam, usePowerUp, NICK_SUGGESTIONS, setPlayerReady } from '@/games/blitz/logic'
import type { BlitzPowerUp } from '@/games/blitz/types'
import { submitAnswerWithRetry, joinWithRetry } from '@/games/blitz/submitAnswer'
import { playFx } from '@/lib/audio'
import { Zap, Loader2, Wifi, WifiOff } from 'lucide-react'
import { BlitzStage, AnswerShape, BLITZ_ANSWER_STYLE } from '@/games/blitz/BlitzStage'

const PID_KEY = 'ohtu_blitz_pid'
const NAME_KEY = 'ohtu_blitz_name'

export default function BlitzPlayer() {
  const { code: codeParam } = useParams<{ code: string }>()
  const code = (codeParam || '').toUpperCase()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [state, setState] = useState<BlitzState | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(PID_KEY) || '')
  const [busy, setBusy] = useState(false)
  const [joined, setJoined] = useState(false)
  const [conn, setConn] = useState<'ok' | 'weak' | 'off'>('ok')
  const [answerErr, setAnswerErr] = useState('')
  const answering = useRef(false)
  const [scorePop, setScorePop] = useState<number | null>(null)
  const prevScore = useRef<number | null>(null)

  const me = useMemo(
    () => (state && playerId ? state.players.find((p) => p.id === playerId) : undefined),
    [state, playerId]
  )
  const q =
    state && state.questions?.length
      ? state.questions[Math.min(state.qIndex || 0, state.questions.length - 1)]
      : undefined
  const myAnswer = playerId && state?.answers ? state.answers[playerId] : undefined
  const ranked = useMemo(() => (state ? sortedPlayers(state.players || []) : []), [state])
  const myRank = me ? ranked.findIndex((p) => p.id === me.id) + 1 : 0
  const isFinal =
    !!state &&
    (state.questions?.length || 0) > 0 &&
    state.qIndex === state.questions.length - 1 &&
    (state.phase === 'question' || state.phase === 'countdown' || state.phase === 'reveal')

  useEffect(() => {
    if (!code) {
      setError('Puudub kood')
      setLoading(false)
      return
    }
    let unsub: (() => void) | null = null
    let cancelled = false
    ;(async () => {
      try {
        const list = await pb.collection('game_sessions').getList<GameSession>(1, 1, {
          filter: `code = "${code}"`,
        })
        if (!list.items.length) throw new Error('Sessiooni ei leitud')
        const rec = list.items[0]
        if (cancelled) return
        setSessionId(rec.id)
        setIsLocal(false)
        const st = rec.state as BlitzState
        setState(st)
        setConn('ok')
        const pid = localStorage.getItem(PID_KEY)
        if (pid && st.players?.some((p) => p.id === pid)) {
          setPlayerId(pid)
          setJoined(true)
        }
        unsub = await pb.collection('game_sessions').subscribe<GameSession>(rec.id, (e) => {
          if (e.action === 'update') {
            setState(e.record.state as BlitzState)
            setConn('ok')
          }
        })
      } catch (e: any) {
        let found = false
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key?.startsWith('session_')) continue
          try {
            const data = JSON.parse(localStorage.getItem(key)!) as BlitzState
            if (data.code?.toUpperCase() === code) {
              setSessionId(key.replace('session_', ''))
              setIsLocal(true)
              setState(data)
              found = true
              setConn('weak')
              const pid = localStorage.getItem(PID_KEY)
              if (pid && data.players?.some((p) => p.id === pid)) {
                setPlayerId(pid)
                setJoined(true)
              }
              const poll = window.setInterval(() => {
                const raw = localStorage.getItem(key)
                if (raw) setState(JSON.parse(raw))
              }, 400)
              unsub = () => clearInterval(poll)
              break
            }
          } catch {}
        }
        if (!found) {
          setError(e?.message || 'Ei leitud')
          setConn('off')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [code])

  useEffect(() => {
    if (!me) return
    if (prevScore.current != null && me.score > prevScore.current) {
      const delta = me.score - prevScore.current
      setScorePop(delta)
      prevScore.current = me.score
      const tm = window.setTimeout(() => setScorePop(null), 1200)
      return () => clearTimeout(tm)
    }
    prevScore.current = me.score ?? 0
  }, [me?.score])

  // Feedback sound on reveal for this player
  const lastRevealQ = useRef<number | null>(null)
  useEffect(() => {
    if (!state || state.phase !== 'reveal' || !playerId) return
    if (lastRevealQ.current === state.qIndex) return
    lastRevealQ.current = state.qIndex
    const pts = state.lastRoundPoints?.[playerId]
    if (pts == null) return
    if (pts > 0) playFx('correct')
    else playFx('wrong')
  }, [state?.phase, state?.qIndex, state?.lastRoundPoints, playerId])

  async function onJoin() {
    if (!state || !sessionId || !name.trim() || busy) return
    localStorage.setItem(NAME_KEY, name.trim())
    setBusy(true)
    setError('')
    const res = await joinWithRetry({
      sessionId,
      name: name.trim(),
      existingId: playerId || undefined,
      isLocal,
      joinFn: joinPlayer,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      setConn('weak')
      return
    }
    localStorage.setItem(PID_KEY, res.playerId)
    setPlayerId(res.playerId)
    setState(res.state)
    setJoined(true)
    setConn('ok')
    playFx('click')
  }

  async function onAnswer(choice: BlitzChoice) {
    if (!sessionId || !playerId || state?.phase !== 'question' || myAnswer || answering.current) return
    answering.current = true
    setBusy(true)
    setAnswerErr('')
    const res = await submitAnswerWithRetry({ sessionId, playerId, choice, isLocal })
    setBusy(false)
    answering.current = false
    if (!res.ok) {
      setAnswerErr(res.error + ' — proovi uuesti')
      setConn('weak')
      return
    }
    setState(res.state)
    setConn('ok')
    playFx('tick')
  }

  async function pickTeam(tid: BlitzTeamId) {
    if (!sessionId || !playerId) return
    try {
      if (isLocal) {
        const key = `session_${sessionId}`
        const raw = localStorage.getItem(key)
        if (!raw) return
        const s = setPlayerTeam(JSON.parse(raw), playerId, tid)
        localStorage.setItem(key, JSON.stringify(s))
        setState(s)
      } else {
        const rec = await pb.collection('game_sessions').getOne(sessionId)
        const s = setPlayerTeam(rec.state as BlitzState, playerId, tid)
        await pb.collection('game_sessions').update(sessionId, { state: s })
        setState(s)
      }
      playFx('click')
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0533] text-amber-300">
        <Loader2 className="animate-spin mr-2" /> Laadin…
      </div>
    )
  }

  if (error && !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a0533] text-white px-4">
        <p className="text-rose-400 mb-4 text-center">{error}</p>
        <button type="button" className="btn-outline text-sm mb-3" onClick={() => location.reload()}>
          Proovi uuesti
        </button>
        <Link to="/" className="text-amber-300 text-sm">
          Avalehele
        </Link>
      </div>
    )
  }

  if (!state) return null

  const phase = state.phase || 'lobby'

  return (
    <BlitzStage final={isFinal}>
      <div className="min-h-screen pb-12">
        <div className="max-w-md mx-auto px-3 pt-4">
          <div className="blitz-header-bar mb-4">
            <div className="flex items-center gap-2 font-display text-lg blitz-logo">
              <Zap size={18} className="text-amber-300" />
              BLITZ
              {(phase === 'question' || phase === 'countdown') && (
                <span className="blitz-live-dot ml-1" title="Live" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {conn === 'ok' ? (
                <Wifi size={14} className="text-emerald-400" />
              ) : conn === 'weak' ? (
                <Wifi size={14} className="text-amber-400" />
              ) : (
                <WifiOff size={14} className="text-rose-400" />
              )}
              <span className="blitz-code-pill !text-[10px] !px-2 !py-0.5 !tracking-[0.2em]">{code}</span>
            </div>
          </div>

          {!joined && (
            <div className="blitz-glass rounded-2xl p-5 space-y-3">
              <p className="text-sm text-white/70">Kirjuta nimi ja oota hosti. Sisselogimist pole.</p>
              {error && <p className="text-rose-400 text-xs">{error}</p>}
              <input
                className="input-field"
                placeholder="Sinu nimi"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onJoin()}
              />
              <div className="flex flex-wrap gap-1">
                {NICK_SUGGESTIONS.slice(0, 6).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/70"
                    onClick={() => setName(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-gold w-full"
                disabled={!name.trim() || busy}
                onClick={onJoin}
              >
                {busy ? 'Liitun…' : 'Ühine mänguga'}
              </button>
            </div>
          )}

          {joined && !me && (
            <div className="text-center py-10 space-y-3">
              <p className="text-white/70">Sinu nime ei leitud selles voorus.</p>
              <button
                type="button"
                className="btn-gold"
                onClick={() => {
                  setJoined(false)
                  localStorage.removeItem(PID_KEY)
                }}
              >
                Ühine uuesti
              </button>
            </div>
          )}

          {joined && me && (
            <>
              <div className="blitz-glass flex justify-between items-center mb-4 text-sm rounded-xl px-3 py-2">
                <span className="text-amber-200 font-bold text-base">
                  {me.avatar ? me.avatar + ' ' : ''}
                  {me.name}
                </span>
                <span className="text-white/60">
                  <span className="font-display font-black text-white text-lg">{me.score}</span> p
                  {scorePop != null && scorePop > 0 && (
                    <span className="ml-1 text-emerald-300 font-black text-sm">+{scorePop}</span>
                  )}
                  {myRank > 0 ? ` · #${myRank}` : ''}
                  {(me.streak || 0) > 1 && (
                    <span className="text-amber-300 ml-1">🔥{me.streak}</span>
                  )}
                </span>
              </div>

              {phase === 'lobby' && (
                <div className="text-center py-10 text-white/60 space-y-4">
                  <p className="text-xl text-white/80">Ootame hosti…</p>
                  <p className="text-sm">{state.players?.length || 0} mängijat sees</p>
                  <button
                    type="button"
                    className={`px-6 py-3 rounded-xl font-bold border-2 ${
                      me.ready
                        ? 'bg-emerald-600 border-emerald-300 text-white'
                        : 'bg-white/10 border-white/25'
                    }`}
                    onClick={async () => {
                      if (!sessionId) return
                      const next = !me.ready
                      try {
                        if (isLocal) {
                          const k = `session_${sessionId}`
                          const raw = localStorage.getItem(k)
                          if (!raw) return
                          const s = setPlayerReady(JSON.parse(raw), playerId, next)
                          localStorage.setItem(k, JSON.stringify(s))
                          setState(s)
                        } else {
                          const rec = await pb.collection('game_sessions').getOne(sessionId)
                          const s = setPlayerReady(rec.state as BlitzState, playerId, next)
                          await pb.collection('game_sessions').update(sessionId, { state: s })
                          setState(s)
                        }
                        playFx('click')
                      } catch {}
                    }}
                  >
                    {me.ready ? '✓ Olen valmis' : 'Vajuta: olen valmis'}
                  </button>
                  {state.requireReady && (
                    <p className="text-xs text-white/40">
                      Host ootab, et kõik oleksid valmis (
                      {state.players.filter((x) => x.ready).length}/{state.players.length})
                    </p>
                  )}
                  {state.teamsEnabled && (
                    <div className="flex justify-center gap-3 pt-2">
                      {(['a', 'b'] as const).map((tid) => (
                        <button
                          key={tid}
                          type="button"
                          className={`px-6 py-3 rounded-xl font-bold border-2 ${
                            me.team === tid
                              ? tid === 'a'
                                ? 'bg-rose-600 border-rose-300'
                                : 'bg-sky-600 border-sky-300'
                              : 'bg-white/10 border-white/25'
                          }`}
                          onClick={() => pickTeam(tid)}
                        >
                          Tiim {tid.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {phase === 'countdown' && (
                <div className="text-center py-16">
                  {state.isWarmup && (
                    <p className="text-cyan-300 text-sm font-black uppercase mb-4">
                      Proovivoor — punktid ei loe
                    </p>
                  )}
                  {state.suddenDeathActive && (
                    <p className="blitz-final-banner text-rose-300 text-sm font-black uppercase mb-4">
                      ★ Äkk-surm ★
                    </p>
                  )}
                  {isFinal && !state.isWarmup && !state.suddenDeathActive && (
                    <p className="blitz-final-banner text-rose-300 text-sm font-black uppercase mb-4">
                      ★ Viimane küsimus · 2× punktid ★
                    </p>
                  )}
                  <p className="text-white/50 text-sm mb-2">
                    Küsimus {(state.qIndex || 0) + 1}/{state.questions?.length || '?'}
                  </p>
                  <p className="text-white/40 text-sm mb-4">Valmis?</p>
                  <PlayerCountdown state={state} />
                </div>
              )}

              {phase === 'question' && (
                <div>
                  {isFinal && (
                    <p className="blitz-final-banner text-center text-rose-300 text-xs font-black uppercase mb-2">
                      ★ Viimane · 2× punktid ★
                    </p>
                  )}
                  <p className="text-center text-white/50 text-xs mb-1">
                    {(state.qIndex || 0) + 1}/{state.questions?.length || 0}
                    <PlayerTimer state={state} />
                  </p>
                  <QuestionProgress state={state} />
                  {!q ? (
                    <p className="text-center text-white/50 py-10">Küsimus laadib…</p>
                  ) : (
                    <>
                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt=""
                          className="max-h-36 mx-auto mb-3 rounded-xl object-contain border border-white/20"
                        />
                      )}
                      <div className="blitz-q-card mb-4">
                        <p className="text-center font-bold text-lg leading-snug text-white">{q.q}</p>
                      </div>

                      {state.powerUpsEnabled !== false && me.powers && !myAnswer && (
                        <div className="flex flex-wrap justify-center gap-2 mb-3">
                          {(
                            [
                              ['fifty', '50/50', me.powers.fifty],
                              ['double', '2×', me.powers.double],
                              ['time', '+5s', me.powers.time],
                            ] as [BlitzPowerUp, string, number | undefined][]
                          ).map(([key, label, left]) => (
                            <button
                              key={key}
                              type="button"
                              disabled={!left || busy || (key === 'double' && !!me.activeDouble)}
                              className="btn-outline !text-[11px] !py-1 !px-2 disabled:opacity-30"
                              onClick={async () => {
                                if (!sessionId) return
                                try {
                                  if (isLocal) {
                                    const k = `session_${sessionId}`
                                    const raw = localStorage.getItem(k)
                                    if (!raw) return
                                    const s = usePowerUp(JSON.parse(raw), playerId, key)
                                    localStorage.setItem(k, JSON.stringify(s))
                                    setState(s)
                                  } else {
                                    const rec = await pb.collection('game_sessions').getOne(sessionId)
                                    const s = usePowerUp(rec.state as BlitzState, playerId, key)
                                    await pb.collection('game_sessions').update(sessionId, { state: s })
                                    setState(s)
                                  }
                                  playFx('click')
                                } catch {}
                              }}
                            >
                              {label} ({left || 0})
                            </button>
                          ))}
                        </div>
                      )}
                      {me.activeDouble && !myAnswer && (
                        <p className="text-center text-amber-300 text-xs font-bold mb-2">2× aktiivne!</p>
                      )}
                      {answerErr && (
                        <p className="text-center text-rose-400 text-xs mb-2">{answerErr}</p>
                      )}
                      {myAnswer ? (
                        <div className="text-center py-10">
                          <p className="text-cyan-200 font-bold text-xl">Vastus salvestatud!</p>
                          <p className="text-white/45 text-sm mt-2">Oota tulemust teleril</p>
                          <div className="mt-4 flex justify-center">
                            <div
                              className={`blitz-answer ${BLITZ_ANSWER_STYLE[myAnswer.choice].bg} px-6 py-3 inline-flex items-center gap-2`}
                            >
                              <AnswerShape index={myAnswer.choice} />
                              {q.choices[myAnswer.choice]}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {(q.choices || []).map((c, i) => {
                            if (me.hiddenChoices?.includes(i)) {
                              return (
                                <div
                                  key={i}
                                  className="blitz-answer blitz-answer-tile text-base opacity-25 grayscale pointer-events-none"
                                >
                                  <span className="blitz-shape-badge">
                                    <AnswerShape index={i} />
                                  </span>
                                  <span className="flex-1 text-left">—</span>
                                </div>
                              )
                            }
                            return (
                              <button
                                key={i}
                                type="button"
                                disabled={busy}
                                onClick={() => onAnswer(i as BlitzChoice)}
                                className={`blitz-answer ${BLITZ_ANSWER_STYLE[i]?.bg || 'bg-white/20'} blitz-answer-tile text-base disabled:opacity-60 w-full`}
                              >
                                <span className="blitz-shape-badge">
                                  <AnswerShape index={i} />
                                </span>
                                <span className="flex-1 text-left">{c}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {phase === 'reveal' && (
                <div
                  className={`text-center space-y-3 py-8 rounded-2xl ${
                    myAnswer && q && myAnswer.choice === q.correct
                      ? 'blitz-flash-correct'
                      : myAnswer && q && myAnswer.choice !== q.correct
                        ? 'blitz-shake'
                        : ''
                  }`}
                >
                  {q ? (
                    <>
                      <p className="text-white/50 text-sm">Õige vastus</p>
                      <p className="text-xl font-bold text-emerald-300 flex items-center justify-center gap-2">
                        <AnswerShape index={q.correct} />
                        {q.choices?.[q.correct]}
                      </p>
                      {myAnswer && (
                        <p
                          className={`text-base font-black ${
                            myAnswer.choice === q.correct ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {myAnswer.choice === q.correct ? '✓ Sul oli õige!' : '✗ Seekord valesti'}
                        </p>
                      )}
                      {(state.lastPhotoFinish?.length || 0) > 0 && (
                        <div className="mt-4 text-left max-w-xs mx-auto rounded-xl bg-black/30 border border-cyan-400/25 px-3 py-2">
                          <p className="text-[10px] text-cyan-200 font-black uppercase mb-1">Photo finish</p>
                          {state.lastPhotoFinish!.slice(0, 3).map((row, i) => (
                            <div key={row.playerId} className="flex justify-between text-xs text-white/80">
                              <span>{i + 1}. {row.name}</span>
                              <span className="text-cyan-200">{(row.atMs / 1000).toFixed(2)}s</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-white/50">Tulemused…</p>
                  )}
                  {state.lastRoundPoints?.[playerId] != null && (
                    <p className="text-amber-300 font-display text-4xl font-black">
                      +{state.lastRoundPoints[playerId]}
                      {isFinal && (state.lastRoundPoints[playerId] || 0) > 0 && (
                        <span className="text-sm text-rose-300 ml-2">2×</span>
                      )}
                    </p>
                  )}
                  <p className="text-white/60">Kokku {me.score} p</p>
                  {(me.streak || 0) >= 2 && (
                    <p className="text-amber-300 font-black text-lg">🔥 Streak {me.streak}</p>
                  )}
                </div>
              )}

              {phase === 'midboard' && (
                <div className="py-6">
                  <p className="text-center text-amber-300 font-display text-2xl font-black mb-4">
                    Vaheseis
                  </p>
                  <div className="space-y-1.5">
                    {ranked.slice(0, 8).map((pl, i) => (
                      <div
                        key={pl.id}
                        className={`flex justify-between px-3 py-2 rounded-xl text-sm ${
                          pl.id === playerId
                            ? 'bg-amber-400/20 border border-amber-300/40'
                            : 'bg-white/10'
                        }`}
                      >
                        <span>
                          {i + 1}. {pl.name}
                        </span>
                        <span className="font-display font-bold">{pl.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'podium' && (
                <div className="py-6">
                  <p className="text-center text-amber-300 font-display text-3xl font-black mb-4">
                    Lõpp!
                  </p>
                  <div className="space-y-1.5">
                    {ranked.map((p, i) => (
                      <div
                        key={p.id}
                        className={`flex justify-between px-3 py-2.5 rounded-xl text-sm ${
                          p.id === playerId
                            ? 'bg-amber-400/20 border border-amber-300/50'
                            : 'bg-white/10 border border-white/10'
                        }`}
                      >
                        <span>
                          {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `}
                          {p.name}
                        </span>
                        <span className="font-display font-bold">{p.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unknown phase fallback */}
              {!['lobby', 'countdown', 'question', 'reveal', 'midboard', 'podium'].includes(phase) && (
                <p className="text-center text-white/50 py-10">Ootan hosti… ({phase})</p>
              )}
            </>
          )}
        </div>
      </div>
    </BlitzStage>
  )
}

function QuestionProgress({ state }: { state: BlitzState }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (state.phase !== 'question' || !state.questionStartedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [state.phase, state.questionStartedAt])
  if (state.phase !== 'question' || !state.questionStartedAt || !state.secondsPerQuestion) return null
  const left = Math.max(0, state.secondsPerQuestion - (now - state.questionStartedAt) / 1000)
  const pct = Math.max(0, Math.min(100, (left / state.secondsPerQuestion) * 100))
  return (
    <div className="blitz-progress mb-3 max-w-xs mx-auto">
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

function PlayerTimer({ state }: { state: BlitzState }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (state.phase !== 'question' || !state.questionStartedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [state.phase, state.questionStartedAt])
  if (state.phase !== 'question' || !state.questionStartedAt) return null
  const left = Math.max(
    0,
    Math.ceil(state.secondsPerQuestion - (now - state.questionStartedAt) / 1000)
  )
  return (
    <span
      className={`ml-2 font-display font-black tabular-nums ${
        left <= 5 ? 'blitz-timer-urgent text-rose-400' : 'text-amber-300'
      }`}
    >
      {left}s
    </span>
  )
}

function PlayerCountdown({ state }: { state: BlitzState }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!state.countdownStartedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 150)
    return () => clearInterval(id)
  }, [state.countdownStartedAt])
  const sec = state.preCountdownSeconds ?? 3
  const left = state.countdownStartedAt
    ? Math.max(0, Math.ceil(sec - (now - state.countdownStartedAt) / 1000))
    : sec
  return (
    <p className="font-display font-black text-7xl text-amber-300 tabular-nums drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">
      {left > 0 ? left : 'GO!'}
    </p>
  )
}
