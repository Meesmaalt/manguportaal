import type { KuldvillakPackData, RoosidesodaPackData } from '@/lib/pocketbase'

export const KULDVILLAK_KLASSIKA: KuldvillakPackData = {
  categories: [
    {
      name: 'Tehnika & Liiklus',
      questions: [
        { points: 100, q: "Mis akronüümi kannab pidurisüsteem, mis takistab rataste lukustumist?", a: "ABS" },
        { points: 200, q: "Milline legendaarne mudel oli Saksa 'rahvaauto' esimeseks sümboliks?", a: "Põrnikas (Beetle)" },
        { points: 300, q: "Seade, mis muudab heitgaaside surve lisavõimsuseks?", a: "Turbo" },
        { points: 400, q: "Millise Itaalia auto jooniste põhjal ehitati esimene Žiguli?", a: "Fiat" },
        { points: 500, q: "Mehhanism, mis võimaldab ratastel kurvis eri kiirusega pöörelda?", a: "Diferentsiaal" },
      ],
    },
    {
      name: 'Toit & Küpsetised',
      questions: [
        { points: 100, q: "Itaaliapärane ümmargune küpsetis tomatikastme ja juustuga?", a: "Pitsa" },
        { points: 200, q: "Jaapani/Aasia tehnika pehme pärmitaigna saamiseks?", a: "Tangzhong" },
        { points: 300, q: "Maailma kalleim vürts, mida korjatakse krookuse õitest?", a: "Safran" },
        { points: 400, q: "Eesti traditsiooniline põimitud pärmitaignast pidusaia vorm?", a: "Kringel" },
        { points: 500, q: "Reaktsioon aminohapete ja suhkrute vahel liha pruunistumisel?", a: "Maillard'i reaktsioon" },
      ],
    },
    {
      name: 'Piibel & Usundid',
      questions: [
        { points: 100, q: "Islami kõige püham linn?", a: "Meka" },
        { points: 200, q: "Mitu raamatut on protestantlikus Piiblis kokku?", a: "66" },
        { points: 300, q: "Kes oli Piibli andmetel vanimaks elanud inimene (969 a)?", a: "Metuusalah" },
        { points: 400, q: "Mis on maailma väikseim iseseisev riik ja Katoliku kiriku keskus?", a: "Vatikan" },
        { points: 500, q: "Mis kolmes keeles kirjutati Piibli algtekstid?", a: "Hebrea, Kreeka, Aramea" },
      ],
    },
    {
      name: 'Mängud & Meelelahutus',
      questions: [
        { points: 100, q: "Mis arvutimängus ehitatakse plokkidest maailmu?", a: "Minecraft" },
        { points: 200, q: "Ulmesari, kus reisiti läbi täheväravate?", a: "Stargate SG-1" },
        { points: 300, q: "Mitu kaardimasti on tavalises mängukaartide pakis?", a: "4" },
        { points: 400, q: "Lauamäng, kus kogutakse kinnisvara?", a: "Monopoly" },
        { points: 500, q: "Kes lõi Sherlock Holmesi?", a: "Arthur Conan Doyle" },
      ],
    },
    {
      name: 'Eesti',
      questions: [
        { points: 100, q: "Mis on Eesti pealinn?", a: "Tallinn" },
        { points: 200, q: "Eesti rahvuslind?", a: "Suitsupääsuke" },
        { points: 300, q: "Mis aastal taastas Eesti iseseisvuse?", a: "1991" },
        { points: 400, q: "Kes kirjutas 'Tõde ja õigus'?", a: "A. H. Tammsaare" },
        { points: 500, q: "Eesti kõrgeim mägi?", a: "Suur Munamägi" },
      ],
    },
  ],
}

