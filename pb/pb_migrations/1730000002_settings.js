/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const settings = app.settings()
    // Allow all origins for LAN / docker use
    settings.meta.appName = "Ohtu Mangud"
    if (settings.meta) {
      // batch of common settings
    }
    // API rules for users create (registration)
    try {
      const users = app.findCollectionByNameOrId("users")
      if (!users.createRule || users.createRule === null) {
        users.createRule = ""
        app.save(users)
      }
    } catch (e) {}
    app.save(settings)
    console.log("[ohtu] settings applied")
  } catch (e) {
    console.log("[ohtu] settings skip", e)
  }
}, (app) => {})
