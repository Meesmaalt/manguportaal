import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, Key } from 'lucide-react'
import { hasClientGeminiKey } from '@/lib/geminiClient'
import GeminiApiKeyModal from '@/components/GeminiApiKeyModal'

type Props = {
  title?: string
  placeholder?: string
  defaultPrompt?: string
  onGenerate: (topic: string) => Promise<void>
  disabled?: boolean
  presetTopics?: string[]
}

export default function AiGeneratorBar({
  title = 'Genereeri komplekt AI abil',
  placeholder = 'Sisesta teema (nt Eesti popmuusika, Filmiklassika, Teadus)...',
  defaultPrompt,
  onGenerate,
  disabled = false,
  presetTopics = [],
}: Props) {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [keyAvailable, setKeyAvailable] = useState(() => hasClientGeminiKey())

  async function handleRun(customTopic?: string) {
    const t = (customTopic ?? topic).trim()
    if (!t) return
    setLoading(true)
    setErr('')
    try {
      await onGenerate(t)
    } catch (e: any) {
      console.error(e)
      setErr(e?.message || 'AI genereerimine ebaõnnestus. Kontrolli Gemini API võtit.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyPrompt() {
    if (!defaultPrompt) return
    const formatted = defaultPrompt.replace('{TOPIC}', topic.trim() || 'Üldteadmised ja meelelahutus')
    navigator.clipboard.writeText(formatted)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="card-panel p-4 border-cyan-500/30 bg-gradient-to-r from-blue-950/40 to-slate-900/60 space-y-3 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-cyan-300 font-display text-sm font-semibold">
          <Sparkles size={16} className="text-cyan-400" />
          <span>{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {presetTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-white/40 mr-1">Kiirvalik:</span>
              {presetTopics.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => {
                    setTopic(pt)
                    handleRun(pt)
                  }}
                  disabled={loading || disabled}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-900/60 hover:text-white transition"
                >
                  {pt}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setKeyModalOpen(true)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
              keyAvailable
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-amber-500/40 bg-amber-950/50 text-amber-300 hover:bg-amber-900/60'
            }`}
            title="Halda tasuta Gemini API võtit"
          >
            <Key size={12} />
            <span>{keyAvailable ? 'API võti olemas' : 'Sisesta API võti'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder={placeholder}
          className="input-field text-xs flex-1"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading || disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleRun()
            }
          }}
        />

        <button
          type="button"
          onClick={() => handleRun()}
          disabled={loading || disabled || !topic.trim()}
          className="btn-gold text-xs flex items-center justify-center gap-1.5 px-4 shrink-0 shadow-md shadow-gold/10"
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Genereerin...
            </>
          ) : (
            <>
              <Sparkles size={13} /> Genereeri AI-ga
            </>
          )}
        </button>

        {defaultPrompt && (
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="btn-outline text-xs flex items-center justify-center gap-1.5 px-3 shrink-0"
            title="Kopeeri valmis prompt ChatGPT või Claude sisse kleepimiseks"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" /> Prompt kopeeritud!
              </>
            ) : (
              <>
                <Copy size={13} /> Kopeeri prompt
              </>
            )}
          </button>
        )}
      </div>

      {!keyAvailable && (
        <div className="text-[11px] text-amber-300/85 flex items-center gap-2">
          <span>💡 Soovid ühe-kliki genereerimist?</span>
          <button
            type="button"
            onClick={() => setKeyModalOpen(true)}
            className="text-accent-cyan underline hover:text-white font-medium"
          >
            Sisesta tasuta Google AI Studio võti siin
          </button>
        </div>
      )}

      {err && <p className="text-accent-red text-xs">{err}</p>}

      <GeminiApiKeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onSaved={() => setKeyAvailable(hasClientGeminiKey())}
      />
    </div>
  )
}
