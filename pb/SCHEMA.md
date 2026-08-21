# PocketBase skeem

Loo need kollektsioonid PocketBase adminis (või impordi JSON-ist).

## 1. users (süsteemne Auth)

PocketBase loob automaatselt. Lisa väljad:

| Väli       | Tüüp   | Märkus              |
|------------|--------|---------------------|
| name       | text   | Kuvatav nimi        |
| avatar     | file   | Valikuline          |

## 2. packs

Küsimuste setid / "profiilid".

| Väli        | Tüüp     | Märkus                                      |
|-------------|----------|---------------------------------------------|
| name        | text     | Nõutav                                      |
| description | text     |                                             |
| game_type   | select   | `kuldvillak` \| `roosidesoda`               |
| data        | json     | Kogu packi sisu (kategooriad / voorud)      |
| is_official | bool     | true = ametlik, ei tohi kustutada           |
| is_public   | bool     | teised kasutajad näevad                     |
| owner       | relation | → users (mitte-ametlikel)                   |
| created     | autodate |                                             |
| updated     | autodate |                                             |

**API rules (soovitus):**
- List/View: `is_official = true || is_public = true || owner = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update/Delete: `owner = @request.auth.id && is_official = false`

## 3. game_sessions

Aktiivsed mängud.

| Väli          | Tüüp     | Märkus                                      |
|---------------|----------|---------------------------------------------|
| code          | text     | 6-täheline kood (unikaalne)                 |
| game_type     | select   | `kuldvillak` \| `roosidesoda`               |
| pack          | relation | → packs                                     |
| host          | relation | → users                                     |
| state         | json     | Kogu mängu seis (meeskonnad, avatud kaardid jne) |
| status        | select   | `lobby` \| `playing` \| `finished`          |
| created       | autodate |                                             |
| updated       | autodate |                                             |

**API rules:**
- List/View: kõik (või ainult host + display)
- Create/Update: `@request.auth.id != ""` (host)
- Delete: `host = @request.auth.id`

## 4. game_history (valikuline)

Lõppenud mängude logi.

| Väli        | Tüüp     |
|-------------|----------|
| session     | relation → game_sessions |
| host        | relation → users |
| game_type   | select   |
| final_state | json     |
| created     | autodate |

## Pack data formaadid

### Kuldvillak
```json
{
  "categories": [
    {
      "name": "Autod",
      "questions": [
        { "points": 100, "q": "Küsimus?", "a": "Vastus" },
        { "points": 200, "q": "...", "a": "..." }
      ]
    }
  ]
}
```

### Rooside Sõda
```json
{
  "rounds": [
    {
      "title": "VOOR 1",
      "multiplier": 1,
      "question": "Nimeta midagi, mida inimesed teevad sünnipäeval",
      "answers": [
        { "text": "Tort", "points": 34 },
        { "text": "Kingitused", "points": 22 }
      ]
    }
  ]
}
```
