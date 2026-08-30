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
  /** secret token for private player link */
  token: string
  name: string
  hand: DealCard[]
  bank: DealCard[]
  props: Partial<Record<PropColor, DealCard[]>>
  connected?: boolean
}

export type DealPhase = 'lobby' | 'turn' | 'pick_target' | 'pay' | 'over'

export type PendingAction = {
  action: ActionKind
  from: number
  color?: PropColor
  cardId: string
  /** for multi-pay (birthday) remaining targets */
  remaining?: number[]
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

export function makeToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let t = ''
  for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}
