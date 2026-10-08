migrate((app) => {
  for (const name of ['packs', 'game_sessions']) {
    const col = app.findCollectionByNameOrId(name)
    const field = col.fields.getByName('game_type')
    if (!field.values.includes('uno_flex')) { field.values = field.values.concat(['uno_flex']); app.save(col) }
  }
  const existing = app.findRecordsByFilter('packs', 'game_type = "uno_flex"', '', 1, 0)
  if (!existing.length) {
    const record = new Record(app.findCollectionByNameOrId('packs'))
    record.set('name', 'UNO Flex – Kaardiareen')
    record.set('description', '2–8 mängijat. 7 kaarti, Flex-jõud ja graafiline mängulaud.')
    record.set('game_type', 'uno_flex'); record.set('data', { startHand: 7 })
    record.set('is_official', true); record.set('is_public', true); app.save(record)
  }
}, (app) => {})
