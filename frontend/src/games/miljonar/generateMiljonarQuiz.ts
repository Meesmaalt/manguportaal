import type { MiljonarQuestion } from './types'
import {
  MILJONAR_KLASSIKA_QUESTIONS,
  MILJONAR_EESTI_QUESTIONS,
  MILJONAR_PEO_QUESTIONS,
} from './miljonarPacks'

export async function generateMiljonarQuizWithAi(topic: string): Promise<{
  questions: MiljonarQuestion[]
  backupQuestions: MiljonarQuestion[]
  isAi: boolean
}> {
  try {
    const res = await fetch('/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic || 'Üldteadmised, meelelahutus ja Eesti',
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

  // Fallback to tailored built-in sets based on topic keyword
  const lower = (topic || '').toLowerCase()
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
