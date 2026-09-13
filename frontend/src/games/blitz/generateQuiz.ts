import type { BlitzQuestion } from './types'

export type QuizGenerateParams = {
  topic: string
  count: number
  difficulty: 'easy' | 'medium' | 'hard'
  questionTypes?: string[]
}

export const BUILTIN_THEMES = [
  { id: 'estonia', name: '🇪🇪 Eesti & Kodumaa', desc: 'Geograafia, kultuur, ajalugu ja huvitavad faktid' },
  { id: 'pop', name: '🎬 Popkultuur & Meelelahutus', desc: 'Filmid, sarjad, muusika ja kuulsused' },
  { id: 'party', name: '🎉 Peomäng & Seltskond', desc: 'Lõbusad nuputamised ja üllatavad küsimused' },
  { id: 'science', name: '🚀 Teadus, Kosmos & Loodus', desc: 'Loomad, leiutised, tehnoloogia ja planeet' },
  { id: 'retro', name: '📼 90ndad & 2000ndad Retro', desc: 'Nostalgia, hitid, tele-eeter ja lapsepõlv' },
  { id: 'sports', name: '⚽ Sport & Rekordid', desc: 'Olümpiamängud, jalgpall, korvpall ja sangarid' },
]

export const FALLBACK_PACKS: Record<string, BlitzQuestion[]> = {
  estonia: [
    {
      id: 'est-1',
      q: 'Mis on Eesti pikim jõgi?',
      type: 'quiz',
      choices: ['Võhandu jõgi', 'Pärnu jõgi', 'Emajõgi', 'Põltsamaa jõgi'],
      correct: 0,
      hostNote: 'Võhandu jõgi on 162 km pikk.',
      difficulty: 'easy',
    },
    {
      id: 'est-2',
      q: 'Ruhnu saar asub Liivi lahes ja on lähemal Lätile kui Eesti mandrile.',
      type: 'true_false',
      choices: ['Tõene', 'Väär', '', ''],
      correct: 0,
      hostNote: 'Tõepoolest, Ruhnust Läti rannikuni on vaid umbes 37 km.',
      difficulty: 'easy',
    },
    {
      id: 'est-3',
      q: 'Millised neist on Eesti ametlikud rahvussümbolid? (Vali kõik õiged)',
      type: 'multi',
      choices: ['Suitsupääsuke', 'Rukkilill', 'Hallhüljes', 'Räim'],
      correct: 0,
      multiCorrect: [0, 1, 3],
      hostNote: 'Rahvuslind on suitsupääsuke, rahvuslill rukkilill ja rahvuskala räim. Rahvusloom on hunt.',
      difficulty: 'medium',
      pointsMultiplier: 2,
    },
    {
      id: 'est-4',
      q: 'Mis aastal taastati Eesti Vabariigi iseseisvus?',
      type: 'slider',
      choices: ['', '', '', ''],
      correct: 0,
      sliderMin: 1980,
      sliderMax: 2005,
      sliderTarget: 1991,
      sliderUnit: 'aasta',
      hostNote: '20. augustil 1991 võeti vastu otsus Eesti riiklikust iseseisvusest.',
      difficulty: 'easy',
    },
    {
      id: 'est-5',
      q: 'Mis on Eesti kõrgeima tipu nimi?',
      type: 'type_answer',
      choices: ['Suur Munamägi', '', '', ''],
      correct: 0,
      acceptedAnswers: ['suur munamägi', 'munamägi', 'suur munamagi'],
      hostNote: 'Suur Munamägi on 317,4 meetrit üle merepinna.',
      difficulty: 'easy',
    },
    {
      id: 'est-6',
      q: 'Kui kõrge on Teletorn Tallinnas meetrites?',
      type: 'slider',
      choices: ['', '', '', ''],
      correct: 0,
      sliderMin: 150,
      sliderMax: 450,
      sliderTarget: 314,
      sliderUnit: 'meetrit',
      hostNote: 'Tallinna Teletorn on täpselt 314 meetrit kõrge.',
      difficulty: 'medium',
    },
  ],
  pop: [
    {
      id: 'pop-1',
      q: 'Kes kehastas filmis "Oppenheimer" nimitegelast J. Robert Oppenheimerit?',
      type: 'quiz',
      choices: ['Cillian Murphy', 'Matt Damon', 'Robert Downey Jr.', 'Christian Bale'],
      correct: 0,
      hostNote: 'Cillian Murphy võitis rolli eest ka parima meespeaosatäitja Oscari.',
      difficulty: 'easy',
    },
    {
      id: 'pop-2',
      q: 'Milline neist seriaalidest EI kuulu HBO toodangusse?',
      type: 'quiz',
      choices: ['Stranger Things', 'Succession', 'The Last of Us', 'The White Lotus'],
      correct: 0,
      hostNote: 'Stranger Things on Netflixi hittseriaal.',
      difficulty: 'medium',
    },
    {
      id: 'pop-3',
      q: 'Mitu Oscari auhinda võitis film "Titanic"?',
      type: 'slider',
      choices: ['', '', '', ''],
      correct: 0,
      sliderMin: 1,
      sliderMax: 20,
      sliderTarget: 11,
      sliderUnit: 'kuldmehikest',
      hostNote: 'Titanic võitis 11 Oscarit 14-st nominatsioonist (jagab rekordit Ben-Huri ja Sõrmuste Isandaga).',
      difficulty: 'medium',
    },
    {
      id: 'pop-4',
      q: 'Milline film võitis 2024. aastal parima filmi Oscari?',
      type: 'type_answer',
      choices: ['Oppenheimer', '', '', ''],
      correct: 0,
      acceptedAnswers: ['oppenheimer', 'openheimer'],
      hostNote: 'Christopher Nolani lavastatud eepiline draama Oppenheimer.',
      difficulty: 'easy',
    },
    {
      id: 'pop-5',
      q: 'Kuldne küsimus: Millised neist filmidest on lavastanud Christopher Nolan?',
      type: 'multi',
      choices: ['Inception', 'Interstellar', 'Shutter Island', 'Tenet'],
      correct: 0,
      multiCorrect: [0, 1, 3],
      pointsMultiplier: 2,
      hostNote: 'Shutter Islandi lavastas Martin Scorsese.',
      difficulty: 'medium',
    },
  ],
  party: [
    {
      id: 'pty-1',
      q: 'Mitu sekundit on ühes tunnis?',
      type: 'slider',
      choices: ['', '', '', ''],
      correct: 0,
      sliderMin: 1000,
      sliderMax: 5000,
      sliderTarget: 3600,
      sliderUnit: 'sekundit',
      hostNote: '60 minutit x 60 sekundit = 3600 sekundit.',
      difficulty: 'easy',
    },
    {
      id: 'pty-2',
      q: 'Banaan on botaaniliselt mari.',
      type: 'true_false',
      choices: ['Tõene', 'Väär', '', ''],
      correct: 0,
      hostNote: 'Jah! Botaaniliselt on banaan tõepoolest mari, aga maasikas pole!',
      difficulty: 'medium',
    },
    {
      id: 'pty-3',
      q: 'Kuidas meeldib teile tänane mänguõhtu seltskond?',
      type: 'poll',
      choices: ['Legendaarne! 🔥', 'Väga mõnus! 🥳', 'Võiks tihedamini! 👏', 'Ootan juba auhinda! 🏆'],
      correct: 0,
      hostNote: 'Küsitlus: kõik vastajad said osalemise eest punktid!',
      difficulty: 'easy',
    },
    {
      id: 'pty-4',
      q: 'Mitu hammast on täiskasvanud inimesel koos tarkusehammastega tavaliselt?',
      type: 'quiz',
      choices: ['32', '28', '30', '36'],
      correct: 0,
      hostNote: 'Tavaliselt 32 hammast (16 ülal, 16 all).',
      difficulty: 'easy',
    },
    {
      id: 'pty-5',
      q: 'Kuldne küsimus: Millised neist on pehmed või kääritatud joogid?',
      type: 'multi',
      choices: ['Kombucha', 'Keefir', 'Kali', 'Espresso'],
      correct: 0,
      multiCorrect: [0, 1, 2],
      pointsMultiplier: 2,
      hostNote: 'Kombucha, keefir ja kali on kõik kääritatud tooted.',
      difficulty: 'easy',
    },
  ],
}

