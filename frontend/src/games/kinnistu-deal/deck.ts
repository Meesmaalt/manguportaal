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

/** Party deck inspired by property-deal card games (~80 cards). */
export function buildDeck(): DealCard[] {
  seq = 0
  const cards: DealCard[] = [
    ...money(1, 6),
    ...money(2, 5),
    ...money(3, 3),
    ...money(4, 3),
    ...money(5, 2),
    ...money(10, 1),
    ...props('brown', ['Kalamaja', 'Pelgulinn'], 1),
    ...props('mint', ['Kadriorg', 'Pirita', 'Nõmme'], 1),
    ...props('pink', ['Telliskivi', 'Kopli', 'Kristiine'], 2),
    ...props('orange', ['Ülemiste', 'Mustamäe', 'Lasnamäe'], 2),
    ...props('red', ['Vanalinn', 'Rotermann', 'Sibulaküla'], 3),
    ...props('yellow', ['Haabersti', 'Õismäe', 'Kakumäe'], 3),
    ...props('green', ['Tartu kesklinn', 'Supilinn', 'Annelinn'], 4),
    ...props('blue', ['Toompea', 'Rocca al Mare'], 4),
    ...props('rail', ['Balti jaam', 'Ülemiste jaam', 'Lennujaam', 'Sadama D'], 2),
    ...props('util', ['Elektrivõrk', 'Veevärk'], 2),
    ...action('pass_go', 'Mine edasi', 1, 10),
    ...action('rent', 'Üür', 1, 6),
    ...action('debt', 'Võlanõue', 3, 3),
    ...action('birthday', 'Sünnipäev', 2, 3),
    ...action('sly_deal', 'Salavargus', 3, 3),
    ...action('forced_deal', 'Sunnitud vahetus', 3, 3),
    ...action('deal_breaker', 'Tehingumurdja', 5, 2),
    ...action('just_say_no', 'Ei, aitäh', 4, 3),
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
