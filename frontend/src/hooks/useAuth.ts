import { useEffect, useState } from 'react'
import { pb, type User, ensurePbUrl } from '@/lib/pocketbase'

function currentUser(): User | null {
  const rec = (pb.authStore.record || pb.authStore.model) as User | null
  return rec?.id ? rec : null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ensurePbUrl()

    const sync = () => setUser(currentUser())

    const check = async () => {
      try {
        ensurePbUrl()
        if (pb.authStore.token) {
          // Refresh even if isValid is false (clock skew / SDK quirks)
          try {
            await pb.collection('users').authRefresh()
          } catch {
            // May be superuser session (admin page) — try that before clearing
            try {
              await pb.collection('_superusers').authRefresh()
            } catch {
              try {
                await pb.collection('superusers').authRefresh()
              } catch {
                pb.authStore.clear()
              }
            }
          }
        }
        sync()
      } finally {
        setLoading(false)
      }
    }
    check()

    const unsub = pb.authStore.onChange(() => sync())
    return () => unsub()
  }, [])

  const login = async (email: string, password: string) => {
    ensurePbUrl()
    const auth = await pb.collection('users').authWithPassword(email, password)
    setUser(auth.record as unknown as User)
    return auth
  }

  const register = async (email: string, password: string, name: string) => {
    ensurePbUrl()
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
    })
    return login(email, password)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  // Prefer token presence + user id over isValid alone
  const isLoggedIn = !!(user?.id && pb.authStore.token)

  return { user, loading, login, register, logout, isLoggedIn }
}
