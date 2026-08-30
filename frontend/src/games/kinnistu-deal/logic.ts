import type { DealCard, KinnistuDealState, PlayerBoard, PropColor, ActionKind } from './types'
import {
  SET_SIZE,
  completeSets,
  makeToken,
  looseProperties,
  fullSetColors,
  actionLabel,
} from './types'
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
        confettiAt: Date.now(),
        log: [`🏆 ${s.players[i].name} võitis mängu!`, ...s.log].slice(0, 16),
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
    confettiAt: undefined,
    log: [`🎲 Mäng algas · ${players.map((p) => p.name).join(' · ')}`],
  }
}

export function endTurn(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'turn') return s
  let st = { ...s }
  const p = { ...st.players[st.current], hand: [...st.players[st.current].hand] }
  let discarded = 0
  while (p.hand.length > 7) {
    const c = p.hand.pop()!
    st.discard = [...st.discard, c]
    discarded++
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
  const discardNote = discarded ? ` (viskas ${discarded} üleliigset)` : ''
  st.log = [`→ ${np.name} käik${discardNote}`, ...st.log].slice(0, 16)
  return st
}

function hasJustSayNo(p: PlayerBoard): boolean {
  return p.hand.some((c) => c.kind === 'action' && c.action === 'just_say_no')
}

