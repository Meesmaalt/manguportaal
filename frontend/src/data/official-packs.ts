import type { KuldvillakPackData, RoosidesodaPackData } from '@/lib/pocketbase'

/** Ametlikud packid – seeditakse esimesel käivitamisel või kasutatakse offline fallbackina */

export const KULDVILLAK_KLASSIKA: KuldvillakPackData = {
  categories: [
    {
      name: 'Autod',
      questions: [
        { points: 100, q: "Mis akronüümi kannab pidurisüsteem, mis takistab rataste lukustumist?", a: "ABS" },
        { points: 200, q: "Milline legendaarne mudel oli Saksa 'rahvaauto' esimeseks sümboliks?", a: "Põrnikas (Beetle)" },
        { points: 300, q: "Seade, mis muudab heitgaaside surve lisavõimsuseks?", a: "Turbo" },
        { points: 400, q: "Millise Itaalia auto jooniste põhjal ehitati esimene Žiguli?", a: "Fiat" },
        { points: 500, q: "Mehhanism, mis võimaldab ratastel kurvis eri kiirusega pöörelda?", a: "Diferentsiaal" },
      ],
    },
    {
      name: 'Köök',
      questions: [
        { points: 100, q: "Itaaliapärane ümmargune küpsetis tomatikastme ja juustuga?", a: "Pitsa" },
        { points: 200, q: "Jaapani/Aasia tehnika pehme pärmitaigna saamiseks (jahu-vee pudru keetmine)?", a: "Tangzhong" },
        { points: 300, q: "Maailma kalleim vürts, mida korjatakse krookuse õitest?", a: "Safran" },
        { points: 400, q: "Eesti traditsiooniline põimitud pärmitaignast pidusaia vorm?", a: "Kringel" },
        { points: 500, q: "Reaktsioon aminohapete ja suhkrute vahel liha pruunistumisel?", a: "Maillard'i reaktsioon" },
      ],
    },
    {
      name: 'Religioon',
      questions: [
        { points: 100, q: "Islami kõige püham linn?", a: "Meka" },
        { points: 200, q: "Mitu raamatut on protestantlikus Piiblis kokku?", a: "66" },
        { points: 300, q: "Kes oli Piibli andmetel vanimaks elanud inimene (969 a)?", a: "Metuusalah" },
        { points: 400, q: "Mis on maailma väikseim iseseisev riik ja Katoliku kiriku keskus?", a: "Vatikan" },
        { points: 500, q: "Mis kolmes keeles kirjutati Piibli algtekstid?", a: "Hebrea, Kreeka, Aramea" },
      ],
    },
    {
      name: 'Mängud & Kultuur',
      questions: [
        { points: 100, q: "Mis arvutimängus ehitatakse plokkidest maailmu ja võideldakse Creeperitega?", a: "Minecraft" },
        { points: 200, q: "Populaarne ulmesari, kus reisiti läbi täheväravate?", a: "Stargate SG-1" },
        { points: 300, q: "Mitu kaardimasti on tavalises mängukaartide pakis?", a: "4" },
        { points: 400, q: "Millises klassikalises lauamängus kogutakse kinnisvara ja maksad üüri?", a: "Monopoly" },
        { points: 500, q: "Kes lõi tegelaskuju Sherlock Holmes?", a: "Arthur Conan Doyle" },
      ],
    },
    {
      name: 'Eesti',
      questions: [
        { points: 100, q: "Mis on Eesti pealinn?", a: "Tallinn" },
        { points: 200, q: "Milline lind on Eesti rahvuslind?", a: "Suitsupääsuke" },
        { points: 300, q: "Mis aastal taastas Eesti iseseisvuse (taasiseseisvumine)?", a: "1991" },
        { points: 400, q: "Kes kirjutas 'Tõde ja õigus'?", a: "A. H. Tammsaare" },
        { points: 500, q: "Mis on Eesti kõrgeim mägi?", a: "Suur Munamägi" },
      ],
    },
  ],
}

