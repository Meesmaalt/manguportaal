# Invalid value miljonar

PocketBase `packs.game_type` (ja `game_sessions.game_type`) on **select** väli.
Uus mängupeab olema lubatud väärtuste listis, muidu tagastab PocketBase:

`validation_invalid_value` · Invalid value miljonar

## Kiire lahendus PocketBase Admin UI kaudu (1 minut):

1. Ava oma PocketBase admin paneel: `https://SINU_PB_URL/_/`
2. Mine vasakult menüüst: **Collections → packs**
3. Klõpsa väljale **game_type**
4. **Values** nimekirjas lisa uus väärtus: `miljonar`
5. Vajuta **Save changes**
6. Mine **Collections → game_sessions**
7. Klõpsa väljale **game_type** ja lisa samuti **Values** listi: `miljonar`
8. Vajuta **Save changes**

Seejärel saad pakki kohe salvestada ja avalikustada!
