import { useParams, Link } from 'react-router-dom'
import { useGameSession } from '@/hooks/useGameSession'
import KuldvillakBoard from '@/games/kuldvillak/KuldvillakBoard'
import type { KuldvillakState } from '@/games/kuldvillak/types'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'

export default function PlayKuldvillak() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, state, update, loading, error, connection, lastSync } =
    useGameSession<KuldvillakState>(sessionId!)
  const { t } = useI18n()

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
      <div className="max-w-6xl mx-auto mb-2 flex items-center justify-between px-2">
        <Link
          to="/play/kuldvillak"
          className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm"
        >
          <ArrowLeft size={16} /> {t('newGame')}
        </Link>
        <h1 className="font-display text-xl text-gold hidden sm:block">
          {t('game_kuldvillak')} · {t('hostLabel')}
        </h1>
        <div className="w-20" />
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
