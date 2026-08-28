# PocketBase bootstrap (admin + collections)

## Admin login (vaikimisi)

| Väli | Väärtus |
|------|---------|
| URL | `https://tools.thormen.com:8090/_/` |
| Email | `admin@ohtu.local` |
| Password | `ohtu123456` |

Kui ei tööta, loo käsitsi (stack peab jooksma):

```bash
docker exec -it ohtu-pb /usr/local/bin/pocketbase superuser upsert admin@ohtu.local ohtu123456 --dir=/pb_data
```

## Collections

```bash
# Kas migratsioonid on konteineris?
docker exec ohtu-pb ls -la /pb_migrations

# Logid
docker logs ohtu-pb 2>&1 | tail -80
```

Kui `packs` / `game_sessions` ikka puuduvad → Admin UI → Import → `pb/collections.json`

## Õige compose command

**Ära** kasuta `command: serve ...` (möödub entrypointist).

Kasuta:

```yaml
command:
  - --migrationsDir=/pb_migrations
environment:
  PB_ADMIN_EMAIL: admin@ohtu.local
  PB_ADMIN_PASSWORD: ohtu123456
```
