import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFlexDeck, initialFlex, applyFlex, canPlay } from '../frontend/src/games/uno-flex/rules.ts'
let seq=0
const number=(id,color='red',n=3,extra={})=>({id,kind:'number',color,number:n,...extra})
const action=(kind,extra={})=>({id:kind,kind,color:kind.startsWith('wild')?'wild':'red',...extra})
const fixture=(card,others=3)=>({...initialFlex('TEST','host',Array.from({length:others},(_,i)=>`p${i}`)),phase:'turn',discard:[number('top')],deck:Array.from({length:35},(_,i)=>number(`deck${i}`,'blue',8)),players:Array.from({length:others},(_,i)=>({token:`p${i}`,name:`Player ${i}`,power:true,uno:false,hand:i===0?[card,number('spare','yellow',7)]:[number(`other${i}`)]}))})
const move=(s,cmd,actor=s.current,id=`r${++seq}`)=>applyFlex(s,actor==='host'?'host':`p${actor}`,cmd,id)
const play=(s,flex=false,target)=>move(s,{type:'play',cardId:s.players[s.current].hand[0].id,flex,color:'blue',target})
test('104 unique cards; 2–8 players, seven cards and immutable/idempotent commands',()=>{
 const eight=move(initialFlex('T','host',Array.from({length:8},(_,i)=>`p${i}`),10),{type:'start'},'host');assert(eight.players.every(p=>p.hand.length===10));assert.equal(eight.discard[0].kind,'number');
 assert.equal(buildFlexDeck().length,104);assert.equal(new Set(buildFlexDeck().map(c=>c.id)).size,104)
 const initial=initialFlex('TEST','host',['p0','p1']);const s=move(initial,{type:'start'},'host','once')
 assert.deepEqual(initial.players.map(p=>p.hand.length),[0,0]);assert.deepEqual(s.players.map(p=>p.hand.length),[7,7]);assert.equal(s.deck.length,89)
 assert.equal(applyFlex(s,'host',{type:'start'},'once'),s)
 assert.throws(()=>move(initial,{type:'start'},0));assert.throws(()=>move(initialFlex('T','host',Array(9).fill('p')),{type:'start'},'host'))
 assert.throws(()=>applyFlex(s,'outsider',{type:'draw'},'new'));assert.throws(()=>move(s,{type:'draw'},1))
})
test('Flex color matches but next color is primary; power consumed and globally restored',()=>{
 let s=fixture(number('flex','yellow',6,{flexColor:'red'}));assert(!canPlay(s,0,s.players[0].hand[0]));assert(canPlay(s,0,s.players[0].hand[0],true))
 s=play(s,true);assert.equal(s.color,'yellow');assert.equal(s.players[0].power,false)
 const t=fixture(number('flex','yellow',6,{flexColor:'red'}));t.players.slice(1).forEach(p=>p.power=false)
 assert(move(t,{type:'play',cardId:'flex',flex:true}).players.every(p=>p.power))
})
test('normal and Flex skip/reverse/+2 apply distinct turns and penalties',()=>{
 assert.equal(play(fixture(action('skip'))).current,2);assert.equal(play(fixture(action('skip',{flex:true})),true).current,0)
 let s=play(fixture(action('reverse'),4));assert.equal(s.direction,-1);assert.equal(s.current,3)
 s=play(fixture(action('reverse',{flex:true}),4),true);assert.equal(s.current,2)
 assert.equal(play(fixture(action('reverse'),2)).current,0)
 s=play(fixture(action('draw2')));assert.equal(s.current,2);assert.equal(s.players[1].hand.length,3)
 s=play(fixture(action('draw2',{flex:true})),true);assert.equal(s.current,1);assert.deepEqual(s.players.map(p=>p.hand.length),[1,2,2])
})
test('targeted wild penalties do not skip, all opponents draw, power flip restores',()=>{
 let s=play(fixture(action('wild_target2',{flex:true})),true,2);assert.equal(s.current,1);assert.equal(s.players[2].hand.length,3)
 s=play(fixture(action('wild_draw4',{flex:true})),true,2);assert.equal(s.phase,'turn');assert.equal(s.players[2].hand.length,5)
 assert.throws(()=>play(fixture(action('wild_target2',{flex:true})),true,0))
 s=play(fixture(action('wild_all2',{flex:true})),true);assert.deepEqual(s.players.map(p=>p.hand.length),[1,3,3])
 assert(play(fixture(action('wild_flip'))).players.every(p=>p.power))
 s=fixture(number('flip','red',1,{flip:true}));s=play(s);assert.equal(s.players[0].power,false)
})
test('draw once, play only drawn card, pass, no penalty stacking, refill keeps top',()=>{
 let s=fixture(number('held'));s.deck=[number('drawn','red',8)];s=move(s,{type:'draw'});assert.equal(s.drawnId,'drawn')
 assert.throws(()=>move(s,{type:'draw'}));assert.throws(()=>move(s,{type:'play',cardId:'held'}));s=move(s,{type:'pass'});assert.equal(s.current,1)
 s=fixture(number('held'));s.deck=[];s.discard=[number('refill','blue'),number('top','red')];s=move(s,{type:'draw'});assert.equal(s.discard.at(-1).id,'top');assert.equal(s.players[0].hand.at(-1).id,'refill')
})
test('UNO pre-call, catch window, expiry and no self-catch',()=>{
 let s=play(fixture(number('play')));assert.equal(s.vulnerable,0);assert.throws(()=>move(s,{type:'catch',target:0},0));s=move(s,{type:'catch',target:0},2);assert.equal(s.players[0].hand.length,3);assert.equal(s.current,1)
 s=fixture(number('play'));s=move(s,{type:'uno'});s=play(s);assert.equal(s.vulnerable,undefined);assert(s.players[0].uno)
 s=play(fixture(number('play')));s=move(s,{type:'draw'});assert.throws(()=>move(s,{type:'catch',target:0},2))
})
test('+4 accept/challenge and final-card win resolved after penalty',()=>{
 let s=fixture(action('wild_draw4'));s.players[0].hand.push(number('illegal','red'));s=play(s);assert.equal(s.phase,'draw4');s=move(s,{type:'challenge'});assert.equal(s.players[0].hand.length,6);assert.equal(s.current,1)
 s=play(fixture(action('wild_draw4')));s=move(s,{type:'challenge'});assert.equal(s.players[1].hand.length,7);assert.equal(s.current,2)
 s=fixture(action('wild_draw4'));s.players[0].hand=s.players[0].hand.slice(0,1);s=play(s);assert.equal(s.winner,undefined);s=move(s,{type:'accept'});assert.equal(s.phase,'over');assert.equal(s.winner,0);assert.equal(s.players[1].hand.length,5)
 s=fixture(action('draw2'));s.players[0].hand=s.players[0].hand.slice(0,1);s=play(s);assert.equal(s.winner,0);assert.equal(s.players[1].hand.length,3)
})
test('30 complete simulated rounds conserve all 104 cards and never stall',()=>{
 for(let round=0;round<30;round++){
 let s=move(initialFlex('T','host',['p0','p1','p2','p3']),{type:'start'},'host');let turns=0
 while(s.phase!=='over'&&turns++<4000){
  if(s.phase==='draw4')s=move(s,{type:'accept'})
  else {const hand=s.players[s.current].hand;const c=hand.find(c=>canPlay(s,s.current,c)||canPlay(s,s.current,c,true));if(c){const flex=!canPlay(s,s.current,c);s=move(s,{type:'play',cardId:c.id,flex,color:['red','yellow','green','blue'][turns%4],target:(s.current+1)%4})}else s=move(s,{type:s.drawnId?'pass':'draw'})}
  const all=[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)];assert.equal(all.length,104);assert.equal(new Set(all.map(c=>c.id)).size,104)
 }
 assert.equal(s.phase,'over',`Round ${round} stalled`);assert.equal(s.players[s.winner].hand.length,0)
 }
})
