/// <reference path="../pb_data/types.d.ts" />
/**
 * Add miljonar to packs + game_sessions game_type select values.
 */
migrate((app) => {
  const extra = "miljonar"
  for (const name of ["packs", "game_sessions"]) {
    try {
      const col = app.findCollectionByNameOrId(name)
      const field = col.fields.getByName("game_type")
      if (!field) {
        console.log("[ohtu] no game_type on", name)
        continue
      }
      // PB select field: values array
      let values = field.values
      if (!values && field.options) values = field.options.values
      if (!values) values = []
      const set = {}
      for (const v of values) set[v] = true
      set[extra] = true
      const next = Object.keys(set)
      field.values = next
      if (field.options) field.options.values = next
      app.save(col)
      console.log("[ohtu] game_type + miljonar on", name, next.join(","))
    } catch (e) {
      console.log("[ohtu] miljonar migration skip", name, e)
    }
  }
}, (app) => {})
