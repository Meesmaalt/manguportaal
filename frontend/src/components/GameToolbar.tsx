import { Volume2, RotateCcw } from 'lucide-react'
import { useFontScale } from '@/hooks/useFontScale'
import { getMasterVolume, setMasterVolume } from '@/lib/audio'
import { useState } from 'react'

type Props = {
  onReset?: () => void
  extra?: React.ReactNode
}

export default function GameToolbar({ onReset, extra }: Props) {
  const { smaller, reset, larger, fontScale } = useFontScale()
  const [vol, setVol] = useState(() => getMasterVolume())

  function onVol(v: number) {
    setVol(v)
    setMasterVolume(v)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
      <div className="flex items-center gap-1 bg-bg-card border border-gold/40 rounded-full px-2 py-1">
        <span className="text-gold text-xs px-1">Tekst {Math.round(fontScale * 100)}%</span>
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
          title="Helitugevus (kuni 200%)"
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
          Taasta algseis
        </button>
      )}

      {extra}
    </div>
  )
}
