import { useEffect, useState } from 'react'
import type { KinnistuDealState } from './types'
export default function DealTurnStatus({state}:{state:KinnistuDealState}) {
 const [now,setNow]=useState(Date.now())
 useEffect(()=>{setNow(Date.now());if(state.turnEndAt==null)return;const id=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(id)},[state.turnEndAt])
 if(state.phase==='discard_hand')return <div className="deal-turn-status" role="status">{state.players[state.current]?.name} valib {Math.max(0,state.players[state.current].hand.length-7)} üleliigset kaarti. Käsi peab jääma seitsme kaardi piiresse.</div>
 if(state.phase!=='turn'||state.turnEndAt==null)return null
 const seconds=Math.max(0,Math.ceil((state.turnEndAt-now)/1000))
 return <div className="deal-turn-status deal-countdown" role="status"><span className="deal-countdown-dial" style={{'--countdown':Math.max(0,(state.turnEndAt-now)/5000)} as React.CSSProperties}>{seconds}</span><div><strong>Käik lõpeb {seconds} sekundi pärast</strong><small>Kõik kaardikäigud tehtud · järgmine: {state.players[(state.current+1)%state.players.length]?.name}</small></div></div>
}
