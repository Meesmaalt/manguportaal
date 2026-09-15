import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import { tryClaimBuzz, submitPlayerInput } from '@/lib/sessions'
import { useGameSession } from '@/hooks/useGameSession'
import { useI18n } from '@/i18n/I18nContext'
import { Zap, Send, Pencil, Check } from 'lucide-react'
import { playFx } from '@/lib/audio'
import QuickJoinCard from '@/components/QuickJoinCard'

export default function Buzzer() {
  const { code: codeParam } = useParams<{ code: string }>()
  const code = (codeParam || '').toUpperCase()
  const { t } = useI18n()
  const navigate = useNavigate()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!code) return
    let cancelled = false
    ;(async () => {
      try {
        const list = await pb.collection('game_sessions').getList<GameSession>(1, 1, {
          filter: `code = "${code}" && status != "finished"`,
        })
        if (cancelled) return
        if (list.items.length) {
          const item = list.items[0]
          if (item.game_type === 'blitz') {
            navigate(`/blitz/${code}`, { replace: true })
            return
          }
          if (item.game_type === 'miljonar') {
            navigate(`/miljonar/${code}`, { replace: true })
            return
          }
          setSessionId(item.id)
          setIsLocal(false)
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
            if (data.game_type === 'blitz') {
              navigate(`/blitz/${code}`, { replace: true })
              return
            }
            if (data.game_type === 'miljonar') {
              navigate(`/miljonar/${code}`, { replace: true })
              return
            }
            setSessionId(key.replace('session_', ''))
            setIsLocal(true)
            return
          }
        } catch {}
      }
      
      if (!cancelled) {
        setErrorMsg(t('buzzSessionMissing'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, t, navigate])

  if (!code) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 py-10">
        <QuickJoinCard className="w-full max-w-md" />
        <div className="mt-6 text-center">
          <Link to="/" className="text-white/40 hover:text-gold text-sm transition">
            ← {t('brand')}
          </Link>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 gap-5 py-10">
        <div className="text-center max-w-md w-full">
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 mb-6">
            <p className="text-accent-red text-sm leading-relaxed">{errorMsg}</p>
          </div>
          <QuickJoinCard compact className="w-full" />
          <div className="mt-4">
            <Link to="/" className="text-gold text-sm hover:underline">
              ← {t('packBack')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 py-10">
        <p className="text-gold animate-pulse">{t('connecting')}</p>
      </div>
    )
  }

  return <BuzzerClient sessionId={sessionId} isLocal={isLocal} code={code} />
}

