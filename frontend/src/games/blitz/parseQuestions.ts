import type { BlitzChoice, BlitzQuestion } from './types'

/**
 * Accepts:
 * - JSON array of questions
 * - JSON pack { questions, secondsPerQuestion, ... }
 * - CSV: q,a,b,c,d,correct[,hostNote][,imageUrl]
 *   correct = 0-3 or A-D
 * - TSV same
 * - Simple lines: Q | A | B | C | D | correctIndex
 */
export function parseBlitzQuestions(text: string): {
  questions: BlitzQuestion[]
  meta?: { secondsPerQuestion?: number; pointsMax?: number; revealSeconds?: number }
} {
  const trimmed = text.trim()
  if (!trimmed) return { questions: [] }

  // JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const raw = JSON.parse(trimmed)
    if (Array.isArray(raw)) {
      return { questions: raw.map(normalizeQ).filter(Boolean) as BlitzQuestion[] }
    }
    const o = raw as Record<string, unknown>
    const questions = (Array.isArray(o.questions) ? o.questions : []).map(normalizeQ).filter(Boolean) as BlitzQuestion[]
    return {
      questions,
      meta: {
        secondsPerQuestion: num(o.secondsPerQuestion),
        pointsMax: num(o.pointsMax),
        revealSeconds: num(o.revealSeconds),
      },
    }
  }

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  const questions: BlitzQuestion[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const parts = line.includes('\t')
      ? line.split('\t')
      : line.includes('|')
        ? line.split('|')
        : splitCsv(line)
    if (parts.length < 6) continue
    const [q, a, b, c, d, correctRaw, hostNote, imageUrl] = parts.map((p) => p.trim())
    const correct = parseCorrect(correctRaw)
    if (correct == null || !q) continue
    questions.push({
      id: `imp-${i}-${Math.random().toString(36).slice(2, 6)}`,
      q,
      choices: [a, b, c, d],
      correct,
      ...(hostNote ? { hostNote } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    })
  }
  return { questions }
}

function num(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function parseCorrect(raw: string): BlitzChoice | null {
  const u = raw.trim().toUpperCase()
  if (u === 'A' || u === '0') return 0
  if (u === 'B' || u === '1') return 1
  if (u === 'C' || u === '2') return 2
  if (u === 'D' || u === '3') return 3
  const n = parseInt(u, 10)
  if (n >= 0 && n <= 3) return n as BlitzChoice
  return null
}

function normalizeQ(raw: unknown): BlitzQuestion | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const q = String(o.q || o.question || '').trim()
  let choices = o.choices as string[] | undefined
  if (!choices && o.a != null) {
    choices = [String(o.a), String(o.b), String(o.c), String(o.d)]
  }
  if (!q || !choices || choices.length < 4) return null
  const correct = typeof o.correct === 'number' ? o.correct : parseCorrect(String(o.correct ?? '0'))
  if (correct == null) return null
  return {
    id: String(o.id || `q-${Math.random().toString(36).slice(2, 8)}`),
    q,
    choices: [choices[0], choices[1], choices[2], choices[3]],
    correct: correct as BlitzChoice,
    ...(o.hostNote ? { hostNote: String(o.hostNote) } : {}),
    ...(o.imageUrl ? { imageUrl: String(o.imageUrl) } : {}),
  }
}

function splitCsv(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQ = !inQ
      continue
    }
    if (ch === ',' && !inQ) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

export function questionsToCsv(questions: BlitzQuestion[]): string {
  const header = 'q,a,b,c,d,correct,hostNote,imageUrl'
  const rows = questions.map((q) =>
    [q.q, ...q.choices, String(q.correct), q.hostNote || '', q.imageUrl || '']
      .map(csvEscape)
      .join(',')
  )
  return [header, ...rows].join('\n')
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
