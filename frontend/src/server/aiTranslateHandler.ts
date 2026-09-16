import { GoogleGenAI } from '@google/genai'
import { getGlobalApiKey, getGlobalModel } from '../../../aiSettings.ts'

export type AiTranslateRequest = {
  packData: any
  gameType: string
  targetLanguage: string
  apiKey?: string
}

export async function translatePackWithGemini(reqData: AiTranslateRequest) {
  const apiKey = reqData.apiKey || getGlobalApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY puudub keskkonnamuutujatest ega ka kliendi seadetest')
  }
  const ai = new GoogleGenAI({ apiKey })

  const prompt = `Translate the user-facing text fields in the provided JSON game pack data to the target language: ${reqData.targetLanguage}.
Original language is likely Estonian.

Rules:
1. For Kuldvillak pack data:
   - For each category, keep 'name' as original, and add 'name_tr' with the ${reqData.targetLanguage} translation.
   - For each question in questions array:
     - keep 'q' as original, and add 'q_tr' with the ${reqData.targetLanguage} translated question.
     - keep 'a' as original, and add 'a_tr' with the ${reqData.targetLanguage} translated answer.
     - preserve 'points', 'hostNote', 'imageUrl' as is.
   - For 'finalJeopardy' (if present):
     - keep 'q' and 'a', add 'q_tr' and 'a_tr'.
2. For Blitz pack data:
   - For each question: keep 'q', add 'q_tr'; keep 'choices', add 'choices_tr' (translated array of choices).
3. For line-based strings (e.g. words, statements, truths, dares):
   - format each item as: "Original text / ${reqData.targetLanguage} translation"
4. If an original field already contains a slash ' / ', treat the left part as original and right part as translation.
5. Return strictly the complete JSON structure with the new translation fields added.

JSON Data:
${JSON.stringify(reqData.packData, null, 2)}
`

  const response = await ai.models.generateContent({
    model: getGlobalModel() || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  })

  const text = response.text || '{}'
  const translatedData = JSON.parse(text)

  return translatedData
}
