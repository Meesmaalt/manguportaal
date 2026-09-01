import type { BlitzQuestion } from './types'

export const BLITZ_CLASSIC_QUESTIONS: BlitzQuestion[] = [
  { id: 'b1', q: 'Mis on Eesti pealinn?', choices: ['Tartu', 'Tallinn', 'Pärnu', 'Narva'], correct: 1 },
  { id: 'b2', q: 'Mitu mängijat on jalgpalliväljakul ühes meeskonnas?', choices: ['9', '10', '11', '12'], correct: 2 },
  { id: 'b3', q: 'Mis värvi on küps banaan tavaliselt?', choices: ['Roheline', 'Punane', 'Kollane', 'Sinine'], correct: 2 },
  { id: 'b4', q: 'Milline neist on planeet?', choices: ['Kuu', 'Päike', 'Mars', 'Polaarstaar'], correct: 2 },
  { id: 'b5', q: 'Mis aastal taasiseseisvus Eesti (20. saj)?', choices: ['1989', '1991', '1994', '2004'], correct: 1, hostNote: '20. august 1991' },
  { id: 'b6', q: 'Kui palju on 7 × 8?', choices: ['54', '56', '63', '48'], correct: 1 },
  { id: 'b7', q: 'Milline loom ei oska lennata?', choices: ['Kotkas', 'Pingviin', 'Pääsuke', 'Kull'], correct: 1 },
  { id: 'b8', q: 'Mis on H2O?', choices: ['Hapnik', 'Vesi', 'Heelium', 'Sool'], correct: 1 },
  { id: 'b9', q: 'Kumb on suurem?', choices: ['1 km', '1000 m', 'Sama suured', 'Sõltub ilmast'], correct: 2 },
  { id: 'b10', q: 'Mis keeles räägitakse peamiselt Prantsusmaal?', choices: ['Saksa', 'Hispaania', 'Prantsuse', 'Itaalia'], correct: 2 },
  { id: 'b11', q: 'Mitu päeva on liigaastas?', choices: ['365', '366', '364', '360'], correct: 1 },
  { id: 'b12', q: 'Milline on õige järjekord?', choices: ['g, kg, mg', 'mg, g, kg', 'kg, mg, g', 'g, mg, kg'], correct: 1 },
  { id: 'b13', q: 'Mis on Eesti interneti domeen?', choices: ['.ee', '.et', '.es', '.eu'], correct: 0 },
  { id: 'b14', q: 'Mitu kontinentit on tavapäraselt loetletud?', choices: ['5', '6', '7', '8'], correct: 2 },
  { id: 'b15', q: 'Mis värvi on Eesti lipu ülemine triip?', choices: ['Must', 'Valge', 'Sinine', 'Punane'], correct: 2 },
]

export const BLITZ_PARTY_QUESTIONS: BlitzQuestion[] = [
  { id: 'p1', q: 'Mis on klassikaline peomängu jooginõu?', choices: ['Tass', 'Klaas', 'Kauss', 'Kulp'], correct: 1 },
  { id: 'p2', q: 'Kui keegi ütleb „proosit“, mida sa teed?', choices: ['Magad', 'Tõstad klaasi', 'Lahkud', 'Laulad hümni'], correct: 1 },
  { id: 'p3', q: 'Mis tuleb tavaliselt enne torti?', choices: ['Magustoit', 'Pearoog', 'Hommikusöök', 'Uneaeg'], correct: 1 },
  { id: 'p4', q: 'Mis on karaoke?', choices: ['Tants', 'Laulmine mikrofoniga', 'Kabe', 'Jooks'], correct: 1 },
  { id: 'p5', q: 'Mitu sekundit on minutis?', choices: ['30', '60', '100', '90'], correct: 1 },
  { id: 'p6', q: 'Mis on „DJ“?', choices: ['Dokumendihaldur', 'Diskor', 'Doktor', 'Direktor'], correct: 1 },
  { id: 'p7', q: 'Mis sobib peo sisekujundusse kõige vähem?', choices: ['Tuled', 'Muusika', 'Vaikus kell 3 öösel naabri jaoks', 'Suur haamer'], correct: 3 },
  { id: 'p8', q: 'Kuidas lõpetatakse tihti peokõne?', choices: ['Head ööd', 'Terviseks', 'Kohtumiseni kohtus', 'Ctrl+Z'], correct: 1 },
  { id: 'p9', q: 'Mis on photobooth?', choices: ['Fotoala', 'Köök', 'Garderoob', 'WC'], correct: 0 },
  { id: 'p10', q: 'Mis tuleb teha, kui telefon heliseb keset kõnet?', choices: ['Ignoreeri viisakalt', 'Viska aknast', 'Vasta valjult', 'Süüta toru'], correct: 0 },
]

