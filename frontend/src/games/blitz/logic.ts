import type { BlitzAnswer, BlitzChoice, BlitzPlayer, BlitzPowerUp, BlitzQuestion, BlitzState, BlitzTeamId } from './types'
import { calcPoints, makePlayerId, shuffleQuestions } from './types'

export function normalizeBlitzState(s: BlitzState | null | undefined): BlitzState | null {
  if (!s || typeof s !== 'object') return null
  return {
    ...s,
    players: Array.isArray(s.players) ? s.players : [],
    questions: Array.isArray(s.questions) ? s.questions : [],
    answers: s.answers && typeof s.answers === 'object' ? s.answers : {},
    lastRoundPoints:
      s.lastRoundPoints && typeof s.lastRoundPoints === 'object' ? s.lastRoundPoints : {},
    qIndex: typeof s.qIndex === 'number' ? s.qIndex : 0,
    secondsPerQuestion: s.secondsPerQuestion || 20,
    pointsMax: s.pointsMax || 1000,
    revealSeconds: s.revealSeconds ?? 5,
    phase: s.phase || 'lobby',
  }
}

export function emptyBlitzState(code: string, packData?: BlitzState['packData']): BlitzState {
  const questions = (packData?.questions || []) as BlitzQuestion[]
  return {
    code,
    phase: 'lobby',
    players: [],
    questions,
    qIndex: 0,
    secondsPerQuestion: packData?.secondsPerQuestion ?? 20,
    pointsMax: packData?.pointsMax ?? 1000,
    answers: {},
    lastRoundPoints: {},
    revealSeconds: packData?.revealSeconds ?? 5,
    shuffleOnStart: packData?.shuffleOnStart ?? true,
    preCountdownSeconds: packData?.preCountdownSeconds ?? 3,
    teamsEnabled: packData?.teamsEnabled ?? false,
    packData,
  }
}

export function joinPlayer(
  s: BlitzState,
  name: string,
  existingId?: string
): { state: BlitzState; playerId: string } {
  const trimmed = name.trim().slice(0, 24)
  if (!trimmed) return { state: s, playerId: existingId || '' }
  if (existingId) {
    const idx = s.players.findIndex((p) => p.id === existingId)
    if (idx >= 0) {
      const players = s.players.map((p, i) => (i === idx ? { ...p, name: trimmed } : p))
      return { state: { ...s, players }, playerId: existingId }
    }
  }
  const byName = s.players.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
  if (byName) return { state: s, playerId: byName.id }
  const id = makePlayerId()
  const avatars = ['🦊', '🐯', '🐸', '🦉', '🦄', '🐲', '🐧', '🦁', '🐙', '🦋', '🐺', '🐼']
  const avatar = avatars[Math.floor(Math.random() * avatars.length)]
  const powers =
    s.powerUpsEnabled !== false ? { fifty: 1, double: 1, time: 1 } : undefined
  const player: BlitzPlayer = {
    id,
    name: trimmed,
    score: 0,
    joinedAt: Date.now(),
    avatar,
    powers,
    ready: false,
    bestStreak: 0,
  }
  return { state: { ...s, players: [...s.players, player] }, playerId: id }
}

export function removePlayer(s: BlitzState, playerId: string): BlitzState {
  return {
    ...s,
    players: s.players.filter((p) => p.id !== playerId),
    answers: Object.fromEntries(Object.entries(s.answers).filter(([k]) => k !== playerId)),
  }
}

export function startQuestion(s: BlitzState, index?: number): BlitzState {
  if (s.players.length < 1) return s
  if (s.phase === 'lobby' && s.requireReady && s.players.some((p) => !p.ready)) {
    return s
  }
  let questions = s.questions
  let qIndex = index ?? 0
  if ((index === 0 || s.phase === 'lobby') && s.phase === 'lobby') {
    questions = s.shuffleOnStart ? shuffleQuestions(s.questions) : [...s.questions]
    const limit = s.questionLimit || 0
    if (limit > 0 && limit < questions.length) {
      questions = questions.slice(0, limit)
    }
  }
  if (qIndex < 0 || qIndex >= questions.length) {
    return { ...s, questions, phase: 'podium', answers: {}, lastRoundPoints: {} }
  }
  const pre = s.preCountdownSeconds ?? 3
  if (pre > 0) {
    return {
      ...s,
      questions,
      phase: 'countdown',
      qIndex,
      countdownStartedAt: Date.now(),
      questionStartedAt: undefined,
      answers: {},
      lastRoundPoints: {},
      revealStartedAt: undefined,
    }
  }
  return openQuestion({ ...s, questions }, qIndex)
}

