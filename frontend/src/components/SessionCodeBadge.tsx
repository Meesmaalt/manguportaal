import { appUrl } from '@/lib/config'
import { useI18n } from '@/i18n/I18nContext'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function SessionCodeBadge({ code }: { code?: string }) {
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()
  if (!code) return null

  const url = appUrl(`/ekraan/${code}`)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
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
      <div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-accent-cyan hover:text-gold text-sm underline underline-offset-2 break-all"
        >
          <ExternalLink size={14} />
          {url}
        </a>
        <p className="text-white/40 text-xs mt-1">{t('sessionOpenTv')}</p>
      </div>
    </div>
  )
}
