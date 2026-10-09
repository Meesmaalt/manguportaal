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
 } catch(e:any){throw new Error(e.status===404?'Deali serveriosa vajab uuendamist. Uuenda ka PocketBase’i konteiner.':e.response?.message||e.message||'Käigu salvestamine ebaõnnestus')}
}
