// Procedural Web Audio Soundscape for "Kes tahab saada miljonäriks"
class MiljonarAudioEngine {
  private ctx: AudioContext | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private droneOsc: OscillatorNode | null = null
  private droneGain: GainNode | null = null
  private heartbeatInterval: number | null = null
  private isMuted: boolean = false
  private currentTier: number = 1

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new AudioCtx()

      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime)
      this.musicGain.connect(this.masterGain)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime)
      this.sfxGain.connect(this.masterGain)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  setMuted(muted: boolean) {
    this.isMuted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime)
    }
  }

  // Suspense Drone & Heartbeat that scales with question level (1 to 15)
  startSuspenseDrone(tierIndex: number) {
    if (this.isMuted) return
    const ctx = this.getContext()
    this.currentTier = tierIndex + 1

    this.stopSuspenseDrone()

    const now = ctx.currentTime
    const droneGain = ctx.createGain()
    droneGain.gain.setValueAtTime(0.001, now)
    droneGain.gain.exponentialRampToValueAtTime(0.2, now + 1.5)
    droneGain.connect(this.musicGain!)

    // Base pitch depends on tier
    // Tiers 1-5: Root D2 (73.4 Hz)
    // Tiers 6-10: Root F#2 (92.5 Hz)
    // Tiers 11-15: Root A2 (110 Hz) with detuned oscillator
    const baseFreq = this.currentTier <= 5 ? 73.4 : this.currentTier <= 10 ? 92.5 : 110.0

    const osc1 = ctx.createOscillator()
    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(baseFreq, now)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now) // fifth

    // Filter to give it dark, cinematic television warmth
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(this.currentTier <= 5 ? 280 : this.currentTier <= 10 ? 420 : 600, now)

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(droneGain)

    osc1.start(now)
    osc2.start(now)

    this.droneOsc = osc1
    this.droneGain = droneGain

    // Start heartbeat pulse if tier >= 6
    if (this.currentTier >= 6) {
      const intervalMs = this.currentTier >= 11 ? 1000 : 1400
      this.heartbeatInterval = window.setInterval(() => {
        this.playHeartbeat()
      }, intervalMs)
    }
  }

  stopSuspenseDrone() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.droneGain && this.ctx) {
      try {
        const now = this.ctx.currentTime
        this.droneGain.gain.cancelScheduledValues(now)
        this.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
        setTimeout(() => {
          try {
            this.droneGain?.disconnect()
          } catch {}
        }, 600)
      } catch {}
      this.droneGain = null
    }
  }

  private playHeartbeat() {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime

    // Double thump: lub-dub
    const thump = (time: number, freq: number, gainVal: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, time)
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.15)

      gain.gain.setValueAtTime(gainVal, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)

      osc.connect(gain)
      gain.connect(this.musicGain!)
      osc.start(time)
      osc.stop(time + 0.2)
    }

    thump(now, 65, 0.45)
    thump(now + 0.16, 55, 0.3)
  }

  // Sound when an answer is locked ("Kas see on sinu lõplik vastus?")
  playLockAnswer() {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime

    // Heavy metallic strike + rising tension shimmer
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.3)

    gain.gain.setValueAtTime(0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

    osc.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start(now)
    osc.stop(now + 0.7)

    // Sub thud
    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(80, now)
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.4)
    subGain.gain.setValueAtTime(0.7, now)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    sub.connect(subGain)
    subGain.connect(this.sfxGain!)
    sub.start(now)
    sub.stop(now + 0.5)
  }

  // Sound when answer is revealed as CORRECT
  playCorrectAnswer(tierIndex: number) {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime
    const tier = tierIndex + 1

    this.stopSuspenseDrone()

    const playChord = (notes: number[], duration: number, isMajorTriumphant: boolean) => {
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = isMajorTriumphant ? 'sawtooth' : 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.04)

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(isMajorTriumphant ? 1800 : 1200, now)

        gain.gain.setValueAtTime(0.001, now + idx * 0.04)
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.04 + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.sfxGain!)
        osc.start(now + idx * 0.04)
        osc.stop(now + duration + 0.1)
      })
    }

    if (tier === 15) {
      // 1 000 000 € THE ULTIMATE FANFARE
      // Arpeggio & massive triumphant brass chord: C4, E4, G4, C5, E5, G5
      const fanfareNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]
      fanfareNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)

        gain.gain.setValueAtTime(0.001, now + idx * 0.08)
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.08 + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5)

        osc.connect(gain)
        gain.connect(this.sfxGain!)
        osc.start(now + idx * 0.08)
        osc.stop(now + 3.6)
      })
    } else if (tier === 5 || tier === 10) {
      // Milestone Safe Haven Reached! (1 000 € or 32 000 €)
      playChord([220, 277.18, 329.63, 440, 554.37], 2.2, true)
    } else if (tier >= 11) {
      // High tier correct
      playChord([293.66, 369.99, 440, 587.33], 1.8, true)
    } else {
      // Standard correct
      playChord([329.63, 415.3, 493.88, 659.25], 1.4, false)
    }
  }

  // Sound when answer is revealed as WRONG
  playWrongAnswer() {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime

    this.stopSuspenseDrone()

    // Dramatic descending minor dissonance / brass fall
    const freqs = [293.66, 277.18, 261.63, 246.94]
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(f, now + i * 0.12)
      osc.frequency.exponentialRampToValueAtTime(f * 0.75, now + i * 0.12 + 1.2)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, now)

      gain.gain.setValueAtTime(0.3, now + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(now + i * 0.12)
      osc.stop(now + 2.1)
    })
  }

  // 50:50 Lifeline Whoosh
  playFiftyFifty() {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.35)

    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start(now)
    osc.stop(now + 0.45)
  }

  // Phone clock tick
  playClockTick() {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1200, now)

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start(now)
    osc.stop(now + 0.06)
  }

  // Phone Ring
  playPhoneRing() {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime

    const ring = (offset: number) => {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc1.type = 'sine'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(440, now + offset)
      osc2.frequency.setValueAtTime(480, now + offset)

      gain.gain.setValueAtTime(0.2, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.4)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.sfxGain!)
      osc1.start(now + offset)
      osc2.start(now + offset)
      osc1.stop(now + offset + 0.45)
      osc2.stop(now + offset + 0.45)
    }

    ring(0)
    ring(0.5)
  }

  // Audience vote reveal chime
  playAudienceReveal() {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, now)
    osc.frequency.linearRampToValueAtTime(1046.5, now + 0.3)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start(now)
    osc.stop(now + 0.55)
  }

  // Walk Away money prize fanfare
  playWalkAway() {
    if (this.isMuted) return
    const ctx = this.getContext()
    const now = ctx.currentTime

    this.stopSuspenseDrone()

    const notes = [392.0, 523.25, 659.25, 783.99]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.1)

      gain.gain.setValueAtTime(0.3, now + idx * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)

      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(now + idx * 0.1)
      osc.stop(now + 1.9)
    })
  }
}

export const miljonarAudio = new MiljonarAudioEngine()
