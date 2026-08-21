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

export function getConfig(): AppConfig {
  const c = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {}
  // Prefer runtime config, then build-time import.meta.env
  const rawBase =
    c.basePath ??
    (typeof window !== 'undefined' ? window.__BASE_PATH__ : undefined) ??
    import.meta.env.VITE_BASE_PATH ??
    import.meta.env.BASE_URL

  const basePath = normalizeBasePath(
    // Vite BASE_URL is like "/mangud/"
    rawBase === './' ? '' : rawBase
  )

  const pbUrl =
    c.pbUrl ||
    (typeof window !== 'undefined' ? window.__PB_URL__ : undefined) ||
    import.meta.env.VITE_PB_URL ||
    'http://127.0.0.1:8090'

  return { basePath, pbUrl }
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

/** Asset under base, e.g. assetUrl('sounds/x.mp3') -> /mangud/sounds/x.mp3 */
export function assetUrl(rel: string): string {
  const { basePath } = getConfig()
  const r = rel.replace(/^\//, '')
  // import.meta.env.BASE_URL already has trailing slash when set
  const base = import.meta.env.BASE_URL || (basePath ? basePath + '/' : '/')
  return base + r
}
