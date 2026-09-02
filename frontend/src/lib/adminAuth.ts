import { pb } from '@/lib/pocketbase'

const BACKUP_KEY = 'ohtu_user_auth_backup'

/** Save regular user session before superuser login */
export function backupUserAuth() {
  try {
    if (!pb.authStore.token) {
      sessionStorage.removeItem(BACKUP_KEY)
      return
    }
    const rec: any = pb.authStore.record || pb.authStore.model
    const col = String(rec?.collectionName || rec?.collectionId || '')
    // Don't backup superuser as "user"
    if (col.includes('superuser')) return
    sessionStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({
        token: pb.authStore.token,
        record: rec,
      })
    )
  } catch {
    /* ignore */
  }
}

export function restoreUserAuth() {
  try {
    const raw = sessionStorage.getItem(BACKUP_KEY)
    if (!raw) {
      pb.authStore.clear()
      return false
    }
    const data = JSON.parse(raw)
    if (data?.token && data?.record) {
      pb.authStore.save(data.token, data.record)
      return true
    }
  } catch {
    /* ignore */
  }
  pb.authStore.clear()
  return false
}

export function clearAuthBackup() {
  try {
    sessionStorage.removeItem(BACKUP_KEY)
  } catch {
    /* ignore */
  }
}

export function isSuperuserSession(): boolean {
  if (!pb.authStore.token) return false
  const rec: any = pb.authStore.record || pb.authStore.model
  if (!rec) return false
  const col = String(rec.collectionName || rec.collectionId || '')
  return col.includes('superuser') || col === '_superusers'
}
