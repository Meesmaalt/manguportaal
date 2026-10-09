// Only remember the current viewer's intentional play, never another player's hand.
const origins = new Map<string, { x: number; y: number; at: number }>()
export function rememberFlightOrigin(id: string, point: { x: number; y: number }) {
  origins.clear()
  origins.set(id, { ...point, at: Date.now() })
}
export function takeFlightOrigin(id: string) {
  const origin = origins.get(id)
  origins.delete(id)
  return origin && Date.now() - origin.at < 5000 ? origin : undefined
}
