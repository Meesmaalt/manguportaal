import { appUrl } from '@/lib/config'
import { useI18n } from '@/i18n/I18nContext'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

/** Compact host helper — avoid repeating full TV URL when a richer panel already exists. */
export default function SessionCodeBadge({
  code,
  compact = false,
}: {
  code?: string
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()
  if (!code) return null

  const url = appUrl(`/ekraan/${code}`)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (compact) {
    return (
      <div className="text-center mb-3">
        <span className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-3 py-1 rounded-full text-xs font-bold tracking-widest">
          {code}
          <button type="button" onClick={copy} className="opacity-80 hover:opacity-100" title={t('sessionCopy')}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-gold" title="TV">
            <ExternalLink size={12} />
          </a>
        </span>
      </div>
    )
  }

  return (
    <div className="text-center mb-4 space-y-2">
      <div className="inline-flex flex-wrap items-center justify-center gap-2">
        <span className="inline-block bg-gold/15 border border-gold/40 text-gold px-4 py-1.5 rounded-full text-sm font-bold tracking-widest">
          {t('sessionCode')}: {code}
        </span>
        <button
          type="button"
          onClick={copy}
          className="btn-outline text-xs !py-1 !px-2 flex items-center gap-1"
          title={t('sessionCopy')}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? t('sessionCopied') : t('sessionCopy')}
        </button>
      </div>
      <p className="text-white/40 text-xs">{t('sessionOpenTv')}</p>
    </div>
  )
}
