import { pb } from '@/lib/pocketbase'

/** /api/ai/* päringud nõuavad sisselogitud kasutajat (PocketBase'i token). */
export function aiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra }
  try { if (pb.authStore.token) headers.Authorization = pb.authStore.token } catch { /* ignore */ }
  return headers
}
