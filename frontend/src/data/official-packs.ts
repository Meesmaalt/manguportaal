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
        { points: 100, q: "Mis arvutimängus ehitatakse plokkidest maailmu ja võideldakse Creeperitega?", a: "Minecraft" },
        { points: 200, q: "Populaarne ulmesari, kus reisiti läbi täheväravate?", a: "Stargate SG-1" },
        { points: 300, q: "Mitu kaardimasti on tavalises mängukaartide pakis?", a: "4" },
        { points: 400, q: "Millises klassikalises lauamängus kogutakse kinnisvara?", a: "Monopoly" },
        { points: 500, q: "Kes lõi tegelaskuju Sherlock Holmes?", a: "Arthur Conan Doyle" },
      ],
    },
    {
      name: 'Eesti',
      questions: [
        { points: 100, q: "Mis on Eesti pealinn?", a: "Tallinn" },
        { points: 200, q: "Milline lind on Eesti rahvuslind?", a: "Suitsupääsuke" },
        { points: 300, q: "Mis aastal taastas Eesti iseseisvuse?", a: "1991" },
        { points: 400, q: "Kes kirjutas 'Tõde ja õigus'?", a: "A. H. Tammsaare" },
        { points: 500, q: "Mis on Eesti kõrgeim mägi?", a: "Suur Munamägi" },
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
      ],
    },
    {
      title: 'VOOR 4',
      multiplier: 2,
      question: 'Nimeta midagi, mida võtad randa kaasa',
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

export type SonaseletusPackData = { words: string[]; roundSeconds?: number }
export type MaEiOleKunagiPackData = { statements: string[] }
export type ViimanePustiPackData = { statements: string[]; startingLives?: number }
export type TodeVoiTeguPackData = {
  truths: string[]
  dares: string[]
}

export const SONASELETUS_KLASSIKA: SonaseletusPackData = {
  roundSeconds: 60,
  words: [
    'Banaan', 'Jalgratas', 'Päikeseloojang', 'Raamatukogu', 'Kohvimasin',
    'Lumememm', 'Klaver', 'Teleskoop', 'Sünnipäevatort', 'Vihmavari',
    'Kosmoselaev', 'Hambapasta', 'Rulluisud', 'Pitsa', 'Mikrofon',
    'Kaktus', 'Tõukeratas', 'Muinasjutt', 'Fotokaamera', 'Jääkaru',
    'Metroo', 'Šokolaad', 'Tuletorn', 'Diivan', 'Pardipoeg',
    'Kontsert', 'Seljakott', 'Kuu', 'Traktor', 'Jõulupuu',
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
  ],
}

export const VIIMANE_PUSTI: ViimanePustiPackData = {
  startingLives: 3,
  statements: [
    'Kes on kunagi magama jäänud bussis/rongis?',
    'Kes on kunagi unustanud kellegi nime hetk pärast tutvumist?',
    'Kes on kunagi saatnud häälsonumi ja kahetsenud?',
    'Kes on kunagi söönud magustoitu enne põhirooga?',
    'Kes on kunagi vaadanud lastesaadet täiskasvanuna?',
    'Kes on kunagi teeselnud, et kuulab, aga tegelikult ei kuulanud?',
    'Kes on kunagi naernud niikaua, et kõht valutas?',
    'Kes on kunagi proovinud uut hobi ja loobunud esimesel nädalal?',
    'Kes on kunagi unustanud pesu kuivama panna?',
    'Kes on kunagi laulnud valesti karaoke?',
    'Kes on kunagi maganud töökoosolekul?',
    'Kes on kunagi ostnud midagi ainult sellepärast, et see oli soodushinnaga?',
    'Kes on kunagi rääkinud unes?',
    'Kes on kunagi unustanud sünnipäevakingi osta viimasel minutil?',
    'Kes on kunagi tantsinud peegli ees?',
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
  ],
  dares: [
    'Tee 10 kükki praegu',
    'Laula 15 sekundit valitud laulu',
    'Räägi 30 sekundit naljakal häälel',
    'Saada viimasele kontakti sõnum “Tere! Kuidas läheb?”',
    'Imiteeri kedagi toas 20 sekundit',
    'Joo klaas vett ühe sõõmuga',
    'Tee 5 push-upi',
    'Räägi kompliment igale mängijale',
    'Tantsi 20 sekundit ilma muusikata',
    'Räägi oma telefoni viimasest fotost',
    'Pane silmad kinni ja lase teistel valida sulle midagi teha (ohutult)',
    'Räägi nalja – kui keegi ei naera, joogid / kaotad punkti',
  ],
}

export const OFFICIAL_PACKS = [
  {
    name: 'Kuldvillak – Klassika',
    description: 'Tehnika, toit, piibel, mängud, Eesti.',
    game_type: 'kuldvillak' as const,
    data: KULDVILLAK_KLASSIKA,
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
    name: 'Sõnaseletus – Klassika',
    description: '30 sõna, 60 sekundi voorud.',
    game_type: 'sonaseletus' as const,
    data: SONASELETUS_KLASSIKA,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Ma ei ole kunagi – Peo sett',
    description: '20 kerget ja lõbusat väidet.',
    game_type: 'ma_ei_ole_kunagi' as const,
    data: MA_EI_OLE_KUNAGI,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Viimane püsti – Klassika',
    description: '3 elu, väited, viimane järelejäänu võidab.',
    game_type: 'viimane_pusti' as const,
    data: VIIMANE_PUSTI,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Tõde või tegu – Peo sett',
    description: 'Tõed ja teod peoks.',
    game_type: 'tode_voi_tegu' as const,
    data: TODE_VOI_TEGU,
    is_official: true,
    is_public: true,
  },
]
