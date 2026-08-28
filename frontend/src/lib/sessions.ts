import { pb, generateCode, type GameSession, formatPbError, ensurePbUrl, getAuthUserId } from '@/lib/pocketbase'

export type StartSessionResult = {
  sessionId: string
  code: string
  isLocal: boolean
}

export class CloudSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudSessionError'
  }
}

/**
 * Create a PocketBase session so TV + buzzer work across devices.
 * By default does NOT fall back to localStorage (party multi-device).
 * Pass allowLocal: true only for explicit offline emergency.
 */
export async function createGameSession(opts: {
  gameType: string
  packId?: string | null
  hostId?: string | null
  state: Record<string, unknown>
  allowLocal?: boolean
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
  } catch (e: any) {
    if (opts.allowLocal) {
      const localId = `local-${Date.now()}`
      localStorage.setItem(`session_${localId}`, JSON.stringify(state))
      return { sessionId: localId, code, isLocal: true }
    }
    throw new CloudSessionError(formatPbError(e))
  }
}

/** Mark session finished (best-effort). */
export async function endGameSession(sessionId: string) {
  if (sessionId.startsWith('local-')) {
    localStorage.removeItem(`session_${sessionId}`)
    return
  }
  try {
    await pb.collection('game_sessions').update(sessionId, { status: 'finished' })
  } catch {
    try {
      await pb.collection('game_sessions').delete(sessionId)
    } catch {}
  }
}

/**
 * First-writer-wins buzz. Re-fetches before write to reduce races.
 */
export async function tryClaimBuzz(opts: {
  sessionId: string
  isLocal: boolean
  name: string
}): Promise<{ ok: true } | { ok: false; reason: 'disabled' | 'taken' | 'error'; by?: string }> {
  const payload = { name: opts.name.trim(), at: Date.now() }
  try {
    if (opts.isLocal) {
      const key = `session_${opts.sessionId}`
      const raw = localStorage.getItem(key)
      if (!raw) return { ok: false, reason: 'error' }
      const data = JSON.parse(raw)
      if (data.buzzEnabled === false) return { ok: false, reason: 'disabled' }
      if (data.buzz) return { ok: false, reason: 'taken', by: data.buzz.name }
      data.buzz = payload
      localStorage.setItem(key, JSON.stringify(data))
      return { ok: true }
    }
    const rec = await pb.collection('game_sessions').getOne(opts.sessionId)
    const st = { ...(rec.state as any) }
    if (st.buzzEnabled === false) return { ok: false, reason: 'disabled' }
    if (st.buzz) return { ok: false, reason: 'taken', by: st.buzz.name }
    st.buzz = payload
    // second read to reduce double-claim window
    const rec2 = await pb.collection('game_sessions').getOne(opts.sessionId)
    const st2 = { ...(rec2.state as any) }
    if (st2.buzz) return { ok: false, reason: 'taken', by: st2.buzz.name }
    st2.buzz = payload
    await pb.collection('game_sessions').update(opts.sessionId, { state: st2 })
    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
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

export async function checkPbHealth(): Promise<boolean> {
  try {
    await pb.health.check()
    return true
  } catch {
    try {
      // older pb
      await fetch(`${pb.baseUrl}/api/health`)
      return true
    } catch {
      return false
    }
  }
}


/** Create a pack owned by the currently authenticated *users* record. */
export async function createOwnedPack(input: {
  name: string
  description?: string
  game_type: string
  data: unknown
}) {
  ensurePbUrl()
  if (!pb.authStore.token) {
    throw new Error('Pole sisse logitud (lehe konto). Logi sisse /login kaudu — PocketBase admin (/_/) ei loe.')
  }
  try {
    await pb.collection('users').authRefresh()
  } catch (e: any) {
    // Soft-fail refresh: if token still present, try create anyway
    if (!pb.authStore.token) {
      pb.authStore.clear()
      throw new Error('Sessioon aegus. Logi uuesti sisse.')
    }
    console.warn('[ohtu] authRefresh failed, continuing with existing token', e)
  }
  const uid = getAuthUserId()
  if (!uid) {
    throw new Error('Kasutaja ID puudub. Logi välja ja uuesti sisse.')
  }
  const body: Record<string, unknown> = {
    name: input.name.slice(0, 120),
    description: (input.description || '').slice(0, 500),
    game_type: input.game_type,
    data: input.data,
    is_official: false,
    is_public: false,
    owner: uid,
  }
  try {
    return await pb.collection('packs').create(body)
  } catch (e: any) {
    if (e?.status === 400) {
      try {
        const { owner: _o, ...rest } = body
        return await pb.collection('packs').create(rest)
      } catch (e2: any) {
        throw new Error(formatPbError(e2))
      }
    }
    if (e?.status === 401 || e?.status === 403) {
      throw new Error('Õigused puuduvad. Logi uuesti sisse lehe kontoga (/login).')
    }
    throw new Error(formatPbError(e))
  }
}
