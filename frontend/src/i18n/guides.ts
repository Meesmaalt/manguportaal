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
    tode_voi_tegu: `Truth or dare — bold questions and challenges.

Players choose honesty or action. The pack suggests prompts; the group sets the limits.

Classic party fun for friends who want laughs and a little courage.`,
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
    tode_voi_tegu: `Правда или действие — смелые вопросы и задания.

Игрок выбирает: ответить честно или сделать. Набор подсказывает; границы — у компании.

Классика вечеринки для друзей, которые любят смех и вызов.`,
  },
} as const

export type GuideGame =
  | 'kuldvillak'
  | 'roosidesoda'
  | 'sonaseletus'
  | 'ma_ei_ole_kunagi'
  | 'viimane_pusti'
  | 'tode_voi_tegu'

export function getGuide(lang: Lang, gameType: string): string {
  const table = guides[lang] || guides.et
  const key = (gameType in table ? gameType : 'kuldvillak') as GuideGame
  return table[key] || guides.et.kuldvillak
}
