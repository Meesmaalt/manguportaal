export type BlitzChoice = 0 | 1 | 2 | 3

export type BlitzDifficulty = 'easy' | 'medium' | 'hard'

export type BlitzQuestionType = 'quiz' | 'true_false' | 'multi' | 'type_answer' | 'slider' | 'poll'

export type BlitzQuestion = {
  id: string
  q: string
  choices: [string, string, string, string]
  correct: BlitzChoice
  /** Question type: default 'quiz' (4 choices). Kahoot types: true_false, multi, type_answer, slider, poll */
  type?: BlitzQuestionType
  /** Indices of correct choices for 'multi' (e.g. [0, 2]) */
  multiCorrect?: number[]
  /** Accepted text answers for 'type_answer' (case-insensitive) */
  acceptedAnswers?: string[]
  /** For 'slider' (numerical guess) */
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderTarget?: number
  sliderUnit?: string
  /** 1x (default) or 2x (Golden Question / Double Points) */
  pointsMultiplier?: number
  /** Custom time limit in seconds for this question */
  timeLimit?: number
  /** optional image (https or data URL) */
  imageUrl?: string
  hostNote?: string
  difficulty?: BlitzDifficulty
}

export type BlitzTeamId = 'a' | 'b'

export type BlitzPowerUp = 'fifty' | 'double' | 'time'

export type BlitzReaction = {
  id: string
  emoji: string
  playerName?: string
  at: number
}

export type BlitzPlayer = {
  id: string
  name: string
  score: number
  joinedAt: number
  streak?: number
  team?: BlitzTeamId
  /** emoji avatar */
  avatar?: string
  /** one-shot power-ups remaining */
  powers?: Partial<Record<BlitzPowerUp, number>>
  /** active this question */
  activeDouble?: boolean
  /** 50/50 eliminated choice indices */
  hiddenChoices?: number[]
  /** lobby ready checkbox */
  ready?: boolean
  /** max streak this session */
  bestStreak?: number
}


export type BlitzPhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'midboard' | 'podium' | 'sudden_death'

export type BlitzAnswer = {
  choice?: BlitzChoice
  /** multi-choice indices selected */
  choices?: number[]
  /** open text answer */
  textAnswer?: string
  /** slider value */
  numericAnswer?: number
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
  /** team captains (player ids) */
  captains?: { a?: string; b?: string }
  /** practice round — no points */
  isWarmup?: boolean
  warmupDone?: boolean
  /** shown between blocks of questions */
  midboardUntil?: number
  suddenDeathActive?: boolean
  /** Kahoot-like power-ups */
  powerUpsEnabled?: boolean
  /** play only N random questions from pack (0 = all) */
  questionLimit?: number
  /** host: must all players mark ready before start */
  requireReady?: boolean
  /** last high streak event for TV confetti */
  streakEvent?: { playerId: string; name: string; streak: number; at: number }
  /** Highest climber / Päeva tõusja */
  climber?: { playerId: string; name: string; delta: number }
  /** Floating live reactions on TV */
  reactions?: BlitzReaction[]
  resultsSnapshot?: {
    rows?: { name: string; score: number; avatar?: string; team?: BlitzTeamId }[]
  }
  packData?: {
    secondsPerQuestion?: number
    pointsMax?: number
    revealSeconds?: number
    shuffleOnStart?: boolean
    teamsEnabled?: boolean
    preCountdownSeconds?: number
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
  pointsMax: number,
  multiplier = 1
): number {
  if (!correct) return 0
  const total = Math.max(1000, secondsPerQuestion * 1000)
  const remaining = Math.max(0, total - answeredAtMs)
  const raw = Math.round(pointsMax * (remaining / total))
  const base = Math.max(100, Math.min(pointsMax, raw))
  return Math.round(base * Math.max(1, multiplier))
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
