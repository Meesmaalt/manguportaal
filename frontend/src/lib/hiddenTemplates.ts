/** Templates (code OFFICIAL_PACKS) the admin removed — do not re-offer until restored. */
const KEY = 'ohtu_hidden_templates'

export function templateKey(gameType: string, name: string) {
  return `${gameType}::${name}`
}

export function getHiddenTemplates(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

export function hideTemplate(gameType: string, name: string) {
  const s = getHiddenTemplates()
  s.add(templateKey(gameType, name))
  localStorage.setItem(KEY, JSON.stringify([...s]))
}

export function unhideTemplate(gameType: string, name: string) {
  const s = getHiddenTemplates()
  s.delete(templateKey(gameType, name))
  localStorage.setItem(KEY, JSON.stringify([...s]))
}

export function clearHiddenTemplates() {
  localStorage.removeItem(KEY)
}

export function isTemplateHidden(gameType: string, name: string) {
  return getHiddenTemplates().has(templateKey(gameType, name))
}
