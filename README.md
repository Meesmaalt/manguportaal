# Õhtu Mängud

## Party checklist (15 minutes)

1. Open the site on your **phone** (host).
2. Tap a game → pick a pack → **Play** (no account needed).
3. On the host screen, open **Ava teleris / Open on TV**:
   - Scan the **QR** with the TV/laptop camera, **or**
   - Open the link / enter the code at `/ekraan` on the second device.
4. Phone = controls. TV = board only. Status should read **Live** (cloud) or **Same device** (local).
5. Play ~15 minutes. Reset from the host toolbar when done.

**Two physical devices** need PocketBase reachable (`PB_PUBLIC_URL`). Local-only mode works for two tabs on the same browser/device.

---


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


## Alamtee (reverse proxy) – tools.thormen.com/mangud

**Oluline:** Vite `base` peab olema absoluutne `/mangud/` (mitte `./`).
Deep-link `/mangud/ekraan/KOOD` muidu otsib JS-i valest kaustast.

### 1. `.env` projekti juures
```env
BASE_PATH=/mangud
PB_PUBLIC_URL=http://127.0.0.1:8090
```
Kui brauser ei pääse serveri localhostile, kasuta avalikku hosti:
```env
PB_PUBLIC_URL=https://tools.thormen.com:8090
```
(või ava port 8090 firewallis / proksi PB eraldi)

### 2. `docker-compose.yml` build arg
```yaml
args:
  VITE_BASE_PATH: "/mangud/"
```

### 3. Nginx (host)
```nginx
location /mangud/ {
  proxy_pass http://127.0.0.1:3000/mangud/;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Prefix /mangud;
}

# PocketBase – kas eraldi port 8090 VÕI:
location /mangud/pb/ {
  proxy_pass http://127.0.0.1:8090/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

**proxy_pass lõpus olev `/mangud/`** on tähtis, kui frontend container teenindab teid juba `/mangud/` prefiksiga (Vite base).

Kui frontend containeris on failid juures (`/index.html`), kasuta:
```nginx
location /mangud/ {
  proxy_pass http://127.0.0.1:3000/;
}
```
ja **buildi `VITE_BASE_PATH=/mangud/`** ikkagi – brauser küsib `/mangud/assets/...`, nginx eemaldab prefiksi `proxy_pass .../` abil.

### 4. Rebuild
```bash
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

Kontrolli brauseris:
- View Source → script src peaks olema `/mangud/assets/...`
- `/mangud/env.js` peab olema JavaScript, mitte HTML


## V2 Game-show upgrade

This release keeps the existing game/session architecture and adds a presentation layer rather than replacing the working backend. Highlights:
- Fullscreen game-show frame for Kuldvillak and TV-friendly presentation.
- Animated question reveal, score pulse, progress bar and winner screen.
- Keyboard shortcuts in Kuldvillak host mode: `M` music, `R` reset, `Esc` close question.
- Lightweight WebAudio effects for reveal/correct/wrong/victory/click states; no new audio assets required.
- Playlist now persists locally, supports reordering and clearing.
- Improved visual depth, live status, TV framing and responsive controls.

The project still uses PocketBase realtime sessions and the existing local-session fallback.


## V2.5 Room mode

- Host: QR + link + code + connection status
- TV: `/ekraan` or `/ekraan/CODE`, connection chip, no admin chrome
- Rooside Sõda aligned with Kuldvillak show presentation


## v2.7 – Buzzer multi-device + pack import

After deploy, restart PocketBase so migration `1730000004_guest_sessions_and_buzz.js` runs.
This allows guest session create/update so **buzzer and TV work across networks**.

Wedding pack is **not** in the public list. Use `/pulm` → Export JSON → (logged in) Import pack.
