/**
 * Client-side Gemini AI generation helper.
 * Allows direct Gemini API calls from the browser when self-hosting with static nginx,
 * using an API key stored in localStorage (or environment if defined).
 */

const GEMINI_KEY_STORAGE = 'ohtu_gemini_api_key'
const GEMINI_MODEL_STORAGE = 'ohtu_gemini_model'

export function getClientGeminiKey(): string {
  const custom = localStorage.getItem(GEMINI_KEY_STORAGE) || ''
  if (custom.trim()) return custom.trim()
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
}

export function setClientGeminiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim())
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE)
  }
}

export function getClientGeminiModel(): string {
  const custom = localStorage.getItem(GEMINI_MODEL_STORAGE) || ''
  if (custom.trim()) return custom.trim()
  return (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
}

export function setClientGeminiModel(model: string): void {
  if (model.trim()) {
    localStorage.setItem(GEMINI_MODEL_STORAGE, model.trim())
  } else {
    localStorage.removeItem(GEMINI_MODEL_STORAGE)
  }
}

export function hasClientGeminiKey(): boolean {
  return Boolean(getClientGeminiKey())
}

/**
 * Call Gemini API directly from the client browser or proxy through server.
 */
export async function callGeminiDirectly(
  prompt: string,
  options?: { apiKeyOverride?: string; modelOverride?: string; temperature?: number }
): Promise<string> {
  let apiKey = options?.apiKeyOverride || getClientGeminiKey()
  const chosenModel = options?.modelOverride || getClientGeminiModel() || 'gemini-2.5-flash'

  // If client has no key, check server key
  if (!apiKey) {
    try {
      const { appUrl } = await import('@/lib/config')
      const res = await fetch(appUrl('/api/ai/key'))
      if (res.ok) {
        const data = await res.json()
        if (data.ok && data.key) {
          apiKey = data.key
        }
      }
    } catch {}
  }

  // 1. If server /api/ai/generate is available, try server first
  try {
    const { appUrl } = await import('@/lib/config')
    const srvRes = await fetch(appUrl('/api/ai/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: chosenModel,
        temperature: options?.temperature ?? 0.85,
        apiKey,
      }),
    })
    if (srvRes.ok) {
      const srvData = await srvRes.json()
      if (srvData.ok && srvData.text) {
        return srvData.text
      }
    }
  } catch {}

  // 2. Direct client-to-Google call
  if (!apiKey) {
    throw new Error(
      'Gemini API võti puudub. Palun sisesta API võti lehe Admin-paneelis või seadetes.'
    )
  }

  const cleanModel = chosenModel.replace(/^models\//, '')
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: options?.temperature ?? 0.85,
      },
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const msg = errData?.error?.message || `Gemini API viga (${res.status})`
    throw new Error(msg)
  }

  const data = await res.json()
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidate) {
    throw new Error('Gemini ei tagastanud vastust.')
  }

  return candidate
}

