import { appUrl } from '@/lib/config'
import { useI18n } from '@/i18n/I18nContext'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import { Copy, Check, ExternalLink, Tv, Wifi, WifiOff, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

type Props = {
  code?: string
  connection?: ConnectionStatus
  lastSync?: number
  onRetry?: () => void
}

export default function TvJoinPanel({ code, connection = 'offline', lastSync = 0, onRetry }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState<'link' | 'code' | 'buzz' | null>(null)
  const [open, setOpen] = useState(false)
  // Auto-expand until TV is connected (live) or same-device local
  useEffect(() => {
    if (connection === 'offline' || connection === 'reconnecting') {
      setOpen(true)
    }
  }, [connection, code])
  if (!code) return null

  const url = appUrl(`/ekraan/${code}`)
  const buzzUrl = appUrl(`/buzzer/${code}`)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&margin=8&data=${encodeURIComponent(url)}`

  async function copy(kind: 'link' | 'code' | 'buzz') {
    try {
      const text = kind === 'link' ? url : kind === 'buzz' ? buzzUrl : code
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* ignore */
    }
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
    <div className="card-panel p-2 md:p-3 mb-4 border-gold/40 max-w-xl mx-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 flex-wrap text-left"
      >
        <div className="flex items-center gap-2 text-gold font-display font-bold text-sm md:text-base">
          <Tv size={18} />
          {t('tvJoinTitle')}
          <span className="font-mono text-white/55 text-xs tracking-widest">{code}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusClass}`}
          >
            <StatusIcon size={11} className={connection === 'reconnecting' ? 'animate-spin' : ''} />
            {statusLabel}
          </span>
          {open ? <ChevronUp size={16} className="text-gold/70" /> : <ChevronDown size={16} className="text-gold/70" />}
        </div>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-gold/15 grid md:grid-cols-[140px_1fr] gap-4">
          <div className="flex flex-col items-center gap-2">
            <img
              src={qrSrc}
              alt="QR"
              className="w-[140px] h-[140px] rounded-xl bg-white p-2 border border-gold/20"
            />
            <p className="text-white/40 text-[10px] text-center">{t('tvQrHint')}</p>
          </div>
          <div className="space-y-3 min-w-0">
            <div>
              <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{t('sessionCode')}</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-2xl text-gold tracking-[0.2em] font-black">{code}</span>
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
                {onRetry && (
                  <button type="button" onClick={onRetry} className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1">
                    <RefreshCw size={12} /> {t('connRetry')}
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{t('buzzLink')}</div>
              <p className="text-white/45 text-xs mb-2">{t('shareBuzzHint')}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copy('buzz')}
                  className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1"
                >
                  {copied === 'buzz' ? <Check size={12} /> : <Copy size={12} />}
                  {copied === 'buzz' ? t('sessionCopied') : t('shareCopyBuzz')}
                </button>
                <a href={buzzUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs !py-1.5 !px-3">
                  {t('shareOpenBuzz')}
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
      )}
    </div>
  )
}
