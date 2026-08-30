import { useEffect, useState, useCallback, useRef } from 'react'
import { pb, type GameSession } from '@/lib/pocketbase'

export type ConnectionStatus = 'live' | 'local' | 'reconnecting' | 'offline'

const LAST_SESSION_KEY = 'ohtu_last_session'

/** Remember host session for refresh recovery. */
export function rememberHostSession(opts: {
  sessionId: string
  code: string
  gameType: string
}) {
  try {
    localStorage.setItem(
      LAST_SESSION_KEY,
      JSON.stringify({ ...opts, at: Date.now() })
    )
  } catch {
    /* ignore */
  }
}

export function getRememberedHostSession(): {
  sessionId: string
  code: string
  gameType: string
  at: number
} | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p?.sessionId || !p?.code) return null
    // expire after 12h
    if (Date.now() - (p.at || 0) > 12 * 60 * 60 * 1000) return null
    return p
  } catch {
    return null
  }
}

export function clearRememberedHostSession() {
  try {
    localStorage.removeItem(LAST_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Syncs game state with PocketBase (or localStorage fallback for local-* sessions).
 * Heartbeat only patches hostBeat on the server copy (avoids stomping large fields with stale client state).
 */
export function useGameSession<T extends Record<string, unknown>>(sessionId: string) {
  const [session, setSession] = useState<GameSession | null>(null)
  const [state, setState] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connection, setConnection] = useState<ConnectionStatus>('offline')
  const [lastSync, setLastSync] = useState<number>(0)
  const isLocal = sessionId.startsWith('local-')
  const unsubRef = useRef<(() => void) | null>(null)
  const stateRef = useRef<T | null>(null)
  const beatRef = useRef<number>(0)
  const pushingRef = useRef(false)

  stateRef.current = state

  const markSync = useCallback((mode: ConnectionStatus) => {
    setLastSync(Date.now())
    setConnection(mode)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isLocal) {
        const raw = localStorage.getItem(`session_${sessionId}`)
        if (!raw) throw new Error('Local session missing')
        const parsed = JSON.parse(raw) as T & { code?: string }
        setState(parsed)
        setSession({
          id: sessionId,
          code: (parsed as any).code || 'LOCAL',
          game_type: (parsed as any).game_type || 'kuldvillak',
          pack: '',
          host: '',
          state: parsed,
          status: 'playing',
          created: '',
          updated: '',
        })
        markSync('local')
      } else {
        const rec = await pb.collection('game_sessions').getOne<GameSession>(sessionId)
        setSession(rec)
        setState(rec.state as T)
        if ((rec.state as any)?.code) {
          rememberHostSession({
            sessionId,
            code: String((rec.state as any).code),
            gameType: rec.game_type,
          })
        }
        markSync('live')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load session')
      setConnection('offline')
    } finally {
      setLoading(false)
    }
  }, [sessionId, isLocal, markSync])

  useEffect(() => {
    load()

    if (!isLocal) {
      setConnection('reconnecting')
      pb.collection('game_sessions')
        .subscribe<GameSession>(sessionId, (e) => {
          if (e.action === 'update') {
            // Don't overwrite host's optimistic state mid-push with echo
            if (pushingRef.current) {
              setSession(e.record)
              markSync('live')
              return
            }
            setSession(e.record)
            setState(e.record.state as T)
            markSync('live')
          }
        })
        .then((unsub) => {
          unsubRef.current = unsub
          markSync('live')
        })
        .catch(() => setConnection('reconnecting'))
    } else {
      const onStorage = (ev: StorageEvent) => {
        if (ev.key === `session_${sessionId}` && ev.newValue) {
          setState(JSON.parse(ev.newValue))
          markSync('local')
        }
      }
      window.addEventListener('storage', onStorage)
      const poll = window.setInterval(() => {
        const raw = localStorage.getItem(`session_${sessionId}`)
        if (!raw) return
        try {
          const parsed = JSON.parse(raw)
          const beat = parsed.hostBeat || 0
          if (beat && beat !== beatRef.current) {
            beatRef.current = beat
            setState(parsed)
            markSync('local')
          }
        } catch {}
      }, 1000)
      unsubRef.current = () => {
        window.removeEventListener('storage', onStorage)
        clearInterval(poll)
      }
      markSync('local')
    }

    return () => {
      unsubRef.current?.()
      if (!isLocal) {
        pb.collection('game_sessions').unsubscribe(sessionId).catch(() => {})
      }
    }
  }, [sessionId, isLocal, load, markSync])

  // Light heartbeat: merge hostBeat into *server* state so large fields aren't resent from a stale client
  useEffect(() => {
    if (loading) return
    const id = window.setInterval(async () => {
      const current = stateRef.current
      if (!current) return
      const beat = Date.now()
      beatRef.current = beat

      if (isLocal) {
        const next = { ...current, hostBeat: beat } as T
        localStorage.setItem(`session_${sessionId}`, JSON.stringify(next))
        markSync('local')
        return
      }

      try {
        const rec = await pb.collection('game_sessions').getOne<GameSession>(sessionId)
        const serverState = { ...(rec.state as Record<string, unknown>), hostBeat: beat }
        await pb.collection('game_sessions').update(sessionId, { state: serverState })
        markSync('live')
      } catch {
        setConnection('reconnecting')
      }
    }, 8000)
    return () => clearInterval(id)
  }, [loading, sessionId, isLocal, markSync])

  const update = useCallback(
    (partial: Partial<T> | ((prev: T) => T)) => {
      setState((prev) => {
        if (!prev) return prev
        const next =
          typeof partial === 'function'
            ? (partial as (p: T) => T)(prev)
            : ({ ...prev, ...partial } as T)
        const withBeat = { ...next, hostBeat: Date.now() } as T
        stateRef.current = withBeat

        if (isLocal) {
          localStorage.setItem(`session_${sessionId}`, JSON.stringify(withBeat))
          markSync('local')
        } else {
          pushingRef.current = true
          pb.collection('game_sessions')
            .update(sessionId, { state: withBeat })
            .then((rec) => {
              setSession(rec as GameSession)
              markSync('live')
            })
            .catch((err) => {
              console.warn('[ohtu] session update failed', err)
              setConnection('reconnecting')
            })
            .finally(() => {
              // brief window to ignore echo
              window.setTimeout(() => {
                pushingRef.current = false
              }, 400)
            })
        }
        return withBeat
      })
    },
    [sessionId, isLocal, markSync]
  )

  const retry = useCallback(() => {
    setConnection('reconnecting')
    load()
  }, [load])

  return {
    session,
    state,
    update,
    loading,
    error,
    connection,
    lastSync,
    reload: load,
    retry,
  }
}
