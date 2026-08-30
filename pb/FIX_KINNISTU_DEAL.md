# Invalid value kinnistu_deal

PocketBase `packs.game_type` (ja `game_sessions.game_type`) on **select** väli.
Uus mäng peab olema listis, muidu create annab:

`validation_invalid_value` · Invalid value kinnistu_deal

## Kiire parandus (PB Admin UI)

1. Ava `https://SINU_PB/_/` (või tools.thormen.com PB admin)
2. **Collections → packs → game_type**
3. **Values** / valikud: lisa rida `kinnistu_deal`
4. Save
5. Sama **game_sessions → game_type**
6. Save
7. Lehel `/admin` → **Laadi baasi** Kinnistu Deal sett uuesti

## Või migratsioon

Kui kasutad `pb_migrations`, veendu et `1730000006_kinnistu_deal.js` on käinud
(PB restart / `./pocketbase migrate` / docker recreate **ilma** andmete kaotamiseta kui võimalik).

Olemasoleva andmebaasi peal migratsioon ei pruugi automaatselt uuesti joosta —
siis piisab Admin UI sammudest ülal.
