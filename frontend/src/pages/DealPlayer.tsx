import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import type { KinnistuDealState } from '@/games/kinnistu-deal/types'
import { completeSets, bankTotal, type PropColor, SET_SIZE } from '@/games/kinnistu-deal/types'
import { playCard, pickTarget, resolvePay, endTurn } from '@/games/kinnistu-deal/logic'
import { CardFace, PropPile } from '@/games/kinnistu-deal/DealCards'
import { Landmark, Loader2 } from 'lucide-react'

/**
 * Private player seat: /deal/:code/:token
 * Sees only own hand; plays on own turn; table is shared via PB session state.
 */
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

  const pushState = useCallback(
    async (next: KinnistuDealState) => {
      if (!sessionId) return
      setBusy(true)
      try {
        if (sessionId.startsWith('local-')) {
          localStorage.setItem(`session_${sessionId}`, JSON.stringify(next))
          setState(next)
        } else {
          // merge from server to reduce stomp
          const rec = await pb.collection('game_sessions').getOne<GameSession>(sessionId)
          const server = rec.state as KinnistuDealState
          // Prefer next for gameplay fields; keep hostBeat from server if newer
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
        if (list.items.length === 0) throw new Error('Sessiooni ei leitud')
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
        // local fallback
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
              }, 800)
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

  async function saveName() {
    if (!state || playerIdx < 0 || !nameEdit.trim()) return
    const next = {
      ...state,
      players: state.players.map((p, i) => (i === playerIdx ? { ...p, name: nameEdit.trim() } : p)),
    }
    await pushState(next)
  }

  async function onPlay(cardId: string) {
    if (!state || playerIdx < 0 || !isMyTurn || busy) return
    const next = playCard(state, playerIdx, cardId)
    await pushState(next)
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

  return (
    <div className="min-h-screen bg-[#050c18] text-white pb-16">
      <div className="max-w-lg mx-auto px-3 pt-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-gold font-display font-bold">
            <Landmark size={18} /> Kinnistu Deal
          </div>
          <span className="text-[10px] uppercase tracking-wider text-white/40 border border-white/15 rounded-full px-2 py-0.5">
            {code}
          </span>
        </div>

        <div className="card-panel border-gold/40 p-3 mb-4">
          <label className="text-[10px] uppercase text-white/40">Sinu nimi</label>
          <div className="flex gap-2 mt-1">
            <input
              className="input-field text-sm flex-1"
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              onBlur={saveName}
            />
            <button type="button" className="btn-outline text-xs" onClick={saveName}>
              Salvesta
            </button>
          </div>
          <p className="text-xs text-white/50 mt-2">
            Komplektid: <span className="text-gold font-bold">{completeSets(me)}/{winSets}</span>
            <span className="mx-2">·</span>
            Pank: <span className="text-emerald-300 font-bold">{bankTotal(me)}M</span>
          </p>
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          {state.phase === 'lobby' && (
            <p className="text-white/60 text-sm">Oota, kuni host alustab mängu…</p>
          )}
          {state.phase === 'over' && state.winner != null && (
            <p className="text-gold font-display text-xl">
              {state.players[state.winner]?.name} võitis!
            </p>
          )}
          {state.phase === 'turn' && (
            <p className={isMyTurn ? 'text-accent-cyan font-bold' : 'text-white/50 text-sm'}>
              {isMyTurn
                ? `Sinu käik · veel ${state.playsLeft} kaarti`
                : `Käik: ${state.players[state.current]?.name}`}
            </p>
          )}
          {needTarget && (
            <p className="text-amber-200 text-sm font-medium mt-1">Vali sihtmängija</p>
          )}
          {needPay && (
            <p className="text-emerald-200 text-sm font-medium mt-1">
              Sa pead maksma {state.payAmount}M
            </p>
          )}
        </div>

        {/* Table overview */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {state.players.map((p, i) => (
            <div
              key={p.token}
              className={`rounded-xl border p-2 ${
                i === state.current && state.phase === 'turn'
                  ? 'border-gold/50 bg-gold/5'
                  : 'border-white/10 bg-black/30'
              }`}
            >
              <div className="text-xs font-bold text-gold truncate">{p.name}</div>
              <div className="text-[10px] text-white/40">
                {completeSets(p)}/{winSets} · {bankTotal(p)}M
              </div>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {(Object.keys(SET_SIZE) as PropColor[]).map((c) => (
                  <PropPile key={c} color={c} cards={p.props[c] || []} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
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

        {needPay && (
          <div className="text-center mb-4">
            <button type="button" className="btn-gold" disabled={busy} onClick={onPay}>
              Maksa pangast
            </button>
          </div>
        )}

        {/* Private hand */}
        <div className="card-panel border-gold/30 p-3">
          <h3 className="text-gold font-display text-sm mb-2">Sinu käsi (ainult sina näed)</h3>
          <div className="flex flex-wrap gap-2 justify-center min-h-[7rem]">
            {me.hand.map((c) => (
              <CardFace
                key={c.id}
                card={c}
                onClick={() => onPlay(c.id)}
                disabled={!isMyTurn || busy || state.playsLeft <= 0}
              />
            ))}
            {!me.hand.length && <p className="text-white/35 text-sm">Käsi on tühi</p>}
          </div>
          {isMyTurn && (
            <div className="mt-3 text-center">
              <button type="button" className="btn-outline text-sm" disabled={busy} onClick={onEndTurn}>
                Lõpeta käik
              </button>
              <p className="text-[10px] text-white/35 mt-2">
                Kuni 3 kaarti · raha panka, kinnistu reale, tegevus vastasele. Käe limiit 7.
              </p>
            </div>
          )}
        </div>

        {/* Log */}
        {state.log?.length > 0 && (
          <div className="mt-4 space-y-0.5 text-center">
            {state.log.slice(0, 5).map((line, i) => (
              <p key={i} className={`text-[11px] ${i === 0 ? 'text-gold/80' : 'text-white/25'}`}>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
