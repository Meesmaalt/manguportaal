import { appUrl } from '@/lib/config'
import { useI18n } from '@/i18n/I18nContext'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import { Copy, Check, ExternalLink, Tv, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'

type Props = {
  code?: string
  connection?: ConnectionStatus
  lastSync?: number
  onRetry?: () => void
}

export default function TvJoinPanel({ code, connection = 'offline', lastSync = 0, onRetry }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  if (!code) return null

  const url = appUrl(`/ekraan/${code}`)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&margin=8&data=${encodeURIComponent(url)}`

  async function copy(kind: 'link' | 'code') {
    try {
      await navigator.clipboard.writeText(kind === 'link' ? url : code)
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const statusLabel =
    connection === 'live'
      ? t('connLive')
      : connection === 'local'
        ? t('connLocal')
        : connection === 'reconnecting'
          ? t('connReconnect')
          : t('connOffline')

  const statusClass =
    connection === 'live'
      ? 'text-accent-green border-accent-green/40 bg-accent-green/10'
      : connection === 'local'
        ? 'text-gold border-gold/40 bg-gold/10'
        : connection === 'reconnecting'
          ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
          : 'text-white/50 border-white/20 bg-white/5'

  const StatusIcon =
    connection === 'live' || connection === 'local'
      ? Wifi
      : connection === 'reconnecting'
        ? RefreshCw
        : WifiOff

  return (
    <div className="card-panel p-4 md:p-5 mb-5 border-gold/40 max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 text-gold font-display font-bold text-lg">
          <Tv size={20} />
          {t('tvJoinTitle')}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusClass}`}
          >
            <StatusIcon size={12} className={connection === 'reconnecting' ? 'animate-spin' : ''} />
            {statusLabel}
          </span>
          {(connection === 'reconnecting' || connection === 'offline') && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-amber-500/50 text-amber-200 hover:bg-amber-500/15"
            >
              {t('connRetry')}
            </button>
          )}
        </div>
      </div>

      <p className="text-white/55 text-sm mb-4">{t('tvJoinHint')}</p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="shrink-0 bg-white p-2 rounded-xl shadow-lg">
          <img src={qrSrc} alt="QR" width={160} height={160} className="block rounded-lg" />
        </div>

        <div className="flex-1 w-full space-y-3 min-w-0">
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{t('sessionCode')}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-2xl md:text-3xl font-black text-gold tracking-[0.2em]">
                {code}
              </span>
              <button
                type="button"
                onClick={() => copy('code')}
                className="btn-outline text-xs !py-1 !px-2 flex items-center gap-1"
              >
                {copied === 'code' ? <Check size={12} /> : <Copy size={12} />}
                {copied === 'code' ? t('sessionCopied') : t('sessionCopy')}
              </button>
            </div>
          </div>

          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{t('tvLink')}</div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-cyan hover:text-gold text-sm break-all underline underline-offset-2 inline-flex items-start gap-1"
            >
              <ExternalLink size={14} className="shrink-0 mt-0.5" />
              {url}
            </a>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy('link')}
                className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1"
              >
                {copied === 'link' ? <Check size={12} /> : <Copy size={12} />}
                {copied === 'link' ? t('sessionCopied') : t('tvCopyLink')}
              </button>
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn-gold text-xs !py-1.5 !px-3">
                {t('tvOpen')}
              </a>
            </div>
          </div>

          {lastSync > 0 && (
            <p className="text-white/30 text-[10px]">
              {t('connLastSync')}: {new Date(lastSync).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