export const KULDVILLAK_PEO: KuldvillakPackData = {
  categories: [
    {
      name: 'Sünnipäev',
      questions: [
        { points: 100, q: "Mis laulu lauldakse peaaegu alati sünnipäeval?", a: "Palju õnne / Happy Birthday" },
        { points: 200, q: "Mida puhutakse tordil ära?", a: "Küünlad" },
        { points: 300, q: "Mis värvi on klassikaline peokaunistus koos kullaga?", a: "Must / valge / roosa (vaba)" },
        { points: 400, q: "Mis on sünnipäevakingi tavaline pakend?", a: "Kinkepaber / karp" },
        { points: 500, q: "Mitmendat sünnipäeva peetakse 'ümmarguseks'?", a: "10, 20, 30... (kümnendid)" },
      ],
    },
    {
      name: 'Film & seriaal',
      questions: [
        { points: 100, q: "Kes on Batman'i tegelik nimi?", a: "Bruce Wayne" },
        { points: 200, q: "Mis planeedilt on Superman?", a: "Krypton" },
        { points: 300, q: "Kes mängis Jacki filmis Titanic?", a: "Leonardo DiCaprio" },
        { points: 400, q: "Mis seriaalis on tegelased Ross, Rachel, Monica?", a: "Friends / Sõbrad" },
        { points: 500, q: "Kes režissööris filmi Inception?", a: "Christopher Nolan" },
      ],
    },
    {
      name: 'Muusika',
      questions: [
        { points: 100, q: "Kes laulis 'Billie Jean'?", a: "Michael Jackson" },
        { points: 200, q: "Mis bändilt on 'Bohemian Rhapsody'?", a: "Queen" },
        { points: 300, q: "Eesti eurolaul 'Everybody' – kes esitas?", a: "Tanel Padar & Dave Benton & 2XL" },
        { points: 400, q: "Mitu keelt on tavalisel kitarril?", a: "6" },
        { points: 500, q: "Kes on 'The Boss'?", a: "Bruce Springsteen" },
      ],
    },
    {
      name: 'Sport',
      questions: [
        { points: 100, q: "Mitu mängijat on jalgpalliväljakul ühes meeskonnas?", a: "11" },
        { points: 200, q: "Mis spordialal kasutatakse 'strike' ja 'spare'?", a: "Keegel / bowling" },
        { points: 300, q: "Kes on Eesti kuulsaim rallisõitja (viimastel aastatel)?", a: "Ott Tänak" },
        { points: 400, q: "Mitu punkti on korvpallis vabavise väärt?", a: "1" },
        { points: 500, q: "Mis aastal toimusid Tallinna olümpiaregatt seotud olümpiaga?", a: "1980" },
      ],
    },
    {
      name: 'Juhuslik',
      questions: [
        { points: 100, q: "Mis värvi on taevas tavaliselt päeval?", a: "Sinine" },
        { points: 200, q: "Mitu päeva on nädalas?", a: "7" },
        { points: 300, q: "Mis on H2O?", a: "Vesi" },
        { points: 400, q: "Mis planeet on Päikesele lähim?", a: "Merkuur" },
        { points: 500, q: "Mis on inimese keha suurim organ?", a: "Nahk" },
      ],
    },
  ],
}

export const KULDVILLAK_EESTI2: KuldvillakPackData = {
  categories: [
    {
      name: 'Geograafia',
      questions: [
        { points: 100, q: "Mis on Eesti suuruselt teine linn?", a: "Tartu" },
        { points: 200, q: "Mis saar on Eesti suurim?", a: "Saaremaa" },
        { points: 300, q: "Mis jõgi läbib Tartut?", a: "Emajõgi" },
        { points: 400, q: "Mis on Eesti sügavaim järv?", a: "Rõuge Suurjärv" },
        { points: 500, q: "Mis on Eesti idapiiri peamine jõgi?", a: "Narva jõgi" },
      ],
    },
    {
      name: 'Ajalugu',
      questions: [
        { points: 100, q: "Mis aastal kuulutati välja Eesti Vabariik?", a: "1918" },
        { points: 200, q: "Kes oli esimene Eesti president?", a: "Konstantin Päts" },
        { points: 300, q: "Mis lahingut peetakse 13. sajandil Jüriöö ülestõusuga seotud?", a: "Jüriöö ülestõus (1343)" },
        { points: 400, q: "Mis lepinguga tunnustas NSVL Eesti iseseisvust 1920?", a: "Tartu rahu" },
        { points: 500, q: "Mis aastal liitus Eesti Euroopa Liiduga?", a: "2004" },
      ],
    },
    {
      name: 'Kultuur',
      questions: [
        { points: 100, q: "Mis on Eesti rahvuslill?", a: "Rukkilill" },
        { points: 200, q: "Kes kirjutas 'Kevade'?", a: "Oskar Luts" },
        { points: 300, q: "Mis festival toimub iga 5 aasta tagant Tallinnas (laulu)?", a: "Laulupidu" },
        { points: 400, q: "Kes on Arvo Pärt?", a: "Helilooja" },
        { points: 500, q: "Mis teatris mängitakse 'Vanemuist'?", a: "Vanemuine (Tartu)" },
      ],
    },
    {
      name: 'Toit & jook',
      questions: [
        { points: 100, q: "Mis on kama?", a: "Jahu segu / jook" },
        { points: 200, q: "Mis on verivorst?", a: "Traditsiooniline vorst (verega)" },
        { points: 300, q: "Mis on kiluvõileib?", a: "Võileib kiluga" },
        { points: 400, q: "Mis limonaad on Eesti klassika 'kalev' kõrval?", a: "Kali / limonaad (nt. limpa)" },
        { points: 500, q: "Mis on 'mulgikapsad'?", a: "Hapukapsad sealihaga / mulgi toit" },
      ],
    },
    {
      name: 'Loodus',
      questions: [
        { points: 100, q: "Mis on Eesti rahvusloom?", a: "Hunt" },
        { points: 200, q: "Mis on Eesti rahvuskala?", a: "Räim" },
        { points: 300, q: "Mis puu on Eesti rahvuspuu?", a: "Tamm" },
        { points: 400, q: "Mis on Soomaa tuntud nähtus kevadel?", a: "Suurvesi / 'viies aastaaeg'" },
        { points: 500, q: "Mis on Meteorietikraater Saaremaal?", a: "Kaali kraater" },
      ],
    },
  ],
}

