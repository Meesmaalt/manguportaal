import { useState, useEffect, useRef } from 'react'
import type { MiljonarState, MiljonarQuestion, MiljonarContestant } from './types'
import { MILJONAR_LADDER, formatPrize } from './types'
import { miljonarAudio } from './miljonarAudio'
import {
  MILJONAR_KLASSIKA_QUESTIONS,
  MILJONAR_EESTI_QUESTIONS,
  MILJONAR_PEO_QUESTIONS,
} from './miljonarPacks'
import { generateMiljonarQuizWithAi } from './generateMiljonarQuiz'
import MiljonarAiPreviewModal from './MiljonarAiPreviewModal'
import {
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
  Phone,
  Shuffle,
  DollarSign,
  UserPlus,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Play,
  Share2,
  Copy,
  Check,
  Upload,
} from 'lucide-react'
import { appUrl } from '@/lib/config'

type Props = {
  state: MiljonarState
  update: (partial: Partial<MiljonarState> | ((p: MiljonarState) => MiljonarState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function MiljonarHost({ state, update, sessionCode }: Props) {
  const {
    phase = 'lobby',
    contestant = { name: 'Mängija 1' },
    questions = MILJONAR_KLASSIKA_QUESTIONS.filter((q) => !q.backup),
    backupQuestions = MILJONAR_KLASSIKA_QUESTIONS.filter((q) => q.backup),
    currentTierIndex = 0,
    lifelines = { fifty_fifty: true, ask_audience: true, phone_friend: true, switch_question: true },
    selectedChoice = null,
    isLocked = false,
    eliminatedChoices = [],
    accumulatedBank = 0,
    guaranteedBank = 0,
    musicEnabled = true,
    sfxEnabled = true,
    audienceStats = null,
    phoneTimer = null,
    contestantHistory = [],
  } = state

  const currentQ: MiljonarQuestion | undefined = questions[currentTierIndex]
  const currentLadderStep = MILJONAR_LADDER[currentTierIndex] || MILJONAR_LADDER[0]

  const [aiTopic, setAiTopic] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [jsonPasteOpen, setJsonPasteOpen] = useState(false)
  const [jsonPasteText, setJsonPasteText] = useState('')
  const [jsonPasteError, setJsonPasteError] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [phoneSeconds, setPhoneSeconds] = useState(30)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewQuestions, setPreviewQuestions] = useState<MiljonarQuestion[]>([])
  const [previewBackups, setPreviewBackups] = useState<MiljonarQuestion[]>([])
  const [previewIsAi, setPreviewIsAi] = useState(true)
  const [previewTopic, setPreviewTopic] = useState('')
  const phoneIntervalRef = useRef<number | null>(null)

  // Keep audio sync
  useEffect(() => {
    miljonarAudio.setMuted(!sfxEnabled)
  }, [sfxEnabled])

  // Countdown timer for Phone a friend
  useEffect(() => {
    if (phase === 'phone_calling' && phoneTimer?.running) {
      if (phoneIntervalRef.current) clearInterval(phoneIntervalRef.current)
      phoneIntervalRef.current = window.setInterval(() => {
        setPhoneSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(phoneIntervalRef.current!)
            miljonarAudio.playWrongAnswer()
            update({
              phase: 'question',
              phoneTimer: { running: false, secondsLeft: 0, advice: phoneTimer.advice },
            })
            return 0
          }
          miljonarAudio.playClockTick()
          const next = prev - 1
          update({
            phoneTimer: { running: true, secondsLeft: next, advice: phoneTimer?.advice },
          })
          return next
        })
      }, 1000)
    } else {
      if (phoneIntervalRef.current) {
        clearInterval(phoneIntervalRef.current)
        phoneIntervalRef.current = null
      }
    }
    return () => {
      if (phoneIntervalRef.current) clearInterval(phoneIntervalRef.current)
    }
  }, [phase, phoneTimer?.running])

  // Select a tentative choice
  function handleSelectChoice(choiceIdx: 0 | 1 | 2 | 3) {
    if (eliminatedChoices.includes(choiceIdx)) return
    if (isLocked && phase !== 'question') return
    update({
      selectedChoice: choiceIdx,
      isLocked: false,
    })
  }

  // Lock answer ("Kas see on sinu lõplik vastus?")
  function handleLockAnswer() {
    if (selectedChoice === null) return
    miljonarAudio.playLockAnswer()
    update({
      isLocked: true,
      phase: 'locked',
    })
  }

  // Reveal answer (Correct or Wrong)
  function handleRevealAnswer() {
    if (selectedChoice === null || !currentQ) return

    const isCorrect = selectedChoice === currentQ.correct

    if (isCorrect) {
      const prizeWon = currentLadderStep.prize
      // Calculate safety haven milestones
      let newGuaranteed = guaranteedBank
      if (currentTierIndex === 4) newGuaranteed = 1000 // 5th question = 1 000 €
      if (currentTierIndex === 9) newGuaranteed = 32000 // 10th question = 32 000 €

      if (currentTierIndex === 14) {
        // WON 1 000 000 €!
        miljonarAudio.playCorrectAnswer(currentTierIndex)
        update({
          phase: 'won_million',
          accumulatedBank: 1000000,
          guaranteedBank: 1000000,
          wonAmount: 1000000,
          confettiAt: Date.now(),
          contestantHistory: [
            ...contestantHistory,
            {
              id: `c-${Date.now()}`,
              name: contestant.name,
              score: 1000000,
              status: 'won_million',
              finalTier: 15,
              timestamp: Date.now(),
            },
          ],
        })
      } else {
        miljonarAudio.playCorrectAnswer(currentTierIndex)
        update({
          phase: 'revealed_correct',
          accumulatedBank: prizeWon,
          guaranteedBank: newGuaranteed,
          confettiAt: currentTierIndex === 4 || currentTierIndex === 9 ? Date.now() : undefined,
        })
      }
    } else {
      // Wrong answer
      miljonarAudio.playWrongAnswer()
      const prize = guaranteedBank
      update({
        phase: 'revealed_wrong',
        wonAmount: prize,
        contestantHistory: [
          ...contestantHistory,
          {
            id: `c-${Date.now()}`,
            name: contestant.name,
            score: prize,
            status: 'lost',
            finalTier: currentTierIndex + 1,
            timestamp: Date.now(),
          },
        ],
      })
    }
  }

  // Move to next question after correct answer
  function handleNextQuestion() {
    if (currentTierIndex >= 14) return
    const nextIdx = currentTierIndex + 1
    miljonarAudio.startSuspenseDrone(nextIdx)
    update({
      currentTierIndex: nextIdx,
      phase: 'question',
      selectedChoice: null,
      isLocked: false,
      eliminatedChoices: [],
      audienceStats: null,
      phoneTimer: null,
    })
  }

  // Walk Away ("Võta raha ja lahku")
  function handleWalkAway() {
    const finalAmount = accumulatedBank
    if (!confirm(`Kas ${contestant.name} soovib tõesti võtta ${formatPrize(finalAmount)} ja lahkuda?`)) return
    miljonarAudio.playWalkAway()
    update({
      phase: 'walk_away',
      wonAmount: finalAmount,
      contestantHistory: [
        ...contestantHistory,
        {
          id: `c-${Date.now()}`,
          name: contestant.name,
          score: finalAmount,
          status: 'walked',
          finalTier: currentTierIndex,
          timestamp: Date.now(),
        },
      ],
    })
  }

  // 1. LIFELINE: 50:50
  function handleFiftyFifty() {
    if (!lifelines.fifty_fifty || !currentQ) return
    miljonarAudio.playFiftyFifty()

    const correctIdx = currentQ.correct
    const wrongIndices = ([0, 1, 2, 3] as (0 | 1 | 2 | 3)[]).filter((i) => i !== correctIdx)
    // Shuffle wrong indices and take 2 to eliminate
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5)
    const toEliminate = shuffled.slice(0, 2)

    update({
      lifelines: { ...lifelines, fifty_fifty: false },
      eliminatedChoices: toEliminate,
    })
  }

  // 2. LIFELINE: Rahva hääl (Ask the audience)
  function handleAskAudience() {
    if (!lifelines.ask_audience || !currentQ) return
    miljonarAudio.playPhoneRing()

    // Calculate simulated percentages based on tier difficulty
    const correctIdx = currentQ.correct
    let correctPct = 65
    if (currentTierIndex >= 5) correctPct = 52
    if (currentTierIndex >= 10) correctPct = 38
    if (currentTierIndex >= 13) correctPct = 28

    const remaining = 100 - correctPct
    const p1 = Math.floor(remaining * 0.45)
    const p2 = Math.floor(remaining * 0.35)
    const p3 = remaining - p1 - p2

    const wrongPcts = [p1, p2, p3].sort(() => Math.random() - 0.5)
    let wIdx = 0

    const stats: any = { A: 0, B: 0, C: 0, D: 0, total: 32 }
    const letters = ['A', 'B', 'C', 'D'] as const
    letters.forEach((l, idx) => {
      if (idx === correctIdx) {
        stats[l] = correctPct
      } else {
        stats[l] = wrongPcts[wIdx++]
      }
    })

    update({
      lifelines: { ...lifelines, ask_audience: false },
      phase: 'audience_poll',
      audienceStats: stats,
    })
  }

  // 3. LIFELINE: Helista sõbrale (Phone a friend)
  function handlePhoneFriend() {
    if (!lifelines.phone_friend || !currentQ) return
    miljonarAudio.playPhoneRing()

    const correctLetter = ['A', 'B', 'C', 'D'][currentQ.correct]
    const adviceComments = [
      `Tere! Minu meelest on see kindlasti ${correctLetter}. Mäletan seda kooliajast!`,
      `Hei! Ma pole 100% kindel, aga 80% tõenäosusega valiksin ${correctLetter}.`,
      `Tere sõber! Kuulsin küsimust... kaldun üsna tugevalt variandi ${correctLetter} poole!`,
    ]
    const advice = {
      friendName: 'Sõber Peeter',
      suggestedChoice: currentQ.correct,
      confidence: currentTierIndex < 10 ? 85 : 60,
      comment: adviceComments[Math.floor(Math.random() * adviceComments.length)],
    }

    setPhoneSeconds(30)
    update({
      lifelines: { ...lifelines, phone_friend: false },
      phase: 'phone_calling',
      phoneTimer: { running: true, secondsLeft: 30, advice },
    })
  }

  // 4. LIFELINE: Vaheta küsimus (Switch Question)
  function handleSwitchQuestion() {
    if (!lifelines.switch_question || !backupQuestions.length) return
    if (!confirm('Kas soovid vahetada praeguse küsimuse uue varuküsimuse vastu?')) return

    const newQ = { ...backupQuestions[0], tier: currentTierIndex + 1, prize: currentLadderStep.prize }
    const remainingBackups = backupQuestions.slice(1)

    miljonarAudio.playFiftyFifty()
    update({
      lifelines: { ...lifelines, switch_question: false },
      questions: questions.map((q, idx) => (idx === currentTierIndex ? newQ : q)),
      backupQuestions: remainingBackups,
      selectedChoice: null,
      isLocked: false,
      eliminatedChoices: [],
      phase: 'question',
    })
  }

  // Next contestant on hot seat
  function handleStartNextContestant() {
    const name = newPlayerName.trim() || `Mängija ${contestantHistory.length + 2}`
    miljonarAudio.startSuspenseDrone(0)
    update({
      contestant: { name, avatar: '👤' },
      currentTierIndex: 0,
      phase: 'question',
      selectedChoice: null,
      isLocked: false,
      eliminatedChoices: [],
      audienceStats: null,
      phoneTimer: null,
      accumulatedBank: 0,
      guaranteedBank: 0,
      wonAmount: 0,
      lifelines: { fifty_fifty: true, ask_audience: true, phone_friend: true, switch_question: true },
    })
    setNewPlayerName('')
  }

  // Select Official Pack
  function loadPack(packType: 'klassika' | 'eesti' | 'peo') {
    let list = MILJONAR_KLASSIKA_QUESTIONS
    if (packType === 'eesti') list = MILJONAR_EESTI_QUESTIONS
    if (packType === 'peo') list = MILJONAR_PEO_QUESTIONS

    const main = list.filter((q) => !q.backup)
    const backups = list.filter((q) => q.backup)

    update({
      questions: main,
      backupQuestions: backups,
      currentTierIndex: 0,
      phase: 'question',
      selectedChoice: null,
      isLocked: false,
      eliminatedChoices: [],
      accumulatedBank: 0,
      guaranteedBank: 0,
      lifelines: { fifty_fifty: true, ask_audience: true, phone_friend: true, switch_question: true },
    })
  }

  // Generate with AI
  async function handleAiGenerate() {
    if (!aiTopic.trim()) return
    setAiGenerating(true)
    try {
      const res = await generateMiljonarQuizWithAi(aiTopic)
      setPreviewQuestions(res.questions)
      setPreviewBackups(res.backupQuestions)
      setPreviewIsAi(res.isAi)
      setPreviewTopic(aiTopic.trim())
      setAiModalOpen(false)
      setPreviewModalOpen(true)
    } finally {
      setAiGenerating(false)
    }
  }

  function handleApplyPreviewQuestions(qs: MiljonarQuestion[], backups: MiljonarQuestion[]) {
    update({
      questions: qs,
      backupQuestions: backups,
      currentTierIndex: 0,
      phase: 'question',
      selectedChoice: null,
      isLocked: false,
      eliminatedChoices: [],
      accumulatedBank: 0,
      guaranteedBank: 0,
      lifelines: { fifty_fifty: true, ask_audience: true, phone_friend: true, switch_question: true },
    })
    setPreviewModalOpen(false)
    setAiTopic('')
  }

  function copyPromptToClipboard() {
    const topic = aiTopic.trim() || 'Üldteadmised, meelelahutus ja Eesti'
    const promptText = `Loo telesaate "Kes tahab saada miljonäriks?" formaadis täpselt 15 küsimust eesti keeles teemal: "${topic}".
Küsimused PEAVAD olema rangelt kasvavas raskusastmes (15 astet: 1-5 lihtsad soojendused, 6-10 keskmised ja faktilised, 11-14 rasked nuputamised, 15 tõeline elitaarne miljoniküsimus).

Vasta AINULT puhta JSON massiivina (ilma markdown jutumärkideta):
[
  {
    "tier": 1,
    "q": "Küsimus 1 tekst",
    "choices": ["Valik A", "Valik B", "Valik C", "Valik D"],
    "correct": 0,
    "hostNote": "Selgitus saatejuhile"
  },
  ...
]`
    navigator.clipboard.writeText(promptText)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2500)
  }

  function handleImportJsonQuestions() {
    setJsonPasteError('')
    try {
      let raw = jsonPasteText.trim()
      if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim()
      if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '').trim()
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed : parsed.questions
      if (!Array.isArray(list) || list.length < 5) {
        throw new Error('JSON peab sisaldama vähemalt 5-15 küsimusega massiivi')
      }
      const formatted: MiljonarQuestion[] = list.slice(0, 15).map((item: any, idx: number) => {
        const step = MILJONAR_LADDER[idx] || { prize: 100, isMilestone: false }
        return {
          id: `m-${Date.now()}-${idx}`,
          tier: idx + 1,
          prize: step.prize,
          q: String(item.q || item.question || `Küsimus ${idx + 1}`),
          choices: Array.isArray(item.choices) && item.choices.length === 4
            ? [String(item.choices[0]), String(item.choices[1]), String(item.choices[2]), String(item.choices[3])]
            : ['Valik A', 'Valik B', 'Valik C', 'Valik D'],
          correct: (typeof item.correct === 'number' && item.correct >= 0 && item.correct <= 3 ? item.correct : 0) as 0 | 1 | 2 | 3,
          hostNote: item.hostNote ? String(item.hostNote) : undefined,
          difficulty: idx < 5 ? 'easy' : idx < 10 ? 'medium' : idx < 14 ? 'hard' : 'expert',
        }
      })
      while (formatted.length < 15) {
        const idx = formatted.length
        const def = MILJONAR_KLASSIKA_QUESTIONS[idx]
        formatted.push({ ...def, tier: idx + 1 })
      }
      update({
        questions: formatted,
        backupQuestions: MILJONAR_KLASSIKA_QUESTIONS.filter((q) => q.backup),
        currentTierIndex: 0,
        phase: 'question',
        selectedChoice: null,
        isLocked: false,
        eliminatedChoices: [],
        accumulatedBank: 0,
        guaranteedBank: 0,
        lifelines: { fifty_fifty: true, ask_audience: true, phone_friend: true, switch_question: true },
      })
      setJsonPasteOpen(false)
      setJsonPasteText('')
      setAiModalOpen(false)
    } catch (e: any) {
      setJsonPasteError(e.message || 'Vigane JSON formaat')
    }
  }

  const letters = ['A', 'B', 'C', 'D'] as const

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-white select-none">
      {/* Top Banner: Host summary & session code */}
      <div className="card-panel p-4 border-gold/40 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 font-bold">
            💰
          </div>
          <div>
            <div className="text-xs text-white/50 uppercase tracking-widest font-display">Mängija toolil</div>
            <div className="font-display text-lg text-gold font-bold">{contestant.name}</div>
          </div>
        </div>

        {/* Current Prize Status */}
        <div className="flex items-center gap-4 text-center">
          <div>
            <div className="text-[10px] text-white/50 uppercase">Praegune summa</div>
            <div className="font-display text-lg text-emerald-400 font-black">
              {formatPrize(accumulatedBank)}
            </div>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div>
            <div className="text-[10px] text-white/50 uppercase">Garanteeritud</div>
            <div className="font-display text-lg text-amber-300 font-black">
              {formatPrize(guaranteedBank)}
            </div>
          </div>
        </div>

        {/* Action buttons: TV Screen, AI, Packs */}
        <div className="flex items-center gap-2 flex-wrap">
          {sessionCode && (
            <a
              href={appUrl(`/ekraan/${sessionCode}`)}
              target="_blank"
              rel="noreferrer"
              className="btn-outline text-xs flex items-center gap-1 !py-1.5 !px-3"
            >
              <ExternalLink size={13} /> Ava teler
            </a>
          )}
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="btn-gold text-xs flex items-center gap-1.5 !py-1.5 !px-3"
          >
            <Sparkles size={14} /> AI Viktoriin
          </button>
        </div>
      </div>

      {/* QUESTION CONTROL CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Question, Answers & Host Actions (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="card-panel p-6 border-cyan-500/40 bg-gradient-to-b from-[#08102b] to-[#04081c] relative">
            <div className="flex items-center justify-between mb-3 text-xs text-cyan-300">
              <span className="font-bold uppercase tracking-wider font-display">
                KÜSIMUS {currentTierIndex + 1} / 15
              </span>
              <span className="font-display font-black text-amber-400 text-sm">
                MÄNGUS ON {currentLadderStep.label}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 leading-snug">
              {currentQ?.q || 'Küsimus laaditakse...'}
            </h2>

            {/* Choices A, B, C, D */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {letters.map((letter, idx) => {
                const choiceText = currentQ?.choices[idx] || ''
                const isCorrect = currentQ?.correct === idx
                const isSelected = selectedChoice === idx
                const isEliminated = eliminatedChoices.includes(idx as 0 | 1 | 2 | 3)

                let btnStyle = 'bg-blue-950/60 border-blue-800 text-white hover:border-amber-400'
                if (isEliminated) {
                  btnStyle = 'bg-black/40 border-slate-800 text-white/25 line-through pointer-events-none'
                } else if (isSelected && isLocked) {
                  btnStyle = 'bg-amber-600 border-amber-300 text-black font-black animate-pulse'
                } else if (isSelected) {
                  btnStyle = 'bg-amber-700/80 border-amber-400 text-white font-bold'
                }

                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleSelectChoice(idx as 0 | 1 | 2 | 3)}
                    disabled={isEliminated}
                    className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between gap-2 ${btnStyle}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-amber-400 text-base">{letter}:</span>
                      <span className="text-sm font-medium">{choiceText}</span>
                    </div>
                    {/* Host eyes-only indicator for correct answer */}
                    {isCorrect && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold shrink-0">
                        ÕIGE ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Host Note / Background facts */}
            {currentQ?.hostNote && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200/80 mb-5">
                <strong className="text-amber-300 mr-1">Hosti selgitus:</strong> {currentQ.hostNote}
              </div>
            )}

            {/* HOST ACTION BAR: Lock, Reveal, Next */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-blue-900/50">
              {/* If answer selected and not locked -> Lock Answer button */}
              {selectedChoice !== null && !isLocked && phase === 'question' && (
                <button
                  type="button"
                  onClick={handleLockAnswer}
                  className="btn-gold flex items-center gap-2 text-base px-6 py-2.5 font-bold animate-bounce"
                >
                  <Lock size={18} /> Lukusta vastus
                </button>
              )}

              {/* If locked -> Reveal Answer button */}
              {isLocked && phase === 'locked' && (
                <button
                  type="button"
                  onClick={handleRevealAnswer}
                  className="btn-gold flex items-center gap-2 text-base px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 font-black"
                >
                  <Eye size={18} /> Avalikusta vastus
                </button>
              )}

              {/* If revealed correct -> Next Question button */}
              {phase === 'revealed_correct' && (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="btn-gold flex items-center gap-2 text-base px-6 py-2.5 font-bold"
                >
                  Järgmine küsimus ({currentTierIndex + 2} / 15) <ChevronRight size={18} />
                </button>
              )}

              {/* Walk Away with Money button */}
              {accumulatedBank > 0 && (phase === 'question' || phase === 'revealed_correct') && (
                <button
                  type="button"
                  onClick={handleWalkAway}
                  className="btn-outline border-amber-500/50 text-amber-300 hover:bg-amber-500/10 flex items-center gap-1.5 text-xs !py-2 !px-4"
                >
                  <DollarSign size={15} /> Lahku rahaga ({formatPrize(accumulatedBank)})
                </button>
              )}

              {/* If Game Over / Won / Walked -> New Game with next contestant */}
              {(phase === 'revealed_wrong' || phase === 'walk_away' || phase === 'won_million') && (
                <button
                  type="button"
                  onClick={() => {
                    update({ phase: 'lobby' })
                  }}
                  className="btn-gold flex items-center gap-2 text-sm px-5"
                >
                  <UserPlus size={16} /> Järgmine mängija kuumale toolile
                </button>
              )}
            </div>
          </div>

          {/* LIFELINES CONTROL CARD */}
          <div className="card-panel p-4 border-white/10 bg-slate-900/60">
            <h3 className="text-xs uppercase tracking-widest text-white/50 font-bold mb-3 font-display">
              Oljenöörid (Õlekõrred)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 50:50 */}
              <button
                type="button"
                onClick={handleFiftyFifty}
                disabled={!lifelines.fifty_fifty || phase !== 'question'}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition ${
                  lifelines.fifty_fifty
                    ? 'border-cyan-400/60 bg-blue-950/60 text-cyan-300 hover:bg-blue-900/60'
                    : 'border-white/10 bg-black/40 text-white/30 line-through'
                }`}
              >
                <span className="font-display font-black text-base">50:50</span>
                <span>{lifelines.fifty_fifty ? 'Kasuta 50:50' : 'Kasutatud'}</span>
              </button>

              {/* Rahva hääl */}
              <button
                type="button"
                onClick={handleAskAudience}
                disabled={!lifelines.ask_audience || phase !== 'question'}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition ${
                  lifelines.ask_audience
                    ? 'border-cyan-400/60 bg-blue-950/60 text-cyan-300 hover:bg-blue-900/60'
                    : 'border-white/10 bg-black/40 text-white/30 line-through'
                }`}
              >
                <Users size={18} />
                <span>{lifelines.ask_audience ? 'Rahva hääl' : 'Kasutatud'}</span>
              </button>

              {/* Helista sõbrale */}
              <button
                type="button"
                onClick={handlePhoneFriend}
                disabled={!lifelines.phone_friend || phase !== 'question'}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition ${
                  lifelines.phone_friend
                    ? 'border-cyan-400/60 bg-blue-950/60 text-cyan-300 hover:bg-blue-900/60'
                    : 'border-white/10 bg-black/40 text-white/30 line-through'
                }`}
              >
                <Phone size={18} />
                <span>{lifelines.phone_friend ? 'Helista sõbrale' : 'Kasutatud'}</span>
              </button>

              {/* Vaheta küsimus */}
              <button
                type="button"
                onClick={handleSwitchQuestion}
                disabled={!lifelines.switch_question || phase !== 'question'}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition ${
                  lifelines.switch_question
                    ? 'border-cyan-400/60 bg-blue-950/60 text-cyan-300 hover:bg-blue-900/60'
                    : 'border-white/10 bg-black/40 text-white/30 line-through'
                }`}
              >
                <Shuffle size={18} />
                <span>{lifelines.switch_question ? 'Vaheta küsimus' : 'Kasutatud'}</span>
              </button>
            </div>

            {/* If active lifeline overlay -> Host close buttons */}
            {phase === 'audience_poll' && (
              <div className="mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                <span className="text-xs text-cyan-200">Rahva hääl on aktiivne teleril.</span>
                <button
                  type="button"
                  onClick={() => update({ phase: 'question' })}
                  className="btn-gold text-xs !py-1 !px-3"
                >
                  Sulge hääletus ja naase küsimuse juurde
                </button>
              </div>
            )}

            {phase === 'phone_calling' && (
              <div className="mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                <span className="text-xs text-cyan-200">
                  Helistamine kestab: <strong>{phoneSeconds} s</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (phoneIntervalRef.current) clearInterval(phoneIntervalRef.current)
                    update({ phase: 'question' })
                  }}
                  className="btn-gold text-xs !py-1 !px-3"
                >
                  Lõpeta kõne
                </button>
              </div>
            )}
          </div>

          {/* QUICK PACK SELECTOR */}
          <div className="card-panel p-4 border-white/10 bg-slate-900/50">
            <h3 className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2 font-display">
              Valmiskomplektid
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadPack('klassika')}
                className="btn-outline text-xs !py-1.5 !px-3"
              >
                🏆 Klassika (15 astet)
              </button>
              <button
                type="button"
                onClick={() => loadPack('eesti')}
                className="btn-outline text-xs !py-1.5 !px-3"
              >
                🇪🇪 Eesti eriversioon
              </button>
              <button
                type="button"
                onClick={() => loadPack('peo')}
                className="btn-outline text-xs !py-1.5 !px-3"
              >
                🎉 Pidu ja meelelahutus
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Ladder & Contestant Manager (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Ladder overview */}
          <div className="card-panel p-4 border-blue-900/60 bg-[#080e29]">
            <h3 className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-2 text-center font-display">
              Võiduredel
            </h3>
            <div className="space-y-1">
              {[...MILJONAR_LADDER].reverse().map((step) => {
                const stepIdx = step.tier - 1
                const isActive = stepIdx === currentTierIndex
                const isPast = stepIdx < currentTierIndex
                const isSafe = step.isMilestone

                let bg = 'hover:bg-white/[0.03]'
                let textCol = isSafe ? 'text-amber-300 font-bold' : 'text-blue-300/70'

                if (isActive) {
                  bg = 'bg-amber-500 text-black font-black shadow-md'
                  textCol = 'text-black'
                } else if (isPast) {
                  bg = 'bg-emerald-950/30'
                  textCol = 'text-emerald-400 font-medium'
                }

                return (
                  <div
                    key={step.tier}
                    className={`flex items-center justify-between px-2.5 py-1 rounded text-xs transition ${bg} ${textCol}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 text-right font-mono">{step.tier}</span>
                      {isSafe && <span className="text-[10px]">◆</span>}
                    </div>
                    <span className="font-mono">{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next contestant manager */}
          <div className="card-panel p-4 border-white/10 bg-slate-900/60">
            <h3 className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2 font-display">
              Järgmine mängija kuumale toolile
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Uue mängija nimi..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="input-field text-xs flex-1"
              />
              <button
                type="button"
                onClick={handleStartNextContestant}
                className="btn-gold text-xs px-3"
              >
                Alusta
              </button>
            </div>
          </div>

          {/* Tonight's Millionaire Leaderboard */}
          {contestantHistory.length > 0 && (
            <div className="card-panel p-4 border-white/10 bg-slate-900/60">
              <h3 className="text-xs uppercase tracking-widest text-gold font-bold mb-2 font-display flex items-center gap-1.5">
                <Trophy size={14} /> Tänased tulemused
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {contestantHistory.map((c, i) => (
                  <div
                    key={c.id || i}
                    className="flex items-center justify-between text-xs py-1 border-b border-white/5"
                  >
                    <span className="text-white font-medium">{c.name}</span>
                    <span className="font-mono font-bold text-amber-300">{formatPrize(c.score)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI QUIZ GENERATOR MODAL */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="card-panel p-6 max-w-lg w-full border-gold/50 bg-[#080e29]">
            <div className="flex items-center gap-2 mb-3 text-gold">
              <Sparkles size={20} />
              <h3 className="text-xl font-display font-bold">Loo 15-astmeline Miljonäri mäng tehisintellektiga</h3>
            </div>
            <p className="text-white/70 text-xs mb-4">
              Sisesta teema (nt "Eesti popmuusika", "Ajalugu ja sõjad", "Filmiklassika", "Õlle- ja toidukultuur",
              "Firma sünnipäev"). AI loob täieliku 15-astmelise kasvava raskuskõveraga komplekti!
            </p>

            <input
              type="text"
              placeholder="Teema (nt Eesti popmuusika, Filmiklassika, Teadus)..."
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="input-field mb-3 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAiGenerate()
                }
              }}
            />

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={copyPromptToClipboard}
                className="btn-outline text-xs flex items-center gap-1.5 !py-1.5 !px-3"
              >
                {copiedPrompt ? (
                  <>
                    <Check size={13} className="text-emerald-400" /> ChatGPT Prompt kopeeritud!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Kopeeri ChatGPT / Gemini prompt
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setJsonPasteOpen(!jsonPasteOpen)}
                className="btn-outline text-xs flex items-center gap-1.5 !py-1.5 !px-3"
              >
                <Upload size={13} /> Kleebi valmis JSON
              </button>
            </div>

            {jsonPasteOpen && (
              <div className="card-panel p-3.5 mb-4 border-gold/40 bg-slate-900/90 space-y-2">
                <p className="text-xs text-gold/80 font-bold">Kleebi ChatGPT või Gemini vastus:</p>
                <textarea
                  placeholder='[ { "tier": 1, "q": "...", "choices": ["A","B","C","D"], "correct": 0 }, ... ]'
                  className="input-field font-mono text-xs min-h-[120px]"
                  value={jsonPasteText}
                  onChange={(e) => setJsonPasteText(e.target.value)}
                />
                {jsonPasteError && <p className="text-accent-red text-xs">{jsonPasteError}</p>}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleImportJsonQuestions}
                    className="btn-gold text-xs px-3"
                  >
                    Laadi küsimused mängu
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAiModalOpen(false)
                  setJsonPasteOpen(false)
                }}
                disabled={aiGenerating}
                className="btn-outline text-xs px-4"
              >
                Sulge
              </button>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiGenerating || !aiTopic.trim()}
                className="btn-gold text-xs flex items-center gap-2 px-5"
              >
                {aiGenerating ? (
                  <>Genereerin 15 astet...</>
                ) : (
                  <>
                    <Sparkles size={14} /> Genereeri otse lehelt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATED PREVIEW MODAL */}
      <MiljonarAiPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onApply={handleApplyPreviewQuestions}
        generatedQuestions={previewQuestions}
        generatedBackups={previewBackups}
        topic={previewTopic}
        isAi={previewIsAi}
        onRegenerate={() => {
          setPreviewModalOpen(false)
          setAiModalOpen(true)
        }}
      />
    </div>
  )
}
