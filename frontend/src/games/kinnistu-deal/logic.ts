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
  const theme = (s.packData?.theme || 'classic') as import('./deck').DealTheme
  let deck = buildDeck(theme)
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
  st.turnCount = (st.turnCount || 0) + 1
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

/** Alusta järjestikust makset kõigile (sünnipäev / üür kõigile). */
function beginMultiPay(
  s: KinnistuDealState,
  from: number,
  amount: number,
  action: 'birthday' | 'rent',
  color?: PropColor,
  cardId?: string
): KinnistuDealState {
  const targets = s.players.map((_, i) => i).filter((i) => i !== from)
  if (!targets.length) return { ...s, phase: 'turn', pending: null }
  const first = targets[0]
  const rest = targets.slice(1)
  const pending = {
    action,
    from,
    cardId: cardId || '',
    color,
    rentMode: 'all' as const,
    rentTargets: rest,
    target: first,
  }
  const withPending = { ...s, pending }
  // first target may defend
  if (hasJustSayNo(s.players[first])) {
    return {
      ...withPending,
      phase: 'defend',
      log: [
        action === 'birthday'
          ? `🎂 Sünnipäev! ${s.players[first].name} võib kaitsta (2M)`
          : `🔑 Üür kõigile (${amount}M): ${s.players[first].name} võib kaitsta`,
        ...s.log,
      ].slice(0, 16),
    }
  }
  return {
    ...withPending,
    phase: 'pay',
    payFrom: first,
    payAmount: amount,
    paySelected: [],
    log: [
      action === 'birthday'
        ? `🎂 Sünnipäev: ${s.players[first].name} maksab 2M`
        : `🔑 Üür kõigile (${amount}M): ${s.players[first].name}`,
      ...s.log,
    ].slice(0, 16),
  }
}

