import { useParams, Link, useNavigate } from 'react-router-dom'
import { useGameSession, clearRememberedHostSession } from '@/hooks/useGameSession'
import KuldvillakBoard from '@/games/kuldvillak/KuldvillakBoard'
import type { KuldvillakState } from '@/games/kuldvillak/types'
import { ArrowLeft, LogOut, HelpCircle, SkipForward } from 'lucide-react'
import { useState } from 'react'
import GameHelpModal from '@/components/GameHelpModal'
import ThemeStudio, { SessionBgLayer } from '@/components/ThemeStudio'
import { useI18n } from '@/i18n/I18nContext'
import { endGameSession } from '@/lib/sessions'
import { onGameEndedNavigate, playlistStatus } from '@/lib/playlist'
import type { TranslationKey } from '@/i18n/translations'

export default function PlayKuldvillak() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { session, state, update, loading, error, connection, lastSync, retry } =
    useGameSession<KuldvillakState>(sessionId!)
  const { t } = useI18n()
  const [helpOpen, setHelpOpen] = useState(false)
  const pl = playlistStatus()

  async function endSession() {
    const nextPath = onGameEndedNavigate()
    const msg =
      nextPath && pl.next
        ? `${t('endSessionConfirm')}\n\n${t('playlistNextWillBe')}: ${t(('game_' + pl.next) as TranslationKey)}`
        : t('endSessionConfirm')
    if (!confirm(msg)) return
    await endGameSession(sessionId!)
    clearRememberedHostSession()
    if (nextPath) navigate(nextPath)
    else navigate('/play/kuldvillak')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gold font-display text-2xl animate-pulse">{t('loadingGame')}</div>
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-accent-red mb-2">{error || t('errorSession')}</p>
        <button type="button" className="btn-outline text-sm" onClick={() => retry()}>
          {t('connRetry')}
        </button>
        <div>
          <Link to="/dashboard" className="text-gold text-sm">
            ← {t('packBack')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-1 px-2 pb-4">
      <div className="max-w-6xl mx-auto mb-1 flex items-center justify-between px-2 gap-2 flex-wrap">
        <Link
          to="/play/kuldvillak"
          className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm"
        >
          <ArrowLeft size={16} /> {t('newGame')}
        </Link>
        <h1 className="font-display text-xl text-gold hidden sm:block">
          {t('game_kuldvillak')} · {t('hostLabel')}
        </h1>
        <div className="flex items-center gap-2">
          {pl.active && pl.next && (
            <span className="hidden md:inline text-[10px] uppercase tracking-wide text-white/40">
              <SkipForward size={12} className="inline mr-1" />
              {t('playlistNext')}: {t(('game_' + pl.next) as TranslationKey)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1"
          >
            <HelpCircle size={14} /> {t('helpBtn')}
          </button>
          <button
            type="button"
            onClick={endSession}
            className="btn-outline text-xs !py-1.5 !px-3 border-accent-red/50 text-accent-red flex items-center gap-1"
          >
            <LogOut size={14} /> {t('endSession')}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-2 mb-1 relative z-10">
        <ThemeStudio
          bgMedia={(state as any).bgMedia || null}
          onBgMedia={(m) => update({ bgMedia: m } as any)}
          themeId={(state as any).themeId}
          onThemeId={(id) => update({ themeId: id } as any)}
          compact
          defaultOpen={false}
        />
      </div>
      <SessionBgLayer media={(state as any).bgMedia} />
      <div className="relative z-10">
        <KuldvillakBoard
          state={state}
          update={update}
          isHost
          sessionCode={session?.code || state.code}
          connection={connection}
          lastSync={lastSync}
          onRetry={retry}
        />
      </div>
      <GameHelpModal
        gameType="kuldvillak"
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        publicShown={!!(state as any).publicGuide}
        onTogglePublic={() => update({ publicGuide: !(state as any).publicGuide } as any)}
      />
    </div>
  )
}
