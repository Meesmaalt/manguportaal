# Mängude Portaal — PocketBase (lihtne versioon)

Nagu soovisid: tagasi PocketBase'i peale, MySQL/Express eemaldatud. Sinu
kolm mängufaili on peaaegu puutumata — muutsin igas failis **ainult ühte
rida**.

## Mis viga oli ja kuidas see nüüd fikseeritud on

Vaataja konsoolis:

```
Mixed Content: ... HTTPS ... requested an insecure resource 'http://192.168.88.38:8090/...'
```

Su leht jooksis `https://tools.thormen.com` peal, aga PocketBase'i
aadress oli kõvasti koodi sisse kirjutatud kui
`http://192.168.88.38:8090` — turvamata + kohalik LAN-IP. Brauser
blokeeris selle.

**Lahendus, mis jääb lihtsaks:** PocketBase oskab **ise serveerida ka su
HTML-faile** (`pb_public` kaust), mitte ainult API-t. Kui PocketBase
serveerib nii lehte kui API-t, on need automaatselt samal domeenil ja
samal protokollil — mixed content probleem kaob täielikult, ükskõik kus
sa selle lõpuks avalikuks teed.

Iga failis (`index.html`, `kuldvillak.html`,
`roosidesoda/roosidesoda-admin.html`) vahetasin ainult selle rea:

```diff
- const pb = new PocketBase('http://192.168.88.38:8090');
+ const pb = new PocketBase(window.location.origin);
```

`window.location.origin` tähendab "see sama domeen/port, kust see leht
ise avati" — nii see töötab automaatselt õigesti nii kohalikus arenduses
(`http://localhost:8090`) kui ka toodangus (`https://tools.thormen.com`),
ilma et peaksid IP-sid kunagi enam koodi kõvasti sisse kirjutama.

Ülejäänud mänguloogika (skoorid, kaardid, meeskonnad, localStorage,
confetti) on **täpselt samaks jäetud**.

## Struktuur

```
mangude-portaal-pb/
├── docker-compose.yml
└── pb_public/              # PocketBase serveerib SEDA kausta ise
    ├── index.html
    ├── kuldvillak.html
    └── roosidesoda/
        ├── index.html
        └── roosidesoda-admin.html
```

Käivitamisel tekib juurde `pb_data/` kaust (PocketBase loob selle ise) —
seal on kogu su andmebaas (SQLite fail) ja üleslaaditud failid. **Seda
kausta varunda regulaarselt**, see ongi kogu su andmebaas.

## Käivitamine

```bash
cd mangude-portaal-pb
docker compose up -d
```

Ava brauseris: **http://localhost:8090/_/** (või oma serveri IP peal) —
see on PocketBase'i enda Admin UI. Loo seal esimene admin-konto (see on
*eraldi* asi su mängijate kontodest, see on ainult sinu haldusliides).

Su mängude leht ise on: **http://localhost:8090/**

## Kollektsiooni seadistus (üks kord, Admin UI kaudu)

PocketBase'il on juba sisseehitatud `users` kollektsioon autentimiseks —
seda pole vaja ise luua. Pead looma ainult `games` kollektsiooni:

1. Admin UI-s: **Collections → New collection**
2. Nimi: `games`, tüüp: **Base**
3. Lisa väljad:
   - `title` — Text, kohustuslik (Required)
   - `game_type` — Text (või Select väärtustega `kuldvillak`,
     `roosidesoda`, kui tahad rangemat kontrolli)
   - `data` — JSON
   - `user` — Relation → kollektsioon `users`, **Single**, Required
4. Vaheta vahekaardile **API Rules** ja pane igale reale (List/Search,
   View, Create, Update, Delete) sama tingimus, mis lubab kasutajal
   näha/muuta ainult *oma* mänge:

   - **List/Search rule:** `user = @request.auth.id`
   - **View rule:** `user = @request.auth.id`
   - **Create rule:** `@request.auth.id != "" && @request.data.user = @request.auth.id`
   - **Update rule:** `user = @request.auth.id`
   - **Delete rule:** `user = @request.auth.id`

   See on turvaoluline samm — ilma nendeta (kui reeglid on tühjad) näeb
   iga sisselogitud kasutaja kõikide teiste mänge, mitte ainult enda omi.

5. Salvesta.

Sellega ongi kõik — mine tagasi `http://localhost:8090/`, registreeru
kasutajana ja proovi mängu luua.

## Reverse proxy HestiaCP kaudu (kui Docker on teises masinas)

Nagu eelmine kord rääkisime — see on täiesti OK. HestiaCP masinas seadista
domeenile proxy, mis suunab PocketBase'i konteineri pordile:

```
proxy_pass http://<docker-masina-IP>:8090/;
```

See sisemine hüpe ei pea ise HTTPS olema (brauser räägib ainult
HestiaCP-ga HTTPS üle) — see on tavapärane. Kuna PocketBase serveerib nüüd
ka frontendi ise, on kõik, mida brauser näeb, üks ja seesama HTTPS-domeen,
`window.location.origin` järgib seda automaatselt.

Turvalisuse mõttes: ära ava porti `8090` kogu internetile otse — luba
ligipääs ainult HestiaCP masina IP-lt (tulemüüriga), ja avalik ligipääs
käigu ainult läbi HestiaCP HTTPS-i.

## Testimine enne "päris" kasutust

Minu keskkonnas polnud PocketBase'i ega internetiühendust, et seda
reaalselt käivitada — kontrollisin kõik JS-i süntaktiliselt üle
(`node --check`), viga polnud. Enne päris kasutust tee läbi:

1. `docker compose up -d`, ava Admin UI, loo admin.
2. Loo `games` kollektsioon ülalkirjeldatud viisil (väljad + API rules).
3. Ava `http://localhost:8090/`, registreeru tavakasutajana.
4. Loo Kuldvillaku mäng, ava "Mängi/Halda", muuda küsimusi, "Salvesta ja
   Sulge".
5. Mine portaali tagasi — kontrolli, et pealkiri/andmed püsisid.
6. Logi välja, logi uuesti sisse — mäng peab ikka seal olema.
7. Proovi teise (uue) kasutajaga sisse logida ja kontrolli, et see EI näe
   esimese kasutaja mänge (see testib API Rules).

## Mida järgmisena laiendada

1. **HTTPS reverse proxy paika** (nagu ülal) — see on ainuke asi, mis
   veel su enda serveris tegemata.
2. **Regulaarne `pb_data/` varundus** — nt cron job, mis kopeerib selle
   kausta kuhugi mujale iga öö. See ongi kogu su andmebaas.
3. **Parema `game_type` kontrolli** — vaheta see väli Select tüübiks
   (mitte lihtsalt Text), et vältida kirjavigu tulevikus.
4. **Tailwind CDN hoiatus** brauseri konsoolis — pole kiireloomuline, aga
   Tailwind CLI annaks toodangusse ühe väikese `.css` faili suure CDN
   skripti asemel.
