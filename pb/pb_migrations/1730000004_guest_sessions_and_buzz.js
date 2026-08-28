/// <reference path="../pb_data/types.d.ts" />
/**
 * Allow guest (no-auth) game sessions so TV + buzzer work across devices.
 * Random 6-char codes; open update is acceptable for party use.
 */
migrate((app) => {
  try {
    const sessions = app.findCollectionByNameOrId("game_sessions")

    // host optional
    const hostField = sessions.fields.getByName("host")
    if (hostField) {
      hostField.required = false
    }

    sessions.listRule = ""
    sessions.viewRule = ""
    sessions.createRule = ""
    sessions.updateRule = ""
    // delete still restricted if possible — leave empty for simplicity or host only
    sessions.deleteRule = ""

    app.save(sessions)
    console.log("[ohtu] game_sessions: guest create/update enabled (buzz + multi-device)")
  } catch (e) {
    console.log("[ohtu] game_sessions migration skip:", e)
  }
}, (app) => {
  try {
    const sessions = app.findCollectionByNameOrId("game_sessions")
    sessions.createRule = '@request.auth.id != ""'
    sessions.updateRule = "host = @request.auth.id"
    app.save(sessions)
  } catch (e) {}
})
