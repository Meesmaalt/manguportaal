import { useI18n } from '@/i18n/I18nContext'
import type { TranslationKey } from '@/i18n/translations'
import { X, Monitor } from 'lucide-react'

const GUIDE_KEYS: Record<string, TranslationKey> = {
  kuldvillak: 'guide_kuldvillak',
  roosidesoda: 'guide_roosidesoda',
  sonaseletus: 'guide_sonaseletus',
  ma_ei_ole_kunagi: 'guide_ma_ei_ole_kunagi',
  viimane_pusti: 'guide_viimane_pusti',
  tode_voi_tegu: 'guide_tode_voi_tegu',
}

export function guideKeyFor(gameType: string): TranslationKey {
  return GUIDE_KEYS[gameType] || 'guide_kuldvillak'
}

type Props = {
  gameType: string
  open: boolean
  onClose: () => void
  /** Host can push guide to TV */
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
  const { t } = useI18n()
  if (!open) return null
  const text = t(guideKeyFor(gameType))

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card-panel max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 md:p-6 border-gold/50 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-3 right-3 text-white/50 hover:text-white">
          <X size={22} />
        </button>
        <h2 className="font-display text-2xl text-gold mb-4 pr-8">{t('helpTitle')}</h2>
        <pre className="whitespace-pre-wrap text-sm text-white/85 leading-relaxed font-sans mb-6">{text}</pre>
        <div className="flex flex-wrap gap-2">
          {onTogglePublic && (
            <button type="button" className="btn-outline text-sm flex items-center gap-1.5" onClick={onTogglePublic}>
              <Monitor size={14} />
              {publicShown ? t('helpHidePublic') : t('helpShowPublic')}
            </button>
          )}
          <button type="button" className="btn-gold text-sm" onClick={onClose}>
            {t('helpClose')}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Full-screen guide for TV / audience */
export function PublicGuideOverlay({ gameType }: { gameType: string }) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 md:p-12 bg-black/90">
      <div className="max-w-3xl w-full text-center">
        <div className="text-gold text-sm uppercase tracking-[0.3em] font-bold mb-4">{t('helpTitle')}</div>
        <pre className="whitespace-pre-wrap text-left text-base md:text-xl text-white/90 leading-relaxed font-sans">
          {t(guideKeyFor(gameType))}
        </pre>
      </div>
    </div>
  )
}
