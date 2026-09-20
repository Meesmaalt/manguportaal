import { useState, useEffect } from 'react'
import {
  getGameSettings,
  saveGameSettings,
  DISPLAY_FONTS,
  DEFAULT_KULDVILLAK_SETTINGS,
  type DisplayFontId,
  type KuldvillakSettings,
} from '@/lib/gameSettings'
import { playFx } from '@/lib/audio'
import {
  Type,
  Clock,
  Volume2,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  BookOpen,
  Brain,
  Sliders,
  Tv,
  Play,
  Pause,
} from 'lucide-react'

export default function AdminGameSettings() {
  const [gameType, setGameType] = useState<'kuldvillak' | 'roosidesoda' | 'blitz' | 'miljonar'>('kuldvillak')
  const [settings, setSettings] = useState<KuldvillakSettings>(() => getGameSettings('kuldvillak'))
  const [savedMsg, setSavedMsg] = useState('')

  // Simulator state for testing the dual bar in admin panel
  const [simActive, setSimActive] = useState(false)
  const [simPhase, setSimPhase] = useState<'reading' | 'thinking'>('reading')
  const [simRemaining, setSimRemaining] = useState(5)
  const [simTotal, setSimTotal] = useState(5)

  useEffect(() => {
    setSettings(getGameSettings(gameType))
  }, [gameType])

  // Simulator interval
  useEffect(() => {
    if (!simActive) return
    const id = setInterval(() => {
      setSimRemaining((prev) => {
        if (prev <= 1) {
          if (simPhase === 'reading') {
            if (settings.soundEnabled) playFx('ding')
            setSimPhase('thinking')
            setSimTotal(settings.thinkingTimeSec || 15)
            return settings.thinkingTimeSec || 15
          } else {
            if (settings.soundEnabled) playFx('buzz')
            setSimActive(false)
            return 0
          }
        }
        const next = prev - 1
        if (simPhase === 'thinking' && next <= 5 && next > 0 && settings.soundEnabled) {
          playFx('tick')
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [simActive, simPhase, settings])

  function handleSave() {
    saveGameSettings(gameType, settings)
    setSavedMsg('✓ Seaded salvestatud edukalt!')
    setTimeout(() => setSavedMsg(''), 3500)
  }

  function handleReset() {
    if (confirm('Kas taastada vaikesätted?')) {
      setSettings(DEFAULT_KULDVILLAK_SETTINGS)
      saveGameSettings(gameType, DEFAULT_KULDVILLAK_SETTINGS)
      setSavedMsg('✓ Vaikesätted taastatud!')
      setTimeout(() => setSavedMsg(''), 3000)
    }
  }

  function startSim() {
    setSimPhase('reading')
    const readSec = settings.readingTimeSec || 5
    setSimRemaining(readSec)
    setSimTotal(readSec)
    setSimActive(true)
    if (settings.soundEnabled) playFx('reveal')
  }

  function stopSim() {
    setSimActive(false)
  }

  return (
    <div className="space-y-6">
      {/* Game Selector Header */}
      <div className="card-panel p-5 bg-gradient-to-r from-bg-card via-amber-950/20 to-bg-card border-gold/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 shadow-lg shadow-gold/10">
              <Sliders className="text-gold" size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl text-gold font-bold flex items-center gap-2">
                <span>Mängu seaded ja avaliku ekraani kohandamine</span>
              </h2>
              <p className="text-white/60 text-xs mt-0.5">
                Määra küsimuse lugemis- ja mõtlemisajad, avaliku ekraani font ning heliefektid.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="btn-outline text-xs !py-2 !px-3 flex items-center gap-1.5 text-white/60 hover:text-white"
              title="Taasta vaikimisi väärtused"
            >
              <RotateCcw size={13} />
              <span>Taasta algseaded</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-gold text-xs !py-2 !px-4 flex items-center gap-1.5 shadow-gold font-bold"
            >
              <Save size={13} />
              <span>Salvesta seaded</span>
            </button>
          </div>
        </div>

        {savedMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-accent-green/20 border border-accent-green/40 text-accent-green text-xs font-bold animate-in fade-in">
            {savedMsg}
          </div>
        )}

        {/* Game selection chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
          {[
            { id: 'kuldvillak', name: 'Kuldvillak', emoji: '🏆' },
            { id: 'roosidesoda', name: 'Rooside Sõda', emoji: '🌹' },
            { id: 'blitz', name: 'Blitz', emoji: '⚡' },
            { id: 'miljonar', name: 'Miljonär', emoji: '💰' },
          ].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGameType(g.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                gameType === g.id
                  ? 'bg-gold text-bg border-gold shadow-md'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{g.emoji}</span>
              <span>{g.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: PUBLIC DISPLAY FONT */}
      <div className="card-panel p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-gold font-display text-base font-bold">
            <Tv size={18} />
            <Type size={18} />
            <span>Avaliku ekraani (TV) font</span>
          </div>
          <span className="text-xs text-white/40">Määrab suure ekraani ja mängulaua pealkirjade stiili</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DISPLAY_FONTS.map((font) => {
            const isSelected = settings.displayFont === font.id
            return (
              <div
                key={font.id}
                onClick={() => setSettings((s) => ({ ...s, displayFont: font.id }))}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gold/15 border-gold shadow-[0_0_20px_rgba(223,179,66,0.3)]'
                    : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold text-black flex items-center justify-center font-bold">
                    <Check size={13} />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-sm text-white">{font.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white/60">
                      {font.category}
                    </span>
                  </div>
                  <p className="text-white/50 text-xs mb-3 leading-relaxed">{font.description}</p>
                </div>

                {/* Live Font Sample */}
                <div
                  className="p-3 rounded-xl bg-black/40 border border-white/10 text-center"
                  style={{ fontFamily: font.cssFamily }}
                >
                  <div className="text-gold text-base sm:text-lg font-bold truncate">
                    {font.previewText}
                  </div>
                  <div className="text-white/80 text-xs mt-1 truncate">
                    Õige vastus toob 500p!
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: TWO-PHASE QUESTION TIMER */}
      <div className="card-panel p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-gold font-display text-base font-bold">
            <Clock size={18} />
            <span>Küsimuse aja ja taimeri joon (Kahefaasiline)</span>
          </div>
          <span className="text-xs text-white/40">1. Lugemine ➔ 2. Mõtlemine</span>
        </div>

        {/* Visual sequence flow diagram */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-accent-cyan/10 to-emerald-500/10 border border-white/15">
          <div className="text-xs uppercase tracking-wider text-white/60 font-bold mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-gold" />
            <span>Küsimuse ajaskaala skeem:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="text-amber-300 font-bold text-xs uppercase tracking-wider">
                  Faas 1: Lugemisaeg ({settings.readingTimeSec}s)
                </div>
                <div className="text-white/70 text-xs">
                  Eraldi riba küsimuse ettelugemiseks. Mängujuht tutvustab küsimust.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400 text-black flex items-center justify-center font-bold shrink-0">
                <Brain size={20} />
              </div>
              <div>
                <div className="text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  Faas 2: Mõtlemisaeg ({settings.thinkingTimeSec}s)
                </div>
                <div className="text-white/70 text-xs">
                  Automaatne üleminek helisignaaliga. Meeskonnad arutavad ja vajutavad nuppe.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timer Duration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Phase 1: Reading Time Slider */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <BookOpen size={16} />
                <span>1. Küsimuse lugemisaeg:</span>
              </label>
              <span className="font-mono text-xl font-bold text-amber-300 bg-amber-500/20 px-3 py-0.5 rounded-lg border border-amber-500/30">
                {settings.readingTimeSec}s
              </span>
            </div>

            <p className="text-white/50 text-xs">
              Aeg, mille jooksul juht loeb küsimuse ette enne mõtlemise algust.
            </p>

            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={settings.readingTimeSec}
              onChange={(e) => setSettings((s) => ({ ...s, readingTimeSec: Number(e.target.value) }))}
              className="w-full accent-amber-400 cursor-pointer"
            />

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[0, 3, 5, 8, 10].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, readingTimeSec: sec }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    settings.readingTimeSec === sec
                      ? 'bg-amber-400 text-black shadow'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {sec === 0 ? 'Väljas (0s)' : `${sec}s${sec === 5 ? ' ★' : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Phase 2: Thinking Time Slider */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-accent-cyan flex items-center gap-1.5">
                <Brain size={16} />
                <span>2. Küsimuse mõtlemisaeg:</span>
              </label>
              <span className="font-mono text-xl font-bold text-accent-cyan bg-accent-cyan/20 px-3 py-0.5 rounded-lg border border-accent-cyan/30">
                {settings.thinkingTimeSec}s
              </span>
            </div>

            <p className="text-white/50 text-xs">
              Mõtlemise ja vastamise aeg pärast ettelugemist.
            </p>

            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={settings.thinkingTimeSec}
              onChange={(e) => setSettings((s) => ({ ...s, thinkingTimeSec: Number(e.target.value) }))}
              className="w-full accent-accent-cyan cursor-pointer"
            />

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[15, 20, 25, 30, 45].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, thinkingTimeSec: sec }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    settings.thinkingTimeSec === sec
                      ? 'bg-accent-cyan text-black shadow'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {sec}s{sec === 25 ? ' ★' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
            <input
              type="checkbox"
              checked={settings.autoTimer}
              onChange={(e) => setSettings((s) => ({ ...s, autoTimer: e.target.checked }))}
              className="w-5 h-5 rounded accent-gold cursor-pointer"
            />
            <div>
              <div className="text-sm font-bold text-white">Automaatne taimer</div>
              <div className="text-xs text-white/50">Käivita taimer kohe küsimuse kaardi avamisel</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => setSettings((s) => ({ ...s, soundEnabled: e.target.checked }))}
              className="w-5 h-5 rounded accent-gold cursor-pointer"
            />
            <div>
              <div className="text-sm font-bold text-white">Taimeri heliefektid</div>
              <div className="text-xs text-white/50">Märguanded faaside vahetusel, tiksumine ja buzzer</div>
            </div>
          </label>
        </div>
      </div>

      {/* SECTION 3: SOUND EFFECTS TEST & PREVIEW */}
      <div className="card-panel p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-gold font-display text-base font-bold">
            <Volume2 size={18} />
            <span>Taimeri heliefektide eelkuulamine</span>
          </div>
          <span className="text-xs text-white/40">Klõpsa helide testimiseks</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => playFx('reveal')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition flex flex-col justify-between gap-2 group"
          >
            <div className="text-xs text-white/50 group-hover:text-gold transition">1. Avamise heli</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-gold" />
              <span>Avang (reveal)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => playFx('ding')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition flex flex-col justify-between gap-2 group"
          >
            <div className="text-xs text-white/50 group-hover:text-accent-cyan transition">2. Mõtlemise algus</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Volume2 size={14} className="text-accent-cyan" />
              <span>Kell (ding)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => playFx('tick')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition flex flex-col justify-between gap-2 group"
          >
            <div className="text-xs text-white/50 group-hover:text-amber-400 transition">3. Viimased 5 sekundit</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400" />
              <span>Tiksumine (tick)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => playFx('buzz')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition flex flex-col justify-between gap-2 group"
          >
            <div className="text-xs text-white/50 group-hover:text-red-400 transition">4. Aeg läbi</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Volume2 size={14} className="text-red-400" />
              <span>Buzzer (buzz)</span>
            </div>
          </button>
        </div>

        {/* Live Interactive Simulator Bar */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-gold font-bold">
              Interaktiivne taimeririba simulaator:
            </div>
            <button
              type="button"
              onClick={simActive ? stopSim : startSim}
              className={`btn-outline text-xs !py-1 !px-3 flex items-center gap-1.5 ${
                simActive ? 'border-accent-red text-accent-red' : 'border-gold text-gold'
              }`}
            >
              {simActive ? <Pause size={12} /> : <Play size={12} />}
              <span>{simActive ? 'Peata simulatsioon' : 'Testi täistsüklit'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black/50 border border-white/15 space-y-3">
            {/* Phase 1 Indicator */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <BookOpen size={13} />
                  <span>1. Lugemisaeg: {simPhase === 'reading' ? `${simRemaining}s` : '✓ Läbitud'}</span>
                </span>
                <span className="text-white/40 text-[11px]">
                  {simPhase === 'reading' ? 'Juht loeb küsimust' : 'Valmis'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                  style={{
                    width:
                      simPhase === 'reading'
                        ? `${(simRemaining / simTotal) * 100}%`
                        : '100%',
                  }}
                />
              </div>
            </div>

            {/* Phase 2 Indicator */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-accent-cyan font-bold flex items-center gap-1">
                  <Brain size={13} />
                  <span>2. Mõtlemisaeg: {simPhase === 'thinking' ? `${simRemaining}s` : 'Ootel'}</span>
                </span>
                <span className="text-white/40 text-[11px]">
                  {simPhase === 'thinking' ? 'Mõtlemine käib' : 'Ootab lugemist'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    simPhase === 'thinking' && simRemaining <= 5
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-gradient-to-r from-accent-cyan to-emerald-400'
                  }`}
                  style={{
                    width:
                      simPhase === 'thinking'
                        ? `${(simRemaining / simTotal) * 100}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