export async function requestAiQuiz(params: QuizGenerateParams): Promise<{ questions: BlitzQuestion[]; isAi: boolean }> {
  try {
    const res = await fetch('/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.ok && Array.isArray(data.questions) && data.questions.length > 0) {
        return { questions: data.questions, isAi: true }
      }
    }
  } catch {}

  // Fallback to built-in generator matching topic keywords
  const lower = (params.topic || '').toLowerCase()
  let chosenKey = 'estonia'
  if (lower.includes('film') || lower.includes('pop') || lower.includes('muusika') || lower.includes('kuulsus')) {
    chosenKey = 'pop'
  } else if (lower.includes('pidu') || lower.includes('seltskond') || lower.includes('lõbus') || lower.includes('nali')) {
    chosenKey = 'party'
  }
  const fallbackList = FALLBACK_PACKS[chosenKey] || FALLBACK_PACKS.estonia
  return { questions: fallbackList.slice(0, params.count || 5), isAi: false }
}

export async function generateBlitzQuiz(params: {
  topic: string
  count?: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  includeSpecialTypes?: boolean
}): Promise<BlitzQuestion[]> {
  const count = params.count || 6
  const diff = params.difficulty === 'mixed' ? 'medium' : params.difficulty || 'medium'
  const res = await requestAiQuiz({
    topic: params.topic,
    count,
    difficulty: diff,
    questionTypes: params.includeSpecialTypes ? ['quiz', 'true_false', 'multi', 'slider', 'type_answer'] : ['quiz'],
  })
  return res.questions
}
