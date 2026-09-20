import { useState } from 'react'
import {
  DISPLAY_FONTS,
  type DisplayFontId,
  type KuldvillakSettings,
  getGameSettings,
  saveGameSettings,
} from '@/lib/gameSettings'
import { X, Tv, Clock, Volume2, Check, BookOpen, Brain, Sliders, RotateCcw } from 'lucide-react'
import { playFx } from '@/lib/audio'

type Props = {
  open: boolean
  onClose: () => void
  currentSettings?: Partial<KuldvillakSettings> | null
  currentFont?: string
  onSave: (settings: KuldvillakSettings) => void
}

export default function GameSettingsModal({
  open,
  onClose,
  currentSettings,
  currentFont,
  onSave,
}: Props) {
  const [settings, setSettings] = useState<KuldvillakSettings>(() => {
    const base = getGameSettings('kuldvillak')
    return {
      ...base,
      ...(currentSettings || {}),
      displayFont:
        (currentFont as DisplayFontId) ||
        currentSettings?.displayFont ||
        base.displayFont ||
        'cinzel',
    }
  })

  if (!open) return null

  function handleSave() {
    saveGameSettings('kuldvillak', settings)
    onSave(settings)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="card-panel max-w-xl w-full p-5 sm:p-6 border-gold/50 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg text-gold font-bold">Mängu ja ekraani seaded</h3>
            <p className="text-white/50 text-xs">Mõjutab mängujuhi vaadet ja sünkroniseeritud telerit (Display)</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* FONT SELECTOR */}
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold font-bold mb-2">
              <Tv size={14} />
              <span>Avaliku ekraani font:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISPLAY_FONTS.map((f) => {
                const isSel = settings.displayFont === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, displayFont: f.id }))}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSel
                        ? 'bg-gold/20 border-gold text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{f.name}</span>
                      {isSel && <Check size={12} className="text-gold" />}
                    </div>
                    <div
                      className="text-gold text-xs font-bold truncate mt-1"
                      style={{ fontFamily: f.cssFamily }}
                    >
                      500 PUNKTI
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* TIMER SETTINGS */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-accent-cyan font-bold">
              <Clock size={14} />
              <span>Küsimuse aja jaotused (Kahefaasiline taimer):</span>
            </div>

            {/* Reading Time */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <BookOpen size={13} />
                  <span>1. Lugemisaeg (ettelugemine enne mõtlemist):</span>
                </span>
                <span className="font-mono text-sm font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                  {settings.readingTimeSec}s
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={1}
                value={settings.readingTimeSec}
                onChange={(e) => setSettings((s) => ({ ...s, readingTimeSec: Number(e.target.value) }))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-white/40">
                <span>0s (Väljas)</span>
                <span>5s (Soovitatav)</span>
                <span>15s</span>
              </div>
            </div>

            {/* Thinking Time */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-accent-cyan font-bold flex items-center gap-1">
                  <Brain size={13} />
                  <span>2. Mõtlemisaeg (vastamise aeg):</span>
                </span>
                <span className="font-mono text-sm font-bold text-accent-cyan bg-accent-cyan/20 px-2 py-0.5 rounded">
                  {settings.thinkingTimeSec}s
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={settings.thinkingTimeSec}
                onChange={(e) => setSettings((s) => ({ ...s, thinkingTimeSec: Number(e.target.value) }))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-white/40">
                <span>10s</span>
                <span>25s (Klassikaline)</span>
                <span>60s</span>
              </div>
            </div>
          </div>

          {/* TOGGLES */}
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoTimer}
                onChange={(e) => setSettings((s) => ({ ...s, autoTimer: e.target.checked }))}
                className="rounded accent-gold w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-white">Käivita taimer automaatselt küsimuse avamisel</span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, soundEnabled: e.target.checked }))}
                className="rounded accent-gold w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-white">Heliefektid (üleminekud, tiksumine, buzzer)</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline text-xs !py-2 !px-3"
          >
            Loobu
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-gold text-xs !py-2 !px-4 font-bold shadow-gold"
          >
            Rakenda ja sünkroniseeri
          </button>
        </div>
      </div>
    </div>
  )
}
