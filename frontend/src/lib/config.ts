export type AppConfig = {
  basePath: string
  pbUrl: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<AppConfig>
    __PB_URL__?: string
    __BASE_PATH__?: string
  }
}

/** "" or "/mangud" (no trailing slash) */
export function normalizeBasePath(p?: string): string {
  if (!p || p === '/' || p === './') return ''
  let s = String(p).trim()
  if (!s.startsWith('/')) s = '/' + s
  if (s.endsWith('/')) s = s.slice(0, -1)
  return s
}

/**
 * PocketBase SDK needs a full origin URL in many setups.
 * Relative "/mangud/pb" → "https://host/mangud/pb"
 */
export function resolvePbUrl(raw?: string): string {
  let u = (raw || '').trim()
  if (!u) u = 'http://127.0.0.1:8090'
  // strip trailing slash
  u = u.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    if (u.startsWith('/')) {
      u = `${window.location.origin}${u}`
    } else if (u.startsWith('./')) {
      u = `${window.location.origin}${normalizeBasePath(window.__APP_CONFIG__?.basePath) || ''}/pb`
    }
  }
  return u
}

export function getConfig(): AppConfig {
  const c = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {}
  const rawBase =
    c.basePath ??
    (typeof window !== 'undefined' ? window.__BASE_PATH__ : undefined) ??
    import.meta.env.VITE_BASE_PATH ??
    import.meta.env.BASE_URL

  const basePath = normalizeBasePath(rawBase === './' ? '' : rawBase)

  const rawPb =
    c.pbUrl ||
    (typeof window !== 'undefined' ? window.__PB_URL__ : undefined) ||
    import.meta.env.VITE_PB_URL ||
    (basePath ? `${basePath}/pb` : 'http://127.0.0.1:8090')

  return { basePath, pbUrl: resolvePbUrl(rawPb) }
}

export function appPath(path: string): string {
  const { basePath } = getConfig()
  const p = path.startsWith('/') ? path : '/' + path
  return basePath + p
}

export function appUrl(path: string): string {
  const pathWithBase = appPath(path)
  if (typeof window === 'undefined') return pathWithBase
  return `${window.location.origin}${pathWithBase}`
}

export function assetUrl(rel: string): string {
  const { basePath } = getConfig()
  const r = rel.replace(/^\//, '')
  const base = import.meta.env.BASE_URL || (basePath ? basePath + '/' : '/')
  return base + r
}
