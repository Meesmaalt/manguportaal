import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tv, Zap, ArrowRight, History } from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'

const RECENT_CODES_KEY = 'ohtu_recent_codes'

function getRecentCodes(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_CODES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.slice(0, 4)
    }
  } catch {}
  return []
}

function saveRecentCode(code: string) {
  try {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length < 3) return
    const existing = getRecentCodes().filter((c) => c !== trimmed)
    const updated = [trimmed, ...existing].slice(0, 4)
    localStorage.setItem(RECENT_CODES_KEY, JSON.stringify(updated))
  } catch {}
}

type Props = {
  compact?: boolean
  className?: string
  onJoined?: () => void
  defaultTab?: 'player' | 'tv'
}

export default function QuickJoinCard({ compact = false, className = '', onJoined, defaultTab = 'player' }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [recentCodes, setRecentCodes] = useState<string[]>([])
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    setRecentCodes(getRecentCodes())
  }, [])

  function handleJoin(mode: 'buzzer' | 'tv', targetCode?: string) {
    const c = (targetCode || code).trim().toUpperCase()
    if (!c || c.length < 3) {
      setError('Sisesta vähemalt 3-kohaline kood')
      return
    }
    setError('')
    saveRecentCode(c)
    onJoined?.()
    if (mode === 'tv') {
      navigate(`/ekraan/${c}`)
    } else {
      navigate(`/buzzer/${c}`)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleJoin(defaultTab === 'tv' ? 'tv' : 'buzzer')
    }
  }

  return (
    <div
      className={`relative rounded-2xl bg-[#071324]/90 border border-gold/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_25px_rgba(223,179,66,0.08)] transition-all ${
        compact ? 'p-4' : 'p-5 sm:p-6 max-w-xl mx-auto'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
            {defaultTab === 'tv' ? <Tv className="text-gold" size={compact ? 16 : 18} /> : <Zap className="text-gold" size={compact ? 16 : 18} />}
          </div>
          <div>
            <h2 className="font-display font-bold text-gold text-base md:text-lg tracking-wide leading-tight">
              {defaultTab === 'tv' ? 'Ühenda suur ekraan (TV)' : 'Liitu mängu koodiga'}
            </h2>
          </div>
        </div>
        <span className="text-white/40 text-xs hidden sm:inline font-medium">
          {defaultTab === 'tv' ? 'Sisesta mängu kood' : 'Mängija pult või teler'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
              if (error) setError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="MÄNGU KOOD"
            maxLength={10}
            autoFocus={defaultTab === 'tv'}
            className="w-full bg-[#030a16]/80 border border-white/15 focus:border-gold/80 rounded-xl px-4 py-2.5 text-center font-mono font-black text-xl tracking-[0.2em] text-white uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-white/25 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 shadow-inner transition"
            aria-label="Mängu kood"
          />
        </div>

        <div className="flex gap-2">
          {defaultTab === 'tv' ? (
            <>
              <button
                type="button"
                onClick={() => handleJoin('tv')}
                className="btn-gold flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-sm !py-2.5 px-5 font-bold shadow-[0_4px_15px_rgba(223,179,66,0.3)] active:scale-95 transition"
                title="Ava teleriekraan"
              >
                <Tv size={16} />
                <span>Ava TV-ekraan</span>
              </button>
              <button
                type="button"
                onClick={() => handleJoin('buzzer')}
                className="btn-outline flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-sm !py-2.5 px-3 border-white/20 hover:border-gold/60 text-white/80 hover:text-gold active:scale-95 transition"
                title="Liitu mängijapuldina"
              >
                <Zap size={16} />
                <span>Mängija pult</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleJoin('buzzer')}
                className="btn-gold flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-sm !py-2.5 px-4 font-bold shadow-[0_4px_15px_rgba(223,179,66,0.3)] active:scale-95 transition"
                title="Liitu mängijapuldina"
              >
                <Zap size={16} />
                <span>Liitu mängijana</span>
              </button>
              <button
                type="button"
                onClick={() => handleJoin('tv')}
                className="btn-outline flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-sm !py-2.5 px-3 border-white/20 hover:border-gold/60 text-white/80 hover:text-gold active:scale-95 transition"
                title="Ava teleriekraan"
              >
                <Tv size={16} />
                <span>TV-ekraan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-accent-red text-xs mt-2 text-center sm:text-left">{error}</p>
      )}

      {recentCodes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
          <span className="inline-flex items-center gap-1 text-white/40 mr-1">
            <History size={12} /> Hiljutised:
          </span>
          {recentCodes.map((rc) => (
            <button
              key={rc}
              type="button"
              onClick={() => {
                setCode(rc)
                handleJoin(defaultTab === 'tv' ? 'tv' : 'buzzer', rc)
              }}
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-gold/20 hover:text-gold border border-white/10 font-mono text-xs transition"
            >
              {rc}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