export const ROOSIDESODA_KLASSIKA: RoosidesodaPackData = {
  rounds: [
    {
      title: 'VOOR 1',
      multiplier: 1,
      question: 'Nimeta midagi, mida inimesed tihti kaotavad?',
      answers: [
        { text: 'Võtmed', points: 42 },
        { text: 'Mobiiltelefon', points: 28 },
        { text: 'Prillid', points: 14 },
        { text: 'Raha / Rahakott', points: 9 },
        { text: 'Mõistus / Kannatus', points: 5 },
      ],
    },
    {
      title: 'VOOR 2',
      multiplier: 1,
      question: 'Mis on esimene asi, mida teed hommikul ärgates?',
      answers: [
        { text: 'Avan silmad', points: 38 },
        { text: 'Käin tualetis', points: 25 },
        { text: 'Vaatan telefoni', points: 18 },
        { text: 'Joon kohvi', points: 12 },
        { text: 'Venitan', points: 7 },
      ],
    },
    {
      title: 'VOOR 3',
      multiplier: 2,
      question: 'Nimeta toit, mida süüakse tavaliselt kätega?',
      answers: [
        { text: 'Pitsa', points: 45 },
        { text: 'Burger', points: 30 },
        { text: 'Friikartulid', points: 12 },
        { text: 'Võileib', points: 8 },
        { text: 'Kanatiivad', points: 5 },
      ],
    },
    {
      title: 'VOOR 4',
      multiplier: 2,
      question: 'Nimeta asi, mida võtad randa kaasa',
      answers: [
        { text: 'Rätik', points: 30 },
        { text: 'Päikesekreem', points: 25 },
        { text: 'Ujumistrikoo', points: 18 },
        { text: 'Jook', points: 12 },
        { text: 'Päikeseprillid', points: 8 },
      ],
    },
    {
      title: 'Finaal',
      multiplier: 3,
      question: 'Nimeta asi, mida tehakse peol',
      answers: [
        { text: 'Tantsitakse', points: 26 },
        { text: 'Juakse', points: 22 },
        { text: 'Süüakse', points: 18 },
        { text: 'Vesteldakse', points: 15 },
        { text: 'Lauldakse', points: 10 },
      ],
    },
  ],
}

