import { GoogleGenAI } from '@google/genai'
import { getGlobalApiKey } from '../../../aiSettings.ts'

export type UsableModel = {
  name: string
  displayName?: string
  description?: string
  tier: 'flash' | 'pro' | 'other'
  recommended?: boolean
  supportedActions?: string[]
}

function isUsableTextModel(name: string, supportedActions?: string[]): boolean {
  const lower = name.toLowerCase()

  // Only keep standard Gemini text/multimodal generation models
  if (!lower.startsWith('gemini-')) return false

  // Exclude specialized non-text or stream/audio/image/tool-specific endpoints
  const excludedKeywords = [
    'embedding',
    'audio',
    'tts',
    'transcribe',
    'live',
    'image',
    'robotics',
    'computer-use',
    'customtools',
    'realtime',
  ]

  if (excludedKeywords.some(kw => lower.includes(kw))) {
    return false
  }

  // If supportedActions exists, check for generateContent
  if (supportedActions && supportedActions.length > 0) {
    if (!supportedActions.includes('generateContent')) return false
  }

  return true
}

export async function listAvailableGeminiModels(customKey?: string): Promise<UsableModel[]> {
  const apiKey = customKey || getGlobalApiKey()
  if (!apiKey) {
    throw new Error('API võti puudub. Palun sisesta esmalt Gemini API võti.')
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.list()
  
  const models: UsableModel[] = []
  for await (const m of response) {
    const rawModel = m as any
    const modelName = (rawModel.name || '').replace(/^models\//, '')
    const methods: string[] = rawModel.supportedGenerationMethods || rawModel.supportedActions || []

    if (!isUsableTextModel(modelName, methods)) {
      continue
    }

    const lower = modelName.toLowerCase()
    const isFlash = lower.includes('flash')
    const isPro = lower.includes('pro')

    models.push({
      name: modelName,
      displayName: rawModel.displayName || modelName,
      description: rawModel.description,
      tier: isFlash ? 'flash' : isPro ? 'pro' : 'other',
      recommended: modelName === 'gemini-2.5-flash' || modelName === 'gemini-3.7-flash' || modelName === 'gemini-3.1-flash-lite',
      supportedActions: methods
    })
  }

  // Smart ranking: Flash models first (light & fast), then Pro, then others
  const priorityOrder = [
    'gemini-2.5-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro',
    'gemini-pro-latest',
    'gemini-3.1-pro-preview'
  ]

  return models.sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a.name)
    const bIdx = priorityOrder.indexOf(b.name)

    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1

    if (a.tier === 'flash' && b.tier !== 'flash') return -1
    if (b.tier === 'flash' && a.tier !== 'flash') return 1

    return a.name.localeCompare(b.name)
  })
}

