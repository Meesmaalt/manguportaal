import { useEffect, useState } from 'react'

const KEY = 'ohtu_display_scale'

export function useDisplayScale(initial = 1) {
  const [scale, setScale] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(KEY))
      return Number.isFinite(saved) && saved > 0 ? saved : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, String(scale))
      document.documentElement.style.setProperty('--display-scale', String(scale))
      window.dispatchEvent(new CustomEvent('ohtu-display-scale-change', { detail: { scale } }))
    } catch {}
  }, [scale])

  useEffect(() => {
    const onScaleChange = (e: any) => {
      if (e.detail?.scale && e.detail.scale !== scale) {
        setScale(e.detail.scale)
      }
    }
    window.addEventListener('ohtu-display-scale-change', onScaleChange)
    return () => window.removeEventListener('ohtu-display-scale-change', onScaleChange)
  }, [scale])

  return {
    scale,
    smaller: () => setScale((s: number) => Math.max(0.6, +(s - 0.1).toFixed(2))),
    reset: () => setScale(1),
    larger: () => setScale((s: number) => Math.min(2.5, +(s + 0.1).toFixed(2))),
  }
}

