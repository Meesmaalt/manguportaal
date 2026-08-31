import type { DealCard, KinnistuDealState, PlayerBoard, PropColor } from './types'
import {
  SET_SIZE,
  completeSets,
  makeToken,
  looseProperties,
  fullSetColors,
  actionLabel,
  rentForSet,
  colorsWithAny,
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
  return { token: makeToken(), name, hand: [], bank: [], props: {}, buildings: {} }
}

export function startGame(s: KinnistuDealState): KinnistuDealState {
  if (s.players.length < 2) return s
  let deck = buildDeck()
  const startHand = s.packData?.startHand ?? 5
  const players = s.players.map((p) => {
    const drawn = drawFrom(deck, startHand)
    deck = drawn.deck
    return { ...p, hand: drawn.cards, bank: [], props: {}, buildings: {} }
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
  const discardNote = discarded ? ` (viskas ${discarded})` : ''
  st.log = [`→ ${np.name} käik${discardNote}`, ...st.log].slice(0, 16)
  return st
}

function hasJustSayNo(p: PlayerBoard): boolean {
  return p.hand.some((c) => c.kind === 'action' && c.action === 'just_say_no')
}

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
  const p = { ...st.players[playerIdx], buildings: { ...(st.players[playerIdx].buildings || {}) } }

  if (card.kind === 'money') {
    p.bank = [...p.bank, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    st.log = [`💰 ${p.name} → pank ${card.value}M`, ...st.log].slice(0, 16)
    return st
  }

  if (card.kind === 'property') {
    const col = card.color
    p.props = { ...p.props, [col]: [...(p.props[col] || []), card] }
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    st.log = [`🏠 ${p.name} · ${card.name}`, ...st.log].slice(0, 16)
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
    st.log = [`📜 ${p.name} · Mine edasi (+2)`, ...st.log].slice(0, 16)
    return st
  }

  if (card.action === 'just_say_no') {
    p.bank = [...p.bank, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    st.log = [`${p.name} pani „Ei, aitäh“ panka`, ...st.log].slice(0, 16)
    return st
  }

  // House / hotel — attach to own complete set
  if (card.action === 'house' || card.action === 'hotel') {
    const full = fullSetColors(p)
    const eligible =
      card.action === 'house'
        ? full.filter((c) => !p.buildings?.[c])
        : full.filter((c) => p.buildings?.[c] === 'house' || !p.buildings?.[c])
    if (!eligible.length) {
      // can't play — return card to hand
      return s
    }
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.discard = [...st.discard, card]
    st.playsLeft -= 1
    st.pending = { action: card.action, from: playerIdx, cardId: card.id }
    st.phase = 'pick_rent_color' // reuse color picker for building
    st.log = [
      `🏗️ ${p.name} mängis: ${actionLabel(card.action)} — vali komplekt`,
      ...st.log,
    ].slice(0, 16)
    return st
  }

  // Rent — first pick which of YOUR property colors
  if (card.action === 'rent') {
    const owned = colorsWithAny(p)
    if (!owned.length) {
      return s // return card — no properties
    }
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.discard = [...st.discard, card]
    st.playsLeft -= 1
    st.pending = { action: 'rent', from: playerIdx, cardId: card.id }
    st.phase = 'pick_rent_color'
    st.log = [`🔑 ${p.name} nõuab üüri — vali värv`, ...st.log].slice(0, 16)
    return st
  }

  st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
  st.discard = [...st.discard, card]
  st.playsLeft -= 1
  st.pending = { action: card.action, from: playerIdx, cardId: card.id }
  st.phase = 'pick_target'
  st.log = [`🎯 ${p.name}: ${actionLabel(card.action)}`, ...st.log].slice(0, 16)
  return st
}

/** Choose color for rent or for house/hotel placement. */
export function pickRentColor(s: KinnistuDealState, color: PropColor): KinnistuDealState {
  if (s.phase !== 'pick_rent_color' || !s.pending) return s
  const act = s.pending.action
  const from = s.players[s.pending.from]

  if (act === 'house' || act === 'hotel') {
    if ((from.props[color] || []).length < SET_SIZE[color]) return s
    const buildings = { ...(from.buildings || {}) }
    if (act === 'house') {
      if (buildings[color]) return s
      buildings[color] = 'house'
    } else {
      buildings[color] = 'hotel'
    }
    return {
      ...s,
      players: s.players.map((x, i) =>
        i === s.pending!.from ? { ...from, buildings } : x
      ),
      phase: 'turn',
      pending: null,
      log: [
        `🏗️ ${from.name} pani ${act === 'hotel' ? 'hotelli' : 'maja'} (${color})`,
        ...s.log,
      ].slice(0, 16),
    }
  }

  // rent
  if (act !== 'rent') return s
  if (!(from.props[color] || []).length) return s
  const amount = rentForSet(from, color)
  return {
    ...s,
    pending: { ...s.pending, color },
    phase: 'pick_target',
    log: [
      `🔑 Üür ${color}: ${amount}M (${(from.props[color] || []).length} tänavat${from.buildings?.[color] ? ' + ' + from.buildings[color] : ''}) — vali maksja`,
      ...s.log,
    ].slice(0, 16),
  }
}


/** Üür kõigile: järjekorras maksed. */
export function startRentAll(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'pick_target' || !s.pending || s.pending.action !== 'rent') return s
  const from = s.pending.from
  const targets = s.players.map((_, i) => i).filter((i) => i !== from)
  if (!targets.length) return { ...s, phase: 'turn', pending: null }
  const color = s.pending.color
  const amount = color ? rentForSet(s.players[from], color) : 3
  return {
    ...s,
    phase: 'pay',
    pending: { ...s.pending, rentMode: 'all', rentTargets: targets.slice(1), target: targets[0] },
    payFrom: targets[0],
    payAmount: amount,
    log: [
      `🔑 Üür kõigile (${amount}M): esimesena ${s.players[targets[0]].name}`,
      ...s.log,
    ].slice(0, 16),
  }
}

export function pickTarget(s: KinnistuDealState, target: number): KinnistuDealState {
  if (s.phase !== 'pick_target' || !s.pending) return s
  if (target === s.pending.from) return s
  return afterTarget(s, target)
}

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
    log: [`🚫 ${p.name}: „Ei, aitäh“ — tühistatud`, ...s.log].slice(0, 16),
  }
}

