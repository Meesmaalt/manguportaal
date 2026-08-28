import type { KuldvillakPackData } from '@/lib/pocketbase'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'

export default function HostSheet({
  packData,
  onClose,
}: {
  packData: KuldvillakPackData
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card-panel max-w-3xl w-full max-h-[85vh] overflow-y-auto p-5 md:p-6 border-gold/50 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-3 right-3 text-white/50 hover:text-white">
          <X size={22} />
        </button>
        <h2 className="font-display text-2xl text-gold mb-1">{t('hostSheet')}</h2>
        <p className="text-white/45 text-xs mb-4">{t('hostSheetHint')}</p>

        {packData.categories.map((cat) => (
          <div key={cat.name} className="mb-5">
            <h3 className="font-display text-gold text-lg border-b border-gold/30 pb-1 mb-2">{cat.name}</h3>
            <ul className="space-y-2 text-sm">
              {cat.questions.map((q, i) => (
                <li key={i} className="bg-black/25 rounded-lg px-3 py-2">
                  <div className="text-gold/80 font-bold text-xs">{q.points} p</div>
                  <div className="text-white/90">{q.q}</div>
                  <div className="text-accent-green font-semibold mt-0.5">→ {q.a}</div>
                  {q.hostNote && <div className="text-amber-200/70 text-xs mt-1 italic">Host: {q.hostNote}</div>}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {packData.finalJeopardy && (
          <div className="mb-2 border border-gold/40 rounded-xl p-3">
            <h3 className="font-display text-gold mb-2">{t('finalJeopardy')}</h3>
            <div className="text-white/90 text-sm">{packData.finalJeopardy.q}</div>
            <div className="text-accent-green font-semibold mt-1">→ {packData.finalJeopardy.a}</div>
            {packData.finalJeopardy.hostNote && (
              <div className="text-amber-200/70 text-xs mt-1 italic">Host: {packData.finalJeopardy.hostNote}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
