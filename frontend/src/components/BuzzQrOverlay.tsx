import { appUrl } from '@/lib/config'
import { useI18n } from '@/i18n/I18nContext'

/** Large QR for guests to open buzzer — shown on host and/or TV when enabled */
export default function BuzzQrOverlay({ code, compact = false }: { code: string; compact?: boolean }) {
  const { t } = useI18n()
  const url = appUrl(`/buzzer/${code}`)
  const size = compact ? 140 : 200
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=M&margin=8&data=${encodeURIComponent(url)}`

  return (
    <div className={`text-center ${compact ? 'my-3' : 'my-6'}`}>
      <div className="inline-block bg-white p-3 rounded-2xl shadow-lg">
        <img src={qrSrc} alt="Buzzer QR" width={size} height={size} className="block rounded-lg" />
      </div>
      <p className="text-gold font-display font-bold mt-2 text-sm md:text-base">{t('buzzScan')}</p>
      <p className="text-white/40 text-xs break-all max-w-xs mx-auto">{url}</p>
    </div>
  )
}
