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
    isDailyDouble?: boolean
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
  /** Two-phase question countdown timer (reading + thinking) */
  timer?: {
    phase?: 'reading' | 'thinking' | 'ended'
    readingTotal?: number
    thinkingTotal?: number
    endsAt: number | null
    remaining: number
    running: boolean
    total: number
  } | null
  /** Public display font override */
  displayFont?: string
  /** Game configuration settings */
  gameSettings?: {
    displayFont?: string
    readingTimeSec?: number
    thinkingTimeSec?: number
    autoTimer?: boolean
    soundEnabled?: boolean
  }
  /** Daily Double (Kuldvillaku Duubel) settings */
  dailyDoubleTile?: string | null
  dailyDoubleWager?: number | null
  dailyDoubleTeam?: number | null
  dailyDoubleStep?: 'intro' | 'wager' | 'question' | null
  /** Floating score animation trigger */
  floatingScore?: {
    teamIdx: number
    delta: number
    id: number
  } | null
}
