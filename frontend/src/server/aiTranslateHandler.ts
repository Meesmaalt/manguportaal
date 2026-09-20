import { GoogleGenAI } from '@google/genai'
import { getGlobalApiKey, getGlobalModel } from '../../../aiSettings.ts'

export type AiTranslateRequest = {
  packData: any
  gameType: string
  targetLanguage: string
  apiKey?: string
}

function extractAndStripImages(obj: any): { stripped: any; imageMap: Record<string, string> } {
  const imageMap: Record<string, string> = {}
  let counter = 0

  function cloneAndStrip(val: any): any {
    if (val === null || val === undefined) return val
    if (typeof val === 'string') {
      if (val.startsWith('data:image/')) {
        const placeholder = `__IMG_PRESERVE_${counter++}__`
        imageMap[placeholder] = val
        return placeholder
      }
      return val
    }
    if (Array.isArray(val)) {
      return val.map(cloneAndStrip)
    }
    if (typeof val === 'object') {
      const res: Record<string, any> = {}
      for (const [k, v] of Object.entries(val)) {
        res[k] = cloneAndStrip(v)
      }
      return res
    }
    return val
  }

  const stripped = cloneAndStrip(obj)
  return { stripped, imageMap }
}

function restoreImages(obj: any, imageMap: Record<string, string>): any {
  function cloneAndRestore(val: any): any {
    if (val === null || val === undefined) return val
    if (typeof val === 'string') {
      if (val in imageMap) {
        return imageMap[val]
      }
      for (const [placeholder, originalBase64] of Object.entries(imageMap)) {
        if (val.includes(placeholder)) {
          return val.replace(placeholder, originalBase64)
        }
      }
      return val
    }
    if (Array.isArray(val)) {
      return val.map(cloneAndRestore)
    }
    if (typeof val === 'object') {
      const res: Record<string, any> = {}
      for (const [k, v] of Object.entries(val)) {
        res[k] = cloneAndRestore(v)
      }
      return res
    }
    return val
  }

  return cloneAndRestore(obj)
}

export async function translatePackWithGemini(reqData: AiTranslateRequest) {
  const apiKey = reqData.apiKey || getGlobalApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY puudub keskkonnamuutujatest ega ka kliendi seadetest')
  }
  const ai = new GoogleGenAI({ apiKey })

  // Strip massive base64 images before sending to AI to avoid huge token costs and response truncation
  const { stripped: sanitizedPackData, imageMap } = extractAndStripImages(reqData.packData)

  const prompt = `Translate the user-facing text fields in the provided JSON game pack data to the target language: ${reqData.targetLanguage}.
Original language is likely Estonian.

Rules:
1. For Kuldvillak pack data:
   - For each category, keep 'name' as original, and add 'name_tr' with the ${reqData.targetLanguage} translation.
   - For each question in questions array:
     - keep 'q' as original, and add 'q_tr' with the ${reqData.targetLanguage} translated question.
     - keep 'a' as original, and add 'a_tr' with the ${reqData.targetLanguage} translated answer.
     - preserve 'points', 'hostNote', 'imageUrl' placeholders as is.
   - For 'finalJeopardy' (if present):
     - keep 'q' and 'a', add 'q_tr' and 'a_tr'.
2. For Blitz pack data:
   - For each question: keep 'q', add 'q_tr'; keep 'choices', add 'choices_tr' (translated array of choices).
3. For line-based strings (e.g. words, statements, truths, dares):
   - format each item as: "Original text / ${reqData.targetLanguage} translation"
4. If an original field already contains a slash ' / ', treat the left part as original and right part as translation.
5. Return strictly the complete JSON structure with the new translation fields added.

JSON Data:
${JSON.stringify(sanitizedPackData, null, 2)}
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

  // Restore the original base64 images
  const finalData = restoreImages(translatedData, imageMap)

  return finalData
}
