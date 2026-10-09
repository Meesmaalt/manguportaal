import { useEffect, useState } from 'react'
import type { DealEventAnimation } from './types'
import { playFx } from '@/lib/audio'
/** A small non-blocking announcement; cards travel on the table itself. */
export default function DealActionTheater({event,compact=false}:{event?:DealEventAnimation|null;compact?:boolean}) {
 const [visible,setVisible]=useState(false)
 useEffect(()=>{
  if(!event?.id || Date.now()-event.timestamp>6000)return
  setVisible(true)
  const effect=event.kind==='just_say_no'?'deal_shield':event.kind==='deal_breaker'?'deal_breaker':event.kind==='sly_deal'||event.kind==='forced_deal'?'deal_steal':event.kind==='house_built'||event.kind==='hotel_built'?'deal_build':event.kind==='money_bank'?'deal_coins':event.kind==='pay_completed'?'deal_cash':'deal_card'
  playFx(effect)
  const id=setTimeout(()=>setVisible(false),compact?1800:2400)
  return()=>clearTimeout(id)
 },[event?.id,compact])
 if(!visible||!event)return null
 return <div className="deal-action-toast" role="status"><strong>{event.actorName}</strong><span>{event.message}</span>{event.targetName&&<small>→ {event.targetName}</small>}</div>
}
