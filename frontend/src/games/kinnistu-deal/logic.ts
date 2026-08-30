import type { DealCard, KinnistuDealState, PlayerBoard, PropColor } from './types'
import { SET_SIZE, completeSets, makeToken } from './types'
import { buildDeck, drawFrom } from './deck'

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

export function checkWin(s: KinnistuDealState): KinnistuDealState {
  const need = s.packData?.winSets ?? 3
  for (let i = 0; i < s.players.length; i++) {
    if (completeSets(s.players[i]) >= need) {
      return {
        ...s,
        phase: 'over',
        winner: i,
        log: [`🏆 ${s.players[i].name} võitis!`, ...s.log].slice(0, 14),
      }
    }
  }
  return s
}

export function emptyPlayer(name: string): PlayerBoard {
  return { token: makeToken(), name, hand: [], bank: [], props: {} }
}

export function startGame(s: KinnistuDealState): KinnistuDealState {
  if (s.players.length < 2) return s
  let deck = buildDeck()
  const startHand = s.packData?.startHand ?? 5
  const players = s.players.map((p) => {
    const drawn = drawFrom(deck, startHand)
    deck = drawn.deck
    return { ...p, hand: drawn.cards, bank: [], props: {} }
  })
  const first = drawFrom(deck, 2)
  deck = first.deck
  players[0] = { ...players[0], hand: [...players[0].hand, ...first.cards] }
  return {
    ...s,
    players,
    deck,
    discard: [],
    current: 0,
    playsLeft: 3,
    phase: 'turn',
    pending: null,
    winner: undefined,
    payFrom: undefined,
    payAmount: undefined,
    log: [`Mäng algas · ${players.map((p) => p.name).join(', ')}`],
  }
}

/** End turn: hand limit 7, next player draws 2. */
export function endTurn(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'turn') return s
  let st = { ...s }
  const p = { ...st.players[st.current], hand: [...st.players[st.current].hand] }
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
  st.payFrom = undefined
  st.payAmount = undefined
  st.log = [`${np.name} käik`, ...st.log].slice(0, 14)
  return st
}

