import { GoogleGenAI } from '@google/genai'
import { getGlobalApiKey } from '../../../aiSettings.ts'

export async function listAvailableGeminiModels(customKey?: string) {
  const apiKey = customKey || getGlobalApiKey()
  if (!apiKey) {
    throw new Error('API võti puudub. Palun sisesta esmalt Gemini API võti.')
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.list()
  
  // response can be an async iterator or list
  const models: Array<{ name: string; displayName?: string; description?: string; supportedActions?: string[] }> = []
  for await (const m of response) {
    // Filter models that support generateContent
    const modelName = m.name?.replace(/^models\//, '') || ''
    models.push({
      name: modelName,
      displayName: m.displayName || modelName,
      description: m.description,
      supportedActions: m.supportedGenerationMethods || []
    })
  }

  // Sort: prioritize flash & pro models
  return models.sort((a, b) => a.name.localeCompare(b.name))
}
