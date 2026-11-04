import { pb } from '@/lib/pocketbase'
import { applyDealCommand, type DealCommand } from './logic'
import type { KinnistuDealState } from './types'
export async function sendDealCommand(sessionId:string,token:string,command:DealCommand):Promise<KinnistuDealState> {
 const requestId=crypto.randomUUID()
 if(sessionId.startsWith('local-')){
  const key=`session_${sessionId}`;const raw=localStorage.getItem(key)
  if(!raw)throw new Error('Sessioon puudub')
  const next=applyDealCommand(JSON.parse(raw),token,command,requestId)
  localStorage.setItem(key,JSON.stringify(next));return next
 }
 try {
  const result=await pb.send(`/api/kinnistu-deal/${sessionId}/action`,{method:'POST',body:{token,command,requestId},requestKey:null})
  return result.state
 } catch(e:any){
  if(e.status===404) return sendWithoutServerHook(sessionId,token,command,requestId)
  throw new Error(e.response?.message||e.message||'Käigu salvestamine ebaõnnestus')
 }
}
/**
 * PocketBase'i konteineris puudub deali hooks-fail (marsruut 404).
 * Varuvariant: rakenda käik brauseris värskeima salvestatud seisu peal ja kirjuta see andmebaasi.
 * Päris lahendus on uuendada PocketBase'i konteiner (pb/pb_hooks), siis kasutatakse tehingupõhist serveriteenust.
 */
async function sendWithoutServerHook(sessionId:string,token:string,command:DealCommand,requestId:string):Promise<KinnistuDealState>{
 try{
  console.warn('[deal] serveri hooks puudub, kasutan varuvarianti')
  const record:any=await pb.collection('game_sessions').getOne(sessionId,{requestKey:null})
  const current=typeof record.state==='string'?JSON.parse(record.state):record.state
  const next=applyDealCommand(current,token,command,requestId)
  if(next===current) return current
  await pb.collection('game_sessions').update(sessionId,{state:next},{requestKey:null})
  return next
 }catch(e:any){
  if(e.status===404||e.status===403) throw new Error('Deali serveriosa vajab uuendamist: PocketBase’i konteineris puudub pb_hooks/kinnistu-deal.pb.js. Admin → Süsteem → „Kontrolli serveriosa“.')
  throw new Error(e.response?.message||e.message||'Käigu salvestamine ebaõnnestus')
 }
}
