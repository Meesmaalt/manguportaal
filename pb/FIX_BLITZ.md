# Invalid value blitz – Lahendus

Kui Blitzi paki loomisel või salvestamisel tekib viga:
`Failed to create record. — data: {"game_type":{"code":"validation_invalid_value","message":"Invalid value blitz."}}; status: 400`

Põhjus: PocketBase andmebaasis on `packs` ja `game_sessions` tabelites väli `game_type` tüübiga **select**, kus on fikseeritud lubatud väärtuste loetelu. Kuna `blitz` puudub nimekirjast, keeldub PocketBase kirjet loomast.

---

## 🚀 Kiire lahendus PocketBase Admin UI kaudu (1 minut):

1. **Ava PocketBase admin paneel:**  
   Mine aadressile `https://SINU_PB_URL/_/` (nt `https://tools.thormen.com:8090/_/` või lokaalne PB).
2. **Uuenda packs kollektsiooni:**
   - Vali vasakult menüüst **Collections** → **packs**.
   - Klõpsa real **game_type** (tüüp `select`).
   - Nimekirjas **Values** lisa uus rida: `blitz` (teiste kõrvale nagu `kuldvillak`, `kinnistu_deal`, `miljonar` jne).
   - Vajuta all paremal nuppu **Save changes**.
3. **Uuenda game_sessions kollektsiooni:**
   - Vali vasakult menüüst **Collections** → **game_sessions**.
   - Klõpsa real **game_type** ja lisa samamoodi **Values** nimekirja: `blitz`.
   - Vajuta **Save changes**.

---

## 🔒 Kontrolli ka kasutaja õigusi ja API reegleid:

1. **Kasutajana sisse logimine:**
   - Veendu, et oled rakenduses sisse logitud lehe tavakontoga (`/login` kaudu, luues või logides sisse kasutajana `users` kollektsioonis), mitte ainult PocketBase superuserina.
   - Pakkide loomisel määratakse paki omanikuks (`owner`) sisselogitud kasutaja ID.
2. **Packs API reeglid (API Rules):**
   - Mine PB Admin → **Collections** → **packs** → vahekaart **API Rules**.
   - **Create Rule:** `@request.auth.id != ""`
   - **List/View Rule:** `is_official = true || is_public = true || owner = @request.auth.id`
   - **Update Rule:** `owner = @request.auth.id`
   - **Delete Rule:** `owner = @request.auth.id`
3. **Owner välja seos:**
   - Kontrolli väljal **owner**, et see oleks `relation` kollektsioonile `users`.

---

## ⚙️ Alternatiiv: Migratsioon või collections.json import

1. **Migratsiooniga:**
   - Projektis on nüüd fail `pb/pb_migrations/1730000009_blitz.js`.
   - Kui PocketBase töötab Dockeris, tehes restarti (`docker compose restart pocketbase`), rakendub migratsioon automaatselt.
2. **Collections import:**
   - PB Admin → **Settings** (või Collections menüü alt) → **Import collections**
   - Vali fail `pb/collections.json` ja vajuta kinnita.

---

## 🎮 Ametlike pakkide lisamine lehel:
Kui `blitz` on väärtuste hulka lisatud, ava rakenduses `/admin` leht ja klõpsa:
- **Laadi baasi: Blitz – Klassika**
- **Laadi baasi: Blitz – Peo**
Seejärel on need komplektid kättesaadavad kõigile mängijatele!
