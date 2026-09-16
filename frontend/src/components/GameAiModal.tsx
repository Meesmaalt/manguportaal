import { useState } from 'react'
import { Sparkles, Loader2, Key, Info } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onGenerate: (topic: string, count: number, difficulty: string) => Promise<void>
  gameType?: 'kuldvillak' | 'miljonar' | 'roosid' | 'blitz' | 'alias'
}

export default function GameAiModal({ isOpen, onClose, onGenerate, gameType = 'blitz' }: Props) {
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(15)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    try {
      await onGenerate(topic.trim(), count, difficulty)
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'AI genereerimine ebaõnnestus.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="card-panel max-w-md w-full p-6 bg-[#08112c] border-cyan-500/30 shadow-2xl relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 text-cyan-300 font-display font-bold text-lg">
            <Sparkles size={20} className="text-cyan-400" />
            <span>AI Genereerimine</span>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white text-sm px-2 py-1">✕</button>
        </div>

        <form onSubmit={handleRun} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80">Teema või märksõnad</label>
            <input
              type="text"
              placeholder="nt 90ndate eesti muusika, kosmos, ajalugu..."
              className="input-field text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Küsimuste arv</label>
              <input
                type="number"
                min={3}
                max={30}
                className="input-field text-sm"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Raskusaste</label>
              <select
                className="input-field text-sm"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={loading}
              >
                <option value="easy">Lihtne</option>
                <option value="medium">Keskmine</option>
                <option value="hard">Keeruline</option>
                <option value="mixed">Segamini</option>
              </select>
            </div>
          </div>

          {error && <p className="text-accent-red text-xs">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-white/60 hover:text-white text-xs px-3 py-2 transition"
            >
              Loobu
            </button>
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="btn-gold text-xs px-5 py-2.5 flex items-center gap-2 font-semibold shadow-lg shadow-gold/20"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Genereerin...</>
              ) : (
                <><Sparkles size={16} /> Genereeri mäng</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
