import { Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDisplayScale } from '@/hooks/useDisplayScale'
import { useI18n } from '@/i18n/I18nContext'

/** Floating zoom + fullscreen for TV routes that skip GameShowFrame topbar. */
export default function DisplayCornerTools() {
  const [fullscreen, setFullscreen] = useState(false)
  const { scale, smaller, reset, larger } = useDisplayScale()
  const { t } = useI18n()

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    } catch {}
  }

  return (
    <div className="game-show-corner-tools" role="toolbar" aria-label="Ekraan">
      <div className="game-display-zoom">
        <button type="button" onClick={smaller} title={t('displayZoomOut')} aria-label={t('displayZoomOut')}>
          <ZoomOut size={15} />
        </button>
        <button type="button" onClick={reset} title={t('displayZoomReset')} className="game-display-zoom-value">
          {Math.round(scale * 100)}%
        </button>
        <button type="button" onClick={larger} title={t('displayZoomIn')} aria-label={t('displayZoomIn')}>
          <ZoomIn size={15} />
        </button>
      </div>
      <button type="button" className="game-show-fullscreen" onClick={toggleFullscreen} title={t('fullscreen')}>
        {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        <span className="hidden sm:inline">{fullscreen ? t('fullscreenExit') : t('fullscreen')}</span>
      </button>
    </div>
  )
}
