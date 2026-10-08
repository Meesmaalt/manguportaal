# Mänguportaali arendusplaan

Eesmärk: ekraanil on mäng ja selle olukord; telefonis on hetkel vajalikud tegevused. Pakihaldus, AI ja seadistamine ei tohi mängu üle võtta.

## Valmis selles uuenduses

1. Kinnistu Deali numbritabelite asemele koodis joonistatud kinnistud ja linnaosad. Komplektide, üüri ning maja/hotelli info säilib. Avalik laud jaguneb mängijate linnadeks; see ei lisa kaardimängule eksitavat liikumisrada.
2. Sõnaseletuse ajaring ja paus/jätkamine, sõnade ühekordne kasutamine ning paki finaal koos viigi toetusega.
3. Viimase püsti elude visuaalne ülevaade ja eksliku kliki tagasivõtmine. Tagasivõtmine säilib sessioonis ka värskendamisel.
4. Tõde või tegu kasutatud kaartide ajalugu ja paki lõpp. Ma ei ole kunagi edenemine ja paki lõpp.
5. Mängujuhi lisavalikute koondamine, korduva lähtestusnupu eemaldamine, lehtede ja mängude laadimine vajadusel.

## Järgmised arendusetapid

1. Kinnistu Deali sihtmärgi valimine otse graafilisel linnaosal; maksete ja kinnistuvahetuste sidumine lähte- ja sihtkohaga. Praegu on valikute tegemine olemasolevates kontrollides ning sündmused senises animatsioonikihis.
2. Kuldvillaku ja Rooside Sõja voorude, finaalide ning mängujuhi õigete/valede vastuste tegevuste kasutatavuse audit päris seltskonna peal.
3. Püsivad lõpukokkuvõtted ja ühe nupuga järgmine mäng esitusloendis.
4. PocketBase'i mitme seadme katsetus: kaks telefoni, teler, katkestus/taasühendus ja samaaegsed vastused. Seda vajab eraldi töötav backend; kohalik brauseritest ei tõesta pilvesünkroonimist.

## Kujunduspõhimõtted

- SVG ja CSS: terav pilt teleris, väike lisamaht, ei vaja väliseid pilditeenuseid.
- Värvi kõrval jäävad nimed, arvud ja olekusildid.
- Väikesel ekraanil paigutuvad linnaosad vertikaalselt; avalikke kinnistunimesid ei peideta.
- Uued sessiooniandmed on vabatahtlikud; skeemi ega vanu pakke ei ole vaja muuta.
