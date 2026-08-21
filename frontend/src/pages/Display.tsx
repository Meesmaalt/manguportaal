import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import KuldvillakBoard from '@/games/kuldvillak/KuldvillakBoard'
import RoosidesodaHost from '@/games/roosidesoda/RoosidesodaHost'
import type { KuldvillakState } from '@/games/kuldvillak/types'
import type { RoosidesodaState } from '@/games/roosidesoda/types'

/**
 * Full-screen TV / secondary display.
 * Looks up session by code and shows read-only (or synced) view.
 */
export default function Display() {
  const { code } = useParams<{ code: string }>()
  const [session, setSession] = useState<GameSession | null>(null)
  const [state, setState] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return

    let unsub: (() => void) | null = null

    async function find() {
      setLoading(true)
      try {
        // Try PocketBase
        const list = await pb.collection('game_sessions').getList<GameSession>(1, 1, {
          filter: `code = "${code!.toUpperCase()}"`,
        })
        if (list.items.length === 0) throw new Error('Sessiooni ei leitud')
        const rec = list.items[0]
        setSession(rec)
        setState(rec.state)

        unsub = await pb.collection('game_sessions').subscribe<GameSession>(rec.id, (e) => {
          if (e.action === 'update') {
            setSession(e.record)
            setState(e.record.state)
          }
        })
      } catch (e: any) {
        // Fallback: scan localStorage for matching code
        let found = false
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith('session_')) {
            try {
              const data = JSON.parse(localStorage.getItem(key)!)
              if (data.code?.toUpperCase() === code!.toUpperCase()) {
                setState(data)
                setSession({
                  id: key.replace('session_', ''),
                  code: data.code,
                  game_type: data.packData?.categories ? 'kuldvillak' : 'roosidesoda',
                  pack: '',
                  host: '',
                  state: data,
                  status: 'playing',
                  created: '',
                  updated: '',
                })
                found = true
                // Poll localStorage
                const interval = setInterval(() => {
                  const raw = localStorage.getItem(key!)
                  if (raw) setState(JSON.parse(raw))
                }, 500)
                unsub = () => clearInterval(interval)
                break
              }
            } catch {}
          }
        }
        if (!found) setError(e.message || 'Sessiooni ei leitud. Kontrolli koodi.')
      } finally {
        setLoading(false)
      }
    }

    find()
    return () => {
      unsub?.()
    }
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-gold font-display text-3xl animate-pulse">Ühendan...</div>
      </div>
    )
  }

  if (error || !state || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <div className="text-accent-red text-xl">{error || 'Viga'}</div>
        <p className="text-white/40">Kood: {code}</p>
      </div>
    )
  }

  const gameType = session.game_type

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="text-center mb-6">
        <h1 className="font-display text-4xl text-gold font-black tracking-wider">ÕHTU</h1>
      </div>

      {gameType === 'kuldvillak' ? (
        <KuldvillakBoard
          state={state as KuldvillakState}
          update={() => {}}
          isHost={false}
          sessionCode={session.code}
        />
      ) : (
        <RoosidesodaHost
          state={state as RoosidesodaState}
          update={() => {}}
          isHost={false}
          sessionCode={session.code}
        />
      )}
    </div>
  )
}
