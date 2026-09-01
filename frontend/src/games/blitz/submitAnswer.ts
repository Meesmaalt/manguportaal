import { pb, type GameSession } from '@/lib/pocketbase'
import type { BlitzChoice, BlitzState } from './types'
import { mergePlayerAnswer } from './logic'

/** Optimistic concurrency: re-read + merge-only answer, retry on conflict. */
export async function submitAnswerWithRetry(opts: {
  sessionId: string
  playerId: string
  choice: BlitzChoice
  isLocal?: boolean
  maxAttempts?: number
}): Promise<{ ok: true; state: BlitzState } | { ok: false; error: string }> {
  const max = opts.maxAttempts ?? 4
  const key = `session_${opts.sessionId}`

  for (let attempt = 0; attempt < max; attempt++) {
    try {
      if (opts.isLocal || opts.sessionId.startsWith('local') || localStorage.getItem(key) != null) {
        const raw = localStorage.getItem(key)
        if (!raw) return { ok: false, error: 'Sessioon puudub' }
        const server = JSON.parse(raw) as BlitzState
        const next = mergePlayerAnswer(server, opts.playerId, opts.choice)
        localStorage.setItem(key, JSON.stringify(next))
        return { ok: true, state: next }
      }

      const rec = await pb.collection('game_sessions').getOne<GameSession>(opts.sessionId)
      const server = rec.state as BlitzState
      if (server.phase !== 'question') {
        return { ok: false, error: 'Vastamine on suletud' }
      }
      if (server.answers?.[opts.playerId]) {
        return { ok: true, state: server } // already in
      }
      const next = mergePlayerAnswer(server, opts.playerId, opts.choice)
      // Preserve any answers that appeared between get and merge
      next.answers = { ...server.answers, ...next.answers }
      await pb.collection('game_sessions').update(opts.sessionId, { state: next })
      return { ok: true, state: next }
    } catch (e: any) {
      if (attempt === max - 1) {
        return { ok: false, error: e?.message || 'Võrgu viga' }
      }
      await sleep(120 + attempt * 180 + Math.random() * 100)
    }
  }
  return { ok: false, error: 'Ei õnnestunud' }
}

export async function joinWithRetry(opts: {
  sessionId: string
  name: string
  existingId?: string
  isLocal?: boolean
  joinFn: (s: BlitzState, name: string, id?: string) => { state: BlitzState; playerId: string }
  maxAttempts?: number
}): Promise<{ ok: true; state: BlitzState; playerId: string } | { ok: false; error: string }> {
  const max = opts.maxAttempts ?? 4
  const key = `session_${opts.sessionId}`
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      if (opts.isLocal || opts.sessionId.startsWith('local') || localStorage.getItem(key) != null) {
        const raw = localStorage.getItem(key)
        if (!raw) return { ok: false, error: 'Sessioon puudub' }
        const server = JSON.parse(raw) as BlitzState
        const { state, playerId } = opts.joinFn(server, opts.name, opts.existingId)
        localStorage.setItem(key, JSON.stringify(state))
        return { ok: true, state, playerId }
      }
      const rec = await pb.collection('game_sessions').getOne<GameSession>(opts.sessionId)
      const server = rec.state as BlitzState
      const { state, playerId } = opts.joinFn(server, opts.name, opts.existingId)
      // Keep server players if concurrent joins
      const ids = new Set(state.players.map((p) => p.id))
      for (const p of server.players) {
        if (!ids.has(p.id)) state.players.push(p)
      }
      await pb.collection('game_sessions').update(opts.sessionId, { state })
      return { ok: true, state, playerId }
    } catch (e: any) {
      if (attempt === max - 1) return { ok: false, error: e?.message || 'Liitumine ebaõnnestus' }
      await sleep(100 + attempt * 150)
    }
  }
  return { ok: false, error: 'Liitumine ebaõnnestus' }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
