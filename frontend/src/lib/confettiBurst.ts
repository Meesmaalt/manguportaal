import confetti from 'canvas-confetti'

/** Safe wrapper — avoids object-literal quirks in some builds. */
export function confettiBurst(opts?: {
  particleCount?: number
  spread?: number
  y?: number
}) {
  const particleCount = opts?.particleCount ?? 120
  const spread = opts?.spread ?? 70
  const y = opts?.y ?? 0.6
  confetti({
    particleCount,
    spread,
    origin: { y },
  })
}
