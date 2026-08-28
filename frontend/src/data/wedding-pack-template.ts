import type { KuldvillakPackData } from '@/lib/pocketbase'

/** Private wedding template — not in public official list. Export/import to your account. */
export const WEDDING_PACK_META = {
  name: 'Kuldvillak – Pulm Aleksander & Riina',
  description: '6 kategooriat: Toit, Piibel, Aleksander–Riina, Words of wisdom, Faktid, 5. klass.',
  game_type: 'kuldvillak' as const,
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
        { points: 100, q: 'Kumb on suurem hommikune unemüts?', a: 'Aprill', hostNote: 'Naljakas sissejuhatus – ära kiirusta vastusega.' },
        { points: 200, q: 'Kuhu pulmapaar lähevad pulmareisile?', a: 'Kreeka', hostNote: 'Võib lisada: „Pakkige päikesekreem!“' },
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
        { points: 100, q: 'Mitu kraadi on täisnurk?', a: '90', hostNote: 'Klassikaline algus – las lapsed kaasa mängida.' },
        { points: 200, q: 'Mis on Eesti pealinn?', a: 'Tallinn' },
        { points: 300, q: 'Mitu planeeti on Päikesesüsteemis (ametlikult praegu)?', a: '8', hostNote: 'Pluuto ei ole enam planeet (2006).' },
        { points: 400, q: 'Mis on vee keemiline valem?', a: 'H₂O' },
        { points: 500, q: 'Kes kirjutas „Kalevipoja“?', a: 'Friedrich Reinhold Kreutzwald' },
      ],
    },
  ],
  finalJeopardy: {
    q: 'Mis aastal algas Aleksandri ja Riina lugu aprillis – st mis aastal nad kurameerima hakkasid? (Host: kui täpset aastat ei tea, kasuta „aprill“-nalja ja anna punktid hea vastuse eest.)',
    a: 'Host otsustab / paar teab täpset aastat',
    hostNote: 'Kui aastat ei ole ette antud, lase paaril endal öelda õige aasta ja kinnita. Panus: iga meeskond panustab enne küsimust.',
    maxWager: 2000,
  },
}
