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

export function PublicGuideOverlay({ gameType }: { gameType: string }) {
  const { t, lang } = useI18n()
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 md:p-16 bg-black/92">
      <div className="max-w-4xl w-full">
        <div className="text-gold text-sm md:text-base uppercase tracking-[0.35em] font-bold mb-6 text-center">
          {t('helpTitle')}
        </div>
        <div className="text-lg md:text-2xl lg:text-3xl text-white/95 leading-relaxed whitespace-pre-wrap font-sans text-center md:text-left">
          {getGuide(lang, gameType)}
        </div>
      </div>
    </div>
  )
}
