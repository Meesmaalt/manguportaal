// Esmakordne administraatori seadistus: kui päris superkasutajat veel pole, saab esimene külastaja parooli määrata.
// PocketBase loob esmakäivitusel ajutise paigaldus-superkasutaja (__pbinstaller@example.com); seda me päriskasutajaks ei loe.
routerAdd('GET', '/api/admin-setup/status', (e) => {
  const n = $app.countRecords('_superusers', $dbx.exp('email != {:e}', { e: '__pbinstaller@example.com' }))
  return e.json(200, { needsSetup: n === 0 })
})

routerAdd('POST', '/api/admin-setup', (e) => {
  const body = e.requestInfo().body || {}
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestError('Sisesta korrektne e-posti aadress')
  if (password.length < 10) throw new BadRequestError('Parool peab olema vähemalt 10 märki')
  $app.runInTransaction((app) => {
    const n = app.countRecords('_superusers', $dbx.exp('email != {:e}', { e: '__pbinstaller@example.com' }))
    if (n > 0) throw new ForbiddenError('Administraator on juba loodud')
    const collection = app.findCollectionByNameOrId('_superusers')
    const record = new Record(collection)
    record.set('email', email)
    record.set('password', password)
    app.save(record)
    try { app.delete(app.findAuthRecordByEmail('_superusers', '__pbinstaller@example.com')) } catch (_) { /* polegi */ }
  })
  return e.json(200, { ok: true })
})
