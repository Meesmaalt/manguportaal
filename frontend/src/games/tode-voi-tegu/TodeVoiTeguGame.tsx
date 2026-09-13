import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { TodeVoiTeguPackData } from '@/data/official-packs'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import GameAiModal from '@/components/GameAiModal'
import { generateTodeVoiTeguAi } from '@/lib/aiGameGenerators'

type Player = { name: string }

export type TodeVoiTeguState = {
  players: Player[]
  currentPlayer: number
  truths: string[]
  dares: string[]
  currentCard: { type: 'truth' | 'dare'; text: string } | null
  packData: TodeVoiTeguPackData
  code?: string
}

type Props = {
  state: TodeVoiTeguState
  update: (p: Partial<TodeVoiTeguState> | ((s: TodeVoiTeguState) => TodeVoiTeguState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function TodeVoiTeguGame({ state, update, isHost = true, sessionCode }: Props) {
  const { players, currentPlayer, truths, dares, currentCard } = state
  const { t } = useI18n()
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const player = players[currentPlayer]

  function draw(type: 'truth' | 'dare') {
    if (!isHost) return
    const pool = type === 'truth' ? truths : dares
    const text = pool[Math.floor(Math.random() * pool.length)] || '—'
    update({ currentCard: { type, text } })
  }

  function nextPlayer() {
    if (!isHost) return
    update({
      currentPlayer: (currentPlayer + 1) % players.length,
      currentCard: null,
    })
  }

  function addPlayer() {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: [...prev.players, { name: `Mängija ${prev.players.length + 1}` }],
    }))
  }

  function rename(i: number, name: string) {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: prev.players.map((p, idx) => (idx === i ? { name } : p)),
    }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {isHost && <SessionCodeBadge code={sessionCode} />}
      {isHost && (
        <GameToolbar
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

      <div className="text-center mb-6">
        <p className="text-white/50 text-sm uppercase tracking-widest">{t('nowPlaying')}</p>
        <h2 className="font-display text-3xl text-gold font-black">{player?.name || '—'}</h2>
      </div>

      {currentCard ? (
        <div className="card-panel p-8 text-center mb-6 border-gold/50">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">
            {currentCard.type === 'truth' ? t('truth') : t('dare')}
          </p>
          <p className="text-2xl font-bold text-white leading-snug">{currentCard.text}</p>
          {isHost && (
            <button onClick={nextPlayer} className="btn-gold mt-6">
              {t('doneNextPlayer')}
            </button>
          )}
        </div>
      ) : (
        isHost && (
          <div className="flex justify-center gap-4 mb-8">
            <button onClick={() => draw('truth')} className="btn-gold text-lg px-8 py-4">
              Tõde
            </button>
            <button onClick={() => draw('dare')} className="btn-outline text-lg px-8 py-4 border-accent-red text-accent-red hover:bg-accent-red hover:text-white">
              Tegu
            </button>
          </div>
        )
      )}

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {players.map((p, i) =>
          isHost ? (
            <input
              key={i}
              className={`input-field w-auto max-w-[140px] text-center text-sm ${
                i === currentPlayer ? 'border-gold' : ''
              }`}
              value={p.name}
              onChange={(e) => rename(i, e.target.value)}
            />
          ) : (
            <span
              key={i}
              className={`px-3 py-1.5 rounded-full text-sm ${
                i === currentPlayer ? 'bg-gold text-bg font-bold' : 'bg-white/10'
              }`}
            >
              {p.name}
            </span>
          )
        )}
      </div>

      {isHost && (
        <button onClick={addPlayer} className="btn-outline text-sm mx-auto block">
          {t('addPlayer')}
        </button>
      )}

      {/* AI GENERATION MODAL */}
      <GameAiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Genereeri Tõde või Tegu kaardid AI-ga"
        subtitle="Sisesta teema ja AI genereerib 20 tõde ja 20 tegu"
        presetTopics={['Sõprade peoõhtu', 'Perekond ja lapsed', 'Romantiline & paarid', 'Naljakas & julge']}
        defaultTopic="Sõprade peoõhtu ja seltskonnamängud"
        promptTemplate='Genereeri täpselt 20 tõde ("truths") ja 20 tegu ("dares") seltskonnamängule "Tõde või tegu" teemal: "{TOPIC}". Vasta puhta JSON objektina.'
        generateFn={(topic) => generateTodeVoiTeguAi(topic, 20)}
        onApply={(data) => {
          update({
            truths: data.truths || [],
            dares: data.dares || [],
            currentCard: null,
          })
        }}
        renderPreview={(data) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-gold/30">
              <span className="font-display font-bold text-xs text-gold uppercase tracking-wider block mb-2">
                Tõed ({data.truths?.length || 0}):
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {data.truths?.map((t, idx) => (
                  <p key={idx} className="text-xs text-white/90 p-1.5 rounded bg-slate-950/60">
                    {idx + 1}. {t}
                  </p>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-accent-red/30">
              <span className="font-display font-bold text-xs text-accent-red uppercase tracking-wider block mb-2">
                Teod ({data.dares?.length || 0}):
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {data.dares?.map((d, idx) => (
                  <p key={idx} className="text-xs text-white/90 p-1.5 rounded bg-slate-950/60">
                    {idx + 1}. {d}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}
