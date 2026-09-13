export type MiljonarLifeline = 'fifty_fifty' | 'ask_audience' | 'phone_friend' | 'switch_question'

export type MiljonarQuestion = {
  id: string
  tier: number // 1 to 15 (or 0 for backup)
  prize: number // e.g. 100, 200, ..., 1000000
  q: string
  choices: [string, string, string, string] // A, B, C, D
  correct: 0 | 1 | 2 | 3
  hostNote?: string
  funFact?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
  backup?: boolean // whether this is a reserve question for "switch question"
}

export type AudienceVoteStats = {
  A: number
  B: number
  C: number
  D: number
  total: number
}

export type FriendAdvice = {
  friendName: string
  suggestedChoice: 0 | 1 | 2 | 3
  confidence: number // 0 - 100%
  comment: string
}

export type MiljonarContestant = {
  id: string
  name: string
  score: number // final won prize
  status: 'playing' | 'walked' | 'lost' | 'won_million'
  finalTier: number
  timestamp: number
}

export type MiljonarPhase =
  | 'lobby' // Player joins hot seat, introduction
  | 'question' // Question presented, options visible
  | 'locked' // Player chosen answer locked ("Kas see on sinu lõplik vastus?")
  | 'revealed_correct' // Answer revealed as correct
  | 'revealed_wrong' // Answer revealed as wrong -> drop to safety milestone
  | 'walk_away' // Player decided to take money and leave
  | 'won_million' // 1 000 000 € WINNER!
  | 'audience_poll' // "Rahva hääl" voting active
  | 'phone_calling' // "Helista sõbrale" 30s timer active

export type MiljonarState = {
  phase: MiljonarPhase
  code: string
  contestant: {
    name: string
    avatar?: string
  }
  questions: MiljonarQuestion[]
  currentTierIndex: number // 0 to 14 (corresponding to Q1 to Q15)
  backupQuestions?: MiljonarQuestion[]

  // Lifelines availability
  lifelines: {
    fifty_fifty: boolean // true = still available
    ask_audience: boolean
    phone_friend: boolean
    switch_question: boolean
  }

  // Active state for current question
  selectedChoice: 0 | 1 | 2 | 3 | null // tentative or locked choice
  isLocked: boolean
  eliminatedChoices: (0 | 1 | 2 | 3)[] // from 50:50

  // Lifeline active overlays
  audienceVotes?: Record<string, 0 | 1 | 2 | 3> // playerId -> choice
  audienceStats?: AudienceVoteStats | null
  phoneTimer?: {
    running: boolean
    secondsLeft: number
    advice?: FriendAdvice | null
  } | null

  // Safety net milestones
  safeTier1: number // default 4 (index 4 is 5th question = 1 000 €)
  safeTier2: number // default 9 (index 9 is 10th question = 32 000 €)

  // Current winnings
  accumulatedBank: number
  guaranteedBank: number

  // Game over details
  wonAmount: number

  // Audio & Atmosphere toggles
  musicEnabled: boolean
  sfxEnabled: boolean
  suspenseLevel?: 'low' | 'medium' | 'high' | 'ultra'

  // Confetti trigger timestamp
  confettiAt?: number

  // Live spectator reactions (floating emojis)
  reactions?: {
    id: string
    emoji: string
    x: number
    ts: number
  }[]

  // History of tonight's hot-seat contestants
  contestantHistory?: MiljonarContestant[]

  packData?: {
    name?: string
    questions?: MiljonarQuestion[]
    backupQuestions?: MiljonarQuestion[]
  }
  themeId?: string
  bgMedia?: any
  hostBeat?: number
  publicGuide?: boolean
}

export const MILJONAR_LADDER = [
  { tier: 1, prize: 100, label: '100 €', isMilestone: false },
  { tier: 2, prize: 200, label: '200 €', isMilestone: false },
  { tier: 3, prize: 300, label: '300 €', isMilestone: false },
  { tier: 4, prize: 500, label: '500 €', isMilestone: false },
  { tier: 5, prize: 1000, label: '1 000 €', isMilestone: true }, // 1. Turvasumma
  { tier: 6, prize: 2000, label: '2 000 €', isMilestone: false },
  { tier: 7, prize: 4000, label: '4 000 €', isMilestone: false },
  { tier: 8, prize: 8000, label: '8 000 €', isMilestone: false },
  { tier: 9, prize: 16000, label: '16 000 €', isMilestone: false },
  { tier: 10, prize: 32000, label: '32 000 €', isMilestone: true }, // 2. Turvasumma
  { tier: 11, prize: 64000, label: '64 000 €', isMilestone: false },
  { tier: 12, prize: 125000, label: '125 000 €', isMilestone: false },
  { tier: 13, prize: 250000, label: '250 000 €', isMilestone: false },
  { tier: 14, prize: 500000, label: '500 000 €', isMilestone: false },
  { tier: 15, prize: 1000000, label: '1 000 000 €', isMilestone: true }, // MILJON
] as const

export function formatPrize(amount: number): string {
  if (amount >= 1000000) return '1 000 000 €'
  return `${amount.toLocaleString('et-EE')} €`
}
