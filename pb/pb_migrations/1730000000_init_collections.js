/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    app.findCollectionByNameOrId("packs")
    console.log("[ohtu] packs exists – skip schema")
    return
  } catch (e) {}

  const users = app.findCollectionByNameOrId("users")
  const gameTypes = [
    "kuldvillak",
    "roosidesoda",
    "sonaseletus",
    "ma_ei_ole_kunagi",
    "viimane_pusti",
    "tode_voi_tegu",
    "kinnistu_deal",
  ]

  const packs = new Collection({
    id: "pbc_packs00001",
    name: "packs",
    type: "base",
    listRule: "is_official = true || is_public = true || owner = @request.auth.id",
    viewRule: "is_official = true || is_public = true || owner = @request.auth.id",
    createRule: '@request.auth.id != ""',
    updateRule: "owner = @request.auth.id && is_official = false",
    deleteRule: "owner = @request.auth.id && is_official = false",
    fields: [
      { name: "name", type: "text", required: true, min: 1, max: 120 },
      { name: "description", type: "text", required: false, max: 500 },
      {
        name: "game_type",
        type: "select",
        required: true,
        maxSelect: 1,
        values: gameTypes,
      },
      { name: "data", type: "json", required: true },
      { name: "is_official", type: "bool", required: false },
      { name: "is_public", type: "bool", required: false },
      {
        name: "owner",
        type: "relation",
        required: false,
        maxSelect: 1,
        collectionId: users.id,
        cascadeDelete: false,
      },
    ],
  })
  app.save(packs)

  const sessions = new Collection({
    id: "pbc_sessions01",
    name: "game_sessions",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: '@request.auth.id != ""',
    updateRule: "host = @request.auth.id",
    deleteRule: "host = @request.auth.id",
    fields: [
      { name: "code", type: "text", required: true, min: 4, max: 10 },
      {
        name: "game_type",
        type: "select",
        required: true,
        maxSelect: 1,
        values: gameTypes,
      },
      {
        name: "pack",
        type: "relation",
        required: false,
        maxSelect: 1,
        collectionId: packs.id,
        cascadeDelete: false,
      },
      {
        name: "host",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: users.id,
        cascadeDelete: false,
      },
      { name: "state", type: "json", required: true },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["lobby", "playing", "finished"],
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_session_code` ON `game_sessions` (`code`)",
    ],
  })
  app.save(sessions)
  console.log("[ohtu] packs + game_sessions created")
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("game_sessions")) } catch (e) {}
  try { app.delete(app.findCollectionByNameOrId("packs")) } catch (e) {}
})
