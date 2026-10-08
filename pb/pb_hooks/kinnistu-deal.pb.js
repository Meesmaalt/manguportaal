// Read the latest state in one transaction; simultaneous host/player ticks cannot skip a turn.
routerAdd('POST', '/api/kinnistu-deal/{session}/tick', (e) => {
  const rules = require(__hooks + '/kinnistu-deal-rules.cjs')
  let changed = false; let next
  $app.runInTransaction((app) => {
    const record = app.findRecordById('game_sessions', e.request.pathValue('session'))
    if (record.getString('game_type') !== 'kinnistu_deal' || record.getString('status') === 'finished') throw new BadRequestError('Vale või lõpetatud sessioon')
    const state = JSON.parse(record.getString('state'))
    next = rules.tickTurnEnd(state, Date.now())
    changed = next !== state
    if (changed) { next.hostBeat = Date.now(); record.set('state', next); app.save(record) }
  })
  return e.json(200, { changed: changed, state: changed ? next : null })
})

routerAdd('POST', '/api/kinnistu-deal/{session}/action', (e) => {
  const rules = require(__hooks + '/kinnistu-deal-rules.cjs')
  const body = e.requestInfo().body
  if (!body || typeof body.token !== 'string' || typeof body.requestId !== 'string' || !body.requestId.length || body.requestId.length > 100 || !body.command) throw new BadRequestError('Puudulik mängukäik')
  let next
  $app.runInTransaction((app) => {
    const record = app.findRecordById('game_sessions', e.request.pathValue('session'))
    if (record.getString('game_type') !== 'kinnistu_deal' || record.getString('status') === 'finished') throw new BadRequestError('Vale või lõpetatud sessioon')
    const state = JSON.parse(record.getString('state'))
    try { next = rules.applyDealCommand(state,body.token,body.command,body.requestId) }
    catch (error) { throw new BadRequestError(String(error.message || error)) }
    if (next !== state) { record.set('state',next); app.save(record) }
  })
  return e.json(200,{ state:next })
})

routerAdd('POST', '/api/kinnistu-deal/{session}/heartbeat', (e) => {
  $app.runInTransaction((app) => {
    const record = app.findRecordById('game_sessions', e.request.pathValue('session'))
    if (record.getString('game_type') !== 'kinnistu_deal') throw new BadRequestError('Vale mäng')
    const state = JSON.parse(record.getString('state'))
    state.hostBeat = Date.now(); record.set('state',state); app.save(record)
  })
  return e.json(200,{ ok:true })
})
