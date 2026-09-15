import type { RoosidesodaPackData } from '@/lib/pocketbase'

export type FinalRoundPlayerState = {
  answers: { text: string; points: number }[]
  revealedCount: number
}

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
  
  // Finaalvoor (Fast Money)
  finalPhase?: 'none' | 'intro' | 'p1_timer' | 'p1_input' | 'p1_reveal' | 'p2_intro' | 'p2_timer' | 'p2_input' | 'p2_reveal' | 'end'
  finalTimerEndsAt?: number
  p1?: FinalRoundPlayerState
  p2?: FinalRoundPlayerState
}