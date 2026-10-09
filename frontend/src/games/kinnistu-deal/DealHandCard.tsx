import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Grip } from 'lucide-react'
import { CardFace } from './DealCards'
import type { DealCard } from './types'
import { rememberFlightOrigin } from './flightOrigin'

/** Dedicated grip keeps swiping the hand and tapping cards predictable on phones. */
export default function DealHandCard({ card, disabled, selected, discarding, onSelect, onPlay }: {
  card: DealCard; disabled: boolean; selected: boolean; discarding: boolean;
  onSelect: () => void; onPlay: (bank?: boolean) => void;
}) {
  const root = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const position = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)
  const start = useRef({ x: 0, y: 0 })
  function cancel() { position.current = null; setDrag(null) }
  useEffect(() => { if (disabled || discarding) { position.current = null; setDrag(null) } }, [disabled, discarding])
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel() }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])
  function play(bank = false, point?: { x: number; y: number }) {
    const r = root.current?.getBoundingClientRect()
    if (point || r) rememberFlightOrigin(card.id, point ?? { x: r!.left + r!.width / 2, y: r!.top + 90 })
    onPlay(bank)
  }
  function begin(e: PointerEvent<HTMLButtonElement>) {
    if (disabled || discarding || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }; moved.current = false
    position.current = start.current; setDrag(start.current)
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    if (!position.current) return
    if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) moved.current = true
    position.current = { x: e.clientX, y: e.clientY }; setDrag(position.current)
  }
  function drop(e: PointerEvent<HTMLButtonElement>) {
    if (!position.current) return
    const point = { x: e.clientX, y: e.clientY }
    const zone = document.elementFromPoint(point.x, point.y)?.closest('[data-deal-drop]')?.getAttribute('data-deal-drop')
    const table = document.elementFromPoint(point.x, point.y)?.closest('.deal-arena')
    cancel()
    if (moved.current && !disabled && (zone || table)) play(zone === 'bank', point)
  }
  return <div ref={root} className={`deal-hand-card ${drag ? 'deal-card-dragging' : ''}`} data-deal-hand-card={card.id}>
    <CardFace card={card} large selected={selected} disabled={disabled} onClick={() => discarding ? onSelect() : play()}/>
    {!discarding && <button type="button" className="deal-drag-grip" disabled={disabled} aria-label="Lohista kaart mängu või panka" onPointerDown={begin} onPointerMove={move} onPointerUp={drop} onPointerCancel={cancel}><Grip size={14}/> Lohista</button>}
    {card.kind === 'action' && !discarding && !disabled && <button className="deal-bank-choice" onClick={() => play(true)}>Panka · {card.value}M</button>}
    {drag && createPortal(<div className="deal-drag-layer">
      <div className="deal-drag-ghost" style={{ left: drag.x, top: drag.y }}><CardFace card={card}/></div>
      <div className="deal-drop-tray"><div data-deal-drop="play">✦ Mängi kaart</div><div data-deal-drop="bank">◈ Panka · {card.value}M</div></div>
    </div>, document.body)}
  </div>
}
