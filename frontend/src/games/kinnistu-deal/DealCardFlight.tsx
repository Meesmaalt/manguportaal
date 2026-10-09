import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { CardFace } from './DealCards'
import { COLOR_STYLE, type DealCard, type DealEventAnimation } from './types'
import { takeFlightOrigin } from './flightOrigin'

type Point = { x: number; y: number }
type Flight = { id: string; card: DealCard; from: Point; to: Point; delay: number; amount?: number }

/** Render public event cards only; other players' private draws are never shown. */
export default function DealCardFlight({ event, arena }: { event?: DealEventAnimation | null; arena: RefObject<HTMLDivElement | null> }) {
  const [flights, setFlights] = useState<Flight[]>([])
  const seen = useRef(new Set<string>())
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear() }, [])
  useEffect(() => {
    if (!event || seen.current.has(event.id) || Date.now() - event.timestamp > 6000 || !arena.current) return
    seen.current.add(event.id)
    if (seen.current.size > 256) seen.current.delete(seen.current.values().next().value!)
    const root = arena.current
    // Offscreen phone lanes enter/exit at the viewport edge instead of hiding the whole flight.
    const point = (el: Element | null, fallback: Point): Point => {
      if (!el) return fallback
      const r = el.getBoundingClientRect()
      return { x: Math.max(54, Math.min(innerWidth - 54, r.left + r.width / 2)), y: Math.max(75, Math.min(innerHeight - 75, r.top + r.height / 2)) }
    }
    const middle = point(root.querySelector('.arena-table-line'), { x: innerWidth / 2, y: innerHeight / 2 })
    const seat = (index: number) => root.querySelector(`[data-deal-seat="${index}"]`)
    const hand = document.querySelector(`[data-deal-hand="${event.actorIndex}"]`)
    const theft = ['sly_deal', 'forced_deal', 'deal_breaker'].includes(event.kind)
    const cards = event.cards?.length ? event.cards : event.card ? [event.card] : []
    if (!cards.length) return
    const created = cards.slice(0, 6).map((card, i): Flight => {
      const reverse = theft && !(event.kind === 'forced_deal' && i === 1)
      const from = takeFlightOrigin(card.id) ?? (reverse ? point(seat(event.targetIndex!), middle) : point(hand, point(seat(event.actorIndex), middle)))
      let to = point(event.targetIndex != null ? seat(reverse ? event.actorIndex : event.targetIndex) : root.querySelector(`[data-deal-lane="${event.actorIndex}"] .arena-property-row`), middle)
      if (card.kind === 'property' && event.targetIndex == null) to = point(root.querySelector(`[data-deal-card="${card.id}"]`), to)
      if (event.kind === 'money_bank') to = point(seat(event.actorIndex), middle)
      if (event.kind === 'card_played' && event.targetIndex == null) to = middle
      return { id: `${event.id}-${i}`, card, from, to, delay: i * 90, amount: i === 0 ? event.amount : undefined }
    })
    setFlights(old => [...old, ...created].slice(-18))
    // Keep each event's fallback alive when subsequent events arrive rapidly.
    const timer = setTimeout(() => {
      setFlights(old => old.filter(f => !created.some(c => c.id === f.id)))
      timers.current.delete(timer)
    }, 2100)
    timers.current.add(timer)
  }, [event?.id, arena])
  return createPortal(<div className="deal-flight-layer" aria-hidden="true">{flights.map(f => <div key={f.id} className="deal-flight" style={{
    '--from-x': `${f.from.x}px`, '--from-y': `${f.from.y}px`, '--to-x': `${f.to.x}px`, '--to-y': `${f.to.y}px`,
    '--flight-ink': f.card.kind === 'money' ? '#8bffc0' : f.card.kind === 'property' ? COLOR_STYLE[f.card.color].bg : '#ffdb86',
    animationDelay: `${f.delay}ms`,
  } as CSSProperties} onAnimationEnd={e => { if (e.target === e.currentTarget) setFlights(old => old.filter(x => x.id !== f.id)) }}>
    <div className="deal-flight-trail"/><CardFace card={f.card}/><span className="deal-flight-impact"/>
    <span className="deal-flight-sparks">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--spark-angle': `${i * 45}deg`, animationDelay: `${f.delay}ms` } as CSSProperties}/>)}</span>
    {f.amount != null && <strong className="deal-flight-amount" style={{ animationDelay: `${f.delay}ms` }}>{f.amount}M</strong>}
  </div>)}</div>, document.body)
}
