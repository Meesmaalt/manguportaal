/// <reference path="../pb_data/types.d.ts" />
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
  for (const name of ["packs", "game_sessions"]) {
    try {
      const col = app.findCollectionByNameOrId(name)
      const field = col.fields.getByName("game_type")
      if (field && field.values) {
        const set = {}
        for (const v of field.values) set[v] = true
        for (const v of gameTypes) set[v] = true
        field.values = Object.keys(set)
        app.save(col)
        console.log("[ohtu] kinnistu_deal on", name)
      }
    } catch (e) {
      console.log("[ohtu] skip", name, e)
    }
  }
}, (app) => {})