export const BLITZ_WEDDING_QUESTIONS: BlitzQuestion[] = [
  { id: 'w1', q: 'Mis on klassikaline pulmakook?', choices: ['Šokolaad', 'Mitmekihiline tort', 'Batoon', 'Sai'], correct: 1 },
  { id: 'w2', q: 'Kes tavaliselt peab esimese kõne?', choices: ['DJ', 'Sõbramees / isahärra', 'Kelner', 'Fotograaf'], correct: 1 },
  { id: 'w3', q: 'Mis on “pruutneitsi”?', choices: ['Köök', 'Pruudi tugiisik', 'Tort', 'Autokorteež'], correct: 1 },
  { id: 'w4', q: 'Mida tehakse tihti esimese tantsuga?', choices: ['Suhkrut', 'Aeglane tants', 'Jooks', 'Karaoke'], correct: 1 },
  { id: 'w5', q: 'Mis on confetti?', choices: ['Jook', 'Värviline paberipuru', 'Lill', 'Laudlina'], correct: 1 },
  { id: 'w6', q: 'Kuhu pannakse tihti abielusõrmus?', choices: ['Paremasse taskusse', 'Nimetissõrmele', 'Vasaku käe sõrmusele', 'Kaela'], correct: 2 },
  { id: 'w7', q: 'Mis on “mesinädalad”?', choices: ['Töönädal', 'Pulmareis', 'Dieet', 'Eksam'], correct: 1 },
  { id: 'w8', q: 'Mis sobib kõige vähem pulmalauale?', choices: ['Lilled', 'Küünlad', 'Kettsaag', 'Nimi kaardid'], correct: 2 },
  { id: 'w9', q: 'Mida tähendab “proosit”?', choices: ['Head ööd', 'Terviseks', 'Maksa arve', 'Kiiresti'], correct: 1 },
  { id: 'w10', q: 'Kes viskab tihti lillekimbu?', choices: ['Peig', 'Pruut', 'DJ', 'Kokk'], correct: 1 },
]

export const BLITZ_OFFICE_QUESTIONS: BlitzQuestion[] = [
  { id: 'o1', q: 'Mis on “deadline”?', choices: ['Puhkus', 'Tähtaeg', 'Lõuna', 'Zoom'], correct: 1 },
  { id: 'o2', q: 'Mis on Slack / Teams?', choices: ['Kohv', 'Suhtlustööriist', 'Printer', 'Tool'], correct: 1 },
  { id: 'o3', q: 'Mis tuleb enne “Reply All” vajutamist teha?', choices: ['Mõtle järele', 'Karju', 'Kustuta firma', 'Saada 10 korda'], correct: 0 },
  { id: 'o4', q: 'Mis on “out of office”?', choices: ['Olen eemal', 'Olen boss', 'Olen liftis', 'Olen trükkimas'], correct: 0 },
  { id: 'o5', q: 'Kõige ohtlikum kontorilause?', choices: ['“Kiire 5 min koosolek”', '“Head nädalavahetust”', '“Kohv on valmis”', '“Kena särk”'], correct: 0 },
  { id: 'o6', q: 'Mis on VPN?', choices: ['Kohviautomaat', 'Turvaline võrguühendus', 'Puhkeruum', 'Parkimiskoht'], correct: 1 },
  { id: 'o7', q: 'Mis on “standup”?', choices: ['Tants', 'Lühike staatusekoosolek', 'Magamine', 'Palk'], correct: 1 },
  { id: 'o8', q: 'Printeri klassikaline seisund?', choices: ['Alati töötab', 'Paber otsas / error', 'Laulab', 'Teeb kohvi'], correct: 1 },
  { id: 'o9', q: 'Mis on “CC” meilis?', choices: ['Koopia', 'Salajane', 'Kustuta', 'Kiire'], correct: 0 },
  { id: 'o10', q: 'Parim remote-töö riietus alakehale?', choices: ['Smoking', 'Dressipüksid', 'Dressid / komfort', 'Suusasaapad'], correct: 2 },
]

export const BLITZ_KIDS_QUESTIONS: BlitzQuestion[] = [
  { id: 'k1', q: 'Mis värvi on taevas tavaliselt päeval?', choices: ['Roheline', 'Sinine', 'Lilla', 'Must'], correct: 1 },
  { id: 'k2', q: 'Mitu jalga on kassil?', choices: ['2', '3', '4', '6'], correct: 2 },
  { id: 'k3', q: 'Mis ütleb lehm?', choices: ['Mäu', 'Auh', 'Muu', 'Kraaks'], correct: 2 },
  { id: 'k4', q: 'Mis on 2 + 2?', choices: ['3', '4', '5', '22'], correct: 1 },
  { id: 'k5', q: 'Mis sõidab rööbastel?', choices: ['Auto', 'Rong', 'Paat', 'Jalgratas'], correct: 1 },
  { id: 'k6', q: 'Mis on külm ja valge talvel taevast?', choices: ['Vihm', 'Lumi', 'Liiv', 'Lehed'], correct: 1 },
  { id: 'k7', q: 'Mis on banaani värv kui ta on küps?', choices: ['Sinine', 'Kollane', 'Must', 'Hall'], correct: 1 },
  { id: 'k8', q: 'Kes elab meres ja on suur?', choices: ['Kass', 'Vaal', 'Kana', 'Sipelgas'], correct: 1 },
  { id: 'k9', q: 'Mitu päeva on nädalas?', choices: ['5', '6', '7', '10'], correct: 2 },
  { id: 'k10', q: 'Mis aitab näha pimedas toas?', choices: ['Kivi', 'Valgus / lamp', 'Paber', 'Vaip'], correct: 1 },
]
