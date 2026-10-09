import type { DealCard, KinnistuDealState, PlayerBoard, PropColor, DealEventAnimation } from './types.ts'
import {
  SET_SIZE,
  COLOR_STYLE,
  completeSets,
  makeToken,
  looseProperties,
  fullSetColors,
  actionLabel,
  rentForSet,
  colorsWithAny,
} from './types.ts'
import { buildDeck, drawFrom } from './deck.ts'

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
  if ((s.phase !== 'lobby' && s.phase !== 'over') || s.players.length < 2 || s.players.length > 5) return s
  const theme = (s.packData?.theme || 'classic') as import('./deck').DealTheme
  let deck = buildDeck(theme)
  const startHand = Math.max(1, Math.min(10, Math.floor(Number(s.packData?.startHand) || 5)))
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
    turnCount: 0,
    turnEndAt: undefined,
    paySelected: [],
    lastEvent: null,
    phase: 'turn',
    pending: null,
    winner: undefined,
    payFrom: undefined,
    payAmount: undefined,
    confettiAt: undefined,
    log: [`🎲 Mäng algas · ${players.map((p) => p.name).join(' · ')}`],
  }
}

/** Five-second turn finish is a shared deadline, never a per-view timer reset. */
export function prepareTurnEnd(s: KinnistuDealState, now = Date.now()): KinnistuDealState {
  if (s.phase !== 'turn') return s.turnEndAt == null ? s : { ...s, turnEndAt: undefined }
  const hand = s.players[s.current]?.hand
  if (!hand || (s.playsLeft > 0 && hand.length > 0)) return s.turnEndAt == null ? s : { ...s, turnEndAt: undefined }
  if (hand.length > 7) return { ...s, phase: 'discard_hand', turnEndAt: undefined }
  return s.turnEndAt == null ? { ...s, turnEndAt: now + 5000 } : s
}

export function tickTurnEnd(s: KinnistuDealState, now = Date.now()): KinnistuDealState {
  const ready = prepareTurnEnd(s, now)
  if (ready.phase === 'turn' && ready.turnEndAt != null && now >= ready.turnEndAt) return endTurn(ready)
  return ready
}

export function discardHand(s: KinnistuDealState, playerIdx: number, ids: string[]): KinnistuDealState {
  if (s.phase !== 'discard_hand' || playerIdx !== s.current) return s
  const p = s.players[playerIdx]
  const chosen = new Set(ids)
  if (chosen.size !== ids.length || chosen.size !== p.hand.length - 7 || ids.some(id => !p.hand.some(c => c.id === id))) return s
  const cards = p.hand.filter(c => chosen.has(c.id))
  return prepareTurnEnd({ ...s, phase: 'turn', playsLeft: 0,
    players: s.players.map((x,i) => i === playerIdx ? { ...x, hand: x.hand.filter(c => !chosen.has(c.id)) } : x),
    discard: [...s.discard, ...cards], turnEndAt: undefined,
    lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: 'hand_discarded', actorIndex: playerIdx, actorName: p.name, message: `${p.name} viskas ära ${cards.length} kaarti`, timestamp: Date.now() },
    log: [`${p.name} viskas ära ${cards.length} kaarti; käes 7`, ...s.log].slice(0,16),
  })
}

function drawCards(s: KinnistuDealState, count: number): { state: KinnistuDealState; cards: DealCard[] } {
  let state = s; const cards: DealCard[] = []
  for (let i=0; i<count; i++) {
    state = ensureDeck(state)
    const drawn = drawFrom(state.deck, 1)
    state = { ...state, deck: drawn.deck }
    cards.push(...drawn.cards)
    if (!drawn.cards.length) break
  }
  return { state, cards }
}

export function endTurn(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'turn') return s
  if (s.players[s.current].hand.length > 7) return { ...s, phase: 'discard_hand', playsLeft: 0, turnEndAt: undefined }
  const next = (s.current + 1) % s.players.length
  const drawn = drawCards(s, s.players[next].hand.length ? 2 : 5)
  const np = { ...s.players[next], hand: [...s.players[next].hand, ...drawn.cards] }
  return { ...drawn.state, players: s.players.map((x,i) => i === next ? np : x), current: next,
    playsLeft: 3, phase: 'turn', pending: null, payFrom: undefined, payAmount: undefined, paySelected: [], turnEndAt: undefined,
    turnCount: (s.turnCount || 0) + 1, log: [`→ ${np.name} käik · võttis ${drawn.cards.length} kaarti`, ...s.log].slice(0,16) }
}

