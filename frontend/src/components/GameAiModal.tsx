import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, ArrowRight, X } from 'lucide-react'

type Props<T = any> = {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  presetTopics?: string[]
  defaultTopic?: string
  promptTemplate?: string
  generateFn?: (topic: string) => Promise<T>
  onApply?: (data: T) => void
  renderPreview?: (data: T) => React.ReactNode
  onGenerate?: (topic: string, count: number, difficulty: string) => Promise<void>
  gameType?: 'kuldvillak' | 'miljonar' | 'roosid' | 'blitz' | 'alias'
}

export default function GameAiModal<T = any>({
  isOpen,
  onClose,
  title = 'AI Genereerimine',
  subtitle = 'Sisesta teema või märksõnad uue mängu sisu loomiseks',
  presetTopics = [],
  defaultTopic = '',
  promptTemplate,
  generateFn,
  onApply,
  renderPreview,
  onGenerate,
}: Props<T>) {
  const [topic, setTopic] = useState(defaultTopic)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedData, setGeneratedData] = useState<T | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  if (!isOpen) return null

  function handleClose() {
    setGeneratedData(null)
    setError('')
    onClose()
  }

  async function handleRun(customTopic?: string) {
    const t = (customTopic !== undefined ? customTopic : topic).trim()
    if (!t) return
    setLoading(true)
    setError('')
    try {
      if (generateFn) {
        const res = await generateFn(t)
        setGeneratedData(res)
      } else if (onGenerate) {
        await onGenerate(t, 15, 'medium')
        handleClose()
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'AI genereerimine ebaõnnestus. Kontrolli Gemini API seadistust.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyPrompt() {
    const promptText = promptTemplate
      ? promptTemplate.replace('{TOPIC}', topic.trim() || 'Eesti popkultuur')
      : `Loo mäng teemal: ${topic.trim() || 'Eesti popkultuur'}`
    navigator.clipboard.writeText(promptText)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  function handleApply() {
    if (generatedData && onApply) {
      onApply(generatedData)
      handleClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="card-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 bg-[#08112c] border-cyan-500/30 shadow-2xl relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 text-cyan-300 font-display font-bold text-lg">
            <Sparkles size={20} className="text-cyan-400" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {subtitle && <p className="text-xs text-white/60 -mt-2">{subtitle}</p>}

        {presetTopics.length > 0 && !generatedData && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
              Kiirvalikud:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presetTopics.map((pt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTopic(pt)
                    handleRun(pt)
                  }}
                  disabled={loading}
                  className="btn-outline text-xs !py-1 !px-2.5 hover:border-cyan-400 hover:text-cyan-300"
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>
        )}

        {!generatedData ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleRun()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Teema või märksõnad</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="nt 90ndate eesti muusika, kosmos, geograafia..."
                  className="input-field text-sm flex-1"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !topic.trim()}
                  className="btn-gold text-xs px-5 py-2.5 flex items-center gap-2 font-semibold shadow-lg shadow-gold/20 shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Genereerin...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Genereeri
                    </>
                  )}
                </button>
              </div>
            </div>

            {promptTemplate && (
              <div className="pt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="text-white/50 hover:text-cyan-300 flex items-center gap-1.5 transition"
                >
                  {copiedPrompt ? (
                    <>
                      <Check size={13} className="text-emerald-400" /> Kopeeritud lõikelauale!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Kopeeri prompt ChatGPT / teise AI jaoks
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="text-accent-red text-xs p-3 rounded-xl bg-accent-red/10 border border-accent-red/30">
                {error}
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                <Check size={16} /> Uus mängu sisu on edukalt genereeritud!
              </span>
              <button
                type="button"
                onClick={() => setGeneratedData(null)}
                className="text-xs text-white/50 hover:text-white underline"
              >
                Genereeri uuesti
              </button>
            </div>

            {renderPreview ? (
              <div className="max-h-[50vh] overflow-y-auto pr-1">{renderPreview(generatedData)}</div>
            ) : (
              <pre className="p-3 bg-black/40 rounded-xl text-xs text-white/70 overflow-x-auto max-h-60">
                {JSON.stringify(generatedData, null, 2)}
              </pre>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setGeneratedData(null)}
                className="btn-outline text-xs !py-2 !px-4"
              >
                Tagasi
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="btn-gold text-xs !py-2 !px-6 flex items-center gap-2 font-bold shadow-lg shadow-gold/20"
              >
                <span>Võta mängus kasutusse</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
