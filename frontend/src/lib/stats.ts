const KEY = 'ohtu_stats_v1'

export type AppStats = {
  sessionsStarted: number
  questionsResolved: number
  lastPlayedAt?: string
  byGame: Record<string, number>
}

function read(): AppStats {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { sessionsStarted: 0, questionsResolved: 0, byGame: {} }
}

function write(s: AppStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
}

export function getStats(): AppStats {
  return read()
}

export function trackSessionStart(gameType: string) {
  const s = read()
  s.sessionsStarted += 1
  s.byGame[gameType] = (s.byGame[gameType] || 0) + 1
  s.lastPlayedAt = new Date().toISOString()
  write(s)
}

export function trackQuestionResolved() {
  const s = read()
  s.questionsResolved += 1
  write(s)
}
