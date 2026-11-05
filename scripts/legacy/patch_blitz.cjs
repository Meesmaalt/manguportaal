const fs = require('fs');
let code = fs.readFileSync('frontend/src/games/blitz/generateQuiz.ts', 'utf8');

const replacement = `export async function requestAiQuiz(params: QuizGenerateParams): Promise<{ questions: BlitzQuestion[]; isAi: boolean }> {
  try {
    const { appUrl } = await import('@/lib/config');
    const res = await fetch(appUrl('/api/ai/quiz'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.ok && Array.isArray(data.questions) && data.questions.length > 0) {
        return { questions: data.questions, isAi: true }
      }
      throw new Error(data.error || 'AI genereerimine ebaõnnestus')
    }
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'AI API viga')
  } catch (e: any) {
    throw new Error(\`AI genereerimine ebaõnnestus: \${e.message || 'API viga'}\`)
  }
}`;

code = code.replace(/export async function requestAiQuiz[\s\S]*?throw new Error\('Gemini API võti puudub\. Sisesta oma tasuta Google AI Studio võti ekraani ülaosas\.'\)\n\}/, replacement);
fs.writeFileSync('frontend/src/games/blitz/generateQuiz.ts', code, 'utf8');
