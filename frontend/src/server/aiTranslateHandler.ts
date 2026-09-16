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

  const prompt = `Translate the user-facing text fields in the provided JSON game pack data into a bilingual format.
Original language is likely Estonian. The target language to add is: ${reqData.targetLanguage}.
For every text field that contains a question, answer, category name, or choice, append the ${reqData.targetLanguage} translation after a space, a slash, and a space (' / ').
For example: "Mis on Eesti pealinn?" becomes "Mis on Eesti pealinn? / What is the capital of Estonia?"
If a value is a number, boolean, ID, URL, or image URL, DO NOT modify it.
CRITICAL: You MUST return exactly the same JSON structure, array lengths, and keys. Only modify the string values.

JSON Data:
${JSON.stringify(reqData.packData, null, 2)}
`

  let response;
  try {
    response = await ai.models.generateContent({
      model: getGlobalModel() || 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.2, responseMimeType: 'application/json' },
    });
  } catch (err: any) {
    console.log("Model failed, falling back to gemini-1.5-flash. Error:", err?.message);
    // Fallback to stable 1.5 flash
    response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { temperature: 0.2, responseMimeType: 'application/json' },
    });
  }

  const text = response.text || '{}'
  const translatedData = JSON.parse(text)

  return translatedData
}
