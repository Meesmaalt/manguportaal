import { useEffect, useState } from 'react'
import { pb, type User } from '@/lib/pocketbase'
import { RecordModel } from 'pocketbase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(
    pb.authStore.model ? (pb.authStore.model as unknown as User) : null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Refresh auth on mount
    const check = async () => {
      try {
        if (pb.authStore.isValid) {
          await pb.collection('users').authRefresh()
          setUser(pb.authStore.model as unknown as User)
        }
      } catch {
        pb.authStore.clear()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    check()

    const unsub = pb.authStore.onChange((_token, model) => {
      setUser(model ? (model as unknown as User) : null)
    })
    return () => unsub()
  }, [])

  const login = async (email: string, password: string) => {
    const auth = await pb.collection('users').authWithPassword(email, password)
    setUser(auth.record as unknown as User)
    return auth
  }

  const register = async (email: string, password: string, name: string) => {
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

  return { user, loading, login, register, logout, isLoggedIn: !!user }
}
