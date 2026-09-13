import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { MaEiOleKunagiPackData } from '@/data/official-packs'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import GameAiModal from '@/components/GameAiModal'
import { generateMaEiOleKunagiAi } from '@/lib/aiGameGenerators'

type Player = { name: string; lives: number }

export type MaEiOleKunagiState = {
  players: Player[]
  statements: string[]
  index: number
  packData: MaEiOleKunagiPackData
  code?: string
}

type Props = {
  state: MaEiOleKunagiState
  update: (p: Partial<MaEiOleKunagiState> | ((s: MaEiOleKunagiState) => MaEiOleKunagiState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function MaEiOleKunagiGame({ state, update, isHost = true, sessionCode }: Props) {
  const { players, statements, index } = state
  const { t } = useI18n()
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const current = statements[index]

  function next() {
    if (!isHost) return
    update({ index: (index + 1) % statements.length })
  }

  function loseLife(i: number) {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: prev.players.map((p, idx) =>
        idx === i ? { ...p, lives: Math.max(0, p.lives - 1) } : p
      ),
    }))
  }

  function addPlayer() {
    if (!isHost) return
    update((prev) => ({
      ...prev,
      players: [...prev.players, { name: `Mängija ${prev.players.length + 1}`, lives: 3 }],
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

      <div className="card-panel p-8 text-center mb-6">
        <p className="text-white/50 text-sm uppercase tracking-widest mb-3">{t('statement')}</p>
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">{current}</h2>
        {isHost && (
          <button onClick={next} className="btn-gold mt-6">
            {t('nextStatement')}
          </button>
        )}
      </div>

      <p className="text-center text-white/50 text-sm mb-4">
        {t('whoDidIt')}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {players.map((p, i) => (
          <button
            key={i}
            disabled={!isHost || p.lives <= 0}
            onClick={() => loseLife(i)}
            className={`card-panel p-4 text-center transition ${
              p.lives <= 0 ? 'opacity-30' : 'hover:border-accent-red'
            }`}
          >
            <div className="font-bold text-gold">{p.name}</div>
            <div className="text-2xl mt-1">{'❤️'.repeat(p.lives) || '💀'}</div>
          </button>
        ))}
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
        title="Genereeri 'Ma ei ole kunagi' väited AI-ga"
        subtitle="Sisesta teema ja AI genereerib 30 haaravat väidet peoõhtuks"
        presetTopics={['Lõbusad peod ja reisimine', 'Tööelu ja ülemused', 'Piinlikud olukorrad', 'Lapsepõlv & kooliaeg']}
        defaultTopic="Lõbusad peod, reisimine ja suveõhtud"
        promptTemplate='Genereeri täpselt 30 eestikeelset "Ma ei ole kunagi..." (Never Have I Ever) väidet teemal: "{TOPIC}". Vasta puhta JSON massiivina stringidest.'
        generateFn={(topic) => generateMaEiOleKunagiAi(topic, 30)}
        onApply={(list) => {
          update({
            statements: list,
            index: 0,
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
