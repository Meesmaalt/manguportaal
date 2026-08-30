import { useEffect, useState, useCallback, useRef } from 'react'
import { pb, type GameSession } from '@/lib/pocketbase'

export type ConnectionStatus = 'live' | 'local' | 'reconnecting' | 'offline'

/**
 * Syncs game state with PocketBase (or localStorage fallback for local-* sessions).
 * Exposes connection status for Room mode UI.
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

  stateRef.current = state

  const markSync = useCallback((mode: ConnectionStatus) => {
    setLastSync(Date.now())
    setConnection(mode)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
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
      // Same-tab poll for display opened as second window on same origin rarely needed;
      // cross-device needs cloud. Still poll lightly for hostBeat visibility.
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

  // Host heartbeat every 4s so display can show Live (does not need to be in React state deps)
  useEffect(() => {
    if (loading) return
    const id = window.setInterval(() => {
      const current = stateRef.current
      if (!current) return
      const next = { ...current, hostBeat: Date.now() } as T
      if (isLocal) {
        localStorage.setItem(`session_${sessionId}`, JSON.stringify(next))
        // don't setState every beat on host — avoids re-render spam; display polls storage
        markSync('local')
      } else {
        pb.collection('game_sessions')
          .update(sessionId, { state: next })
          .then(() => markSync('live'))
          .catch(() => setConnection('reconnecting'))
      }
    }, 4000)
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

        if (isLocal) {
          localStorage.setItem(`session_${sessionId}`, JSON.stringify(withBeat))
          markSync('local')
        } else {
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
        }
        return withBeat
      })
    },
    [sessionId, isLocal, markSync]
  )

  return { session, state, update, loading, error, connection, lastSync, reload: load }
}
