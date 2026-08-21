import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  if (isLoggedIn) {
    navigate('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) throw new Error('Nimi on kohustuslik')
        await register(email, password, name.trim())
      }
      navigate('/dashboard')
    } catch (err: any) {
      console.error(err)
      setError(
        err?.message ||
          (mode === 'login'
            ? 'Vale e-post või parool'
            : 'Registreerimine ebaõnnestus. Proovi teist e-posti.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-panel p-8 w-full max-w-md"
      >
        <h1 className="font-display text-3xl text-gold text-center mb-2">
          {mode === 'login' ? 'Sisene' : 'Loo konto'}
        </h1>
        <p className="text-white/50 text-center text-sm mb-8">
          {mode === 'login' ? 'Tere tulemast tagasi!' : 'Alusta oma mängude kogumist'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-gold/80 mb-1.5">Nimi</label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sinu nimi"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gold/80 mb-1.5">E-post</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sina@email.ee"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gold/80 mb-1.5">Parool</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-lg">
            {loading ? 'Oota...' : mode === 'login' ? 'Sisene' : 'Registreeri'}
          </button>
        </form>

        <p className="text-center text-white/50 text-sm mt-6">
          {mode === 'login' ? (
            <>
              Pole kontot?{' '}
              <button onClick={() => setMode('register')} className="text-gold hover:underline">
                Loo uus
              </button>
            </>
          ) : (
            <>
              Juba konto olemas?{' '}
              <button onClick={() => setMode('login')} className="text-gold hover:underline">
                Sisene
              </button>
            </>
          )}
        </p>

        <p className="text-center text-white/30 text-xs mt-4">
          <Link to="/" className="hover:text-white/50">
            ← Tagasi avalehele
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
