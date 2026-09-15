import { useEffect, useState } from 'react'
import { Play, Check, ChevronRight, X } from 'lucide-react'
import type { RoosidesodaState, FinalRoundPlayerState } from './types'
import { playSound, sounds, playFx } from '@/lib/audio'

type Props = {
  state: RoosidesodaState
  update: (mod: Partial<RoosidesodaState>) => void
  isHost: boolean
}

export default function RoosidesodaFastMoney({ state, update, isHost }: Props) {
  const finalPhase = state.finalPhase || 'intro'
  const p1 = state.p1 || { answers: Array(5).fill({ text: '', points: 0 }), revealedCount: 0 }
  const p2 = state.p2 || { answers: Array(5).fill({ text: '', points: 0 }), revealedCount: 0 }
  
  const finalRound = state.packData.finalRound || []
  
  // Local timer state for display
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!state.finalTimerEndsAt) return
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((state.finalTimerEndsAt! - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        if (isHost && (finalPhase === 'p1_timer' || finalPhase === 'p2_timer')) {
          playSound(sounds.roosError) // Buzzer when time is up
        }
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [state.finalTimerEndsAt, finalPhase, isHost])

  function startTimer(seconds: number) {
    if (!isHost) return
    update({ finalTimerEndsAt: Date.now() + seconds * 1000 })
  }

  function handleInput(player: 'p1' | 'p2', idx: number, field: 'text' | 'points', value: any) {
    if (!isHost) return
    const nextState = player === 'p1' ? { ...p1 } : { ...p2 }
    nextState.answers = [...nextState.answers]
    nextState.answers[idx] = { ...nextState.answers[idx], [field]: value }
    update({ [player]: nextState })
  }

  function revealNext(player: 'p1' | 'p2') {
    if (!isHost) return
    const pState = player === 'p1' ? p1 : p2
    if (pState.revealedCount < 10) {
      if (pState.revealedCount % 2 === 1) {
        // revealing points
        const points = pState.answers[Math.floor(pState.revealedCount / 2)].points
        if (points > 0) playSound(sounds.roosCorrect)
        else playSound(sounds.roosError)
      } else {
        // revealing text
        playFx('reveal') // A subtle swoosh
      }
      update({
        [player]: { ...pState, revealedCount: pState.revealedCount + 1 }
      })
    }
  }

  // --- TV VIEW ---
  if (!isHost) {
    if (finalPhase === 'intro') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-500">
          <h1 className="text-5xl md:text-8xl font-display font-bold text-gold drop-shadow-[0_0_20px_rgba(223,179,66,0.6)] text-center mb-8 uppercase">
            Suur Finaal
          </h1>
        </div>
      )
    }

    if (finalPhase === 'p1_timer' || finalPhase === 'p2_timer') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300">
          <div className="text-[180px] md:text-[250px] font-display font-bold text-white drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] leading-none tabular-nums tracking-tighter">
            {timeLeft}
          </div>
        </div>
      )
    }

    // Board View
    const totalP1 = p1.revealedCount > 0 ? p1.answers.slice(0, Math.floor(p1.revealedCount / 2)).reduce((sum, a) => sum + (a.points || 0), 0) : 0
    const totalP2 = p2.revealedCount > 0 ? p2.answers.slice(0, Math.floor(p2.revealedCount / 2)).reduce((sum, a) => sum + (a.points || 0), 0) : 0
    const grandTotal = totalP1 + totalP2

    return (
      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-[1fr_80px_1fr_80px] md:grid-cols-[1fr_100px_1fr_100px] gap-2 md:gap-4 w-full bg-blue-950/40 p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
          {Array(5).fill(0).map((_, i) => {
            const p1TextVisible = p1.revealedCount > i * 2
            const p1PtsVisible = p1.revealedCount > i * 2 + 1
            const p2TextVisible = p2.revealedCount > i * 2
            const p2PtsVisible = p2.revealedCount > i * 2 + 1

            return (
              <div key={i} className="contents text-lg md:text-3xl font-display uppercase tracking-widest font-bold">
                {/* P1 Text */}
                <div className="bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-blue-400/50 rounded-lg flex items-center px-4 md:px-6 py-3 md:py-4 shadow-inner overflow-hidden relative">
                  {p1TextVisible ? (
                    <span className="text-white drop-shadow-md truncate">{p1.answers[i].text || '---'}</span>
                  ) : (
                    <span className="text-white/10">...</span>
                  )}
                </div>
                {/* P1 Pts */}
                <div className="bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-blue-400/50 rounded-lg flex items-center justify-center py-3 md:py-4 shadow-inner text-cyan-300">
                  {p1PtsVisible ? p1.answers[i].points || 0 : '-'}
                </div>

                {/* P2 Text */}
                <div className="bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-blue-400/50 rounded-lg flex items-center px-4 md:px-6 py-3 md:py-4 shadow-inner overflow-hidden relative">
                  {finalPhase === 'p2_reveal' || finalPhase === 'end' ? (
                    p2TextVisible ? (
                      <span className="text-white drop-shadow-md truncate">{p2.answers[i].text || '---'}</span>
                    ) : (
                      <span className="text-white/10">...</span>
                    )
                  ) : (
                    <span className="text-white/10"></span> // Hidden during P1 reveal or intro
                  )}
                </div>
                {/* P2 Pts */}
                <div className="bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-blue-400/50 rounded-lg flex items-center justify-center py-3 md:py-4 shadow-inner text-cyan-300">
                  {finalPhase === 'p2_reveal' || finalPhase === 'end' ? (
                    p2PtsVisible ? p2.answers[i].points || 0 : '-'
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grand Total */}
        <div className="mt-8 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4">
          <div className="text-gold/60 text-sm md:text-lg uppercase tracking-[0.2em] font-bold mb-1">
            KOKKU
          </div>
          <div className="bg-blue-950/80 border-4 border-gold/50 rounded-2xl px-12 py-4 text-5xl md:text-7xl font-display font-bold text-gold drop-shadow-[0_0_15px_rgba(223,179,66,0.4)]">
            {grandTotal}
          </div>
        </div>
        
        {finalPhase === 'end' && grandTotal >= 200 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            <h2 className="text-6xl md:text-9xl font-display font-bold text-gold drop-shadow-[0_0_40px_rgba(223,179,66,1)] animate-bounce rotate-[-5deg]">
              VÕITJAD!
            </h2>
          </div>
        )}
      </div>
    )
  }

  // --- HOST VIEW ---
  return (
    <div className="flex flex-col h-full bg-[#030917] overflow-y-auto">
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#030917]/95 backdrop-blur z-10">
        <div>
          <h2 className="text-gold font-display font-bold uppercase">SUUR FINAAL</h2>
          <div className="text-xs text-white/50">{finalPhase}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => update({ finalPhase: 'none' })}
            className="btn-outline text-xs !py-1 !px-2 text-white/40 border-white/20"
          >
            Välju finaalist
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Controls based on phase */}
        {finalPhase === 'intro' && (
          <div className="card-panel p-6 flex flex-col items-center justify-center gap-4">
            <p className="text-white/70 text-center">Teleris kuvatakse "Suur Finaal". Mängija 1 on valmis.</p>
            <button
              onClick={() => update({ finalPhase: 'p1_timer' })}
              className="btn-gold px-8 py-3 rounded-xl font-bold uppercase tracking-wider"
            >
              Edasi: Mängija 1 kell (20s)
            </button>
          </div>
        )}

        {finalPhase === 'p1_timer' && (
          <div className="card-panel p-6 flex flex-col items-center justify-center gap-6">
            <div className="text-6xl font-display font-bold text-white">{timeLeft}s</div>
            <div className="flex gap-3">
              <button
                onClick={() => startTimer(20)}
                className="btn-outline px-6"
              >
                Start 20s
              </button>
              <button
                onClick={() => update({ finalPhase: 'p1_input' })}
                className="btn-gold px-6"
              >
                Aeg läbi - Sisesta vastused
              </button>
            </div>
            {finalRound.length > 0 && (
              <div className="w-full text-left bg-black/30 p-4 rounded-xl space-y-2 mt-4 text-sm text-white/80">
                <p className="font-bold text-gold">Küsimused abiks:</p>
                {finalRound.map((q, i) => <p key={i}>{i+1}. {q.question}</p>)}
              </div>
            )}
          </div>
        )}

        {finalPhase === 'p1_input' && (
          <div className="card-panel p-4 space-y-4">
            <h3 className="font-bold text-cyan-300 border-b border-white/10 pb-2">Mängija 1 Vastused</h3>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="text-white/50 text-xs w-6">{i+1}.</div>
                <input
                  type="text"
                  placeholder="Vastus..."
                  className="input-field flex-1"
                  value={p1.answers[i].text}
                  onChange={e => handleInput('p1', i, 'text', e.target.value)}
                />
                <select
                  className="input-field w-24 sm:w-32 text-cyan-300"
                  value={p1.answers[i].points}
                  onChange={e => handleInput('p1', i, 'points', Number(e.target.value))}
                >
                  <option value={0}>0 p</option>
                  {finalRound[i]?.answers?.map(a => (
                    <option key={a.text} value={a.points}>{a.points}p ({a.text})</option>
                  ))}
                  {/* Manual point options if AI didn't provide enough or they said something else */}
                  {[...Array(100)].map((_, idx) => {
                    const val = 100 - idx;
                    return <option key={`man-${val}`} value={val}>{val}p</option>
                  })}
                </select>
              </div>
            ))}
            <button
              onClick={() => update({ finalPhase: 'p1_reveal' })}
              className="btn-gold w-full py-3 mt-4"
            >
              Edasi: Ava Mängija 1 vastused teleris
            </button>
          </div>
        )}

        {finalPhase === 'p1_reveal' && (
          <div className="card-panel p-6 flex flex-col items-center justify-center gap-4">
            <p className="text-white/70">Ava teleris Mängija 1 vastused ja punktid (kliki nuppe ükshaaval).</p>
            <button
              onClick={() => revealNext('p1')}
              disabled={p1.revealedCount >= 10}
              className="btn-gold px-8 py-3 rounded-xl font-bold uppercase tracking-wider"
            >
              Ava Järgmine ({p1.revealedCount < 10 ? (p1.revealedCount % 2 === 0 ? 'Tekst' : 'Punktid') : 'Valmis'})
            </button>
            {p1.revealedCount >= 10 && (
              <button
                onClick={() => update({ finalPhase: 'p2_intro' })}
                className="btn-outline px-6 py-2 mt-4 text-cyan-300 border-cyan-500/50"
              >
                Edasi: Mängija 2
              </button>
            )}
          </div>
        )}

        {finalPhase === 'p2_intro' && (
           <div className="card-panel p-6 flex flex-col items-center justify-center gap-4">
           <p className="text-white/70 text-center">Teleris on pilt ees. Mängija 2 on valmis (ta ei näinud Mängija 1 vastuseid).</p>
           <button
             onClick={() => update({ finalPhase: 'p2_timer' })}
             className="btn-gold px-8 py-3 rounded-xl font-bold uppercase tracking-wider"
           >
             Edasi: Mängija 2 kell (25s)
           </button>
         </div>
        )}

        {finalPhase === 'p2_timer' && (
          <div className="card-panel p-6 flex flex-col items-center justify-center gap-6">
            <div className="text-6xl font-display font-bold text-white">{timeLeft}s</div>
            <div className="flex gap-3">
              <button
                onClick={() => startTimer(25)}
                className="btn-outline px-6"
              >
                Start 25s
              </button>
              <button
                onClick={() => update({ finalPhase: 'p2_input' })}
                className="btn-gold px-6"
              >
                Aeg läbi - Sisesta vastused
              </button>
            </div>
             {finalRound.length > 0 && (
              <div className="w-full text-left bg-black/30 p-4 rounded-xl space-y-2 mt-4 text-sm text-white/80">
                <p className="font-bold text-gold">Küsimused abiks:</p>
                {finalRound.map((q, i) => <p key={i}>{i+1}. {q.question}</p>)}
              </div>
            )}
          </div>
        )}

        {finalPhase === 'p2_input' && (
          <div className="card-panel p-4 space-y-4">
            <h3 className="font-bold text-cyan-300 border-b border-white/10 pb-2">Mängija 2 Vastused</h3>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="text-white/50 text-xs w-6">{i+1}.</div>
                <input
                  type="text"
                  placeholder="Vastus..."
                  className="input-field flex-1"
                  value={p2.answers[i].text}
                  onChange={e => handleInput('p2', i, 'text', e.target.value)}
                />
                <select
                  className="input-field w-24 sm:w-32 text-cyan-300"
                  value={p2.answers[i].points}
                  onChange={e => handleInput('p2', i, 'points', Number(e.target.value))}
                >
                  <option value={0}>0 p</option>
                  {finalRound[i]?.answers?.map(a => (
                    <option key={a.text} value={a.points}>{a.points}p ({a.text})</option>
                  ))}
                  {[...Array(100)].map((_, idx) => {
                    const val = 100 - idx;
                    return <option key={`man-${val}`} value={val}>{val}p</option>
                  })}
                </select>
              </div>
            ))}
            <button
              onClick={() => update({ finalPhase: 'p2_reveal' })}
              className="btn-gold w-full py-3 mt-4"
            >
              Edasi: Ava Mängija 2 vastused teleris
            </button>
          </div>
        )}

        {finalPhase === 'p2_reveal' && (
          <div className="card-panel p-6 flex flex-col items-center justify-center gap-4">
            <p className="text-white/70">Ava teleris Mängija 2 vastused ja punktid.</p>
            <button
              onClick={() => revealNext('p2')}
              disabled={p2.revealedCount >= 10}
              className="btn-gold px-8 py-3 rounded-xl font-bold uppercase tracking-wider"
            >
              Ava Järgmine ({p2.revealedCount < 10 ? (p2.revealedCount % 2 === 0 ? 'Tekst' : 'Punktid') : 'Valmis'})
            </button>
            {p2.revealedCount >= 10 && (
              <button
                onClick={() => {
                  update({ finalPhase: 'end', confettiAt: Date.now() })
                }}
                className="btn-outline px-6 py-2 mt-4 border-gold text-gold hover:bg-gold hover:text-black"
              >
                Mäng läbi (Lõpp)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
