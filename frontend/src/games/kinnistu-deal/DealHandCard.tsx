import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Landmark, Coins, X } from 'lucide-react'
import { CardFace } from './DealCards'
import type { DealCard } from './types'
import { rememberFlightOrigin } from './flightOrigin'

/** Vajuta kaarti → avaneb suur eelvaade nuppudega „Mängi“ / „Panka“. Lohistamist pole vaja. */
export default function DealHandCard({ card, disabled, selected, discarding, onSelect, onPlay }: {
  card: DealCard; disabled: boolean; selected: boolean; discarding: boolean;
  onSelect: () => void; onPlay: (bank?: boolean) => void;
}) {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => { if (disabled || discarding) setOpen(false) }, [disabled, discarding])
  useEffect(() => {
    if (!open) return
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [open])
  function play(bank: boolean) {
    const r = root.current?.getBoundingClientRect()
    if (r) rememberFlightOrigin(card.id, { x: r.left + r.width / 2, y: r.top + 90 })
    setOpen(false)
    onPlay(bank)
  }
  const isMoney = card.kind === 'money'
  const isAction = card.kind === 'action'
  return <div ref={root} className="deal-hand-card" data-deal-hand-card={card.id}>
    <CardFace card={card} large selected={selected} disabled={disabled} onClick={() => discarding ? onSelect() : setOpen(true)}/>
    {open && createPortal(<div className="deal-sheet-backdrop" role="dialog" aria-modal="true" aria-label="Vali kaardi käik" onClick={() => setOpen(false)}>
      <div className="deal-sheet" onClick={e => e.stopPropagation()}>
        <button type="button" className="deal-sheet-close" aria-label="Sulge" onClick={() => setOpen(false)}><X size={18}/></button>
        <div className="deal-sheet-card"><CardFace card={card} large/></div>
        <div className="deal-sheet-actions">
          {isMoney
            ? <button type="button" className="deal-sheet-btn deal-sheet-bank" onClick={() => play(true)}><Coins size={18}/> Pane panka · {card.value}M</button>
            : <>
              <button type="button" className="deal-sheet-btn deal-sheet-play" onClick={() => play(false)}><Landmark size={18}/> {isAction ? 'Mängi tegevus' : 'Pane lauale'}</button>
              {isAction && <button type="button" className="deal-sheet-btn deal-sheet-bank" onClick={() => play(true)}><Coins size={18}/> Panka · {card.value}M</button>}
            </>}
          <button type="button" className="deal-sheet-btn deal-sheet-cancel" onClick={() => setOpen(false)}>Tühista</button>
        </div>
      </div>
    </div>, document.body)}
  </div>
}
