// Synthesized Kahoot-style dynamic WebAudio game-show audio engine
// Pure Web Audio: zero external assets, zero latency, works 100% offline.

let audioCtx: AudioContext | null = null
let isMuted = false
let currentBgmNodes: { stop: () => void } | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function isBlitzAudioMuted(): boolean {
  return isMuted
}

export function setBlitzAudioMuted(muted: boolean) {
  isMuted = muted
  if (muted && currentBgmNodes) {
    currentBgmNodes.stop()
    currentBgmNodes = null
  }
}

export function toggleBlitzAudio(): boolean {
  setBlitzAudioMuted(!isMuted)
  return !isMuted
}

/** Play a single tone or multi-step synth chime */
export function playSynthNote(freq: number, type: OscillatorType = 'sine', duration = 0.15, vol = 0.15) {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)

    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + duration + 0.05)
  } catch {}
}

/** Suspense countdown tick (pitch rises as time runs out) */
export function playCountdownTick(remainingSeconds: number) {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return
  const freq = remainingSeconds <= 3 ? 920 : remainingSeconds <= 5 ? 780 : 540
  const duration = remainingSeconds <= 3 ? 0.07 : 0.05
  playSynthNote(freq, 'triangle', duration, 0.18)
}

/** Happy correct chime */
export function playCorrectSound() {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.08)

      gain.gain.setValueAtTime(0.001, now + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.3)
    } catch {}
  })
}

/** Dramatic wrong sound */
export function playWrongSound() {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [280, 240, 200]
  notes.forEach((freq, i) => {
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, now + i * 0.1)

      gain.gain.setValueAtTime(0.001, now + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.25)
    } catch {}
  })
}

/** Streak sound: rising synth arpeggio for hot streak */
export function playStreakSound(streak = 3) {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const base = streak >= 5 ? 587.33 : 440 // D5 or A4
  const steps = [0, 4, 7, 12, 16] // Major arpeggio
  steps.forEach((st, i) => {
    try {
      const freq = base * Math.pow(2, st / 12)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, now + i * 0.05)

      gain.gain.setValueAtTime(0.001, now + i * 0.05)
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.05 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.05)
      osc.stop(now + i * 0.05 + 0.25)
    } catch {}
  })
}

/** Reaction pop sound for player floating emojis */
export function playReactionPop() {
  if (isMuted) return
  const freq = 450 + Math.random() * 350
  playSynthNote(freq, 'sine', 0.08, 0.08)
}

/** Dramatic reveal fanfare */
export function playRevealStinger() {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [392, 523.25, 659.25, 783.99] // G4, C5, E5, G5
  notes.forEach((freq, i) => {
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + i * 0.06)

      gain.gain.setValueAtTime(0.001, now + i * 0.06)
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.06 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.06)
      osc.stop(now + i * 0.06 + 0.4)
    } catch {}
  })
}

/** Majestic podium winner fanfare */
export function playPodiumFanfare() {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const fanfare = [
    { f: 523.25, t: 0, d: 0.15 },
    { f: 523.25, t: 0.16, d: 0.15 },
    { f: 523.25, t: 0.32, d: 0.15 },
    { f: 659.25, t: 0.48, d: 0.4 },
    { f: 587.33, t: 0.9, d: 0.15 },
    { f: 659.25, t: 1.08, d: 0.15 },
    { f: 783.99, t: 1.26, d: 0.8 },
  ]
  fanfare.forEach(({ f, t, d }) => {
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, now + t)

      gain.gain.setValueAtTime(0.001, now + t)
      gain.gain.linearRampToValueAtTime(0.22, now + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + t)
      osc.stop(now + t + d + 0.05)
    } catch {}
  })
}

/** Upbeat dynamic background loop for lobby or suspense during questions */
export function startBlitzBgm(mode: 'lobby' | 'question' = 'lobby') {
  stopBlitzBgm()
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return

  let active = true
  let step = 0
  let timerId: number | null = null

  // 124 BPM -> 16th note ~ 121ms
  const bpm = mode === 'question' ? 134 : 118
  const intervalMs = (60 / bpm / 4) * 1000

  // Fun pentatonic bassline & groove chords
  const lobbyBass = [130.81, 0, 130.81, 164.81, 0, 196.0, 0, 164.81, 146.83, 0, 146.83, 174.61, 0, 220.0, 0, 196.0]
  const questionBass = [110.0, 110.0, 0, 110.0, 130.81, 0, 110.0, 0, 98.0, 98.0, 0, 98.0, 123.47, 0, 110.0, 0]

  const bassPattern = mode === 'question' ? questionBass : lobbyBass

  function tick() {
    if (!active || !ctx) return
    const now = ctx.currentTime
    const bassNote = bassPattern[step % bassPattern.length]

    if (bassNote > 0) {
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = mode === 'question' ? 'sawtooth' : 'triangle'
        osc.frequency.setValueAtTime(bassNote, now)

        const vol = mode === 'question' ? 0.07 : 0.08
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.linearRampToValueAtTime(vol, now + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (intervalMs / 1000) * 1.5)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.3)
      } catch {}
    }

    // Hi-hat / shaker rhythm on off-beats
    if (step % 2 === 1) {
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(8000 + Math.random() * 1000, now)

        gain.gain.setValueAtTime(0.001, now)
        gain.gain.linearRampToValueAtTime(0.02, now + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.05)
      } catch {}
    }

    step++
    timerId = window.setTimeout(tick, intervalMs)
  }

  tick()

  currentBgmNodes = {
    stop: () => {
      active = false
      if (timerId != null) clearTimeout(timerId)
    },
  }
}

export function stopBlitzBgm() {
  if (currentBgmNodes) {
    currentBgmNodes.stop()
    currentBgmNodes = null
  }
}
