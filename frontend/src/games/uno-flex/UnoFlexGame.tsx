import { useEffect, useRef, useState } from 'react'
import { COLORS, COLOR_LABEL, LABELS, canPlay, type FlexCommand, type FlexState } from './rules'
import FlexCard, { INK } from './FlexCard'
import { sendFlexCommand } from './session'
import { appUrl } from '@/lib/config'
import { playFx } from '@/lib/audio'
import { confettiBurst } from '@/lib/confettiBurst'
import { Copy, Trophy, Zap, BookOpen } from 'lucide-react'

export default function UnoFlexGame({state,sessionId,viewer,isHost=false,isTv=false,onState}:{state:FlexState;sessionId?:string;viewer?:number;isHost?:boolean;isTv?:boolean;onState?:(s:FlexState)=>void}) {
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const lock=useRef(false)
 const [selected,setSelected]=useState<string|null>(null);const [flex,setFlex]=useState(false);const [color,setColor]=useState<typeof COLORS[number]>('red');const [target,setTarget]=useState<number|undefined>();const [help,setHelp]=useState(false);const [copied,setCopied]=useState<string|null>(null)
 const me=viewer!=null?state.players[viewer]:undefined;const card=me?.hand.find(c=>c.id===selected)
 const myTurn=state.phase==='turn'&&state.current===viewer
 const focus=viewer??state.current;const top=state.discard[state.discard.length-1]
 useEffect(()=>{setSelected(null);setFlex(false);setTarget(undefined)},[state.revision])
 useEffect(()=>{if(state.phase==='over'){confettiBurst({particleCount:100,spread:70,y:.65});playFx('victory')}},[state.phase,state.winner])
 async function act(command:FlexCommand) {
  if(!sessionId||lock.current)return
  lock.current=true;setBusy(true);setError('')
  try {const next=await sendFlexCommand(sessionId,isHost?state.hostToken:me!.token,command);onState?.(next);playFx('click')}
  catch(e:any){setError(e.message)}finally{lock.current=false;setBusy(false)}
 }
 async function copy(token:string){try{await navigator.clipboard.writeText(appUrl(`/flex/${state.code}/${token}`));setCopied(token)}catch{setError('Kopeeri mängijalink aadressiribalt')}}
 function seat(index:number) {const p=state.players[index];return <div key={p.token} className={`flex-seat ${state.current===index&&state.phase!=='lobby'?'seat-active':''}`}>
  <span className="flex-avatar">{p.name.slice(0,1).toUpperCase()}</span><strong>{p.name}</strong><span>{p.hand.length} kaarti</span><span className={`flex-power ${p.power?'power-ready':''}`}><Zap size={12}/>{p.power?'FLEX valmis':'Jõud kasutatud'}</span>
  {p.uno&&p.hand.length===1&&<b className="text-gold">UNO!</b>}
  {viewer!=null&&state.vulnerable===index&&viewer!==index&&<button disabled={busy} onClick={()=>act({type:'catch',target:index})} className="btn-outline text-xs">Tabasin! +2</button>}
 </div>}
 return <div className={`max-w-[1600px] mx-auto px-2 pb-8 ${isTv?'flex-tv-view':''}`}>
  <div className="flex items-center justify-between mb-3 gap-2"><h1 className="font-display font-black text-gold text-xl">UNO FLEX <span className="text-cyan-300">↯</span></h1><span className="text-white/50 text-xs font-mono">{state.code}</span><button aria-label="Mängureeglid" className="btn-outline text-xs" onClick={()=>setHelp(!help)}><BookOpen size={14}/></button></div>
  {help&&<div className="card-panel p-4 mb-4 text-sm text-white/75 leading-relaxed">Mängi sama värvi, arvu või sümboliga kaart. Roheline jõud lubab kasutada kaardi Flex-värvi või lisategevust; seejärel jõud kulub. Flex-värv aitab sobitada, edasi mängitakse kaardi põhivärviga. Numbrikaardi ↻ pöörab sinu jõu, jõujoker kõigi jõu; kui kõik jõud on kulunud, taastuvad need. +2 ja +4 ei kuhju. Võetud sobiva kaardi võid kohe mängida või käigu lõpetada. Ühe kaardi juures teata UNO; vastane saab enne järgmist käiku unustaja tabada. +4 puhul saab järgmine mängija nõude vastu võtta või vaidlustada. Kõikide kaartide kaotanud mängija võidab vooru.</div>}
  {error&&<div role="alert" className="p-3 mb-3 rounded-xl border border-rose-400 text-rose-200">{error}<button className="ml-3" onClick={()=>setError('')}>×</button></div>}
  {state.phase==='lobby' ? <div className="party-stage p-5 sm:p-8">
   <h2 className="text-2xl font-bold mb-2">Valmista kaardilaud ette</h2><p className="text-white/50 mb-5">2–8 mängijat · igaüks avab oma lingi telefonis · teler näitab lauda.</p>
   <div className="grid sm:grid-cols-2 gap-3">{state.players.map((p,i)=><div key={p.token} className="party-score-card">
    {isHost?<input className="input-field mb-3" aria-label={`Mängija ${i+1} nimi`} defaultValue={p.name} onBlur={e=>{if(e.target.value.trim()!==p.name)act({type:'rename',index:i,name:e.target.value})}}/>:<strong>{p.name}</strong>}
    {isHost&&<><div className="flex gap-3 items-center"><img className="rounded-lg w-20 h-20" alt={`${p.name} liitumiskood`} src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(appUrl(`/flex/${state.code}/${p.token}`))}`}/><div className="space-y-2"><a className="btn-outline text-xs block" href={appUrl(`/flex/${state.code}/${p.token}`)} target="_blank" rel="noreferrer">Ava mängijana</a><button className="btn-outline text-xs flex gap-1 items-center" onClick={()=>copy(p.token)}><Copy size={12}/>{copied===p.token?'Kopeeritud':'Kopeeri link'}</button></div></div>{state.players.length>2&&<button className="text-rose-300 text-xs mt-3" disabled={busy} onClick={()=>act({type:'remove',index:i})}>Eemalda</button>}</>}
   </div>)}</div>
   {isHost?<div className="flex justify-center gap-3 mt-5 flex-wrap"><button disabled={busy||state.players.length>=8} className="btn-outline" onClick={()=>act({type:'add'})}>Lisa mängija</button><button disabled={busy} className="btn-gold" onClick={()=>act({type:'start'})}>Jaga kaardid</button><a className="btn-outline" href={appUrl(`/ekraan/${state.code}`)} target="_blank" rel="noreferrer">Ava teler</a></div>:<p className="text-center text-gold mt-4">Oota kaartide jagamist…</p>}
  </div> : <>
   <div className="card-arena flex-arena" style={{'--active-ink':INK[state.color]} as React.CSSProperties}>
    <div className="flex-opponents">{state.players.map((_,i)=>i!==focus?seat(i):null)}</div>
    <div className="flex-table-mid"><div className="flex-draw-pile"><FlexCard back/><span>{state.deck.length} kaarti pakis</span></div><div className="flex-match-info"><span className="flex-active-color" style={{background:INK[state.color]}}>{COLOR_LABEL[state.color]}</span><strong>{state.phase==='over'?'Voor läbi':`${state.players[state.current]?.name} käik`}</strong><span>{state.direction===1?'↻ Päripäeva':'↺ Vastupäeva'}</span></div><div className="flex-play-pile">{top&&<FlexCard card={top}/>}<span>Viimane kaart</span></div></div>
    <p key={state.lastMove?.id} className="flex-event" aria-live="polite">{state.lastMove?.message||state.log[0]}</p>
    {state.players[focus]&&seat(focus)}
   </div>
   {state.phase==='over'&&<div className="text-center party-stage p-6 mt-4"><Trophy className="mx-auto text-gold mb-2"/><h2 className="text-3xl font-bold">{state.players[state.winner??0]?.name} võitis!</h2>{isHost&&<button disabled={busy} className="btn-gold mt-4" onClick={()=>act({type:'start'})}>Uus voor</button>}</div>}
   {state.phase==='draw4'&&state.challenge?.to===viewer&&<div className="party-stage p-4 mt-4 text-center"><p className="mb-3">Sulle mängiti +4. Kas vastasel oli sobiv värv või joker?</p><button disabled={busy} className="btn-gold mr-2" onClick={()=>act({type:'accept'})}>Võta +4</button><button disabled={busy} className="btn-outline" onClick={()=>act({type:'challenge'})}>Vaidlusta</button><p className="text-xs text-white/50 mt-2">Õnnestumisel tõmbab vastane 4; eksimise korral tõmbad 6.</p></div>}
   {me&&state.phase!=='over'&&<div className="arena-hand-dock mt-4">
    <div className="flex items-center justify-between gap-2 mb-3"><strong>Sinu käsi</strong><span className="text-xs text-white/50">{myTurn?'Sinu käik — vali kaart':'Oota oma käiku'}</span>{me.hand.length<=2&&me.hand.length>0&&<button disabled={busy||me.uno} className="btn-gold text-xs" onClick={()=>act({type:'uno'})}>{me.uno?'UNO ✓':'UNO!'}</button>}</div>
    <div className="arena-card-hand">{me.hand.map(c=><FlexCard key={c.id} card={c} selected={selected===c.id} disabled={!myTurn||busy||!canPlay(state,viewer!,c)&&!canPlay(state,viewer!,c,true)} onClick={()=>{setSelected(c.id);setFlex(!canPlay(state,viewer!,c)&&canPlay(state,viewer!,c,true));setColor(state.color);setTarget(undefined)}}/>)}</div>
    {card&&myTurn&&<div className="flex-card-choice">
     <strong>{card.kind==='number'?card.number:LABELS[card.kind]}</strong>
     {(card.flex||card.flexColor)&&<label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={flex} disabled={!me.power} onChange={e=>setFlex(e.target.checked)}/>Kasuta FLEX-jõudu {card.flexColor?`(${COLOR_LABEL[card.flexColor]})`:''}</label>}
     {card.color==='wild'&&<div className="flex gap-2 flex-wrap">{COLORS.map(c=><button key={c} onClick={()=>setColor(c)} className={`flex-color-pick ${color===c?'color-picked':''}`} style={{background:INK[c]}}>{COLOR_LABEL[c]}</button>)}</div>}
     {flex&&(card.kind==='wild_target2'||card.kind==='wild_draw4')&&<div className="flex gap-2 flex-wrap">{state.players.map((p,i)=>i!==viewer&&<button key={p.token} className={`btn-outline text-sm ${target===i?'border-gold text-gold':''}`} onClick={()=>setTarget(i)}>{p.name}</button>)}</div>}
     <p className="basis-full text-center text-sm text-white/70">{flex ? (card.flexColor ? `Sobitad ${COLOR_LABEL[card.flexColor].toLowerCase()} värviga; edasi mängitakse ${COLOR_LABEL[card.color as typeof COLORS[number]].toLowerCase()} värviga.` : card.kind==='skip' ? 'Kõik vastased jäävad vahele — mängid uuesti.' : card.kind==='reverse' ? 'Suund pöördub ja järgmine vastane jääb vahele.' : card.kind==='draw2' ? 'Iga vastane võtab ühe kaardi. Järgmine mängib.' : card.kind==='wild_all2' ? 'Iga vastane võtab kaks kaarti. Järgmine mängib.' : `Valitud vastane võtab ${card.kind==='wild_draw4'?4:2} kaarti; tema käiku ei jäeta vahele.`) : card.kind==='draw2' ? 'Järgmine võtab kaks kaarti ja jääb vahele.' : card.kind==='wild_draw4' ? 'Järgmine võtab neli ja jääb vahele või vaidlustab nõude.' : card.kind==='wild_flip' ? 'Kõigi mängijate Flex-jõud pöördub.' : card.kind==='skip' ? 'Järgmine vastane jääb vahele.' : card.kind==='reverse' ? 'Mängusuund pöördub.' : card.color==='wild' ? 'Valid järgmise värvi.' : 'Mängi sama värvi, arvu või sümboli peale.'}</p>
     <button disabled={busy||!canPlay(state,viewer!,card,flex)||(flex&&(card.kind==='wild_target2'||card.kind==='wild_draw4')&&target==null)} className="btn-gold" onClick={()=>act({type:'play',cardId:card.id,flex,color,target})}>Mängi kaart</button>
    </div>}
    {myTurn&&<div className="flex justify-center mt-4"><button disabled={busy} className="btn-outline" onClick={()=>act({type:state.drawnId?'pass':'draw'})}>{state.drawnId?'Lõpeta käik':'Võta kaart'}</button></div>}
   </div>}
   {isHost&&<div className="text-center mt-4"><button disabled={busy} className="btn-outline text-xs" onClick={()=>{if(confirm('Lõpetada voor ja avada ooteruum?'))act({type:'reset'})}}>Tagasi ooteruumi</button></div>}
  </>}
 </div>
}
