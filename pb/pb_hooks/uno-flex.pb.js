// Every play runs inside one database transaction: no stale hands or double plays.
routerAdd('POST', '/api/uno-flex/{session}/action', (e) => {
  const rules = require(__hooks + '/uno-flex-rules.cjs')
  const body = e.requestInfo().body
  if (!body || typeof body.token !== 'string' || typeof body.requestId !== 'string' || !body.requestId.length || body.requestId.length > 100 || !body.command) throw new BadRequestError('Puudulik mängukäik')
  let revision = 0
  $app.runInTransaction((app) => {
    const record = app.findRecordById('game_sessions', e.request.pathValue('session'))
    if (record.getString('status') === 'finished') throw new BadRequestError('Sessioon on lõpetatud')
    if (record.getString('game_type') !== 'uno_flex') throw new BadRequestError('Vale mängutüüp')
    const state = JSON.parse(record.getString('state'))
    let next
    try { next = rules.applyFlex(state, body.token, body.command, body.requestId) }
    catch (error) { throw new BadRequestError(String(error.message || error)) }
    revision = next.revision
    if (next.revision !== state.revision) { record.set('state', next); app.save(record) }
  })
  return e.json(200, { ok: true, revision: revision })
})
// Card plays cannot bypass the transactional endpoint through generic updates.
onRecordUpdateRequest((e) => {
  if ((e.record.getString('game_type') === 'uno_flex' || e.record.original().getString('game_type') === 'uno_flex') && (e.requestInfo().body.state != null || (e.requestInfo().body.game_type != null && e.requestInfo().body.game_type !== 'uno_flex')) && !e.hasSuperuserAuth()) {
    throw new BadRequestError('Uno Flexi käigud tuleb saata mängu käiguteenusele')
  }
  return e.next()
}, 'game_sessions')

// Host presence updates the latest record without replaying any card state.
routerAdd('POST', '/api/uno-flex/{session}/heartbeat', (e) => {
  const body = e.requestInfo().body
  $app.runInTransaction((app) => {
    const record = app.findRecordById('game_sessions', e.request.pathValue('session'))
    const state = JSON.parse(record.getString('state'))
    if (record.getString('game_type') !== 'uno_flex' || !body || body.token !== state.hostToken) throw new BadRequestError('Vale mängujuhi link')
    state.hostBeat = Date.now()
    record.set('state', state)
    app.save(record)
  })
  return e.json(200, { ok: true })
})
