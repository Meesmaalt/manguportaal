import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import { tryClaimBuzz } from '@/lib/sessions'
import { useI18n } from '@/i18n/I18nContext'
import { Zap } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 gap-5 py-10">
      <div className="text-center space-y-2 max-w-md">
        <h1 className="font-display text-4xl md:text-5xl text-gold font-black tracking-wide">
          🔔 {t('buzzTitle')}
        </h1>
        <p className="text-white/80 text-base md:text-lg font-medium leading-snug">{t('buzzGuestLead')}</p>
        <p className="text-white/45 text-sm leading-relaxed">{t('buzzGuestHint')}</p>
      </div>

      <p className="text-white/40 text-xs">
        {t('sessionCode')}: <span className="text-gold font-mono tracking-widest text-sm">{code || '—'}</span>
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
          {msg && status === 'ready' && (
            <p className="text-amber-200/80 text-xs text-center leading-relaxed">{msg}</p>
          )}

          <label className="block text-center">
            <span className="text-white/50 text-xs block mb-1.5">{t('buzzName')}</span>
            <input
              className="input-field text-center text-lg"
              placeholder={t('buzzNamePlaceholder')}
              value={name}
              disabled={status === 'buzzed'}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              autoComplete="nickname"
              autoFocus={!name}
            />
          </label>

          <button
            type="button"
            disabled={!name.trim() || status === 'buzzed'}
            onClick={buzz}
            className="w-full py-12 rounded-3xl font-display text-3xl md:text-4xl font-black bg-gold text-bg active:scale-95 transition disabled:opacity-40 shadow-[0_0_48px_rgba(223,179,66,0.5)] flex flex-col items-center justify-center gap-2"
          >
            <Zap size={36} strokeWidth={2.5} />
            {t('buzzMe')}
          </button>

          <p className="text-center text-white/35 text-xs leading-relaxed px-2">{t('buzzNoLogin')}</p>

          {msg && status === 'buzzed' && (
            <p className="text-center text-white/80 text-base font-medium">{msg}</p>
          )}
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
