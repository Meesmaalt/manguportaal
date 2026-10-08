import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import UnoFlexGame from '@/games/uno-flex/UnoFlexGame'
import type { FlexState } from '@/games/uno-flex/rules'
export default function FlexPlayer() {
 const {code:rawCode,token}=useParams();const code=(rawCode||'').toUpperCase()
 const [state,setState]=useState<FlexState|null>(null);const [id,setId]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(true)
 useEffect(()=>{
  let stopped=false;let unsub:(()=>void)|undefined;let poll:ReturnType<typeof setInterval>|undefined
  async function load(){try{
   let local='';for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)!;if(!key.startsWith('session_local-'))continue;try{const s=JSON.parse(localStorage.getItem(key)!);if(s.game_type==='uno_flex'&&s.code===code){local=key;break}}catch{}}
   if(local){const read=()=>{const raw=localStorage.getItem(local);if(raw&&!stopped)setState(JSON.parse(raw))};read();setId(local.slice(8));poll=setInterval(read,500)}
   else{const list=await pb.collection('game_sessions').getList<GameSession>(1,1,{filter:pb.filter('code = {:code} && game_type = "uno_flex"',{code}),requestKey:null});const rec=list.items[0];if(!rec)throw new Error('Mängu ei leitud. Ava mängujuhi antud link.');if(stopped)return;setId(rec.id);setState(rec.state as FlexState);const subscription=await pb.collection('game_sessions').subscribe<GameSession>(rec.id,e=>{if(!stopped)setState(e.record.state as FlexState)}).catch(()=>undefined);if(stopped){subscription?.();return}else unsub=subscription;poll=setInterval(()=>{pb.collection('game_sessions').getOne<GameSession>(rec.id,{requestKey:null}).then(r=>{if(!stopped)setState(r.state as FlexState)}).catch(()=>{})},3000)}
  }catch(e:any){if(!stopped)setError(e.message)}finally{if(!stopped)setLoading(false)}}
  load();return()=>{stopped=true;unsub?.();if(poll)clearInterval(poll)}
 },[code])
 const viewer=state?.players.findIndex(p=>p.token===token)??-1
 if(loading)return <p className="text-center text-gold p-10">Laadin kaardilauda…</p>
 if(error||!state||viewer<0)return <p className="text-center text-rose-300 p-10">{error||'See mängijalink ei kuulu lauale.'}</p>
 return <div className="min-h-screen bg-[#080e1b] pt-4 text-white"><UnoFlexGame state={state} sessionId={id} viewer={viewer} onState={setState}/></div>
}
