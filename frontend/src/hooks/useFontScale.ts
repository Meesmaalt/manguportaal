import { useEffect, useState } from 'react'

const KEY = 'ohtu_font_scale'

/** Scales root rem so all Tailwind text-* classes grow/shrink on this page */
export function useFontScale(initial = 1) {
  const [fontScale, setFontScale] = useState(() => {
    const s = sessionStorage.getItem(KEY)
    return s ? parseFloat(s) || initial : initial
  })

  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.fontSize
    html.style.fontSize = `${fontScale * 100}%`
    sessionStorage.setItem(KEY, String(fontScale))
    // Also scale the game root if present
    const root = document.getElementById('game-scale-root')
    if (root) {
      ;(root as HTMLElement).style.zoom = String(fontScale)
    }
    return () => {
      html.style.fontSize = prev || ''
      if (root) (root as HTMLElement).style.zoom = ''
    }
  }, [fontScale])

  return {
    fontScale,
    setFontScale,
    smaller: () => setFontScale((s) => Math.max(0.7, +(s - 0.1).toFixed(2))),
    reset: () => setFontScale(1),
    larger: () => setFontScale((s) => Math.min(1.6, +(s + 0.1).toFixed(2))),
  }
}
