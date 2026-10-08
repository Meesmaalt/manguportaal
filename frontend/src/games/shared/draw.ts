/** Draw without replacement. Index history is session data, so refresh preserves it. */
export function drawUnused(pool: string[], used: number[], random = Math.random): number | null {
  const available = pool.map((_, i) => i).filter(i => !used.includes(i))
  if (!available.length) return null
  return available[Math.min(available.length - 1, Math.max(0, Math.floor(random() * available.length)))]
}
