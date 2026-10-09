import test from 'node:test'
import assert from 'node:assert/strict'
import { playCard, pickTarget, skipDefend, defendWithNo, endTurn, prepareTurnEnd, tickTurnEnd, discardHand, confirmSelectedPay, resolvePay, pickProperty, startRentAll, applyDealCommand, pickRentColor } from '../frontend/src/games/kinnistu-deal/logic.ts'
const cash=(id,value=1)=>({id,kind:'money',value})
const action=(id,act)=>({id,kind:'action',action:act,name:act,value:3})
const prop=(id,color='brown')=>({id,kind:'property',color,name:id,value:2})
const player=(name,hand=[])=>({name,token:name,hand,bank:[],props:{},buildings:{}})
const fixture=()=>({phase:'turn',current:0,playsLeft:3,turnCount:0,players:[player('Anna'),player('Mart'),player('Liis')],deck:Array.from({length:40},(_,i)=>cash(`d${i}`)),discard:[],log:[],packData:{winSets:3,startHand:5}})
test('every opponent gets an identical public response window with or without a cancel card',()=>{
 const s=fixture();s.players[0].hand=[action('debt','debt')]
 const a=pickTarget(playCard(s,0,'debt'),1)
 const t=structuredClone(s);t.players[1].hand=[action('no','just_say_no')]
 const b=pickTarget(playCard(t,0,'debt'),1)
 assert.equal(a.phase,'defend');assert.equal(b.phase,'defend');assert.deepEqual(a.pending,b.pending);assert.deepEqual(a.log,b.log)
 assert(!a.log.join(' ').includes('võib'))
 assert.equal(skipDefend(a,1).phase,'pay');assert.equal(skipDefend(b,1).phase,'pay')
 assert.equal(defendWithNo(a,1),a)
})
test('cancel/counter-cancel chain alternates responders, keeps card-play budget and resolves parity',()=>{
 let s=fixture();s.players[0].hand=[action('debt','debt'),action('noA','just_say_no')];s.players[1].hand=[action('noB','just_say_no'),action('noB2','just_say_no')]
 s=pickTarget(playCard(s,0,'debt'),1);s=defendWithNo(s,1);assert.equal(s.pending.responseIndex,0);assert.equal(s.pending.cancelled,true);assert.equal(s.playsLeft,2)
 assert.equal(defendWithNo(s,1),s)
 s=defendWithNo(s,0);assert.equal(s.pending.cancelled,false);assert.equal(s.pending.responseIndex,1)
 const paid=skipDefend(s,1);assert.equal(paid.phase,'pay')
 s=defendWithNo(s,1);s=skipDefend(s,0);assert.equal(s.phase,'turn');assert.equal(s.pending,null);assert.equal(s.playsLeft,2)
})
test('multi-pay: every next target has neutral response, cancelled demand skips only that target',()=>{
 let s=fixture();s.players[0].hand=[action('birthday','birthday')];s.players[1].hand=[action('no','just_say_no')]
 s=playCard(s,0,'birthday');assert.equal(s.phase,'defend');s=defendWithNo(s,1);s=skipDefend(s,0)
 assert.equal(s.pending.target,2);assert.equal(s.pending.responseIndex,2);assert.equal(s.pending.cancelled,false)
 s=skipDefend(s,2);assert.equal(s.phase,'pay');s=confirmSelectedPay(s);assert.equal(s.phase,'turn')
})
test('overflow requires exact explicit selection; no hidden random disposal, no play after closing',()=>{
 let s=fixture();s.players[0].hand=Array.from({length:10},(_,i)=>cash(`h${i}`));const initial=structuredClone(s)
 s=endTurn(s);assert.equal(s.phase,'discard_hand');assert.equal(s.players[0].hand.length,10);assert.equal(s.current,0)
 assert.equal(playCard(s,0,'h0'),s);assert.equal(discardHand(s,1,['h0','h1','h2']),s);assert.equal(discardHand(s,0,['h0','h0','h1']),s);assert.equal(discardHand(s,0,['h0','h1']),s)
 s=discardHand(s,0,['h1','h4','h8']);assert.equal(s.players[0].hand.length,7);assert.deepEqual(s.discard.map(c=>c.id),['h1','h4','h8']);assert(s.turnEndAt)
 assert.deepEqual(initial.players[0].hand.map(c=>c.id),Array.from({length:10},(_,i)=>`h${i}`))
})
test('five-second deadline survives refresh, waits for effects, advances exactly once; empty hands draw five',()=>{
 let s=fixture();s.players[0].hand=[cash('last')];s=playCard(s,0,'last');assert(s.turnEndAt)
 const deadline=s.turnEndAt;assert.equal(prepareTurnEnd(s,deadline-2000).turnEndAt,deadline);assert.equal(tickTurnEnd(s,deadline-1),s)
 const next=tickTurnEnd(JSON.parse(JSON.stringify(s)),deadline);assert.equal(next.current,1);assert.equal(next.players[1].hand.length,5);assert.equal(next.turnCount,1);assert.equal(tickTurnEnd(next,deadline+100),next)
 let t=fixture();t.players[0].hand=[action('debt','debt')];t.playsLeft=1;t=pickTarget(playCard(t,0,'debt'),1);assert.equal(t.turnEndAt,undefined);t=skipDefend(t,1);assert.equal(t.turnEndAt,undefined);t=confirmSelectedPay(t);assert(t.turnEndAt)
})
test('payment can exhaust all assets below debt or pay zero; full sets may pay; broken buildings removed',()=>{
 let s=fixture();s.phase='pay';s.payFrom=1;s.payAmount=5;s.pending={from:0,target:1,action:'debt',cardId:'debt'}
 assert.equal(confirmSelectedPay(s).phase,'turn')
 s.players[1].bank=[cash('one')];s.players[1].props={brown:[prop('a'),prop('b')]};s.players[1].buildings={brown:'hotel'}
 s.payAmount=10;s.paySelected=['one','a'];assert.equal(confirmSelectedPay(s).phase,'pay')
 s.paySelected=['one','a','b'];let paid=confirmSelectedPay(s);assert.equal(paid.phase,'turn');assert.equal(paid.players[1].bank.length,0);assert.equal(paid.players[0].props.brown.length,2);assert(!paid.players[1].buildings.brown)
 paid=resolvePay(s);assert.equal(paid.players[0].props.brown.length,2);assert.equal(paid.players[1].props.brown.length,0)
})
test('deal breaker appends properties; forced deal needs an actual swap; invalid choices do not steal',()=>{
 let s=fixture();s.players[0].hand=[action('break','deal_breaker')];s.players[0].props={brown:[prop('own')]};s.players[1].props={brown:[prop('a'),prop('b')]}
 s=pickTarget(playCard(s,0,'break'),1);s=skipDefend(s,1);assert.equal(s.players[0].props.brown.length,3)
 s=fixture();s.players[0].hand=[action('forced','forced_deal')];s.players[1].props={blue:[prop('b','blue')]};assert.equal(playCard(s,0,'forced'),s)
 s.players[0].props={brown:[prop('own')]};s.players[1].props.green=[prop('g','green')];s=skipDefend(pickTarget(playCard(s,0,'forced'),1),1);assert.equal(s.phase,'pick_property');assert.equal(pickProperty(s,'missing'),s)
})
test('all action cards can be banked; refill can draw across depleted deck boundary',()=>{
 let s=fixture();s.players[0].hand=[action('rent','rent')];s=playCard(s,0,'rent',true);assert.equal(s.players[0].bank[0].id,'rent');assert.equal(s.playsLeft,2)
 s=fixture();s.players[1].hand=[cash('held')];s.deck=[cash('remaining')];s.discard=[cash('recycled')];s=endTurn(s);assert.equal(s.players[1].hand.length,3);assert.equal(new Set(s.players[1].hand.map(c=>c.id)).size,3)
})

