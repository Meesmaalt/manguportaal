export type GameType =
  | 'kuldvillak'
  | 'roosidesoda'
  | 'sonaseletus'
  | 'ma_ei_ole_kunagi'
  | 'viimane_pusti'
  | 'tode_voi_tegu'
  | 'kinnistu_deal'

export const GAME_META: Record<
  GameType,
  { title: string; subtitle: string; description: string; emoji: string }
> = {
  kuldvillak: {
    title: 'Kuldvillak',
    subtitle: 'Jeopardy',
    description: 'Kategooriad, punktid, meeskonnad. Host + TV režiim.',
    emoji: '🏆',
  },
  roosidesoda: {
    title: 'Rooside Sõda',
    subtitle: 'Family Feud',
    description: 'Voorud, vastused, streigid ja bank. Helid kaasas.',
    emoji: '🌹',
  },
  sonaseletus: {
    title: 'Sõnaseletus',
    subtitle: 'Alias',
    description: 'Taimer, õige / vahele, tiimide punktid. Seletaja vs arvajad.',
    emoji: '🗣️',
  },
  ma_ei_ole_kunagi: {
    title: 'Ma ei ole kunagi',
    subtitle: 'Never have I ever',
    description: 'Väited ringis. Kes on teinud – kaotab elu / joob / punkte.',
    emoji: '🙅',
  },
  viimane_pusti: {
    title: 'Viimane püsti',
    subtitle: 'Elud & väited',
    description: 'Elud, väited, viimane püsti jäänu võidab.',
    emoji: '🧍',
  },
  tode_voi_tegu: {
    title: 'Tõde või tegu',
    subtitle: 'Truth or Dare',
    description: 'Mängija + tõde või tegu settist. Julged küsimused ja teod.',
    emoji: '🎲',
  },
  kinnistu_deal: {
    title: 'Kinnistu Deal',
    subtitle: 'Kinnisvara kaardid',
    description: 'Kogu 3 komplekti. Raha, kinnistud, tegevuskaardid. Host + TV.',
    emoji: '🏠',
  },
}
