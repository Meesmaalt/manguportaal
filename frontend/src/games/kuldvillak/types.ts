import type { KuldvillakPackData } from '@/lib/pocketbase'

export type Team = { name: string; score: number }

export type KuldvillakState = {
  teams: Team[]
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
}
