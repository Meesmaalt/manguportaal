import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import KuldvillakBoard from '@/games/kuldvillak/KuldvillakBoard'
import RoosidesodaHost from '@/games/roosidesoda/RoosidesodaHost'
import SonaseletusGame from '@/games/sonaseletus/SonaseletusGame'
import MaEiOleKunagiGame from '@/games/ma-ei-ole-kunagi/MaEiOleKunagiGame'
import ViimanePustiGame from '@/games/viimane-pusti/ViimanePustiGame'
import TodeVoiTeguGame from '@/games/tode-voi-tegu/TodeVoiTeguGame'
import KinnistuDealTv from '@/games/kinnistu-deal/KinnistuDealTv'
import BlitzTv from '@/games/blitz/BlitzTv'
import MiljonarTv from '@/games/miljonar/MiljonarTv'
import GameShowFrame from '@/components/GameShowFrame'
import DisplayCornerTools from '@/components/DisplayCornerTools'
import ConnectionChip from '@/components/ConnectionChip'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import type { KuldvillakState } from '@/games/kuldvillak/types'
import type { RoosidesodaState } from '@/games/roosidesoda/types'
import { useI18n } from '@/i18n/I18nContext'
import { applyTheme, getStoredTheme, type ThemeId } from '@/lib/themes'
import { getGameSettings, getFontCssFamily } from '@/lib/gameSettings'
import { PublicGuideOverlay } from '@/components/GameHelpModal'
import { SessionBgLayer } from '@/components/ThemeStudio'
import type { TranslationKey } from '@/i18n/translations'
import QuickJoinCard from '@/components/QuickJoinCard'
import { Tv, Info, X } from 'lucide-react'

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

  // Follow host color theme when present in session state
  useEffect(() => {
    const id = state?.themeId as ThemeId | undefined
    if (id) applyTheme(id)
  }, [state?.themeId])

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
                  data.game_type ||
                  (data.contestant || (data.questions && data.lifelines) ? 'miljonar' : undefined) ||
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

  const [showTvHint, setShowTvHint] = useState(true)

  useEffect(() => {
    if (!code) return
    const timer = setTimeout(() => setShowTvHint(false), 7000)
    return () => clearTimeout(timer)
  }, [code])

  if (!code) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 py-12">
        <div className="w-full max-w-md">
          <QuickJoinCard defaultTab="tv" />
        </div>
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

  const activeFont =
    state?.displayFont ||
    state?.gameSettings?.displayFont ||
    getGameSettings(session.game_type).displayFont ||
    'cinzel'
  const activeFontFamily = getFontCssFamily(activeFont)

  return (
    <div
      className="relative"
      data-display-font={activeFont}
      style={
        {
          '--font-display': activeFontFamily,
          '--display-font-family': activeFontFamily,
        } as React.CSSProperties
      }
    >
      <DisplayCornerTools />
      
      {/* Auto-fading TV connection & fullscreen reminder */}
      {showTvHint && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-black/85 backdrop-blur-md border border-gold/40 text-white rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 text-xs sm:text-sm transition-opacity">
          <div className="flex items-center gap-2 text-gold">
            <Tv size={16} />
            <span className="font-bold uppercase tracking-wider">Suur ekraan</span>
          </div>
          <span className="text-white/40">|</span>
          <span className="text-white/80">
            Mängukood: <strong className="text-gold font-mono tracking-widest">{session.code || code}</strong>
          </span>
          <span className="text-white/40 hidden sm:inline">|</span>
          <span className="text-white/60 text-xs hidden sm:inline">Vajuta <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-gold font-mono text-[11px]">F11</kbd> täisekraaniks</span>
          <button
            type="button"
            onClick={() => setShowTvHint(false)}
            className="text-white/40 hover:text-white ml-1 p-0.5 rounded-full hover:bg-white/10"
            aria-label="Sulge teavitus"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="fixed top-3 right-3 z-[60] flex flex-col items-end gap-2">
        <ConnectionChip connection={connection} onRetry={() => window.location.reload()} />
        {hostStale && (
          <div className="text-[10px] uppercase tracking-wider text-amber-200/90 bg-black/50 border border-amber-500/40 rounded-full px-3 py-1">
            {t('waitingHost')}
          </div>
        )}
      </div>

      {state.publicGuide && (
        <PublicGuideOverlay
          gameType={gt}
          onClose={() => setState((prev: any) => ({ ...prev, publicGuide: false }))}
        />
      )}
      <SessionBgLayer media={state.bgMedia} display />

      <div
        className="game-tv-scale-wrapper w-full min-h-screen"
        style={{ zoom: 'var(--display-scale, 1)' }}
      >
        {gt === 'kuldvillak' && (
          <KuldvillakBoard state={state as KuldvillakState} update={noop} isHost={false} sessionCode={session.code || state.code} />
        )}
        {gt === 'roosidesoda' && (
          <RoosidesodaHost state={state as RoosidesodaState} update={noop} isHost={false} sessionCode={session.code || state.code} />
        )}
        {gt === 'blitz' && (
          <BlitzTv state={state as any} sessionCode={session.code || state.code} />
        )}
        {gt === 'kinnistu_deal' && (
          <KinnistuDealTv state={state as any} sessionCode={session.code || state.code} />
        )}
        {gt === 'miljonar' && (
          <MiljonarTv state={state as any} sessionCode={session.code || state.code} />
        )}
        {gt !== 'kuldvillak' && gt !== 'roosidesoda' && gt !== 'kinnistu_deal' && gt !== 'blitz' && gt !== 'miljonar' && (
          <GameShowFrame display title={title} hasSessionBg={!!state.bgMedia?.dataUrl}>
            {gt === 'sonaseletus' && <SonaseletusGame state={state} update={noop} isHost={false} />}
            {gt === 'ma_ei_ole_kunagi' && (
              <MaEiOleKunagiGame state={state} update={noop} isHost={false} />
            )}
            {gt === 'viimane_pusti' && <ViimanePustiGame state={state} update={noop} isHost={false} />}
            {gt === 'tode_voi_tegu' && <TodeVoiTeguGame state={state} update={noop} isHost={false} />}
          </GameShowFrame>
        )}
      </div>
    </div>
  )
}
