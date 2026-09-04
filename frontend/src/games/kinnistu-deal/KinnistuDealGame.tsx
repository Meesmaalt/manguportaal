import { useState, useEffect } from 'react'
import type { KinnistuDealState } from './types'
import { SET_SIZE, completeSets, bankTotal, makeToken, type PropColor } from './types'
import { emptyPlayer, startGame, endTurn, resolvePay, skipDefend, hostMoveProperty } from './logic'
import { CardFace, PlayerTableBoard, BankStrip } from './DealCards'
import TvJoinPanel from '@/components/TvJoinPanel'
import { playFx } from '@/lib/audio'
import { shareSessionLinks } from '@/lib/stats'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import { appUrl } from '@/lib/config'
import { Landmark, Copy, Check, UserPlus, Play, SkipForward, Trophy, Tv, ExternalLink } from 'lucide-react'
import { confettiBurst } from '@/lib/confettiBurst'

import { actionLabel } from './types'

type Props = {
  state: KinnistuDealState
  update: (p: Partial<KinnistuDealState> | ((s: KinnistuDealState) => KinnistuDealState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function KinnistuDealGame({ state, update, isHost = true, sessionCode }: Props) {
  const { t } = useI18n()
  const { players, phase, current, log, winner, deck, playsLeft } = state
  const winSets = state.packData?.winSets ?? 3
  const code = sessionCode || state.code || ''
  const [copied, setCopied] = useState<string | null>(null)
  const [repairFrom, setRepairFrom] = useState(0)
  const [repairTo, setRepairTo] = useState(1)
  const [repairCard, setRepairCard] = useState('')
  const [showRepair, setShowRepair] = useState(false)

  useEffect(() => {
    if (phase === 'over' && state.confettiAt) {
      confettiBurst({ particleCount: 140, spread: 75, y: 0.65 })
    }
  }, [phase, state.confettiAt])

  function copyLink(token: string) {
    const url = appUrl(`/deal/${code}/${token}`)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  function addPlayer() {
    if (!isHost || phase !== 'lobby' || players.length >= 5) return
    update({
      players: [...players, emptyPlayer(`Mängija ${players.length + 1}`)],
    })
  }

  function removePlayer(i: number) {
    if (!isHost || phase !== 'lobby' || players.length <= 2) return
    update({ players: players.filter((_, idx) => idx !== i) })
  }

  function rename(i: number, name: string) {
    if (!isHost) return
    update({
      players: players.map((p, idx) => (idx === i ? { ...p, name } : p)),
    })
  }

  function doStart() {
    if (!isHost) return
    update((s) => startGame(s))
  }

  function doEndTurn() {
    if (!isHost || phase !== 'turn') return
    playFx('reveal', { prefer: 'deal_play' })
    update((s) => endTurn(s))
  }

  function hostForcePay() {
    if (!isHost || phase !== 'pay') return
    playFx('correct', { prefer: 'deal_play' })
    update((s) => resolvePay(s))
  }

  function hostSkipDefend() {
    if (!isHost || phase !== 'defend' || state.pending?.target == null) return
    playFx('tick', { prefer: 'deal_rent' })
    update((s) => skipDefend(s, s.pending!.target!))
  }

  function hostCancelPending() {
    if (!isHost || phase === 'lobby' || phase === 'turn' || phase === 'over') return
    playFx('wrong', { prefer: 'deal_rent' })
    update({
      phase: 'turn',
      pending: null,
      payFrom: undefined,
      payAmount: undefined,
      log: [`Host tühistas poolelioleva tegevuse`, ...log].slice(0, 16),
    })
  }

  function resetLobby() {
    if (!isHost) return
    update({
      phase: 'lobby',
      deck: [],
      discard: [],
      current: 0,
      playsLeft: 0,
      pending: null,
      winner: undefined,
      players: players.map((p) => ({
        ...p,
        token: p.token || makeToken(),
        hand: [],
        bank: [],
        props: {},
      })),
      log: [],
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 pb-10">
      {isHost && <SessionCodeBadge code={code} />}
      {isHost && phase === 'lobby' && (
        <div className="card-panel border-gold/30 p-3 mb-3 max-w-xl mx-auto text-sm text-white/75 space-y-1">
          <p className="text-gold font-display text-sm">Peo soovitus (2–5 mängijat)</p>
          <p>1. Lisa nimed all · 2. Anna igaühele oma QR/link · 3. Ava TV samast koodist · 4. Alusta mängu</p>
          <p className="text-white/45 text-xs">Iga mängija telefon = käsi. Host saab vajadusel käike aidata.</p>
        </div>
      )}
      {isHost && code && (
        <TvJoinPanel code={code} />
      )}

      {isHost && phase === 'turn' && !state.coachDismissed && (state.turnCount || 0) < 2 && (
        <div className="card-panel border-cyan-400/40 bg-cyan-950/40 p-3 mb-3 max-w-xl mx-auto text-sm">
          <p className="text-cyan-200 font-display text-sm mb-1">Esimese käigu meeldetuletus</p>
          <ol className="text-white/75 text-xs space-y-0.5 list-decimal list-inside">
            <li>Võta 2 kaarti pakist (automaatne käigu alguses, kui loogika seda teeb).</li>
            <li>Mängi kuni 3 kaarti: raha → pank, kinnistu → rida, tegevus → vali sihtmärk.</li>
            <li>Käe lõpuks max 7 kaarti — ülejääk ära viska / panka.</li>
            <li>Host: „Lõpeta käik“ kui mängija on valmis.</li>
          </ol>
          <button
            type="button"
            className="btn-outline text-xs mt-2"
            onClick={() => update({ ...state, coachDismissed: true })}
          >
            Sain aru
          </button>
        </div>
      )}

      {isHost && (
        <GameToolbar
          onReset={resetLobby}
          extra={
            phase === 'lobby' ? (
              <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={addPlayer}>
                <UserPlus size={14} /> Lisa mängija
              </button>
            ) : phase !== 'over' ? (
              <div className="flex flex-wrap gap-1.5">
                {phase === 'turn' && (
                  <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={doEndTurn}>
                    <SkipForward size={14} /> Lõpeta käik
                  </button>
                )}
                {phase === 'pay' && (
                  <button type="button" className="btn-outline text-xs" onClick={hostForcePay}>
                    Maksa (host)
                  </button>
                )}
                {phase === 'defend' && (
                  <button type="button" className="btn-outline text-xs" onClick={hostSkipDefend}>
                    Jäta kaitse vahele
                  </button>
                )}
                {phase !== 'turn' && phase !== 'lobby' && (
                  <button type="button" className="btn-outline text-xs text-accent-red/80" onClick={hostCancelPending}>
                    Tühista tegevus
                  </button>
                )}
              </div>
            ) : null
          }
        />
      )}

      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 text-gold font-display text-2xl md:text-3xl font-black">
          <Landmark /> Kinnistu Deal
        </div>
        <p className="text-white/50 text-sm mt-1">Kogu {winSets} kinnistukomplekti · igaüks mängib oma telefonis</p>
        {phase === 'turn' && (
          <p className="text-accent-cyan text-sm mt-1">
            Käik: <strong>{players[current]?.name}</strong>
            {isHost && (
              <span className="text-white/40"> · jäänud {playsLeft} · pakk {deck.length}</span>
            )}
          </p>
        )}
        {phase === 'pick_rent_color' && state.pending && (
          <p className="text-amber-200 text-sm mt-1">
            {players[state.pending.from]?.name} valib üüri värvi / maja komplekti
          </p>
        )}
        {phase === 'pick_target' && state.pending && (
          <p className="text-amber-200 text-sm mt-1">
            {players[state.pending.from]?.name} valib sihtmärki · {actionLabel(state.pending.action)}
          </p>
        )}
        {phase === 'defend' && state.pending?.target != null && (
          <p className="text-rose-200 text-sm mt-1">
            {players[state.pending.target]?.name} võib öelda „Ei, aitäh“
          </p>
        )}
        {phase === 'pay' && state.payFrom != null && (
          <p className="text-emerald-200 text-sm mt-1">
            {players[state.payFrom]?.name} maksab {state.payAmount}M
          </p>
        )}

      {/* Live action for TV / room */}
      {phase !== 'lobby' && phase !== 'over' && (
        <div className="mb-5 rounded-2xl border-2 border-gold/40 bg-gradient-to-r from-gold/15 via-black/40 to-cyan-500/10 px-4 py-4 text-center">
          {phase === 'turn' && (
            <p className="text-xl md:text-2xl font-display font-black text-gold">
              Käik: {players[current]?.name}
              <span className="text-white/50 text-base font-sans font-normal ml-2">
                · {playsLeft} kaarti jäänud
              </span>
            </p>
          )}
          {phase === 'pick_rent_color' && state.pending && (
            <p className="text-xl font-display font-black text-amber-200">
              {players[state.pending.from]?.name} valib üüri värvi / maja
            </p>
          )}
          {phase === 'pick_target' && state.pending && (
            <p className="text-xl font-display font-black text-amber-100">
              {players[state.pending.from]?.name} · {actionLabel(state.pending.action)}
              {state.pending.color && state.payAmount == null && (
                <span className="text-white/60 text-base font-sans font-normal">
                  {' '}· valib vastast
                </span>
              )}
            </p>
          )}
          {phase === 'defend' && state.pending?.target != null && (
            <p className="text-xl font-display font-black text-rose-200">
              {players[state.pending.target]?.name} — kaitse või luba efekt
            </p>
          )}
          {phase === 'pay' && state.payFrom != null && (
            <p className="text-xl md:text-2xl font-display font-black text-emerald-200">
              {players[state.payFrom]?.name} maksab{' '}
              <span className="text-gold">{state.payAmount}M</span>
              {state.pending?.from != null && (
                <span className="text-white/50 text-base font-sans font-normal">
                  {' '}→ {players[state.pending.from]?.name}
                </span>
              )}
            </p>
          )}
          {phase === 'pick_property' && state.pending && (
            <p className="text-xl font-display font-black text-violet-200">
              {players[state.pending.from]?.name} valib kinnistut
            </p>
          )}
          {log[0] && <p className="text-sm text-white/45 mt-2">{log[0]}</p>}
        </div>
      )}
      </div>

      {/* TV join */}
      {isHost && code && (
        <div className="card-panel border-gold/30 p-4 mb-4 max-w-xl mx-auto">
          <div className="flex flex-wrap items-start gap-4">
            <div className="bg-white p-1.5 rounded-lg shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&ecc=M&margin=4&data=${encodeURIComponent(appUrl(`/ekraan/${code}`))}`}
                alt="TV QR"
                width={100}
                height={100}
                className="block rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-gold font-bold mb-1">
                <Tv size={16} /> Teleri ekraan
              </div>
              <p className="text-[11px] text-white/50 mb-2 break-all">{appUrl(`/ekraan/${code}`)}</p>
              <div className="flex flex-wrap gap-2">
                <a href={appUrl(`/ekraan/${code}`)} target="_blank" rel="noreferrer" className="btn-outline text-xs flex items-center gap-1">
                  <ExternalLink size={12} /> Ava TV
                </a>
                <button
                  type="button"
                  className="btn-outline text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(appUrl(`/ekraan/${code}`)).catch(() => {})
                    setCopied('tv')
                    setTimeout(() => setCopied(null), 1500)
                  }}
                >
                  {copied === 'tv' ? 'Kopeeritud' : 'Kopeeri TV link'}
                </button>
              </div>
              <p className="text-[10px] text-white/35 mt-2">Mängijate QR-id on all iga nime juures.</p>
              <button
                type="button"
                className="btn-outline text-xs mt-2"
                onClick={() => {
                  const text = shareSessionLinks(
                    code,
                    appUrl('').replace(/\/$/, '') || window.location.origin,
                    players.map((p) => ({
                      name: p.name,
                      url: appUrl(`/deal/${code}/${p.token}`),
                    }))
                  )
                  navigator.clipboard.writeText(text).then(() => {
                    setCopied('share')
                    setTimeout(() => setCopied(null), 2000)
                  }).catch(() => {})
                }}
              >
                {copied === 'share' ? 'Kõik lingid kopeeritud' : 'Jaga kõik lingid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Players table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {players.map((p, i) => {
          const sets = completeSets(p)
          const active = phase !== 'lobby' && phase !== 'over' && i === current
          return (
            <div
              key={p.token || i}
              className={`rounded-2xl border p-3 md:p-4 ${
                active ? 'border-gold bg-gold/10 shadow-[0_0_20px_rgba(223,179,66,0.2)]' : 'border-white/10 bg-black/35'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-display text-gold text-lg truncate">
                  {active && <span className="text-accent-cyan mr-1">▶</span>}
                  {p.name}
                </div>
                <div className="text-xs text-white/50 flex gap-2 shrink-0">
                  <span className="text-emerald-300">{bankTotal(p)}M</span>
                  <span className="text-gold">
                    {sets}/{winSets}
                  </span>
                </div>
              </div>

              {isHost && phase === 'lobby' && (
                <div className="space-y-2 mb-2">
                  <input
                    className="input-field text-sm"
                    value={p.name}
                    onChange={(e) => rename(i, e.target.value)}
                    placeholder="Mängija nimi"
                  />
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 bg-white p-1.5 rounded-lg shadow">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&ecc=M&margin=4&data=${encodeURIComponent(appUrl(`/deal/${code}/${p.token}`))}`}
                        alt="QR"
                        width={88}
                        height={88}
                        className="block rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-[11px] text-white/55 leading-snug">
                        Skanni või kopeeri — ainult see mängija näeb oma kaarte.
                      </p>
                      <button
                        type="button"
                        className="btn-outline text-[10px] !py-1 !px-2 flex items-center gap-1"
                        onClick={() => copyLink(p.token)}
                      >
                        {copied === p.token ? <Check size={11} /> : <Copy size={11} />}
                        {copied === p.token ? 'Link kopeeritud' : 'Kopeeri link'}
                      </button>
                      {players.length > 2 && (
                        <button
                          type="button"
                          className="text-accent-red/70 text-[10px] block"
                          onClick={() => removePlayer(i)}
                        >
                          Eemalda mängija
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {phase !== 'lobby' && (
                <div className="mt-2">
                  <PlayerTableBoard player={p} />
                </div>
              )}

              {phase !== 'lobby' && isHost && (
                <div className="mt-2">
                  <p className="text-[10px] text-white/35 mb-1">
                    {p.hand.length} käes · pank {bankTotal(p)}M
                  </p>
                  <BankStrip bank={p.bank} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {phase === 'lobby' && isHost && (
        <div className="text-center space-y-3 mb-6">
          <p className="text-white/55 text-sm max-w-lg mx-auto leading-relaxed">
            Lisa 2–5 mängijat. Igaüks skannib <strong className="text-gold">oma QR-koodi</strong> (või avab lingi).
            Käsi on privaatne; teler näitab ainult lauda. Kui kõik on sees — alusta.
          </p>
          <button
            type="button"
            className="btn-gold text-lg px-8 py-3 inline-flex items-center gap-2"
            onClick={doStart}
            disabled={players.length < 2}
          >
            <Play size={18} /> Alusta mängu
          </button>
        </div>
      )}

      {phase === 'lobby' && !isHost && (
        <p className="text-center text-white/50 text-sm">Host valmistab mängijaid…</p>
      )}

      {phase === 'over' && winner != null && (
        <div className="card-panel border-gold/50 p-8 text-center mb-6">
          <Trophy className="inline text-gold mb-2" size={40} />
          <h2 className="font-display text-3xl text-gold font-black">{players[winner]?.name}</h2>
          <p className="text-white/60 mt-1">Kogus {winSets} komplekti!</p>
          {isHost && (
            <button type="button" className="btn-gold mt-4" onClick={doStart}>
              Mängi uuesti
            </button>
          )}
        </div>
      )}

      {phase === 'turn' && !isHost && (
        <p className="text-center text-white/40 text-sm mb-4">
          Mängijad mängivad oma telefonides. See on avalik laud.
        </p>
      )}

      {isHost && phase === 'turn' && (
        <p className="text-center text-white/45 text-xs mb-4 max-w-md mx-auto">
          Mängijad mängivad ise oma linkidel. Host saab käigu lõpetada, kui keegi takerdub.
        </p>
      )}

      {/* Host peek at current hand (optional help) */}
      {isHost && phase === 'turn' && players[current] && (
        <div className="card-panel border-white/10 p-3 mb-4 opacity-80">
          <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">
            Host-vaade · {players[current].name} käsi (privaatne mängijale)
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {players[current].hand.map((c) => (
              <CardFace key={c.id} card={c} />
            ))}
            {!players[current].hand.length && <span className="text-white/30 text-sm">tühi</span>}
          </div>
        </div>
      )}

      
      {isHost && phase !== 'lobby' && phase !== 'over' && (
        <div className="max-w-xl mx-auto mb-4">
          <button
            type="button"
            className="btn-outline text-xs w-full"
            onClick={() => setShowRepair((v) => !v)}
          >
            {showRepair ? 'Sulge parandus' : '🛠️ Paranda laud (host)'}
          </button>
          {showRepair && (
            <div className="card-panel border-white/15 p-3 mt-2 space-y-2">
              <p className="text-[11px] text-white/45">Liiguta kinnistu ühelt mängijalt teisele (kui midagi valesti läks).</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-white/50">
                  Kellelt
                  <select
                    className="input-field text-sm mt-1"
                    value={repairFrom}
                    onChange={(e) => setRepairFrom(Number(e.target.value))}
                  >
                    {players.map((p, i) => (
                      <option key={p.token} value={i}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-white/50">
                  Kellele
                  <select
                    className="input-field text-sm mt-1"
                    value={repairTo}
                    onChange={(e) => setRepairTo(Number(e.target.value))}
                  >
                    {players.map((p, i) => (
                      <option key={p.token} value={i}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-xs text-white/50 block">
                Kinnistu
                <select
                  className="input-field text-sm mt-1"
                  value={repairCard}
                  onChange={(e) => setRepairCard(e.target.value)}
                >
                  <option value="">— vali —</option>
                  {players[repairFrom] &&
                    Object.values(players[repairFrom].props || {})
                      .flat()
                      .map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                </select>
              </label>
              <button
                type="button"
                className="btn-gold text-sm w-full"
                disabled={!repairCard}
                onClick={() => {
                  if (!repairCard) return
                  update((s) => hostMoveProperty(s, repairFrom, repairTo, repairCard))
                  setRepairCard('')
                }}
              >
                Liiguta
              </button>
            </div>
          )}
        </div>
      )}

      {log?.length > 0 && (
        <div className="text-center space-y-0.5 mt-4">
          {log.slice(0, 6).map((line, i) => (
            <p key={i} className={`text-xs ${i === 0 ? 'text-gold/90' : 'text-white/30'}`}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function initialKinnistuDealState(code: string): KinnistuDealState {
  return {
    players: [emptyPlayer('Mängija 1'), emptyPlayer('Mängija 2'), emptyPlayer('Mängija 3')],
    deck: [],
    discard: [],
    current: 0,
    playsLeft: 0,
    phase: 'lobby',
    log: [],
    code,
    packData: { winSets: 3, startHand: 5 },
  }
}