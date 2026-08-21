import { assetUrl } from '@/lib/config'

const cache: Record<string, HTMLAudioElement> = {}

function get(src: string): HTMLAudioElement {
  if (!cache[src]) {
    cache[src] = new Audio(src)
    cache[src].preload = 'auto'
  }
  return cache[src]
}

export const sounds = {
  get kuldvillakBgm() {
    return assetUrl('sounds/kuldvillak.mp3')
  },
  get roosCorrect() {
    return assetUrl('sounds/roosidesoda-oige.mp3')
  },
  get roosError() {
    return assetUrl('sounds/roosidesoda-error.mp3')
  },
  get roosBgm() {
    return assetUrl('sounds/roosidesoda-taustamuusika.mp3')
  },
}

export function playSound(src: string, volume = 0.8) {
  try {
    const a = get(src).cloneNode(true) as HTMLAudioElement
    a.volume = volume
    a.play().catch(() => {})
  } catch {}
}

export function createBgm(src: string, volume = 0.35) {
  const a = get(src)
  a.loop = true
  a.volume = volume
  return {
    play: () => a.play().catch(() => {}),
    pause: () => a.pause(),
    setVolume: (v: number) => {
      a.volume = v
    },
    el: a,
  }
}