export function openQuestion(s: BlitzState, qIndex?: number): BlitzState {
  const idx = qIndex ?? s.qIndex
  if (idx < 0 || idx >= s.questions.length) {
    return { ...s, phase: 'podium', answers: {}, lastRoundPoints: {} }
  }
  return {
    ...s,
    phase: 'question',
    qIndex: idx,
    questionStartedAt: Date.now(),
    countdownStartedAt: undefined,
    answers: {},
    lastRoundPoints: {},
    revealStartedAt: undefined,
  }
}

/** Merge a single player's answer without clobbering host-driven fields. */
export function mergePlayerAnswer(
  server: BlitzState,
  playerId: string,
  choice: BlitzChoice,
  clientNow?: number
): BlitzState {
  if (server.phase !== 'question' || !server.questionStartedAt) return server
  const answers = server.answers || {}
  if (answers[playerId]) return server
  if (!(server.players || []).some((p) => p.id === playerId)) return server
  const elapsed = Math.max(0, (clientNow || Date.now()) - server.questionStartedAt)
  const limit = (server.secondsPerQuestion || 20) * 1000 + 800
  if (elapsed > limit) return server
  return {
    ...server,
    answers: {
      ...answers,
      [playerId]: { choice, at: elapsed },
    },
  }
}

export function submitAnswer(s: BlitzState, playerId: string, choice: BlitzChoice): BlitzState {
  return mergePlayerAnswer(s, playerId, choice)
}

