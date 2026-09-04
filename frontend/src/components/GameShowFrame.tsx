import type { ReactNode, CSSProperties } from 'react'
import { useDisplayScale } from '@/hooks/useDisplayScale'

/**
 * Stage chrome without a second top bar.
 * Fullscreen: main Layout header (host) or DisplayCornerTools (TV).
 */
export default function GameShowFrame({
  children,
  display = false,
  title: _title = 'ÕHTU',
  hasSessionBg = false,
}: {
  children: ReactNode
  display?: boolean
  title?: string
  hasSessionBg?: boolean
}) {
  const { scale } = useDisplayScale()

  return (
    <div
      className={`game-show ${display ? 'game-show-display' : ''} ${hasSessionBg ? 'game-show-has-bg' : ''}`}
    >
      <div className="game-show-glow game-show-glow-a" />
      <div className="game-show-glow game-show-glow-b" />
      <div
        className={display ? 'game-display-content relative z-10' : 'relative z-10'}
        style={display ? ({ '--display-scale': scale } as CSSProperties) : undefined}
      >
        {children}
      </div>
    </div>
  )
}
