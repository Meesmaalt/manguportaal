import PocketBase from 'pocketbase'
import { getConfig } from '@/lib/config'

function createPb() {
  const { pbUrl } = getConfig()
  return new PocketBase(pbUrl)
}

export const pb = createPb()

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
