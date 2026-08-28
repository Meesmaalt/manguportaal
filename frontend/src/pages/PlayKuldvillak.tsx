import { useParams, Link, useNavigate } from 'react-router-dom'
import { useGameSession } from '@/hooks/useGameSession'
import KuldvillakBoard from '@/games/kuldvillak/KuldvillakBoard'
import type { KuldvillakState } from '@/games/kuldvillak/types'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'
import { endGameSession } from '@/lib/sessions'

export default function PlayKuldvillak() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { session, state, update, loading, error, connection, lastSync } =
    useGameSession<KuldvillakState>(sessionId!)
  const { t } = useI18n()

  async function endSession() {
    if (!confirm(t('endSessionConfirm'))) return
    await endGameSession(sessionId!)
    navigate('/play/kuldvillak')
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
      <div className="text-center py-20">
        <p className="text-accent-red mb-4">{error || t('errorSession')}</p>
        <Link to="/dashboard" className="text-gold">
          ← {t('packBack')}
        </Link>
      </div>
    )
  }

  return (
    <div className="py-4 px-2">
      <div className="max-w-6xl mx-auto mb-2 flex items-center justify-between px-2 gap-2 flex-wrap">
        <Link
          to="/play/kuldvillak"
          className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm"
        >
          <ArrowLeft size={16} /> {t('newGame')}
        </Link>
        <h1 className="font-display text-xl text-gold hidden sm:block">
          {t('game_kuldvillak')} · {t('hostLabel')}
        </h1>
        <button
          type="button"
          onClick={endSession}
          className="btn-outline text-xs !py-1.5 !px-3 border-accent-red/50 text-accent-red flex items-center gap-1"
        >
          <LogOut size={14} /> {t('endSession')}
        </button>
      </div>

      <KuldvillakBoard
        state={state}
        update={update}
        isHost
        sessionCode={session?.code || state.code}
        connection={connection}
        lastSync={lastSync}
      />
    </div>
  )
}