export const KULDVILLAK_SYNNEPAEV: KuldvillakPackData = {
  categories: [
    {
      name: 'Sünnipäev',
      questions: [
        { points: 100, q: "Mitu küünalt on tavaliselt tordil?", a: "Nii mitu kui vanust" },
        { points: 200, q: "Mis laulu lauldakse sünnipäeval peaaegu alati?", a: "Happy Birthday / Palju õnne" },
        { points: 300, q: "Mis värvi on klassikaline sünnipäevaballoon?", a: "Mitmevärviline / kuldne" },
        { points: 400, q: "Mis on sünnipäevakingi kõige tavalisem pakend?", a: "Karp / paber" },
        { points: 500, q: "Mis on sünnipäeva tähistamise peamine eesmärk?", a: "Tähistada eluaastat / koos olla" },
      ],
    },
    {
      name: 'Sõbrad',
      questions: [
        { points: 100, q: "Kes on sinu parim sõber?", a: "(vaba vastus)" },
        { points: 200, q: "Mis on teie lemmikühine tegevus?", a: "(vaba vastus)" },
        { points: 300, q: "Kus te esimest korda kohtusite?", a: "(vaba vastus)" },
        { points: 400, q: "Mis on kõige naljakam mälestus koos?", a: "(vaba vastus)" },
        { points: 500, q: "Mis kingitust sa kõige rohkem tahaksid?", a: "(vaba vastus)" },
      ],
    },
    {
      name: 'Mälestused',
      questions: [
        { points: 100, q: "Mis oli sinu esimene telefon?", a: "(vaba vastus)" },
        { points: 200, q: "Mis oli lemmik seri/film lapsepõlves?", a: "(vaba vastus)" },
        { points: 300, q: "Mis oli kõige hullem soeng?", a: "(vaba vastus)" },
        { points: 400, q: "Mis oli esimene kontsert?", a: "(vaba vastus)" },
        { points: 500, q: "Mis on kõige piinlikum lugu?", a: "(vaba vastus)" },
      ],
    },
    {
      name: 'Tulevik',
      questions: [
        { points: 100, q: "Kuhu tahaksid järgmisena reisida?", a: "(vaba vastus)" },
        { points: 200, q: "Mis oskust tahaksid õppida?", a: "(vaba vastus)" },
        { points: 300, q: "Mis on unistuste töö?", a: "(vaba vastus)" },
        { points: 400, q: "Kus elad 10 aasta pärast?", a: "(vaba vastus)" },
        { points: 500, q: "Mis on sinu elu motto?", a: "(vaba vastus)" },
      ],
    },
    {
      name: 'Juhuslik',
      questions: [
        { points: 100, q: "Mis on sinu lemmiktoit?", a: "(vaba vastus)" },
        { points: 200, q: "Kass või koer?", a: "(vaba vastus)" },
        { points: 300, q: "Mis on sinu peidetud talent?", a: "(vaba vastus)" },
        { points: 400, q: "Mis on kõige veidram asi, mida oled söönud?", a: "(vaba vastus)" },
        { points: 500, q: "Kui sa oleksid superkangelane, mis võime sul oleks?", a: "(vaba vastus)" },
      ],
    },
  ],
}

export const ROOSIDESODA_KLASSIKA: RoosidesodaPackData = {
  rounds: [
    {
      title: 'VOOR 1',
      multiplier: 1,
      question: 'Nimeta midagi, mida inimesed teevad sünnipäeval',
      answers: [
        { text: 'Sööb torti', points: 28 },
        { text: 'Avab kingitusi', points: 22 },
        { text: 'Laulab Palju õnne', points: 18 },
        { text: 'Puhub küünlaid', points: 15 },
        { text: 'Korraldab pidu', points: 10 },
        { text: 'Helistab sõpradele', points: 7 },
      ],
    },
    {
      title: 'VOOR 2',
      multiplier: 1,
      question: 'Nimeta asi, mida võtad randa kaasa',
      answers: [
        { text: 'Rätik', points: 30 },
        { text: 'Päikesekreem', points: 25 },
        { text: 'Ujumistrikoo / püksid', points: 18 },
        { text: 'Jook / vesi', points: 12 },
        { text: 'Raamat / telefon', points: 8 },
        { text: 'Päikeseprillid', points: 7 },
      ],
    },
    {
      title: 'VOOR 3',
      multiplier: 2,
      question: 'Nimeta midagi, mis on köögis',
      answers: [
        { text: 'Nuga', points: 24 },
        { text: 'Pott / pann', points: 20 },
        { text: 'Külmkapp', points: 18 },
        { text: 'Taldrikud', points: 15 },
        { text: 'Mikser / blender', points: 12 },
        { text: 'Sool / pipar', points: 11 },
      ],
    },
    {
      title: 'VOOR 4',
      multiplier: 2,
      question: 'Nimeta Eesti kuulus inimene',
      answers: [
        { text: 'Kerli / laulja', points: 20 },
        { text: 'Arvo Pärt', points: 18 },
        { text: 'Kristina Šmigun', points: 15 },
        { text: 'Jüri Ratas / poliitik', points: 14 },
        { text: 'Ott Tänak', points: 12 },
        { text: 'Lenna Kuurmaa', points: 11 },
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
        { text: 'Räägitakse / vesteldakse', points: 15 },
        { text: 'Lauldakse', points: 10 },
        { text: 'Tehakse fotosid', points: 9 },
      ],
    },
  ],
}

export const OFFICIAL_PACKS = [
  {
    name: 'Kuldvillak – Klassika',
    description: 'Autod, köök, religioon, mängud ja Eesti – valmis mängimiseks.',
    game_type: 'kuldvillak' as const,
    data: KULDVILLAK_KLASSIKA,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Kuldvillak – Sünnipäev',
    description: 'Sünnipäeva, sõprade ja mälestuste teemaline set. Paljud vabad vastused.',
    game_type: 'kuldvillak' as const,
    data: KULDVILLAK_SYNNEPAEV,
    is_official: true,
    is_public: true,
  },
  {
    name: 'Rooside Sõda – Klassika',
    description: 'Viis vooru klassikaliste küsimustega. Valmis kohe mängima.',
    game_type: 'roosidesoda' as const,
    data: ROOSIDESODA_KLASSIKA,
    is_official: true,
    is_public: true,
  },
]