export function playCard(s: KinnistuDealState, playerIdx: number, cardId: string): KinnistuDealState {
  if (s.phase !== 'turn' || s.current !== playerIdx || s.playsLeft <= 0) return s
  const me = s.players[playerIdx]
  const card = me.hand.find((c) => c.id === cardId)
  if (!card) return s

  // Validate before removing from hand
  if (card.kind === 'action') {
    if (card.action === 'rent' && !colorsWithAny(me).length) {
      return {
        ...s,
        log: [`⚠️ Üüri ei saa — sul pole kinnistuid`, ...s.log].slice(0, 16),
      }
    }
    if (card.action === 'house') {
      const eligible = fullSetColors(me).filter((c) => !me.buildings?.[c])
      if (!eligible.length) {
        return {
          ...s,
          log: [`⚠️ Maja vajab täiskomplekti ilma majata`, ...s.log].slice(0, 16),
        }
      }
    }
    if (card.action === 'hotel') {
      // Hotell ainult majaga komplektile
      const eligible = fullSetColors(me).filter((c) => me.buildings?.[c] === 'house')
      if (!eligible.length) {
        return {
          ...s,
          log: [`⚠️ Hotell vajab komplekti, millel on juba maja`, ...s.log].slice(0, 16),
        }
      }
    }
  }

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
    const done = (p.props[col] || []).length >= SET_SIZE[col]
    st.log = [
      `🏠 ${p.name} · ${card.name}${done ? ' ✓ komplekt!' : ''}`,
      ...st.log,
    ].slice(0, 16)
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
    // Käigul: panka väärtusena (kaitseks hoia käes)
    p.bank = [...p.bank, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    st.log = [`${p.name} pani „Ei, aitäh“ panka (${card.value}M)`, ...st.log].slice(0, 16)
    return st
  }

  // Sünnipäev: KÕIK teised maksavad 2M (nagu originaalis)
  if (card.action === 'birthday') {
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.discard = [...st.discard, card]
    st.playsLeft -= 1
    return beginMultiPay(st, playerIdx, 2, 'birthday', undefined, card.id)
  }

  // House / hotel
  if (card.action === 'house' || card.action === 'hotel') {
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.discard = [...st.discard, card]
    st.playsLeft -= 1
    st.pending = { action: card.action, from: playerIdx, cardId: card.id }
    st.phase = 'pick_rent_color'
    st.log = [
      `🏗️ ${p.name}: ${actionLabel(card.action)} — vali komplekt`,
      ...st.log,
    ].slice(0, 16)
    return st
  }

  // Rent — pick color first
  if (card.action === 'rent') {
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.discard = [...st.discard, card]
    st.playsLeft -= 1
    st.pending = { action: 'rent', from: playerIdx, cardId: card.id }
    st.phase = 'pick_rent_color'
    st.log = [`🔑 ${p.name} nõuab üüri — vali värv`, ...st.log].slice(0, 16)
    return st
  }

  // debt, sly_deal, forced_deal, deal_breaker → pick target
  st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
  st.discard = [...st.discard, card]
  st.playsLeft -= 1
  st.pending = { action: card.action, from: playerIdx, cardId: card.id }
  st.phase = 'pick_target'
  st.log = [`🎯 ${p.name}: ${actionLabel(card.action)}`, ...st.log].slice(0, 16)
  return st
}

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
      if (buildings[color] !== 'house') return s
      buildings[color] = 'hotel'
    }
    const rent = rentForSet({ ...from, buildings }, color)
    return {
      ...s,
      players: s.players.map((x, i) =>
        i === s.pending!.from ? { ...from, buildings } : x
      ),
      phase: 'turn',
      pending: null,
      log: [
        `🏗️ ${from.name} · ${act === 'hotel' ? 'hotell' : 'maja'} (${color}) · üür nüüd ${rent}M`,
        ...s.log,
      ].slice(0, 16),
    }
  }

  if (act !== 'rent') return s
  if (!(from.props[color] || []).length) return s
  const amount = rentForSet(from, color)
  return {
    ...s,
    pending: { ...s.pending, color },
    phase: 'pick_target',
    log: [
      `🔑 Üür ${color}: ${amount}M (${(from.props[color] || []).length} tänavat${
        from.buildings?.[color] ? ' + ' + from.buildings[color] : ''
      }) — vali maksja või „kõigile“`,
      ...s.log,
    ].slice(0, 16),
  }
}

export function startRentAll(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'pick_target' || !s.pending || s.pending.action !== 'rent') return s
  const from = s.pending.from
  const color = s.pending.color
  const amount = color ? rentForSet(s.players[from], color) : 3
  // discard already done
  return beginMultiPay(
    { ...s, pending: null },
    from,
    amount,
    'rent',
    color,
    s.pending.cardId
  )
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
  const rest = s.pending.rentTargets || []
  // Multi-pay: skip this payer, continue queue
  if (s.pending.rentMode === 'all' && (s.pending.action === 'birthday' || s.pending.action === 'rent')) {
    const amount =
      s.pending.action === 'birthday'
        ? 2
        : s.pending.color
          ? rentForSet(s.players[s.pending.from], s.pending.color)
          : 3
    const st: KinnistuDealState = {
      ...s,
      players: s.players.map((x, i) =>
        i === playerIdx ? { ...x, hand: x.hand.filter((c) => c.id !== noCard.id) } : x
      ),
      discard: [...s.discard, noCard],
      log: [`🚫 ${p.name}: „Ei, aitäh“`, ...s.log].slice(0, 16),
    }
    if (!rest.length) {
      return { ...st, phase: 'turn', pending: null, payFrom: undefined, payAmount: undefined }
    }
    const next = rest[0]
    const nextRest = rest.slice(1)
    const pending = {
      ...s.pending!,
      target: next,
      rentTargets: nextRest,
    }
    if (hasJustSayNo(st.players[next])) {
      return { ...st, phase: 'defend', pending }
    }
    return {
      ...st,
      phase: 'pay',
      pending,
      payFrom: next,
      payAmount: amount,
    }
  }
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
  // multi-pay: go to pay for this target
  if (s.pending.rentMode === 'all' && (s.pending.action === 'birthday' || s.pending.action === 'rent')) {
    const amount =
      s.pending.action === 'birthday'
        ? 2
        : s.pending.color
          ? rentForSet(s.players[s.pending.from], s.pending.color)
          : 3
    return {
      ...s,
      phase: 'pay',
      payFrom: playerIdx,
      payAmount: amount,
    }
  }
  return applyEffect(s)
}