function responseWindow(s: KinnistuDealState, target: number): KinnistuDealState {
  return { ...s, phase: 'defend', payFrom: undefined, payAmount: undefined, paySelected: [], turnEndAt: undefined,
    pending: { ...s.pending!, target, responseIndex: target, cancelled: false },
    log: [`${s.players[target].name} vastab tegevusele`, ...s.log].slice(0,16) }
}
function afterTarget(st: KinnistuDealState, target: number): KinnistuDealState {
  const card = st.discard.find(c => c.id === st.pending?.cardId)
  return responseWindow({ ...st, lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: 'card_played', actorIndex: st.pending!.from, actorName: st.players[st.pending!.from].name, targetIndex: target, targetName: st.players[target].name, card, message: `${actionLabel(st.pending!.action)} → ${st.players[target].name}`, timestamp: Date.now() } }, target)
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
  return responseWindow({ ...s, pending }, first)
}

function playCardCore(s: KinnistuDealState, playerIdx: number, cardId: string, asBank = false): KinnistuDealState {
  if (s.phase !== 'turn' || s.current !== playerIdx || s.playsLeft <= 0) return s
  const me = s.players[playerIdx]
  const card = me.hand.find((c) => c.id === cardId)
  if (!card) return s

  if (asBank && card.kind === 'action') return {
    ...s, players: s.players.map((p,i) => i === playerIdx ? { ...p, hand: p.hand.filter(c => c.id !== card.id), bank: [...p.bank, card] } : p), playsLeft: s.playsLeft-1,
    lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: 'money_bank', actorName: me.name, actorIndex: playerIdx, card, amount: card.value, message: `Pani tegevuskaardi panka (${card.value}M)`, timestamp: Date.now() },
    log: [`${me.name} pani tegevuskaardi panka (${card.value}M)`, ...s.log].slice(0,16),
  }

  if (card.kind === 'action') {
    const targets = s.players.filter((_,i) => i !== playerIdx)
    if ((card.action === 'sly_deal' && !targets.some(p => looseProperties(p).length)) ||
        (card.action === 'forced_deal' && (!looseProperties(me).length || !targets.some(p => looseProperties(p).length))) ||
        (card.action === 'deal_breaker' && !targets.some(p => fullSetColors(p).length))) return s
  }

  // Validate before removing from hand
  if (card.kind === 'action') {
    if (card.action === 'rent' && !colorsWithAny(me).length) {
      return {
        ...s,
        log: [`⚠️ Üüri ei saa — sul pole kinnistuid`, ...s.log].slice(0, 16),
      }
    }
    if (card.action === 'house') {
      const eligible = fullSetColors(me).filter((c) => c !== 'rail' && c !== 'util' && !me.buildings?.[c])
      if (!eligible.length) {
        return {
          ...s,
          log: [`⚠️ Maja vajab täiskomplekti ilma majata`, ...s.log].slice(0, 16),
        }
      }
    }
    if (card.action === 'hotel') {
      // Hotell ainult majaga komplektile
      const eligible = fullSetColors(me).filter((c) => c !== 'rail' && c !== 'util' && me.buildings?.[c] === 'house')
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
    lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: 'card_played', actorName: me.name, actorIndex: playerIdx, card, message: `${me.name} mängis ${card.kind === 'action' ? actionLabel(card.action) : card.kind === 'property' ? card.name : `${card.value}M`}`, timestamp: Date.now() },
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
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: 'money_bank',
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      amount: card.value,
      message: `Pani panka ${card.value}M`,
      timestamp: Date.now(),
    }
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
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: 'prop_placed',
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      propName: card.name,
      propColor: col,
      message: done ? `TÄISKOMPLEKT! Mängis: ${card.name}` : `Mängis kinnistu: ${card.name}`,
      timestamp: Date.now(),
    }
    return checkWin(st)
  }

  if (card.action === 'pass_go') {
    const drawn = drawCards(st, 2)
    st = drawn.state
    p.hand = [...p.hand, ...drawn.cards]
    st.discard = [...st.discard, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    st.log = [`📜 ${p.name} · Mine edasi (+2 kaarti)`, ...st.log].slice(0, 16)
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: 'pass_go',
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      message: `Mine edasi! Võttis pakist 2 kaarti`,
      timestamp: Date.now(),
    }
    return st
  }

  if (card.action === 'just_say_no') {
    // Käigul: panka väärtusena (kaitseks hoia käes)
    p.bank = [...p.bank, card]
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.playsLeft -= 1
    st.log = [`${p.name} pani „Ei, aitäh“ panka (${card.value}M)`, ...st.log].slice(0, 16)
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: 'money_bank',
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      amount: card.value,
      message: `Pani „Ei, aitäh“ panka (${card.value}M)`,
      timestamp: Date.now(),
    }
    return st
  }

  // Sünnipäev: KÕIK teised maksavad 2M (nagu originaalis)
  if (card.action === 'birthday') {
    st.players = st.players.map((x, i) => (i === playerIdx ? p : x))
    st.discard = [...st.discard, card]
    st.playsLeft -= 1
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: 'birthday',
      actorName: p.name,
      actorIndex: playerIdx,
      card,
      amount: 2,
      message: `🎂 SÜNNIPÄEV! Kõik teised maksavad 2M!`,
      timestamp: Date.now(),
    }
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

