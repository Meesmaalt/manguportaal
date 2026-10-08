export const COLORS = ['red', 'yellow', 'green', 'blue'] as const
export type Color = typeof COLORS[number]
export type Kind = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild_flip' | 'wild_target2' | 'wild_draw4' | 'wild_all2'
export type FlexCard = { id: string; kind: Kind; color: Color | 'wild'; number?: number; flexColor?: Color; flex?: boolean; flip?: boolean }
export type FlexPlayer = { token: string; name: string; hand: FlexCard[]; power: boolean; uno: boolean }
export type FlexState = {
  game_type: 'uno_flex'; code: string; hostToken: string; phase: 'lobby' | 'turn' | 'draw4' | 'over'; players: FlexPlayer[];
  deck: FlexCard[]; discard: FlexCard[]; current: number; direction: 1 | -1; color: Color;
  drawnId?: string; vulnerable?: number; winner?: number; revision: number; requests: string[];
  challenge?: { from: number; to: number; illegal: boolean }; log: string[]; packData: { startHand: number };
  lastMove?: { id: string; actor: string; message: string; card?: FlexCard; flex?: boolean }; hostBeat?: number;
}
export type FlexCommand =
 | { type: 'play'; cardId: string; flex?: boolean; color?: Color; target?: number }
 | { type: 'draw' | 'pass' | 'uno' | 'challenge' | 'accept' | 'start' | 'reset' | 'add' }
 | { type: 'catch'; target: number }
 | { type: 'rename'; index: number; name: string }
 | { type: 'remove'; index: number }
