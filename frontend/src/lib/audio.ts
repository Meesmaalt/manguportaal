import { assetUrl } from '@/lib/config'

let masterGain = 1 // 0..2 (200%)
let audioCtx: AudioContext | null = null
const nodes = new Map<HTMLAudioElement, MediaElementAudioSourceNode>()

function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

function connect(el: HTMLAudioElement) {
  try {
    const ctx = ensureCtx()
    if (!nodes.has(el)) {
      const src = ctx.createMediaElementSource(el)
      const gain = ctx.createGain()
      gain.gain.value = masterGain
      src.connect(gain)
      gain.connect(ctx.destination)
      ;(el as any).__gainNode = gain
      nodes.set(el, src)
    } else if ((el as any).__gainNode) {
      ;(el as any).__gainNode.gain.value = masterGain
    }
  } catch {
    // fallback: element volume only (max 1)
    el.volume = Math.min(1, masterGain)
  }
}

export function setMasterVolume(v: number) {
  masterGain = Math.max(0, Math.min(2, v))
  nodes.forEach((_, el) => {
    if ((el as any).__gainNode) {
      ;(el as any).__gainNode.gain.value = masterGain
    } else {
      el.volume = Math.min(1, masterGain)
    }
  })
}

export function getMasterVolume() {
  return masterGain
}

const cache: Record<string, HTMLAudioElement> = {}

function get(src: string): HTMLAudioElement {
  if (!cache[src]) {
    const a = new Audio(src)
    a.preload = 'auto'
    a.crossOrigin = 'anonymous'
    cache[src] = a
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

export function playSound(src: string, volume = 1) {
  try {
    const a = get(src).cloneNode(true) as HTMLAudioElement
    a.crossOrigin = 'anonymous'
    connect(a)
    // element volume as relative; master gain applies boost
    a.volume = Math.min(1, volume)
    if ((a as any).__gainNode) {
      ;(a as any).__gainNode.gain.value = masterGain * volume
    }
    a.play().catch(() => {})
  } catch {}
}

export function createBgm(src: string, volume = 0.35) {
  const a = get(src)
  a.loop = true
  a.crossOrigin = 'anonymous'
  connect(a)
  a.volume = Math.min(1, volume)
  if ((a as any).__gainNode) {
    ;(a as any).__gainNode.gain.value = masterGain * volume
  }
  return {
    play: () => {
      connect(a)
      a.play().catch(() => {})
    },
    pause: () => a.pause(),
    setVolume: (v: number) => {
      a.volume = Math.min(1, v)
      if ((a as any).__gainNode) {
        ;(a as any).__gainNode.gain.value = masterGain * v
      }
    },
    el: a,
  }
}
