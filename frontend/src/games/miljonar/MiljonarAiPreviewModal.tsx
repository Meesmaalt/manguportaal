import { useState } from 'react'
import { Sparkles, Check, ChevronDown, ChevronUp, Eye, Play, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import type { MiljonarQuestion } from './types'
import { MILJONAR_LADDER, formatPrize } from './types'

type Props = {
  isOpen: boolean
  onClose: () => void
  onApply: (questions: MiljonarQuestion[], backupQuestions: MiljonarQuestion[]) => void
  generatedQuestions: MiljonarQuestion[]
  generatedBackups: MiljonarQuestion[]
  topic: string
  isAi: boolean
  onRegenerate?: () => void
}

export default function MiljonarAiPreviewModal({
  isOpen,
  onClose,
  onApply,
  generatedQuestions,
  generatedBackups,
  topic,
  isAi,
  onRegenerate,
}: Props) {
  const [expandedTier, setExpandedTier] = useState<number | null>(1)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="card-panel border-gold/60 bg-[#08102b] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-blue-950/80 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/20 text-gold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                Genereeritud 15 küsimust
                {isAi ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans font-medium">
                    ✨ Gemini AI
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-sans font-medium">
                    🏆 Valmiskomplekt
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/60">
                Teema: <strong className="text-gold">{topic || 'Üldteadmised'}</strong> · Vaata küsimused üle ja võta mängu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Questions list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 bg-slate-950/50">
          {generatedQuestions.map((q, idx) => {
            const step = MILJONAR_LADDER[idx] || { prize: 100, isMilestone: false }
            const isExpanded = expandedTier === (idx + 1)
            const letters = ['A', 'B', 'C', 'D']

            return (
              <div
                key={q.id || idx}
                className={`rounded-xl border transition-all ${
                  step.isMilestone
                    ? 'border-amber-500/50 bg-amber-950/15'
                    : 'border-white/10 bg-slate-900/60'
                }`}
              >
                {/* Accordion Row Header */}
                <button
                  type="button"
                  onClick={() => setExpandedTier(isExpanded ? null : idx + 1)}
                  className="w-full p-3 flex items-center justify-between text-left gap-3 hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                        step.isMilestone ? 'bg-amber-500 text-black font-bold' : 'bg-blue-900/60 text-cyan-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-400 shrink-0">
                      {formatPrize(step.prize)}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-white truncate">
                      {q.q}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
                      Õige: {letters[q.correct]}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.choices.map((choice, cIdx) => {
                        const isCorrect = q.correct === cIdx
                        return (
                          <div
                            key={cIdx}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-bold'
                                : 'bg-slate-950/40 border-white/5 text-white/70'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <strong className={isCorrect ? 'text-emerald-400' : 'text-amber-400/80'}>
                                {letters[cIdx]}:
                              </strong>
                              {choice}
                            </span>
                            {isCorrect && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                ÕIGE ✓
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {q.hostNote && (
                      <div className="text-[11px] text-cyan-200/80 bg-blue-950/30 p-2 rounded border border-blue-900/40">
                        <strong className="text-amber-300">Saatejuhi selgitus:</strong> {q.hostNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-xs px-4"
            >
              Loobu
            </button>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="btn-outline text-xs flex items-center gap-1.5 px-3 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30"
              >
                <RefreshCw size={13} /> Genereeri uuesti
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onApply(generatedQuestions, generatedBackups)}
            className="btn-gold text-xs font-bold flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-gold/20"
          >
            <Play size={14} className="fill-current" /> Rakenda need 15 küsimust mängu
          </button>
        </div>
      </div>
    </div>
  )
}