export const LABELS: Record<Kind,string> = { number: '', skip: 'Vahele', reverse: 'Suund', draw2: '+2', wild_flip: 'Jõud ↻', wild_target2: 'Siht +2', wild_draw4: '+4', wild_all2: 'Kõik +2' }
export const COLOR_LABEL: Record<Color,string> = { red: 'Punane', yellow: 'Kollane', green: 'Roheline', blue: 'Sinine' }
export function shuffle<T>(cards:T[]):T[] { const out=[...cards]; for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]} return out }
/** 104 playable cards plus each player's power indicator. Original digital artwork. */
export function buildFlexDeck():FlexCard[] {
 const cards:FlexCard[]=[]; let id=0
 const add=(card:Omit<FlexCard,'id'>)=>cards.push({...card,id:`f${++id}`})
 COLORS.forEach((color,ci)=>{
  for(let n=1;n<=8;n++){add({kind:'number',color,number:n,flip:n===1||n===5});add({kind:'number',color,number:n,flexColor:COLORS[(ci+(n%3)+1)%4]})}
  for(const kind of ['skip','reverse','draw2'] as const){add({kind,color});add({kind,color,flex:true})}
 })
 for(let i=0;i<4;i++)for(const kind of ['wild_flip','wild_target2','wild_draw4','wild_all2'] as const)add({kind,color:'wild',flex:kind!=='wild_flip'})
 return shuffle(cards)
}
export function initialFlex(code:string,hostToken:string, tokens:string[], startHand=7):FlexState {
 return {game_type:'uno_flex',code,hostToken,phase:'lobby',players:tokens.map((token,i)=>({token,name:`Mängija ${i+1}`,hand:[],power:true,uno:false})),deck:[],discard:[],current:0,direction:1,color:'red',revision:0,requests:[],log:[],packData:{startHand:Number.isFinite(Number(startHand))?Math.max(3,Math.min(10,Math.floor(Number(startHand)))):7}}
}
function next(s:FlexState,steps=1):number { return (s.current+s.direction*steps%s.players.length+s.players.length)%s.players.length }
function replenish(s:FlexState) {if(!s.deck.length&&s.discard.length>1){const top=s.discard.pop()!;s.deck=shuffle(s.discard);s.discard=[top]}}
function take(s:FlexState,index:number,count:number):FlexCard[] {const cards:FlexCard[]=[];for(let n=0;n<count;n++){replenish(s);const card=s.deck.pop();if(!card)break;cards.push(card);s.players[index].hand.push(card)}if(s.players[index].hand.length!==1)s.players[index].uno=false;return cards}
function refreshPower(s:FlexState){if(s.players.every(p=>!p.power))s.players.forEach(p=>p.power=true)}
export function canPlay(s:FlexState,index:number,card:FlexCard,flex=false):boolean {
 if(s.phase!=='turn'||index!==s.current||(s.drawnId&&s.drawnId!==card.id))return false
 if(flex&&(!s.players[index].power||(!card.flex&&!card.flexColor)))return false
 const top=s.discard[s.discard.length-1]
 if(card.color==='wild')return true
 const color=flex&&card.flexColor?card.flexColor:card.color
 return color===s.color||!!top&&(card.kind==='number'?top.kind==='number'&&card.number===top.number:card.kind===top.kind)
}
/** Authoritative reducer; rejects invalid actors, phases, targets and replayed requests. */
export function applyFlex(input:FlexState,token:string,cmd:FlexCommand,requestId:string):FlexState {
 if(input.requests.includes(requestId))return input
 const host=token===input.hostToken;const actor=input.players.findIndex(p=>p.token===token)
 if(!host&&actor<0)throw new Error('See mängijalink ei kuulu sessioonile')
 const s:FlexState=JSON.parse(JSON.stringify(input));let message='';let played:FlexCard|undefined
 function fail(m:string):never { throw new Error(m) }
 if(['start','reset','add','remove','rename'].includes(cmd.type)){
  if(!host)fail('Seda teeb mängujuht')
  if(cmd.type==='reset'){s.phase='lobby';s.players.forEach(p=>{p.hand=[];p.power=true;p.uno=false});s.deck=[];s.discard=[];s.winner=undefined;s.challenge=undefined;s.vulnerable=undefined;s.drawnId=undefined;s.log=[];message='Uus mäng'}
  else if(cmd.type==='start'){
   if(s.phase!=='lobby'&&s.phase!=='over')fail('Mäng juba käib')
   if(s.players.length<2||s.players.length>8)fail('Vaja on 2–8 mängijat')
   s.deck=buildFlexDeck();const opening=s.deck.splice(s.deck.findIndex(c=>c.kind==='number'),1)[0];s.discard=[];s.players.forEach(p=>{p.hand=[];p.power=true;p.uno=false});s.players.forEach((_,i)=>take(s,i,s.packData.startHand));
   s.discard=[opening];s.color=opening.color as Color;s.current=0;s.direction=1;s.phase='turn';s.winner=undefined;s.drawnId=undefined;s.vulnerable=undefined;s.challenge=undefined;message='Kaardid jagatud. Mäng algab!'
  }else{
   if(s.phase!=='lobby')fail('Mängijaid saab muuta ooteruumis')
   if(cmd.type==='add'){if(s.players.length>=8)fail('Maksimaalselt 8 mängijat');s.players.push({token:`${requestId}-player`,name:`Mängija ${s.players.length+1}`,hand:[],power:true,uno:false});message='Mängija lisatud'}
   if(cmd.type==='remove'){if(s.players.length<=2||!s.players[cmd.index])fail('Vähemalt kaks mängijat');s.players.splice(cmd.index,1);message='Mängija eemaldatud'}
   if(cmd.type==='rename'){if(!s.players[cmd.index]||!cmd.name.trim())fail('Sisesta mängija nimi');s.players[cmd.index].name=cmd.name.trim().slice(0,40);message='Nimi muudetud'}
  }
 }else{
  if(actor<0)fail('Ava oma mängijalink')
  if(cmd.type==='uno'){
   if(s.phase==='lobby'||s.phase==='over'||s.players[actor].hand.length<1||s.players[actor].hand.length>2)fail('UNO saab teatada ühe või kahe kaardiga')
   s.players[actor].uno=true;if(s.vulnerable===actor)s.vulnerable=undefined;message=`${s.players[actor].name}: UNO!`
  }else if(cmd.type==='catch'){
   if((s.phase!=='turn'&&s.phase!=='draw4')||s.vulnerable!==cmd.target||cmd.target===actor||s.players[cmd.target]?.hand.length!==1||s.players[cmd.target].uno)fail('UNO tabamiseks pole põhjust')
   take(s,cmd.target,2);s.vulnerable=undefined;message=`${s.players[cmd.target].name} unustas UNO: +2 kaarti`
  }else if(cmd.type==='accept'||cmd.type==='challenge'){
   const c=s.challenge;if(s.phase!=='draw4'||!c||actor!==c.to)fail('Praegu pole sinu +4 otsus')
   if(cmd.type==='challenge'&&c.illegal){take(s,c.from,4);s.current=c.to;message='Vaidlustus õnnestus: +4 mänginud vastane võtab 4 kaarti'}
   else{take(s,c.to,cmd.type==='challenge'?6:4);s.current=(c.to+s.direction+s.players.length)%s.players.length;message=cmd.type==='challenge'?'Vaidlustus ebaõnnestus: +6 ja käik vahele':'Võetud +4, käik vahele'}
   s.challenge=undefined;s.phase='turn';if(!s.players[c.from].hand.length){s.winner=c.from;s.phase='over'}
  }else{
   if(s.phase!=='turn'||s.current!==actor)fail('Oota oma käiku')
   if(cmd.type==='pass'){
    if(!s.drawnId)fail('Kõigepealt võta kaart');s.drawnId=undefined;s.current=next(s);s.vulnerable=undefined;message=`${s.players[actor].name} jätab käigu vahele`
   }else if(cmd.type==='draw'){
    if(s.drawnId)fail('Sellel käigul on kaart juba võetud');s.vulnerable=undefined;const drawn=take(s,actor,1)[0];s.drawnId=drawn?.id
    if(!drawn||(!canPlay(s,actor,drawn)&&!canPlay(s,actor,drawn,true))){s.drawnId=undefined;s.current=next(s)}message=`${s.players[actor].name} võttis kaardi`
   }else if(cmd.type==='play'){
    const p=s.players[actor];const card=p.hand.find(c=>c.id===cmd.cardId);if(!card||!canPlay(s,actor,card,!!cmd.flex))fail('See kaart ei sobi praegu')
    if(card.color==='wild'&&!COLORS.includes(cmd.color as Color))fail('Vali järgmine värv')
    const targeted=!!cmd.flex&&(card.kind==='wild_target2'||card.kind==='wild_draw4')
    if(targeted&&(!Number.isInteger(cmd.target)||cmd.target===actor||!s.players[cmd.target!]))fail('Vali vastane')
    const illegal=card.kind==='wild_draw4'&&!cmd.flex&&p.hand.some(c=>c.id!==card.id&&(c.color===s.color||c.color==='wild'))
    s.vulnerable=undefined;s.drawnId=undefined;p.hand=p.hand.filter(c=>c.id!==card.id);s.discard.push(card);s.color=card.color==='wild'?cmd.color!:card.color
    if(cmd.flex)p.power=false;if(card.flip)p.power=!p.power
    let steps=1
    if(card.kind==='reverse'){s.direction=s.direction===1?-1:1;steps=cmd.flex||s.players.length===2?2:1}
    if(card.kind==='skip')steps=cmd.flex?s.players.length:2
    if(card.kind==='draw2'){
     if(cmd.flex)s.players.forEach((_,i)=>{if(i!==actor)take(s,i,1)})
     else{take(s,next(s),2);steps=2}
    }
    if(card.kind==='wild_flip')s.players.forEach(other=>other.power=!other.power)
    if(card.kind==='wild_target2'&&cmd.flex)take(s,cmd.target!,2)
    if(card.kind==='wild_all2'&&cmd.flex)s.players.forEach((_,i)=>{if(i!==actor)take(s,i,2)})
    if(card.kind==='wild_draw4'){
     if(cmd.flex)take(s,cmd.target!,4)
     else{s.challenge={from:actor,to:next(s),illegal};s.phase='draw4'}
    }
    refreshPower(s);if(p.hand.length===1&&!p.uno)s.vulnerable=actor;else if(p.hand.length!==1)p.uno=false
    s.current=next(s,steps);played=card;message=`${p.name} mängis ${card.kind==='number'?card.number:LABELS[card.kind]}${cmd.flex?' · FLEX':''}`
    if(!p.hand.length&&s.phase!=='draw4'){s.phase='over';s.winner=actor;message=`${p.name} võitis!`}
   }else fail('Tundmatu tegevus')
  }
 }
 s.revision=input.revision+1;s.requests=[...input.requests,requestId].slice(-64);s.hostBeat=Date.now();s.log=[message,...s.log].slice(0,12);s.lastMove={id:requestId,actor:actor>=0?s.players[actor]?.name:'Mängujuht',message,card:played,flex:cmd.type==='play'&&cmd.flex};return s
}
