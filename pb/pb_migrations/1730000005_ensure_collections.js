/// <reference path="../pb_data/types.d.ts" />
/**
 * Ensure packs + game_sessions exist (fixes "Missing or invalid collection context"
 * when 1730000000 skipped after partial install).
 */
migrate((app) => {
  const gameTypes = [
    "kuldvillak",
    "roosidesoda",
    "sonaseletus",
    "ma_ei_ole_kunagi",
    "viimane_pusti",
    "tode_voi_tegu",
    "kinnistu_deal",
  ]

  let users
  try {
    users = app.findCollectionByNameOrId("users")
  } catch (e) {
    console.log("[ohtu] no users collection yet")
    return
  }

  // ---- packs ----
  let packs
  try {
    packs = app.findCollectionByNameOrId("packs")
    console.log("[ohtu] packs ok")
  } catch (e) {
    packs = new Collection({
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
    console.log("[ohtu] packs CREATED")
  }

  // ---- game_sessions ----
  try {
    const sessions = app.findCollectionByNameOrId("game_sessions")
    // ensure open rules for guest play
    sessions.listRule = ""
    sessions.viewRule = ""
    sessions.createRule = ""
    sessions.updateRule = ""
    sessions.deleteRule = ""
    try {
      const hostField = sessions.fields.getByName("host")
      if (hostField) hostField.required = false
    } catch (e2) {}
    app.save(sessions)
    console.log("[ohtu] game_sessions ok + rules open")
  } catch (e) {
    const sessions = new Collection({
      name: "game_sessions",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
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
          required: false,
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
    console.log("[ohtu] game_sessions CREATED")
  }
}, (app) => {})
