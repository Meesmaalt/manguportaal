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
    try { localStorage.setItem(KEY, String(scale)) } catch {}
  }, [scale])

  return {
    scale,
    smaller: () => setScale((s: number) => Math.max(0.7, +(s - 0.1).toFixed(2))),
    reset: () => setScale(1),
    larger: () => setScale((s: number) => Math.min(2.2, +(s + 0.1).toFixed(2))),
  }
}
