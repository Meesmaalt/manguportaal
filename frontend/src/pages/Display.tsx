import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import KuldvillakBoard from '@/games/kuldvillak/KuldvillakBoard'
import RoosidesodaHost from '@/games/roosidesoda/RoosidesodaHost'
import SonaseletusGame from '@/games/sonaseletus/SonaseletusGame'
import MaEiOleKunagiGame from '@/games/ma-ei-ole-kunagi/MaEiOleKunagiGame'
import ViimanePustiGame from '@/games/viimane-pusti/ViimanePustiGame'
import TodeVoiTeguGame from '@/games/tode-voi-tegu/TodeVoiTeguGame'
import GameShowFrame from '@/components/GameShowFrame'
import ConnectionChip from '@/components/ConnectionChip'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import type { KuldvillakState } from '@/games/kuldvillak/types'
import type { RoosidesodaState } from '@/games/roosidesoda/types'
import { useI18n } from '@/i18n/I18nContext'
import { applyTheme, getStoredTheme } from '@/lib/themes'
import type { TranslationKey } from '@/i18n/translations'

export default function Display() {
  const { code: codeParam } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  useEffect(() => { applyTheme(getStoredTheme()) }, [])
  const [codeInput, setCodeInput] = useState('')
  const [session, setSession] = useState<GameSession | null>(null)
  const [state, setState] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(codeParam))
  const [connection, setConnection] = useState<ConnectionStatus>('offline')
  const [hostStale, setHostStale] = useState(false)
  const lastBeat = useRef(0)

  const code = (codeParam || '').toUpperCase()

  useEffect(() => {
    if (!code) {
      setLoading(false)
      return
    }
    let unsub: (() => void) | null = null
    let poll: number | null = null

    async function find() {
      setLoading(true)
      setError('')
      try {
        const list = await pb.collection('game_sessions').getList<GameSession>(1, 1, {
          filter: `code = "${code}"`,
        })
        if (list.items.length === 0) throw new Error('not found')
        const rec = list.items[0]
        setSession(rec)
        setState(rec.state)
        setConnection('live')
        unsub = await pb.collection('game_sessions').subscribe<GameSession>(rec.id, (e) => {
          if (e.action === 'update') {
            setSession(e.record)
            setState(e.record.state)
            setConnection('live')
            lastBeat.current = Date.now()
          }
        })
      } catch {
        // local fallback
        let found = false
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key?.startsWith('session_')) continue
          try {
            const data = JSON.parse(localStorage.getItem(key)!)
            if (data.code?.toUpperCase() === code) {
              setState(data)
              setSession({
                id: key.replace('session_', ''),
                code: data.code,
                game_type:
                  (data.packData?.categories && 'kuldvillak') ||
                  (data.packData?.rounds && 'roosidesoda') ||
                  (data.packData?.words && 'sonaseletus') ||
                  (data.packData?.truths && 'tode_voi_tegu') ||
                  (data.packData?.startingLives && 'viimane_pusti') ||
                  (data.packData?.statements && 'ma_ei_ole_kunagi') ||
                  'kuldvillak',
                pack: '',
                host: '',
                state: data,
                status: 'playing',
                created: '',
                updated: '',
              })
              setConnection('local')
              found = true
              poll = window.setInterval(() => {
                const raw = localStorage.getItem(key!)
                if (!raw) return
                const parsed = JSON.parse(raw)
                setState(parsed)
                if (parsed.hostBeat && parsed.hostBeat !== lastBeat.current) {
                  lastBeat.current = parsed.hostBeat
                  setConnection('local')
                }
              }, 500)
              unsub = () => {
                if (poll) clearInterval(poll)
              }
              break
            }
          } catch {}
        }
        if (!found) {
          setError(t('errorSession'))
          setConnection('offline')
        }
      } finally {
        setLoading(false)
      }
    }

    find()
    return () => {
      unsub?.()
      if (poll) clearInterval(poll)
    }
  }, [code, t])

  useEffect(() => {
    if (!state) return
    const tick = () => {
      const beat = (state as any).hostBeat || 0
      if (beat) lastBeat.current = Math.max(lastBeat.current, beat)
      setHostStale(lastBeat.current > 0 && Date.now() - lastBeat.current > 12000)
    }
    tick()
    const id = window.setInterval(tick, 2000)
    return () => clearInterval(id)
  }, [state])

  function joinWithCode(e: React.FormEvent) {
    e.preventDefault()
    const c = codeInput.trim().toUpperCase()
    if (c.length >= 4) navigate(`/ekraan/${c}`)
  }

  if (!code) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 gap-6">
        <h1 className="font-display text-4xl text-gold font-black">{t('tvJoinTitle')}</h1>
        <p className="text-white/60 text-center max-w-md">{t('tvEnterCodeHint')}</p>
        <form onSubmit={joinWithCode} className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <input
            className="input-field text-center font-display text-2xl tracking-[0.25em] uppercase"
            placeholder="ABC123"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            maxLength={10}
            autoFocus
          />
          <button type="submit" className="btn-gold">
            {t('tvConnect')}
          </button>
        </form>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-3">
        <div className="text-gold font-display text-3xl animate-pulse">{t('connecting')}</div>
        <ConnectionChip connection="reconnecting" />
      </div>
    )
  }

  if (error || !state || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4 px-4">
        <div className="text-accent-red text-xl text-center">{error || t('errorSession')}</div>
        <ConnectionChip connection="offline" />
        <button type="button" className="btn-outline" onClick={() => navigate('/ekraan')}>
          {t('tvEnterCode')}
        </button>
      </div>
    )
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks — runs only after session loaded in practice; use effect instead
  const gt = session.game_type
  const noop = () => {}
  const title = t(('game_' + gt) as TranslationKey).toUpperCase()

  return (
    <div className="relative">
      <div className="fixed top-3 right-3 z-[60] flex flex-col items-end gap-2">
        <ConnectionChip connection={connection} />
        {hostStale && (
          <div className="text-[10px] uppercase tracking-wider text-amber-200/90 bg-black/50 border border-amber-500/40 rounded-full px-3 py-1">
            {t('waitingHost')}
          </div>
        )}
      </div>

      {gt === 'kuldvillak' && (
        <KuldvillakBoard state={state as KuldvillakState} update={noop} isHost={false} sessionCode={session.code || state.code} />
      )}
      {gt === 'roosidesoda' && (
        <RoosidesodaHost state={state as RoosidesodaState} update={noop} isHost={false} />
      )}
      {gt !== 'kuldvillak' && gt !== 'roosidesoda' && (
        <GameShowFrame display title={title}>
          {gt === 'sonaseletus' && <SonaseletusGame state={state} update={noop} isHost={false} />}
          {gt === 'ma_ei_ole_kunagi' && (
            <MaEiOleKunagiGame state={state} update={noop} isHost={false} />
          )}
          {gt === 'viimane_pusti' && <ViimanePustiGame state={state} update={noop} isHost={false} />}
          {gt === 'tode_voi_tegu' && <TodeVoiTeguGame state={state} update={noop} isHost={false} />}
        </GameShowFrame>
      )}
    </div>
  )
}
