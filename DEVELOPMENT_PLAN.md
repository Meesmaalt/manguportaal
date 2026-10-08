# Mänguportaali arendusplaan

Eesmärk: ekraanil on mäng ja selle olukord; telefonis on hetkel vajalikud tegevused. Pakihaldus, AI ja seadistamine ei tohi mängu üle võtta.

## Valmis v3.34

1. Kinnistu Deal on kaardiareeni vormis: vastaste portreed ülal, oma kinnistud all, pakk ning sündmus laua keskel. Rent, sihtmärk ja kinnistu valitakse otse areenilt. Senine kaitse- ja maksevoog säilib.
2. UNO Flex on menüüs, galeriis, pakiloomises, esitusloendis ja adminis. Graafiline laud, mängujuhi ooteruum, mängijate telefonilingid ja telerivaade.
3. Eraldi reeglimootor ning tehingupõhine PocketBase’i käiguteenus; UNO tabamine, +4 vaidlustamine, jõud ja kõik Flex-tegevused. Vooru võit, ilma koondpunktideta.
4. Reegli- ja brauseritestid ning päris PocketBase’i integratsioon: migratsioon, pakiseeme, tokenid, käiguõigus, korduspäringud ja pulss.

## Valmis v3.33

1. Kinnistu Deali numbritabelite asemele koodis joonistatud kinnistud ja linnaosad. Komplektide, üüri ning maja/hotelli info säilib. Avalik laud jaguneb mängijate linnadeks; see ei lisa kaardimängule eksitavat liikumisrada.
2. Sõnaseletuse ajaring ja paus/jätkamine, sõnade ühekordne kasutamine ning paki finaal koos viigi toetusega.
3. Viimase püsti elude visuaalne ülevaade ja eksliku kliki tagasivõtmine. Tagasivõtmine säilib sessioonis ka värskendamisel.
4. Tõde või tegu kasutatud kaartide ajalugu ja paki lõpp. Ma ei ole kunagi edenemine ja paki lõpp.
5. Mängujuhi lisavalikute koondamine, korduva lähtestusnupu eemaldamine, lehtede ja mängude laadimine vajadusel.

## Järgmised arendusetapid

1. Kinnistu Deali maksete ja kinnistuvahetuste sidumine lähte- ja sihtkohaga täiendavate lauaanimatsioonide kaudu.
2. Kuldvillaku ja Rooside Sõja voorude, finaalide ning mängujuhi õigete/valede vastuste tegevuste kasutatavuse audit päris seltskonna peal.
3. Püsivad lõpukokkuvõtted ja ühe nupuga järgmine mäng esitusloendis.
4. Mitme füüsilise seadme katsetus tegelikus paigalduses: kaks telefoni, teler ja võrgu katkestus/taasühendus. Uno serveri samaaegseid päringuid on katsetatud; füüsilisi seadmeid selles keskkonnas polnud.
5. Privaatsete kaardikätesse ligipääsu eraldamine API tasemel; praegune portaali sessioonimudel on avalik.

## Kujunduspõhimõtted

- SVG ja CSS: terav pilt teleris, väike lisamaht, ei vaja väliseid pilditeenuseid.
- Värvi kõrval jäävad nimed, arvud ja olekusildid.
- Väikesel ekraanil paigutuvad linnaosad vertikaalselt; avalikke kinnistunimesid ei peideta.
- V3.34 lisab Uno jaoks mängutüübi ja paki migratsiooniga; vanad mängud ei vaja andmete teisendamist.
