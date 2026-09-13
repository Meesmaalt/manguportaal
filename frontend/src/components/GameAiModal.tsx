import { useState } from 'react'
import { Sparkles, Loader2, Play, Check, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { hasClientGeminiKey } from '@/lib/geminiClient'

type Props<T> = {
  isOpen: boolean
  onClose: () => void
  onApply: (data: T) => void
  title: string
  subtitle?: string
  defaultTopic?: string
  presetTopics?: string[]
  generateFn: (topic: string) => Promise<T>
  renderPreview: (data: T) => React.ReactNode
  promptTemplate?: string
}

export default function GameAiModal<T>({
  isOpen,
  onClose,
  onApply,
  title,
  subtitle,
  defaultTopic = '',
  presetTopics = [],
  generateFn,
  renderPreview,
  promptTemplate,
}: Props<T>) {
  const [topic, setTopic] = useState(defaultTopic)
  const [loading, setLoading] = useState(false)
  const [generatedData, setGeneratedData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const hasKey = hasClientGeminiKey()

  if (!isOpen) return null

  async function handleGenerate(customTopic?: string) {
    const t = (customTopic ?? topic).trim()
    if (!t) return
    setLoading(true)
    setError('')
    try {
      const data = await generateFn(t)
      setGeneratedData(data)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'AI genereerimine ebaõnnestus. Kontrolli Gemini API võtit admin lehelt.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyPrompt() {
    if (!promptTemplate) return
    const formatted = promptTemplate.replace('{TOPIC}', topic.trim() || 'Üldteadmised ja meelelahutus')
    navigator.clipboard.writeText(formatted)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="card-panel border-gold/60 bg-[#08102b] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-blue-950/80 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/20 text-gold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white">{title}</h3>
              {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Input & Topics Section */}
        <div className="p-4 border-b border-white/10 bg-slate-950/60 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Sisesta teema (nt Eesti popmuusika, Filmiklassika, Teadus, Sünnipäev)..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
              className="input-field text-sm flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={loading || !topic.trim()}
              className="btn-gold text-xs flex items-center justify-center gap-1.5 px-5 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Genereerin...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Genereeri AI-ga
                </>
              )}
            </button>
            {promptTemplate && (
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="btn-outline text-xs flex items-center justify-center gap-1.5 px-3 shrink-0"
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

          {presetTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-white/40 mr-1">Populaarsed teemad:</span>
              {presetTopics.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => {
                    setTopic(pt)
                    handleGenerate(pt)
                  }}
                  disabled={loading}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-900/60 hover:text-white transition"
                >
                  {pt}
                </button>
              ))}
            </div>
          )}

          {!hasKey && (
            <p className="text-[11px] text-amber-300/80">
              💡 Vihje: Kui soovid kohest ühe-kliki genereerimist, sisesta tasuta Gemini API võti <strong>Admin</strong> lehelt.
            </p>
          )}

          {error && <p className="text-accent-red text-xs">{error}</p>}
        </div>

        {/* Preview / Results Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-950/40">
          {generatedData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} /> Eelvaade – kontrolli andmeid enne mängu laadimist:
                </span>
              </div>
              {renderPreview(generatedData)}
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center text-white/40 space-y-2">
              <Sparkles size={32} className="text-gold/40 animate-pulse" />
              <p className="text-sm">Sisesta teema ja vajuta "Genereeri AI-ga", et näha sisu eelvaadet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-outline text-xs px-4">
            Sulge
          </button>

          {generatedData && (
            <button
              type="button"
              onClick={() => {
                onApply(generatedData)
                onClose()
              }}
              className="btn-gold text-xs font-bold flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-gold/20"
            >
              <Play size={14} className="fill-current" /> Rakenda see komplekt mängu
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
