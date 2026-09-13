import { useEffect, useState, useRef } from 'react'
import type { MiljonarState, MiljonarQuestion } from './types'
import { MILJONAR_LADDER, formatPrize } from './types'
import { miljonarAudio } from './miljonarAudio'
import { confettiBurst } from '@/lib/confettiBurst'
import { Users, Phone, HelpCircle, Shuffle, Trophy, Check, Sparkles, Clock, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { appUrl } from '@/lib/config'

type Props = {
  state: MiljonarState
  sessionCode?: string
}

export default function MiljonarTv({ state, sessionCode }: Props) {
  const {
    phase,
    contestant,
    questions = [],
    currentTierIndex = 0,
    lifelines,
    selectedChoice,
    isLocked,
    eliminatedChoices = [],
    audienceStats,
    phoneTimer,
    wonAmount,
    confettiAt,
    reactions = [],
  } = state

  const currentQ: MiljonarQuestion | undefined = questions[currentTierIndex]
  const currentLadderStep = MILJONAR_LADDER[currentTierIndex] || MILJONAR_LADDER[0]

  const lastConfetti = useRef<number>(0)
  const [showJoinQr, setShowJoinQr] = useState(false)

  // React to confetti triggers
  useEffect(() => {
    if (confettiAt && confettiAt !== lastConfetti.current) {
      lastConfetti.current = confettiAt
      confettiBurst({ particleCount: 150, spread: 80, y: 0.6 })
    }
  }, [confettiAt])

  // Play audio effects based on phase changes
  useEffect(() => {
    if (phase === 'question') {
      miljonarAudio.startSuspenseDrone(currentTierIndex)
    } else if (phase === 'locked') {
      miljonarAudio.playLockAnswer()
    } else if (phase === 'revealed_correct') {
      miljonarAudio.playCorrectAnswer(currentTierIndex)
      if (currentTierIndex === 14) {
        confettiBurst({ particleCount: 200, spread: 100, y: 0.5 })
      }
    } else if (phase === 'revealed_wrong') {
      miljonarAudio.playWrongAnswer()
    } else if (phase === 'walk_away') {
      miljonarAudio.playWalkAway()
    } else if (phase === 'lobby') {
      miljonarAudio.stopSuspenseDrone()
    }
  }, [phase, currentTierIndex])

  const letters = ['A', 'B', 'C', 'D'] as const

  return (
    <div className="relative min-h-screen w-full bg-[#030717] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Cinematic Studio Spotlight Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial spotlight from top center */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-b from-blue-600/25 via-indigo-900/15 to-transparent rounded-full blur-3xl" />
        {/* Floor grid effect */}
        <div
          className="absolute bottom-0 inset-x-0 h-96 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to top, black, transparent)',
          }}
        />
        {/* Ambient subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,6,23,0.85)_100%)]" />
      </div>

      {/* Floating Spectator Reactions */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 1, y: '90vh', scale: 0.7, x: `${r.x}%` }}
            animate={{ opacity: 0, y: '20vh', scale: 1.5 }}
            transition={{ duration: 3.2, ease: 'easeOut' }}
            className="absolute text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
          >
            {r.emoji}
          </motion.div>
        ))}
      </div>

      {/* TOP HEADER: Contestant & Lifelines Bar */}
      <header className="relative z-20 px-6 pt-5 pb-3 flex items-center justify-between gap-4 border-b border-blue-900/40 bg-slate-950/40 backdrop-blur-sm">
        {/* Contestant hot-seat card */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border-2 border-amber-200/80 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            {contestant?.avatar || '👤'}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-amber-300/80 font-semibold font-display">
              Kuumal toolil
            </div>
            <div className="text-xl md:text-2xl font-bold font-display text-white tracking-wide flex items-center gap-2">
              {contestant?.name || 'Mängija'}
            </div>
          </div>
        </div>

        {/* Center: Current Prize Milestone indicator */}
        <div className="hidden md:flex flex-col items-center">
          <div className="text-xs uppercase tracking-widest text-blue-300/70 font-semibold">
            Küsimus {currentTierIndex + 1} / 15
          </div>
          <div className="text-2xl lg:text-3xl font-black font-display text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
            {currentLadderStep?.label}
          </div>
        </div>

        {/* Lifelines */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* 50:50 */}
          <div
            className={`relative flex items-center justify-center w-12 h-10 md:w-14 md:h-12 rounded-full border-2 transition-all ${
              lifelines?.fifty_fifty
                ? 'bg-blue-950/80 border-cyan-400/70 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'bg-black/60 border-red-500/50 text-red-400/40 opacity-50'
            }`}
            title="50:50"
          >
            <span className="font-display font-black text-xs md:text-sm tracking-tighter">50:50</span>
            {!lifelines?.fifty_fifty && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 rotate-45" />
              </div>
            )}
          </div>

          {/* Rahva hääl */}
          <div
            className={`relative flex items-center justify-center w-12 h-10 md:w-14 md:h-12 rounded-full border-2 transition-all ${
              lifelines?.ask_audience
                ? 'bg-blue-950/80 border-cyan-400/70 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'bg-black/60 border-red-500/50 text-red-400/40 opacity-50'
            }`}
            title="Rahva hääl"
          >
            <Users size={20} />
            {!lifelines?.ask_audience && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 rotate-45" />
              </div>
            )}
          </div>

          {/* Helista sõbrale */}
          <div
            className={`relative flex items-center justify-center w-12 h-10 md:w-14 md:h-12 rounded-full border-2 transition-all ${
              lifelines?.phone_friend
                ? 'bg-blue-950/80 border-cyan-400/70 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'bg-black/60 border-red-500/50 text-red-400/40 opacity-50'
            }`}
            title="Helista sõbrale"
          >
            <Phone size={20} />
            {!lifelines?.phone_friend && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 rotate-45" />
              </div>
            )}
          </div>

          {/* Vaheta küsimus */}
          <div
            className={`relative flex items-center justify-center w-12 h-10 md:w-14 md:h-12 rounded-full border-2 transition-all ${
              lifelines?.switch_question
                ? 'bg-blue-950/80 border-cyan-400/70 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'bg-black/60 border-red-500/50 text-red-400/40 opacity-50'
            }`}
            title="Vaheta küsimus"
          >
            <Shuffle size={20} />
            {!lifelines?.switch_question && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 rotate-45" />
              </div>
            )}
          </div>

          {/* Room QR / audience vote badge */}
          {sessionCode && (
            <button
              type="button"
              onClick={() => setShowJoinQr(!showJoinQr)}
              className="ml-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-900/40 border border-blue-500/40 text-blue-200 text-xs font-mono hover:bg-blue-800/50 transition"
              title="Ava publiku QR kood"
            >
              <QrCode size={16} className="text-amber-400" />
              <span className="font-bold">{sessionCode}</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN ARENA: Question & Lozenge Answers on Left/Center, Money Ladder on Right */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full items-center">
        {/* QUESTION & CHOICES SECTION (8 cols on large screens) */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-5 md:space-y-7">
          {/* Main Question Display Box (Iconic Diamond / Lozenge frame) */}
          <div className="relative">
            {/* Horizontal connector lines */}
            <div className="hidden md:block absolute top-1/2 -left-8 -right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent -z-10" />

            <motion.div
              key={`tv-q-${currentTierIndex}`}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative bg-gradient-to-b from-[#0b1638] via-[#080e29] to-[#04081c] border-2 border-cyan-400/80 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center shadow-[0_0_35px_rgba(6,182,212,0.3)] min-h-[140px] md:min-h-[180px] flex flex-col items-center justify-center"
            >
              <span className="text-xs uppercase tracking-widest text-cyan-300/80 font-bold mb-2 font-display">
                Küsimus {currentTierIndex + 1}
              </span>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-display text-white tracking-wide leading-snug max-w-2xl drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                {currentQ?.q || 'Valmistu küsimuseks...'}
              </h2>
            </motion.div>
          </div>

          {/* Four Answer Choices (A, B, C, D) in 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
            {letters.map((letter, idx) => {
              const text = currentQ?.choices[idx] || ''
              const isEliminated = eliminatedChoices.includes(idx as 0 | 1 | 2 | 3)
              const isSelected = selectedChoice === idx
              const isCorrect = currentQ?.correct === idx
              const isRevealedCorrect = phase === 'revealed_correct'
              const isRevealedWrong = phase === 'revealed_wrong'

              // Determine dynamic visual styles
              let containerStyle =
                'bg-gradient-to-b from-[#0b1638] to-[#04081a] border-cyan-500/60 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              let textStyle = 'text-white'
              let letterBadgeStyle = 'text-amber-400 font-bold'

              if (isEliminated) {
                containerStyle = 'bg-black/40 border-slate-800/40 opacity-20 invisible md:visible pointer-events-none'
                textStyle = 'text-transparent'
              } else if (isRevealedCorrect && isCorrect) {
                // Correct answer reveal: vibrant emerald green with glow
                containerStyle =
                  'bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 border-2 border-emerald-200 text-white shadow-[0_0_45px_rgba(16,185,129,0.9)] animate-pulse'
                textStyle = 'text-white font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                letterBadgeStyle = 'text-white font-black'
              } else if (isRevealedWrong) {
                if (isSelected) {
                  // Selected wrong answer: ruby red
                  containerStyle =
                    'bg-gradient-to-r from-rose-700 to-red-600 border-2 border-red-300 text-white shadow-[0_0_35px_rgba(239,68,68,0.8)]'
                  textStyle = 'text-white font-bold'
                  letterBadgeStyle = 'text-white font-black'
                } else if (isCorrect) {
                  // Reveal correct answer while wrong was chosen
                  containerStyle =
                    'bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 border-2 border-emerald-300 text-white shadow-[0_0_45px_rgba(16,185,129,0.9)] animate-pulse'
                  textStyle = 'text-white font-black'
                  letterBadgeStyle = 'text-white font-black'
                }
              } else if (isSelected && isLocked) {
                // Locked answer pending reveal: pulsing golden amber
                containerStyle =
                  'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 border-2 border-amber-200 text-white shadow-[0_0_45px_rgba(245,158,11,0.9)] animate-pulse'
                textStyle = 'text-white font-black drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]'
                letterBadgeStyle = 'text-amber-100 font-black'
              } else if (isSelected && !isLocked) {
                // Selected tentative choice: glowing amber
                containerStyle =
                  'bg-gradient-to-r from-amber-800/90 to-amber-700/80 border-2 border-amber-400 text-white shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                textStyle = 'text-amber-100 font-bold'
              }

              return (
                <motion.div
                  key={`tv-choice-${currentTierIndex}-${letter}`}
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: (isRevealedCorrect && isCorrect) || (isSelected && isLocked) ? 1.03 : 1,
                  }}
                  transition={{
                    delay: 0.15 + idx * 0.08,
                    duration: 0.3,
                  }}
                  className={`relative p-4 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all duration-300 flex items-center gap-3 md:gap-4 ${containerStyle}`}
                >
                  <span className={`text-lg md:text-xl font-display font-black tracking-wider ${letterBadgeStyle}`}>
                    {letter}:
                  </span>
                  <span className={`text-base md:text-lg font-medium leading-tight flex-1 ${textStyle}`}>
                    {isEliminated ? '' : text}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {/* Host note or fun fact displayed after question reveal */}
          <AnimatePresence>
            {(phase === 'revealed_correct' || phase === 'revealed_wrong') && currentQ?.hostNote && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-blue-950/60 border border-cyan-400/30 text-blue-100 text-sm md:text-base text-center leading-relaxed"
              >
                <span className="text-amber-300 font-display font-bold mr-2">Fakt:</span>
                {currentQ.hostNote}
                {currentQ.funFact && <div className="mt-1 text-xs text-white/70 italic">{currentQ.funFact}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MONEY LADDER (4 cols on large screens) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#080e29]/90 to-[#020514]/95 border-2 border-blue-900/60 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div className="text-center pb-2 mb-2 border-b border-blue-900/40">
            <h3 className="text-xs uppercase tracking-widest text-amber-400/90 font-display font-bold">
              Võiduredel
            </h3>
          </div>

          {/* 15 Steps (Top is 1 000 000 €, Bottom is 100 €) */}
          <div className="space-y-1 md:space-y-1.5 flex flex-col justify-between">
            {[...MILJONAR_LADDER].reverse().map((step) => {
              const stepIndex = step.tier - 1
              const isActive = stepIndex === currentTierIndex
              const isPast = stepIndex < currentTierIndex
              const isSafe = step.isMilestone

              let rowStyle = 'text-blue-300/80 hover:bg-white/[0.02]'
              let numStyle = isSafe ? 'text-amber-300 font-bold' : 'text-blue-400/60'
              let prizeStyle = isSafe ? 'text-white font-bold' : 'text-blue-200'

              if (isActive) {
                rowStyle =
                  'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-[1.03] z-10'
                numStyle = 'text-black font-black'
                prizeStyle = 'text-black font-black'
              } else if (isPast) {
                rowStyle = 'text-emerald-400/70 bg-emerald-950/20'
                numStyle = 'text-emerald-400'
                prizeStyle = 'text-emerald-300'
              }

              return (
                <div
                  key={step.tier}
                  className={`flex items-center justify-between px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm transition-all duration-200 ${rowStyle}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-right font-display ${numStyle}`}>{step.tier}</span>
                    {isPast ? (
                      <Check size={14} className="text-emerald-400 inline" />
                    ) : isSafe ? (
                      <span className="text-amber-300 text-[10px]">◆</span>
                    ) : (
                      <span className="text-white/20 text-[10px]">•</span>
                    )}
                  </div>
                  <span className={`font-display tracking-wide ${prizeStyle}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Current Guaranteed Safety Haven */}
          <div className="mt-3 pt-3 border-t border-blue-900/40 text-center">
            <div className="text-[10px] uppercase tracking-wider text-white/50">Garanteeritud turvasumma</div>
            <div className="text-base font-display font-bold text-amber-300">
              {formatPrize(state.guaranteedBank || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: RAHVA HÄÄL (Audience Poll Bar Chart) */}
      <AnimatePresence>
        {phase === 'audience_poll' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="bg-gradient-to-b from-[#0b1638] to-[#04081c] border-2 border-cyan-400 rounded-3xl p-6 md:p-10 max-w-xl w-full text-center shadow-[0_0_50px_rgba(6,182,212,0.4)]">
              <div className="flex items-center justify-center gap-3 mb-2 text-cyan-300">
                <Users size={32} />
                <h3 className="text-2xl md:text-3xl font-display font-black tracking-wide text-white">
                  RAHVA HÄÄL
                </h3>
              </div>
              <p className="text-blue-200/70 text-sm mb-8">
                Publik hääletab reaalajas oma telefonidest!
              </p>

              {/* Vertical Bar Chart A, B, C, D */}
              <div className="grid grid-cols-4 gap-4 h-64 items-end px-4 mb-6">
                {letters.map((letter) => {
                  const pct = audienceStats ? audienceStats[letter] : 0
                  return (
                    <div key={letter} className="flex flex-col items-center h-full justify-end">
                      <div className="text-sm font-bold text-cyan-300 mb-2 font-display">{pct}%</div>
                      <div className="w-full bg-blue-950/80 rounded-t-xl overflow-hidden border-t-2 border-x-2 border-cyan-400/60 flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(5, pct)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="w-full bg-gradient-to-t from-cyan-600 to-cyan-300"
                        />
                      </div>
                      <div className="mt-3 text-lg font-black font-display text-white">{letter}</div>
                    </div>
                  )
                })}
              </div>

              <div className="text-xs text-white/50">
                Hääli kokku: <strong className="text-amber-400">{audienceStats?.total || 0}</strong>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: HELISTA SÕBRALE (Phone a Friend 30s Countdown) */}
      <AnimatePresence>
        {phase === 'phone_calling' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="bg-gradient-to-b from-[#0b1638] to-[#04081c] border-2 border-cyan-400 rounded-3xl p-6 md:p-10 max-w-lg w-full text-center shadow-[0_0_50px_rgba(6,182,212,0.4)]">
              <div className="flex items-center justify-center gap-3 mb-4 text-cyan-300">
                <Phone size={30} className="animate-pulse" />
                <h3 className="text-2xl md:text-3xl font-display font-black text-white">
                  HELISTA SÕBRALE
                </h3>
              </div>

              {/* Countdown circle */}
              <div className="relative w-36 h-36 mx-auto my-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-900/60" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-spin" />
                <div className="text-5xl font-black font-display text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                  {phoneTimer?.secondsLeft ?? 30}
                </div>
              </div>

              {/* Friend Advice message if generated */}
              {phoneTimer?.advice && (
                <div className="p-4 rounded-xl bg-blue-950/80 border border-cyan-400/40 text-left">
                  <div className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                    {phoneTimer.advice.friendName} ({phoneTimer.advice.confidence}% kindel):
                  </div>
                  <div className="text-white text-base mt-1 italic">
                    "{phoneTimer.advice.comment}"
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: 1 000 000 € THE ULTIMATE WINNER CELEBRATION */}
      <AnimatePresence>
        {phase === 'won_million' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
          >
            <div className="relative bg-gradient-to-b from-[#1b1202] via-[#0d0901] to-black border-4 border-amber-400 rounded-3xl p-8 md:p-14 max-w-2xl w-full text-center shadow-[0_0_80px_rgba(245,158,11,0.9)]">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-white flex items-center justify-center text-4xl shadow-2xl">
                🏆
              </div>

              <div className="mt-8 text-amber-400 font-display text-xl uppercase tracking-[0.3em] font-bold">
                Ajalooline hetk
              </div>
              <h1 className="text-5xl md:text-7xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 my-4 drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]">
                MILJONÄR!
              </h1>
              <p className="text-xl md:text-2xl text-white font-medium mb-6">
                Õnnitleme, <strong className="text-amber-300">{contestant?.name}</strong>!
              </p>

              <div className="py-5 px-8 rounded-2xl bg-amber-500/20 border-2 border-amber-400/80 inline-block shadow-inner">
                <div className="text-xs uppercase tracking-widest text-amber-300 font-bold mb-1">
                  Võidusumma
                </div>
                <div className="text-4xl md:text-6xl font-black font-display text-white">
                  1 000 000 €
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 4: WALK AWAY / GAME OVER VOUCHER */}
      <AnimatePresence>
        {phase === 'walk_away' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="bg-gradient-to-b from-[#0b1638] to-[#04081c] border-2 border-amber-400 rounded-3xl p-6 md:p-12 max-w-xl w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.5)]">
              <div className="text-amber-400 font-display text-base uppercase tracking-widest font-bold mb-2">
                Tark otsus lahkuda rahaga
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-6">
                {contestant?.name} võidab:
              </h2>
              <div className="py-6 px-8 rounded-2xl bg-amber-500/20 border-2 border-amber-400 inline-block mb-6 shadow-inner">
                <div className="text-4xl md:text-5xl font-black font-display text-amber-300">
                  {formatPrize(wonAmount || state.accumulatedBank || 0)}
                </div>
              </div>
              <p className="text-blue-200/70 text-sm">
                Võimas mäng! Suur aplaus mängijale! 👏
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join QR overlay for audience participation */}
      <AnimatePresence>
        {showJoinQr && sessionCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJoinQr(false)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#080e29] border-2 border-cyan-400 p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl"
            >
              <h3 className="font-display text-xl text-amber-300 font-bold mb-2">
                Osale publikuna telefonist
              </h3>
              <p className="text-white/70 text-xs mb-6">
                Ava telefoniga link ja hääleta "Rahva hääl" voorus!
              </p>
              <div className="p-4 bg-white rounded-2xl inline-block mb-4 shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    appUrl(`/miljonar/${sessionCode}`)
                  )}`}
                  alt="Miljonär QR"
                  className="w-48 h-48"
                />
              </div>
              <div className="font-mono text-2xl font-black text-cyan-300 tracking-widest mb-4">
                {sessionCode}
              </div>
              <button
                type="button"
                onClick={() => setShowJoinQr(false)}
                className="px-6 py-2 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800"
              >
                Sulge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="relative z-20 px-6 py-3 border-t border-blue-900/30 flex items-center justify-between text-xs text-blue-300/50 bg-black/30">
        <div>KES TAHAB SAADA MILJONÄRIKS?</div>
        {sessionCode && (
          <div className="font-mono">
            Kood: <span className="text-amber-400 font-bold">{sessionCode}</span>
          </div>
        )}
      </footer>
    </div>
  )
}