export function skipDefend(s: KinnistuDealState, playerIdx: number): KinnistuDealState {
  if (s.phase !== 'defend' || !s.pending || s.pending.target !== playerIdx) return s
  return applyEffect(s)
}

export function pickProperty(s: KinnistuDealState, propertyId: string): KinnistuDealState {
  if (s.phase !== 'pick_property' || !s.pending || s.pending.target == null) return s
  return applyEffect({ ...s, pending: { ...s.pending, propertyId } })
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
      log: [`🎂 ${to.name} → 2M ${from.name}`, ...st.log].slice(0, 16),
    }
  }
  if (act.action === 'debt') {
    return {
      ...st,
      phase: 'pay',
      payFrom: act.target,
      payAmount: 5,
      log: [`💸 Võlanõue: ${to.name} → 5M`, ...st.log].slice(0, 16),
    }
  }
  if (act.action === 'rent') {
    const color = act.color
    const amount = color ? rentForSet(from, color) : 3
    return {
      ...st,
      phase: 'pay',
      payFrom: act.target,
      payAmount: amount,
      log: [`🔑 ${to.name} maksab üüri ${amount}M → ${from.name}`, ...st.log].slice(0, 16),
    }
  }

  if (act.action === 'sly_deal') {
    const loose = looseProperties(to)
    if (!loose.length) {
      return {
        ...st,
        phase: 'turn',
        pending: null,
        log: [`Salakaup ebaõnnestus`, ...st.log].slice(0, 16),
      }
    }
    if (!act.propertyId && loose.length > 1) {
      return {
        ...st,
        phase: 'pick_property',
        pending: act,
        log: [`Vali kinnistu ${to.name}lt`, ...st.log].slice(0, 16),
      }
    }
    const chosen = act.propertyId
      ? loose.find((c) => c.id === act.propertyId) || loose[0]
      : loose[0]
    if (chosen.kind !== 'property') return { ...st, phase: 'turn', pending: null }
    const toProps = { ...to.props }
    toProps[chosen.color] = (toProps[chosen.color] || []).filter((c) => c.id !== chosen.id)
    // strip building if set broken
    const toBuildings = { ...(to.buildings || {}) }
    if ((toProps[chosen.color] || []).length < SET_SIZE[chosen.color]) {
      delete toBuildings[chosen.color]
    }
    const fromProps = { ...from.props }
    fromProps[chosen.color] = [...(fromProps[chosen.color] || []), chosen]
    st.players = st.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps }
      if (i === act.target) return { ...to, props: toProps, buildings: toBuildings }
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
        log: [`Tehingumurdja ebaõnnestus`, ...st.log].slice(0, 16),
      }
    }
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
        log: [`Vali komplekt ${to.name}lt`, ...st.log].slice(0, 16),
      }
    }
    const setCards = [...(to.props[taken] || [])]
    const toProps = { ...to.props }
    delete toProps[taken]
    const toBuildings = { ...(to.buildings || {}) }
    const building = toBuildings[taken]
    delete toBuildings[taken]
    const fromProps = { ...from.props, [taken]: setCards }
    const fromBuildings = { ...(from.buildings || {}) }
    if (building) fromBuildings[taken] = building
    st.players = st.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps, buildings: fromBuildings }
      if (i === act.target) return { ...to, props: toProps, buildings: toBuildings }
      return x
    })
    st.phase = 'turn'
    st.pending = null
    st.log = [`💥 Tehingumurdja → ${from.name}`, ...st.log].slice(0, 16)
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
    if (!act.propertyId && theirLoose.length > 1) {
      return {
        ...st,
        phase: 'pick_property',
        pending: act,
        log: [`Vali kinnistu, mille võtad`, ...st.log].slice(0, 16),
      }
    }
    const take = act.propertyId
      ? theirLoose.find((c) => c.id === act.propertyId) || theirLoose[0]
      : theirLoose[0]
    if (take.kind !== 'property') return { ...st, phase: 'turn', pending: null }
    const toProps = { ...to.props }
    toProps[take.color] = (toProps[take.color] || []).filter((c) => c.id !== take.id)
    const fromProps = { ...from.props }
    fromProps[take.color] = [...(fromProps[take.color] || []), take]
    let giveName = ''
    if (myLoose.length && myLoose[0].kind === 'property') {
      const give = myLoose[0]
      fromProps[give.color] = (fromProps[give.color] || []).filter((c) => c.id !== give.id)
      toProps[give.color] = [...(toProps[give.color] || []), give]
      giveName = ` · andis ${give.name}`
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
  let payer = { ...s.players[payerI], bank: [...s.players[payerI].bank], buildings: { ...(s.players[payerI].buildings || {}) } }
  let recv = { ...s.players[recvI], bank: [...s.players[recvI].bank], props: { ...s.players[recvI].props } }
  const sorted = [...payer.bank].sort((a, b) => a.value - b.value)
  const keep: DealCard[] = []
  let paid = 0
  for (const c of sorted) {
    if (left > 0 && c.value <= left) {
      left -= c.value
      paid += c.value
      recv.bank.push(c)
    } else keep.push(c)
  }
  payer.bank = keep
  if (left > 0) {
    const loose = looseProperties(payer)
    if (loose[0]?.kind === 'property') {
      const prop = loose[0]
      const props = { ...payer.props }
      props[prop.color] = (props[prop.color] || []).filter((c) => c.id !== prop.id)
      if ((props[prop.color] || []).length < SET_SIZE[prop.color]) {
        const b = { ...(payer.buildings || {}) }
        delete b[prop.color]
        payer = { ...payer, props, buildings: b }
      } else {
        payer = { ...payer, props }
      }
      recv.props = {
        ...recv.props,
        [prop.color]: [...(recv.props[prop.color] || []), prop],
      }
      paid += prop.value
    }
  }
  const basePlayers = s.players.map((x, i) => {
    if (i === payerI) return payer
    if (i === recvI) return recv
    return x
  })
  const queue = s.pending.rentTargets || []
  if (s.pending.rentMode === 'all' && queue.length > 0) {
    const next = queue[0]
    const rest = queue.slice(1)
    const amount = s.payAmount
    return {
      ...s,
      players: basePlayers,
      phase: 'pay',
      pending: { ...s.pending, target: next, rentTargets: rest },
      payFrom: next,
      payAmount: amount,
      log: [
        `✅ ${s.players[payerI].name} tasus ~${paid}M · järgmine: ${s.players[next]?.name}`,
        ...s.log,
      ].slice(0, 16),
    }
  }
  return checkWin({
    ...s,
    players: basePlayers,
    phase: 'turn',
    pending: null,
    payFrom: undefined,
    payAmount: undefined,
    log: [`✅ ${s.players[payerI].name} tasus ~${paid}M`, ...s.log].slice(0, 16),
  })
}
