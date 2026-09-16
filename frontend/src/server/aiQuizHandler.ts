import { GoogleGenAI } from '@google/genai'
import { getGlobalApiKey, getGlobalModel } from '../../../aiSettings.ts'

export type AiQuizRequest = {
  topic: string
  count?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  language?: string
  types?: string[]
  gameType?: 'blitz' | 'miljonar' | string
  apiKey?: string
}

export async function generateQuizWithGemini(reqData: AiQuizRequest) {
  const apiKey = reqData.apiKey || getGlobalApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY puudub keskkonnamuutujatest ega ka kliendi seadetest')
  }

  const ai = new GoogleGenAI({ apiKey })
  const topic = reqData.topic || 'Üldteadmised ja meelelahutus'

  if (reqData.gameType === 'miljonar') {
    const prompt = `Loo telesaate "Kes tahab saada miljonäriks?" formaadis täpselt 15 küsimust + 2 varuküsimust eesti keeles teemal: "${topic}".
Küsimused PEAVAD olema rangelt kasvavas raskusastmes (15 astet: 1-5 lihtsad soojendused, 6-10 keskmised ja faktilised, 11-14 rasked nuputamised, 15 tõeline elitaarne miljoniküsimus).

Rahasummad ja astmed:
1: 100 €
2: 200 €
3: 300 €
4: 500 €
5: 1000 € (1. turvasumma)
6: 2000 €
7: 4000 €
8: 8000 €
9: 16000 €
10: 32000 € (2. turvasumma)
11: 64000 €
12: 125000 €
13: 250000 €
14: 500000 €
15: 1000000 € (MILJON)

Lisaks 2 varuküsimust (tier: 0, backup: true).

Igal küsimusel PEAB olema täpselt 4 valikut massiivis "choices" (A, B, C, D) ja "correct" täisarvuline indeks (0, 1, 2 või 3), mis näitab õiget vastust. Vali õige vastuse asukoht varieeruvalt (ära pane alati indeksit 0).

Vasta AINULT kehtiva JSON massiivina:
[
  {
    "id": "m-1",
    "tier": 1,
    "prize": 100,
    "q": "Küsimuse tekst",
    "choices": ["Valik A", "Valik B", "Valik C", "Valik D"],
    "correct": 1,
    "hostNote": "Miks see on õige ja saatejuhi kommentaar",
    "funFact": "Lõbus lisafakt",
    "difficulty": "easy"
  },
  ...
]
Tagasta kokku 17 elementi (15 astet + 2 backup: true).`

    const response = await ai.models.generateContent({
      model: getGlobalModel(),
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    })

    const text = response.text || '[]'
    const list = JSON.parse(text)
    if (!Array.isArray(list)) throw new Error('Ebakorrektne vastus mudelilt')
    return list
  }

  const count = Math.max(3, Math.min(20, reqData.count || 5))
  const difficulty = reqData.difficulty || 'medium'
  const diffLabel = difficulty === 'easy' ? 'lihtne' : difficulty === 'hard' ? 'keeruline / nuputamisega' : 'keskmine'

  const prompt = `Loo täpselt ${count} kvaliteetset ja lõbusat seltskonnaviktoriini küsimust Kahooti stiilis eesti keeles teemal: "${topic}".
Raskusaste: ${diffLabel}.

Küsimuste tüübid võivad sisaldada:
1. 'quiz': klassikaline 4 valikuga küsimus
2. 'true_false': tõene/väär küsimus (choices: ["Tõene", "Väär", "", ""])
3. 'multi': mitme õige vastusega küsimus (multiCorrect sisaldab õigete indeksite massiivi, nt [0, 2])
4. 'slider': numbriline äraarvamine (sliderMin, sliderMax, sliderTarget, sliderUnit)
5. 'type_answer': lühike tekstivastus (acceptedAnswers: massiiv õigetest sünonüümidest)

Vasta AINULT kehtiva JSON massiivina, ilma markdown jutumärkideta ega koodiplokkideta:
[
  {
    "id": "q1",
    "q": "Küsimuse tekst",
    "type": "quiz" | "true_false" | "multi" | "slider" | "type_answer",
    "choices": ["Vastus A", "Vastus B", "Vastus C", "Vastus D"],
    "correct": 0,
    "multiCorrect": [0, 2],
    "acceptedAnswers": ["õige", "oige"],
    "sliderMin": 1900,
    "sliderMax": 2025,
    "sliderTarget": 1991,
    "sliderUnit": "aastal",
    "hostNote": "Lühike selgitus või lõbus lisafakt",
    "difficulty": "easy" | "medium" | "hard",
    "pointsMultiplier": 1
  }
]
Igal küsimusel peab choices massiivis olema alati 4 elementi (true_false puhul 2 esimest on Tõene ja Väär, ülejäänud tühjad sõned).`

  const response = await ai.models.generateContent({
    model: getGlobalModel(),
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const text = response.text || '[]'
  const questions = JSON.parse(text)
  if (!Array.isArray(questions)) {
    throw new Error('Ebakorrektne vastuse formaat mudelilt')
  }

  return questions.map((q: any, i: number) => ({
    id: `ai-${Date.now()}-${i}`,
    q: String(q.q || `Küsimus ${i + 1}`),
    type: q.type || 'quiz',
    choices: Array.isArray(q.choices) && q.choices.length === 4
      ? [String(q.choices[0] || ''), String(q.choices[1] || ''), String(q.choices[2] || ''), String(q.choices[3] || '')]
      : ['Valik A', 'Valik B', 'Valik C', 'Valik D'],
    correct: typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
    multiCorrect: Array.isArray(q.multiCorrect) ? q.multiCorrect : undefined,
    acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : undefined,
    sliderMin: typeof q.sliderMin === 'number' ? q.sliderMin : undefined,
    sliderMax: typeof q.sliderMax === 'number' ? q.sliderMax : undefined,
    sliderTarget: typeof q.sliderTarget === 'number' ? q.sliderTarget : undefined,
    sliderUnit: q.sliderUnit ? String(q.sliderUnit) : undefined,
    hostNote: q.hostNote ? String(q.hostNote) : undefined,
    difficulty: q.difficulty || difficulty,
    pointsMultiplier: q.pointsMultiplier || 1,
  }))
}
