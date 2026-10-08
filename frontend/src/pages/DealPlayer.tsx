import { sendDealCommand } from '@/games/kinnistu-deal/session'
import type { DealCommand } from '@/games/kinnistu-deal/logic'
import DealTurnStatus from '@/games/kinnistu-deal/DealTurnStatus'
import { useDealTurnClock } from '@/games/kinnistu-deal/useDealTurnClock'
import DealArena from '@/games/kinnistu-deal/DealArena'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
} from '@/games/kinnistu-deal/types'

import { CardFace, BankStrip } from '@/games/kinnistu-deal/DealCards'
import DealActionTheater from '@/games/kinnistu-deal/DealActionTheater'
import { Landmark, Loader2 } from 'lucide-react'
import { confettiBurst } from '@/lib/confettiBurst'
import { playFx } from '@/lib/audio'
import { recordGameEnd } from '@/lib/stats'

export default function DealPlayer() {
  const { code: codeParam, token } = useParams<{ code: string; token: string }>()
  const code = (codeParam || '').toUpperCase()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [state, setState] = useState<KinnistuDealState | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [actionError,setActionError]=useState('')
  const actionLock=useRef(false)
  const [nameEdit, setNameEdit] = useState('')
  const [discardSelected, setDiscardSelected] = useState<string[]>([])
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return localStorage.getItem('deal-tutorial-v1') !== '1'
    } catch {
      return true
    }
  })

  const playerIdx = useMemo(() => {
    if (!state || !token) return -1
    return state.players.findIndex((p) => p.token === token)
  }, [state, token])

  const clockError = useDealTurnClock(state, sessionId, setState, playerIdx >= 0 && state?.current === playerIdx)
  const needDiscard = state?.phase === 'discard_hand' && state.current === playerIdx
  useEffect(() => { setDiscardSelected([]) }, [state?.phase, state?.turnCount])

  const me = playerIdx >= 0 ? state!.players[playerIdx] : null
  const isMyTurn = state?.phase === 'turn' && state.current === playerIdx
  const needTarget = state?.phase === 'pick_target' && state.pending?.from === playerIdx
  const needPay = state?.phase === 'pay' && state.payFrom === playerIdx
  const needDefend = state?.phase === 'defend' && (state.pending?.responseIndex ?? state.pending?.target) === playerIdx
  const needPickRent =
    state?.phase === 'pick_rent_color' && state.pending?.from === playerIdx
  const needPickProp =
    state?.phase === 'pick_property' && state.pending?.from === playerIdx && state.pending.target != null

  const act = useCallback(async (command: DealCommand) => {
    if (!sessionId || !token || actionLock.current) return
    actionLock.current=true;setBusy(true);setActionError('')
    try { setState(await sendDealCommand(sessionId,token,command)) }
    catch(e:any){setActionError(e.message)}
    finally {actionLock.current=false;setBusy(false)}
  },[sessionId,token])

  useEffect(() => {
    if (!code || !token) {
      setError('Puudub kood või token')
      setLoading(false)
      return
    }
    let unsub: (() => void) | null = null
    let cancelled = false
    let remotePoll: number | undefined

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
          if (!cancelled && e.action === 'update') setState(e.record.state as KinnistuDealState)
        }).catch(() => () => {})
        if (cancelled) { unsub?.(); return }
        remotePoll=window.setInterval(()=>{
          pb.collection('game_sessions').getOne<GameSession>(rec.id,{requestKey:null}).then(r=>{if(!cancelled)setState(r.state as KinnistuDealState)}).catch(()=>{})
        },3000)
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
      if (remotePoll) clearInterval(remotePoll)
    }
  }, [code, token])

  useEffect(() => {
    if (state?.phase === 'over' && state.confettiAt) {
      confettiBurst({ particleCount: 100, spread: 65, y: 0.7 })
      playFx('victory')
      try {
        const w = state.winner != null ? state.players[state.winner]?.name : undefined
        recordGameEnd('kinnistu_deal', w)
      } catch {}
    }
  }, [state?.phase, state?.confettiAt])

  async function saveName() {
    if (!state || playerIdx < 0 || !nameEdit.trim()) return
    await act({type:'rename',name:nameEdit.trim()})
  }

  async function onPlay(cardId: string, asBank = false) {
    if (!state || playerIdx < 0 || !isMyTurn || busy) return
    playFx('click')
    await act({type:'play',cardId,bank:asBank})
  }

  async function onTarget(ti: number) {
    if (!state || !needTarget || busy) return
    playFx('tick')
    await act({type:'target',target:ti})
  }

  async function onRentAll() {
    if (!state || !needTarget || busy || state.pending?.action !== 'rent') return
    playFx('tick')
    await act({type:'rent_all'})
  }

  async function onPay() {
    if (!state || !needPay || busy) return
    playFx('correct')
    await act({type:'pay'})
  }

  async function onTogglePay(cardId: string) {
    if (!state || !needPay || busy || playerIdx < 0) return
    await act({type:'toggle_pay',cardId})
  }

  async function onEndTurn() {
    if (!state || !isMyTurn || busy) return
    playFx('reveal')
    await act({type:'end'})
  }

  async function onDefend() {
    if (!state || !needDefend || busy) return
    await act({type:'defend'})
  }

  async function onAcceptHit() {
    if (!state || !needDefend || busy) return
    await act({type:'accept'})
  }

  async function onPickProp(id: string) {
    if (!state || !needPickProp || busy) return
    await act({type:'property',cardId:id})
  }

  async function onPickRent(color: PropColor) {
    if (!state || !needPickRent || busy) return
    await act({type:'rent_color',color})
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
  if (needPickProp && state.pending) {
    if (state.pending.giveStep) {
      // own loose properties to give
      pickOptions = looseProperties(me!)
    } else if (targetPlayer) {
      if (state.pending.action === 'deal_breaker') {
        for (const col of fullSetColors(targetPlayer)) {
          pickOptions.push(...(targetPlayer.props[col] || []).slice(0, 1))
        }
      } else {
        pickOptions = looseProperties(targetPlayer)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#050c18] to-[#02060e] text-white pb-20">
      <DealActionTheater event={state.lastEvent} compact />
      <div className="max-w-6xl mx-auto px-3 pt-4">
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
          <div className="mt-2">
            <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1">Sinu pank (kaardid)</p>
            <BankStrip bank={me.bank} />
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
          {needTarget && (state.pending?.action === 'rent' ? 'Vali maksja või nõua kõigilt' : 'Vali vastane')}
          {needPickRent && (state.pending?.action === 'rent' ? 'Vali üüri värv' : 'Vali komplekt majale/hotellile')}
          {needPickProp && 'Vali kinnistu / komplekt'}
          {needDefend &&
            (state.pending?.cancelled ? 'Tegevus tühistati — vasta või nõustu tühistusega' : `${state.players[state.pending!.from]?.name} · ${actionLabel(state.pending!.action)} — vasta või lase toimuda`)}
          {needPay && `Maksad ${state.payAmount}M → ${state.players[state.pending!.from]?.name}`}
          {state.phase === 'pick_target' && state.pending?.from !== playerIdx && (
            <span> {state.players[state.pending!.from]?.name} valib sihtmärki…</span>
          )}
        </div>

        {actionError && <p role="alert" className="text-rose-200 p-3 border border-rose-400 rounded-xl mb-3">{actionError}</p>}
        {(!isMyTurn || !state.turnEndAt) && <DealTurnStatus state={state}/>}
        {clockError && <p role="alert" className="text-amber-200 text-sm mb-3">{clockError}</p>}
        <DealArena state={state} viewer={playerIdx} busy={busy} targetMode={needTarget} targetIndices={state.players.map((p,i)=>i!==playerIdx && (state.pending?.action==='deal_breaker' ? fullSetColors(p).length>0 : state.pending?.action==='sly_deal'||state.pending?.action==='forced_deal' ? looseProperties(p).length>0 : true) ? i : -1).filter(i=>i>=0)} onTarget={onTarget}
          propertyIds={pickOptions.map(c=>c.id)} onProperty={onPickProp} onColor={onPickRent}
          colors={needPickRent ? state.pending?.action === 'rent' ? colorsWithAny(me) : state.pending?.action === 'hotel' ? fullSetColors(me).filter(c=>c!=='rail'&&c!=='util'&&me.buildings?.[c]==='house') : fullSetColors(me).filter(c=>c!=='rail'&&c!=='util'&&!me.buildings?.[c]) : []} />
        {needTarget && state.pending?.action === 'rent' && <button type="button" className="btn-outline mx-auto block my-3" disabled={busy} onClick={onRentAll}>Nõua üüri kõigilt</button>}

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
              {state.pending?.cancelled ? 'Nõustu tühistusega' : 'Lase efektil toimuda'}
            </button>
          </div>
        )}

        {needPay && (
          <div className="card-panel border-emerald-400/40 p-3 mb-4">
            <p className="text-emerald-100 text-sm text-center font-medium mb-2">
              Vali makseks {state.payAmount}M väärtuses vara. Kui varast ei piisa, anna kogu laual olev vara.
            </p>
            <p className="text-[10px] text-white/40 text-center mb-2">Pank</p>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {me.bank.map((c) => (
                <CardFace
                  key={c.id}
                  card={c}
                  small
                  selected={(state.paySelected || []).includes(c.id)}
                  onClick={() => onTogglePay(c.id)}
                  disabled={busy}
                />
              ))}
              {!me.bank.length && <span className="text-white/30 text-xs">tühi</span>}
            </div>
            <p className="text-[10px] text-white/40 text-center mb-2">Kinnistud (valikuline)</p>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {(Object.keys(SET_SIZE) as PropColor[]).flatMap((col) =>
                (me.props[col] || []).map((c) => (
                  <CardFace
                    key={c.id}
                    card={c}
                    small
                    selected={(state.paySelected || []).includes(c.id)}
                    onClick={() => onTogglePay(c.id)}
                    disabled={busy}
                  />
                ))
              )}
            </div>
            <div className="text-center">
              <button type="button" className="btn-gold px-8" disabled={busy} onClick={onPay}>
                Kinnita makse
              </button>
            </div>
          </div>
        )}

        {/* Hand */}
        <div className="arena-hand-dock" data-deal-hand={playerIdx}>
          <h3 className="text-gold font-display text-sm mb-3 flex items-center justify-between">
            <span>Sinu käsi</span>
            <span className="text-[10px] text-white/35 font-sans font-normal">privaatne</span>
          </h3>
          <div className="arena-card-hand">
            {me.hand.map((c) => (
              <div className="deal-hand-card" key={c.id}><CardFace
                key={c.id}
                card={c}
                large
                selected={needDiscard && discardSelected.includes(c.id)}
                onClick={() => { if (needDiscard) setDiscardSelected(ids => ids.includes(c.id) ? ids.filter(id=>id!==c.id) : ids.length < me.hand.length-7 ? [...ids,c.id] : ids); else onPlay(c.id) }}
                disabled={busy || (!needDiscard && (!isMyTurn || state.playsLeft <= 0))}
              />
              {c.kind === 'action' && isMyTurn && state.playsLeft > 0 && <button disabled={busy} className="deal-bank-choice" onClick={()=>onPlay(c.id,true)}>Panka · {c.value}M</button>}
              </div>
            ))}
            {!me.hand.length && <p className="text-white/35 text-sm self-center">Käsi on tühi</p>}
          </div>
          {needDiscard && <div className="text-center mt-4"><p className="text-amber-200 mb-3">Valitud {discardSelected.length}/{me.hand.length-7} kaarti ära viskamiseks</p><button className="btn-gold" disabled={busy || discardSelected.length !== me.hand.length-7} onClick={()=>act({type:'discard',ids:discardSelected})}>Viska valitud kaardid ära</button></div>}
          {isMyTurn && state.turnEndAt != null && <DealTurnStatus state={state}/>}
          {isMyTurn && (
            <div className="mt-4 text-center">
              <button type="button" className="btn-outline text-sm px-6" disabled={busy} onClick={onEndTurn}>
                {state.turnEndAt ? 'Lõpeta kohe' : 'Lõpeta käik'}
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

      {showTutorial && (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#0c1524] border border-gold/40 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h2 className="font-display text-gold text-xl font-black mb-3">3 sammu</h2>
            <ol className="text-sm text-white/80 space-y-2 list-decimal list-inside mb-4">
              <li>Oma käigul mängi kuni 3 kaarti (raha, kinnistu või tegevus).</li>
              <li>Tegevuskaardil vali vastane; tema võib öelda „Ei, aitäh“.</li>
              <li>Võidab see, kes kogub {state.packData?.winSets ?? 3} täiskomplekti.</li>
            </ol>
            <button
              type="button"
              className="btn-gold w-full"
              onClick={() => {
                try {
                  localStorage.setItem('deal-tutorial-v1', '1')
                } catch {}
                setShowTutorial(false)
              }}
            >
              Selge, mängime!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}