export const ROOSIDESODA_KODU: RoosidesodaPackData = {
  rounds: [
    {
      title: 'VOOR 1',
      multiplier: 1,
      question: 'Nimeta midagi, mis on köögis',
      answers: [
        { text: 'Nuga', points: 24 },
        { text: 'Pott / pann', points: 20 },
        { text: 'Külmkapp', points: 18 },
        { text: 'Taldrikud', points: 15 },
        { text: 'Sool / pipar', points: 12 },
        { text: 'Mikser', points: 11 },
      ],
    },
    {
      title: 'VOOR 2',
      multiplier: 1,
      question: 'Nimeta asi, mida teed nädalavahetusel',
      answers: [
        { text: 'Magan kauem', points: 32 },
        { text: 'Vaatan seriaali', points: 22 },
        { text: 'Kohtun sõpradega', points: 18 },
        { text: 'Koristan', points: 12 },
        { text: 'Käin õues', points: 10 },
      ],
    },
    {
      title: 'VOOR 3',
      multiplier: 2,
      question: 'Nimeta pet-loom',
      answers: [
        { text: 'Koer', points: 40 },
        { text: 'Kass', points: 35 },
        { text: 'Kala', points: 10 },
        { text: 'Hamster', points: 8 },
        { text: 'Papagoi', points: 5 },
      ],
    },
    {
      title: 'VOOR 4',
      multiplier: 2,
      question: 'Nimeta midagi, mida ostad poest alati',
      answers: [
        { text: 'Piim', points: 28 },
        { text: 'Leib', points: 24 },
        { text: 'Muna', points: 16 },
        { text: 'Või', points: 12 },
        { text: 'Kohv', points: 10 },
      ],
    },
    {
      title: 'Finaal',
      multiplier: 3,
      question: 'Nimeta põhjus, miks hilined',
      answers: [
        { text: 'Alarm ei helisenud', points: 30 },
        { text: 'Liiklus', points: 25 },
        { text: 'Ei leidnud võtmeid', points: 15 },
        { text: 'Ülemagamine', points: 14 },
        { text: 'Ühistransport', points: 10 },
      ],
    },
  ],
}

export type SonaseletusPackData = { words: string[]; roundSeconds?: number }
export type MaEiOleKunagiPackData = { statements: string[] }
export type ViimanePustiPackData = { statements: string[]; startingLives?: number }
export type TodeVoiTeguPackData = { truths: string[]; dares: string[] }

export const SONASELETUS_KLASSIKA: SonaseletusPackData = {
  roundSeconds: 60,
  words: [
    'Banaan','Jalgratas','Päikeseloojang','Raamatukogu','Kohvimasin','Lumememm','Klaver','Teleskoop',
    'Sünnipäevatort','Vihmavari','Kosmoselaev','Hambapasta','Rulluisud','Pitsa','Mikrofon','Kaktus',
    'Tõukeratas','Muinasjutt','Fotokaamera','Jääkaru','Metroo','Šokolaad','Tuletorn','Diivan',
    'Pardipoeg','Kontsert','Seljakott','Kuu','Traktor','Jõulupuu','Akkordion','Ballett','Diplomitöö',
    'Energiajook','Fänn','Garaaž','Hügromeeter','Internet','Jogurt','Kameeleon','Latern','Magnet',
    'Nomad','Ooper','Piraat','Quiz','Robot','Saxophone','Termos','Ukulele','Vampiir','Wifi','Xylofon',
    'Jaht','Zeppelin','Aeroobika','Biskviit','Cappuccino',
  ],
}

export const SONASELETUS_EESTI: SonaseletusPackData = {
  roundSeconds: 60,
  words: [
    'Vastlapäev','Kama','Mulgikapsas','Laulupidu','Suitsupääsuke','Kalevipoeg','Sauna','Võrukeeel',
    'Seto leib','Rukkilill','Kärdla','Otepää','Pärnu rand','Viru värav','Teletorn','Lahemaa',
    'Kihu','Saku','A. H. Tammsaare','Arvo Pärt','Sikut','Kohuke','Verivorst','Sipelgapesa',
    'Metskits','Ilves','Rabajärv','Kivinõmme','Õllesummer','Poska',
  ],
}

