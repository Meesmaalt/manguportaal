import type { GameType } from '@/lib/types'

const PL_KEY = 'ohtu-playlist'
const PL_IDX_KEY = 'ohtu-playlist-idx'

export function getPlaylist(): GameType[] {
  try {
    return JSON.parse(localStorage.getItem(PL_KEY) || '[]')
  } catch {
    return []
  }
}

export function savePlaylist(list: GameType[]) {
  localStorage.setItem(PL_KEY, JSON.stringify(list))
}

export function getPlaylistIndex(): number {
  try {
    return Math.max(0, parseInt(localStorage.getItem(PL_IDX_KEY) || '0', 10) || 0)
  } catch {
    return 0
  }
}

export function setPlaylistIndex(i: number) {
  localStorage.setItem(PL_IDX_KEY, String(i))
}

export function advancePlaylist(): GameType | null {
  const list = getPlaylist()
  if (!list.length) return null
  const next = getPlaylistIndex() + 1
  if (next >= list.length) {
    setPlaylistIndex(0)
    return null
  }
  setPlaylistIndex(next)
  return list[next]
}

export function playlistStatus(): {
  active: boolean
  current?: GameType
  next?: GameType
  remaining: number
} {
  const list = getPlaylist()
  if (!list.length) return { active: false, remaining: 0 }
  const i = getPlaylistIndex()
  return {
    active: true,
    current: list[i],
    next: i + 1 < list.length ? list[i + 1] : undefined,
    remaining: Math.max(0, list.length - i - 1),
  }
}

export function onGameEndedNavigate(): string | null {
  const next = advancePlaylist()
  if (!next) return null
  return `/play/${next}`
}
