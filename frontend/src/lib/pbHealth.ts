import { pb, ensurePbUrl } from '@/lib/pocketbase'

export type PbHealth = 'unknown' | 'ok' | 'fail'

export async function checkPbHealth(): Promise<PbHealth> {
  try {
    ensurePbUrl()
    const base = pb.baseUrl.replace(/\/$/, '')
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const res = await fetch(`${base}/api/health`, { signal: ctrl.signal })
    clearTimeout(t)
    return res.ok ? 'ok' : 'fail'
  } catch {
    return 'fail'
  }
}
