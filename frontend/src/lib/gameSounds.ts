import { pb, ensurePbUrl } from '@/lib/pocketbase'
import { assetUrl } from '@/lib/config'

/** Logical sound slots used by games */
export const SOUND_SLOTS = [
  { key: 'kuldvillak_bgm', label: 'Kuldvillak taust', fallback: 'sounds/kuldvillak.mp3' },
  { key: 'roos_correct', label: 'Rooside Sõda õige', fallback: 'sounds/roosidesoda-oige.mp3' },
  { key: 'roos_error', label: 'Rooside Sõda vale', fallback: 'sounds/roosidesoda-error.mp3' },
  { key: 'roos_bgm', label: 'Rooside Sõda taust', fallback: 'sounds/roosidesoda-taustamuusika.mp3' },
  { key: 'blitz_correct', label: 'Blitz õige (valikuline)', fallback: '' },
  { key: 'blitz_wrong', label: 'Blitz vale (valikuline)', fallback: '' },
] as const

export type SoundKey = (typeof SOUND_SLOTS)[number]['key']

const CACHE_KEY = 'ohtu_sound_overrides'
let memoryMap: Record<string, string> = {}

export function getSoundUrl(key: SoundKey | string): string {
  if (memoryMap[key]) return memoryMap[key]
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>
      if (parsed[key]) {
        memoryMap[key] = parsed[key]
        return parsed[key]
      }
    }
  } catch {
    /* ignore */
  }
  const slot = SOUND_SLOTS.find((s) => s.key === key)
  return slot?.fallback ? assetUrl(slot.fallback) : ''
}

function persistLocal(map: Record<string, string>) {
  memoryMap = { ...map }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

/** Load overrides from PocketBase game_sounds collection (if exists) */
export async function loadSoundOverridesFromPb(): Promise<Record<string, string>> {
  ensurePbUrl()
  const map: Record<string, string> = {}
  try {
    const rows = await pb.collection('game_sounds').getFullList<any>({ requestKey: null })
    for (const row of rows) {
      if (row.key && row.file) {
        map[row.key] = pb.files.getURL(row, row.file)
      }
    }
    persistLocal(map)
  } catch {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) memoryMap = JSON.parse(raw)
    } catch {
      /* ignore */
    }
  }
  return memoryMap
}

export type SoundRow = {
  id?: string
  key: string
  label: string
  fileUrl: string
  hasCustom: boolean
}

export async function listSoundRows(): Promise<SoundRow[]> {
  ensurePbUrl()
  let byKey: Record<string, any> = {}
  try {
    const rows = await pb.collection('game_sounds').getFullList<any>({ requestKey: null })
    for (const r of rows) {
      byKey[r.key] = r
    }
  } catch {
    byKey = {}
  }
  const map: Record<string, string> = {}
  for (const [k, row] of Object.entries(byKey)) {
    if (row.file) map[k] = pb.files.getURL(row, row.file)
  }
  if (Object.keys(map).length) persistLocal(map)

  return SOUND_SLOTS.map((slot) => {
    const row = byKey[slot.key]
    const custom = row && row.file ? pb.files.getURL(row, row.file) : ''
    const fallback = slot.fallback ? assetUrl(slot.fallback) : ''
    return {
      id: row?.id,
      key: slot.key,
      label: slot.label,
      fileUrl: custom || fallback,
      hasCustom: !!custom,
    }
  })
}

export async function uploadSound(key: string, file: File): Promise<void> {
  ensurePbUrl()
  const form = new FormData()
  form.append('key', key)
  form.append('file', file)
  try {
    const existing = await pb.collection('game_sounds').getFirstListItem(`key="${key}"`)
    await pb.collection('game_sounds').update(existing.id, form)
  } catch {
    await pb.collection('game_sounds').create(form)
  }
  await loadSoundOverridesFromPb()
}

export async function deleteSound(key: string): Promise<void> {
  ensurePbUrl()
  try {
    const existing = await pb.collection('game_sounds').getFirstListItem(`key="${key}"`)
    await pb.collection('game_sounds').delete(existing.id)
  } catch {
    /* ignore */
  }
  // remove from local cache
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>
      delete map[key]
      persistLocal(map)
    }
  } catch {
    /* ignore */
  }
  await loadSoundOverridesFromPb()
}
