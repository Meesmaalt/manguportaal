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

export function playFx(type: 'reveal' | 'correct' | 'wrong' | 'tick' | 'victory' | 'click' | 'jingle' | 'drumroll') {
  try {
    const ctx = ensureCtx(); const now = ctx.currentTime
    const notes: Record<string, number[]> = { click:[440], tick:[620], reveal:[330,494,659], correct:[523,659,784], wrong:[220,165], victory:[523,659,784,1047], jingle:[392,494,587,784], drumroll:[150,160,170,180,190,200,210,220] }
    const duration: Record<string, number> = { click:.06,tick:.07,reveal:.12,correct:.14,wrong:.18,victory:.18,jingle:.14,drumroll:.05 }
    ;(notes[type] || [440]).forEach((freq,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.type=type==='wrong'?'sawtooth':'sine';o.frequency.value=freq;const t=now+i*(type==='victory'?.09:type==='drumroll'?.04:type==='jingle'?.1:.045);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12*masterGain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+(duration[type]||.1));o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.25) })
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
