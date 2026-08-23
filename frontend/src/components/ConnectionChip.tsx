import type { ConnectionStatus } from '@/hooks/useGameSession'
import { useI18n } from '@/i18n/I18nContext'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function ConnectionChip({
  connection,
}: {
  connection: ConnectionStatus
}) {
  const { t } = useI18n()
  const label =
    connection === 'live'
      ? t('connLive')
      : connection === 'local'
        ? t('connLocal')
        : connection === 'reconnecting'
          ? t('connReconnect')
          : t('connOffline')

  const cls =
    connection === 'live'
      ? 'text-accent-green border-accent-green/40'
      : connection === 'local'
        ? 'text-gold border-gold/40'
        : connection === 'reconnecting'
          ? 'text-amber-300 border-amber-500/40'
          : 'text-white/40 border-white/20'

  const Icon =
    connection === 'live' || connection === 'local'
      ? Wifi
      : connection === 'reconnecting'
        ? RefreshCw
        : WifiOff

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border bg-black/30 ${cls}`}
    >
      <Icon size={11} className={connection === 'reconnecting' ? 'animate-spin' : ''} />
      {label}
    </span>
  )
}
