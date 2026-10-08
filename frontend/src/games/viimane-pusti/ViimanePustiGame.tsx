import { useState } from 'react'
import { Sparkles, Trophy, Undo2 } from 'lucide-react'
import type { ViimanePustiPackData } from '@/data/official-packs'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import GameAiModal from '@/components/GameAiModal'
import { generateViimanePustiAi } from '@/lib/aiGameGenerators'

type Player = { name: string; lives: number; standing: boolean }

export type ViimanePustiState = {
  players: Player[]
  statements: string[]
  index: number
  startingLives: number
  packData: ViimanePustiPackData
  lastHit?: { index: number; player: Player }
  code?: string
}

type Props = {
  state: ViimanePustiState
  update: (p: Partial<ViimanePustiState> | ((s: ViimanePustiState) => ViimanePustiState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function ViimanePustiGame({ state, update, isHost = true, sessionCode }: Props) {
  const { players, statements, index, startingLives } = state
  const { t } = useI18n()
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const standing = players.filter((p) => p.standing && p.lives > 0)
  const winner = players.length > 1 && standing.length === 1 ? standing[0] : null
  const over = players.length > 1 && standing.length <= 1
  const exhausted = index >= statements.length

  function next() {
    if (!isHost || over || exhausted) return
    update({ index: index + 1, lastHit: undefined })
  }

  function hit(i: number) {
    if (!isHost || over) return
    update((prev) => {
      if (!prev.players[i]?.standing || prev.players[i].lives <= 0) return prev
      const previousPlayer = prev.players[i]
      const players = prev.players.map((p, idx) => {
        if (idx !== i) return p
        const lives = Math.max(0, p.lives - 1)
        return { ...p, lives, standing: lives > 0 }
      })
      return { ...prev, players, lastHit: { index: i, player: previousPlayer } }
    })
  }

  function addPlayer() {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        { name: `Mängija ${prev.players.length + 1}`, lives: prev.startingLives, standing: true },
      ],
    }))
  }

  function undoHit() {
    if (!isHost) return
    update(prev => prev.lastHit ? {
      ...prev,
      players: prev.players.map((p, i) => i === prev.lastHit!.index ? prev.lastHit!.player : p),
      lastHit: undefined,
    } : prev)
  }

  function resetGame() {
    if (!isHost || !confirm(t('resetScoresConfirm'))) return
    update(prev => ({ ...prev, index: 0, lastHit: undefined, players: prev.players.map(p => ({ ...p, lives: prev.startingLives, standing: true })) }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {isHost && <SessionCodeBadge code={sessionCode} />}
      {isHost && (
        <GameToolbar onReset={resetGame}
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

      <div className="flex justify-between items-center text-sm text-white/50 mb-3"><span>{standing.length} / {players.length} mängijat püsti</span><span>Voor {Math.min(index + 1, statements.length)} / {statements.length}</span></div>
      {over ? (
        <div className="party-stage p-10 text-center mb-6 border-gold shadow-gold">
          <Trophy className="mx-auto text-gold mb-4" size={48} /><p className="text-gold font-display text-xl mb-2">{winner ? t('lastStanding') : 'Kõik langesid välja'}</p>
          <h2 className="text-4xl font-black text-white">{winner?.name || 'Viik!'}</h2>
        </div>
      ) : (
        <div className="party-stage p-8 sm:p-12 text-center mb-6">
          <p className="text-white/50 text-sm uppercase tracking-widest mb-3">{t('statement')}</p>
          <h2 className="text-2xl font-bold text-white">{exhausted ? 'Kõik väited mängitud!' : statements[index] || 'Lisa väited, et alustada'}</h2>
          {isHost && (
            <button disabled={exhausted || !statements.length || !players.length} onClick={next} className="btn-gold mt-6 disabled:opacity-40">
              {t('next')}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {players.map((p, i) => (
          <button
            key={i}
            disabled={!isHost || !p.standing || over}
            onClick={() => hit(i)}
            aria-label={`${p.name}, ${p.lives} elu${isHost ? ', kaota üks elu' : ''}`}
            className={`party-score-card text-center ${!p.standing ? 'opacity-40' : 'hover:border-accent-red'}`}
          >
            <div className="font-bold text-gold">{p.name}</div>
            <div className="flex justify-center gap-1 mt-3" aria-hidden="true">{Array.from({ length: startingLives }, (_, n) => <span key={n} className={`w-3 h-3 rounded-full ${n < p.lives ? 'bg-rose-400 shadow-[0_0_8px_#fb718555]' : 'bg-white/10'}`} />)}</div><div className="text-white/40 text-xs mt-2">{p.standing ? `${p.lives} elu` : 'Väljas'}</div>
          </button>
        ))}
      </div>

      {isHost && state.lastHit && <button onClick={undoHit} className="btn-outline text-sm flex items-center gap-2 mx-auto mb-4"><Undo2 size={14} />Võta tagasi: {state.lastHit.player.name}</button>}
      {isHost && (
        <button onClick={addPlayer} className="btn-outline text-sm mx-auto block">
          {t('addPlayer')}
        </button>
      )}

      {/* AI GENERATION MODAL */}
      <GameAiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Genereeri 'Viimane püsti' väited AI-ga"
        subtitle="Sisesta teema ja AI genereerib 30 haaravat elimineerimisväidet"
        presetTopics={['Lõbusad elukogemused', 'Töö ja harjumused', 'Eesti argielu', 'Lapsepõlv & seiklused']}
        defaultTopic="Lõbusad elukogemused, harjumused ja seiklused"
        promptTemplate='Genereeri täpselt 30 eestikeelset elimineerimisväidet seltskonnamängule "Viimane püsti" (Last Man Standing) teemal: "{TOPIC}". Vasta puhta JSON massiivina stringidest.'
        generateFn={(topic) => generateViimanePustiAi(topic, 30)}
        onApply={(list) => {
          update({
            statements: list,
            index: 0,
            lastHit: undefined,
          })
        }}
        renderPreview={(list) => (
          <div className="space-y-2">
            <div className="text-xs text-white/60">Kokku {list.length} väidet:</div>
            <div className="space-y-1 max-h-60 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-white/5">
              {list.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-800/80 text-xs text-white font-medium border border-white/5"
                >
                  {idx + 1}. {item}
                </div>
              ))}
            </div>
          </div>
        )}
      />
    </div>
  )
}
