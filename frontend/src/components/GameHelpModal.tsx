import { useI18n } from '@/i18n/I18nContext'
import { getGuide } from '@/i18n/guides'
import { X, Monitor } from 'lucide-react'

type Props = {
  gameType: string
  open: boolean
  onClose: () => void
  publicShown?: boolean
  onTogglePublic?: () => void
}

export default function GameHelpModal({
  gameType,
  open,
  onClose,
  publicShown,
  onTogglePublic,
}: Props) {
  const { t, lang } = useI18n()
  if (!open) return null
  const text = getGuide(lang, gameType)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card-panel w-full max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-10 border-gold/50 relative shadow-gold-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1"
        >
          <X size={28} />
        </button>
        <h2 className="font-display text-3xl md:text-4xl text-gold mb-6 pr-10 tracking-wide">
          {t('helpTitle')}
        </h2>
        <div className="text-base md:text-lg lg:text-xl text-white/90 leading-relaxed whitespace-pre-wrap font-sans">
          {text}
        </div>
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gold/20">
          {onTogglePublic && (
            <button
              type="button"
              className="btn-outline text-sm md:text-base flex items-center gap-2 !py-2.5 !px-4"
              onClick={onTogglePublic}
            >
              <Monitor size={18} />
              {publicShown ? t('helpHidePublic') : t('helpShowPublic')}
            </button>
          )}
          <button type="button" className="btn-gold text-sm md:text-base !py-2.5 !px-5" onClick={onClose}>
            {t('helpClose')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PublicGuideOverlay({ gameType, onClose }: { gameType: string; onClose?: () => void }) {
  const { t, lang } = useI18n()
  const guideText = getGuide(lang, gameType)

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 sm:p-8 md:p-14 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="card-panel max-w-4xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-10 md:p-12 border-gold/70 bg-[#060e22]/95 shadow-2xl relative shadow-gold/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gold/20 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-gold animate-ping" />
            <div>
              <div className="text-gold text-xs sm:text-sm uppercase tracking-[0.28em] font-bold">
                {t('helpTitle')}
              </div>
              <div className="text-white/60 text-xs mt-0.5">
                Saatejuht tutvustab reegleid ekraanil
              </div>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-white/50 hover:text-white text-xs px-2.5 py-1 rounded border border-white/20 hover:border-white/50"
            >
              ✕ Sulge
            </button>
          )}
        </div>

        <div className="text-base sm:text-lg md:text-xl text-white/95 leading-relaxed whitespace-pre-wrap font-sans">
          {guideText}
        </div>
      </div>
    </div>
  )
}