export function pickProperty(s: KinnistuDealState, propertyId: string): KinnistuDealState {
  if (s.phase !== 'pick_property' || !s.pending || s.pending.target == null) return s
  // forced_deal give step
  if (s.pending.action === 'forced_deal' && (s.pending as any).giveStep) {
    return finishForcedDeal(s, s.pending.propertyId!, propertyId)
  }
  return applyEffect({ ...s, pending: { ...s.pending, propertyId } })
}

function finishForcedDeal(
  s: KinnistuDealState,
  takeId: string,
  giveId: string
): KinnistuDealState {
  const act = s.pending!
  const from = s.players[act.from]
  const to = s.players[act.target!]
  const theirLoose = looseProperties(to)
  const myLoose = looseProperties(from)
  const take = theirLoose.find((c) => c.id === takeId) || theirLoose[0]
  const give = myLoose.find((c) => c.id === giveId) || myLoose[0]
  if (!take || take.kind !== 'property') {
    return { ...s, phase: 'turn', pending: null }
  }
  const toProps = { ...to.props }
  const fromProps = { ...from.props }
  toProps[take.color] = (toProps[take.color] || []).filter((c) => c.id !== take.id)
  fromProps[take.color] = [...(fromProps[take.color] || []), take]
  let giveName = ''
  if (give && give.kind === 'property' && give.id !== take.id) {
    fromProps[give.color] = (fromProps[give.color] || []).filter((c) => c.id !== give.id)
    toProps[give.color] = [...(toProps[give.color] || []), give]
    giveName = ` ⇄ ${give.name}`
  }
  return checkWin({
    ...s,
    players: s.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps }
      if (i === act.target) return { ...to, props: toProps }
      return x
    }),
    phase: 'turn',
    pending: null,
    log: [`🔄 Sunnitud tehing: ${take.name} → ${from.name}${giveName}`, ...s.log].slice(0, 16),
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
      paySelected: [],
      log: [`🎂 ${to.name} → 2M ${from.name}`, ...st.log].slice(0, 16),
    }
  }
  if (act.action === 'debt') {
    return {
      ...st,
      phase: 'pay',
      payFrom: act.target,
      payAmount: 5,
      paySelected: [],
      log: [`💸 Võlanõue: ${to.name} maksab 5M → ${from.name}`, ...st.log].slice(0, 16),
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
      paySelected: [],
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
        log: [`Salakaup ebaõnnestus — ${to.name}l pole vaba kinnistut`, ...st.log].slice(0, 16),
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
        log: [`Tehingumurdja ebaõnnestus — pole täiskomplekti`, ...st.log].slice(0, 16),
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
    st.log = [`💥 Tehingumurdja: ${taken} → ${from.name}`, ...st.log].slice(0, 16)
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
        log: [`Sunnitud tehing ebaõnnestus — vastasel pole vaba kinnistut`, ...st.log].slice(0, 16),
      }
    }
    if (!act.propertyId && theirLoose.length > 1) {
      return {
        ...st,
        phase: 'pick_property',
        pending: act,
        log: [`Vali kinnistu, mille võtad ${to.name}lt`, ...st.log].slice(0, 16),
      }
    }
    const take = act.propertyId
      ? theirLoose.find((c) => c.id === act.propertyId) || theirLoose[0]
      : theirLoose[0]
    if (take.kind !== 'property') return { ...st, phase: 'turn', pending: null }

    // Kui sul on mitu vaba kinnistut — vali, mida annad
    if (myLoose.length > 1) {
      return {
        ...st,
        phase: 'pick_property',
        pending: { ...act, propertyId: take.id, ...( { giveStep: true } as any) },
        log: [`Vali oma kinnistu, mille annad vastutasuks`, ...st.log].slice(0, 16),
      }
    }
    return finishForcedDeal(
      { ...st, pending: { ...act, propertyId: take.id } },
      take.id,
      myLoose[0]?.id || ''
    )
  }

  return { ...st, phase: 'turn', pending: null }
}



