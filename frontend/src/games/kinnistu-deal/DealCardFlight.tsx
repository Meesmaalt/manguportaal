import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { CardFace } from './DealCards'
import type { DealCard, DealEventAnimation } from './types'

type Flight = { id: string; card: DealCard; from: {x:number;y:number}; to: {x:number;y:number}; delay: number }
/** Use actual rendered seats and card lanes, including the viewer's phone hand. */
export default function DealCardFlight({event,arena}:{event?:DealEventAnimation|null;arena:RefObject<HTMLDivElement|null>}) {
 const [flights,setFlights]=useState<Flight[]>([])
 const seen=useRef(new Set<string>())
 useEffect(()=>{
  if(!event || seen.current.has(event.id) || Date.now()-event.timestamp>6000 || !arena.current)return
  seen.current.add(event.id)
  const root=arena.current
  const point=(el:Element|null,fallback:{x:number;y:number})=>{if(!el)return fallback;const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}}
  const r=root.getBoundingClientRect();const middle={x:r.left+r.width/2,y:Math.min(innerHeight-100,r.top+r.height/2)}
  const seat=(index:number)=>root.querySelector(`[data-deal-seat="${index}"]`)
  const hand=document.querySelector(`[data-deal-hand="${event.actorIndex}"]`)
  const theft=['sly_deal','forced_deal','deal_breaker'].includes(event.kind)
  const cards=event.cards?.length?event.cards:event.card?[event.card]:[]
  if(!cards.length)return
  const created=cards.slice(0,6).map((card,i)=>{
   const reverse=theft && !(event.kind==='forced_deal'&&i===1)
   const from=reverse?point(seat(event.targetIndex!),middle):point(hand,point(seat(event.actorIndex),middle))
   let to=point(event.targetIndex!=null?seat(reverse?event.actorIndex:event.targetIndex):root.querySelector(`[data-deal-lane="${event.actorIndex}"] .arena-property-row`),middle)
   if(card.kind==='property'&&event.targetIndex==null)to=point(root.querySelector(`[data-deal-card="${card.id}"]`),to)
   if(event.kind==='money_bank')to=point(seat(event.actorIndex),middle)
   if(event.kind==='card_played'&&event.targetIndex==null)to=middle
   return {id:`${event.id}-${i}`,card,from,to,delay:i*90}
  })
  setFlights(old=>[...old,...created])
  const timer=setTimeout(()=>setFlights(old=>old.filter(f=>!created.some(c=>c.id===f.id))),1900)
  return()=>clearTimeout(timer)
 },[event?.id,arena])
 // Remove previous flights as well when cards are played rapidly; animationEnd handles each flight.
 return createPortal(<div className="deal-flight-layer" aria-hidden="true">{flights.map(f=><div key={f.id} className="deal-flight" style={{'--from-x':`${f.from.x}px`,'--from-y':`${f.from.y}px`,'--to-x':`${f.to.x}px`,'--to-y':`${f.to.y}px`,animationDelay:`${f.delay}ms`} as CSSProperties} onAnimationEnd={()=>setFlights(old=>old.filter(x=>x.id!==f.id))}><div className="deal-flight-trail"/><CardFace card={f.card}/><span className="deal-flight-impact"/></div>)}</div>,document.body)
}
