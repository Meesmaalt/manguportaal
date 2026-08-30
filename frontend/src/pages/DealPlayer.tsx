import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import type { KinnistuDealState, DealCard } from '@/games/kinnistu-deal/types'
import {
  completeSets,
  bankTotal,
  type PropColor,
  SET_SIZE,
  looseProperties,
  fullSetColors,
  actionLabel,
  colorsWithAny,
  rentForSet,
} from '@/games/kinnistu-deal/types'
import {
  playCard,
  pickTarget,
  resolvePay,
  endTurn,
  defendWithNo,
  skipDefend,
  pickProperty,
  pickRentColor,
} from '@/games/kinnistu-deal/logic'
import { CardFace, PlayerTableBoard, PropertySetRow } from '@/games/kinnistu-deal/DealCards'
import { Landmark, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function DealPlayer() {
  const { code: codeParam, token } = useParams<{ code: string; token: string }>()
  const code = (codeParam || '').toUpperCase()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [state, setState] = useState<KinnistuDealState | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [nameEdit, setNameEdit] = useState('')

  const playerIdx = useMemo(() => {
    if (!state || !token) return -1
    return state.players.findIndex((p) => p.token === token)
  }, [state, token])

  const me = playerIdx >= 0 ? state!.players[playerIdx] : null
  const isMyTurn = state?.phase === 'turn' && state.current === playerIdx
  const needTarget = state?.phase === 'pick_target' && state.pending?.from === playerIdx
  const needPay = state?.phase === 'pay' && state.payFrom === playerIdx
  const needDefend = state?.phase === 'defend' && state.pending?.target === playerIdx
  const needPickRent =
    state?.phase === 'pick_rent_color' && state.pending?.from === playerIdx
  const needPickProp =
    state?.phase === 'pick_property' && state.pending?.from === playerIdx && state.pending.target != null

  const pushState = useCallback(
    async (next: KinnistuDealState) => {
      if (!sessionId) return
      setBusy(true)
      try {
        if (sessionId.startsWith('local-')) {
          localStorage.setItem(`session_${sessionId}`, JSON.stringify(next))
          setState(next)
        } else {
          const rec = await pb.collection('game_sessions').getOne<GameSession>(sessionId)
          const server = rec.state as KinnistuDealState
          const merged = { ...server, ...next, hostBeat: Date.now() }
          await pb.collection('game_sessions').update(sessionId, { state: merged })
          setState(merged)
        }
      } catch (e: any) {
        setError(e?.message || 'Salvestamine ebaõnnestus')
      } finally {
        setBusy(false)
      }
    },
    [sessionId]
  )

  useEffect(() => {
    if (!code || !token) {
      setError('Puudub kood või token')
      setLoading(false)
      return
    }
    let unsub: (() => void) | null = null
    let cancelled = false

    async function find() {
      setLoading(true)
      setError('')
      try {
        const list = await pb.collection('game_sessions').getList<GameSession>(1, 1, {
          filter: `code = "${code}"`,
        })
        if (!list.items.length) throw new Error('Sessiooni ei leitud — kas host on alustanud?')
        const rec = list.items[0]
        if (cancelled) return
        setSessionId(rec.id)
        const st = rec.state as KinnistuDealState
        setState(st)
        const idx = st.players.findIndex((p) => p.token === token)
        if (idx < 0) throw new Error('See link ei kuulu selle mängu mängijatele')
        setNameEdit(st.players[idx].name)
        unsub = await pb.collection('game_sessions').subscribe<GameSession>(rec.id, (e) => {
          if (e.action === 'update') setState(e.record.state as KinnistuDealState)
        })
      } catch (e: any) {
        let found = false
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key?.startsWith('session_')) continue
          try {
            const data = JSON.parse(localStorage.getItem(key)!) as KinnistuDealState
            if (data.code?.toUpperCase() === code) {
              const idx = data.players?.findIndex((p) => p.token === token) ?? -1
              if (idx < 0) continue
              setSessionId(key.replace('session_', ''))
              setState(data)
              setNameEdit(data.players[idx].name)
              found = true
              const poll = window.setInterval(() => {
                const raw = localStorage.getItem(key)
                if (raw) setState(JSON.parse(raw))
              }, 700)
              unsub = () => clearInterval(poll)
              break
            }
          } catch {}
        }
        if (!found) setError(e?.message || 'Ei leitud')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    find()
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [code, token])

  useEffect(() => {
    if (state?.phase === 'over' && state.confettiAt) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 }, spread: 65 })
    }
  }, [state?.phase, state?.confettiAt])

  async function saveName() {
    if (!state || playerIdx < 0 || !nameEdit.trim()) return
    await pushState({
      ...state,
      players: state.players.map((p, i) => (i === playerIdx ? { ...p, name: nameEdit.trim() } : p)),
    })
  }

  async function onPlay(cardId: string) {
    if (!state || playerIdx < 0 || !isMyTurn || busy) return
    await pushState(playCard(state, playerIdx, cardId))
  }

  async function onTarget(ti: number) {
    if (!state || !needTarget || busy) return
    await pushState(pickTarget(state, ti))
  }

  async function onPay() {
    if (!state || !needPay || busy) return
    await pushState(resolvePay(state))
  }

  async function onEndTurn() {
    if (!state || !isMyTurn || busy) return
    await pushState(endTurn(state))
  }

  async function onDefend() {
    if (!state || !needDefend || busy) return
    await pushState(defendWithNo(state, playerIdx))
  }

  async function onAcceptHit() {
    if (!state || !needDefend || busy) return
    await pushState(skipDefend(state, playerIdx))
  }

  async function onPickProp(id: string) {
    if (!state || !needPickProp || busy) return
    await pushState(pickProperty(state, id))
  }

  async function onPickRent(color: PropColor) {
    if (!state || !needPickRent || busy) return
    await pushState(pickRentColor(state, color))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050c18] text-gold">
        <Loader2 className="animate-spin mr-2" /> Laadin…
      </div>
    )
  }

  if (error || !state || !me) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050c18] text-white px-4">
        <p className="text-accent-red mb-4 text-center">{error || 'Viga'}</p>
        <Link to="/" className="text-gold text-sm">
          Avalehele
        </Link>
      </div>
    )
  }

  const winSets = state.packData?.winSets ?? 3
  const targetPlayer =
    state.pending?.target != null ? state.players[state.pending.target] : null

  let pickOptions: DealCard[] = []
  if (needPickProp && targetPlayer && state.pending) {
    if (state.pending.action === 'deal_breaker') {
      for (const col of fullSetColors(targetPlayer)) {
        pickOptions.push(...(targetPlayer.props[col] || []).slice(0, 1))
      }
    } else {
      pickOptions = looseProperties(targetPlayer)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#050c18] to-[#02060e] text-white pb-20">
      <div className="max-w-lg mx-auto px-3 pt-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-gold font-display font-bold text-lg">
            <Landmark size={20} /> Kinnistu Deal
          </div>
          <span className="text-[10px] uppercase tracking-wider text-white/40 border border-white/15 rounded-full px-2.5 py-1">
            {code}
          </span>
        </div>

        <div className="rounded-2xl border border-gold/35 bg-black/40 p-3 mb-4 backdrop-blur">
          <label className="text-[10px] uppercase text-white/40 tracking-wide">Sinu nimi</label>
          <div className="flex gap-2 mt-1">
            <input
              className="input-field text-sm flex-1"
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              onBlur={saveName}
            />
            <button type="button" className="btn-outline text-xs" onClick={saveName}>
              OK
            </button>
          </div>
          <div className="flex gap-4 mt-2 text-sm">
            <span>
              Komplektid{' '}
              <strong className="text-gold">
                {completeSets(me)}/{winSets}
              </strong>
            </span>
            <span>
              Pank <strong className="text-emerald-300">{bankTotal(me)}M</strong>
            </span>
            <span className="text-white/35 text-xs self-center">{me.hand.length} käes</span>
          </div>
        </div>

        {/* Status banner */}
        <div
          className={`rounded-xl px-4 py-3 mb-4 text-center text-sm font-medium border ${
            isMyTurn
              ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-100'
              : needDefend
                ? 'bg-rose-500/15 border-rose-400/40 text-rose-100'
                : needPay
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100'
                  : 'bg-white/5 border-white/10 text-white/60'
          }`}
        >
          {state.phase === 'lobby' && 'Oota, kuni host alustab…'}
          {state.phase === 'over' && state.winner != null && (
            <span className="text-gold text-lg font-display">
              {state.players[state.winner]?.name} võitis! 🏆
            </span>
          )}
          {state.phase === 'turn' &&
            (isMyTurn
              ? `Sinu käik — võid mängida veel ${state.playsLeft} kaarti`
              : `Praegu mängib: ${state.players[state.current]?.name}`)}
          {needTarget && 'Vali, kelle vastu kaart kehtib'}
          {needPickRent && (state.pending?.action === 'rent' ? 'Vali üüri värv' : 'Vali komplekt majale/hotellile')}
          {needPickProp && 'Vali kinnistu / komplekt'}
          {needDefend &&
            `${state.players[state.pending!.from]?.name} ründab sind (${actionLabel(state.pending!.action)})`}
          {needPay && `Maksad ${state.payAmount}M → ${state.players[state.pending!.from]?.name}`}
          {state.phase === 'pick_target' && state.pending?.from !== playerIdx && (
            <span> {state.players[state.pending!.from]?.name} valib sihtmärki…</span>
          )}
        </div>

        {/* Table */}
        <div className="space-y-3 mb-5">
          {state.players.map((p, i) => (
            <div
              key={p.token}
              className={`rounded-2xl border p-3 transition ${
                i === state.current && state.phase !== 'lobby' && state.phase !== 'over'
                  ? 'border-gold/60 bg-gold/10'
                  : i === playerIdx
                    ? 'border-accent-cyan/40 bg-cyan-950/25'
                    : 'border-white/10 bg-black/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-sm font-bold text-gold truncate flex items-center gap-1">
                  {i === playerIdx && <span className="text-accent-cyan">●</span>}
                  {p.name}
                </div>
                <div className="text-xs text-white/45 shrink-0">
                  {completeSets(p)}/{winSets} · <span className="text-emerald-300">{bankTotal(p)}M</span>
                </div>
              </div>
              <PlayerTableBoard player={p} />
            </div>
          ))}
        </div>

        {/* Interactive prompts */}
        
        {needPickRent && state.pending && (
          <div className="card-panel border-amber-400/40 p-3 mb-4">
            <p className="text-amber-100 text-sm text-center mb-3 font-medium">
              {state.pending.action === 'rent'
                ? 'Vali komplekt, millelt üüri nõuad'
                : state.pending.action === 'hotel'
                  ? 'Vali komplekt hotellile'
                  : 'Vali komplekt majale'}
            </p>
            <div className="space-y-2">
              {(state.pending.action === 'rent'
                ? colorsWithAny(me)
                : fullSetColors(me)
              ).map((c) => (
                <PropertySetRow
                  key={c}
                  color={c}
                  cards={me.props[c] || []}
                  building={me.buildings?.[c]}
                  showRent={state.pending?.action === 'rent'}
                  owner={me}
                  highlight
                  onClick={() => onPickRent(c)}
                />
              ))}
            </div>
          </div>
        )}

        {needTarget && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {state.players.map((p, i) =>
              i === playerIdx ? null : (
                <button
                  key={p.token}
                  type="button"
                  className="btn-gold text-sm"
                  disabled={busy}
                  onClick={() => onTarget(i)}
                >
                  {p.name}
                </button>
              )
            )}
          </div>
        )}

        {needPickProp && (
          <div className="card-panel border-amber-400/30 p-3 mb-4">
            <p className="text-amber-100 text-xs text-center mb-2">Puuduta kinnistut, mida soovid</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {pickOptions.map((c) => (
                <CardFace key={c.id} card={c} onClick={() => onPickProp(c.id)} disabled={busy} />
              ))}
            </div>
          </div>
        )}

        {needDefend && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {me.hand.some((c) => c.kind === 'action' && c.action === 'just_say_no') ? (
              <button type="button" className="btn-gold" disabled={busy} onClick={onDefend}>
                🚫 Ei, aitäh! (tühista)
              </button>
            ) : (
              <p className="text-white/40 text-xs w-full text-center">Sul pole „Ei, aitäh“ kaarti</p>
            )}
            <button type="button" className="btn-outline text-sm" disabled={busy} onClick={onAcceptHit}>
              Lase efektil toimuda
            </button>
          </div>
        )}

        {needPay && (
          <div className="text-center mb-4">
            <button type="button" className="btn-gold px-8" disabled={busy} onClick={onPay}>
              Maksa ({state.payAmount}M)
            </button>
            <p className="text-[10px] text-white/35 mt-2">Kõigepealt raha pangast; vajadusel kinnistu</p>
          </div>
        )}

        {/* Hand */}
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-b from-[#0f1c30] to-[#080e18] p-3 shadow-xl">
          <h3 className="text-gold font-display text-sm mb-3 flex items-center justify-between">
            <span>Sinu käsi</span>
            <span className="text-[10px] text-white/35 font-sans font-normal">privaatne</span>
          </h3>
          <div className="flex flex-wrap gap-2 justify-center min-h-[11rem]">
            {me.hand.map((c) => (
              <CardFace
                key={c.id}
                card={c}
                large
                onClick={() => onPlay(c.id)}
                disabled={!isMyTurn || busy || state.playsLeft <= 0}
              />
            ))}
            {!me.hand.length && <p className="text-white/35 text-sm self-center">Käsi on tühi</p>}
          </div>
          {isMyTurn && (
            <div className="mt-4 text-center">
              <button type="button" className="btn-outline text-sm px-6" disabled={busy} onClick={onEndTurn}>
                Lõpeta käik
              </button>
              <p className="text-[10px] text-white/40 mt-2 leading-relaxed max-w-xs mx-auto">
                Kuni 3 kaarti: raha → panka · kinnistu → reale · tegevus → vastane. Lõpus max 7 käes.
              </p>
            </div>
          )}
        </div>

        {state.log?.length > 0 && (
          <div className="mt-5 space-y-1 text-center">
            {state.log.slice(0, 6).map((line, i) => (
              <p key={i} className={`text-[11px] ${i === 0 ? 'text-gold/85' : 'text-white/25'}`}>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
