import type { RoosidesodaPackData } from '@/lib/pocketbase'

export type Team = { name: string; score: number }

export type RoosidesodaState = {
  teams: Team[]
  currentRoundIdx: number
  revealed: number[]
  strikes: number
  bank: number
  activeTeam: number
  packData: RoosidesodaPackData
  code?: string
  showStrikeOverlay?: boolean
}
