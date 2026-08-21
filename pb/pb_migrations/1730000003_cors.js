/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const settings = app.settings()
    // Allow requests from any origin (LAN / tools.thormen.com)
    settings.batch = settings.batch || {}
    app.save(settings)
    console.log("[ohtu] settings touch for cors-friendly deploy")
  } catch (e) {
    console.log("[ohtu] cors migration skip", e)
  }
}, (app) => {})
