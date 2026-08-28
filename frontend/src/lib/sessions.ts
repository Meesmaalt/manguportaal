import { pb, generateCode, type GameSession } from '@/lib/pocketbase'

export type StartSessionResult = {
  sessionId: string
  code: string
  isLocal: boolean
}

/**
 * Prefer PocketBase so TV + buzzer work on other devices/networks.
 * Falls back to localStorage only if PB is unreachable.
 */
export async function createGameSession(opts: {
  gameType: string
  packId?: string | null
  hostId?: string | null
  state: Record<string, unknown>
}): Promise<StartSessionResult> {
  const code = (opts.state.code as string) || generateCode()
  const state = { ...opts.state, code }

  try {
    const body: Record<string, unknown> = {
      code,
      game_type: opts.gameType,
      state,
      status: 'playing',
    }
    if (opts.packId && !String(opts.packId).startsWith('local-')) {
      body.pack = opts.packId
    }
    if (opts.hostId) {
      body.host = opts.hostId
    }
    const session = await pb.collection('game_sessions').create<GameSession>(body)
    return { sessionId: session.id, code, isLocal: false }
  } catch (e) {
    console.warn('[ohtu] PB session create failed, using local', e)
    const localId = `local-${Date.now()}`
    localStorage.setItem(`session_${localId}`, JSON.stringify(state))
    return { sessionId: localId, code, isLocal: true }
  }
}

export function packExportPayload(pack: {
  name: string
  description?: string
  game_type: string
  data: unknown
}) {
  return {
    ohtuPackVersion: 1,
    exportedAt: new Date().toISOString(),
    name: pack.name,
    description: pack.description || '',
    game_type: pack.game_type,
    data: pack.data,
  }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportedPack(raw: unknown): {
  name: string
  description: string
  game_type: string
  data: unknown
} {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid JSON')
  const o = raw as Record<string, unknown>
  // accept both ohtu export and bare pack
  const name = String(o.name || '')
  const game_type = String(o.game_type || '')
  const data = o.data
  if (!name || !game_type || data === undefined) {
    throw new Error('Missing name, game_type or data')
  }
  return {
    name,
    description: String(o.description || ''),
    game_type,
    data,
  }
}
