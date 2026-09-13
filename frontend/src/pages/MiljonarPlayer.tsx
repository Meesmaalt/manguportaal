import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import type { MiljonarState } from '@/games/miljonar/types'
import MiljonarPlayerComponent from '@/games/miljonar/MiljonarPlayer'
import { Loader2, Wifi, WifiOff } from 'lucide-react'

export default function MiljonarPlayer() {
  const { code: codeParam } = useParams<{ code: string }>()
  const code = (codeParam || '').toUpperCase()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [state, setState] = useState<MiljonarState | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [conn, setConn] = useState<'ok' | 'off'>('ok')

  useEffect(() => {
    if (!code) {
      setError('Mängukood puudub')
      setLoading(false)
      return
    }

    let unsub: (() => void) | null = null
    let pollId: number | null = null

    async function connect() {
      setLoading(true)
      setError('')

      try {
        const list = await pb.collection('game_sessions').getList<GameSession>(1, 1, {
          filter: `code = "${code}"`,
        })

        if (list.items.length > 0) {
          const rec = list.items[0]
          setSessionId(rec.id)
          setState(rec.state as MiljonarState)
          setIsLocal(false)
          setConn('ok')

          unsub = await pb.collection('game_sessions').subscribe<GameSession>(rec.id, (e) => {
            if (e.action === 'update') {
              setState(e.record.state as MiljonarState)
              setConn('ok')
            }
          })
        } else {
          throw new Error('Cloud session not found')
        }
      } catch {
        // LocalStorage fallback
        let found = false
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key?.startsWith('session_')) continue
          try {
            const data = JSON.parse(localStorage.getItem(key)!)
            if (data.code?.toUpperCase() === code) {
              setSessionId(key.replace('session_', ''))
              setState(data as MiljonarState)
              setIsLocal(true)
              found = true
              setConn('ok')

              pollId = window.setInterval(() => {
                const raw = localStorage.getItem(key!)
                if (raw) {
                  setState(JSON.parse(raw))
                }
              }, 600)

              unsub = () => {
                if (pollId) clearInterval(pollId)
              }
              break
            }
          } catch {}
        }

        if (!found) {
          setError('Mängu ei leitud selle koodiga. Kontrolli koodi või palu saatejuhil ekraani näidata.')
          setConn('off')
        }
      } finally {
        setLoading(false)
      }
    }

    connect()

    return () => {
      if (unsub) unsub()
      if (pollId) clearInterval(pollId)
    }
  }, [code])

  async function updateState(
    partialOrFn: Partial<MiljonarState> | ((prev: MiljonarState) => MiljonarState)
  ) {
    if (!state) return

    const nextState = typeof partialOrFn === 'function' ? partialOrFn(state) : { ...state, ...partialOrFn }
    setState(nextState)

    if (isLocal && sessionId) {
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(nextState))
    } else if (sessionId) {
      try {
        await pb.collection('game_sessions').update(sessionId, { state: nextState })
      } catch (err) {
        console.error('Failed to sync audience vote:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030717] flex flex-col items-center justify-center text-gold p-4">
        <Loader2 className="animate-spin mb-3 text-gold" size={40} />
        <p className="font-display tracking-widest uppercase text-sm">Ühendan stuudioga...</p>
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-[#030717] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="text-4xl mb-3">💰</div>
        <h2 className="text-xl font-bold font-display text-amber-400 mb-2">Miljonimäng</h2>
        <p className="text-white/70 max-w-xs text-sm mb-6">{error || 'Mänguseanssi ei leitud'}</p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-blue-900/60 border border-blue-500/40 text-blue-200 text-sm font-semibold"
        >
          Tagasi avalehele
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#030717]">
      <div className="fixed top-2 right-2 z-50">
        {conn === 'ok' ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400/80 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <Wifi size={10} /> Live
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-rose-400/80 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
            <WifiOff size={10} /> Offline
          </span>
        )}
      </div>
      <MiljonarPlayerComponent state={state} update={updateState} sessionCode={code} />
    </div>
  )
}
