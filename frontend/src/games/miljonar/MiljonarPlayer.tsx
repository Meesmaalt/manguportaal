import { useState, useEffect } from 'react'
import type { MiljonarState, MiljonarQuestion } from './types'
import { MILJONAR_LADDER, formatPrize } from './types'
import { Users, Sparkles, Trophy, Heart, CheckCircle2, XCircle, Lock, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  state: MiljonarState
  update: (partial: Partial<MiljonarState> | ((p: MiljonarState) => MiljonarState)) => void
  sessionCode: string
}

export default function MiljonarPlayer({ state, update, sessionCode }: Props) {
  const {
    phase,
    contestant,
    questions = [],
    currentTierIndex = 0,
    eliminatedChoices = [],
    selectedChoice = null,
    isLocked = false,
  } = state

  const [playerId] = useState(() => {
    const saved = localStorage.getItem('om_miljonar_player_id')
    if (saved) return saved
    const gen = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    localStorage.setItem('om_miljonar_player_id', gen)
    return gen
  })

  const [hasVoted, setHasVoted] = useState<0 | 1 | 2 | 3 | null>(null)

  useEffect(() => {
    // Reset vote when question changes
    setHasVoted(null)
  }, [currentTierIndex])

  const currentQ: MiljonarQuestion | undefined = questions[currentTierIndex]
  const currentLadderStep = MILJONAR_LADDER[currentTierIndex] || MILJONAR_LADDER[0]

  function handleVote(choiceIdx: 0 | 1 | 2 | 3) {
    if (hasVoted !== null) return
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40)
      } catch {}
    }
    setHasVoted(choiceIdx)

    update((prev) => {
      const existing = prev.audienceVotes || {}
      const updatedVotes = { ...existing, [playerId]: choiceIdx }

      // Recalculate stats
      const total = Object.keys(updatedVotes).length
      const counts = [0, 0, 0, 0]
      Object.values(updatedVotes).forEach((val) => {
        if (typeof val === 'number' && val >= 0 && val <= 3) {
          counts[val]++
        }
      })

      const stats = {
        A: total > 0 ? Math.round((counts[0] / total) * 100) : 0,
        B: total > 0 ? Math.round((counts[1] / total) * 100) : 0,
        C: total > 0 ? Math.round((counts[2] / total) * 100) : 0,
        D: total > 0 ? Math.round((counts[3] / total) * 100) : 0,
        total,
      }

      return {
        ...prev,
        audienceVotes: updatedVotes,
        audienceStats: stats,
      }
    })
  }

  function handleSendReaction(emoji: string) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25)
      } catch {}
    }
    update((prev) => {
      const reactions = prev.reactions || []
      const newReaction = {
        id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        emoji,
        x: Math.floor(Math.random() * 80) + 10,
        ts: Date.now(),
      }
      return {
        ...prev,
        reactions: [...reactions.slice(-15), newReaction],
      }
    })
  }

  const letters = ['A', 'B', 'C', 'D'] as const

  return (
    <div className="min-h-screen bg-[#030717] text-white flex flex-col justify-between p-4 max-w-md mx-auto font-sans select-none overflow-x-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 bg-slate-900/80 border border-blue-900/60 rounded-2xl flex items-center justify-between mb-4 shadow-lg backdrop-blur-md"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">💰</span>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-cyan-400/80 font-bold">Kes tahab saada miljonäriks</div>
            <div className="text-sm font-display font-black text-amber-400 truncate max-w-[140px]">
              {contestant?.name || 'Mängija'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase text-white/50 font-semibold tracking-wider">Aste {currentTierIndex + 1}/15</div>
          <div className="font-display font-black text-amber-300 text-sm tracking-wide drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
            {currentLadderStep.label}
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <AnimatePresence mode="wait">
          {/* If Audience Poll is Active ("Rahva hääl") */}
          {phase === 'audience_poll' ? (
            <motion.div
              key="audience-poll"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -15 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="card-panel p-5 border-2 border-cyan-400 bg-gradient-to-b from-[#0c1a4d] via-[#081338] to-[#04081c] text-center shadow-[0_0_35px_rgba(6,182,212,0.3)] rounded-2xl"
            >
              <div className="flex items-center justify-center gap-2 text-cyan-300 font-display font-black text-xl mb-1 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                <Users size={24} className="text-cyan-400 animate-pulse" /> RAHVA HÄÄL
              </div>
              <p className="text-xs text-blue-200/80 mb-4 font-medium">
                Aita mängijat! Vali variant, mida pead õigeks:
              </p>

              {hasVoted !== null ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 px-4 rounded-xl bg-emerald-950/70 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-12 h-12 rounded-full bg-emerald-500 text-black font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg"
                  >
                    ✓
                  </motion.div>
                  <div className="font-display font-black text-lg text-white">Sinu hääl on antud!</div>
                  <div className="text-xs text-emerald-200/90 mt-1.5 font-medium">
                    Valisid variandi: <strong className="text-amber-300 font-black text-sm">{letters[hasVoted]}</strong>
                  </div>
                  <div className="mt-3 text-[11px] text-white/50 animate-pulse">
                    Tulemused ilmuvad kohe teleriekraanile…
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {letters.map((letter, idx) => {
                    const text = currentQ?.choices[idx] || ''
                    const isEliminated = eliminatedChoices.includes(idx as 0 | 1 | 2 | 3)
                    if (isEliminated) return null

                    return (
                      <motion.button
                        key={letter}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleVote(idx as 0 | 1 | 2 | 3)}
                        className="p-4 rounded-xl border-2 border-cyan-400 bg-blue-950/90 hover:bg-cyan-900/60 active:bg-cyan-600 text-white flex flex-col items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      >
                        <span className="font-display font-black text-3xl text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                          {letter}
                        </span>
                        <span className="text-xs font-semibold line-clamp-2 text-white/90">{text}</span>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            /* Normal Spectator Mode with Dramatic Tension & Entry Animations */
            <motion.div
              key={`question-${currentTierIndex}`}
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.97 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="card-panel p-5 border-2 border-blue-900/60 bg-gradient-to-b from-[#0c163b] via-[#080e29] to-[#030617] text-center space-y-4 shadow-2xl rounded-2xl"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs uppercase tracking-widest text-cyan-400 font-display font-extrabold px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40">
                  Küsimus {currentTierIndex + 1}
                </span>
                {currentLadderStep.isMilestone && (
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/50 flex items-center gap-1">
                    🛡️ Turvasumma
                  </span>
                )}
              </div>

              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-lg font-bold font-display text-white leading-snug tracking-wide"
              >
                {currentQ?.q || 'Valmistu järgmiseks küsimuseks...'}
              </motion.h3>

              {/* Status Banner during tension phases */}
              <AnimatePresence>
                {phase === 'locked' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 text-amber-300 bg-amber-950/60 border border-amber-500/60 px-3 py-1.5 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse"
                  >
                    <Lock size={14} className="text-amber-400" />
                    <span>Lõplik vastus lukustatud! Saatejuht kontrollib…</span>
                  </motion.div>
                )}

                {phase === 'revealed_correct' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 text-emerald-300 bg-emerald-950/80 border-2 border-emerald-400 px-3.5 py-2 rounded-xl text-sm font-black shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                  >
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>ÕIGE VASTUS! 🎉</span>
                  </motion.div>
                )}

                {phase === 'revealed_wrong' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 text-rose-300 bg-rose-950/80 border-2 border-rose-500 px-3.5 py-2 rounded-xl text-sm font-black shadow-[0_0_25px_rgba(244,63,94,0.5)]"
                  >
                    <XCircle size={18} className="text-rose-400" />
                    <span>VALE VASTUS!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Answer choices preview with subtle staggered animations & dramatic reveal states */}
              <div className="grid grid-cols-1 gap-2.5 text-left pt-1">
                {letters.map((letter, idx) => {
                  const text = currentQ?.choices[idx] || ''
                  const isEliminated = eliminatedChoices.includes(idx as 0 | 1 | 2 | 3)
                  const isSelected = selectedChoice === idx
                  const isCorrect = currentQ?.correct === idx
                  const isRevealedCorrect = phase === 'revealed_correct'
                  const isRevealedWrong = phase === 'revealed_wrong'

                  if (isEliminated) return null

                  // Dynamic styles for spectator tension
                  let choiceClass =
                    'bg-blue-950/50 border-blue-900/60 text-white/90 shadow-sm'
                  let badgeClass = 'text-amber-400 font-black'

                  if (isRevealedCorrect && isCorrect) {
                    choiceClass =
                      'bg-gradient-to-r from-emerald-600 to-green-500 border-2 border-emerald-300 text-white font-black shadow-[0_0_25px_rgba(16,185,129,0.8)]'
                    badgeClass = 'text-white font-black'
                  } else if (isRevealedWrong) {
                    if (isSelected) {
                      choiceClass =
                        'bg-gradient-to-r from-rose-700 to-red-600 border-2 border-rose-300 text-white font-bold shadow-[0_0_25px_rgba(244,63,94,0.8)]'
                      badgeClass = 'text-white font-black'
                    } else if (isCorrect) {
                      choiceClass =
                        'bg-gradient-to-r from-emerald-700 to-green-600 border-2 border-emerald-300 text-white font-black shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                      badgeClass = 'text-white font-black'
                    }
                  } else if (isSelected && isLocked) {
                    choiceClass =
                      'bg-gradient-to-r from-amber-600 to-orange-500 border-2 border-amber-200 text-white font-black shadow-[0_0_25px_rgba(245,158,11,0.8)] animate-pulse'
                    badgeClass = 'text-amber-100 font-black'
                  } else if (isSelected && !isLocked) {
                    choiceClass =
                      'bg-gradient-to-r from-amber-900/80 to-amber-700/80 border-2 border-amber-400 text-amber-100 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    badgeClass = 'text-amber-300 font-black'
                  }

                  return (
                    <motion.div
                      key={letter}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: (isRevealedCorrect && isCorrect) || (isSelected && isLocked) ? 1.02 : 1,
                      }}
                      transition={{
                        delay: 0.15 + idx * 0.08,
                        duration: 0.25,
                      }}
                      className={`px-4 py-3 rounded-xl border transition-all duration-300 text-xs flex items-center justify-between gap-3 ${choiceClass}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`font-display text-sm ${badgeClass}`}>{letter}:</span>
                        <span className="truncate">{text}</span>
                      </div>
                      {isSelected && isLocked && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded border border-amber-200/50 text-amber-200 shrink-0">
                          Lukustatud
                        </span>
                      )}
                      {isRevealedCorrect && isCorrect && (
                        <span className="text-base shrink-0">✓</span>
                      )}
                      {isRevealedWrong && isSelected && (
                        <span className="text-base shrink-0">✗</span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Reactions Bar */}
      <footer className="mt-4 pt-3 border-t border-blue-900/40">
        <div className="text-[10px] text-center uppercase tracking-wider text-cyan-300/70 font-semibold mb-2">
          Saada telerisse reaalajas emotsioon
        </div>
        <div className="flex items-center justify-center gap-3">
          {['👏', '🔥', '😱', '💰', '🏆', '🎉'].map((emoji, i) => (
            <motion.button
              key={emoji}
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.04 }}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSendReaction(emoji)}
              className="w-11 h-11 rounded-full bg-slate-900/90 border border-blue-800 text-xl flex items-center justify-center shadow-md hover:border-cyan-400 active:bg-blue-950 transition"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </footer>
    </div>
  )
}
