import type { KuldvillakPackData } from '@/lib/pocketbase'

export type KuldvillakState = {
  teams: { name: string; score: number }[]
  disabledCards: string[]
  currentQuestion: {
    col: number
    row: number
    category: string
    q: string
    a: string
    points: number
  } | null
  showAnswer: boolean
  packData: KuldvillakPackData
  code?: string
  /** timestamp – Display fires confetti when this changes */
  confettiAt?: number
  hostPeek?: boolean
}
