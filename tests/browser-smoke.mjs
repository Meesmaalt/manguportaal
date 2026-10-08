import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
const repoRoot = fileURLToPath(new URL('../', import.meta.url))
const outputDir = join(repoRoot, '.qa')
mkdirSync(outputDir, { recursive: true })
const server = spawn(process.execPath, ['../node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '3107'], { cwd: join(repoRoot, 'frontend'), stdio: 'ignore' })
process.on('exit', () => server.kill())
for (let i = 0; i < 30; i++) { try { const r = await fetch('http://127.0.0.1:3107/'); if (r.ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 200)) }
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE_PATH || undefined, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage({viewport:{width:1440,height:1000}})
const errors = []
page.on('pageerror', e => errors.push(e.message))
await page.route('**/api/collections/**', r => r.fulfill({status:503, contentType:'application/json', body:'{}'}))
await page.route('**/api/health', r => r.fulfill({status:503, contentType:'application/json', body:'{}'}))
const prop=(id,color,name)=>({id,kind:'property',color,name,value:2})
const players = [
 {token:'anna', name:'Anna', hand:[{id:'secret',kind:'money',value:10}], bank:[{id:'b1',kind:'money',value:5}], props:{brown:[prop('a1','brown','Supilinn'),prop('a2','brown','Karlova')], mint:[prop('a3','mint','Emajõe ääres')]}, buildings:{brown:'hotel'}},
 {token:'mart', name:'Mart', hand:[], bank:[], props:{rail:[prop('b1','rail','Tartu jaam'),prop('b2','rail','Balti jaam')],blue:[prop('b3','blue','Toomemägi')]},buildings:{}},
 {token:'liis',name:'Liis',hand:[],bank:[{id:'b2',kind:'money',value:2}],props:{orange:[prop('c1','orange','Raekoja plats'),prop('c2','orange','Küüni tänav'),prop('c3','orange','Rüütli tänav')],util:[prop('c4','util','Elektrijaam')]}, buildings:{orange:'house'}}
]
const deal={game_type:'kinnistu_deal',code:'CITY', players,deck:[{id:'d1',kind:'money',value:1}],discard:[],phase:'turn',current:0,playsLeft:3,log:['Anna ehitas hotelli'],packData:{winSets:3,startHand:5},turnCount:3}
const seed=async(id,state)=>{
 await page.goto('http://127.0.0.1:3107/')
 await page.evaluate(({id,state})=>localStorage.setItem(`session_${id}`,JSON.stringify(state)),{id,state})
}
await seed('local-deal',deal)
await page.goto('http://127.0.0.1:3107/ekraan/CITY')
await page.getByText('Supilinn',{exact:true}).waitFor().catch(async e=>{console.log('PAGE ERRORS',errors);console.log((await page.locator('body').innerText()).slice(0,4000));await page.screenshot({path:join(outputDir,'failure.png'),fullPage:true});throw e})
assert.equal(await page.locator('.arena-set').count(),6)
assert.equal(await page.locator('.arena-set-complete').count(),2)
assert.equal(await page.locator('.arena-property-card').count(),10)
await page.screenshot({path:join(outputDir, 'deal-tv.png'),fullPage:true})
for(const width of [390,768,1920]){
 await page.setViewportSize({width,height:1000})
 assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),`TV overflow at ${width}`)
}
await page.setViewportSize({width:390,height:844})
await page.goto('http://127.0.0.1:3107/play/kinnistu_deal/local-deal')
await page.locator('.deal-arena').first().waitFor()
await page.screenshot({path:join(outputDir, 'deal-mobile.png'),fullPage:true})
// Rent color and opponent are selected directly on the Deal arena.
await seed('local-deal-rent',{...deal,code:'RENT',phase:'pick_rent_color',pending:{action:'rent',from:0,cardId:'rent'}})
await page.goto('http://127.0.0.1:3107/deal/RENT/anna')
await page.getByRole('button',{name:'Selge, mängime!'}).click()
await page.locator('.arena-home-lane .arena-set-label').filter({hasText:'Pruun'}).click()
await page.locator('.arena-opponents button.arena-seat').filter({hasText:'Liis'}).click()
const rentState=await page.evaluate(()=>JSON.parse(localStorage.getItem('session_local-deal-rent')))
assert.equal(rentState.pending.color,'brown');assert.equal(rentState.pending.target,2);assert.equal(rentState.phase,'pay')
// Choose a loose property from the opponent's card lane.
await seed('local-deal-steal',{...deal,code:'TAKE',phase:'pick_property',pending:{action:'sly_deal',from:0,target:1,cardId:'steal'}})
await page.goto('http://127.0.0.1:3107/deal/TAKE/anna')
await page.getByText('Toomemägi',{exact:true}).click()
const stealState=await page.evaluate(()=>JSON.parse(localStorage.getItem('session_local-deal-steal')))
assert(stealState.players[0].props.blue.some(c=>c.id==='b3'));assert.equal(stealState.phase,'turn')
const sona={game_type:'sonaseletus',code:'WORD',teams:[{name:'A',score:0},{name:'B',score:0}],activeTeam:0,words:['Tartu','Tallinn'],wordIndex:0,roundSeconds:60,timeLeft:60,running:false,packData:{words:['Tartu','Tallinn']}}
await seed('local-words',sona)
await page.goto('http://127.0.0.1:3107/play/sonaseletus/local-words')
await page.getByRole('button',{name:/Start.*60/}).click()
await page.getByRole('heading',{name:'Tartu',exact:true}).waitFor()
await page.getByRole('button',{name:'Peata voor'}).click()
await page.getByRole('heading',{name:'Seleta. Arva. Võida.'}).waitFor()
await page.getByRole('button',{name:/Start|Jätka/}).click()
await page.getByRole('button',{name:/✓/}).click()
await page.getByRole('heading',{name:'Tallinn'}).waitFor()
await page.getByRole('button',{name:/✓/}).click()
await page.getByRole('heading',{name:'Kõik sõnad mängitud!'}).waitFor()
const end=await page.evaluate(()=>JSON.parse(localStorage.getItem('session_local-words')))
assert.equal(end.teams[0].score,2)
assert.equal(end.wordIndex,2)
assert(await page.locator('.party-stage').evaluate(el => el.getBoundingClientRect().left >= 0), 'word stage must remain inside viewport after focus changes');
await page.evaluate(()=>scrollTo(0,0));
await page.screenshot({path:join(outputDir, 'words-mobile.png'),fullPage:true})
await page.locator('summary').filter({hasText:'Lisavalikud'}).click()
await page.getByRole('button',{name:'Loo AI-ga',exact:true}).click()
assert.equal(await page.locator('details[open]').count(),0)
await page.getByText('Genereeri Sõnaseletuse / Aliase kaardid AI-ga',{exact:true}).waitFor()
const standing={game_type:'viimane_pusti',code:'LAST',players:[{name:'Anna',lives:1,standing:true},{name:'Mart',lives:1,standing:true}],statements:['Olen matkamas käinud'],index:0,startingLives:1,packData:{startingLives:1}}
await seed('local-last',standing)
await page.goto('http://127.0.0.1:3107/play/viimane_pusti/local-last')
await page.getByRole('button',{name:'Anna, 1 elu, kaota üks elu',exact:true}).click()
await page.getByRole('heading',{name:'Mart',exact:true}).waitFor()
await page.reload()
await page.getByRole('button',{name:'Võta tagasi: Anna'}).click()
assert.equal(await page.getByRole('button',{name:'Anna, 1 elu, kaota üks elu',exact:true}).isEnabled(),true)
const truth={game_type:'tode_voi_tegu',code:'TRUE',players:[{name:'Anna'},{name:'Mart'}],currentPlayer:0,truths:['Küsimus A'],dares:['Tegu A'],currentCard:null,packData:{truths:['Küsimus A'],dares:['Tegu A']}}
await seed('local-truth',truth)
await page.goto('http://127.0.0.1:3107/play/tode_voi_tegu/local-truth')
await page.getByRole('button',{name:'Tõde',exact:true}).click()
await page.getByText('Küsimus A',{exact:true}).waitFor()
await page.getByRole('button',{name:/Järgmine mängija|Valmis/}).click()
assert.equal(await page.getByRole('button',{name:'Tõde',exact:true}).isDisabled(),true)
await page.reload()
assert.equal(await page.getByRole('button',{name:'Tõde',exact:true}).isDisabled(),true)
await page.getByRole('button',{name:'Tegu',exact:true}).click()
await page.getByText('Tegu A',{exact:true}).waitFor()
// Graphical Uno Flex: private phone hand, legal selection, power and persistence.
const flex={game_type:'uno_flex',code:'FLEX',hostToken:'host',phase:'turn',players:[{token:'anna',name:'Anna',power:true,uno:false,hand:[{id:'play',kind:'number',color:'yellow',number:6,flexColor:'red'},{id:'last',kind:'number',color:'blue',number:7}]},{token:'mart',name:'Mart',power:true,uno:false,hand:[{id:'other',kind:'number',color:'red',number:2}]}],deck:[{id:'draw',kind:'number',color:'green',number:8}],discard:[{id:'top',kind:'number',color:'red',number:3}],current:0,direction:1,color:'red',revision:0,requests:[],log:[],packData:{startHand:7}}
await seed('local-flex',flex)
await page.goto('http://127.0.0.1:3107/flex/FLEX/anna')
await page.getByRole('button',{name:'Kollane 6 · Flex Punane',exact:true}).click()
assert.equal(await page.getByRole('checkbox').isChecked(),true)
await page.getByRole('button',{name:'UNO!',exact:true}).click()
// A successful command updates the revision and clears the selection.
await page.getByRole('button',{name:'Kollane 6 · Flex Punane',exact:true}).click()
await page.getByRole('button',{name:'Mängi kaart',exact:true}).click()
await page.getByText('Jõud kasutatud',{exact:true}).waitFor()
const flexEnd=await page.evaluate(()=>JSON.parse(localStorage.getItem('session_local-flex')))
assert.equal(flexEnd.color,'yellow');assert.equal(flexEnd.current,1);assert.equal(flexEnd.players[0].hand.length,1);assert.equal(flexEnd.players[0].uno,true)
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Uno phone overflow')
await page.screenshot({path:join(outputDir,'flex-phone.png'),fullPage:true})
await page.reload();await page.getByText('Sinu käsi',{exact:true}).waitFor()
assert.equal(await page.locator('.arena-card-hand .flex-card').count(),1)
await page.goto('http://127.0.0.1:3107/ekraan/FLEX')
await page.locator('.flex-arena').waitFor();assert.equal(await page.locator('.arena-card-hand').count(),0)
for(const width of [390,768,1920]){await page.setViewportSize({width,height:1080});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Uno TV overflow at ${width}`)}
await page.screenshot({path:join(outputDir,'flex-tv.png'),fullPage:true})
// Host lobby names, adding a player, dealing and cross-view state updates.
await seed('local-flex-lobby',{...flex,code:'WAIT',phase:'lobby',players:flex.players.map(p=>({...p,hand:[]})),deck:[],discard:[]})
await page.goto('http://127.0.0.1:3107/play/uno_flex/local-flex-lobby')
await page.getByRole('button',{name:'Lisa mängija',exact:true}).click()
await page.getByRole('textbox',{name:'Mängija 3 nimi'}).waitFor()
await page.getByRole('button',{name:'Jaga kaardid',exact:true}).click()
await page.locator('.flex-arena').waitFor()
const started=await page.evaluate(()=>JSON.parse(localStorage.getItem('session_local-flex-lobby')))
assert.equal(started.players.length,3);assert(started.players.every(p=>p.hand.length===7))
assert.deepEqual(errors,[])
console.log('PASS: card arenas and Uno phone/private hand/power/UNO/lobby/persistence at 390/768/1920, phone host, word pause/scoring/exhaustion, extras menu, elimination/undo after reload, truth history after reload; no page errors')
await browser.close()
server.kill()
