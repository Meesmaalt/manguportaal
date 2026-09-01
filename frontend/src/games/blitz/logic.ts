import type { BlitzAnswer, BlitzChoice, BlitzPlayer, BlitzQuestion, BlitzState, BlitzTeamId } from './types'
import { calcPoints, makePlayerId, shuffleQuestions } from './types'

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
  const player: BlitzPlayer = { id, name: trimmed, score: 0, joinedAt: Date.now() }
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
  let questions = s.questions
  let qIndex = index ?? 0
  if ((index === 0 || s.phase === 'lobby') && s.shuffleOnStart && (s.phase === 'lobby' || index === 0)) {
    if (s.phase === 'lobby') questions = shuffleQuestions(s.questions)
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
  if (server.answers[playerId]) return server
  if (!server.players.some((p) => p.id === playerId)) return server
  const elapsed = Math.max(0, (clientNow || Date.now()) - server.questionStartedAt)
  const limit = server.secondsPerQuestion * 1000 + 800
  if (elapsed > limit) return server
  return {
    ...server,
    answers: {
      ...server.answers,
      [playerId]: { choice, at: elapsed },
    },
  }
}

export function submitAnswer(s: BlitzState, playerId: string, choice: BlitzChoice): BlitzState {
  return mergePlayerAnswer(s, playerId, choice)
}

export function reveal(s: BlitzState): BlitzState {
  if (s.phase !== 'question') return s
  const q = s.questions[s.qIndex]
  if (!q) return { ...s, phase: 'podium' }
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
  return {
    ...s,
    phase: 'reveal',
    players,
    lastRoundPoints,
    lastAnswerDist,
    revealStartedAt: Date.now(),
  }
}

export function nextQuestion(s: BlitzState): BlitzState {
  if (s.phase !== 'reveal' && s.phase !== 'lobby') return s
  const next = s.phase === 'lobby' ? 0 : s.qIndex + 1
  if (next >= s.questions.length) {
    return { ...s, phase: 'podium', answers: {}, lastRoundPoints: {}, revealStartedAt: undefined }
  }
  return startQuestion(s, next)
}

export function skipQuestion(s: BlitzState): BlitzState {
  if (s.phase !== 'question') return s
  // reveal with no extra points change beyond who already answered — same as reveal
  return reveal(s)
}

export function goPodium(s: BlitzState): BlitzState {
  return { ...s, phase: 'podium', answers: {}, lastRoundPoints: {}, revealStartedAt: undefined }
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
  for (const p of s.players) {
    if (p.team === 'a') a += p.score
    else if (p.team === 'b') b += p.score
  }
  return { a, b }
}
