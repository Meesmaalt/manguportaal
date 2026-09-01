export type BlitzChoice = 0 | 1 | 2 | 3

export type BlitzQuestion = {
  id: string
  q: string
  choices: [string, string, string, string]
  correct: BlitzChoice
  /** optional image (https or data URL) */
  imageUrl?: string
  hostNote?: string
}

export type BlitzTeamId = 'a' | 'b'

export type BlitzPlayer = {
  id: string
  name: string
  score: number
  joinedAt: number
  streak?: number
  team?: BlitzTeamId
}

export type BlitzPhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'midboard' | 'podium' | 'sudden_death'

export type BlitzAnswer = {
  choice: BlitzChoice
  at: number // ms from question start
}

export type BlitzState = {
  code?: string
  phase: BlitzPhase
  players: BlitzPlayer[]
  questions: BlitzQuestion[]
  qIndex: number
  questionStartedAt?: number
  countdownStartedAt?: number
  /** pre-question countdown seconds (3-2-1) */
  preCountdownSeconds?: number
  secondsPerQuestion: number
  pointsMax: number
  answers: Record<string, BlitzAnswer>
  lastRoundPoints: Record<string, number>
  /** choice index -> count for current reveal */
  lastAnswerDist?: Record<number, number>
  /** fastest correct answers this round (photo finish) */
  lastPhotoFinish?: { playerId: string; name: string; atMs: number; points: number }[]
  /** seconds to show reveal before host can auto-advance (0 = manual) */
  revealSeconds: number
  revealStartedAt?: number
  shuffleOnStart?: boolean
  teamsEnabled?: boolean
  /** practice round — no points */
  isWarmup?: boolean
  warmupDone?: boolean
  /** shown between blocks of questions */
  midboardUntil?: number
  suddenDeathActive?: boolean
  packData?: {
    secondsPerQuestion?: number
    pointsMax?: number
    revealSeconds?: number
    shuffleOnStart?: boolean
    teamsEnabled?: boolean
    questions?: BlitzQuestion[]
  }
  hostBeat?: number
}

export const CHOICE_COLORS = [
  { bg: 'bg-red-600', border: 'border-red-400', soft: 'bg-red-600/90', label: 'A' },
  { bg: 'bg-blue-600', border: 'border-blue-400', soft: 'bg-blue-600/90', label: 'B' },
  { bg: 'bg-yellow-500', border: 'border-yellow-300', soft: 'bg-yellow-500/90', label: 'C' },
  { bg: 'bg-green-600', border: 'border-green-400', soft: 'bg-green-600/90', label: 'D' },
] as const

export function makePlayerId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function calcPoints(
  correct: boolean,
  answeredAtMs: number,
  secondsPerQuestion: number,
  pointsMax: number
): number {
  if (!correct) return 0
  const total = Math.max(1000, secondsPerQuestion * 1000)
  const remaining = Math.max(0, total - answeredAtMs)
  const raw = Math.round(pointsMax * (remaining / total))
  return Math.max(100, Math.min(pointsMax, raw))
}

export function sortedPlayers(players: BlitzPlayer[]): BlitzPlayer[] {
  return [...players].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
}

export function shuffleQuestions(questions: BlitzQuestion[]): BlitzQuestion[] {
  const arr = [...questions]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