export function togglePayCard(s: KinnistuDealState, playerIdx: number, cardId: string): KinnistuDealState {
  if (s.phase !== 'pay' || s.payFrom !== playerIdx) return s
  const sel = new Set(s.paySelected || [])
  if (sel.has(cardId)) sel.delete(cardId)
  else sel.add(cardId)
  return { ...s, paySelected: [...sel] }
}

export function confirmSelectedPay(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'pay' || s.payFrom == null || s.payAmount == null || !s.pending) return s
  const payerI = s.payFrom
  const recvI = s.pending.from
  const selected = new Set(s.paySelected || [])
  if (!selected.size) {
    return { ...s, log: [`⚠️ Vali kaardid (kokku ≥ ${s.payAmount}M)`, ...s.log].slice(0, 16) }
  }
  let sum = 0
  for (const c of s.players[payerI].bank) {
    if (selected.has(c.id)) sum += c.value
  }
  for (const col of Object.keys(SET_SIZE) as PropColor[]) {
    for (const c of s.players[payerI].props[col] || []) {
      if (selected.has(c.id)) sum += c.value
    }
  }
  if (sum < s.payAmount) {
    return { ...s, log: [`⚠️ Valitud ${sum}M < ${s.payAmount}M`, ...s.log].slice(0, 16) }
  }

  const payerBank = s.players[payerI].bank.filter((c) => !selected.has(c.id))
  const recvBank = [...s.players[recvI].bank]
  for (const c of s.players[payerI].bank) {
    if (selected.has(c.id)) recvBank.push(c)
  }

  const payerProps: PlayerBoard['props'] = {}
  const payerBuildings = { ...(s.players[payerI].buildings || {}) }
  const recvProps = { ...s.players[recvI].props }
  for (const col of Object.keys(SET_SIZE) as PropColor[]) {
    const stay: DealCard[] = []
    for (const c of s.players[payerI].props[col] || []) {
      if (selected.has(c.id) && c.kind === 'property') {
        recvProps[c.color] = [...(recvProps[c.color] || []), c]
      } else stay.push(c)
    }
    if (stay.length) payerProps[col] = stay
    else delete payerBuildings[col]
  }

  const payer: PlayerBoard = {
    ...s.players[payerI],
    bank: payerBank,
    props: payerProps,
    buildings: payerBuildings,
  }
  const recv: PlayerBoard = {
    ...s.players[recvI],
    bank: recvBank,
    props: recvProps,
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
    const amount = s.payAmount!
    const pending = { ...s.pending, target: next, rentTargets: rest }
    const st: KinnistuDealState = {
      ...s,
      players: basePlayers,
      pending,
      paySelected: [],
      log: [
        `✅ ${s.players[payerI].name} maksis ${sum}M · järgmine: ${s.players[next]?.name}`,
        ...s.log,
      ].slice(0, 16),
    }
    if (hasJustSayNo(basePlayers[next])) {
      return { ...st, phase: 'defend', payFrom: undefined, payAmount: undefined }
    }
    return { ...st, phase: 'pay', payFrom: next, payAmount: amount, paySelected: [] }
  }
  return checkWin({
    ...s,
    players: basePlayers,
    phase: 'turn',
    pending: null,
    payFrom: undefined,
    payAmount: undefined,
    paySelected: [],
    log: [`✅ ${s.players[payerI].name} maksis ${sum}M`, ...s.log].slice(0, 16),
  })
}

