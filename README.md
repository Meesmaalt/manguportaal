# Õhtu Mängud – Seltskonnamängude platvorm

Äge, mitmefunktsionaalne seltskonnamängude leht, kus saab kontoga sisse logida, valida küsimuste seti (profiili) ja mängida koos sõpradega.

## Mängud

- **Kuldvillak** – klassikaline Jeopardy-stiilis lauamäng (kategooriad + punktid)
- **Rooside Sõda** – Family Feud / "100 inimest ütles" stiilis voorud, streigid ja bank

## Funktsioonid

- Kasutajakontod (e-post + parool)
- Küsimuste setid / "profiilid" (ametlikud + enda loodud)
- Host-režiim (juht) + TV/ekraani režiim (sessioonikoodiga)
- Reaalajas sünkroniseerimine (PocketBase realtime)
- Tume kuldne visuaalne stiil (originaalmängude vaimus)
- Confetti, streigid, punktid, meeskonnad

## Kiire käivitamine

### 1. Nõuded
- Node.js 20+
- Docker (PocketBase jaoks) **või** PocketBase binaar

### 2. PocketBase käivitamine

```bash
# Variant A – Docker
docker compose up -d

# Variant B – otse (laadi alla https://pocketbase.io)
./pb/pocketbase serve --http=127.0.0.1:8090
```

Avage admin: http://127.0.0.1:8090/_/  
Esimene käivitamine loob admini.  

### 3. Skeem

Mine PocketBase admini → Collections → Import collections  
või käivita migratsioon (vt `pb/pb_migrations`).

Või loo käsitsi järgmised kollektsioonid (vt `pb/SCHEMA.md`).

### 4. Frontend

```bash
cd frontend
cp .env.example .env   # vajadusel muuda VITE_PB_URL
npm install
npm run dev
```

Ava http://localhost:5173

### 5. Demo kasutaja

Registreeri end lehel või loo administ kasutaja.

## Projekti struktuur

```
ohtu-mangud/
├── docker-compose.yml
├── pb/                     # PocketBase andmed + migratsioonid
├── frontend/               # Vite + React + TS + Tailwind
│   ├── src/
│   │   ├── games/          # Kuldvillak & Rooside Sõda
│   │   ├── pages/          # Login, Dashboard, Play, Display
│   │   ├── components/
│   │   ├── data/           # Ametlikud packid
│   │   └── lib/pocketbase.ts
│   └── ...
└── README.md
```

## Kuidas mängida

1. Logi sisse
2. Vali mäng (Kuldvillak või Rooside Sõda)
3. Vali või loo küsimuste set ("profiil")
4. Loo sessioon → saad koodi
5. Ava teises brauseris / teleris `/ekraan/KOOD`
6. Mängi hostist, ekraan näitab ilusat vaadet

## Tehnoloogiad

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion
- **Backend / DB**: PocketBase (SQLite + realtime + auth)
- **Ikoonid**: Lucide
- **Fontid**: Cinzel + Montserrat (originaalide stiil)

## Autorlus

Põhineb sinu originaalkoodidel (`kuldvillak.html` + `Rooside Sõda`).  
Ümber kirjutatud moodsa platvormina.

Head mängimist! 🎉