/** After targeting, offer defend if target holds Just Say No. */
function afterTarget(st: KinnistuDealState, target: number): KinnistuDealState {
  const pending = st.pending!
  const targetPlayer = st.players[target]
  if (hasJustSayNo(targetPlayer) && pending.action !== 'just_say_no') {
    return {
      ...st,
      phase: 'defend',
      pending: { ...pending, target },
      log: [`⚡ ${targetPlayer.name} võib öelda „Ei, aitäh“`, ...st.log].slice(0, 16),
    }
  }
  return applyEffect({ ...st, pending: { ...pending, target } })
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
    st.playsLeft -= 1
    st.log = [`💰 ${p.name} pani panka ${card.value}M`, ...st.log].slice(0, 16)
    return st
  }

  if (card.kind === 'property') {
    const col = card.color
    p.props = { ...p.props, [col]: [...(p.props[col] || []), card] }
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    const sets = completeSets(p)
    st.log = [`🏠 ${p.name} · ${card.name}${sets ? ` (${sets} kompl.)` : ''}`, ...st.log].slice(0, 16)
    return checkWin(st)
  }

  if (card.action === 'pass_go') {
    st = ensureDeck(st)
    const drawn = drawFrom(st.deck, 2)
    st.deck = drawn.deck
    p.hand = [...p.hand, ...drawn.cards]
    st.discard = [...st.discard, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    st.log = [`📜 ${p.name} · Mine edasi (+2 kaarti)`, ...st.log].slice(0, 16)
    return st
  }

  if (card.action === 'just_say_no') {
    p.bank = [...p.bank, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    st.log = [`${p.name} pani „Ei, aitäh“ väärtusena panka`, ...st.log].slice(0, 16)
    return st
  }

  st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
  st.discard = [...st.discard, card]
  st.playsLeft -= 1
  st.pending = { action: card.action, from: playerIdx, cardId: card.id }
  st.phase = 'pick_target'
  st.log = [`🎯 ${p.name} mängis: ${actionLabel(card.action)}`, ...st.log].slice(0, 16)
  return st
}

export function pickTarget(s: KinnistuDealState, target: number): KinnistuDealState {
  if (s.phase !== 'pick_target' || !s.pending) return s
  if (target === s.pending.from) return s
  return afterTarget(s, target)
}

/** Target declines with Just Say No from hand. */
export function defendWithNo(s: KinnistuDealState, playerIdx: number): KinnistuDealState {
  if (s.phase !== 'defend' || !s.pending || s.pending.target !== playerIdx) return s
  const p = s.players[playerIdx]
  const noCard = p.hand.find((c) => c.kind === 'action' && c.action === 'just_say_no')
  if (!noCard) return s
  return {
    ...s,
    players: s.players.map((x, i) =>
      i === playerIdx ? { ...x, hand: x.hand.filter((c) => c.id !== noCard.id) } : x
    ),
    discard: [...s.discard, noCard],
    phase: 'turn',
    pending: null,
    log: [`🚫 ${p.name} ütles „Ei, aitäh“ — kaart tühistatud`, ...s.log].slice(0, 16),
  }
}

/** Target accepts the effect (no defense). */
export function skipDefend(s: KinnistuDealState, playerIdx: number): KinnistuDealState {
  if (s.phase !== 'defend' || !s.pending || s.pending.target !== playerIdx) return s
  return applyEffect(s)
}

export function pickProperty(s: KinnistuDealState, propertyId: string): KinnistuDealState {
  if (s.phase !== 'pick_property' || !s.pending || s.pending.target == null) return s
  return applyEffect({
    ...s,
    pending: { ...s.pending, propertyId },
  })
}

function applyEffect(s: KinnistuDealState): KinnistuDealState {
  const act = s.pending
  if (!act || act.target == null) return { ...s, phase: 'turn', pending: null }
  const from = s.players[act.from]
  const to = s.players[act.target]
  let st = { ...s }

  if (act.action === 'birthday') {
    return {
      ...st,
      phase: 'pay',
      payFrom: act.target,
      payAmount: 2,
      log: [`🎂 ${to.name} maksab sünnipäevaks 2M → ${from.name}`, ...st.log].slice(0, 16),
    }
  }
  if (act.action === 'debt') {
    return {
      ...st,
      phase: 'pay',
      payFrom: act.target,
      payAmount: 5,
      log: [`💸 Võlanõue: ${to.name} → ${from.name} (5M)`, ...st.log].slice(0, 16),
    }
  }
  if (act.action === 'rent') {
    // rent scales lightly with attacker's sets
    const amount = 2 + completeSets(from)
    return {
      ...st,
      phase: 'pay',
      payFrom: act.target,
      payAmount: Math.min(amount, 6),
      log: [`🔑 Üür: ${to.name} maksab ${Math.min(amount, 6)}M → ${from.name}`, ...st.log].slice(0, 16),
    }
  }

  if (act.action === 'sly_deal') {
    const loose = looseProperties(to)
    if (!loose.length) {
      return {
        ...st,
        phase: 'turn',
        pending: null,
        log: [`Salakaup ebaõnnestus — ${to.name}l pole vaba kinnistut`, ...st.log].slice(0, 16),
      }
    }
    if (!act.propertyId && loose.length > 1) {
      return {
        ...st,
        phase: 'pick_property',
        pending: act,
        log: [`Vali, millist kinnistut võtta ${to.name}lt`, ...st.log].slice(0, 16),
      }
    }
    const chosen = act.propertyId
      ? loose.find((c) => c.id === act.propertyId) || loose[0]
      : loose[0]
    if (chosen.kind !== 'property') return { ...st, phase: 'turn', pending: null }
    const toProps = { ...to.props }
    toProps[chosen.color] = (toProps[chosen.color] || []).filter((c) => c.id !== chosen.id)
    const fromProps = { ...from.props }
    fromProps[chosen.color] = [...(fromProps[chosen.color] || []), chosen]
    st.players = st.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps }
      if (i === act.target) return { ...to, props: toProps }
      return x
    })
    st.phase = 'turn'
    st.pending = null
    st.log = [`🕵️ Salakaup: ${chosen.name} → ${from.name}`, ...st.log].slice(0, 16)
    return checkWin(st)
  }

  if (act.action === 'deal_breaker') {
    const full = fullSetColors(to)
    if (!full.length) {
      return {
        ...st,
        phase: 'turn',
        pending: null,
        log: [`Tehingumurdja ebaõnnestus — ${to.name}l pole täiskomplekti`, ...st.log].slice(0, 16),
      }
    }
    // pick first full set (or by propertyId color)
    let taken = full[0]
    if (act.propertyId) {
      for (const col of full) {
        if ((to.props[col] || []).some((c) => c.id === act.propertyId)) {
          taken = col
          break
        }
      }
    } else if (full.length > 1) {
      return {
        ...st,
        phase: 'pick_property',
        pending: act,
        log: [`Vali, millise komplekti ${to.name}lt võtad`, ...st.log].slice(0, 16),
      }
    }
    const setCards = [...(to.props[taken] || [])]
    const toProps = { ...to.props }
    delete toProps[taken]
    const fromProps = { ...from.props, [taken]: setCards }
    st.players = st.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps }
      if (i === act.target) return { ...to, props: toProps }
      return x
    })
    st.phase = 'turn'
    st.pending = null
    st.log = [`💥 Tehingumurdja: ${taken} komplekt → ${from.name}`, ...st.log].slice(0, 16)
    return checkWin(st)
  }

  if (act.action === 'forced_deal') {
    const myLoose = looseProperties(from)
    const theirLoose = looseProperties(to)
    if (!theirLoose.length) {
      return {
        ...st,
        phase: 'turn',
        pending: null,
        log: [`Sunnitud tehing ebaõnnestus`, ...st.log].slice(0, 16),
      }
    }
    // Take theirs; if we have loose, give one back
    const take = act.propertyId
      ? theirLoose.find((c) => c.id === act.propertyId) || theirLoose[0]
      : theirLoose[0]
    if (!act.propertyId && theirLoose.length > 1) {
      return {
        ...st,
        phase: 'pick_property',
        pending: act,
        log: [`Vali kinnistu, mille võtad ${to.name}lt`, ...st.log].slice(0, 16),
      }
    }
    if (take.kind !== 'property') return { ...st, phase: 'turn', pending: null }
    const toProps = { ...to.props }
    toProps[take.color] = (toProps[take.color] || []).filter((c) => c.id !== take.id)
    const fromProps = { ...from.props }
    fromProps[take.color] = [...(fromProps[take.color] || []), take]
    let giveName = ''
    if (myLoose.length) {
      const give = myLoose[0]
      if (give.kind === 'property') {
        fromProps[give.color] = (fromProps[give.color] || []).filter((c) => c.id !== give.id)
        toProps[give.color] = [...(toProps[give.color] || []), give]
        giveName = ` · andis ${give.name}`
      }
    }
    st.players = st.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps }
      if (i === act.target) return { ...to, props: toProps }
      return x
    })
    st.phase = 'turn'
    st.pending = null
    st.log = [`🔄 Sunnitud tehing: ${take.name} → ${from.name}${giveName}`, ...st.log].slice(0, 16)
    return checkWin(st)
  }

  return { ...st, phase: 'turn', pending: null }
}

