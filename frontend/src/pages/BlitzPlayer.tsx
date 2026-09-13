import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import type { BlitzChoice, BlitzState, BlitzTeamId } from '@/games/blitz/types'
import { sortedPlayers } from '@/games/blitz/types'
import { joinPlayer, setPlayerTeam, usePowerUp, NICK_SUGGESTIONS, setPlayerReady, setPlayerAvatar } from '@/games/blitz/logic'
import type { BlitzPowerUp } from '@/games/blitz/types'
import { submitAnswerWithRetry, joinWithRetry, sendReactionWithRetry } from '@/games/blitz/submitAnswer'
import { playFx } from '@/lib/audio'
import { Zap, Loader2, Wifi, WifiOff, CheckCircle2, XCircle, Flame, Send, Sliders, Lock } from 'lucide-react'
import { BlitzStage, AnswerShape, BLITZ_ANSWER_STYLE } from '@/games/blitz/BlitzStage'
import { motion, AnimatePresence } from 'framer-motion'

const PID_KEY = 'ohtu_blitz_pid'
const NAME_KEY = 'ohtu_blitz_name'
const AVATAR_KEY = 'ohtu_blitz_avatar'

const AVATAR_OPTIONS = ['🦊', '🦁', '🐯', '🐼', '🦄', '🚀', '👑', '⚡', '🎸', '🎮', '🎯', '🍕', '🍦', '💎', '🐉', '🐱']
const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '💡', '🚀']

