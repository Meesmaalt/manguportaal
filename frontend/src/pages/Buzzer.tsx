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
  const [selectedTeam, setSelectedTeam] = useState<string>(() => localStorage.getItem('ohtu_buzz_team') || '')
  const [isEditingName, setIsEditingName] = useState(() => !localStorage.getItem('ohtu_buzz_name'))
  const [status, setStatus] = useState<'ready' | 'won' | 'lost' | 'submitted' | 'loading'>('ready')
  const [msg, setMsg] = useState(isLocal ? t('sessionLocalWarn') : '')
  const [locked, setLocked] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [reactionSent, setReactionSent] = useState<string | null>(null)

  const inputMode = state?.inputMode || 'buzz' // 'buzz' | 'text'
  const sessionTeams: Array<{ name: string }> = Array.isArray(state?.teams) ? state.teams : []

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
      const displayName = selectedTeam ? `${name.trim()} (${selectedTeam})` : name.trim()
      const myInput = state?.playerInputs?.[displayName] || state?.playerInputs?.[name.trim()]
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
  }, [state?.playerInputs, inputMode, name, selectedTeam, status])

  function getEffectiveName() {
    const raw = name.trim()
    if (!raw) return ''
    if (selectedTeam && sessionTeams.some((t) => t.name === selectedTeam)) {
      return `${raw} [${selectedTeam}]`
    }
    return raw
  }

  async function buzz() {
    const effName = getEffectiveName()
    if (!effName || locked) return
    localStorage.setItem('ohtu_buzz_name', name.trim())
    if (selectedTeam) localStorage.setItem('ohtu_buzz_team', selectedTeam)
    try {
      if ('vibrate' in navigator) navigator.vibrate([40, 20, 60])
    } catch {}
    setLocked(true)
    const res = await tryClaimBuzz({ sessionId, isLocal, name: effName })
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
    const effName = getEffectiveName()
    if (!effName || !inputValue.trim() || locked) return
    localStorage.setItem('ohtu_buzz_name', name.trim())
    if (selectedTeam) localStorage.setItem('ohtu_buzz_team', selectedTeam)
    setLocked(true)
    const res = await submitPlayerInput({ sessionId, isLocal, name: effName, value: inputValue.trim() })
    if (res.ok) {
      setStatus('submitted')
      setMsg('Vastus saadetud!')
      if (navigator.vibrate) navigator.vibrate([50])
    } else {
      setMsg('Viga saatmisel')
      setLocked(false)
    }
  }

  async function sendReaction(emoji: string) {
    setReactionSent(emoji)
    try {
      if ('vibrate' in navigator) navigator.vibrate([30])
    } catch {}
    setTimeout(() => setReactionSent(null), 1200)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 gap-5 py-8 md:py-10 ohtu-page-enter">
      <div className="text-center space-y-1.5 max-w-md">
        <h1 className="font-display text-3xl md:text-5xl text-gold font-black tracking-wide">
          {inputMode === 'text' ? '📝 Sisesta vastus' : `🔔 ${t('buzzTitle')}`}
        </h1>
        <p className="text-white/80 text-sm md:text-base font-medium leading-snug">{t('buzzGuestLead')}</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/50 bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
        <span>{t('sessionCode')}:</span>
        <strong className="text-gold font-mono tracking-widest text-sm">{code || '—'}</strong>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {msg && status === 'ready' && (
          <p className="text-amber-200/90 text-xs text-center leading-relaxed bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl">
            {msg}
          </p>
        )}
        
        {!isEditingName && name.trim() && status === 'ready' ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 shadow-sm flex items-center justify-between">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Mängija</span>
                {selectedTeam && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.2 rounded-full">
                    {selectedTeam}
                  </span>
                )}
              </div>
              <span className="text-gold font-bold text-lg leading-tight block">{name}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-white/60 hover:text-gold p-2 rounded-xl hover:bg-white/10 transition flex items-center gap-1.5 text-xs border border-transparent hover:border-gold/30"
              title="Muuda nime või tiimi"
            >
              <Pencil size={14} />
              <span>Muuda</span>
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-white/60 text-xs block text-center font-medium">{t('buzzName')}</span>
            <div className="flex gap-2">
              <input
                className="input-field text-center text-base flex-1 !py-2.5 rounded-xl font-medium"
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
                  className="btn-gold !py-2.5 px-3.5 rounded-xl flex items-center justify-center text-sm font-bold active:scale-95"
                  title="Salvesta nimi"
                >
                  <Check size={16} />
                </button>
              )}
            </div>

            {/* Optional Team Picker if game has teams */}
            {sessionTeams.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-[11px] text-white/50 block text-center mb-1.5">Vali oma tiim:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {sessionTeams.map((tm) => (
                    <button
                      key={tm.name}
                      type="button"
                      onClick={() => {
                        setSelectedTeam(tm.name === selectedTeam ? '' : tm.name)
                        if (tm.name !== selectedTeam) localStorage.setItem('ohtu_buzz_team', tm.name)
                        else localStorage.removeItem('ohtu_buzz_team')
                      }}
                      className={`text-xs py-1.5 px-2 rounded-lg border font-medium transition ${
                        selectedTeam === tm.name
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-white/[0.03] border-white/10 text-white/70 hover:border-white/30'
                      }`}
                    >
                      {tm.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {inputMode === 'text' && (
          <div className="space-y-3 mt-4">
            <input
              className="input-field w-full text-center text-xl py-4 rounded-2xl"
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
              className={`w-full py-5 rounded-2xl font-display text-2xl font-black transition active:scale-95 flex items-center justify-center gap-2
                ${status === 'submitted' ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)]' :
                  'bg-gold text-bg shadow-[0_0_30px_rgba(223,179,66,0.3)] disabled:opacity-40'}`}
            >
              <Send size={24} />
              <span>{status === 'submitted' ? 'Saadetud!' : 'Saada vastus'}</span>
            </button>
          </div>
        )}

        {inputMode === 'buzz' && (
          <button
            type="button"
            disabled={!name.trim() || status === 'won' || status === 'lost'}
            onClick={buzz}
            className={`w-full py-12 md:py-14 rounded-3xl font-display text-3xl md:text-4xl font-black transition-all active:scale-90 flex flex-col items-center justify-center gap-2 select-none shadow-2xl
              ${status === 'won' ? 'bg-emerald-500 text-white shadow-[0_0_50px_rgba(16,185,129,0.8)] border-4 border-emerald-300 animate-pulse' :
                status === 'lost' ? 'bg-red-500/20 text-white/50 border border-red-500/30 opacity-80' :
                'bg-gold text-bg shadow-[0_0_50px_rgba(223,179,66,0.4)] hover:shadow-[0_0_60px_rgba(223,179,66,0.6)] disabled:opacity-40'}`}
          >
            <Zap size={40} strokeWidth={2.5} className="animate-bounce" />
            <span>{t('buzzMe')}</span>
          </button>
        )}

        {/* Quick Reaction Emojis */}
        <div className="pt-2 flex items-center justify-center gap-2">
          {['👏', '🔥', '😂', '🎯', '🎉'].map((emo) => (
            <button
              key={emo}
              type="button"
              onClick={() => sendReaction(emo)}
              className="text-xl p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 active:scale-125 border border-white/10 transition-transform"
              title="Saada reaktsioon"
            >
              {emo}
            </button>
          ))}
        </div>

        {reactionSent && (
          <div className="text-center text-xs text-gold animate-pulse">
            Saadetud: {reactionSent}
          </div>
        )}

        {msg && (status === 'won' || status === 'lost') && (
          <p className={`text-center text-lg font-bold p-3.5 rounded-2xl ${
            status === 'won' ? 'text-emerald-300 bg-emerald-900/40 border border-emerald-500/30' : 'text-red-300 bg-red-900/40 border border-red-500/30'
          }`}>{msg}</p>
        )}
      </div>
    </div>
  )
}
