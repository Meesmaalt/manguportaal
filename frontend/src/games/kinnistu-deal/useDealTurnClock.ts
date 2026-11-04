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
    let stopped = false; let busy = false; let failures = 0
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
          let result: { changed: boolean; state: KinnistuDealState | null }
          try {
            result = await pb.send(`/api/kinnistu-deal/${sessionId}/tick`, { method: 'POST', requestKey: null })
          } catch (e: any) {
            if (e?.status !== 404) throw e
            // Serveri marsruut puudub (pb_hooks pole PocketBase'is): tee sama kontroll värskeima kirje peal brauseris.
            const record: any = await pb.collection('game_sessions').getOne(sessionId!, { requestKey: null })
            const latest = (typeof record.state === 'string' ? JSON.parse(record.state) : record.state) as KinnistuDealState
            const next = tickTurnEnd(latest)
            if (next !== latest) await pb.collection('game_sessions').update(sessionId!, { state: { ...next, hostBeat: Date.now() } }, { requestKey: null })
            result = { changed: next !== latest, state: next !== latest ? next : null }
          }
          if (!stopped && result.changed && result.state) receiveRef.current?.(result.state)
        }
        failures = 0
        if (!stopped) setError('')
      } catch {
        // Üksik tehinguviga (nt andmebaas hõivatud) ei ole veateate vääriline; teavita alles kolmanda järjestikuse rikke järel.
        failures += 1
        if (!stopped && failures >= 3) setError('Automaatne käigulõpp ei saanud serveriga ühendust. Võid käigu lõpetada nupuga.')
      } finally { busy = false }
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => { stopped = true; clearInterval(timer) }
  }, [enabled, due, sessionId])
  return error
}
