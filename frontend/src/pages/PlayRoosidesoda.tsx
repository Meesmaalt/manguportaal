import { useParams, Link } from 'react-router-dom'
import { useGameSession } from '@/hooks/useGameSession'
import RoosidesodaHost from '@/games/roosidesoda/RoosidesodaHost'
import type { RoosidesodaState } from '@/games/roosidesoda/types'
import { ArrowLeft } from 'lucide-react'
import GameShowFrame from '@/components/GameShowFrame'
import { useI18n } from '@/i18n/I18nContext'

export default function PlayRoosidesoda() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, state, update, loading, error } = useGameSession<RoosidesodaState>(
    sessionId!
  )

  const { t } = useI18n()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gold font-display text-2xl animate-pulse">Laadin mängu...</div>
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="text-center py-20">
        <p className="text-accent-red mb-4">{error || 'Sessioon puudub'}</p>
        <Link to="/dashboard" className="text-gold">
          ← Tagasi
        </Link>
      </div>
    )
  }

  return (
    <GameShowFrame title={t('game_roosidesoda').toUpperCase()}>
    <div className="py-4 px-2">
      <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between px-2">
        <Link
          to="/play/roosidesoda"
          className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm"
        >
          <ArrowLeft size={16} /> Uus mäng
        </Link>
        <h1 className="font-display text-2xl text-gold hidden sm:block">{t('game_roosidesoda')} · {t('hostLabel')}</h1>
        <div className="w-20" />
      </div>

      <RoosidesodaHost
        state={state}
        update={update}
        isHost
        sessionCode={session?.code || state.code}
      />
    </div>
    </GameShowFrame>
  )
}
