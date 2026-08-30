import { useMemo } from 'react'
import type {
  DealCard,
  KinnistuDealState,
  PlayerBoard,
  PropColor,
  ActionKind,
} from './types'
import { SET_SIZE, COLOR_STYLE, completeSets, bankTotal } from './types'
import { buildDeck, drawFrom } from './deck'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import { Landmark, Coins, Sparkles, Trophy, Shuffle, UserPlus } from 'lucide-react'

type Props = {
  state: KinnistuDealState
  update: (p: Partial<KinnistuDealState> | ((s: KinnistuDealState) => KinnistuDealState)) => void
  isHost?: boolean
  sessionCode?: string
}

function CardFace({
  card,
  small,
  onClick,
  disabled,
}: {
  card: DealCard
  small?: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  const base =
    'relative rounded-xl border-2 shadow-lg select-none transition-transform ' +
    (small ? 'w-[4.5rem] h-[6.2rem] text-[0.65rem]' : 'w-28 h-40 text-xs') +
    (onClick && !disabled ? ' cursor-pointer hover:scale-105 active:scale-95' : '') +
    (disabled ? ' opacity-40' : '')

  if (card.kind === 'money') {
    return (
      <button type="button" disabled={disabled || !onClick} onClick={onClick} className={`${base} border-emerald-400/60 bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-100`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1">
          <Coins size={small ? 16 : 22} className="text-emerald-300" />
          <span className="font-display font-black text-lg md:text-2xl text-emerald-200">{card.value}M</span>
          <span className="uppercase tracking-wider opacity-70">Raha</span>
        </div>
      </button>
    )
  }
  if (card.kind === 'property') {
    const st = COLOR_STYLE[card.color]
    return (
      <button type="button" disabled={disabled || !onClick} onClick={onClick} className={`${base} border-white/30 text-white`} style={{ background: `linear-gradient(160deg, ${st.bg} 0%, #0a0a0a 75%)` }}>
        <div className="absolute top-0 inset-x-0 h-3 rounded-t-[0.6rem]" style={{ background: st.bg }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1.5 pt-3">
          <Landmark size={small ? 12 : 16} className="opacity-80" />
          <span className="font-bold leading-tight text-center line-clamp-2">{card.name}</span>
          <span className="text-[0.6rem] opacity-70">{st.label}</span>
          <span className="font-display text-gold font-black">{card.value}M</span>
        </div>
      </button>
    )
  }
  // action
  const accent =
    card.action === 'just_say_no'
      ? 'from-rose-700 to-rose-950 border-rose-400/50'
      : card.action === 'deal_breaker'
        ? 'from-violet-700 to-violet-950 border-violet-300/50'
        : 'from-amber-700 to-amber-950 border-amber-300/50'
  return (
    <button type="button" disabled={disabled || !onClick} onClick={onClick} className={`${base} bg-gradient-to-br ${accent} text-amber-50`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1.5">
        <Sparkles size={small ? 14 : 18} className="text-amber-200" />
        <span className="font-bold leading-tight text-center line-clamp-3">{card.name}</span>
        <span className="text-[0.55rem] uppercase tracking-wide opacity-70">Tegevus</span>
      </div>
    </button>
  )
}

function PropPile({ color, cards }: { color: PropColor; cards: DealCard[] }) {
  const need = SET_SIZE[color]
  const done = cards.length >= need
  const st = COLOR_STYLE[color]
  return (
    <div
      className={`rounded-lg border px-1.5 py-1 min-w-[3.2rem] ${done ? 'border-gold shadow-[0_0_12px_rgba(223,179,66,0.35)]' : 'border-white/15'}`}
      style={{ background: `${st.bg}33` }}
      title={`${st.label} ${cards.length}/${need}`}
    >
      <div className="h-1.5 rounded-full mb-1" style={{ background: st.bg }} />
      <div className="text-[0.6rem] text-white/90 font-bold text-center">
        {cards.length}/{need}
      </div>
    </div>
  )
}

export default function KinnistuDealGame({ state, update, isHost = true, sessionCode }: Props) {
  const { t } = useI18n()
  const {
    players,
    deck,
    discard,
    current,
    playsLeft,
    phase,
    pending,
    payFrom,
    payAmount,
    winner,
    log,
  } = state
  const me = players[current]
  const winSets = state.packData?.winSets ?? 3

  const rankings = useMemo(
    () =>
      players
        .map((p, i) => ({ i, name: p.name, sets: completeSets(p), bank: bankTotal(p) }))
        .sort((a, b) => b.sets - a.sets || b.bank - a.bank),
    [players]
  )

  function pushLog(line: string) {
    update((s) => ({ ...s, log: [line, ...(s.log || [])].slice(0, 12) }))
  }

  function startGame() {
    if (!isHost) return
    let d = buildDeck()
    const startHand = state.packData?.startHand ?? 5
    const nextPlayers: PlayerBoard[] = players.map((p) => {
      const drawn = drawFrom(d, startHand)
      d = drawn.deck
      return { ...p, hand: drawn.cards, bank: [], props: {} }
    })
    // first player draws 2 to start turn
    const first = drawFrom(d, 2)
    d = first.deck
    nextPlayers[0] = { ...nextPlayers[0], hand: [...nextPlayers[0].hand, ...first.cards] }
    update({
      players: nextPlayers,
      deck: d,
      discard: [],
      current: 0,
      playsLeft: 3,
      phase: 'turn',
      pending: null,
      winner: undefined,
      log: [`Mäng algas · ${nextPlayers.map((p) => p.name).join(', ')}`],
    })
  }

  function ensureDeck(s: KinnistuDealState): KinnistuDealState {
    if (s.deck.length > 0) return s
    if (!s.discard.length) return s
    const reshuffle = [...s.discard]
    for (let i = reshuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[reshuffle[i], reshuffle[j]] = [reshuffle[j], reshuffle[i]]
    }
    return { ...s, deck: reshuffle, discard: [] }
  }

  function endTurn() {
    if (!isHost || phase !== 'turn') return
    update((s) => {
      let st = { ...s }
      // hand limit 7
      const p = { ...st.players[st.current] }
      while (p.hand.length > 7) {
        const c = p.hand.pop()!
        st.discard = [...st.discard, c]
      }
      st.players = st.players.map((x, i) => (i === st.current ? p : x))
      const next = (st.current + 1) % st.players.length
      st = ensureDeck(st)
      const drawn = drawFrom(st.deck, 2)
      st.deck = drawn.deck
      const np = { ...st.players[next], hand: [...st.players[next].hand, ...drawn.cards] }
      st.players = st.players.map((x, i) => (i === next ? np : x))
      st.current = next
      st.playsLeft = 3
      st.phase = 'turn'
      st.pending = null
      st.log = [`${np.name} käik`, ...st.log].slice(0, 12)
      return st
    })
  }

  function checkWin(s: KinnistuDealState): KinnistuDealState {
    for (let i = 0; i < s.players.length; i++) {
      if (completeSets(s.players[i]) >= winSets) {
        return { ...s, phase: 'over', winner: i, log: [`🏆 ${s.players[i].name} võitis!`, ...s.log].slice(0, 12) }
      }
    }
    return s
  }

  function playCard(cardId: string) {
    if (!isHost || phase !== 'turn' || playsLeft <= 0) return
    const card = me.hand.find((c) => c.id === cardId)
    if (!card) return

    update((s) => {
      let st = { ...s }
      const pi = st.current
      const p = { ...st.players[pi], hand: st.players[pi].hand.filter((c) => c.id !== cardId) }

      if (card.kind === 'money') {
        p.bank = [...p.bank, card]
        st.players = st.players.map((x, i) => (i === pi ? p : x))
        st.playsLeft = st.playsLeft - 1
        st.log = [`${p.name} pani panka ${card.value}M`, ...st.log].slice(0, 12)
        return st
      }

      if (card.kind === 'property') {
        const col = card.color
        const pile = [...(p.props[col] || []), card]
        p.props = { ...p.props, [col]: pile }
        st.players = st.players.map((x, i) => (i === pi ? p : x))
        st.playsLeft = st.playsLeft - 1
        st.log = [`${p.name} · ${card.name}`, ...st.log].slice(0, 12)
        return checkWin(st)
      }

      // actions
      if (card.action === 'pass_go') {
        st = ensureDeck(st)
        const drawn = drawFrom(st.deck, 2)
        st.deck = drawn.deck
        p.hand = [...p.hand, ...drawn.cards]
        st.discard = [...st.discard, card]
        st.players = st.players.map((x, i) => (i === pi ? p : x))
        st.playsLeft = st.playsLeft - 1
        st.log = [`${p.name} · Mine edasi (+2)`, ...st.log].slice(0, 12)
        return st
      }

      if (card.action === 'just_say_no') {
        // keep as bank value or discard — treat as bank
        p.bank = [...p.bank, card]
        st.players = st.players.map((x, i) => (i === pi ? p : x))
        st.playsLeft = st.playsLeft - 1
        st.log = [`${p.name} hoidis „Ei, aitäh“`, ...st.log].slice(0, 12)
        return st
      }

      // targeted actions
      st.players = st.players.map((x, i) => (i === pi ? p : x))
      st.discard = [...st.discard, card]
      st.playsLeft = st.playsLeft - 1
      st.pending = { action: card.action, from: pi, cardId: card.id }
      st.phase = 'pick_target'
      st.log = [`${p.name} mängis: ${card.name}`, ...st.log].slice(0, 12)
      return st
    })
  }

  function pickTarget(target: number) {
    if (!isHost || phase !== 'pick_target' || !pending) return
    if (target === pending.from) return

    update((s) => {
      const st = { ...s }
      const act = st.pending!
      const from = st.players[act.from]
      const to = st.players[target]

      if (act.action === 'birthday') {
        // everyone pays 2 — simplified: target pays 2 only for party pace, or all others
        st.phase = 'pay'
        st.payFrom = target
        st.payAmount = 2
        st.pending = act
        st.log = [`Sünnipäev: ${to.name} maksab 2M`, ...st.log].slice(0, 12)
        return st
      }
      if (act.action === 'debt') {
        st.phase = 'pay'
        st.payFrom = target
        st.payAmount = 5
        st.log = [`Võlanõue: ${to.name} → 5M`, ...st.log].slice(0, 12)
        return st
      }
      if (act.action === 'rent') {
        st.phase = 'pay'
        st.payFrom = target
        st.payAmount = 3
        st.log = [`Üür: ${to.name} → 3M`, ...st.log].slice(0, 12)
        return st
      }
      if (act.action === 'sly_deal') {
        // steal one loose property (not full set)
        let stolen: DealCard | null = null
        const newProps = { ...to.props }
        for (const col of Object.keys(newProps) as PropColor[]) {
          const arr = [...(newProps[col] || [])]
          if (arr.length > 0 && arr.length < SET_SIZE[col]) {
            stolen = arr.pop()!
            newProps[col] = arr
            break
          }
        }
        if (stolen && stolen.kind === 'property') {
          const fp = { ...from, props: { ...from.props } }
          fp.props[stolen.color] = [...(fp.props[stolen.color] || []), stolen]
          st.players = st.players.map((x, i) => {
            if (i === act.from) return fp
            if (i === target) return { ...to, props: newProps }
            return x
          })
          st.log = [`Salavargus: ${stolen.name} → ${from.name}`, ...st.log].slice(0, 12)
        } else {
          st.log = [`Salavargus ebaõnnestus`, ...st.log].slice(0, 12)
        }
        st.phase = 'turn'
        st.pending = null
        return checkWin(st)
      }
      if (act.action === 'forced_deal') {
        // swap one property each if possible
        st.phase = 'turn'
        st.pending = null
        st.log = [`Sunnitud vahetus (host valib käsitsi järgmisena)`, ...st.log].slice(0, 12)
        return st
      }
      if (act.action === 'deal_breaker') {
        // steal a full set
        let takenColor: PropColor | null = null
        const newProps = { ...to.props }
        for (const col of Object.keys(SET_SIZE) as PropColor[]) {
          const arr = newProps[col] || []
          if (arr.length >= SET_SIZE[col]) {
            takenColor = col
            break
          }
        }
        if (takenColor) {
          const setCards = newProps[takenColor] || []
          delete newProps[takenColor]
          const fp = { ...from, props: { ...from.props, [takenColor]: setCards } }
          st.players = st.players.map((x, i) => {
            if (i === act.from) return fp
            if (i === target) return { ...to, props: newProps }
            return x
          })
          st.log = [`Tehingumurdja: ${COLOR_STYLE[takenColor].label} → ${from.name}`, ...st.log].slice(0, 12)
        }
        st.phase = 'turn'
        st.pending = null
        return checkWin(st)
      }
      st.phase = 'turn'
      st.pending = null
      return st
    })
  }

  function resolvePay() {
    if (!isHost || phase !== 'pay' || payFrom == null || payAmount == null || !pending) return
    update((s) => {
      const st = { ...s }
      const payerI = st.payFrom!
      const recvI = st.pending!.from
      const amount = st.payAmount!
      let payer = { ...st.players[payerI], bank: [...st.players[payerI].bank] }
      let recv = { ...st.players[recvI], bank: [...st.players[recvI].bank] }
      let left = amount
      // pay from bank money first
      const keep: DealCard[] = []
      for (const c of payer.bank) {
        if (left <= 0) {
          keep.push(c)
          continue
        }
        if (c.kind === 'money' && c.value <= left) {
          left -= c.value
          recv.bank.push(c)
        } else if (c.kind === 'money') {
          keep.push(c)
        } else {
          keep.push(c)
        }
      }
      payer.bank = keep
      st.players = st.players.map((x, i) => {
        if (i === payerI) return payer
        if (i === recvI) return recv
        return x
      })
      st.phase = 'turn'
      st.pending = null
      st.payFrom = undefined
      st.payAmount = undefined
      st.log = [`Makstud ~${amount - left}M`, ...st.log].slice(0, 12)
      return st
    })
  }

  function addPlayer() {
    if (!isHost || phase !== 'lobby') return
    if (players.length >= 5) return
    update({
      players: [...players, { name: `Mängija ${players.length + 1}`, hand: [], bank: [], props: {} }],
    })
  }

  function rename(i: number, name: string) {
    if (!isHost) return
    update({
      players: players.map((p, idx) => (idx === i ? { ...p, name } : p)),
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
      players: players.map((p) => ({ ...p, hand: [], bank: [], props: {} })),
      log: [],
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 pb-8">
      {isHost && <SessionCodeBadge code={sessionCode} />}
      {isHost && (
        <GameToolbar
          onReset={resetLobby}
          extra={
            phase === 'lobby' ? (
              <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={addPlayer}>
                <UserPlus size={14} /> {t('dealAddPlayer')}
              </button>
            ) : null
          }
        />
      )}

      {/* Hero */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 text-gold font-display text-2xl md:text-3xl font-black tracking-wide">
          <Landmark className="text-gold" /> {t('game_kinnistu_deal')}
        </div>
        <p className="text-white/45 text-sm mt-1">{t('dealTagline')}</p>
        <p className="text-white/30 text-xs mt-0.5">{t('dealGoal', { n: String(winSets) })}</p>
      </div>

      {/* Table — all players */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {players.map((p, i) => {
          const sets = completeSets(p)
          const active = phase !== 'lobby' && phase !== 'over' && i === current
          return (
            <div
              key={i}
              className={`rounded-2xl border p-3 md:p-4 transition ${
                active ? 'border-gold bg-gold/10 shadow-[0_0_24px_rgba(223,179,66,0.2)]' : 'border-white/10 bg-black/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-display text-gold text-lg truncate">
                  {active && <span className="text-accent-cyan mr-1">▶</span>}
                  {p.name}
                </div>
                <div className="text-xs text-white/50 flex gap-2">
                  <span className="text-emerald-300/90">{bankTotal(p)}M</span>
                  <span className="text-gold">{sets}/{winSets}</span>
                </div>
              </div>
              {isHost && phase === 'lobby' && (
                <input
                  className="input-field text-sm mb-2"
                  value={p.name}
                  onChange={(e) => rename(i, e.target.value)}
                />
              )}
              <div className="flex flex-wrap gap-1 mb-2">
                {(Object.keys(SET_SIZE) as PropColor[]).map((c) => (
                  <PropPile key={c} color={c} cards={p.props[c] || []} />
                ))}
              </div>
              {!isHost && (
                <p className="text-white/30 text-[10px]">
                  {t('dealHandHidden')} · {p.hand.length} {t('dealCards')}
                </p>
              )}
              {isHost && phase !== 'lobby' && i !== current && (
                <p className="text-white/35 text-[10px]">
                  {p.hand.length} {t('dealCards')} · bank {p.bank.length}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Lobby */}
      {phase === 'lobby' && isHost && (
        <div className="text-center space-y-3 mb-6">
          <p className="text-white/50 text-sm max-w-md mx-auto">{t('dealLobbyHint')}</p>
          <button type="button" className="btn-gold text-lg px-8 py-3 inline-flex items-center gap-2" onClick={startGame}>
            <Shuffle size={18} /> {t('dealStart')}
          </button>
        </div>
      )}

      {/* Winner */}
      {phase === 'over' && winner != null && (
        <div className="card-panel border-gold/50 p-8 text-center mb-6 winner-stage">
          <Trophy className="inline text-gold mb-2" size={40} />
          <h2 className="font-display text-3xl text-gold font-black">{players[winner]?.name}</h2>
          <p className="text-white/60 mt-1">{t('dealWinner')}</p>
          {isHost && (
            <button type="button" className="btn-gold mt-4" onClick={startGame}>
              {t('playAgain')}
            </button>
          )}
        </div>
      )}

      {/* Host: current hand */}
      {isHost && phase === 'turn' && me && (
        <div className="card-panel border-gold/30 p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-display text-gold text-lg">
              {me.name} · {t('dealYourHand')}
            </h3>
            <div className="text-xs text-white/50">
              {t('dealPlaysLeft')}: <span className="text-gold font-bold">{playsLeft}</span>
              <span className="mx-2">·</span>
              {t('dealDeck')}: {deck.length}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {me.hand.map((c) => (
              <CardFace key={c.id} card={c} onClick={() => playCard(c.id)} disabled={playsLeft <= 0} />
            ))}
            {me.hand.length === 0 && <p className="text-white/40 text-sm">{t('dealEmptyHand')}</p>}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" className="btn-gold" onClick={endTurn}>
              {t('dealEndTurn')}
            </button>
          </div>
          <p className="text-white/35 text-[11px] text-center mt-3">{t('dealPlayHint')}</p>
        </div>
      )}

      {/* Pick target */}
      {isHost && phase === 'pick_target' && pending && (
        <div className="card-panel border-amber-400/40 p-4 mb-4 text-center">
          <p className="text-amber-200 font-medium mb-3">{t('dealPickTarget')}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {players.map((p, i) =>
              i === pending.from ? null : (
                <button key={i} type="button" className="btn-outline" onClick={() => pickTarget(i)}>
                  {p.name}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Pay */}
      {isHost && phase === 'pay' && (
        <div className="card-panel border-emerald-400/40 p-4 mb-4 text-center">
          <p className="text-emerald-200 mb-3">
            {players[payFrom!]?.name} {t('dealPays')} {payAmount}M
          </p>
          <button type="button" className="btn-gold" onClick={resolvePay}>
            {t('dealConfirmPay')}
          </button>
        </div>
      )}

      {/* TV: no hand, show log + rankings */}
      {!isHost && phase !== 'lobby' && (
        <div className="card-panel border-white/10 p-4 mb-4">
          <h3 className="text-gold font-display mb-2">{t('dealLiveTable')}</h3>
          <ol className="text-sm text-white/70 space-y-1">
            {rankings.map((r, idx) => (
              <li key={r.i}>
                {idx + 1}. {r.name} — {r.sets} {t('dealSets')} · {r.bank}M
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Log */}
      {log && log.length > 0 && (
        <div className="text-center space-y-1 mt-2">
          {log.slice(0, 5).map((line, i) => (
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
    players: [
      { name: 'Mängija 1', hand: [], bank: [], props: {} },
      { name: 'Mängija 2', hand: [], bank: [], props: {} },
      { name: 'Mängija 3', hand: [], bank: [], props: {} },
    ],
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
export type { KinnistuDealState } from './types'
