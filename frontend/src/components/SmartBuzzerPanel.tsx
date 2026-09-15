import { useState } from 'react'
import { MessageSquare, Zap, Eye, Trash2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

type Props = {
  state: any
  update: (p: any) => void
}

export default function SmartBuzzerPanel({ state, update }: Props) {
  const { inputMode = 'buzz', playerInputs = {}, buzz } = state
  const [showAnswers, setShowAnswers] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const inputsList = Object.values(playerInputs || {}) as { name: string; value: string; at: number }[]
  inputsList.sort((a, b) => a.at - b.at)

  function clear() {
    update({ buzz: null, playerInputs: {} })
    setShowAnswers(false)
  }

  function resetBuzzOnly() {
    update({ buzz: null, buzzEnabled: true })
  }

  if (collapsed) {
    return (
      <div className="bg-bg-card/90 backdrop-blur-md border border-gold/30 rounded-xl px-3 py-2 shadow-lg flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {inputMode === 'buzz' ? (
            <span className="flex items-center gap-1 text-accent-cyan font-semibold">
              <Zap size={13} />
              {buzz ? `Vajutas: ${buzz.name}` : 'Nupp aktiivne'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gold font-semibold">
              <MessageSquare size={13} />
              {inputsList.length > 0 ? `${inputsList.length} vastust` : 'Tekst aktiivne'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10"
          title="Ava paneel"
        >
          <ChevronDown size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-bg-card border border-gold/30 rounded-xl p-3 shadow-lg flex flex-col gap-2 min-w-[280px]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-gold/80 text-[10px] uppercase tracking-widest font-bold">Mängijate sisend</span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="text-white/40 hover:text-white p-0.5 rounded"
            title="Peida paneel"
          >
            <ChevronUp size={14} />
          </button>
        </div>
        
        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
          <button
            type="button"
            onClick={() => update({ inputMode: 'buzz', buzzEnabled: true })}
            className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${inputMode === 'buzz' ? 'bg-gold text-bg font-bold' : 'text-white/50 hover:text-white'}`}
          >
            <Zap size={12} /> Nupp
          </button>
          <button
            type="button"
            onClick={() => update({ inputMode: 'text', buzzEnabled: true })}
            className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${inputMode === 'text' ? 'bg-gold text-bg font-bold' : 'text-white/50 hover:text-white'}`}
          >
            <MessageSquare size={12} /> Tekst
          </button>
        </div>
      </div>

      {inputMode === 'buzz' ? (
        <div className="py-2">
          {buzz ? (
            <div className="flex items-center justify-between bg-accent-cyan/20 border-l-2 border-accent-cyan px-3 py-1.5 rounded-r-lg">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-accent-cyan animate-pulse" />
                <span className="text-accent-cyan font-bold">{buzz.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetBuzzOnly}
                  className="text-white/60 hover:text-gold p-1 rounded hover:bg-white/10 text-xs"
                  title="Luba teistel vastata"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="text-white/40 hover:text-accent-red p-1 rounded hover:bg-white/10"
                  title="Kustuta"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-white/30 text-xs text-center italic py-1">Ootab nupuvajutust...</div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
          {inputsList.length > 0 ? (
            inputsList.map((pi, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded-lg border border-white/10">
                <span className="text-white/80 text-sm font-semibold w-1/3 truncate" title={pi.name}>{pi.name}</span>
                {showAnswers ? (
                  <span className="text-gold text-sm font-bold ml-2 text-right break-all">{pi.value}</span>
                ) : (
                  <span className="text-white/30 text-xs italic ml-2">Sisestas vastuse</span>
                )}
              </div>
            ))
          ) : (
            <div className="text-white/30 text-xs text-center py-2 italic">Ootab vastuseid...</div>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => setShowAnswers(!showAnswers)}
              disabled={inputsList.length === 0}
              className="flex-1 btn-outline text-[10px] !py-1 flex items-center justify-center gap-1"
            >
              <Eye size={12} /> {showAnswers ? 'Peida vastused' : 'Näita vastuseid'}
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={inputsList.length === 0}
              className="btn-outline border-accent-red/50 text-accent-red hover:bg-accent-red hover:text-white text-[10px] !py-1 px-2"
              title="Tühjenda"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
