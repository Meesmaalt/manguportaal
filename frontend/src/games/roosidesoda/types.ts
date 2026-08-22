import type { RoosidesodaPackData } from '@/lib/pocketbase'

export type RoosidesodaState = {
  teams: { name: string; score: number }[]
  currentRoundIdx: number
  revealed: number[]
  strikes: number
  bank: number
  activeTeam: number
  packData: RoosidesodaPackData
  code?: string
  showStrikeOverlay?: boolean
  confettiAt?: number
}