export const MA_EI_OLE_KUNAGI: MaEiOleKunagiPackData = {
  statements: [
    'Ma ei ole kunagi unustanud kellegi sünnipäeva',
    'Ma ei ole kunagi magama jäänud kinos',
    'Ma ei ole kunagi valetanud vanematele oma asukoha kohta',
    'Ma ei ole kunagi söönud midagi, mis langes maha',
    'Ma ei ole kunagi naernud valel hetkel',
    'Ma ei ole kunagi saatnud sõnumit valele inimesele',
    'Ma ei ole kunagi teeselnud, et olen haige, et töölt puududa',
    'Ma ei ole kunagi laulnud dušši all',
    'Ma ei ole kunagi vaadanud seriaali ühe ööga läbi',
    'Ma ei ole kunagi kaotanud võtmeid',
    'Ma ei ole kunagi joonud liiga palju kohvi',
    'Ma ei ole kunagi unustanud telefoni koju',
    'Ma ei ole kunagi tantsinud peol nagu keegi ei vaataks',
    'Ma ei ole kunagi proovinud süüa midagi väga vürtsikat',
    'Ma ei ole kunagi nutnud filmi pärast',
    'Ma ei ole kunagi rääkinud iseendaga valjusti',
    'Ma ei ole kunagi maganud päev läbi',
    'Ma ei ole kunagi unustanud pesu pesumasinasse',
    'Ma ei ole kunagi ostnud midagi, mida ma ei vajanud',
    'Ma ei ole kunagi proovinud uut soengut ja kahetsenud',
    'Ma ei ole kunagi sõitnud valesse bussi',
    'Ma ei ole kunagi unustanud kohtumist',
    'Ma ei ole kunagi naernud nii, et tuli jooksis silmist',
    'Ma ei ole kunagi magama jäänud loengus / koosolekul',
    'Ma ei ole kunagi proovinud karaoke',
    'Ma ei ole kunagi unustanud sõbra nime',
    'Ma ei ole kunagi söönud magustoitu enne põhirooga',
    'Ma ei ole kunagi vaadanud lastesaadet täiskasvanuna',
    'Ma ei ole kunagi teeselnud, et kuulab',
    'Ma ei ole kunagi ostnud midagi ainult soodushinna pärast',
  ],
}

export const VIIMANE_PUSTI: ViimanePustiPackData = {
  startingLives: 3,
  statements: [
    'Kes on kunagi magama jäänud bussis või rongis?',
    'Kes on kunagi unustanud kellegi nime kohe pärast tutvumist?',
    'Kes on kunagi saatnud häälsonumi ja kahetsenud?',
    'Kes on kunagi söönud magustoitu enne põhirooga?',
    'Kes on kunagi vaadanud lastesaadet täiskasvanuna?',
    'Kes on kunagi teeselnud, et kuulab, aga ei kuulanud?',
    'Kes on kunagi naernud niikaua, et kõht valutas?',
    'Kes on kunagi proovinud uut hobi ja loobunud esimesel nädalal?',
    'Kes on kunagi unustanud pesu kuivama panna?',
    'Kes on kunagi laulnud valesti karaoke?',
    'Kes on kunagi maganud töökoosolekul?',
    'Kes on kunagi ostnud midagi ainult soodushinna pärast?',
    'Kes on kunagi rääkinud unes?',
    'Kes on kunagi unustanud sünnipäevakingi osta viimasel minutil?',
    'Kes on kunagi tantsinud peegli ees?',
    'Kes on kunagi proovinud süüa putru sõrmedega?',
    'Kes on kunagi unustanud auto parkla koha?',
    'Kes on kunagi naernud valel matusel / tõsisel hetkel?',
    'Kes on kunagi proovinud DIY projekti, mis ebaõnnestus?',
    'Kes on kunagi magama jäänud filmide maratoni ajal?',
  ],
}

export const TODE_VOI_TEGU: TodeVoiTeguPackData = {
  truths: [
    'Mis on sinu kõige piinlikum mälestus?',
    'Kellele sa viimati valetastesid ja miks?',
    'Mis on sinu salajane talent?',
    'Mis on kõige veidram asi, mida oled söönud?',
    'Kes selles toas meeldib sulle kõige rohkem ja miks?',
    'Mis on sinu suurim hirm?',
    'Mis on sinu unistuste reis?',
    'Kas oled kunagi kellegi sõnumeid salaja lugenud?',
    'Mis on sinu lemmik lapsemeelne asi, mida ikka teed?',
    'Mis on üks asi, mida sa ei ütleks oma vanematele?',
    'Kes oli sinu esimene armumine?',
    'Mis on kõige julgem asi, mida oled teinud?',
    'Mis on sinu lemmik seriaal praegu?',
    'Kas usud kummitustesse?',
    'Mis on sinu kõige hullem harjumus?',
    'Kui sa võiksid olla keegi teine üheks päevaks, kes?',
    'Mis laulu sa salaja laulad?',
    'Mis on sinu unistuste töö?',
  ],
  dares: [
    'Tee 10 kükki praegu',
    'Laula 15 sekundit valitud laulu',
    'Räägi 30 sekundit naljakal häälel',
    'Saada viimasele kontakti sõnum „Tere! Kuidas läheb?“',
    'Imiteeri kedagi toas 20 sekundit',
    'Joo klaas vett ühe sõõmuga',
    'Tee 5 push-upi',
    'Räägi kompliment igale mängijale',
    'Tantsi 20 sekundit ilma muusikata',
    'Räägi oma telefoni viimasest fotost',
    'Räägi nalja – kui keegi ei naera, kaotad vooru',
    'Räägi 20 sekundit ainult riimidega',
    'Tee oma parim looma hääl',
    'Seisa ühel jalal 30 sekundit',
    'Lase teistel valida sulle soeng 1 minutiks',
  ],
}

