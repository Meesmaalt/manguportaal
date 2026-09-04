import { pb, ensurePbUrl } from '@/lib/pocketbase'
import { assetUrl } from '@/lib/config'

/** All uploadable sound slots — admin can replace any of these. */
export const SOUND_SLOTS = [
  // Universal FX (used by playFx when file exists)
  { key: 'fx_click', label: 'Üldine: klikk / nupp', fallback: '' },
  { key: 'fx_tick', label: 'Üldine: taimer / tick', fallback: '' },
  { key: 'fx_reveal', label: 'Üldine: vastuse avamine', fallback: '' },
  { key: 'fx_correct', label: 'Üldine: õige vastus', fallback: '' },
  { key: 'fx_wrong', label: 'Üldine: vale vastus', fallback: '' },
  { key: 'fx_victory', label: 'Üldine: võit / podium', fallback: '' },
  { key: 'fx_jingle', label: 'Üldine: intro / 3-2-1', fallback: '' },
  { key: 'fx_drumroll', label: 'Üldine: trummipõrin', fallback: '' },
  { key: 'fx_join', label: 'Üldine: mängija liitus', fallback: '' },
  { key: 'fx_buzz', label: 'Üldine: buzzer', fallback: '' },
  { key: 'fx_timer_urgent', label: 'Üldine: taimer lõpus (kiire)', fallback: '' },
  // Blitz
  { key: 'blitz_correct', label: 'Blitz: õige', fallback: '' },
  { key: 'blitz_wrong', label: 'Blitz: vale', fallback: '' },
  { key: 'blitz_countdown', label: 'Blitz: 3-2-1', fallback: '' },
  { key: 'blitz_question', label: 'Blitz: uus küsimus', fallback: '' },
  { key: 'blitz_podium', label: 'Blitz: lõpp / podium', fallback: '' },
  // Kuldvillak
  { key: 'kuldvillak_bgm', label: 'Kuldvillak: taustamuusika', fallback: 'sounds/kuldvillak.mp3' },
  { key: 'kuldvillak_open', label: 'Kuldvillak: küsimus avaneb', fallback: '' },
  { key: 'kuldvillak_correct', label: 'Kuldvillak: õige', fallback: '' },
  { key: 'kuldvillak_wrong', label: 'Kuldvillak: vale', fallback: '' },
  { key: 'kuldvillak_buzz', label: 'Kuldvillak: buzzer', fallback: '' },
  // Rooside sõda
  { key: 'roos_correct', label: 'Rooside Sõda: õige', fallback: 'sounds/roosidesoda-oige.mp3' },
  { key: 'roos_error', label: 'Rooside Sõda: vale', fallback: 'sounds/roosidesoda-error.mp3' },
  { key: 'roos_bgm', label: 'Rooside Sõda: taust', fallback: 'sounds/roosidesoda-taustamuusika.mp3' },
  // Kinnistu Deal
  { key: 'deal_play', label: 'Kinnistu Deal: kaardi mäng', fallback: '' },
  { key: 'deal_rent', label: 'Kinnistu Deal: üür', fallback: '' },
  { key: 'deal_win', label: 'Kinnistu Deal: võit', fallback: '' },
  // Party
  { key: 'party_lobby', label: 'Peo lobby / ooteala', fallback: '' },
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
    for (const row of rows) {
      if (row.key) byKey[row.key] = row
    }
  } catch {
    /* collection missing */
  }
  await loadSoundOverridesFromPb()
  return SOUND_SLOTS.map((slot) => {
    const row = byKey[slot.key]
    const customUrl = row?.file ? pb.files.getURL(row, row.file) : memoryMap[slot.key]
    const fallback = slot.fallback ? assetUrl(slot.fallback) : ''
    return {
      id: row?.id,
      key: slot.key,
      label: slot.label,
      fileUrl: customUrl || fallback,
      hasCustom: Boolean(row?.file || (memoryMap[slot.key] && !fallback)),
    }
  })
}

export async function uploadSound(key: string, file: File): Promise<void> {
  ensurePbUrl()
  const existing = await pb.collection('game_sounds').getFullList<any>({
    filter: `key = "${key}"`,
    requestKey: null,
  }).catch(() => [])
  const form = new FormData()
  form.append('key', key)
  form.append('file', file)
  if (existing[0]?.id) {
    await pb.collection('game_sounds').update(existing[0].id, form)
  } else {
    await pb.collection('game_sounds').create(form)
  }
  await loadSoundOverridesFromPb()
}

export async function deleteSound(key: string): Promise<void> {
  ensurePbUrl()
  const existing = await pb.collection('game_sounds').getFullList<any>({
    filter: `key = "${key}"`,
    requestKey: null,
  }).catch(() => [])
  for (const row of existing) {
    await pb.collection('game_sounds').delete(row.id)
  }
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
