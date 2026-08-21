import PocketBase from 'pocketbase'

const url = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(url)

// Auto-refresh auth
pb.authStore.onChange(() => {
  // optional: persist side-effects
})

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
  game_type: 'kuldvillak' | 'roosidesoda'
  data: KuldvillakPackData | RoosidesodaPackData
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
}

export type KuldvillakPackData = {
  categories: {
    name: string
    questions: KuldvillakQuestion[]
  }[]
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
  game_type: 'kuldvillak' | 'roosidesoda'
  pack: string
  expand?: { pack?: Pack }
  host: string
  state: Record<string, unknown>
  status: 'lobby' | 'playing' | 'finished'
  created: string
  updated: string
}

/** Generate a short session code */
export function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
