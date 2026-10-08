import { pb } from '@/lib/pocketbase'
import { applyFlex, type FlexCommand, type FlexState } from './rules'
export async function sendFlexCommand(sessionId:string,token:string,command:FlexCommand) {
 const requestId=crypto.randomUUID()
 if(sessionId.startsWith('local-')) {
  const key=`session_${sessionId}`;const raw=localStorage.getItem(key);if(!raw)throw new Error('Sessioon puudub')
  const next=applyFlex(JSON.parse(raw),token,command,requestId);localStorage.setItem(key,JSON.stringify(next));return next
 }
 try {await pb.send(`/api/uno-flex/${sessionId}/action`,{method:'POST',body:{token,command,requestId},requestKey:null})}
 catch(error:any){if(error.status===404)throw new Error('Uno Flexi serveriosa puudub. Uuenda PocketBase ja taaskäivita konteiner.');throw new Error(error.response?.message||error.message||'Käigu salvestamine ebaõnnestus')}
 const rec=await pb.collection('game_sessions').getOne(sessionId,{requestKey:null});return rec.state as FlexState
}
