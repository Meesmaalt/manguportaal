import type { ActionKind, DealCard, PropColor } from './types'

let seq = 0
function id(prefix: string) {
  seq += 1
  return `${prefix}${seq}${Math.random().toString(36).slice(2, 6)}`
}

function money(value: number, n: number): DealCard[] {
  return Array.from({ length: n }, () => ({ id: id('m'), kind: 'money' as const, value }))
}

function props(color: PropColor, names: string[], value: number): DealCard[] {
  return names.map((name) => ({
    id: id('p'),
    kind: 'property' as const,
    color,
    name,
    value,
  }))
}

function action(kind: ActionKind, name: string, value: number, n: number): DealCard[] {
  return Array.from({ length: n }, () => ({
    id: id('a'),
    kind: 'action' as const,
    action: kind,
    name,
    value,
  }))
}

export type DealTheme = 'classic' | 'pulm' | 'tartu' | 'kontor'

const THEME_PROPS: Record<DealTheme, Partial<Record<PropColor, { names: string[]; value: number }>>> = {
  classic: {
    brown: { names: ['Kalamaja', 'Pelgulinn'], value: 1 },
    mint: { names: ['Kadriorg', 'Pirita', 'Nõmme'], value: 1 },
    pink: { names: ['Telliskivi', 'Kopli', 'Kristiine'], value: 2 },
    orange: { names: ['Ülemiste', 'Mustamäe', 'Lasnamäe'], value: 2 },
    red: { names: ['Vanalinn', 'Rotermann', 'Sibulaküla'], value: 3 },
    yellow: { names: ['Haabersti', 'Õismäe', 'Kakumäe'], value: 3 },
    green: { names: ['Tartu kesklinn', 'Supilinn', 'Annelinn'], value: 4 },
    blue: { names: ['Toompea', 'Rocca al Mare'], value: 4 },
    rail: { names: ['Balti jaam', 'Ülemiste jaam', 'Lennujaam', 'Sadama D'], value: 2 },
    util: { names: ['Elektrivõrk', 'Veevärk'], value: 2 },
  },
  pulm: {
    brown: { names: ['Kirikupink', 'Pulmamaja esik'], value: 1 },
    mint: { names: ['Lilletuba', 'Fotosein', 'Külalisteraamat'], value: 1 },
    pink: { names: ['Pruutneitsi laud', 'Šampanjabaar', 'Tort'], value: 2 },
    orange: { names: ['Tantsupõrand', 'DJ pult', 'Photobooth'], value: 2 },
    red: { names: ['Pealaud', 'Sõbramehe kõne', 'Esimene tants'], value: 3 },
    yellow: { names: ['Mesinädalad', 'Hommikuhommik', 'Kingikott'], value: 3 },
    green: { names: ['Aiapeo', 'Väliterrass', 'Õhtune tuli'], value: 4 },
    blue: { names: ['Suur saal', 'Privaatsviit'], value: 4 },
    rail: { names: ['Limusiin', 'Takso', 'Buss', 'Jalutuskäik'], value: 2 },
    util: { names: ['Lillepood', 'Fotograaf'], value: 2 },
  },
  tartu: {
    brown: { names: ['Supilinn', 'Karlova'], value: 1 },
    mint: { names: ['Toomemägi', 'Botaanikaaed', 'Emajõgi'], value: 1 },
    pink: { names: ['Rüütli', 'Küütri', 'Ülikooli peahoone'], value: 2 },
    orange: { names: ['Tasku', 'Lõunakeskus', 'Annelinn'], value: 2 },
    red: { names: ['Raekoja plats', 'Aparaaditehas', 'Genialistide klubi'], value: 3 },
    yellow: { names: ['Tähtvere', 'Veeriku', 'Jaamamõisa'], value: 3 },
    green: { names: ['Ihaste', 'Ropka', 'Kvissentali'], value: 4 },
    blue: { names: ['Tigutorn', 'AHHAA'], value: 4 },
    rail: { names: ['Tartu jaam', 'Bussijaam', 'Lennujaam', 'Parvlaev'], value: 2 },
    util: { names: ['Tartu Vesi', 'Elektrivõrk'], value: 2 },
  },
  kontor: {
    brown: { names: ['Kohvinurk', 'Printeriruum'], value: 1 },
    mint: { names: ['Open space', 'Meeting room', 'Vaikne tsoon'], value: 1 },
    pink: { names: ['HR laud', 'Reception', 'Puhkeruum'], value: 2 },
    orange: { names: ['Müügitiim', 'Turundus', 'Support'], value: 2 },
    red: { names: ['Juhi kabinet', 'Boardroom', 'Serveriruum'], value: 3 },
    yellow: { names: ['Parkla', 'Terrass', 'Söökla'], value: 3 },
    green: { names: ['Filiaal Tartu', 'Filiaal Pärnu', 'Remote hub'], value: 4 },
    blue: { names: ['Peakontor', 'Rooftop'], value: 4 },
    rail: { names: ['Lift A', 'Lift B', 'Trepikoda', 'Parklahoone'], value: 2 },
    util: { names: ['WiFi', 'Kohvimasin'], value: 2 },
  },
}

export function buildDeck(theme: DealTheme = 'classic'): DealCard[] {
  seq = 0
  const tp = THEME_PROPS[theme] || THEME_PROPS.classic
  const propCards: DealCard[] = []
  for (const color of Object.keys(tp) as PropColor[]) {
    const block = tp[color]!
    propCards.push(...props(color, block.names, block.value))
  }
  const cards: DealCard[] = [
    ...money(1, 6),
    ...money(2, 5),
    ...money(3, 3),
    ...money(4, 3),
    ...money(5, 2),
    ...money(10, 1),
    ...propCards,
    ...action('pass_go', 'Mine edasi', 1, 10),
    ...action('rent', 'Nõua üüri', 1, 6),
    ...action('debt', 'Võlanõue', 3, 3),
    ...action('birthday', 'Sünnipäev!', 2, 3),
    ...action('sly_deal', 'Salakaup', 3, 3),
    ...action('forced_deal', 'Sunnitud tehing', 3, 3),
    ...action('deal_breaker', 'Tehingumurdja', 5, 2),
    ...action('just_say_no', 'Ei, aitäh', 4, 3),
    ...action('house', 'Maja', 3, 3),
    ...action('hotel', 'Hotell', 4, 2),
  ]
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export function drawFrom(deck: DealCard[], n: number): { cards: DealCard[]; deck: DealCard[] } {
  const d = [...deck]
  const cards: DealCard[] = []
  for (let i = 0; i < n; i++) {
    if (!d.length) break
    cards.push(d.pop()!)
  }
  return { cards, deck: d }
}