export const TODE_VOI_TEGU_SOFT: TodeVoiTeguPackData = {
  truths: [
    'Mis on sinu lemmiktoit?',
    'Kas oled pigem hommiku- või õhtuinimene?',
    'Mis film paneb sind alati naerma?',
    'Mis on sinu lemmik aastaaeg?',
    'Kas eelistad merd või mägesid?',
    'Mis on sinu lemmikapp telefonis?',
    'Kas oled kunagi proovinud ekstremspordi?',
    'Mis on sinu go-to karaoke lugu?',
    'Kas sa koristad enne külalisi või „piisavalt hästi“?',
    'Mis on sinu lemmik lapsepõlve mäng?',
  ],
  dares: [
    'Naerata 20 sekundit järjest',
    'Ütle midagi toredat oma kõrvalistujale',
    'Näita oma lemmik tantsuliigutust',
    'Räägi 15 sekundit väga aeglaselt',
    'Tee „high five“ kõigiga',
    'Joonista õhku oma lemmikloom',
    'Loe numbrid 1–20 tagurpidi',
    'Imiteeri uudisteankrut 15 sekundit',
  ],
}


export const KULDVILLAK_PULM_ALEKSANDER_RIINA: KuldvillakPackData = {
  categories: [
    {
      name: 'Toit',
      questions: [
        { points: 100, q: 'Mis on Eesti rahvustoit, mida tihti süüakse hapukoorega?', a: 'Verivorst / mulgikapsad (mõlemad OK)' },
        { points: 200, q: 'Mis Itaalia roog on ümmargune, tomatikastme ja juustuga?', a: 'Pitsa' },
        { points: 300, q: 'Mis on maailma kalleim vürts, mida korjatakse krookuse õitest?', a: 'Safran' },
        { points: 400, q: 'Mis prantsuse magustoit on “põletatud kreem” ehk karamellise pealispinnaga?', a: 'Crème brûlée' },
        { points: 500, q: 'Mis on Jaapani riisist ja toorest kalast valmistatud roog?', a: 'Sushi' },
      ],
    },
    {
      name: 'Piibel',
      questions: [
        { points: 100, q: 'Kes ehitas laeva, et pääseda veeuputusest?', a: 'Noa' },
        { points: 200, q: 'Mitmes päevas lõi Jumal maailma (1. Moosese järgi)?', a: 'Kuue päevaga (7. puhkas)' },
        { points: 300, q: 'Kes reetis Jeesuse 30 hõbeseekli eest?', a: 'Juudas Iskariot' },
        { points: 400, q: 'Mis on Uue Testamendi esimene raamat?', a: 'Matteuse evangeelium' },
        { points: 500, q: 'Mis linnas sündis Jeesus?', a: 'Betlemm' },
      ],
    },
    {
      name: 'Aleksander–Riina',
      questions: [
        { points: 100, q: 'Kumb on suurem hommikune unemüts?', a: 'Aprill' },
        { points: 200, q: 'Kuhu pulmapaar lähevad pulmareisile?', a: 'Kreeka' },
        { points: 300, q: 'Mis kuul hakkasid Aleksander ja Riina kurameerima?', a: 'Aprill' },
        { points: 400, q: 'Mis oli Riina esimene töökoht?', a: 'Maxima' },
        { points: 500, q: 'Mis on Aleksandri esimese kodukoguduse nimi?', a: 'RCCG' },
      ],
    },
    {
      name: 'Words of wisdom',
      questions: [
        { points: 100, q: 'Täienda vanasõna: „Homikune tund on …“', a: '… kullast väärt / kullaväärtusega' },
        { points: 200, q: 'Piibel: „Armastus on pikkameelne, armastus on …“ (1Kr 13)', a: 'lahke' },
        { points: 300, q: 'Vanasõna: „Kes teisele auku kaevab, …“', a: '… see ise sisse kukub' },
        { points: 400, q: 'Piibel: „Kõik on võimalik sellele, kes …“ (Mk 9:23)', a: 'usub' },
        { points: 500, q: 'Vanasõna: „Paremini karta kui …“', a: '… kahetseda / hiljem kahetseda' },
      ],
    },
    {
      name: 'Faktid',
      questions: [
        { points: 100, q: 'Mis on maailma kõrgeim mägi?', a: 'Everest' },
        { points: 200, q: 'Mitmes kontinendil asub Egiptus peamiselt?', a: 'Aafrika' },
        { points: 300, q: 'Mis planeet on Päikesele lähim?', a: 'Merkuur' },
        { points: 400, q: 'Mis on inimese keha suurim organ?', a: 'Nahk' },
        { points: 500, q: 'Mis elemendi keemiline sümbol on Au?', a: 'Kuld' },
      ],
    },
    {
      name: '5. klass',
      questions: [
        { points: 100, q: 'Mitu kraadi on täisnurk?', a: '90' },
        { points: 200, q: 'Mis on Eesti pealinn?', a: 'Tallinn' },
        { points: 300, q: 'Mitu planeeti on Päikesesüsteemis (ametlikult praegu)?', a: '8' },
        { points: 400, q: 'Mis on vee keemiline valem?', a: 'H₂O' },
        { points: 500, q: 'Kes kirjutas „Kalevipoja“?', a: 'Friedrich Reinhold Kreutzwald' },
      ],
    },
  ],
}

