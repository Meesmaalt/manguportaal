# Õhtu Mängud

Seltskonnamängude platvorm (Kuldvillak + Rooside Sõda) — **üks käsk ja valmis**.

## Käivitamine (Docker)

```bash
docker compose up -d --build
```

| Teenus        | Aadress                         |
|---------------|---------------------------------|
| **Mäng**      | http://localhost:3000           |
| **PB Admin**  | http://localhost:8090/_/        |

### Admin (PocketBase)

| | |
|-|-|
| E-post | `admin@ohtu.local` |
| Parool | `ohtu123456` |

Kollektsioonid (`packs`, `game_sessions`) luuakse **automaatselt** migratsiooniga esimesel käivitamisel.

### Mängu konto

Ava http://localhost:3000 → **Loo konto** (e-post + parool) → mängi.

### Teises seadmes / teleris

Sessioonikoodiga: `http://SINU_IP:3000/ekraan/KOOD`

Kui frontend ja PB on eri masinatel, sea compose’is:

```yaml
environment:
  PB_PUBLIC_URL: http://192.168.x.x:8090
```

## Ilma Dockerita (dev)

```bash
# Terminal 1 – PocketBase
docker compose up pocketbase -d

# Terminal 2 – frontend
cd frontend
cp .env.example .env   # VITE_PB_URL=http://127.0.0.1:8090
npm install && npm run dev
```

## Mängud

- **Kuldvillak** – Jeopardy-stiilis laud
- **Rooside Sõda** – Family Feud / streigid + bank
- Küsimuste setid (profiilid), host + TV režiim, kontod

## Failid

```
docker-compose.yml          # PB + frontend
pb/pb_migrations/           # automaatne skeem
frontend/                   # React + Vite
```
