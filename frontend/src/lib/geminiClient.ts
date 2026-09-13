/**
 * Client-side Gemini AI generation helper.
 * Allows direct Gemini API calls from the browser when self-hosting with static nginx,
 * using an API key stored in localStorage (or environment if defined).
 */

const GEMINI_KEY_STORAGE = 'ohtu_gemini_api_key'

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

export function hasClientGeminiKey(): boolean {
  return Boolean(getClientGeminiKey())
}

/**
 * Call Gemini API directly from the client browser via REST endpoint.
 */
export async function callGeminiDirectly(prompt: string, apiKeyOverride?: string): Promise<string> {
  const apiKey = apiKeyOverride || getClientGeminiKey()
  if (!apiKey) {
    throw new Error('Gemini API võti puudub.')
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`

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
        temperature: 0.7,
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