function BuzzerClient({ sessionId, isLocal, code }: { sessionId: string; isLocal: boolean; code: string }) {
  const { t } = useI18n()
  const { state } = useGameSession<any>(sessionId)
  
  const [name, setName] = useState(() => localStorage.getItem('ohtu_buzz_name') || '')
  const [isEditingName, setIsEditingName] = useState(() => !localStorage.getItem('ohtu_buzz_name'))
  const [status, setStatus] = useState<'ready' | 'won' | 'lost' | 'submitted' | 'loading'>('ready')
  const [msg, setMsg] = useState(isLocal ? t('sessionLocalWarn') : '')
  const [locked, setLocked] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const inputMode = state?.inputMode || 'buzz' // 'buzz' | 'text'

  // Reset status if buzz is cleared by host
  useEffect(() => {
    if (inputMode === 'buzz' && !state?.buzz && (status === 'won' || status === 'lost')) {
      setStatus('ready')
      setLocked(false)
      setMsg('')
    }
  }, [state?.buzz, inputMode, status])
  
  // Reset status if inputMode changes or playerInputs is cleared
  useEffect(() => {
    if (inputMode === 'text') {
      const myInput = state?.playerInputs?.[name.trim()]
      if (!myInput && status === 'submitted') {
        setStatus('ready')
        setLocked(false)
        setMsg('')
        setInputValue('')
      } else if (myInput && status !== 'submitted') {
        setStatus('submitted')
        setLocked(true)
        setMsg('Vastus saadetud!')
      }
    }
  }, [state?.playerInputs, inputMode, name, status])

  async function buzz() {
    if (!name.trim() || locked) return
    localStorage.setItem('ohtu_buzz_name', name.trim())
    try {
      if ('vibrate' in navigator) navigator.vibrate([40, 20, 60])
    } catch {}
    setLocked(true)
    const res = await tryClaimBuzz({ sessionId, isLocal, name: name.trim() })
    if (res.ok) {
      playFx('buzz')
      setStatus('won')
      setMsg(t('buzzYou'))
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    } else if (res.reason === 'taken') {
      setStatus('lost')
      setMsg(`${t('buzzTooLate')}: ${res.by || '?'}`)
      if (navigator.vibrate) navigator.vibrate([200])
    } else if (res.reason === 'disabled') {
      setMsg(t('buzzDisabled'))
      setLocked(false)
    } else {
      setMsg(t('buzzError'))
      setLocked(false)
    }
  }
  
  async function submitText() {
    if (!name.trim() || !inputValue.trim() || locked) return
    localStorage.setItem('ohtu_buzz_name', name.trim())
    setLocked(true)
    const res = await submitPlayerInput({ sessionId, isLocal, name: name.trim(), value: inputValue.trim() })
    if (res.ok) {
      setStatus('submitted')
      setMsg('Vastus saadetud!')
      if (navigator.vibrate) navigator.vibrate([50])
    } else {
      setMsg('Viga saatmisel')
      setLocked(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 gap-5 py-10">
      <div className="text-center space-y-2 max-w-md">
        <h1 className="font-display text-4xl md:text-5xl text-gold font-black tracking-wide">
          {inputMode === 'text' ? '📝 Sisesta vastus' : `🔔 ${t('buzzTitle')}`}
        </h1>
        <p className="text-white/80 text-base md:text-lg font-medium leading-snug">{t('buzzGuestLead')}</p>
        <p className="text-white/45 text-sm leading-relaxed">{t('buzzGuestHint')}</p>
      </div>

      <p className="text-white/40 text-xs">
        {t('sessionCode')}: <span className="text-gold font-mono tracking-widest text-sm">{code || '—'}</span>
      </p>

      <div className="w-full max-w-sm space-y-4">
        {msg && status === 'ready' && (
          <p className="text-amber-200/80 text-xs text-center leading-relaxed">{msg}</p>
        )}
        
        {!isEditingName && name.trim() && status === 'ready' ? (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 shadow-sm">
            <div className="text-left">
              <span className="text-white/40 text-[10px] uppercase tracking-wider block font-semibold">Mängija</span>
              <span className="text-gold font-bold text-lg leading-tight">{name}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-white/60 hover:text-gold p-1.5 rounded-lg hover:bg-white/10 transition flex items-center gap-1 text-xs border border-transparent hover:border-gold/30"
              title="Muuda nime"
            >
              <Pencil size={13} />
              <span>Muuda</span>
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-white/50 text-xs block mb-1.5 text-center font-medium">{t('buzzName')}</span>
            <div className="flex gap-2">
              <input
                className="input-field text-center text-lg flex-1 !py-2"
                placeholder={t('buzzNamePlaceholder')}
                value={name}
                disabled={status !== 'ready'}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    localStorage.setItem('ohtu_buzz_name', name.trim())
                    setIsEditingName(false)
                  }
                }}
                maxLength={24}
                autoComplete="nickname"
                autoFocus={isEditingName}
              />
              {name.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('ohtu_buzz_name', name.trim())
                    setIsEditingName(false)
                  }}
                  className="btn-gold !py-2 px-3.5 flex items-center justify-center text-sm font-bold active:scale-95"
                  title="Salvesta nimi"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          </div>
        )}
        
        {inputMode === 'text' && (
          <div className="space-y-3 mt-4">
            <input
              className="input-field w-full text-center text-xl py-4"
              placeholder="Sinu vastus..."
              value={inputValue}
              disabled={status === 'submitted'}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitText()}
            />
            <button
              type="button"
              disabled={!name.trim() || !inputValue.trim() || status === 'submitted'}
              onClick={submitText}
              className={`w-full py-6 rounded-2xl font-display text-2xl font-black transition active:scale-95 flex flex-col items-center justify-center gap-2
                ${status === 'submitted' ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)]' :
                  'bg-gold text-bg shadow-[0_0_30px_rgba(223,179,66,0.3)] disabled:opacity-40'}`}
            >
              <Send size={28} />
              {status === 'submitted' ? 'Saadetud!' : 'Saada'}
            </button>
          </div>
        )}

        {inputMode === 'buzz' && (
          <button
            type="button"
            disabled={!name.trim() || status === 'won' || status === 'lost'}
            onClick={buzz}
            className={`w-full py-12 rounded-3xl font-display text-3xl md:text-4xl font-black transition active:scale-95 flex flex-col items-center justify-center gap-2
              ${status === 'won' ? 'bg-emerald-500 text-white shadow-[0_0_48px_rgba(16,185,129,0.8)] border-4 border-emerald-300' :
                status === 'lost' ? 'bg-red-500/20 text-white/50 border border-red-500/30 opacity-80' :
                'bg-gold text-bg shadow-[0_0_48px_rgba(223,179,66,0.5)] disabled:opacity-40'}`}
          >
            <Zap size={36} strokeWidth={2.5} />
            {t('buzzMe')}
          </button>
        )}

        <p className="text-center text-white/35 text-xs leading-relaxed px-2">{t('buzzNoLogin')}</p>

        {msg && (status === 'won' || status === 'lost') && (
          <p className={`text-center text-lg font-bold p-3 rounded-xl ${status === 'won' ? 'text-emerald-300 bg-emerald-900/40 border border-emerald-500/30' : 'text-red-300 bg-red-900/40 border border-red-500/30'}`}>{msg}</p>
        )}
      </div>
    </div>
  )
}
