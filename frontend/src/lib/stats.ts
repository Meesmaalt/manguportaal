
const KEY = 'ohtu-game-stats-v1'

export type GameStats = {
  plays: Record<string, number>
  lastWinners: { game: string; name?: string; at: number }[]
}

function load(): GameStats {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"plays":{},"lastWinners":[]}')
  } catch {
    return { plays: {}, lastWinners: [] }
  }
}

function save(s: GameStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
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

export function shareSessionLinks(code: string, baseUrl: string, playerLinks?: { name: string; url: string }[]) {
  const lines = [
    `Õhtu mängud · kood ${code}`,
    `TV: ${baseUrl}/ekraan/${code}`,
  ]
  if (playerLinks?.length) {
    lines.push('Mängijad:')
    playerLinks.forEach((p) => lines.push(`- ${p.name}: ${p.url}`))
  }
  return lines.join('\n')
}
