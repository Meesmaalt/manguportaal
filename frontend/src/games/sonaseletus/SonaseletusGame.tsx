import { advanceWord } from './round'
import { useEffect, useRef, useState } from 'react'
import { Sparkles, Trophy, Pause } from 'lucide-react'
import type { SonaseletusPackData } from '@/data/official-packs'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import GameAiModal from '@/components/GameAiModal'
import { generateSonaseletusAi } from '@/lib/aiGameGenerators'

type Team = { name: string; score: number }

export type SonaseletusState = {
  teams: Team[]
  activeTeam: number
  words: string[]
  wordIndex: number
  roundSeconds: number
  timeLeft: number
  running: boolean
  packData: SonaseletusPackData
  code?: string
}

type Props = {
  state: SonaseletusState
  update: (p: Partial<SonaseletusState> | ((s: SonaseletusState) => SonaseletusState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function SonaseletusGame({ state, update, isHost = true, sessionCode }: Props) {
  const { teams, activeTeam, words, wordIndex, roundSeconds, timeLeft, running } = state
  const { t } = useI18n()
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running || !isHost) return
    timerRef.current = window.setInterval(() => {
      update((prev) => {
        if (prev.timeLeft <= 1) {
          return { ...prev, timeLeft: 0, running: false }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running, isHost])

  function startRound() {
    if (!isHost || !teams.length || wordIndex >= words.length) return
    update({ timeLeft: timeLeft > 0 ? timeLeft : roundSeconds, running: true })
  }

  function correct() {
    if (!isHost || !running) return
    update(prev => advanceWord(prev, true))
  }

  function skip() {
    if (!isHost || !running) return
    update(prev => advanceWord(prev, false))
  }

  function nextTeam() {
    if (!isHost || running || !teams.length) return
    update({
      activeTeam: (activeTeam + 1) % teams.length,
      running: false,
      timeLeft: roundSeconds,
    })
  }

  function resetGame() {
    if (!isHost) return
    if (!confirm(t('resetScoresConfirm'))) return
    update({
      teams: teams.map((t) => ({ ...t, score: 0 })),
      wordIndex: 0,
      running: false,
      timeLeft: roundSeconds,
      activeTeam: 0,
    })
  }

  const exhausted = wordIndex >= words.length
  const word = words[wordIndex] || '—'
  const leaderScore = Math.max(0, ...teams.map(team => team.score))
  const leaders = teams.filter(team => team.score === leaderScore)
  const timerFraction = Math.max(0, Math.min(1, timeLeft / Math.max(1, roundSeconds)))

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div id="game-scale-root">
      {isHost && <SessionCodeBadge code={sessionCode} />}
      {isHost && (
        <GameToolbar
          onReset={resetGame}
          extra={
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1 border-gold text-gold bg-gold/10 hover:bg-gold hover:text-black font-semibold"
            >
              <Sparkles size={13} />
              Loo AI-ga
            </button>
          }
        />
      )}

      <div className="party-stage p-6 sm:p-8 text-center mb-6">
        <div className="text-white/60 text-sm uppercase tracking-widest mb-4">
          {teams[activeTeam]?.name} · {running ? t('round') : exhausted ? 'Pakk läbi' : timeLeft === 0 ? 'Voor lõppenud' : 'Valmis?'}
        </div>
        <div className={`round-timer ${timeLeft <= 10 && running ? 'text-accent-red' : 'text-gold'}`} role="timer" aria-label={`${timeLeft} ${t('seconds')}`}>
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="timer-track" cx="60" cy="60" r="54" /><circle className="timer-progress" cx="60" cy="60" r="54" strokeDasharray={339.3} strokeDashoffset={339.3 * (1-timerFraction)} /></svg>
          <span className="font-display text-5xl font-black tabular-nums">{timeLeft}</span>
          <span className="text-white/50 text-xs">{t('seconds')}</span>
        </div>
        <div className="min-h-[150px] flex flex-col justify-center gap-3 py-6">
          {exhausted ? <><Trophy className="mx-auto text-gold" size={36} /><h2 className="font-display text-3xl font-black">Kõik sõnad mängitud!</h2><p className="text-white/60">{leaders.map(team => team.name).join(' & ')} · {leaderScore} punkti</p></> :
          <><h2 className="font-display text-4xl md:text-5xl text-white font-black break-words">{running ? word : timeLeft === 0 ? 'Aeg on läbi!' : 'Seleta. Arva. Võida.'}</h2>
          {!running && <p className="text-white/50 text-sm">Sõna ilmub vooru alustamisel.</p>}</>}
        </div>
        <p className="text-white/40 text-xs">{Math.min(wordIndex, words.length)} / {words.length} sõna mängitud</p>
      </div>

      {isHost && (
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {!running ? (
            <button disabled={exhausted || !words.length || !teams.length} onClick={startRound} className="btn-gold text-lg px-8 disabled:opacity-40">
              {timeLeft > 0 && timeLeft < roundSeconds ? 'Jätka' : t('start')} ({timeLeft > 0 ? timeLeft : roundSeconds}s)
            </button>
          ) : (
            <>
              <button onClick={correct} className="btn-gold bg-accent-green border-0 text-lg px-6">
                ✓ {t('correct')}
              </button>
              <button onClick={() => update({ running: false })} className="btn-outline" aria-label="Peata voor"><Pause size={20} /></button>
              <button onClick={skip} className="btn-outline text-lg px-6">
                → {t('skip')}
              </button>
            </>
          )}
          <button disabled={running || exhausted || !teams.length} onClick={nextTeam} className="btn-outline text-sm disabled:opacity-40">
            {t('nextTeam')}
          </button>

        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {teams.map((t, i) => (
          <div
            key={i}
            className={`party-score-card text-center ${i === activeTeam ? 'active' : 'opacity-70'}`}
          >
            <div className="font-display text-gold font-bold">{t.name}</div>
            <div className="text-3xl font-display font-black">{t.score}</div>
          </div>
        ))}
      </div>
      </div>

      {/* AI GENERATION MODAL */}
      <GameAiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Genereeri Sõnaseletuse / Aliase kaardid AI-ga"
        subtitle="Sisesta teema ja AI genereerib 50 põnevat sõna/mõistet mängimiseks"
        presetTopics={['Eesti kuulsused ja kohad', '90ndate nostalgia', 'Toidud & joogid', 'Ametid & hobid', 'Peod & meelelahutus']}
        defaultTopic="Eesti kuulsused, popkultuur ja argielu"
        promptTemplate='Genereeri täpselt 50 eestikeelset sõna/mõistet lauamängule "Alias / Sõnaseletus" teemal: "{TOPIC}". Vasta puhta JSON massiivina stringidest.'
        generateFn={(topic) => generateSonaseletusAi(topic, 50)}
        onApply={(wordsList) => {
          update({
            words: wordsList,
            wordIndex: 0,
            running: false,
            timeLeft: roundSeconds,
          })
        }}
        renderPreview={(wordsList) => (
          <div className="space-y-2">
            <div className="text-xs text-white/60">Kokku {wordsList.length} sõna:</div>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-white/5">
              {wordsList.map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-white font-medium border border-white/10"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
      />
    </div>
  )
}
