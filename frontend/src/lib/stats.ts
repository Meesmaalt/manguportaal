const KEY = 'ohtu-game-stats-v1'

export type GameStats = {
  plays: Record<string, number>
  lastWinners: { game: string; name?: string; at: number }[]
  sessionStarts: Record<string, number>
}

function load(): GameStats {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      plays: raw.plays || {},
      lastWinners: raw.lastWinners || [],
      sessionStarts: raw.sessionStarts || {},
    }
  } catch {
    return { plays: {}, lastWinners: [], sessionStarts: {} }
  }
}

function save(s: GameStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
}

export function trackSessionStart(game: string) {
  const s = load()
  s.sessionStarts[game] = (s.sessionStarts[game] || 0) + 1
  save(s)
}

export function recordGameEnd(game: string, winnerName?: string) {
  const s = load()
  s.plays[game] = (s.plays[game] || 0) + 1
  if (winnerName) {
    s.lastWinners = [{ game, name: winnerName, at: Date.now() }, ...s.lastWinners].slice(0, 12)
  }
  save(s)
}

export function getStats(): GameStats {
  return load()
}

export function shareSessionLinks(
  code: string,
  baseUrl: string,
  playerLinks?: { name: string; url: string }[]
) {
  const lines = [`Õhtu mängud · kood ${code}`, `TV: ${baseUrl}/ekraan/${code}`]
  if (playerLinks?.length) {
    lines.push('Mängijad:')
    playerLinks.forEach((p) => lines.push(`- ${p.name}: ${p.url}`))
  }
  return lines.join('\n')
}
