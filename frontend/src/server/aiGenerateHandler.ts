import { GoogleGenAI } from '@google/genai'
import { getGlobalApiKey, getGlobalModel } from '../../../aiSettings.ts'

export async function generateContentWithGemini(reqData: {
  prompt: string
  model?: string
  temperature?: number
  apiKey?: string
}) {
  const apiKey = reqData.apiKey || getGlobalApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY puudub')
  }

  const ai = new GoogleGenAI({ apiKey })
  const chosenModel = (reqData.model || getGlobalModel() || 'gemini-2.5-flash').replace(/^models\//, '')

  const response = await ai.models.generateContent({
    model: chosenModel,
    contents: reqData.prompt,
    config: {
      temperature: reqData.temperature ?? 0.85,
    },
  })

  return response.text || ''
}
