/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    app.findCollectionByNameOrId('game_sounds')
    return
  } catch (_) {}

  const collection = new Collection({
    name: 'game_sounds',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: 'key',
        type: 'text',
        required: true,
        max: 64,
      },
      {
        name: 'file',
        type: 'file',
        required: true,
        maxSelect: 1,
        maxSize: 15242880,
        mimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav'],
      },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_game_sounds_key ON game_sounds (key)'],
  })
  app.save(collection)
}, (app) => {
  try {
    const c = app.findCollectionByNameOrId('game_sounds')
    app.delete(c)
  } catch (_) {}
})
