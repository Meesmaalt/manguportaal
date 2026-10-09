import { useEffect, useId, useState, type RefObject } from 'react'
import { Cog, Flame } from 'lucide-react'
import type { KinnistuDealState } from './types'

export default function DealTableEffects({ arena, state, aiming }: { arena: RefObject<HTMLDivElement | null>; state: KinnistuDealState; aiming: boolean }) {
  const [lit, setLit] = useState(true)
  const [spins, setSpins] = useState(0)
  const [path, setPath] = useState('')
  const marker = useId().replace(/:/g, '')
  useEffect(() => {
    const root = arena.current
    if (!root) return
    let target: Element | null = null
    function draw() {
      const from = root!.querySelector(`[data-deal-seat="${state.pending?.from ?? state.current}"] .arena-portrait`)
      const to = target ?? (state.pending?.target != null ? root!.querySelector(`[data-deal-seat="${state.pending.target}"] .arena-portrait`) : null)
      if (!from || !to || (!aiming && !['defend', 'pay'].includes(state.phase))) { setPath(''); return }
      const r = root!.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect()
      const x = a.left + a.width / 2 - r.left, y = a.top + a.height / 2 - r.top
      const tx = b.left + b.width / 2 - r.left, ty = b.top + b.height / 2 - r.top
      setPath(`M ${x} ${y} Q ${(x + tx) / 2 + 65} ${(y + ty) / 2} ${tx} ${ty}`)
    }
    const hover = (e: Event) => { target = aiming && e.target instanceof Element ? e.target.closest('.arena-seat.arena-target') : null; draw() }
    const leave = () => { target = null; draw() }
    const observer = new ResizeObserver(draw); observer.observe(root)
    root.addEventListener('pointerover', hover); root.addEventListener('focusin', hover)
    root.addEventListener('pointerleave', leave); root.addEventListener('focusout', leave)
    window.addEventListener('resize', draw); window.addEventListener('scroll', draw, true); draw()
    return () => { observer.disconnect(); root.removeEventListener('pointerover', hover); root.removeEventListener('focusin', hover); root.removeEventListener('pointerleave', leave); root.removeEventListener('focusout', leave); window.removeEventListener('resize', draw); window.removeEventListener('scroll', draw, true) }
  }, [arena, aiming, state.pending?.target, state.pending?.from, state.current, state.phase])
  useEffect(() => {
    const event = state.lastEvent, root = arena.current
    if (!root || !event || Date.now() - event.timestamp > 6000 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = root.querySelector(`[data-deal-seat="${event.targetIndex ?? event.actorIndex}"] .arena-portrait`)
    const card = event.card && root.querySelector(`[data-deal-card="${event.card.id}"]`)
    const animations = [target, card].filter(Boolean).map(el => el!.animate([
      { filter: 'brightness(1)', transform: 'scale(1)' },
      { filter: 'brightness(2)', transform: 'scale(1.1)' },
      { filter: 'brightness(1)', transform: 'scale(1)' },
    ], { duration: 650, delay: 900, easing: 'ease-out' }))
    return () => animations.forEach(a => a.cancel())
  }, [arena, state.lastEvent?.id])
  return <>
    <div className={`deal-table-scenery ${lit ? 'scenery-lit' : ''}`} aria-label="Laua dekoratsioonid">
      <button className="deal-table-lamp" onClick={() => setLit(!lit)} aria-label="Laua latern" aria-pressed={lit}><Flame size={22}/></button>
      <button className="deal-table-cog" onClick={() => setSpins(s => s + 1)} aria-label="Keera laua hammasratast"><Cog size={30} style={{ transform: `rotate(${spins * 120}deg)` }}/></button>
    </div>
    <svg className="deal-aim-line" aria-hidden="true"><defs><marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ffdb86"/></marker></defs>{path && <path d={path} markerEnd={`url(#${marker})`}/>}</svg>
  </>
}
