import type { Lang } from '@/i18n/translations'

/** Pack display title: supports string or { et, en, ru }. */
export function packTitle(
  pack: { name?: string; title?: string | Record<string, string>; names?: Record<string, string> },
  lang: Lang
): string {
  const n = pack.names || (typeof pack.title === 'object' ? pack.title : null)
  if (n && typeof n === 'object') {
    return n[lang] || n.et || n.en || pack.name || ''
  }
  return pack.name || (typeof pack.title === 'string' ? pack.title : '') || ''
}

export function packDescription(
  pack: { description?: string | Record<string, string> },
  lang: Lang
): string {
  const d = pack.description
  if (!d) return ''
  if (typeof d === 'object') return d[lang] || d.et || d.en || ''
  return d
}
