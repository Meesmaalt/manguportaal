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

/** Call after env.js loads if pbUrl might have changed (usually not needed). */
export function getPb(): PocketBase {
  return pb
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

export function formatPbError(e: unknown): string {
  const err = e as any
  const msg = err?.message || String(e)
  const status = err?.status
  if (msg.includes('collection context') || msg.includes('Missing or invalid')) {
    return (
      'PocketBase ei leia kollektsiooni (packs / game_sessions). ' +
      'Ava PB admin → Collections. Kui puuduvad, taaskäivita pb konteiner migratsioonidega, ' +
      'või impordi pb/collections.json. ' +
      `URL: ${getConfig().pbUrl}`
    )
  }
  if (status === 0 || msg.includes('Failed to fetch')) {
    return `PocketBase ei vasta (${getConfig().pbUrl}). Kontrolli PB_PUBLIC_URL / proksit.`
  }
  return msg
}
