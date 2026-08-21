import { useEffect, useState, useCallback, useRef } from 'react'
import { pb, type GameSession } from '@/lib/pocketbase'

/**
 * Syncs game state with PocketBase (or localStorage fallback for local-* sessions).
 * Realtime subscription when possible.
 */
export function useGameSession<T extends Record<string, unknown>>(sessionId: string) {
  const [session, setSession] = useState<GameSession | null>(null)
  const [state, setState] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isLocal = sessionId.startsWith('local-')
  const unsubRef = useRef<(() => void) | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isLocal) {
        const raw = localStorage.getItem(`session_${sessionId}`)
        if (!raw) throw new Error('Lokaalne sessioon puudub')
        const parsed = JSON.parse(raw) as T & { code?: string }
        setState(parsed)
        setSession({
          id: sessionId,
          code: parsed.code || 'LOCAL',
          game_type: 'kuldvillak',
          pack: '',
          host: '',
          state: parsed,
          status: 'playing',
          created: '',
          updated: '',
        })
      } else {
        const rec = await pb.collection('game_sessions').getOne<GameSession>(sessionId)
        setSession(rec)
        setState(rec.state as T)
      }
    } catch (e: any) {
      setError(e.message || 'Sessiooni laadimine ebaõnnestus')
    } finally {
      setLoading(false)
    }
  }, [sessionId, isLocal])

  useEffect(() => {
    load()

    if (!isLocal) {
      // Realtime
      pb.collection('game_sessions')
        .subscribe<GameSession>(sessionId, (e) => {
          if (e.action === 'update') {
            setSession(e.record)
            setState(e.record.state as T)
          }
        })
        .then((unsub) => {
          unsubRef.current = unsub
        })
        .catch(() => {})
    } else {
      // localStorage + storage event for multi-tab
      const onStorage = (ev: StorageEvent) => {
        if (ev.key === `session_${sessionId}` && ev.newValue) {
          setState(JSON.parse(ev.newValue))
        }
      }
      window.addEventListener('storage', onStorage)
      unsubRef.current = () => window.removeEventListener('storage', onStorage)
    }

    return () => {
      unsubRef.current?.()
      if (!isLocal) {
        pb.collection('game_sessions').unsubscribe(sessionId).catch(() => {})
      }
    }
  }, [sessionId, isLocal, load])

  const update = useCallback(
    async (partial: Partial<T> | ((prev: T) => T)) => {
      setState((prev) => {
        if (!prev) return prev
        const next = typeof partial === 'function' ? partial(prev) : { ...prev, ...partial }

        // Persist
        if (isLocal) {
          localStorage.setItem(`session_${sessionId}`, JSON.stringify(next))
          // Broadcast to other tabs via storage event is automatic
        } else {
          pb.collection('game_sessions')
            .update(sessionId, { state: next })
            .catch((e) => console.error('Update failed', e))
        }
        return next
      })
    },
    [sessionId, isLocal]
  )

  return { session, state, update, loading, error, reload: load }
}
