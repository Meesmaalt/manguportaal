import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import { tryClaimBuzz } from '@/lib/sessions'
import { useI18n } from '@/i18n/I18nContext'

export default function Buzzer() {
  const { code: codeParam } = useParams<{ code: string }>()
  const code = (codeParam || '').toUpperCase()
  const { t } = useI18n()
  const [name, setName] = useState(() => localStorage.getItem('ohtu_buzz_name') || '')
  const [status, setStatus] = useState<'idle' | 'ready' | 'buzzed' | 'error' | 'loading'>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [msg, setMsg] = useState('')
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (!code) {
      setStatus('error')
      setMsg(t('errorSession'))
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await pb.collection('game_sessions').getList<GameSession>(1, 1, {
          filter: `code = "${code}" && status != "finished"`,
        })
        if (cancelled) return
        if (list.items.length) {
          setSessionId(list.items[0].id)
          setIsLocal(false)
          setStatus('ready')
          return
        }
      } catch {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith('session_')) continue
        try {
          const data = JSON.parse(localStorage.getItem(key)!)
          if (data.code?.toUpperCase() === code) {
            if (cancelled) return
            setSessionId(key.replace('session_', ''))
            setIsLocal(true)
            setStatus('ready')
            setMsg(t('sessionLocalWarn'))
            return
          }
        } catch {}
      }
      if (!cancelled) {
        setStatus('error')
        setMsg(t('buzzSessionMissing'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, t])

  async function buzz() {
    if (!name.trim() || !sessionId || locked) return
    localStorage.setItem('ohtu_buzz_name', name.trim())
    setLocked(true)
    const res = await tryClaimBuzz({ sessionId, isLocal, name: name.trim() })
    if (res.ok) {
      setStatus('buzzed')
      setMsg(t('buzzYou'))
    } else if (res.reason === 'taken') {
      setStatus('buzzed')
      setMsg(`${t('buzzTooLate')}: ${res.by || '?'}`)
    } else if (res.reason === 'disabled') {
      setMsg(t('buzzDisabled'))
      setLocked(false)
    } else {
      setMsg(t('buzzError'))
      setLocked(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 gap-6">
      <h1 className="font-display text-4xl text-gold font-black">🔔 {t('buzzTitle')}</h1>
      <p className="text-white/50 text-sm">
        {t('sessionCode')}: <span className="text-gold font-mono tracking-widest">{code || '—'}</span>
      </p>

      {status === 'loading' && <p className="text-gold animate-pulse">{t('connecting')}</p>}
      {status === 'error' && (
        <div className="text-center max-w-md">
          <p className="text-accent-red mb-4 text-sm leading-relaxed">{msg}</p>
          <Link to="/" className="text-gold text-sm">
            ← {t('packBack')}
          </Link>
        </div>
      )}

      {(status === 'ready' || status === 'buzzed') && (
        <div className="w-full max-w-sm space-y-4">
          {msg && status === 'ready' && <p className="text-amber-200/80 text-xs text-center">{msg}</p>}
          <input
            className="input-field text-center text-lg"
            placeholder={t('buzzName')}
            value={name}
            disabled={status === 'buzzed'}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
          />
          <button
            type="button"
            disabled={!name.trim() || status === 'buzzed'}
            onClick={buzz}
            className="w-full py-10 rounded-3xl font-display text-3xl font-black bg-gold text-bg active:scale-95 transition disabled:opacity-40 shadow-[0_0_40px_rgba(223,179,66,0.45)]"
          >
            {t('buzzMe')}
          </button>
          {msg && status === 'buzzed' && <p className="text-center text-white/70">{msg}</p>}
          {status === 'buzzed' && (
            <button
              type="button"
              className="btn-outline w-full text-sm"
              onClick={() => {
                setStatus('ready')
                setLocked(false)
                setMsg('')
              }}
            >
              {t('buzzAgain')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
