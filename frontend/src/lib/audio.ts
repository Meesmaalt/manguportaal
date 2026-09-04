import { assetUrl } from '@/lib/config'
import { getSoundUrl } from '@/lib/gameSounds'

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
    return getSoundUrl('kuldvillak_bgm') || assetUrl('sounds/kuldvillak.mp3')
  },
  get roosCorrect() {
    return getSoundUrl('roos_correct') || assetUrl('sounds/roosidesoda-oige.mp3')
  },
  get roosError() {
    return getSoundUrl('roos_error') || assetUrl('sounds/roosidesoda-error.mp3')
  },
  get roosBgm() {
    return getSoundUrl('roos_bgm') || assetUrl('sounds/roosidesoda-taustamuusika.mp3')
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

export type FxType =
  | 'reveal'
  | 'correct'
  | 'wrong'
  | 'tick'
  | 'victory'
  | 'click'
  | 'jingle'
  | 'drumroll'
  | 'join'
  | 'buzz'
  | 'timer_urgent'

/** Prefer uploaded file (fx_* or game-specific), else WebAudio synth. */
export function playFx(type: FxType, opts?: { prefer?: string }) {
  try {
    const candidates = [
      opts?.prefer,
      type === 'correct' ? 'blitz_correct' : '',
      type === 'wrong' ? 'blitz_wrong' : '',
      type === 'jingle' ? 'blitz_countdown' : '',
      type === 'victory' ? 'blitz_podium' : '',
      `fx_${type}`,
    ].filter(Boolean) as string[]
    for (const key of candidates) {
      const url = getSoundUrl(key)
      if (url) {
        playSound(url, type === 'timer_urgent' ? 0.9 : 1)
        return
      }
    }
    const ctx = ensureCtx()
    const now = ctx.currentTime
    const notes: Record<string, number[]> = {
      click: [440],
      tick: [620],
      reveal: [330, 494, 659],
      correct: [523, 659, 784],
      wrong: [220, 165],
      victory: [523, 659, 784, 1047],
      jingle: [392, 494, 587, 784],
      drumroll: [150, 160, 170, 180, 190, 200, 210, 220],
      join: [523, 659],
      buzz: [880, 660],
      timer_urgent: [740, 740, 740],
    }
    const duration: Record<string, number> = {
      click: 0.06,
      tick: 0.07,
      reveal: 0.12,
      correct: 0.14,
      wrong: 0.18,
      victory: 0.18,
      jingle: 0.14,
      drumroll: 0.05,
      join: 0.12,
      buzz: 0.15,
      timer_urgent: 0.08,
    }
    ;(notes[type] || [440]).forEach((freq, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = type === 'wrong' || type === 'buzz' ? 'sawtooth' : 'sine'
      o.frequency.value = freq
      const gap =
        type === 'victory' ? 0.09 : type === 'drumroll' ? 0.04 : type === 'jingle' ? 0.1 : 0.045
      const t0 = now + i * gap
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.12 * masterGain, t0 + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + (duration[type] || 0.1))
      o.connect(g)
      g.connect(ctx.destination)
      o.start(t0)
      o.stop(t0 + 0.25)
    })
  } catch {
    /* ignore */
  }
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
