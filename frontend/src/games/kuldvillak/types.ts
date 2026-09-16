import type { KuldvillakPackData } from '@/lib/pocketbase'

export type BuzzState = {
  name: string
  at: number
} | null

export type FinalPhase = 'none' | 'wager' | 'question' | 'reveal' | 'done'

export type KuldvillakState = {
  teams: { name: string; score: number }[]
  disabledCards: string[]
  currentQuestion: {
    col: number
    row: number
    category: string
    category_tr?: string
    q: string
    q_tr?: string
    a: string
    a_tr?: string
    points: number
    hostNote?: string
    imageUrl?: string
  } | null
  showAnswer: boolean
  packData: KuldvillakPackData
  code?: string
  confettiAt?: number
  hostPeek?: boolean
  /** Buzzer: first player to press */
  buzzEnabled?: boolean
  /** Show buzzer QR on host + TV */
  showBuzzQr?: boolean
  buzz?: BuzzState
  /** Final Jeopardy */
  finalPhase?: FinalPhase
  finalWagers?: number[]
  finalCorrect?: boolean[]
}
