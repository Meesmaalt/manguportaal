import { useParams, Link } from 'react-router-dom'
import { useGameSession } from '@/hooks/useGameSession'
import { ArrowLeft } from 'lucide-react'
import SonaseletusGame, { type SonaseletusState } from '@/games/sonaseletus/SonaseletusGame'
import MaEiOleKunagiGame, { type MaEiOleKunagiState } from '@/games/ma-ei-ole-kunagi/MaEiOleKunagiGame'
import ViimanePustiGame, { type ViimanePustiState } from '@/games/viimane-pusti/ViimanePustiGame'
import TodeVoiTeguGame, { type TodeVoiTeguState } from '@/games/tode-voi-tegu/TodeVoiTeguGame'
import { GAME_META, type GameType } from '@/lib/types'
import GameShowFrame from '@/components/GameShowFrame'
import { useI18n } from '@/i18n/I18nContext'

export default function PlayGeneric() {
  const { gameType, sessionId } = useParams<{ gameType: string; sessionId: string }>()
  const { session, state, update, loading, error, connection, lastSync } = useGameSession<any>(sessionId!)
  const meta = GAME_META[gameType as GameType]
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
        <Link to="/dashboard" className="text-gold">← Tagasi</Link>
      </div>
    )
  }

  const code = session?.code || state.code

  return (
    <GameShowFrame title={(gameType ? t(('game_' + gameType) as any) : 'ÕHTU').toUpperCase()}>
    <div className="py-4 px-2">
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between px-2">
        <Link to={`/play/${gameType}`} className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm">
          <ArrowLeft size={16} /> Uus mäng
        </Link>
        <h1 className="font-display text-xl text-gold hidden sm:block">
          {meta?.emoji} {gameType ? t(('game_' + gameType) as any) : meta?.title} · {t('hostLabel')}
        </h1>
        <div className="w-16" />
      </div>

      {gameType === 'sonaseletus' && (
        <SonaseletusGame state={state as SonaseletusState} update={update} isHost sessionCode={code} />
      )}
      {gameType === 'ma_ei_ole_kunagi' && (
        <MaEiOleKunagiGame state={state as MaEiOleKunagiState} update={update} isHost sessionCode={code} />
      )}
      {gameType === 'viimane_pusti' && (
        <ViimanePustiGame state={state as ViimanePustiState} update={update} isHost sessionCode={code} />
      )}
      {gameType === 'tode_voi_tegu' && (
        <TodeVoiTeguGame state={state as TodeVoiTeguState} update={update} isHost sessionCode={code} />
      )}
    </div>
    </GameShowFrame>
  )
}
