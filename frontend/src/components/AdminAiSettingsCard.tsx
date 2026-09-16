import { useState, useEffect } from 'react'
import { Sparkles, Key, Check, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react'
import { appUrl } from '@/lib/config'

export default function AdminAiSettingsCard() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [saved, setSaved] = useState(false)
  const [hasKey, setHasKey] = useState(false)

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
              Võimaldab mängude sisu (Miljonär, Blitz, Kuldvillak, Rooside Sõda, Alias jne) automaatse genereerimise otse lehelt kasutades Gemini AI mudelit.
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
        <div className="mt-4">
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            Gemini Mudel
          </label>
          <input
            type="text"
            list="gemini-models"
            className="input-field text-sm w-full sm:w-64"
            value={model}
            placeholder="nt. gemini-3.7-flash"
            onChange={(e) => setModel(e.target.value)}
          />
          <datalist id="gemini-models">
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Kiire ja stabiilne)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Võimekas)</option>
            <option value="gemini-3.8-flash">Gemini 3.8 Flash (Uusim)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Kerge ja kiire)</option>
            <option value="gemini-flash-latest">Gemini Flash Latest</option>
          </datalist>
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
