import { useEffect, useState } from 'react'

/** Scales root rem so all Tailwind text-* classes grow/shrink */
export function useFontScale(initial = 1) {
  const [fontScale, setFontScale] = useState(initial)

  useEffect(() => {
    const prev = document.documentElement.style.fontSize
    document.documentElement.style.fontSize = `${fontScale * 100}%`
    return () => {
      document.documentElement.style.fontSize = prev || ''
    }
  }, [fontScale])

  return {
    fontScale,
    setFontScale,
    smaller: () => setFontScale((s) => Math.max(0.75, +(s - 0.1).toFixed(2))),
    reset: () => setFontScale(1),
    larger: () => setFontScale((s) => Math.min(1.5, +(s + 0.1).toFixed(2))),
  }
}
