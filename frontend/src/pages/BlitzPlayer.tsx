import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import type { BlitzChoice, BlitzState, BlitzTeamId } from '@/games/blitz/types'
import { sortedPlayers } from '@/games/blitz/types'
import { joinPlayer, setPlayerTeam } from '@/games/blitz/logic'
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-300 font-display font-black text-lg">
              <Zap size={20} /> Blitz
            </div>
            <div className="flex items-center gap-2">
              {conn === 'ok' ? (
                <Wifi size={14} className="text-emerald-400" />
              ) : conn === 'weak' ? (
                <Wifi size={14} className="text-amber-400" />
              ) : (
                <WifiOff size={14} className="text-rose-400" />
              )}
              <span className="text-[10px] tracking-widest text-white/50 border border-white/20 rounded-full px-2 py-0.5">
                {code}
              </span>
            </div>
          </div>

          {!joined && (
            <div className="rounded-2xl border border-amber-300/40 bg-black/30 backdrop-blur-md p-4 space-y-3">
              <p className="text-sm text-white/70">Sisesta nimi — sisselogimist pole vaja.</p>
              {error && <p className="text-rose-400 text-xs">{error}</p>}
              <input
                className="input-field"
                placeholder="Sinu nimi"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onJoin()}
              />
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
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-amber-200 font-bold text-base">{me.name}</span>
                <span className="text-white/60">
                  <span className="font-display font-black text-white text-lg">{me.score}</span> p
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
                  {isFinal && (
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
                  <p className="text-center text-white/50 text-xs mb-2">
                    {(state.qIndex || 0) + 1}/{state.questions?.length || 0}
                    <PlayerTimer state={state} />
                  </p>
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
                      <p className="text-center font-bold text-lg mb-5 leading-snug text-white">
                        {q.q}
                      </p>
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
                          {(q.choices || []).map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              disabled={busy}
                              onClick={() => onAnswer(i as BlitzChoice)}
                              className={`blitz-answer ${BLITZ_ANSWER_STYLE[i]?.bg || 'bg-white/20'} min-h-[3.75rem] px-4 py-3 text-left font-bold text-base text-white flex items-center gap-3 disabled:opacity-60`}
                            >
                              <AnswerShape index={i} />
                              <span className="flex-1">{c}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {phase === 'reveal' && (
                <div className="text-center space-y-3 py-8">
                  {q ? (
                    <>
                      <p className="text-white/50 text-sm">Õige vastus</p>
                      <p className="text-xl font-bold text-emerald-300 flex items-center justify-center gap-2">
                        <AnswerShape index={q.correct} />
                        {q.choices?.[q.correct]}
                      </p>
                      {myAnswer && (
                        <p
                          className={`text-sm font-bold ${
                            myAnswer.choice === q.correct ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {myAnswer.choice === q.correct ? 'Sul oli õige!' : 'Seekord valesti'}
                        </p>
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
              {!['lobby', 'countdown', 'question', 'reveal', 'podium'].includes(phase) && (
                <p className="text-center text-white/50 py-10">Ootan hosti… ({phase})</p>
              )}
            </>
          )}
        </div>
      </div>
    </BlitzStage>
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
