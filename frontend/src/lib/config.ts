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

/** Normalize base path: "" or "/mangud" (no trailing slash, except root stays "") */
export function normalizeBasePath(p?: string): string {
  if (!p || p === '/' || p === './') return ''
  let s = p.trim()
  if (!s.startsWith('/')) s = '/' + s
  if (s.endsWith('/')) s = s.slice(0, -1)
  return s
}

export function getConfig(): AppConfig {
  const c = window.__APP_CONFIG__ || {}
  const basePath = normalizeBasePath(
    c.basePath ?? window.__BASE_PATH__ ?? import.meta.env.VITE_BASE_PATH
  )
  const pbUrl =
    c.pbUrl ||
    window.__PB_URL__ ||
    import.meta.env.VITE_PB_URL ||
    'http://127.0.0.1:8090'

  return { basePath, pbUrl }
}

/** Full path under base, e.g. appPath('/ekraan/ABC') -> '/mangud/ekraan/ABC' */
export function appPath(path: string): string {
  const { basePath } = getConfig()
  const p = path.startsWith('/') ? path : '/' + path
  return basePath + p
}

/** Absolute URL for sharing (TV link) */
export function appUrl(path: string): string {
  const pathWithBase = appPath(path)
  if (typeof window === 'undefined') return pathWithBase
  return `${window.location.origin}${pathWithBase}`
}
