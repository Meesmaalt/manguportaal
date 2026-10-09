import { useRef } from 'react'
import DealTableEffects from './DealTableEffects'
import DealCardFlight from './DealCardFlight'
import { Coins, Crown, Landmark, Shield, Sparkles } from 'lucide-react'
import type { KinnistuDealState, PlayerBoard, PropColor } from './types'
import { SET_SIZE, COLOR_STYLE, bankTotal, completeSets, rentForSet } from './types'
import { CardFace } from './DealCards'

function Seat({ player, index, state, selectable, onSelect }: { player: PlayerBoard; index: number; state: KinnistuDealState; selectable?: boolean; onSelect?: () => void }) {
 const active=index===state.current&&state.phase!=='over';const winner=index===state.winner&&state.phase==='over';const Tag=selectable?'button':'div'
 return <Tag type={selectable?'button':undefined} onClick={onSelect} data-deal-seat={index} className={`arena-seat ${active?'seat-active':''} ${selectable?'arena-target':''}`}>
   <span className="arena-portrait" style={{'--seat-hue':`${index*65+190}deg`} as React.CSSProperties}>{winner?<Crown size={28}/>:<Shield size={28}/>}<b>{player.name.slice(0,1).toUpperCase()}</b></span>
   <span className="arena-seat-info"><strong>{player.name}</strong><span><Coins size={12}/>{bankTotal(player)}M · {completeSets(player)}/{state.packData?.winSets??3} komplekti</span></span>
   <span className="arena-hand-count"><span className="mini-card-back"/>{player.hand.length}</span>
   {active&&<span className="arena-turn-gems" aria-label={`${state.playsLeft} kaardikäiku alles`}>{[0,1,2].map(n=><i key={n} className={n<state.playsLeft?'gem-lit':''}/>)}</span>}
 </Tag>
}
export default function DealArena({ state, viewer, busy=false, targetMode=false, onTarget, onProperty, propertyIds=[], onColor, colors=[], targetIndices }: {
 targetIndices?: number[]; state: KinnistuDealState; viewer?: number; busy?: boolean; targetMode?: boolean; onTarget?:(index:number)=>void;
 onProperty?:(id:string)=>void; propertyIds?:string[]; onColor?:(color:PropColor)=>void; colors?:PropColor[];
}) {
 const arena=useRef<HTMLDivElement>(null)
 const focus=viewer??(state.phase==='over'?state.winner??0:state.current)
 function lane(player:PlayerBoard,index:number,own=false){
  const used=(Object.keys(SET_SIZE) as PropColor[]).filter(c=>(player.props[c]||[]).length>0)
  return <section key={player.token} data-deal-lane={index} className={`arena-player-lane ${own?'arena-home-lane':''} ${(state.pending?.responseIndex ?? state.pending?.target)===index?'lane-threatened':''}`}>
   <Seat player={player} index={index} state={state} selectable={!busy&&targetMode&&viewer!==index&&(targetIndices==null||targetIndices.includes(index))} onSelect={()=>onTarget?.(index)}/>
   <div className="arena-property-row">
    {!used.length&&<div className="arena-empty-slot"><Landmark size={28}/><span>Kinnistud mängitakse siia</span></div>}
    {used.map(color=>{const cards=player.props[color]||[];const done=cards.length>=SET_SIZE[color];return <div key={color} className={`arena-set ${done?'arena-set-complete':''}`} style={{'--set-color':COLOR_STYLE[color].bg} as React.CSSProperties}>
     <div className="arena-set-cards">{cards.map((card,i)=><div key={card.id} data-deal-card={card.id} className="arena-property-card" style={{'--card-tilt':`${(i-(cards.length-1)/2)*3}deg`} as React.CSSProperties}>
      <CardFace card={card} small selected={propertyIds.includes(card.id)} onClick={!busy&&propertyIds.includes(card.id)?()=>onProperty?.(card.id):undefined}/>
     </div>)}</div>
     <button type="button" disabled={busy||!own||!colors.includes(color)} onClick={()=>onColor?.(color)} className={`arena-set-label ${own&&colors.includes(color)?'arena-target':''}`}>
      <span>{COLOR_STYLE[color].label} {cards.length}/{SET_SIZE[color]}{done?' ✓':''}</span><strong>{rentForSet(player,color)}M üür</strong>
     </button>
     {player.buildings?.[color]&&<span className="arena-building-medal">{player.buildings[color]==='hotel'?'♜ Hotell':'⌂ Maja'}</span>}
    </div>})}
   </div>
  </section>
 }
 return <div ref={arena} className="card-arena deal-arena">
   <DealTableEffects arena={arena} state={state} aiming={targetMode}/>
   <DealCardFlight event={state.lastEvent} arena={arena}/>
   <div className="arena-opponents">{state.players.map((p,i)=>i===focus?null:lane(p,i))}</div>
   <div className="arena-table-line"><span className="arena-deck" aria-label={`${state.deck.length} kaarti pakis`}>KD<small>{state.deck.length}</small></span><div className="arena-moment"><Sparkles size={16}/><strong>{state.phase==='over'?`${state.players[state.winner??0]?.name} võitis!`:state.log[0]||'Kogu kinnistukomplekte'}</strong><span>Käik {(state.turnCount??0)+1} · {state.discard.length} kaarti maas</span></div><span className="arena-discard">{state.discard.length? <CardFace card={state.discard[state.discard.length-1]} small/>:<span>↺</span>}</span></div>
   {state.players[focus]&&lane(state.players[focus],focus,true)}
 </div>
}
