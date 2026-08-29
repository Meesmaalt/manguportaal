import PocketBase from 'pocketbase'
import { getConfig } from '@/lib/config'

function createPb() {
  const { pbUrl } = getConfig()
  const client = new PocketBase(pbUrl)
  // auto-cancel can cause weird errors in React StrictMode; disable
  client.autoCancellation(false)
  return client
}

export const pb = createPb()

/** Keep client base URL in sync with runtime env.js (subpath / reverse proxy). */
export function ensurePbUrl() {
  try {
    const { pbUrl } = getConfig()
    if (!pbUrl) return
    const normalized = pbUrl.replace(/\/$/, '')
    const current = String(pb.baseUrl || '').replace(/\/$/, '')
    if (normalized && normalized !== current) {
      pb.baseUrl = normalized
    }
  } catch {
    /* ignore */
  }
}

export function getPb(): PocketBase {
  ensurePbUrl()
  return pb
}

export function getAuthUserId(): string | null {
  const rec = pb.authStore.record || pb.authStore.model
  return rec && (rec as { id?: string }).id ? (rec as { id: string }).id : null
}


export type User = {
  id: string
  email: string
  name?: string
  avatar?: string
}

export type Pack = {
  id: string
  name: string
  description?: string
  game_type: string
  data: KuldvillakPackData | RoosidesodaPackData | Record<string, unknown>
  is_official: boolean
  is_public: boolean
  owner?: string
  created: string
  updated: string
}

export type KuldvillakQuestion = {
  points: number
  q: string
  a: string
  hostNote?: string
}

export type KuldvillakFinalJeopardy = {
  q: string
  a: string
  hostNote?: string
  maxWager?: number
}

export type KuldvillakPackData = {
  categories: {
    name: string
    questions: KuldvillakQuestion[]
  }[]
  finalJeopardy?: KuldvillakFinalJeopardy
}

export type RoosidesodaAnswer = {
  text: string
  points: number
}

export type RoosidesodaRound = {
  title: string
  multiplier: number
  question: string
  answers: RoosidesodaAnswer[]
}

export type RoosidesodaPackData = {
  rounds: RoosidesodaRound[]
}

export type GameSession = {
  id: string
  code: string
  game_type: string
  pack: string
  expand?: { pack?: Pack }
  host: string
  state: Record<string, unknown>
  status: 'lobby' | 'playing' | 'finished'
  created: string
  updated: string
}

export function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function formatPbError(
  e: unknown,
  opts?: { adminContext?: boolean }
): string {
  const err = e as any
  const msg = err?.message || String(e)
  const status = err?.status
  const data = err?.data || err?.response?.data
  let fieldHints = ''
  if (data && typeof data === 'object') {
    const parts: string[] = []
    for (const [k, v] of Object.entries(data)) {
      if (k === 'code' || k === 'message') continue
      const m = (v as any)?.message || (typeof v === 'string' ? v : JSON.stringify(v))
      if (m && m !== '{}') parts.push(`${k}: ${m}`)
    }
    if (parts.length) fieldHints = ' — ' + parts.join('; ')
  }
  if (msg.includes('collection context') || msg.includes('Missing or invalid')) {
    return (
      'PocketBase ei leia kollektsiooni (packs / game_sessions). ' +
      'Ava PB admin → Collections või impordi pb/collections.json. ' +
      `URL: ${getConfig().pbUrl}`
    )
  }
  if (status === 0 || msg.includes('Failed to fetch')) {
    return `PocketBase ei vasta (${getConfig().pbUrl}). Kontrolli PB_PUBLIC_URL / proksit.`
  }
  if (status === 400 || msg.includes('Failed to create')) {
    if (opts?.adminContext) {
      return (
        msg +
        fieldHints +
        '. Superuserina peaks create töötama (reeglid ignoreeritakse). ' +
        'Kontrolli packs välju (nt owner relation → users) PB Adminis.'
      )
    }
    return (
      msg +
      fieldHints +
      '. Kontrolli: oled sisse logitud lehe kontoga (mitte ainult PB admin)? ' +
      'packs Create rule: @request.auth.id != "". owner = sinu user id.'
    )
  }
  return msg + fieldHints
}
