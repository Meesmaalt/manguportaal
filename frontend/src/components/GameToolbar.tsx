import { Volume2, RotateCcw, PartyPopper, Frown, Drum, Sparkles, Maximize, Minimize } from 'lucide-react'
import { useFontScale } from '@/hooks/useFontScale'
import { getMasterVolume, setMasterVolume } from '@/lib/audio'
import { useI18n } from '@/i18n/I18nContext'
import { useState, type ReactNode, useEffect } from 'react'
import { playFx } from '@/lib/audio'

type Props = {
  onReset?: () => void
  extra?: ReactNode
}

export default function GameToolbar({ onReset, extra }: Props) {
  const { smaller, reset, larger, fontScale } = useFontScale()
  const [vol, setVol] = useState(() => getMasterVolume())
  const { t } = useI18n()
  const [activeFx, setActiveFx] = useState<string | null>(null)

  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    } catch {}
  }

  function triggerSound(fxName: 'applause' | 'sad_trombone' | 'drumroll' | 'jingle') {
    setActiveFx(fxName)
    playFx(fxName)
    setTimeout(() => setActiveFx(null), 800)
  }

  function onVol(v: number) {
    setVol(v)
    setMasterVolume(v)
  }

  return (
    <div className="flex flex-col items-center gap-3 mb-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-1 bg-bg-card border border-gold/40 rounded-full px-2 py-1">
          <span className="text-gold text-xs px-1">
            {t('toolbarText')} {Math.round(fontScale * 100)}%
          </span>
          <button type="button" className="text-gold font-bold px-2 py-0.5 rounded-full hover:bg-gold hover:text-bg text-sm" onClick={smaller}>
            A−
          </button>
          <button type="button" className="text-gold font-bold px-2 py-0.5 rounded-full hover:bg-gold hover:text-bg text-sm" onClick={reset}>
            A
          </button>
          <button type="button" className="text-gold font-bold px-2 py-0.5 rounded-full hover:bg-gold hover:text-bg text-sm" onClick={larger}>
            A+
          </button>
        </div>

        <div className="flex items-center gap-2 bg-bg-card border border-gold/40 rounded-full px-3 py-1 min-w-[160px]">
          <Volume2 size={14} className="text-gold shrink-0" />
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={vol}
            onChange={(e) => onVol(Number(e.target.value))}
            className="w-full accent-[#dfb342] h-1.5"
          />
          <span className="text-gold text-xs tabular-nums w-10 text-right">{Math.round(vol * 100)}%</span>
        </div>
        
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 border-accent-red/60 text-accent-red"
          >
            <RotateCcw size={14} />
            {t('toolbarReset')}
          </button>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5"
          title="Täisekraan"
        >
          {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          {fullscreen ? 'Välju' : 'Täisekraan'}
        </button>

        {extra}
      </div>

      {/* Host Soundboard */}
      <div className="flex items-center gap-2 bg-bg-card border border-gold/20 rounded-full px-3 py-1.5 shadow-lg">
        <span className="text-gold/50 text-[10px] uppercase tracking-widest mr-1 font-bold">Helipult</span>
        <button
          type="button"
          onClick={() => triggerSound('applause')}
          className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${activeFx === 'applause' ? 'bg-gold text-bg scale-110' : 'text-white/70 hover:text-gold hover:bg-gold/10'}`}
          title="Aplaus"
        >
          <PartyPopper size={16} />
        </button>
        <button
          type="button"
          onClick={() => triggerSound('sad_trombone')}
          className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${activeFx === 'sad_trombone' ? 'bg-accent-red text-white scale-110' : 'text-white/70 hover:text-accent-red hover:bg-accent-red/10'}`}
          title="Sad Trombone"
        >
          <Frown size={16} />
        </button>
        <button
          type="button"
          onClick={() => triggerSound('drumroll')}
          className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${activeFx === 'drumroll' ? 'bg-amber-400 text-bg scale-110' : 'text-white/70 hover:text-amber-400 hover:bg-amber-400/10'}`}
          title="Trummipõrin"
        >
          <Drum size={16} />
        </button>
        <button
          type="button"
          onClick={() => triggerSound('jingle')}
          className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${activeFx === 'jingle' ? 'bg-emerald-400 text-bg scale-110' : 'text-white/70 hover:text-emerald-400 hover:bg-emerald-400/10'}`}
          title="Õige / Fanfaar"
        >
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  )
}
