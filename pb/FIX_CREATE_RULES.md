# Failed to create record — API rules

Pärast `collections.json` importi kontrolli **game_sessions** reegleid.

## game_sessions (Admin → Collections → game_sessions → API rules)

| Rule | Väärtus (peo jaoks) |
|------|---------------------|
| List | *(tühi = public)* |
| View | *(tühi)* |
| Create | *(tühi)* |
| Update | *(tühi)* |
| Delete | *(tühi või host = @request.auth.id)* |

## Fields

- **host** → **not required** (külaline võib mängida ilma kontota)

## packs

- Create: `@request.auth.id != ""` (import ainult sisse logitud kasutajaga)
- List/View: `is_official = true || is_public = true || owner = @request.auth.id`

Salvesta collection → proovi jälle **Mängi**.