test('player commands validate actor/phase and deduplicate before mutating cards',()=>{
 let s=fixture();s.players[0].hand=[cash('play'),cash('stay')]
 assert.throws(()=>applyDealCommand(s,'Mart',{type:'play',cardId:'play'},'bad'))
 assert.throws(()=>applyDealCommand(s,'outside',{type:'end'},'bad'))
 s=applyDealCommand(s,'Anna',{type:'play',cardId:'play'},'once');assert.equal(s.players[0].bank.length,1);assert.equal(applyDealCommand(s,'Anna',{type:'play',cardId:'play'},'once'),s)
 const renamed=applyDealCommand(s,'Mart',{type:'rename',name:'New name'},'rename');assert.equal(renamed.players[0].bank.length,1);assert.equal(renamed.players[1].name,'New name')
})

test('buildings require street sets, a prior house for hotels, and a real color',()=>{
 let s=fixture();s.phase='pick_rent_color';s.pending={action:'house',from:0,cardId:'house'};s.players[0].props={brown:[prop('a'),prop('b')],util:[prop('u1','util'),prop('u2','util')]}
 assert.equal(pickRentColor(s,'__proto__'),s);assert.equal(pickRentColor(s,'util'),s)
 const built=pickRentColor(s,'brown');assert.equal(built.players[0].buildings.brown,'house')
 s.pending.action='hotel';assert.equal(pickRentColor(s,'brown'),s)
 s.players[0].buildings.brown='house';assert.equal(pickRentColor(s,'brown').players[0].buildings.brown,'hotel')
})
