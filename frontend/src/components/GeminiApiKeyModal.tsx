import { useState } from 'react'
import { Key, ExternalLink, Check, AlertCircle, Trash2 } from 'lucide-react'
import { getClientGeminiKey, setClientGeminiKey } from '@/lib/geminiClient'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export default function GeminiApiKeyModal({ isOpen, onClose, onSaved }: Props) {
  const [keyInput, setKeyInput] = useState(() => getClientGeminiKey())
  const [savedMessage, setSavedMessage] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  if (!isOpen) return null

  function handleSave() {
    setClientGeminiKey(keyInput.trim())
    setSavedMessage(true)
    setTestResult(null)
    onSaved?.()
    setTimeout(() => {
      setSavedMessage(false)
      onClose()
    }, 1200)
  }

  function handleClear() {
    setClientGeminiKey('')
    setKeyInput('')
    setTestResult({ success: true, message: 'API võti eemaldatud.' })
    onSaved?.()
  }

  async function handleTest() {
    const key = keyInput.trim()
    if (!key) {
      setTestResult({ success: false, message: 'Sisesta enne testimist võti.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(key)}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "OK"' }] }],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Viga (${res.status})`)
      }

      setTestResult({ success: true, message: 'API võti on kehtiv ja töötab suurepäraselt! 🎉' })
    } catch (e: any) {
      setTestResult({ success: false, message: `Test ebaõnnestus: ${e?.message || 'Kontrolli võtit'}` })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="card-panel max-w-lg w-full p-6 bg-[#08112c] border-gold/60 shadow-2xl relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 text-gold font-display font-bold text-lg">
            <Key size={20} />
            <span>Gemini API võti</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-white/75 leading-relaxed">
          AI abil mängude sisu genereerimiseks saab igaüks kasutada oma <strong>tasuta</strong> Google AI Studio API võtit. Võti salvestatakse ainult Sinu brauseri mällu (localStorage).
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 block">
            Google AI Studio API võti:
          </label>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="input-field text-sm font-mono tracking-wider"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-cyan hover:underline flex items-center gap-1 font-medium"
          >
            Hangi tasuta API võti (Google AI Studio)
            <ExternalLink size={12} />
          </a>

          {keyInput.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="text-accent-red/80 hover:text-accent-red flex items-center gap-1 text-[11px]"
            >
              <Trash2 size={11} /> Eemalda võti
            </button>
          )}
        </div>

        {testResult && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/60 border border-red-500/40 text-red-200'
            }`}
          >
            {testResult.success ? <Check size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !keyInput.trim()}
            className="btn-outline text-xs !py-2 !px-3"
          >
            {testing ? 'Kontrollin...' : 'Testi võtit'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-gold text-xs !py-2 !px-4 flex items-center gap-1.5"
          >
            {savedMessage ? (
              <>
                <Check size={14} /> Salvestatud!
              </>
            ) : (
              'Salvesta'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
