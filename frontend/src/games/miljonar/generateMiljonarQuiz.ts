import type { MiljonarQuestion } from './types'
import {
  MILJONAR_KLASSIKA_QUESTIONS,
  MILJONAR_EESTI_QUESTIONS,
  MILJONAR_PEO_QUESTIONS,
} from './miljonarPacks'
import { callGeminiDirectly, hasClientGeminiKey } from '@/lib/geminiClient'

export async function generateMiljonarQuizWithAi(topic: string): Promise<{
  questions: MiljonarQuestion[]
  backupQuestions: MiljonarQuestion[]
  isAi: boolean
}> {
  const chosenTopic = topic || 'Üldteadmised, meelelahutus ja Eesti'
  const seed = Math.floor(Math.random() * 1000000)

  // 1. Try direct Gemini API from browser if client key is configured
  if (hasClientGeminiKey()) {
    try {
      const prompt = `Loo telesaate "Kes tahab saada miljonäriks?" formaadis täpselt 15 täiesti uut ja originaalset küsimust + 2 varuküsimust eesti keeles teemal: "${chosenTopic}".
Unikaalsuse kontrollkood: ${seed}. Küsimused peavad olema huvitavad, mitmekülgsed ja faktiliselt täpsed!
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

Vasta AINULT kehtiva JSON massiivina (ilma markdown märkideta):
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
  }
]`
      const rawText = await callGeminiDirectly(prompt, { temperature: 0.9 })
      let cleaned = rawText.trim()
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim()
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim()
      const rawList = JSON.parse(cleaned)
      if (Array.isArray(rawList) && rawList.length >= 15) {
        const mainQs: MiljonarQuestion[] = []
        const backups: MiljonarQuestion[] = []

        rawList.forEach((q, idx) => {
          const item: MiljonarQuestion = {
            id: q.id || `m-${Date.now()}-${idx}-${seed}`,
            tier: q.tier || idx + 1,
            prize: q.prize || [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000][Math.min(idx, 14)],
            q: String(q.q || `Küsimus ${idx + 1}`),
            choices: Array.isArray(q.choices) && q.choices.length === 4
              ? [String(q.choices[0]), String(q.choices[1]), String(q.choices[2]), String(q.choices[3])]
              : ['Valik A', 'Valik B', 'Valik C', 'Valik D'],
            correct: (typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0) as 0 | 1 | 2 | 3,
            hostNote: q.hostNote ? String(q.hostNote) : undefined,
            funFact: q.funFact ? String(q.funFact) : undefined,
            difficulty: q.difficulty || (idx < 5 ? 'easy' : idx < 10 ? 'medium' : idx < 14 ? 'hard' : 'expert'),
            backup: Boolean(q.backup || idx >= 15),
          }

          if (item.backup || idx >= 15) {
            backups.push(item)
          } else {
            mainQs.push(item)
          }
        })

        if (mainQs.length >= 15) {
          return {
            questions: mainQs.slice(0, 15),
            backupQuestions: backups.length ? backups : MILJONAR_KLASSIKA_QUESTIONS.filter((q) => q.backup),
            isAi: true,
          }
        }
      }
    } catch (err: any) {
      console.warn('Direct Gemini API call failed in Miljonär:', err)
      throw new Error(`AI genereerimine ebaõnnestus: ${err?.message || 'Kontrolli API võtit'}`)
    }
  }

  // 2. Try Node.js server route if available
  try {
    const res = await fetch('/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: chosenTopic,
        gameType: 'miljonar',
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.ok && Array.isArray(data.questions) && data.questions.length >= 15) {
        const rawList = data.questions as any[]
        const mainQs: MiljonarQuestion[] = []
        const backups: MiljonarQuestion[] = []

        rawList.forEach((q, idx) => {
          const item: MiljonarQuestion = {
            id: q.id || `m-${Date.now()}-${idx}`,
            tier: q.tier || idx + 1,
            prize: q.prize || [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000][Math.min(idx, 14)],
            q: String(q.q || `Küsimus ${idx + 1}`),
            choices: Array.isArray(q.choices) && q.choices.length === 4
              ? [String(q.choices[0]), String(q.choices[1]), String(q.choices[2]), String(q.choices[3])]
              : ['Valik A', 'Valik B', 'Valik C', 'Valik D'],
            correct: (typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0) as 0 | 1 | 2 | 3,
            hostNote: q.hostNote ? String(q.hostNote) : undefined,
            funFact: q.funFact ? String(q.funFact) : undefined,
            difficulty: q.difficulty || (idx < 5 ? 'easy' : idx < 10 ? 'medium' : idx < 14 ? 'hard' : 'expert'),
            backup: Boolean(q.backup || idx >= 15),
          }

          if (item.backup || idx >= 15) {
            backups.push(item)
          } else {
            mainQs.push(item)
          }
        })

        if (mainQs.length >= 15) {
          return {
            questions: mainQs.slice(0, 15),
            backupQuestions: backups.length ? backups : MILJONAR_KLASSIKA_QUESTIONS.filter((q) => q.backup),
            isAi: true,
          }
        }
      }
    }
  } catch {}

  // 3. Fallback to tailored built-in sets based on topic keyword
  const lower = chosenTopic.toLowerCase()
  let chosen = MILJONAR_KLASSIKA_QUESTIONS
  if (lower.includes('eesti') || lower.includes('kodumaa') || lower.includes('tartu') || lower.includes('tallinn')) {
    chosen = MILJONAR_EESTI_QUESTIONS
  } else if (lower.includes('pidu') || lower.includes('film') || lower.includes('pop') || lower.includes('muusika')) {
    chosen = MILJONAR_PEO_QUESTIONS
  }

  const main = chosen.filter((q) => !q.backup)
  const backups = chosen.filter((q) => q.backup)

  return {
    questions: main,
    backupQuestions: backups,
    isAi: false,
  }
}

