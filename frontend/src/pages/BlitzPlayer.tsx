import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import type { BlitzChoice, BlitzState } from '@/games/blitz/types'
import { CHOICE_COLORS, sortedPlayers } from '@/games/blitz/types'
import { joinPlayer, setPlayerTeam } from '@/games/blitz/logic'
import type { BlitzTeamId } from '@/games/blitz/types'
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

  const me = useMemo(() => state?.players.find((p) => p.id === playerId), [state, playerId])
  const q = state?.questions[state.qIndex]
  const myAnswer = playerId && state ? state.answers[playerId] : undefined
  const ranked = useMemo(() => (state ? sortedPlayers(state.players) : []), [state])
  const myRank = me ? ranked.findIndex((p) => p.id === me.id) + 1 : 0

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
        setState(rec.state as BlitzState)
        setConn('ok')
        const pid = localStorage.getItem(PID_KEY)
        if (pid && (rec.state as BlitzState).players?.some((p) => p.id === pid)) {
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
    const res = await submitAnswerWithRetry({
      sessionId,
      playerId,
      choice,
      isLocal,
    })
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050c18] text-gold">
        <Loader2 className="animate-spin mr-2" /> Laadin…
      </div>
    )
  }

  if (error && !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050c18] text-white px-4">
        <p className="text-accent-red mb-4 text-center">{error}</p>
        <button type="button" className="btn-outline text-sm mb-3" onClick={() => location.reload()}>
          Proovi uuesti
        </button>
        <Link to="/" className="text-gold text-sm">
          Avalehele
        </Link>
      </div>
    )
  }

  if (!state) return null

  const isFinal =
    state.questions.length > 0 &&
    state.qIndex === state.questions.length - 1 &&
    (state.phase === 'question' || state.phase === 'countdown' || state.phase === 'reveal')

  return (
    <BlitzStage final={isFinal} className="min-h-screen pb-10">
      <div className="max-w-md mx-auto px-3 pt-4 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-gold font-display font-black text-lg">
            <Zap size={20} /> Blitz
          </div>
          <div className="flex items-center gap-2">
            {conn === 'ok' ? (
              <Wifi size={14} className="text-emerald-400" />
            ) : conn === 'weak' ? (
              <Wifi size={14} className="text-amber-400" />
            ) : (
              <WifiOff size={14} className="text-accent-red" />
            )}
            <span className="text-[10px] tracking-widest text-white/40 border border-white/15 rounded-full px-2 py-0.5">
              {code}
            </span>
          </div>
        </div>

        {!joined && (
          <div className="card-panel border-gold/40 p-4 space-y-3">
            <p className="text-sm text-white/60">Nimi ja ühine — sisselogimist pole.</p>
            {error && <p className="text-accent-red text-xs">{error}</p>}
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

        {joined && me && (
          <>
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-gold font-bold">{me.name}</span>
              <span className="text-white/50">
                {me.score} p{myRank > 0 ? ` · #${myRank}` : ''}
                {(me.streak || 0) > 1 && (
                  <span className="text-amber-300 ml-1">🔥{me.streak}</span>
                )}
              </span>
            </div>

            {state.phase === 'lobby' && (
              <div className="text-center py-10 text-white/50 space-y-4">
                <p className="text-lg">Ootame hosti…</p>
                <p className="text-sm">{state.players.length} mängijat sees</p>
                {state.teamsEnabled && (
                  <div className="flex justify-center gap-3 pt-2">
                    {(['a', 'b'] as const).map((tid) => (
                      <button
                        key={tid}
                        type="button"
                        className={`px-5 py-3 rounded-xl font-bold border-2 ${
                          me.team === tid
                            ? tid === 'a'
                              ? 'bg-red-600 border-red-300'
                              : 'bg-blue-600 border-blue-300'
                            : 'bg-white/5 border-white/20'
                        }`}
                        onClick={async () => {
                          if (!sessionId) return
                          try {
                            if (isLocal) {
                              const key = `session_${sessionId}`
                              const raw = localStorage.getItem(key)
                              if (!raw) return
                              const s = setPlayerTeam(JSON.parse(raw), playerId, tid as BlitzTeamId)
                              localStorage.setItem(key, JSON.stringify(s))
                              setState(s)
                            } else {
                              const rec = await pb.collection('game_sessions').getOne(sessionId)
                              const s = setPlayerTeam(rec.state as BlitzState, playerId, tid as BlitzTeamId)
                              await pb.collection('game_sessions').update(sessionId, { state: s })
                              setState(s)
                            }
                            playFx('click')
                          } catch {}
                        }}
                      >
                        Tiim {tid.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {state.phase === 'countdown' && (
              <div className="text-center py-16">
                <p className="text-white/40 text-sm mb-2">Valmis?</p>
                <PlayerCountdown state={state} />
              </div>
            )}

            {state.phase === 'question' && q && (
              <div>
                {isFinal && (
                  <p className="blitz-final-banner text-center text-rose-300 text-xs font-black uppercase mb-2">
                    ★ Viimane küsimus ★
                  </p>
                )}
                <p className="text-center text-white/50 text-xs mb-2">
                  {state.qIndex + 1}/{state.questions.length}
                  <PlayerTimer state={state} />
                </p>
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt=""
                    className="max-h-36 mx-auto mb-3 rounded-xl object-contain border border-white/10"
                  />
                )}
                <p className="text-center font-semibold text-base mb-4 leading-snug">{q.q}</p>
                {answerErr && (
                  <p className="text-center text-accent-red text-xs mb-2">{answerErr}</p>
                )}
                {myAnswer ? (
                  <div className="text-center py-8">
                    <p className="text-cyan-200 font-bold text-lg">Vastus salvestatud!</p>
                    <p className="text-white/40 text-sm mt-1">Oota telerit</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {q.choices.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={busy}
                        onClick={() => onAnswer(i as BlitzChoice)}
                        className={`blitz-answer ${BLITZ_ANSWER_STYLE[i].bg} min-h-[3.75rem] px-4 py-3 text-left font-bold text-base text-white flex items-center gap-3 disabled:opacity-60`}
                      >
                        <AnswerShape index={i} />
                        <span className="flex-1">{c}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {state.phase === 'reveal' && q && (
              <div className="text-center space-y-3 py-6">
                <p className="text-white/50 text-sm">Õige vastus</p>
                <p className="text-xl font-bold text-emerald-300">
                  {CHOICE_COLORS[q.correct].label}: {q.choices[q.correct]}
                </p>
                {state.lastRoundPoints[playerId] != null && (
                  <p className="text-gold font-display text-3xl font-black">
                    +{state.lastRoundPoints[playerId]}
                  </p>
                )}
                <p className="text-white/60">Kokku {me.score} p</p>
              </div>
            )}

            {state.phase === 'podium' && (
              <div className="py-6">
                <p className="text-center text-gold font-display text-2xl font-black mb-4">Lõpp!</p>
                <div className="space-y-1">
                  {ranked.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex justify-between px-3 py-2 rounded-xl text-sm ${
                        p.id === playerId ? 'bg-gold/20 border border-gold/40' : 'bg-white/5'
                      }`}
                    >
                      <span>
                        {i + 1}. {p.name}
                      </span>
                      <span className="font-display font-bold">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BlitzStage>
  )
}