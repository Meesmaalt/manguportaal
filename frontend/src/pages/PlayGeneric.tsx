import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGameSession } from '@/hooks/useGameSession'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import SonaseletusGame, { type SonaseletusState } from '@/games/sonaseletus/SonaseletusGame'
import MaEiOleKunagiGame, { type MaEiOleKunagiState } from '@/games/ma-ei-ole-kunagi/MaEiOleKunagiGame'
import ViimanePustiGame, { type ViimanePustiState } from '@/games/viimane-pusti/ViimanePustiGame'
import TodeVoiTeguGame, { type TodeVoiTeguState } from '@/games/tode-voi-tegu/TodeVoiTeguGame'
import KinnistuDealGame from '@/games/kinnistu-deal/KinnistuDealGame'
import type { KinnistuDealState } from '@/games/kinnistu-deal/types'
import { GAME_META, type GameType } from '@/lib/types'
import GameShowFrame from '@/components/GameShowFrame'
import { useI18n } from '@/i18n/I18nContext'
import type { TranslationKey } from '@/i18n/translations'
import GameHelpModal from '@/components/GameHelpModal'
import ThemeStudio, { SessionBgLayer } from '@/components/ThemeStudio'

export default function PlayGeneric() {
  const { gameType, sessionId } = useParams<{ gameType: string; sessionId: string }>()
  const { session, state, update, loading, error } = useGameSession<any>(sessionId!)
  const meta = GAME_META[gameType as GameType]
  const { t } = useI18n()
  const [helpOpen, setHelpOpen] = useState(false)

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

  const code = session?.code || state.code
  const titleKey = (`game_${gameType}` as TranslationKey)

  return (
    <GameShowFrame title={(gameType ? t(titleKey) : 'ÕHTU').toUpperCase()} hasSessionBg={!!state.bgMedia?.dataUrl}>
      <div className="py-4 px-2">
        <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between px-2 gap-2 flex-wrap">
          <Link
            to={`/play/${gameType}`}
            className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm"
          >
            <ArrowLeft size={16} /> {t('newGame')}
          </Link>
          <h1 className="font-display text-xl text-gold hidden sm:block">
            {meta?.emoji} {gameType ? t(titleKey) : meta?.title} · {t('hostLabel')}
          </h1>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1"
          >
            <HelpCircle size={14} /> {t('helpBtn')}
          </button>
        </div>

        <div className="max-w-3xl mx-auto mb-1 relative z-10">
          <ThemeStudio
            bgMedia={state.bgMedia || null}
            onBgMedia={(m) => update({ bgMedia: m })}
            themeId={state.themeId}
            onThemeId={(id) => update({ themeId: id })}
            compact
            defaultOpen={false}
          />
        </div>
        <SessionBgLayer media={state.bgMedia} />
        <div className="relative z-10">
        {gameType === 'sonaseletus' && (
          <SonaseletusGame state={state as SonaseletusState} update={update} isHost sessionCode={code} />
        )}
        {gameType === 'ma_ei_ole_kunagi' && (
          <MaEiOleKunagiGame state={state as MaEiOleKunagiState} update={update} isHost sessionCode={code} />
        )}
        {gameType === 'viimane_pusti' && (
          <ViimanePustiGame state={state as ViimanePustiState} update={update} isHost sessionCode={code} />
        )}
        {gameType === 'kinnistu_deal' && (
          <KinnistuDealGame state={state as KinnistuDealState} update={update} isHost sessionCode={code} />
        )}
        {gameType === 'tode_voi_tegu' && (
          <TodeVoiTeguGame state={state as TodeVoiTeguState} update={update} isHost sessionCode={code} />
        )}
        </div>
      </div>

      <GameHelpModal
        gameType={gameType || 'sonaseletus'}
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        publicShown={!!state.publicGuide}
        onTogglePublic={() => update({ publicGuide: !state.publicGuide })}
      />
    </GameShowFrame>
  )
}