export default function BlitzPlayer() {
  const { code: codeParam } = useParams<{ code: string }>()
  const code = (codeParam || '').toUpperCase()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [state, setState] = useState<BlitzState | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || '🦊')
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(PID_KEY) || '')
  const [busy, setBusy] = useState(false)
  const [joined, setJoined] = useState(false)
  const [conn, setConn] = useState<'ok' | 'weak' | 'off'>('ok')
  const [answerErr, setAnswerErr] = useState('')
  const answering = useRef(false)
  const [scorePop, setScorePop] = useState<number | null>(null)
  const prevScore = useRef<number | null>(null)

  // Local state for interactive question types
  const [multiSelected, setMultiSelected] = useState<number[]>([])
  const [typedText, setTypedText] = useState('')
  const [sliderValue, setSliderValue] = useState<number>(50)

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
  const isGolden = q?.pointsMultiplier === 2 || isFinal

  // Reset answer controls when question changes
  useEffect(() => {
    setMultiSelected([])
    setTypedText('')
    if (q?.type === 'slider') {
      const mid = Math.round(((q.sliderMin ?? 0) + (q.sliderMax ?? 100)) / 2)
      setSliderValue(mid)
    }
  }, [state?.qIndex, state?.phase])

  // Session connection and polling
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

  // Score pop animation
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

  // Reveal feedback sounds & haptics
  const lastRevealQ = useRef<number | null>(null)
  useEffect(() => {
    if (!state || state.phase !== 'reveal' || !playerId) return
    if (lastRevealQ.current === state.qIndex) return
    lastRevealQ.current = state.qIndex
    const pts = state.lastRoundPoints?.[playerId]
    if (pts == null) return
    if (pts > 0) {
      playFx('correct')
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([45, 35, 75])
        } catch {}
      }
    } else {
      playFx('wrong')
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(80)
        } catch {}
      }
    }
  }, [state?.phase, state?.qIndex, state?.lastRoundPoints, playerId])

  async function onJoin() {
    if (!state || !sessionId || !name.trim() || busy) return
    localStorage.setItem(NAME_KEY, name.trim())
    localStorage.setItem(AVATAR_KEY, selectedAvatar)
    setBusy(true)
    setError('')
    const res = await joinWithRetry({
      sessionId,
      name: name.trim(),
      existingId: playerId || undefined,
      isLocal,
      joinFn: (s, n, id) => {
        const j = joinPlayer(s, n, id)
        return {
          state: setPlayerAvatar(j.state, j.playerId, selectedAvatar),
          playerId: j.playerId,
        }
      },
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

  async function handleAvatarChange(av: string) {
    setSelectedAvatar(av)
    localStorage.setItem(AVATAR_KEY, av)
    if (!sessionId || !playerId) return
    try {
      if (isLocal) {
        const key = `session_${sessionId}`
        const raw = localStorage.getItem(key)
        if (!raw) return
        const s = setPlayerAvatar(JSON.parse(raw), playerId, av)
        localStorage.setItem(key, JSON.stringify(s))
        setState(s)
      } else {
        const rec = await pb.collection('game_sessions').getOne(sessionId)
        const s = setPlayerAvatar(rec.state as BlitzState, playerId, av)
        await pb.collection('game_sessions').update(sessionId, { state: s })
        setState(s)
      }
      playFx('click')
    } catch {}
  }

  async function onAnswerSingle(choice: BlitzChoice) {
    if (!sessionId || !playerId || state?.phase !== 'question' || myAnswer || answering.current) return
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35)
      } catch {}
    }
    answering.current = true
    setBusy(true)
    setAnswerErr('')
    const res = await submitAnswerWithRetry({
      sessionId,
      playerId,
      choice,
      answerData: choice,
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

  async function onAnswerPayload(payload: { choices?: number[]; textAnswer?: string; numericAnswer?: number }) {
    if (!sessionId || !playerId || state?.phase !== 'question' || myAnswer || answering.current) return
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35)
      } catch {}
    }
    answering.current = true
    setBusy(true)
    setAnswerErr('')
    const res = await submitAnswerWithRetry({
      sessionId,
      playerId,
      answerData: payload,
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

  async function sendReaction(emoji: string) {
    if (!sessionId) return
    playFx('click')
    await sendReactionWithRetry({
      sessionId,
      emoji,
      playerName: me?.name,
      isLocal,
    })
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
      <div className="min-h-screen pb-20 flex flex-col justify-between">
        <div className="max-w-md mx-auto w-full px-3 pt-4 flex-1">
          {/* Header bar */}
          <div className="blitz-header-bar mb-3">
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

          {/* Join Screen */}
          {!joined && (
            <div className="blitz-glass rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="text-center">
                <p className="text-lg font-bold text-white mb-1">Tere tulemast mängu!</p>
                <p className="text-xs text-white/60">Vali avatar ja sisesta oma nimi</p>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1.5">Sinu avatar:</label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-black/30 rounded-xl border border-white/10">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`text-2xl p-1 rounded-lg transition-transform ${
                        selectedAvatar === av ? 'bg-amber-400/30 scale-125 border border-amber-300' : 'hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-rose-400 text-xs">{error}</p>}

              <input
                className="input-field text-lg font-bold text-center"
                placeholder="Sinu mängijanimi"
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onJoin()}
              />

              <div className="flex flex-wrap gap-1 justify-center">
                {NICK_SUGGESTIONS.slice(0, 5).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/20"
                    onClick={() => setName(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn-gold w-full text-base py-3"
                disabled={!name.trim() || busy}
                onClick={onJoin}
              >
                {busy ? 'Liitun…' : 'Ühine mänguga'}
              </button>
            </div>
          )}

          {/* Reconnect notice */}
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

          {/* Player Active HUD */}
          {joined && me && (
            <>
              {/* Player Top Card */}
              <div className="blitz-glass flex justify-between items-center mb-3 text-sm rounded-xl px-3 py-2 border border-white/15">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{me.avatar || '🦊'}</span>
                  <span className="text-amber-200 font-bold text-base">{me.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-white text-lg">{me.score}</span>{' '}
                  <span className="text-white/60 text-xs">p</span>
                  {scorePop != null && scorePop > 0 && (
                    <span className="ml-1 text-emerald-300 font-black text-sm animate-bounce">+{scorePop}</span>
                  )}
                  {myRank > 0 && (
                    <div className="text-[11px] text-amber-300/80 font-bold">
                      #{myRank}. koht
                      {(me.streak || 0) > 1 && <span className="ml-1 text-orange-400">🔥{me.streak}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* LOBBY PHASE */}
              {phase === 'lobby' && (
                <div className="text-center py-6 text-white/70 space-y-4">
                  <div className="blitz-glass p-5 rounded-2xl border border-white/10 space-y-3">
                    <p className="text-2xl font-bold text-white">Oled mängus sees!</p>
                    <p className="text-sm text-white/60">Ootame, kuni mängujuht alustab…</p>

                    {/* Change Avatar */}
                    <div className="pt-2">
                      <p className="text-xs text-white/50 mb-2">Vaheta oma avatari:</p>
                      <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
                        {AVATAR_OPTIONS.slice(0, 8).map((av) => (
                          <button
                            key={av}
                            type="button"
                            onClick={() => handleAvatarChange(av)}
                            className={`text-xl p-1.5 rounded-lg border transition ${
                              me.avatar === av ? 'bg-amber-400/30 border-amber-300 scale-110' : 'border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {av}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="button"
                        className={`w-full py-3.5 rounded-xl font-bold border-2 transition text-base ${
                          me.ready
                            ? 'bg-emerald-600 border-emerald-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                            : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
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
                        {me.ready ? '✓ Olen 100% valmis!' : 'Märgi end valmis!'}
                      </button>
                    </div>

                    {state.teamsEnabled && (
                      <div className="pt-3">
                        <p className="text-xs text-white/50 mb-2">Vali oma meeskond:</p>
                        <div className="flex justify-center gap-3">
                          {(['a', 'b'] as const).map((tid) => (
                            <button
                              key={tid}
                              type="button"
                              className={`flex-1 py-2.5 rounded-xl font-bold border-2 ${
                                me.team === tid
                                  ? tid === 'a'
                                    ? 'bg-rose-600 border-rose-300 text-white'
                                    : 'bg-sky-600 border-sky-300 text-white'
                                  : 'bg-white/10 border-white/25 text-white/80'
                              }`}
                              onClick={() => pickTeam(tid)}
                            >
                              Tiim {tid.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COUNTDOWN PHASE */}
              {phase === 'countdown' && (
                <div className="text-center py-14">
                  {isGolden && (
                    <p className="inline-block px-3 py-1 rounded-full bg-amber-400/25 border border-amber-400/60 text-amber-300 text-xs font-black uppercase mb-4 animate-pulse">
                      ★ 2X PUNKTID! ★
                    </p>
                  )}
                  <p className="text-white/60 text-sm mb-2">
                    Küsimus {(state.qIndex || 0) + 1}/{state.questions?.length || '?'}
                  </p>
                  <p className="text-white/40 text-sm mb-4">Ole valmis!</p>
                  <PlayerCountdown state={state} />
                </div>
              )}

              {/* QUESTION PHASE */}
              {phase === 'question' && (
                <div>
                  {isGolden && (
                    <p className="text-center text-amber-300 text-xs font-black uppercase mb-1 bg-amber-500/20 py-1 rounded-lg border border-amber-400/40">
                      ★ 2X PUNKTID! ★
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                    <span>
                      {(state.qIndex || 0) + 1}/{state.questions?.length || 0}
                    </span>
                    <PlayerTimer state={state} />
                  </div>
                  <QuestionProgress state={state} />

                  {!q ? (
                    <p className="text-center text-white/50 py-10">Küsimus laadib…</p>
                  ) : (
                    <>
                      {/* Question prompt summary */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="blitz-q-card mb-4 p-3.5 border-2 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      >
                        <p className="text-center font-bold text-base leading-snug text-white">{q.q}</p>
                      </motion.div>

                      {/* Power-ups */}
                      {state.powerUpsEnabled !== false && me.powers && !myAnswer && q.type !== 'slider' && q.type !== 'type_answer' && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-center gap-2 mb-3"
                        >
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
                              className="btn-outline !text-[11px] !py-1 !px-2.5 disabled:opacity-30 rounded-full"
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
                        </motion.div>
                      )}

                      {answerErr && <p className="text-center text-rose-400 text-xs mb-2">{answerErr}</p>}

                      {/* ANSWERED STATE - DRAMATIC SUSPENSE CARD */}
                      {myAnswer ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: 'spring', damping: 15 }}
                          className="text-center py-8 blitz-glass rounded-3xl p-6 border-2 border-cyan-400/50 shadow-[0_0_35px_rgba(34,211,238,0.25)] relative overflow-hidden"
                        >
                          <div className="relative mb-4 flex items-center justify-center">
                            <motion.div
                              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute w-20 h-20 rounded-full bg-cyan-400/20 -z-10"
                            />
                            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
                              <CheckCircle2 size={36} className="text-cyan-300" />
                            </div>
                          </div>
                          <p className="text-white font-display font-black text-2xl tracking-wide">Vastus lukustatud!</p>
                          <p className="text-cyan-200/80 text-sm mt-1.5 font-medium">Vaata telerit tulemuse selgumiseks…</p>

                          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/50">
                            <Zap size={14} className="text-amber-300 fill-amber-300" />
                            <span>Kiirus loeb! Foto-finiš arvestatakse.</span>
                          </div>
                        </motion.div>
                      ) : (
                        /* UNANSWERED: QUESTION TYPE CONTROLLERS */
                        <div>
                          {/* 1. QUIZ (4 CHOICES) */}
                          {(!q.type || q.type === 'quiz') && (
                            <div className="grid grid-cols-1 gap-2.5">
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
                                  <motion.button
                                    key={i}
                                    type="button"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.2 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={busy}
                                    onClick={() => onAnswerSingle(i as BlitzChoice)}
                                    className={`blitz-answer ${BLITZ_ANSWER_STYLE[i]?.bg || 'bg-white/20'} blitz-answer-tile text-base disabled:opacity-60 w-full active:scale-95 transition-all py-3.5 shadow-md`}
                                  >
                                    <span className="blitz-shape-badge">
                                      <AnswerShape index={i} />
                                    </span>
                                    <span className="flex-1 text-left font-bold">{c || `Valik ${BLITZ_ANSWER_STYLE[i].label}`}</span>
                                  </motion.button>
                                )
                              })}
                            </div>
                          )}

                          {/* 2. TRUE / FALSE */}
                          {q.type === 'true_false' && (
                            <div className="grid grid-cols-1 gap-3">
                              <motion.button
                                type="button"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={busy}
                                onClick={() => onAnswerSingle(0)}
                                className="blitz-answer bg-[#1368ce] text-xl font-bold py-6 w-full flex items-center justify-center gap-3 rounded-2xl active:scale-95 shadow-lg border-2 border-blue-300/40"
                              >
                                <span className="text-3xl">✓</span> TÕENE
                              </motion.button>
                              <motion.button
                                type="button"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={busy}
                                onClick={() => onAnswerSingle(1)}
                                className="blitz-answer bg-[#e21b3c] text-xl font-bold py-6 w-full flex items-center justify-center gap-3 rounded-2xl active:scale-95 shadow-lg border-2 border-rose-300/40"
                              >
                                <span className="text-3xl">✗</span> VÄÄR
                              </motion.button>
                            </div>
                          )}

                          {/* 3. MULTI-SELECT */}
                          {q.type === 'multi' && (
                            <div className="space-y-3">
                              <p className="text-xs text-amber-300 text-center font-bold">Vali kõik õiged vastused ja kinnita:</p>
                              <div className="grid grid-cols-1 gap-2.5">
                                {(q.choices || []).map((c, i) => {
                                  const isChecked = multiSelected.includes(i)
                                  return (
                                    <motion.button
                                      key={i}
                                      type="button"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: i * 0.04 }}
                                      whileTap={{ scale: 0.97 }}
                                      disabled={busy}
                                      onClick={() => {
                                        setMultiSelected((prev) =>
                                          prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                                        )
                                      }}
                                      className={`blitz-answer ${BLITZ_ANSWER_STYLE[i]?.bg || 'bg-white/20'} blitz-answer-tile text-base w-full py-3.5 border-2 transition-all ${
                                        isChecked ? 'ring-4 ring-white border-white scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-85'
                                      }`}
                                    >
                                      <span className="blitz-shape-badge">
                                        <AnswerShape index={i} />
                                      </span>
                                      <span className="flex-1 text-left font-bold">{c}</span>
                                      <span className="text-lg font-black">{isChecked ? '☑' : '☐'}</span>
                                    </motion.button>
                                  )
                                })}
                              </div>
                              <button
                                type="button"
                                disabled={busy || multiSelected.length === 0}
                                onClick={() => onAnswerPayload({ choices: multiSelected })}
                                className="btn-gold w-full py-3.5 text-base font-bold shadow-lg"
                              >
                                Kinnita valikud ({multiSelected.length})
                              </button>
                            </div>
                          )}

                          {/* 4. TYPE ANSWER */}
                          {q.type === 'type_answer' && (
                            <div className="space-y-3 blitz-glass p-5 rounded-2xl border border-white/20">
                              <p className="text-xs text-white/70 text-center">Kirjuta vastus siia:</p>
                              <input
                                autoFocus
                                className="input-field text-xl font-bold text-center py-3"
                                placeholder="Sinu vastus…"
                                value={typedText}
                                onChange={(e) => setTypedText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && typedText.trim()) {
                                    onAnswerPayload({ textAnswer: typedText.trim() })
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={busy || !typedText.trim()}
                                onClick={() => onAnswerPayload({ textAnswer: typedText.trim() })}
                                className="btn-gold w-full py-3.5 text-base font-bold flex items-center justify-center gap-2 shadow-lg"
                              >
                                <Send size={18} /> Saada vastus
                              </button>
                            </div>
                          )}

                          {/* 5. SLIDER GUESS */}
                          {q.type === 'slider' && (
                            <div className="space-y-4 blitz-glass p-5 rounded-2xl border border-white/20 text-center">
                              <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
                                <Sliders size={18} /> Paku arv
                              </div>
                              <div className="text-5xl font-display font-black text-amber-300 my-2">
                                {sliderValue} <span className="text-lg text-white/60 font-normal">{q.sliderUnit || ''}</span>
                              </div>
                              <input
                                type="range"
                                min={q.sliderMin ?? 0}
                                max={q.sliderMax ?? 100}
                                step={q.sliderStep ?? 1}
                                value={sliderValue}
                                onChange={(e) => setSliderValue(Number(e.target.value))}
                                className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                              />
                              <div className="flex justify-between text-xs text-white/50 px-1">
                                <span>{q.sliderMin ?? 0}</span>
                                <span>{q.sliderMax ?? 100}</span>
                              </div>
                              <div className="flex justify-center gap-3">
                                <button
                                  type="button"
                                  className="btn-outline px-3 py-1 text-sm font-bold"
                                  onClick={() => setSliderValue((v) => Math.max(q.sliderMin ?? 0, v - (q.sliderStep ?? 1)))}
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  className="btn-outline px-3 py-1 text-sm font-bold"
                                  onClick={() => setSliderValue((v) => Math.min(q.sliderMax ?? 100, v + (q.sliderStep ?? 1)))}
                                >
                                  +1
                                </button>
                              </div>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => onAnswerPayload({ numericAnswer: sliderValue })}
                                className="btn-gold w-full py-3.5 text-base font-bold shadow-lg mt-2"
                              >
                                Lukusta arv ({sliderValue})
                              </button>
                            </div>
                          )}

                          {/* 6. POLL */}
                          {q.type === 'poll' && (
                            <div className="grid grid-cols-1 gap-2.5">
                              {(q.choices || []).map((c, i) => {
                                if (!c) return null
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => onAnswerSingle(i as BlitzChoice)}
                                    className={`blitz-answer ${BLITZ_ANSWER_STYLE[i]?.bg || 'bg-white/20'} blitz-answer-tile text-base w-full py-3.5 active:scale-95`}
                                  >
                                    <span className="blitz-shape-badge">
                                      <AnswerShape index={i} />
                                    </span>
                                    <span className="flex-1 text-left font-bold">{c}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* REVEAL PHASE (KAHOOT-STYLE FEEDBACK) */}
              {phase === 'reveal' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                  className="space-y-4 py-4"
                >
                  {(() => {
                    const roundPts = state.lastRoundPoints?.[playerId] || 0
                    const wasCorrect = roundPts > 0
                    const answered = !!myAnswer

                    return (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className={`rounded-3xl p-6 text-center border-2 shadow-2xl transition-all ${
                          wasCorrect
                            ? 'bg-gradient-to-b from-emerald-950/90 to-black/80 border-emerald-400 text-white shadow-[0_0_40px_rgba(16,185,129,0.35)]'
                            : answered
                            ? 'bg-gradient-to-b from-rose-950/90 to-black/80 border-rose-500 text-white shadow-[0_0_40px_rgba(244,63,94,0.35)]'
                            : 'bg-black/40 border-white/20 text-white/80'
                        }`}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', damping: 10, stiffness: 260, delay: 0.05 }}
                          className="mb-2"
                        >
                          {wasCorrect ? (
                            <CheckCircle2 size={56} className="mx-auto text-emerald-300 drop-shadow-[0_0_15px_rgba(110,231,183,0.8)]" />
                          ) : answered ? (
                            <XCircle size={56} className="mx-auto text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.8)]" />
                          ) : (
                            <div className="text-4xl">⏳</div>
                          )}
                        </motion.div>

                        <p className="font-display font-black text-2xl md:text-3xl mb-1">
                          {wasCorrect ? 'Õige vastus!' : answered ? 'Kahjuks valesti!' : 'Aeg sai otsa!'}
                        </p>

                        {wasCorrect && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, type: 'spring' }}
                            className="my-3"
                          >
                            <span className="font-display font-black text-4xl text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                              +{roundPts} p
                            </span>
                            {isGolden && <span className="ml-2 text-xs font-black text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded-full">2X</span>}
                          </motion.div>
                        )}

                        {/* Photo Finish Rank on Mobile */}
                        {(() => {
                          const pfIdx = (state.lastPhotoFinish || []).findIndex((r) => r.playerId === playerId)
                          if (pfIdx >= 0) {
                            const pf = state.lastPhotoFinish![pfIdx]
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/25 border border-cyan-400/60 text-cyan-200 text-xs font-bold mb-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                              >
                                <Zap size={14} className="text-amber-300 fill-amber-300" />
                                <span>
                                  {pfIdx === 0 ? '⚡ 1. KIIREIM VASTAJA!' : `⚡ #${pfIdx + 1} kiirusega`} ({(pf.atMs / 1000).toFixed(2)}s)
                                </span>
                              </motion.div>
                            )
                          }
                          return null
                        })()}

                        {/* Streak Banner */}
                        {(me.streak || 0) >= 2 && wasCorrect && (
                          <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/30 border border-orange-400/50 text-orange-200 text-sm font-bold my-2 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                          >
                            <Flame size={16} className="fill-orange-400 text-orange-400 animate-pulse" />
                            {me.streak} järjest! (+{Math.min(200, ((me.streak || 0) - 1) * 50)}p seeriaboonus)
                          </motion.div>
                        )}

                        {/* Score and Position */}
                        <div className="mt-4 pt-4 border-t border-white/10 text-sm text-white/70">
                          <p>
                            Sinu punktid kokku: <strong className="text-white font-bold">{me.score} p</strong>
                          </p>
                          {myRank > 0 && (
                            <p className="mt-1 text-amber-300 font-bold">
                              Oled hetkel {myRank}. kohal ({state.players.length} mängijast)
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )
                  })()}
                </motion.div>
              )}

              {/* MIDBOARD PHASE */}
              {phase === 'midboard' && (
                <div className="py-4">
                  <p className="text-center text-amber-300 font-display text-2xl font-black mb-3">Vaheseis</p>
                  <div className="space-y-1.5">
                    {ranked.slice(0, 8).map((pl, i) => (
                      <div
                        key={pl.id}
                        className={`flex justify-between items-center px-3 py-2.5 rounded-xl text-sm ${
                          pl.id === playerId ? 'bg-amber-400/25 border-2 border-amber-300 font-bold text-white' : 'bg-white/10 text-white/80'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 text-white/50">{i + 1}.</span>
                          {pl.avatar ? <span>{pl.avatar}</span> : null}
                          <span>{pl.name}</span>
                        </span>
                        <span className="font-display font-bold text-amber-200">{pl.score} p</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PODIUM PHASE */}
              {phase === 'podium' && (
                <div className="py-6 text-center space-y-4">
                  <div className="text-5xl">{myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🏆'}</div>
                  <h2 className="text-3xl font-display font-black text-amber-300">
                    {myRank === 1 ? 'Palju õnne, võitja!' : myRank <= 3 ? 'Poodiumikoht käes!' : 'Mäng on lõppenud!'}
                  </h2>
                  <div className="blitz-glass p-5 rounded-2xl border border-white/20 max-w-xs mx-auto space-y-3">
                    <div>
                      <p className="text-xs text-white/60 mb-1">Sinu lõpptulemus:</p>
                      <p className="text-4xl font-display font-black text-white">{me.score} p</p>
                      <p className="text-base text-amber-300 font-bold mt-1">Koht: #{myRank}</p>
                    </div>

                    {(me.bestStreak || me.streak || 0) >= 2 && (
                      <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-orange-300">
                        <Flame size={14} className="fill-orange-400 text-orange-400" />
                        <span>Pikim võiduseeria: <strong>{me.bestStreak || me.streak} järjest!</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* PERSISTENT LIVE REACTION TRAY AT BOTTOM */}
        {joined && (
          <div className="sticky bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md border-t border-white/10 px-3 py-2 z-20">
            <div className="max-w-md mx-auto flex items-center justify-around">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider hidden xs:inline">Reageeri:</span>
              {REACTION_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => sendReaction(em)}
                  className="text-2xl p-1.5 rounded-full hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                  title={`Saada ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}
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