export function resolvePay(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'pay' || s.payFrom == null || s.payAmount == null || !s.pending) return s
  const payerI = s.payFrom
  const recvI = s.pending.from
  let left = s.payAmount
  let payer = { ...s.players[payerI], bank: [...s.players[payerI].bank] }
  let recv = { ...s.players[recvI], bank: [...s.players[recvI].bank] }
  const sorted = [...payer.bank].sort((a, b) => a.value - b.value)
  const keep: DealCard[] = []
  let paid = 0
  for (const c of sorted) {
    if (left > 0 && c.value <= left) {
      left -= c.value
      paid += c.value
      recv.bank.push(c)
    } else {
      keep.push(c)
    }
  }
  payer.bank = keep
  // if still owes and has properties, strip lowest value loose property as collateral (party rule)
  if (left > 0) {
    const loose = looseProperties(payer)
    if (loose[0]?.kind === 'property') {
      const prop = loose[0]
      const props = { ...payer.props }
      props[prop.color] = (props[prop.color] || []).filter((c) => c.id !== prop.id)
      payer = { ...payer, props }
      const rprops = { ...recv.props }
      rprops[prop.color] = [...(rprops[prop.color] || []), prop]
      recv = { ...recv, props: rprops }
      paid += prop.value
      left = Math.max(0, left - prop.value)
    }
  }
  return checkWin({
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
    log: [`✅ ${s.players[payerI].name} tasus (~${paid}M)`, ...s.log].slice(0, 16),
  })
}