export function reveal(s: BlitzState): BlitzState {
  if (s.phase !== 'question' && s.phase !== 'sudden_death') return s
  const q = s.questions[s.qIndex]
  if (!q) return { ...s, phase: 'podium' }

  // Warmup: show answer, no points, back to lobby
  if (s.isWarmup) {
    const lastAnswerDist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
    for (const ans of Object.values(s.answers)) {
      lastAnswerDist[ans.choice] = (lastAnswerDist[ans.choice] || 0) + 1
    }
    return {
      ...s,
      phase: 'reveal',
      lastRoundPoints: {},
      lastAnswerDist,
      lastPhotoFinish: [],
      revealStartedAt: Date.now(),
    }
  }

  const lastRoundPoints: Record<string, number> = {}
  const lastAnswerDist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
  const players = s.players.map((p) => {
    const ans = s.answers[p.id]
    if (!ans) {
      lastRoundPoints[p.id] = 0
      return { ...p, streak: 0 }
    }
    lastAnswerDist[ans.choice] = (lastAnswerDist[ans.choice] || 0) + 1
    const correct = ans.choice === q.correct
    let pts = calcPoints(correct, ans.at, s.secondsPerQuestion, s.pointsMax)
    const streak = correct ? (p.streak || 0) + 1 : 0
    // streak bonus: +50 per consecutive correct after first (cap +200)
    if (correct && streak > 1) {
      pts += Math.min(200, (streak - 1) * 50)
    }
    // last question: double points
    const isFinalQ = s.qIndex === s.questions.length - 1 && s.questions.length > 0
    if (correct && isFinalQ) {
      pts = Math.round(pts * 2)
    }
    lastRoundPoints[p.id] = pts
    return { ...p, score: p.score + pts, streak }
  })
  const lastPhotoFinish = s.players
    .map((p) => {
      const ans = s.answers[p.id]
      if (!ans || ans.choice !== q.correct) return null
      return {
        playerId: p.id,
        name: p.name,
        atMs: ans.at,
        points: lastRoundPoints[p.id] || 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a!.atMs - b!.atMs))
    .slice(0, 5) as { playerId: string; name: string; atMs: number; points: number }[]

  return {
    ...s,
    phase: 'reveal',
    players,
    lastRoundPoints,
    lastAnswerDist,
    lastPhotoFinish,
    streakEvent,
    revealStartedAt: Date.now(),
  }
}

export function nextQuestion(s: BlitzState): BlitzState {
  if (s.phase !== 'reveal' && s.phase !== 'lobby' && s.phase !== 'midboard') return s

  if (s.isWarmup) {
    const restored = (s.packData?.questions && s.packData.questions.length)
      ? s.packData.questions
      : s.questions.filter((q) => q.id !== 'warmup')
    return {
      ...s,
      phase: 'lobby',
      isWarmup: false,
      warmupDone: true,
      questions: restored,
      qIndex: 0,
      answers: {},
      lastRoundPoints: {},
      lastPhotoFinish: [],
      revealStartedAt: undefined,
      questionStartedAt: undefined,
      countdownStartedAt: undefined,
    }
  }

  if (s.suddenDeathActive) {
    // After sudden death reveal → podium
    return finalizePodium({ ...s, suddenDeathActive: false })
  }

  const next = s.phase === 'lobby' ? 0 : s.qIndex + 1
  if (next >= s.questions.length) {
    return maybeSuddenDeathOrPodium(s)
  }

  // Mid-board every 5 questions (after Q5, Q10, ...)
  if (next > 0 && next % 5 === 0 && next < s.questions.length && s.phase === 'reveal') {
    return {
      ...s,
      phase: 'midboard',
      qIndex: next - 1, // stay conceptually after answered Q
      answers: {},
      midboardUntil: Date.now() + 5000,
      revealStartedAt: undefined,
    }
  }

  return startQuestion({ ...s, midboardUntil: undefined }, next)
}

export function continueAfterMidboard(s: BlitzState): BlitzState {
  if (s.phase !== 'midboard') return s
  const next = s.qIndex + 1
  if (next >= s.questions.length) return maybeSuddenDeathOrPodium(s)
  return startQuestion({ ...s, midboardUntil: undefined }, next)
}

function maybeSuddenDeathOrPodium(s: BlitzState): BlitzState {
  const ranked = [...s.players].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
  if (
    ranked.length >= 2 &&
    ranked[0].score === ranked[1].score &&
    ranked[0].score > 0 &&
    !s.suddenDeathActive
  ) {
    // Sudden death: reuse last question or first
    const idx = Math.max(0, s.questions.length - 1)
    return {
      ...s,
      phase: 'countdown',
      qIndex: idx,
      suddenDeathActive: true,
      isWarmup: false,
      answers: {},
      lastRoundPoints: {},
      lastPhotoFinish: [],
      countdownStartedAt: Date.now(),
      questionStartedAt: undefined,
      revealStartedAt: undefined,
      midboardUntil: undefined,
    }
  }
  return finalizePodium(s)
}

function finalizePodium(s: BlitzState): BlitzState {
  const ranked = [...s.players].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
  return {
    ...s,
    phase: 'podium',
    answers: {},
    lastRoundPoints: {},
    lastPhotoFinish: [],
    revealStartedAt: undefined,
    suddenDeathActive: false,
    midboardUntil: undefined,
    resultsSnapshot: {
      at: Date.now(),
      code: s.code || '',
      rows: ranked.map((p) => ({
        name: p.name,
        score: p.score,
        avatar: p.avatar,
        team: p.team,
      })),
    },
  }
}

export function skipQuestion(s: BlitzState): BlitzState {
  if (s.phase !== 'question') return s
  return reveal(s)
}

/** Skip without scoring (bad question). */
export function skipQuestionVoid(s: BlitzState): BlitzState {
  if (s.phase !== 'question' && s.phase !== 'countdown' && s.phase !== 'reveal') return s
  const next = s.qIndex + 1
  if (next >= s.questions.length) {
    return { ...s, phase: 'podium', answers: {}, lastRoundPoints: {}, lastPhotoFinish: [], revealStartedAt: undefined }
  }
  return startQuestion(
    {
      ...s,
      answers: {},
      lastRoundPoints: {},
      lastPhotoFinish: [],
      revealStartedAt: undefined,
      questionStartedAt: undefined,
      countdownStartedAt: undefined,
    },
    next
  )
}

export function goPodium(s: BlitzState): BlitzState {
  return finalizePodium(s)
}

export function restartQuiz(s: BlitzState): BlitzState {
  const baseQs = s.packData?.questions || s.questions
  return {
    ...s,
    phase: 'lobby',
    qIndex: 0,
    answers: {},
    lastRoundPoints: {},
    questionStartedAt: undefined,
    revealStartedAt: undefined,
    questions: baseQs,
    players: s.players.map((p) => ({ ...p, score: 0 })),
  }
}


export function setPlayerTeam(s: BlitzState, playerId: string, team: BlitzTeamId | undefined): BlitzState {
  return {
    ...s,
    players: s.players.map((p) => (p.id === playerId ? { ...p, team } : p)),
  }
}

export function toggleTeams(s: BlitzState, enabled: boolean): BlitzState {
  if (!enabled) {
    return {
      ...s,
      teamsEnabled: false,
      captains: {},
      players: s.players.map((p) => ({ ...p, team: undefined })),
    }
  }
  const players = s.players.map((p, i) => ({
    ...p,
    team: (p.team || (i % 2 === 0 ? 'a' : 'b')) as BlitzTeamId,
  }))
  return { ...s, teamsEnabled: true, players }
}

export function teamTotals(s: BlitzState): { a: number; b: number } {
  let a = 0
  let b = 0
  for (const p of s.players || []) {
    if (p.team === 'a') a += p.score
    else if (p.team === 'b') b += p.score
  }
  return { a, b }
}


const WARMUP_Q = {
  id: 'warmup',
  q: 'Prooviküsimus (punktid ei loe): Mis värv on taevas päeval?',
  choices: ['Roheline', 'Sinine', 'Punane', 'Lilla'] as [string, string, string, string],
  correct: 1 as const,
}

export function startWarmup(s: BlitzState): BlitzState {
  if (s.players.length < 1) return s
  const baseQs = s.questions.filter((q) => q.id !== 'warmup')
  return {
    ...s,
    isWarmup: true,
    suddenDeathActive: false,
    packData: {
      ...(s.packData || {}),
      questions: s.packData?.questions?.length ? s.packData.questions : baseQs,
    },
    questions: [WARMUP_Q],
    qIndex: 0,
    phase: 'countdown',
    countdownStartedAt: Date.now(),
    questionStartedAt: undefined,
    answers: {},
    lastRoundPoints: {},
    lastPhotoFinish: [],
    revealStartedAt: undefined,
  }
}


/** Host jumps to a question index (lobby or between rounds). */
export function jumpToQuestion(s: BlitzState, index: number): BlitzState {
  if (index < 0 || index >= s.questions.length) return s
  if (s.phase !== 'lobby' && s.phase !== 'reveal' && s.phase !== 'midboard' && s.phase !== 'podium') {
    return s
  }
  return startQuestion(
    {
      ...s,
      isWarmup: false,
      suddenDeathActive: false,
      midboardUntil: undefined,
      answers: {},
      lastRoundPoints: {},
      lastPhotoFinish: [],
      revealStartedAt: undefined,
    },
    index
  )
}


export function setPowerUpsEnabled(s: BlitzState, enabled: boolean): BlitzState {
  const players = s.players.map((p) => ({
    ...p,
    powers: enabled
      ? { fifty: p.powers?.fifty ?? 1, double: p.powers?.double ?? 1, time: p.powers?.time ?? 1 }
      : undefined,
  }))
  return { ...s, powerUpsEnabled: enabled, players }
}

export function setQuestionLimit(s: BlitzState, n: number): BlitzState {
  return { ...s, questionLimit: Math.max(0, Math.min(100, n)) }
}

/** Player activates a power-up during question (or before answer). */
export function usePowerUp(s: BlitzState, playerId: string, power: BlitzPowerUp): BlitzState {
  if (s.phase !== 'question' || !s.powerUpsEnabled) return s
  const q = s.questions[s.qIndex]
  if (!q) return s
  let usedTime = false
  const players = s.players.map((p) => {
    if (p.id !== playerId) return p
    const left = p.powers?.[power] ?? 0
    if (left < 1) return p
    if (power === 'double') {
      if (p.activeDouble) return p
      return { ...p, activeDouble: true, powers: { ...p.powers, double: left - 1 } }
    }
    if (power === 'fifty') {
      if (p.hiddenChoices?.length) return p
      const wrong = [0, 1, 2, 3].filter((i) => i !== q.correct)
      const shuffled = [...wrong].sort(() => Math.random() - 0.5).slice(0, 2)
      return { ...p, hiddenChoices: shuffled, powers: { ...p.powers, fifty: left - 1 } }
    }
    if (power === 'time') {
      usedTime = true
      return { ...p, powers: { ...p.powers, time: left - 1 } }
    }
    return p
  })
  let questionStartedAt = s.questionStartedAt
  if (usedTime && questionStartedAt) {
    questionStartedAt = questionStartedAt + 5000
  }
  return { ...s, players, questionStartedAt }
}

export const NICK_SUGGESTIONS = [
  'Välk',
  'Tarkpea',
  'QuizKing',
  'Naljahammas',
  'Kiirusiil',
  'Peotäht',
  'Mõistatus',
  'Buzzer',
  'Kuldne',
  'Streak',
]


export function setPlayerReady(s: BlitzState, playerId: string, ready: boolean): BlitzState {
  return {
    ...s,
    players: s.players.map((p) => (p.id === playerId ? { ...p, ready } : p)),
  }
}

export function setRequireReady(s: BlitzState, requireReady: boolean): BlitzState {
  return { ...s, requireReady }
}

export function refillPowerUps(s: BlitzState): BlitzState {
  if (s.powerUpsEnabled === false) return s
  return {
    ...s,
    players: s.players.map((p) => ({
      ...p,
      powers: { fifty: 1, double: 1, time: 1 },
      activeDouble: false,
      hiddenChoices: undefined,
    })),
  }
}

export function allPlayersReady(s: BlitzState): boolean {
  return s.players.length > 0 && s.players.every((p) => p.ready)
}
<<<<<<< HEAD
=======


export function setCaptain(s: BlitzState, team: BlitzTeamId, playerId: string | undefined): BlitzState {
  const captains = { ...(s.captains || {}) }
  if (!playerId) delete captains[team]
  else captains[team] = playerId
  return { ...s, captains }
}
>>>>>>> 624f4b6e868454df0bdd146dd20f4ab9b21c8111
