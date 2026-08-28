# Kollektsioonid puuduvad (packs / game_sessions)

Veateade *Missing or invalid collection context* + URL `…/mangud/pb` tähendab:

- PocketBase **vastab** (URL OK)
- Andmebaasis **pole** `packs` ja/või `game_sessions` skeemi

## A) Kiireim: import adminis (soovitatud)

1. Ava **https://tools.thormen.com:8090/_/**  
   (või sinu hosti port 8090 admin)
2. Logi sisse superuseriga
3. **Collections** → **Import collections** (või Settings → Import)
4. Vali fail: `pb/collections.json` sellest projektist
5. Salvesta / Import
6. Värskenda mängu lehte

Kontroll: Collections nimekirjas peavad olema **packs** ja **game_sessions**.

## B) Migratsioonidega restart

```bash
# konteineris peab nägema faile:
docker exec ohtu-pb ls -la /pb_migrations

docker compose up -d --force-recreate pocketbase
docker compose logs pocketbase 2>&1 | tail -60
```

Otsi logist: `[ohtu] packs` / `game_sessions CREATED`.

Kui `/pb_migrations` on tühi, on Portaineris **vale working directory** / volume path (`./pb/pb_migrations` ei leia faile).

## C) Compose command

`docker-compose.yml` peab andma:

```yaml
command: serve --http=0.0.0.0:8090 --dir=/pb_data --migrationsDir=/pb_migrations
volumes:
  - ./pb/pb_migrations:/pb_migrations:ro
```