function pickRentColorCore(s: KinnistuDealState, color: PropColor): KinnistuDealState {
  if (s.phase !== 'pick_rent_color' || !s.pending || !Object.prototype.hasOwnProperty.call(SET_SIZE,color)) return s
  const act = s.pending.action
  const from = s.players[s.pending.from]

  if (act === 'house' || act === 'hotel') {
    if (color === 'rail' || color === 'util' || (from.props[color] || []).length < SET_SIZE[color]) return s
    const buildings = { ...(from.buildings || {}) }
    if (act === 'house') {
      if (buildings[color]) return s
      buildings[color] = 'house'
    } else {
      if (buildings[color] !== 'house') return s
      buildings[color] = 'hotel'
    }
    const rent = rentForSet({ ...from, buildings }, color)
    const colorLabel = COLOR_STYLE[color]?.label || color
    return {
      ...s,
      players: s.players.map((x, i) =>
        i === s.pending!.from ? { ...from, buildings } : x
      ),
      phase: 'turn',
      pending: null,
      lastEvent: {
        id: `${Date.now()}-${Math.random()}`,
        kind: act === 'hotel' ? 'hotel_built' : 'house_built',
        actorName: from.name,
        actorIndex: s.pending.from,
        propColor: color,
        amount: rent,
        message: `${from.name} ehitas ${act === 'hotel' ? 'HOTELLI 🏨' : 'MAJA 🏠'} (${colorLabel})! Üür nüüd ${rent}M`,
        timestamp: Date.now(),
      },
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

function startRentAllCore(s: KinnistuDealState): KinnistuDealState {
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

function pickTargetCore(s: KinnistuDealState, target: number): KinnistuDealState {
  if (s.phase !== 'pick_target' || !s.pending) return s
  if (!Number.isInteger(target) || !s.players[target] || target === s.pending.from) return s
  const p = s.players[target]
  if ((s.pending.action === 'sly_deal' || s.pending.action === 'forced_deal') && !looseProperties(p).length) return s
  if (s.pending.action === 'deal_breaker' && !fullSetColors(p).length) return s
  return afterTarget(s, target)
}

function defendWithNoCore(s: KinnistuDealState, playerIdx: number): KinnistuDealState {
  if (s.phase !== 'defend' || !s.pending || (s.pending.responseIndex ?? s.pending.target) !== playerIdx) return s
  const p = s.players[playerIdx]
  const noCard = p.hand.find(c => c.kind === 'action' && c.action === 'just_say_no')
  if (!noCard) return s
  const nextResponse = playerIdx === s.pending.from ? s.pending.target! : s.pending.from
  return { ...s, players: s.players.map((x,i) => i === playerIdx ? { ...x, hand: x.hand.filter(c => c.id !== noCard.id) } : x),
    discard: [...s.discard, noCard], pending: { ...s.pending, cancelled: !s.pending.cancelled, responseIndex: nextResponse },
    lastEvent: { id: `${Date.now()}-${Math.random()}`, kind: 'just_say_no', actorName: p.name, actorIndex: playerIdx,
      targetIndex: nextResponse, targetName: s.players[nextResponse].name, card: noCard, message: `${p.name}: „Ei, aitäh!“`, timestamp: Date.now() },
    log: [`${p.name} mängis „Ei, aitäh“ · ${s.players[nextResponse].name} vastab`, ...s.log].slice(0,16) }
}

function skipDefendCore(s: KinnistuDealState, playerIdx: number): KinnistuDealState {
  if (s.phase !== 'defend' || !s.pending || (s.pending.responseIndex ?? s.pending.target) !== playerIdx) return s
  if (!s.pending.cancelled) return applyEffect(s)
  const queue = s.pending.rentTargets || []
  if (s.pending.rentMode === 'all' && queue.length) {
    return responseWindow({ ...s, pending: { ...s.pending, rentTargets: queue.slice(1) } }, queue[0])
  }
  return { ...s, phase: 'turn', pending: null, payFrom: undefined, payAmount: undefined, paySelected: [],
    log: ['Tegevus tühistatud', ...s.log].slice(0,16) }
}

function pickPropertyCore(s: KinnistuDealState, propertyId: string): KinnistuDealState {
  if (s.phase !== 'pick_property' || !s.pending || s.pending.target == null) return s
  const owner = s.pending.giveStep ? s.players[s.pending.from] : s.players[s.pending.target]
  const eligible = s.pending.action === 'deal_breaker' ? fullSetColors(owner).flatMap(c => owner.props[c] || []) : looseProperties(owner)
  if (!eligible.some(c => c.id === propertyId)) return s
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
  const take = theirLoose.find((c) => c.id === takeId)
  const give = myLoose.find((c) => c.id === giveId)
  if (!take || take.kind !== 'property' || !give || give.kind !== 'property') return s
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
    lastEvent: {
      id: `${Date.now()}-${Math.random()}`,
      kind: 'forced_deal',
      cards: [take, give],
      actorName: from.name,
      actorIndex: act.from,
      targetName: to.name,
      targetIndex: act.target,
      propName: `${take.name}${giveName}`,
      message: `🔄 SUNNITUD TEHING! ${from.name} vahetas: ${take.name}${giveName}`,
      timestamp: Date.now(),
    },
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
      lastEvent: {
        id: `${Date.now()}-${Math.random()}`,
        kind: 'debt',
        actorName: from.name,
        actorIndex: act.from,
        targetName: to.name,
        targetIndex: act.target,
        amount: 5,
        message: `💸 VÕLANÕUE! ${to.name} peab maksma 5M mängijale ${from.name}!`,
        timestamp: Date.now(),
      },
      log: [`💸 Võlanõue: ${to.name} maksab 5M → ${from.name}`, ...st.log].slice(0, 16),
    }
  }
  if (act.action === 'rent') {
    const color = act.color
    const amount = color ? rentForSet(from, color) : 3
    const colorLabel = color ? (COLOR_STYLE[color]?.label || color) : ''
    return {
      ...st,
      phase: 'pay',
      payFrom: act.target,
      payAmount: amount,
      paySelected: [],
      lastEvent: {
        id: `${Date.now()}-${Math.random()}`,
        kind: 'rent_charged',
        actorName: from.name,
        actorIndex: act.from,
        targetName: to.name,
        targetIndex: act.target,
        amount,
        propColor: color,
        message: `🔑 ÜÜRINÕUE (${colorLabel})! ${to.name} peab maksma ${amount}M!`,
        timestamp: Date.now(),
      },
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
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: 'sly_deal',
      card: chosen,
      actorName: from.name,
      actorIndex: act.from,
      targetName: to.name,
      targetIndex: act.target,
      propName: chosen.name,
      propColor: chosen.color,
      message: `🕵️ SALAKAUP! ${from.name} varastas kinnistu: ${chosen.name}!`,
      timestamp: Date.now(),
    }
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
    const fromProps = { ...from.props, [taken]: [...(from.props[taken] || []), ...setCards] }
    const fromBuildings = { ...(from.buildings || {}) }
    if (building) fromBuildings[taken] = building
    st.players = st.players.map((x, i) => {
      if (i === act.from) return { ...from, props: fromProps, buildings: fromBuildings }
      if (i === act.target) return { ...to, props: toProps, buildings: toBuildings }
      return x
    })
    st.phase = 'turn'
    st.pending = null
    const colorLabel = COLOR_STYLE[taken]?.label || taken
    st.lastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      kind: 'deal_breaker',
      cards: setCards,
      actorName: from.name,
      actorIndex: act.from,
      targetName: to.name,
      targetIndex: act.target,
      propColor: taken,
      message: `💥 TEHINGUMURDJA! ${from.name} varastas terve komplekti (${colorLabel}) mängijalt ${to.name}!`,
      timestamp: Date.now(),
    }
    st.log = [`💥 Tehingumurdja: ${taken} → ${from.name}`, ...st.log].slice(0, 16)
    return checkWin(st)
  }

  if (act.action === 'forced_deal') {
    const myLoose = looseProperties(from)
    const theirLoose = looseProperties(to)
    if (!theirLoose.length || !myLoose.length) {
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

function confirmSelectedPayCore(s: KinnistuDealState): KinnistuDealState {
  if (s.phase !== 'pay' || s.payFrom == null || s.payAmount == null || !s.pending) return s
  const payerI = s.payFrom
  const recvI = s.pending.from
  const selected = new Set(s.paySelected || [])
  const assets = [...s.players[payerI].bank, ...Object.values(s.players[payerI].props).flatMap(cards => cards || [])]
  if ([...selected].some(id => !assets.some(c => c.id === id))) return s
  const sum = assets.filter(c => selected.has(c.id)).reduce((total,c) => total+c.value,0)
  const total = assets.reduce((total,c) => total+c.value,0)
  const required = Math.min(s.payAmount, total)
  if (sum < required) return { ...s, log: [`⚠️ Vali vähemalt ${required}M väärtuses vara`, ...s.log].slice(0,16) }

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
    if (stay.length < SET_SIZE[col]) delete payerBuildings[col]
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
  const payEvent: DealEventAnimation = {
    id: `${Date.now()}-${Math.random()}`,
    kind: 'pay_completed',
    cards: assets.filter(c => selected.has(c.id)),
    actorName: s.players[payerI].name,
    actorIndex: payerI,
    targetName: s.players[recvI].name,
    targetIndex: recvI,
    amount: sum,
    message: `💵 ${s.players[payerI].name} maksis ${sum}M mängijale ${s.players[recvI].name}!`,
    timestamp: Date.now(),
  }

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
      lastEvent: payEvent,
      paySelected: [],
      log: [
        `✅ ${s.players[payerI].name} maksis ${sum}M · järgmine: ${s.players[next]?.name}`,
        ...s.log,
      ].slice(0, 16),
    }
    return checkWin(responseWindow(st, next))
  }
  return checkWin({
    ...s,
    players: basePlayers,
    phase: 'turn',
    pending: null,
    payFrom: undefined,
    payAmount: undefined,
    paySelected: [],
    lastEvent: payEvent,
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


function resolvePayCore(s: KinnistuDealState): KinnistuDealState {
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
    const loose = Object.values(payer.props).flatMap(cards => cards || [])
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
      paySelected: [],
      log: [
        `✅ ${s.players[payerI].name} tasus ~${paid}M · järgmine: ${s.players[next]?.name}`,
        ...s.log,
      ].slice(0, 16),
    }
    return checkWin(responseWindow(st, next))
  }
  return checkWin({
    ...s,
    players: basePlayers,
    phase: 'turn',
    pending: null,
    payFrom: undefined,
    payAmount: undefined,
    paySelected: [],
    log: [`✅ ${s.players[payerI].name} tasus ~${paid}M`, ...s.log].slice(0, 16),
  })
}

export function playCard(s: KinnistuDealState, playerIdx: number, cardId: string, asBank = false): KinnistuDealState {
  const next = playCardCore(s, playerIdx, cardId, asBank)
  return next === s ? s : prepareTurnEnd(next)
}

export function pickRentColor(s: KinnistuDealState, color: PropColor): KinnistuDealState {
  const next = pickRentColorCore(s, color)
  return next === s ? s : prepareTurnEnd(next)
}

export function startRentAll(s: KinnistuDealState): KinnistuDealState {
  const next = startRentAllCore(s)
  return next === s ? s : prepareTurnEnd(next)
}

export function pickTarget(s: KinnistuDealState, target: number): KinnistuDealState {
  const next = pickTargetCore(s, target)
  return next === s ? s : prepareTurnEnd(next)
}

export function defendWithNo(s: KinnistuDealState, playerIdx: number): KinnistuDealState {
  const next = defendWithNoCore(s, playerIdx)
  return next === s ? s : prepareTurnEnd(next)
}

export function skipDefend(s: KinnistuDealState, playerIdx: number): KinnistuDealState {
  const next = skipDefendCore(s, playerIdx)
  return next === s ? s : prepareTurnEnd(next)
}

export function pickProperty(s: KinnistuDealState, propertyId: string): KinnistuDealState {
  const next = pickPropertyCore(s, propertyId)
  return next === s ? s : prepareTurnEnd(next)
}

export function confirmSelectedPay(s: KinnistuDealState): KinnistuDealState {
  const next = confirmSelectedPayCore(s)
  return next === s ? s : prepareTurnEnd(next)
}

export function resolvePay(s: KinnistuDealState): KinnistuDealState {
  const next = resolvePayCore(s)
  return next === s ? s : prepareTurnEnd(next)
}

export type DealCommand =
  | { type: 'play'; cardId: string; bank?: boolean }
  | { type: 'target'; target: number }
  | { type: 'rent_color'; color: PropColor }
  | { type: 'property' | 'toggle_pay'; cardId: string }
  | { type: 'discard'; ids: string[] }
  | { type: 'rename'; name: string }
  | { type: 'end' | 'defend' | 'accept' | 'pay' | 'rent_all' }

/** Player commands always use the latest record, not a stale phone snapshot. */
export function applyDealCommand(s: KinnistuDealState, token: string, command: DealCommand, requestId: string): KinnistuDealState {
  if (s.processedMoves?.includes(requestId)) return s
  const actor = s.players.findIndex(p => p.token === token)
  if (actor < 0) throw new Error('See mängijalink ei kuulu sessioonile')
  const ownsAction = s.pending?.from === actor
  let next = s
  switch (command.type) {
    case 'play': next = playCard(s, actor, command.cardId, !!command.bank); break
    case 'target': if (ownsAction) next = pickTarget(s, command.target); break
    case 'rent_color': if (ownsAction) next = pickRentColor(s, command.color); break
    case 'property': if (ownsAction) next = pickProperty(s, command.cardId); break
    case 'rent_all': if (ownsAction) next = startRentAll(s); break
    case 'defend': next = defendWithNo(s,actor); break
    case 'accept': next = skipDefend(s,actor); break
    case 'pay': if (s.payFrom === actor) next = confirmSelectedPay(s); break
    case 'toggle_pay': next = togglePayCard(s,actor,command.cardId); break
    case 'discard': next = discardHand(s,actor,command.ids); break
    case 'end': if (s.current === actor) next = endTurn(s); break
    case 'rename': {
      const name=command.name.trim().slice(0,40)
      if (!name) throw new Error('Sisesta nimi')
      next={...s,players:s.players.map((p,i)=>i===actor?{...p,name}:p)}; break
    }
    default: throw new Error('Tundmatu käik')
  }
  if (next === s) throw new Error('See käik ei ole praegu lubatud')
  return { ...next, hostBeat: Date.now(), processedMoves: [...(s.processedMoves || []),requestId].slice(-64) }
}
