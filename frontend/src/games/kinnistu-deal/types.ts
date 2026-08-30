export type PropColor =
  | 'brown'
  | 'mint'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'rail'
  | 'util'

export type ActionKind =
  | 'pass_go'
  | 'rent'
  | 'debt'
  | 'birthday'
  | 'sly_deal'
  | 'forced_deal'
  | 'deal_breaker'
  | 'just_say_no'
  | 'house'
  | 'hotel'

export type DealCard =
  | { id: string; kind: 'money'; value: number }
  | { id: string; kind: 'property'; color: PropColor; name: string; value: number }
  | { id: string; kind: 'action'; action: ActionKind; name: string; value: number }

export type PlayerBoard = {
  token: string
  name: string
  hand: DealCard[]
  bank: DealCard[]
  props: Partial<Record<PropColor, DealCard[]>>
  /** maja/hotell komplekti peal (ainult täiskomplektil) */
  buildings?: Partial<Record<PropColor, 'house' | 'hotel'>>
}

export type DealPhase =
  | 'lobby'
  | 'turn'
  | 'pick_rent_color' // after playing rent: choose which of YOUR sets
  | 'pick_target'
  | 'pick_property'
  | 'pay'
  | 'defend'
  | 'over'

export type PendingAction = {
  action: ActionKind
  from: number
  cardId: string
  target?: number
  propertyId?: string
  color?: PropColor
}

export type KinnistuDealState = {
  players: PlayerBoard[]
  deck: DealCard[]
  discard: DealCard[]
  current: number
  playsLeft: number
  phase: DealPhase
  pending?: PendingAction | null
  payFrom?: number
  payAmount?: number
  winner?: number
  log: string[]
  code?: string
  packData?: { winSets: number; startHand: number }
  hostBeat?: number
  confettiAt?: number
}

export const SET_SIZE: Record<PropColor, number> = {
  brown: 2,
  mint: 3,
  pink: 3,
  orange: 3,
  red: 3,
  yellow: 3,
  green: 3,
  blue: 2,
  rail: 4,
  util: 2,
}

/** Üür vastavalt tänavate arvule komplektis (nagu Deal-stiilis). Indeks = count. */
export const RENT_BY_COUNT: Record<PropColor, number[]> = {
  brown: [0, 1, 2],
  mint: [0, 1, 2, 3],
  pink: [0, 1, 2, 4],
  orange: [0, 1, 3, 5],
  red: [0, 2, 3, 6],
  yellow: [0, 2, 4, 6],
  green: [0, 2, 4, 7],
  blue: [0, 3, 8],
  rail: [0, 1, 2, 3, 4],
  util: [0, 1, 2],
}

export const HOUSE_RENT_BONUS = 3
export const HOTEL_RENT_BONUS = 4

export const COLOR_STYLE: Record<PropColor, { bg: string; label: string }> = {
  brown: { bg: '#6b3a2a', label: 'Pruun' },
  mint: { bg: '#7dd3c0', label: 'Münt' },
  pink: { bg: '#e879a9', label: 'Roosa' },
  orange: { bg: '#f59e0b', label: 'Oranž' },
  red: { bg: '#ef4444', label: 'Punane' },
  yellow: { bg: '#eab308', label: 'Kollane' },
  green: { bg: '#22c55e', label: 'Roheline' },
  blue: { bg: '#3b82f6', label: 'Sinine' },
  rail: { bg: '#1e293b', label: 'Raudtee' },
  util: { bg: '#94a3b8', label: 'Kommunaal' },
}

export function completeSets(p: PlayerBoard): number {
  let n = 0
  for (const c of Object.keys(SET_SIZE) as PropColor[]) {
    if ((p.props[c] || []).length >= SET_SIZE[c]) n++
  }
  return n
}

export function bankTotal(p: PlayerBoard): number {
  return p.bank.reduce((s, c) => s + c.value, 0)
}

export function rentForSet(p: PlayerBoard, color: PropColor): number {
  const count = (p.props[color] || []).length
  if (count <= 0) return 0
  const table = RENT_BY_COUNT[color]
  const base = table[Math.min(count, table.length - 1)] ?? 0
  const b = p.buildings?.[color]
  if (b === 'hotel') return base + HOTEL_RENT_BONUS
  if (b === 'house') return base + HOUSE_RENT_BONUS
  return base
}

export function makeToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let t = ''
  for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}

export function looseProperties(p: PlayerBoard): DealCard[] {
  const out: DealCard[] = []
  for (const col of Object.keys(SET_SIZE) as PropColor[]) {
    const arr = p.props[col] || []
    if (arr.length > 0 && arr.length < SET_SIZE[col]) out.push(...arr)
  }
  return out
}

export function fullSetColors(p: PlayerBoard): PropColor[] {
  return (Object.keys(SET_SIZE) as PropColor[]).filter(
    (c) => (p.props[c] || []).length >= SET_SIZE[c]
  )
}

export function colorsWithAny(p: PlayerBoard): PropColor[] {
  return (Object.keys(SET_SIZE) as PropColor[]).filter((c) => (p.props[c] || []).length > 0)
}

export function actionLabel(a: ActionKind): string {
  const map: Record<ActionKind, string> = {
    pass_go: 'Mine edasi',
    rent: 'Nõua üüri',
    debt: 'Võlanõue',
    birthday: 'Sünnipäev!',
    sly_deal: 'Salakaup',
    forced_deal: 'Sunnitud tehing',
    deal_breaker: 'Tehingumurdja',
    just_say_no: 'Ei, aitäh',
    house: 'Maja',
    hotel: 'Hotell',
  }
  return map[a]
}
