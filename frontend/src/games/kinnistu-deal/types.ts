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

export type DealCard =
  | { id: string; kind: 'money'; value: number }
  | { id: string; kind: 'property'; color: PropColor; name: string; value: number }
  | { id: string; kind: 'action'; action: ActionKind; name: string; value: number }

export type PlayerBoard = {
  name: string
  hand: DealCard[]
  bank: DealCard[]
  /** properties by color */
  props: Partial<Record<PropColor, DealCard[]>>
}

export type DealPhase = 'lobby' | 'turn' | 'pick_target' | 'pay' | 'over'

export type PendingAction = {
  action: ActionKind
  from: number
  /** rent color if rent */
  color?: PropColor
  cardId: string
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

export const COLOR_STYLE: Record<
  PropColor,
  { bg: string; label: string; labelEn: string }
> = {
  brown: { bg: '#6b3a2a', label: 'Pruun', labelEn: 'Brown' },
  mint: { bg: '#7dd3c0', label: 'Münt', labelEn: 'Mint' },
  pink: { bg: '#e879a9', label: 'Roosa', labelEn: 'Pink' },
  orange: { bg: '#f59e0b', label: 'Oranž', labelEn: 'Orange' },
  red: { bg: '#ef4444', label: 'Punane', labelEn: 'Red' },
  yellow: { bg: '#eab308', label: 'Kollane', labelEn: 'Yellow' },
  green: { bg: '#22c55e', label: 'Roheline', labelEn: 'Green' },
  blue: { bg: '#3b82f6', label: 'Sinine', labelEn: 'Blue' },
  rail: { bg: '#1e293b', label: 'Raudtee', labelEn: 'Rail' },
  util: { bg: '#94a3b8', label: 'Kommunaal', labelEn: 'Utility' },
}

export function completeSets(p: PlayerBoard): number {
  let n = 0
  for (const c of Object.keys(SET_SIZE) as PropColor[]) {
    const arr = p.props[c] || []
    if (arr.length >= SET_SIZE[c]) n++
  }
  return n
}

export function bankTotal(p: PlayerBoard): number {
  return p.bank.reduce((s, c) => s + (c.kind === 'money' ? c.value : c.value), 0)
}
