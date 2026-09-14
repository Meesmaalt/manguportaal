import type { Lang } from './translations'

const guides = {
  et: {
    kuldvillak: `Klassikaline teadmistemäng stiilis „Kuldvillak“.

Kaks (või rohkem) meeskonda võistlevad punktide nimel. Laual on kategooriad ja erineva väärtusega küsimused — kergemad annavad vähem, raskemad rohkem.

Meeskond valib teema ja panuse, vastab küsimusele ning teenib või kaotab punkte. Mängu lõpus võib tulla „viimane voor“ suurema panusega.

Sobib: peod, pulmad, sünnipäevad, kus tahad nutikat võistlust ja suurt ekraani.`,
    roosidesoda: `Kiire peremäng stiilis „perevõistlus“: üks meeskond mängib, teine ootab järge.

Host loeb küsimuse; meeskond püüab arvata populaarseid vastuseid. Õiged vastused koguvad banki, valed annavad streike. Kolm streiki — voor lõpeb ja bank võib vahetada omanikku.

Tempo on kõrge, nalja on palju. Sobib suurtele seltskondadele ja telerile.`,
    sonaseletus: `Sõnaseletusmäng: üks mängija seletab sõnu, teised arvavad.

Voorul on taimer; õiged arvamused annavad punkte. Tiimid vahetuvad, kuni sett või kokkulepitud voorud on läbi.

Sobib: lõbus keelemäng, mis sobib nii noortele kui täiskasvanutele.`,
    ma_ei_ole_kunagi: `Klassikaline peomäng „Ma ei ole kunagi…“.

Loetakse väiteid; need, kelle kohta väide kehtib, tunnustavad (sõrm, lonks, punkt — nagu seltskond lepib).

Kerge, sotsiaalne, hea jäämurdja. Reeglite rangekus on teie otsustada.`,
    viimane_pusti: `Ellujäämismäng väidetega.

Igaühel on elud. Kui väide kehtib sinu kohta, kaotad elu. Elud otsas — välja. Viimane püsti jäänu võidab.

Pinge kasvab voor voorult. Sobib peole, kus tahad dramaatilist lõppu.`,
    kinnistu_deal: `Kinnistu Deal — kinnisvarakaardid peoks.

Eesmärk: kogu 3 täielikku kinnistukomplekti (värvid). Iga käik: võta 2 kaarti, mängi kuni 3, limiit 7 käes.

Raha → panka, kinnistu → oma reale, tegevused (üür, vargus, tehingumurdja…) → vali vastane. Host juhib; TV näitab lauda.

Ei ole Hasbro toode — peo versioon eesti kinnistunimedega.`,
    blitz: `Blitz — kiire trivia show.

Küsimused telefonis, teleril suur lava. Õige + kiirus = punktid. Üksinda või tiimides.

Host juhib; külalised liituvad lingi/QR-iga. Sobib peole ja kontorisse — kõrge tempo.`,
    miljonar: `Kes tahab saada miljonäriks — klassikaline teleshow atmosfäär.

15 küsimust kasvava raskusastmega (100 € kuni 1 000 000 €).
Turvasummad (5. ja 10. tase) tagavad väljakukkumisel võidu.

4 õlekõrt (vihjet):
• 50:50 — eemaldab kaks valet vastust
• Rahva hääl — publik hääletab nutitelefonist QR-koodiga
• Helista sõbrale — 30-sekundiline taimer ja helistamine
• Küsimuse vahetus — asendab praeguse küsimuse varuküsimusega

Mängija võib igal ajal enne lukustamist mängu pooleli jätta ja võidetud summa kaasa võtta.`,
    tode_voi_tegu: `Tõde või tegu — julged küsimused ja ülesanded.

Mängija valib: vastata ausalt või teha tegu. Sett annab ideid; seltskond hoiab piire.

Klassikaline peomäng, sobib sõpradele, kes tahavad naerda ja üksteist proovile panna.`,
  },
  en: {
    kuldvillak: `A classic quiz show in the spirit of Jeopardy.

Teams compete for points across categories and valued questions — easier ones pay less, harder ones more.

Pick a topic and stake, answer, and score. A high-stakes final round can close the game.

Great for parties, weddings, and birthdays when you want a smart contest on a big screen.`,
    roosidesoda: `A fast family-feud style game: one team plays while the other waits.

A question is read; the team tries popular answers. Correct answers fill the bank; misses add strikes. Three strikes end the round and the bank may change hands.

High energy, lots of laughs — ideal for large groups and a TV.`,
    sonaseletus: `Word explanation: one player describes words, others guess.

Rounds run on a timer; correct guesses score. Teams take turns until the pack or agreed rounds are done.

A lively language game for mixed ages.`,
    ma_ei_ole_kunagi: `The classic party game “Never have I ever…”.

Statements are read; anyone it applies to acknowledges (finger, sip, point — house rules).

Light, social, a great icebreaker. Strictness is up to you.`,
    viimane_pusti: `A survival game of statements.

Everyone has lives. If a statement applies to you, you lose a life. No lives left — you're out. Last one standing wins.

Tension builds every round — perfect for a dramatic party finish.`,
    kinnistu_deal: `Property Deal — party property card game.

Goal: collect 3 complete color sets. Each turn: draw 2, play up to 3, hand limit 7.

Money to bank, properties to your rows, actions target opponents. Host runs turns; TV shows the table.

Not affiliated with Hasbro — party rules with local property names.`,
    tode_voi_tegu: `Truth or dare — bold questions and challenges.

Players choose honesty or action. The pack suggests prompts; the group sets the limits.

Classic party fun for friends who want laughs and a little courage.`,
    blitz: `Blitz — fast trivia show.

Questions on phones; TV is the stage. Correct + speed = points.

Host runs rounds; guests join via link or QR.`,
    miljonar: `Who Wants to Be a Millionaire — classic game show suspense.

15 levels of increasing difficulty (€100 to €1,000,000).
Safety net milestones at levels 5 and 10 guarantee prizes.

4 Lifelines:
• 50:50 — eliminates two incorrect choices
• Ask the Audience — live smartphone voting via QR code
• Phone a Friend — 30-second countdown phone lifeline
• Switch the Question — swaps question with a backup

Players can walk away at any time before locking in an answer and take home their winnings.`,
  },
  ru: {
    kuldvillak: `Классическая викторина в духе «Своей игры».

Команды соревнуются за очки: категории и вопросы разной стоимости — проще меньше, сложнее больше.

Выбор темы и ставки, ответ, счёт. В финале возможен раунд с высокой ставкой.

Для вечеринок, свадеб и дней рождения — умное состязание на большом экране.`,
    roosidesoda: `Быстрая игра в стиле семейной вражды: одна команда играет, другая ждёт.

Вопрос читают; команда угадывает популярные ответы. Верные пополняют банк, ошибки — штрафы. Три штрафа — конец раунда, банк может сменить хозяина.

Много энергии и смеха — для большой компании и ТВ.`,
    sonaseletus: `Объяснение слов: один объясняет, другие угадывают.

Раунды на таймере; верные ответы дают очки. Команды по очереди.

Живая языковая игра для разного возраста.`,
    ma_ei_ole_kunagi: `Классика «Я никогда не…».

Читают фразы; кого это касается — отмечает (палец, глоток, очко — ваши правила).

Лёгкая, социальная, отличный лёд. Строгость — на ваш вкус.`,
    viimane_pusti: `Игра на выживание.

У всех есть жизни. Фраза про вас — минус жизнь. Без жизней — вылет. Последний побеждает.

Напряжение растёт с каждым раундом.`,
    kinnistu_deal: `Сделка за недвижимость — карточная вечеринка.

Цель: 3 полных цветовых набора. Ход: взять 2, сыграть до 3, лимит руки 7.

Ведущий ведёт, ТВ показывает стол. Не связано с Hasbro.`,
    tode_voi_tegu: `Правда или действие — смелые вопросы и задания.

Игрок выбирает: ответить честно или сделать. Набор подсказывает; границы — у компании.

Классика вечеринки для друзей, которые любят смех и вызов.`,
    blitz: `Blitz — быстрая викторина.

Вопросы на телефонах; ТВ — сцена. Верно + скорость = очки.

Ведущий ведёт; гости по ссылке или QR.`,
    miljonar: `Кто хочет стать миллионером — классическое ТВ-шоу.

15 вопросов с нарастающей сложностью (от 100 € до 1 000 000 €).
Несгораемые суммы на 5-й и 10-й ступенях гарантируют выигрыш.

4 подсказки:
• 50:50 — убирает два неверных варианта
• Помощь зала — зрители голосуют со смартфона по QR-коду
• Звонок другу — 30-секундный таймер
• Замена вопроса — заменяет текущий вопрос на запасной

Игрок может забрать заработанные деньги в любой момент до фиксации ответа.`,
  },
} as const

export type GuideGame =
  | 'kuldvillak'
  | 'roosidesoda'
  | 'sonaseletus'
  | 'ma_ei_ole_kunagi'
  | 'viimane_pusti'
  | 'tode_voi_tegu'
  | 'kinnistu_deal'
  | 'blitz'
  | 'miljonar'

export function getGuide(lang: Lang, gameType: string): string {
  const table = guides[lang] || guides.et
  const clean = (gameType || '').trim().toLowerCase().replace(/-/g, '_')
  const key = (clean in table ? clean : 'kuldvillak') as GuideGame
  return table[key] || guides.et.kuldvillak
}