export const OFFICIAL_PACKS = [
  {
    name: 'Kuldvillak – Pulm Aleksander & Riina',
    description: '6 kategooriat: Toit, Piibel, Aleksander–Riina, Words of wisdom, Faktid, 5. klass.',
    game_type: 'kuldvillak' as const,
    data: KULDVILLAK_PULM_ALEKSANDER_RIINA,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Kuldvillak – Klassika',
    description: 'Tehnika, toit, piibel, mängud, Eesti. Valmis peoks.',
    game_type: 'kuldvillak' as const,
    data: KULDVILLAK_KLASSIKA,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Kuldvillak – Peoõhtu',
    description: 'Sünnipäev, film, muusika, sport, juhuslik.',
    game_type: 'kuldvillak' as const,
    data: KULDVILLAK_PEO,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Kuldvillak – Eesti 2',
    description: 'Geograafia, ajalugu, kultuur, toit, loodus.',
    game_type: 'kuldvillak' as const,
    data: KULDVILLAK_EESTI2,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Rooside Sõda – Klassika',
    description: 'Viis vooru klassikaliste küsimustega.',
    game_type: 'roosidesoda' as const,
    data: ROOSIDESODA_KLASSIKA,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Rooside Sõda – Kodu & argipäev',
    description: 'Köök, nädalavahetus, lemmikloomad, pood, hilinemine.',
    game_type: 'roosidesoda' as const,
    data: ROOSIDESODA_KODU,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Sõnaseletus – Klassika',
    description: '60+ sõna, 60 sekundi voorud.',
    game_type: 'sonaseletus' as const,
    data: SONASELETUS_KLASSIKA,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Sõnaseletus – Eesti',
    description: 'Eesti teemalised sõnad.',
    game_type: 'sonaseletus' as const,
    data: SONASELETUS_EESTI,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Ma ei ole kunagi – Peo sett',
    description: '30 lõbusat väidet.',
    game_type: 'ma_ei_ole_kunagi' as const,
    data: MA_EI_OLE_KUNAGI,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Viimane püsti – Klassika',
    description: '3 elu, 20 väidet.',
    game_type: 'viimane_pusti' as const,
    data: VIIMANE_PUSTI,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Tõde või tegu – Peo sett',
    description: 'Julgemad tõed ja teod.',
    game_type: 'tode_voi_tegu' as const,
    data: TODE_VOI_TEGU,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Tõde või tegu – Soft',
    description: 'Rahulikum sett perele / alguseks.',
    game_type: 'tode_voi_tegu' as const,
    data: TODE_VOI_TEGU_SOFT,
    is_official: true,
    is_public: true,
  },
]
