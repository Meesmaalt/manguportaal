// Optional real PocketBase integration: POCKETBASE_BIN=/path/pocketbase npm run test:server
import {spawn} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import assert from 'node:assert/strict'
import {initialFlex} from '../frontend/src/games/uno-flex/rules.ts'
const dir=mkdtempSync(join(tmpdir(),'flex-pb-'))
const bin=process.env.POCKETBASE_BIN
if(!bin)throw new Error('Set POCKETBASE_BIN to the PocketBase executable')
const server=spawn(bin,['serve','--http=127.0.0.1:8197',`--dir=${dir}`,'--migrationsDir=pb/pb_migrations','--hooksDir=pb/pb_hooks'],{stdio:['ignore','pipe','pipe']})
let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d)
const api=async(path,body,method='POST')=>{const r=await fetch(`http://127.0.0.1:8197${path}`,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:8197/api/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 const packs=await fetch('http://127.0.0.1:8197/api/collections/packs/records?filter=game_type%3D%22uno_flex%22').then(r=>r.json());assert.equal(packs.items.length,1)
 const session=await api('/api/collections/game_sessions/records',{code:'TEST',game_type:'uno_flex',state:initialFlex('TEST','host',['p0','p1','p2']),status:'playing'})
 assert.equal(session.status,200,JSON.stringify(session));const id=session.data.id
 const cmd=(token,command,requestId)=>api(`/api/uno-flex/${id}/action`,{token,command,requestId})
 assert.equal((await cmd('bad',{type:'start'},'bad')).status,400)
 assert.equal((await cmd('host',{type:'start'},'start')).status,200)
 assert.equal((await cmd('host',{type:'start'},'start')).data.revision,1)
 const before=await fetch(`http://127.0.0.1:8197/api/collections/game_sessions/records/${id}`).then(r=>r.json())
 assert.equal(before.state.players[0].hand.length,7)
 assert.equal((await api(`/api/collections/game_sessions/records/${id}`,{state:before.state},'PATCH')).status,400)
 assert.equal((await api(`/api/collections/game_sessions/records/${id}`,{game_type:'kuldvillak'},'PATCH')).status,400)
 const parallel=await Promise.all([cmd('p0',{type:'uno'},'invalid-uno'),cmd('p1',{type:'draw'},'wrong-turn')]);assert(parallel.every(r=>r.status===400))
 const replay=await Promise.all([cmd('p0',{type:'draw'},'same-draw'),cmd('p0',{type:'draw'},'same-draw')]);assert(replay.every(r=>r.status===200),JSON.stringify(replay))
 assert.equal((await api(`/api/uno-flex/${id}/heartbeat`,{token:'bad'})).status,400)
 assert.equal((await api(`/api/uno-flex/${id}/heartbeat`,{token:'host'})).status,200)
 const after=await fetch(`http://127.0.0.1:8197/api/collections/game_sessions/records/${id}`).then(r=>r.json())
 assert.equal(after.state.players[0].hand.length,8);assert.equal(after.state.revision,2);assert(after.state.hostBeat)
 console.log('PASS: migrations, seeded pack, transactional actions, concurrent duplicate requests, token/turn validation, direct-update rejection, heartbeat on real PocketBase')
}catch(e){console.error(logs);throw e}finally{server.kill();await new Promise(r=>server.on('exit',r));rmSync(dir,{recursive:true,force:true})}