export function hostMoveProperty(
  s: KinnistuDealState,
  fromIdx: number,
  toIdx: number,
  cardId: string
): KinnistuDealState {
  if (fromIdx === toIdx) return s
  const from = s.players[fromIdx]
  const to = s.players[toIdx]
  let found: DealCard | null = null
  let foundCol: PropColor | null = null
  for (const col of Object.keys(SET_SIZE) as PropColor[]) {
    const c = (from.props[col] || []).find((x) => x.id === cardId)
    if (c) {
      found = c
      foundCol = col
      break
    }
  }
  if (!found || found.kind !== 'property' || !foundCol) return s
  const fromProps = { ...from.props }
  fromProps[foundCol] = (fromProps[foundCol] || []).filter((c) => c.id !== cardId)
  const fromBuildings = { ...(from.buildings || {}) }
  if ((fromProps[foundCol] || []).length < SET_SIZE[foundCol]) delete fromBuildings[foundCol]
  const toProps = {
    ...to.props,
    [found.color]: [...(to.props[found.color] || []), found],
  }
  return {
    ...s,
    players: s.players.map((x, i) => {
      if (i === fromIdx) return { ...from, props: fromProps, buildings: fromBuildings }
      if (i === toIdx) return { ...to, props: toProps }
      return x
    }),
    log: [`🛠️ Host: ${found.name} ${from.name} → ${to.name}`, ...s.log].slice(0, 16),
  }
}


export function resolvePay(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'pay' || s.payFrom == null || s.payAmount == null || !s.pending) return s
  const payerI = s.payFrom
  const recvI = s.pending.from
  let left = s.payAmount
  let payer = {
    ...s.players[payerI],
    bank: [...s.players[payerI].bank],
    buildings: { ...(s.players[payerI].buildings || {}) },
    props: { ...s.players[payerI].props },
  }
  let recv = {
    ...s.players[recvI],
    bank: [...s.players[recvI].bank],
    props: { ...s.players[recvI].props },
  }
  // Prefer paying exact/over with largest cards that fit, then small
  const sorted = [...payer.bank].sort((a, b) => b.value - a.value)
  const keep: DealCard[] = []
  let paid = 0
  for (const c of sorted) {
    if (left > 0 && c.value <= left) {
      left -= c.value
      paid += c.value
      recv.bank.push(c)
    } else keep.push(c)
  }
  // if still owing, try any remaining bank cards (overpay allowed with smallest)
  if (left > 0) {
    const rest = [...keep].sort((a, b) => a.value - b.value)
    const keep2: DealCard[] = []
    for (const c of rest) {
      if (left > 0) {
        left -= c.value
        paid += c.value
        recv.bank.push(c)
      } else keep2.push(c)
    }
    payer.bank = keep2
  } else {
    payer.bank = keep
  }

  // Still short → transfer loose properties as payment
  while (left > 0) {
    const loose = looseProperties(payer)
    if (!loose.length || loose[0].kind !== 'property') break
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
    left -= prop.value
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
    const amount = s.payAmount!
    const pending = { ...s.pending, target: next, rentTargets: rest }
    const st: KinnistuDealState = {
      ...s,
      players: basePlayers,
      pending,
      log: [
        `✅ ${s.players[payerI].name} tasus ~${paid}M · järgmine: ${s.players[next]?.name}`,
        ...s.log,
      ].slice(0, 16),
    }
    if (hasJustSayNo(basePlayers[next])) {
      return { ...st, phase: 'defend', payFrom: undefined, payAmount: undefined }
    }
    return {
      ...st,
      phase: 'pay',
      payFrom: next,
      payAmount: amount,
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
