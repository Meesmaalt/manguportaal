import { useState, useEffect } from 'react'
import { Sparkles, Key, Check, ExternalLink, ShieldCheck, Trash2, RefreshCw, Cpu, AlertCircle } from 'lucide-react'
import { appUrl } from '@/lib/config'

type FetchedModel = {
  name: string
  displayName?: string
  description?: string
  supportedActions?: string[]
}

export default function AdminAiSettingsCard() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [saved, setSaved] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  const [availableModels, setAvailableModels] = useState<FetchedModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelError, setModelError] = useState('')

  useEffect(() => {
    fetch(appUrl('/api/ai/key'))
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          if (data.key) {
            setApiKey(data.key)
            setHasKey(true)
          }
          if (data.model) {
            setModel(data.model)
          }
        }
      })
      .catch(() => {})
  }, [])

  async function fetchModels() {
    setLoadingModels(true)
    setModelError('')
    try {
      const res = await fetch(appUrl('/api/ai/models'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey.trim() || undefined })
      })
      const data = await res.json()
      if (!data.ok) {
        throw new Error(data.error || 'Mudelite pärimine ebaõnnestus')
      }
      setAvailableModels(data.models || [])
    } catch (err: any) {
      setModelError(err.message || 'Mudelite pärimine ebaõnnestus')
    } finally {
      setLoadingModels(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const val = apiKey.trim()
    try {
      await fetch(appUrl('/api/ai/key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: val, model })
      })
      setHasKey(Boolean(val))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
  }

  async function handleClear() {
    try {
      await fetch(appUrl('/api/ai/key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: '', model: 'gemini-2.5-flash' })
      })
      setApiKey('')
      setHasKey(false)
      setAvailableModels([])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
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
              Võimaldab mängude sisu (Miljonär, Blitz, Kuldvillak, Rooside Sõda, Alias jne) automaatse genereerimise ja tõlkimise otse lehelt.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 pt-1">
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

        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <Cpu size={14} className="text-gold" /> Valitud Gemini Mudel
            </label>
            <button
              type="button"
              onClick={fetchModels}
              disabled={loadingModels || (!apiKey && !hasKey)}
              className="text-xs text-gold/90 hover:text-gold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold/10 hover:bg-gold/20 border border-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Päri Google API-st sinu võtmega ligipääsetavad mudelid"
            >
              <RefreshCw size={12} className={loadingModels ? 'animate-spin text-gold' : ''} />
              {loadingModels ? 'Laadin nimekirja...' : 'Päri mudelid API-st'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            {availableModels.length > 0 ? (
              <select
                className="input-field text-sm flex-1 font-mono"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.displayName && m.displayName !== m.name ? `(${m.displayName})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                list="gemini-models"
                className="input-field text-sm flex-1 font-mono"
                value={model}
                placeholder="nt. gemini-2.5-flash"
                onChange={(e) => setModel(e.target.value)}
              />
            )}

            <datalist id="gemini-models">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Kiire ja stabiilne)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Võimekas)</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Uusim)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Kerge ja kiire)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest</option>
            </datalist>
          </div>

          {modelError && (
            <div className="mt-2 p-2 rounded-lg bg-accent-red/20 border border-accent-red/40 text-accent-red text-xs flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" />
              <span>{modelError}</span>
            </div>
          )}

          {availableModels.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] text-white/50 mb-1.5">
                API tagastas {availableModels.length} mudelit. Klõpsa kiireks valikuks:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-black/20 rounded-lg border border-white/5">
                {availableModels.map((m) => {
                  const isSelected = model === m.name
                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setModel(m.name)}
                      className={`text-[11px] px-2 py-0.5 rounded font-mono transition border ${
                        isSelected
                          ? 'bg-gold/25 border-gold text-gold font-bold shadow-sm'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {m.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
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

