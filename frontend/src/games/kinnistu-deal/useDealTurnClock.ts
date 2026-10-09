import { useEffect, useRef, useState } from 'react'
import { pb } from '@/lib/pocketbase'
import { tickTurnEnd } from './logic'
import type { KinnistuDealState } from './types'

/** Both host and active player can drive the same idempotent clock. */
export function useDealTurnClock(state: KinnistuDealState | null, sessionId: string | null | undefined, receive?: (s: KinnistuDealState) => void, enabled = true) {
  const [error, setError] = useState('')
  const receiveRef = useRef(receive)
  receiveRef.current = receive
  const due = state?.phase === 'turn' && (state.turnEndAt != null || state.playsLeft <= 0 || !state.players[state.current]?.hand.length)
  useEffect(() => {
    if (!enabled || !due || !sessionId) return
    let stopped = false; let busy = false
    async function tick() {
      if (busy || stopped) return
      busy = true
      try {
        if (sessionId!.startsWith('local-')) {
          const key = `session_${sessionId}`; const raw = localStorage.getItem(key)
          if (!raw) return
          const latest = JSON.parse(raw) as KinnistuDealState
          const next = tickTurnEnd(latest)
          if (next !== latest) {
            localStorage.setItem(key, JSON.stringify({ ...next, hostBeat: Date.now() }))
            if (!stopped) receiveRef.current?.(next)
          }
        } else {
          const result = await pb.send(`/api/kinnistu-deal/${sessionId}/tick`, { method: 'POST', requestKey: null })
          if (!stopped && result.changed) receiveRef.current?.(result.state)
        }
        if (!stopped) setError('')
      } catch {
        if (!stopped) setError('Automaatne käigulõpp ei saanud serveriga ühendust. Võid käigu lõpetada nupuga.')
      } finally { busy = false }
    }
    tick()
    const timer = window.setInterval(tick, 500)
    return () => { stopped = true; clearInterval(timer) }
  }, [enabled, due, sessionId])
  return error
}
