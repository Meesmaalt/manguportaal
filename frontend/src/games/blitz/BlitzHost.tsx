import { useEffect, useMemo, useState } from 'react'
import type { BlitzState } from './types'
import { CHOICE_COLORS, sortedPlayers } from './types'
import {
  startQuestion,
  openQuestion,
  reveal,
  nextQuestion,
  removePlayer,
  restartQuiz,
  skipQuestion,
  skipQuestionVoid,
  toggleTeams,
  setPlayerTeam,
  teamTotals,
  startWarmup,
  continueAfterMidboard,
} from './logic'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { appUrl } from '@/lib/config'
import { playFx } from '@/lib/audio'
import { Tv, ExternalLink, Play, SkipForward, Eye, Trophy, UserMinus, Copy, Check } from 'lucide-react'

type Props = {
  state: BlitzState
  update: (p: Partial<BlitzState> | ((s: BlitzState) => BlitzState)) => void
  sessionCode?: string
  isHost?: boolean
}

export default function BlitzHost({ state, update, sessionCode, isHost = true }: Props) {
  const code = sessionCode || state.code || ''
  const [copied, setCopied] = useState(false)
  const q = state.questions[state.qIndex]
  const answered = Object.keys(state.answers).length
  const ranked = useMemo(() => sortedPlayers(state.players), [state.players])
  const teams = useMemo(() => teamTotals(state), [state])
  useEffect(() => {
    if (state.phase === 'podium') playFx('drumroll')
  }, [state.phase])
  const remaining = useCountdown(
    state.phase === 'question' ? state.questionStartedAt : undefined,
    state.secondsPerQuestion
  )
  const revealLeft = useCountdown(
    state.phase === 'reveal' ? state.revealStartedAt : undefined,
    state.revealSeconds || 0
  )

  const cdLeft = useCountdown(
    state.phase === 'countdown' ? state.countdownStartedAt : undefined,
    state.preCountdownSeconds ?? 3
  )

  // 3-2-1 → open question
  useEffect(() => {
    if (!isHost || state.phase !== 'countdown' || cdLeft == null) return
    if (cdLeft <= 0) {
      playFx('jingle')
      update((s) => openQuestion(s))
    }
  }, [cdLeft, state.phase, isHost]) // eslint-disable-line

  // Auto-close question when timer hits 0
  useEffect(() => {
    if (!isHost || state.phase !== 'question' || remaining == null) return
    if (remaining <= 0) {
      playFx('reveal')
      update((s) => reveal(s))
    }
  }, [remaining, state.phase, isHost]) // eslint-disable-line

  // All players answered → close early (don't wait for timer)
  useEffect(() => {
    if (!isHost || state.phase !== 'question') return
    if (state.players.length < 1) return
    if (answered >= state.players.length && answered > 0) {
      playFx('reveal')
      update((s) => {
        if (s.phase !== 'question') return s
        if (Object.keys(s.answers).length < s.players.length) return s
        return reveal(s)
      })
    }
  }, [answered, state.players.length, state.phase, isHost]) // eslint-disable-line

  // Auto-advance after reveal
  useEffect(() => {
    if (!isHost || state.phase !== 'reveal') return
    if (!state.revealSeconds || revealLeft == null) return
    if (revealLeft <= 0) {
      playFx('click')
      update((s) => nextQuestion(s))
    }
  }, [revealLeft, state.phase, isHost, state.revealSeconds]) // eslint-disable-line

  // Mid-board auto continue
  useEffect(() => {
    if (!isHost || state.phase !== 'midboard' || !state.midboardUntil) return
    const ms = state.midboardUntil - Date.now()
    const t = window.setTimeout(() => {
      playFx('click')
      update((s) => continueAfterMidboard(s))
    }, Math.max(500, ms))
    return () => clearTimeout(t)
  }, [state.phase, state.midboardUntil, isHost]) // eslint-disable-line

  function copyJoin() {
    navigator.clipboard.writeText(appUrl(`/blitz/${code}`)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="max-w-4xl mx-auto px-2 pb-10">
      {isHost && <SessionCodeBadge code={code} />}
      {isHost && (
        <GameToolbar
          onReset={() => update((s) => restartQuiz(s))}
          extra={
            <div className="flex flex-wrap gap-1.5">
              {state.phase === 'lobby' && (
                <>
                  <button
                    type="button"
                    className="btn-outline text-xs flex items-center gap-1"
                    disabled={state.players.length < 1}
                    onClick={() => {
                      playFx('click')
                      update((s) => startWarmup(s))
                    }}
                  >
                    Proovivoor
                  </button>
                  <button
                    type="button"
                    className="btn-gold text-xs flex items-center gap-1"
                    disabled={state.players.length < 1 || !state.questions.length}
                    onClick={() => {
                      playFx('correct')
                      update((s) => startQuestion(s, 0))
                    }}
                  >
                    <Play size={14} /> Alusta
                  </button>
                </>
              )}
              {state.phase === 'question' && (
                <>
                  <button
                    type="button"
                    className="btn-outline text-xs flex items-center gap-1"
                    onClick={() => {
                      playFx('reveal')
                      update((s) => reveal(s))
                    }}
                  >
                    <Eye size={14} /> Sulge & näita
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-xs"
                    onClick={() => {
                      playFx('tick')
                      update((s) => skipQuestion(s))
                    }}
                  >
                    Skip → reveal
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-xs border-accent-red/50 text-accent-red"
                    onClick={() => {
                      if (!confirm('Jäta küsimus vahele ilma punktideta?')) return
                      playFx('wrong')
                      update((s) => skipQuestionVoid(s))
                    }}
                  >
                    Jäta vahele
                  </button>
                </>
              )}
              {state.phase === 'midboard' && (
                <button
                  type="button"
                  className="btn-gold text-xs"
                  onClick={() => {
                    playFx('click')
                    update((s) => continueAfterMidboard(s))
                  }}
                >
                  Jätka mängu
                </button>
              )}
              {state.phase === 'reveal' && (
                <button
                  type="button"
                  className="btn-gold text-xs flex items-center gap-1"
                  onClick={() => {
                    playFx('click')
                    update((s) => nextQuestion(s))
                  }}
                >
                  <SkipForward size={14} />{' '}
                  {state.isWarmup
                    ? 'Tagasi lobby'
                    : state.suddenDeathActive
                      ? 'Podium'
                      : state.qIndex + 1 >= state.questions.length
                        ? 'Podium'
                        : 'Järgmine'}
                  {state.revealSeconds > 0 && revealLeft != null && revealLeft > 0 && (
                    <span className="opacity-70">({revealLeft}s)</span>
                  )}
                </button>
              )}
              {state.phase === 'podium' && (
                <button
                  type="button"
                  className="btn-gold text-xs"
                  onClick={() => update((s) => restartQuiz(s))}
                >
                  Uus voor
                </button>
              )}
            </div>
          }
        />
      )}

      <div className="text-center mb-4">
        <h2 className="font-display text-3xl blitz-logo">⚡ BLITZ</h2>
        <p className="text-white/50 text-sm">Kiire trivia · õige + kiirus = punktid</p>
        {state.questions.length > 0 &&
          state.qIndex === state.questions.length - 1 &&
          state.phase !== 'lobby' &&
          state.phase !== 'podium' && (
            <p className="blitz-final-banner text-rose-300 text-xs font-black uppercase mt-2">
              ★ Viimane küsimus ★
            </p>
          )}
      </div>

      {isHost && code && (
        <div className="card-panel border-gold/30 p-4 mb-4 flex flex-wrap gap-4 items-start">
          <div className="bg-white p-1.5 rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(appUrl(`/blitz/${code}`))}`}
              width={100}
              height={100}
              alt="Join QR"
              className="rounded"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm text-white/70 break-all">
              Join: <span className="text-gold">{appUrl(`/blitz/${code}`)}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={copyJoin}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Kopeeritud' : 'Kopeeri join'}
              </button>
              <a
                href={appUrl(`/ekraan/${code}`)}
                target="_blank"
                rel="noreferrer"
                className="btn-outline text-xs flex items-center gap-1"
              >
                <Tv size={12} /> <ExternalLink size={12} /> TV
              </a>
            </div>
            <p className="text-[11px] text-white/35">
              {state.questions.length} küsimust · {state.secondsPerQuestion}s · reveal{' '}
              {state.revealSeconds || 0}s · max {state.pointsMax}p
              {state.shuffleOnStart ? ' · sega' : ''}
            </p>
            {state.phase === 'lobby' && (
              <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                <label className="flex items-center justify-between gap-3 text-xs text-white/60">
                  <span>Vooru pikkus (sek)</span>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    className="input-field !py-1 !px-2 w-20 text-sm"
                    value={state.secondsPerQuestion}
                    onChange={(e) => {
                      const n = Math.min(120, Math.max(5, Number(e.target.value) || 20))
                      update({ secondsPerQuestion: n })
                    }}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs text-white/60">
                  <span>Tulemuste näit (sek, 0 = käsitsi)</span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    className="input-field !py-1 !px-2 w-20 text-sm"
                    value={state.revealSeconds ?? 5}
                    onChange={(e) => {
                      const n = Math.min(30, Math.max(0, Number(e.target.value) || 0))
                      update({ revealSeconds: n })
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!state.teamsEnabled}
                    onChange={(e) => update((s) => toggleTeams(s, e.target.checked))}
                  />
                  Meeskonnad (A / B)
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {state.teamsEnabled && (
        <div className="flex justify-center gap-6 mb-3 font-display font-black text-xl">
          <span className="text-red-400">Tiim A · {teams.a}</span>
          <span className="text-blue-400">Tiim B · {teams.b}</span>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 mb-4 text-center">
        {state.phase === 'lobby' && (
          <p className="text-white/60">
            Lobby · <strong className="text-gold">{state.players.length}</strong> mängijat
          </p>
        )}
        {state.phase === 'countdown' && (
          <p className="text-gold font-display text-4xl font-black tabular-nums">
            {cdLeft != null && cdLeft > 0 ? cdLeft : '!'}
          </p>
        )}
        {state.phase === 'question' && q && (
          <div>
            <p className="text-cyan-200 font-display text-xl font-black">
              {state.qIndex + 1}/{state.questions.length}
              {remaining != null && <span className="text-gold ml-3 tabular-nums">{remaining}s</span>}
              <span className="text-white/50 text-sm font-sans font-normal ml-3">
                vastanud {answered}/{state.players.length}
              </span>
            </p>
            {remaining != null && state.secondsPerQuestion > 0 && (
              <div className="blitz-progress mt-2 max-w-xs mx-auto">
                <i style={{ width: `${Math.max(0, Math.min(100, (remaining / state.secondsPerQuestion) * 100))}%` }} />
              </div>
            )}
          </div>
        )}
        {state.phase === 'reveal' && (
          <p className="text-emerald-200 font-display text-xl font-black">
            Tulemused
            {revealLeft != null && state.revealSeconds > 0 && (
              <span className="text-white/40 text-base ml-2">→ {revealLeft}s</span>
            )}
          </p>
        )}
        {state.phase === 'midboard' && (
          <p className="text-amber-200 font-display text-2xl font-black">Vaheseis</p>
        )}
        {state.suddenDeathActive && state.phase !== 'podium' && (
          <p className="text-rose-300 font-display text-xl font-black uppercase tracking-wide">
            Äkk-surm · viik
          </p>
        )}
        {state.isWarmup && state.phase !== 'lobby' && (
          <p className="text-cyan-200 text-sm font-bold">Proovivoor — punktid ei loe</p>
        )}
        {state.phase === 'podium' && (
          <p className="text-gold font-display text-2xl font-black flex items-center justify-center gap-2">
            <Trophy /> Lõpp
          </p>
        )}
      </div>

      {state.phase === 'reveal' && (state.lastPhotoFinish?.length || 0) > 0 && (
        <div className="card-panel border-cyan-400/30 p-3 mb-4 max-w-xl mx-auto">
          <p className="text-cyan-200 text-xs font-black uppercase tracking-wide mb-2">⚡ Photo finish</p>
          <div className="space-y-1">
            {state.lastPhotoFinish!.map((row, i) => (
              <div key={row.playerId} className="flex justify-between text-sm">
                <span className="text-white/80">
                  {i + 1}. {row.name}
                </span>
                <span className="text-cyan-200 tabular-nums">
                  {(row.atMs / 1000).toFixed(2)}s · +{row.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isHost && state.phase === 'reveal' && state.questions[state.qIndex + 1] && (
        <div className="card-panel border-amber-500/30 p-3 mb-4 text-sm">
          <p className="text-amber-200/80 text-xs uppercase tracking-wide mb-1">Järgmise eelvaade (ainult host)</p>
          <p className="text-white/80">{state.questions[state.qIndex + 1].q}</p>
          <p className="text-[11px] text-white/35 mt-1">
            Õige: {state.questions[state.qIndex + 1].choices[state.questions[state.qIndex + 1].correct]}
          </p>
        </div>
      )}

      {q && state.phase !== 'lobby' && state.phase !== 'podium' && (
        <div className="card-panel border-gold/20 p-4 mb-4">
          {q.imageUrl && (
            <img
              src={q.imageUrl}
              alt=""
              className="max-h-40 mx-auto mb-3 rounded-xl object-contain border border-white/10"
            />
          )}
          <p className="text-white text-lg font-semibold mb-3">{q.q}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.choices.map((c, i) => (
              <div
                key={i}
                className={`rounded-xl border-2 px-3 py-2 text-sm font-medium ${CHOICE_COLORS[i].bg} ${CHOICE_COLORS[i].border} ${
                  state.phase === 'reveal' && q.correct === i ? 'ring-2 ring-white' : ''
                }`}
              >
                <span className="opacity-80 mr-2">{CHOICE_COLORS[i].label}</span>
                {c}
                {state.phase === 'reveal' && q.correct === i && (
                  <span className="ml-2 text-xs font-black">✓</span>
                )}
              </div>
            ))}
          </div>
          {isHost && q.hostNote && (
            <p className="text-[11px] text-amber-200/70 mt-2">Host: {q.hostNote}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="text-xs uppercase tracking-wide text-white/40 mb-1">Edetabel</h3>
        {ranked.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white/35 w-5 text-sm">{i + 1}.</span>
              <span className="font-semibold text-gold truncate">{p.name}</span>
              {state.teamsEnabled && (
                <span className="flex gap-0.5">
                  {(['a', 'b'] as const).map((tid) => (
                    <button
                      key={tid}
                      type="button"
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        p.team === tid
                          ? tid === 'a'
                            ? 'bg-red-600 text-white'
                            : 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white/40'
                      }`}
                      onClick={() => isHost && update((s) => setPlayerTeam(s, p.id, tid))}
                    >
                      {tid.toUpperCase()}
                    </button>
                  ))}
                </span>
              )}
              {state.phase === 'question' && state.answers[p.id] && (
                <span className="text-[10px] text-cyan-300">✓</span>
              )}
              {state.phase === 'reveal' && (state.lastRoundPoints[p.id] || 0) > 0 && (
                <span className="text-[10px] text-emerald-300">+{state.lastRoundPoints[p.id]}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-white tabular-nums">{p.score}</span>
              {isHost && (
                <button
                  type="button"
                  className="text-accent-red/70 p-1"
                  title="Eemalda"
                  onClick={() => update((s) => removePlayer(s, p.id))}
                >
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {!ranked.length && (
          <p className="text-white/35 text-sm text-center py-4">Ootame mängijaid…</p>
        )}
      </div>
    </div>
  )
}

function useCountdown(startedAt: number | undefined, seconds: number): number | null {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!startedAt || seconds <= 0) return
    const t = window.setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [startedAt, seconds])
  if (!startedAt || seconds <= 0) return null
  return Math.max(0, Math.ceil(seconds - (now - startedAt) / 1000))
}
