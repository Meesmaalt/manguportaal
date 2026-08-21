# Õhtu Mängud

**Ainult helifailid + üks käsk.** PocketBase skeem, admin ja frontend tulevad ise.

## 1. Helifailid (ainus käsitsi samm)

Kopeeri need kausta `frontend/public/sounds/`:

```
kuldvillak.mp3
roosidesoda-oige.mp3
roosidesoda-error.mp3
roosidesoda-taustamuusika.mp3
```

Ilma nendeta töötab kõik peale heli.

## 2. Käivita

```bash
docker compose down -v    # puhas start (kustutab vana PB andmed)
docker compose up -d --build
```

| | |
|--|--|
| **Mäng** | http://localhost:3000 (või http://SINU_IP:3000) |
| **Admin** | http://localhost:8090/_/ |
| Admin e-post | `admin@ohtu.local` |
| Admin parool | `ohtu123456` |

Esimene käivitus loob automaatselt:
- admini konto
- kollektsioonid `packs` ja `game_sessions` (kõik 6 mängutüüpi)
- API reeglid

## 3. Mängi

1. Ava mängu leht → **Loo konto** (tavaline kasutaja, mitte admin)
2. Vali mäng → vali set → alusta
3. TV/teine seade: `http://SINU_IP:3000/ekraan/KOOD`

## Mängud

- Kuldvillak, Rooside Sõda, Sõnaseletus, Ma ei ole kunagi, Viimane püsti, Tõde või tegu

## Märkused

- `docker compose down -v` on vajalik, kui varem oli vana/poolik PB andmebaas — muidu migratsioonid võivad vahele jääda.
- Ametlikud packid on frontendis (offline fallback); PB-sse saab neid salvestada mängu käigus.
- Helid: `frontend/public/sounds/` enne `docker compose up --build`.


## Alamtee (reverse proxy)

Kui rakendus on nt `https://domain.ee/mangud/` all:

1. Loo projekti juures `.env`:
```env
BASE_PATH=/mangud
PB_PUBLIC_URL=/mangud/pb
```

2. Nginx peaproxy näide:
```nginx
location /mangud/ {
  proxy_pass http://127.0.0.1:3000/;
  proxy_set_header Host $host;
}
location /mangud/pb/ {
  proxy_pass http://127.0.0.1:8090/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

3. `docker compose up -d --build`

Frontend kasutab suhtelisi assete (`base: './'`) + `env.js` runtime `basePath`.
