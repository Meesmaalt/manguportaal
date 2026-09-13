import { useState, useEffect } from 'react'
import { Sparkles, Key, Check, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react'
import { getClientGeminiKey, setClientGeminiKey, hasClientGeminiKey } from '@/lib/geminiClient'

export default function AdminAiSettingsCard() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    const k = getClientGeminiKey()
    setApiKey(k)
    setHasKey(Boolean(k))
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setClientGeminiKey(apiKey.trim())
    setHasKey(Boolean(apiKey.trim()))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleClear() {
    setApiKey('')
    setClientGeminiKey('')
    setHasKey(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="card-panel p-5 border-gold/40 bg-slate-900/60 mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg text-gold flex items-center gap-2">
              Google Gemini AI seaded
              {hasKey && (
                <span className="text-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-sans px-2 py-0.5 rounded-full">
                  Aktiivne
                </span>
              )}
            </h3>
            <p className="text-white/60 text-xs">
              Võimaldab mängude sisu (Miljonär, Blitz, Kuldvillak, Rooside Sõda, Alias jne) automaatse genereerimise otse lehelt kasutades Gemini 3.6 Flash mudelit.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3 pt-1">
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
            <Key size={14} className="text-gold" /> Gemini API võti (Google AI Studio)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              className="input-field font-mono text-sm flex-1"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              type="submit"
              className="btn-gold text-xs px-5 py-2 flex items-center justify-center gap-1.5 shrink-0"
            >
              <Check size={14} /> Salvesta võti
            </button>
            {hasKey && (
              <button
                type="button"
                onClick={handleClear}
                className="btn-outline text-xs px-3 py-2 border-accent-red/40 text-accent-red hover:bg-accent-red/10 flex items-center justify-center gap-1.5 shrink-0"
                title="Kustuta võti"
              >
                <Trash2 size={14} /> Eemalda
              </button>
            )}
          </div>
        </div>

        <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-3 text-xs text-blue-200/80 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-blue-300">
            <ShieldCheck size={14} /> Tasuta API võtme hankimine:
          </div>
          <p>
            Võtme saab tasuta Google AI Studiost:{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-gold underline inline-flex items-center gap-0.5"
            >
              aistudio.google.com/app/apikey <ExternalLink size={11} />
            </a>
          </p>
          <p className="text-[11px] text-white/40">
            * Kui admin on võtme siia salvestanud, toimib AI genereerimine kõigile selle brauseri kasutajatele või seadistatud keskkonnas.
          </p>
        </div>

        {saved && (
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <Check size={14} /> Gemini seaded edukalt salvestatud!
          </div>
        )}
      </form>
    </div>
  )
}
