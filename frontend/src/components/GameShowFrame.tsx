import type { ReactNode, CSSProperties } from 'react'
import { Maximize, Minimize, Radio, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDisplayScale } from '@/hooks/useDisplayScale'
import { useI18n } from '@/i18n/I18nContext'

export default function GameShowFrame({
  children,
  display = false,
  title = 'ÕHTU',
  hasSessionBg = false,
}: {
  children: ReactNode
  display?: boolean
  title?: string
  /** When session has custom bg — let SessionBgLayer show through */
  hasSessionBg?: boolean
}) {
  const [fullscreen, setFullscreen] = useState(false)
  const { scale, smaller, reset, larger } = useDisplayScale()
  const { t } = useI18n()

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    } catch {}
  }

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  return (
    <div
      className={`game-show ${display ? 'game-show-display' : ''} ${hasSessionBg ? 'game-show-has-bg' : ''}`}
    >
      <div className="game-show-glow game-show-glow-a" />
      <div className="game-show-glow game-show-glow-b" />
      <div className="game-show-topbar">
        <div className="game-show-brand">
          <span>{title}</span>
          <i>
            <Radio size={11} /> LIVE
          </i>
        </div>
        <div className="flex items-center gap-2">
          {display && (
            <div className="game-display-zoom" aria-label={t('displayZoom')}>
              <button type="button" onClick={smaller} title={t('displayZoomOut')} aria-label={t('displayZoomOut')}>
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                onClick={reset}
                title={t('displayZoomReset')}
                aria-label={t('displayZoomReset')}
                className="game-display-zoom-value"
              >
                {Math.round(scale * 100)}%
              </button>
              <button type="button" onClick={larger} title={t('displayZoomIn')} aria-label={t('displayZoomIn')}>
                <ZoomIn size={15} />
              </button>
            </div>
          )}
          <button type="button" className="game-show-fullscreen" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            <span>{fullscreen ? t('fullscreenExit') : t('fullscreen')}</span>
          </button>
        </div>
      </div>
      <div
        className={display ? 'game-display-content relative z-10' : 'relative z-10'}
        style={display ? ({ '--display-scale': scale } as CSSProperties) : undefined}
      >
        {children}
      </div>
    </div>
  )
}