export function playCard(s: KinnistuDealState, playerIdx: number, cardId: string): KinnistuDealState {
  if (s.phase !== 'turn' || s.current !== playerIdx || s.playsLeft <= 0) return s
  const me = s.players[playerIdx]
  const card = me.hand.find((c) => c.id === cardId)
  if (!card) return s

  let st: KinnistuDealState = {
    ...s,
    players: s.players.map((p, i) =>
      i === playerIdx ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p
    ),
  }
  const p = { ...st.players[playerIdx] }

  if (card.kind === 'money') {
    p.bank = [...p.bank, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft = st.playsLeft - 1
    st.log = [`${p.name} → pank ${card.value}M`, ...st.log].slice(0, 14)
    return st
  }

  if (card.kind === 'property') {
    const col = card.color
    p.props = { ...p.props, [col]: [...(p.props[col] || []), card] }
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft = st.playsLeft - 1
    st.log = [`${p.name} · ${card.name}`, ...st.log].slice(0, 14)
    return checkWin(st)
  }

  // action
  if (card.action === 'pass_go') {
    st = ensureDeck(st)
    const drawn = drawFrom(st.deck, 2)
    st.deck = drawn.deck
    p.hand = [...p.hand, ...drawn.cards]
    st.discard = [...st.discard, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft = st.playsLeft - 1
    st.log = [`${p.name} · Mine edasi (+2)`, ...st.log].slice(0, 14)
    return st
  }

  if (card.action === 'just_say_no') {
    // bank as value for party simplicity
    p.bank = [...p.bank, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft = st.playsLeft - 1
    st.log = [`${p.name} hoidis „Ei, aitäh“`, ...st.log].slice(0, 14)
    return st
  }

  st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
  st.discard = [...st.discard, card]
  st.playsLeft = st.playsLeft - 1
  st.pending = { action: card.action, from: playerIdx, cardId: card.id }
  st.phase = 'pick_target'
  st.log = [`${p.name} mängis: ${card.name}`, ...st.log].slice(0, 14)
  return st
}

export function pickTarget(s: KinnistuDealState, target: number): KinnistuDealState {
  if (s.phase !== 'pick_target' || !s.pending) return s
  if (target === s.pending.from) return s
  const act = s.pending
  const from = s.players[act.from]
  const to = s.players[target]
  let st = { ...s }

  if (act.action === 'birthday') {
    st.phase = 'pay'
    st.payFrom = target
    st.payAmount = 2
    st.log = [`Sünnipäev: ${to.name} maksab 2M`, ...st.log].slice(0, 14)
    return st
  }
  if (act.action === 'debt') {
    st.phase = 'pay'
    st.payFrom = target
    st.payAmount = 5
    st.log = [`Võlanõue: ${to.name} → 5M`, ...st.log].slice(0, 14)
    return st
  }
  if (act.action === 'rent') {
    st.phase = 'pay'
    st.payFrom = target
    st.payAmount = 3
    st.log = [`Üür: ${to.name} → 3M`, ...st.log].slice(0, 14)
    return st
  }
  if (act.action === 'sly_deal') {
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
      st.log = [`Salavargus: ${stolen.name} → ${from.name}`, ...st.log].slice(0, 14)
    } else {
      st.log = [`Salavargus ebaõnnestus (pole vaba kinnistut)`, ...st.log].slice(0, 14)
    }
    st.phase = 'turn'
    st.pending = null
    return checkWin(st)
  }
  if (act.action === 'deal_breaker') {
    let taken: PropColor | null = null
    const newProps = { ...to.props }
    for (const col of Object.keys(SET_SIZE) as PropColor[]) {
      if ((newProps[col] || []).length >= SET_SIZE[col]) {
        taken = col
        break
      }
    }
    if (taken) {
      const setCards = newProps[taken] || []
      delete newProps[taken]
      const fp = { ...from, props: { ...from.props, [taken]: setCards } }
      st.players = st.players.map((x, i) => {
        if (i === act.from) return fp
        if (i === target) return { ...to, props: newProps }
        return x
      })
      st.log = [`Tehingumurdja → ${from.name}`, ...st.log].slice(0, 14)
    }
    st.phase = 'turn'
    st.pending = null
    return checkWin(st)
  }
  // forced_deal: simple — steal one loose property if any (party shortcut)
  if (act.action === 'forced_deal') {
    return pickTarget({ ...st, pending: { ...act, action: 'sly_deal' } }, target)
  }
  st.phase = 'turn'
  st.pending = null
  return st
}

/** Pay from bank cards toward receiver. */
export function resolvePay(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'pay' || s.payFrom == null || s.payAmount == null || !s.pending) return s
  const payerI = s.payFrom
  const recvI = s.pending.from
  let amount = s.payAmount
  let payer = { ...s.players[payerI], bank: [...s.players[payerI].bank] }
  let recv = { ...s.players[recvI], bank: [...s.players[recvI].bank] }
  const keep: DealCard[] = []
  const sorted = [...payer.bank].sort((a, b) => a.value - b.value)
  for (const c of sorted) {
    if (amount > 0 && c.kind === 'money' && c.value <= amount) {
      amount -= c.value
      recv.bank.push(c)
    } else {
      keep.push(c)
    }
  }
  payer.bank = keep
  const st: KinnistuDealState = {
    ...s,
    players: s.players.map((x, i) => {
      if (i === payerI) return payer
      if (i === recvI) return recv
      return x
    }),
    phase: 'turn',
    pending: null,
    payFrom: undefined,
    payAmount: undefined,
    log: [`Makstud (${s.players[payerI].name})`, ...s.log].slice(0, 14),
  }
  return st
}
