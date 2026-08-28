import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { formatPbError } from '@/lib/pocketbase'
import { createOwnedPack } from '@/lib/sessions'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { GAME_META, type GameType } from '@/lib/types'

const TYPES: GameType[] = [
  'kuldvillak',
  'roosidesoda',
  'sonaseletus',
  'ma_ei_ole_kunagi',
  'viimane_pusti',
  'tode_voi_tegu',
]

export default function CreatePack() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gameType, setGameType] = useState<GameType>('kuldvillak')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Kuldvillak
  const [finalQ, setFinalQ] = useState('')
  const [finalA, setFinalA] = useState('')
  const [finalNote, setFinalNote] = useState('')
  const [categories, setCategories] = useState([
    {
      name: 'Kategooria 1',
      questions: [100, 200, 300, 400, 500].map((p) => ({ points: p, q: '', a: '', hostNote: '' })),
    },
  ])

  // Rooside Sõda
  const [rounds, setRounds] = useState([
    {
      title: 'VOOR 1',
      multiplier: 1,
      question: '',
      answers: [30, 20, 15, 10, 8, 5].map((p) => ({ text: '', points: p })),
    },
  ])

  // Sõnaseletus
  const [wordsText, setWordsText] = useState('Banaan\nJalgratas\nKohv\nRaamat')
  const [roundSeconds, setRoundSeconds] = useState(60)

  // Ma ei ole / Viimane püsti
  const [statementsText, setStatementsText] = useState(
    'Ma ei ole kunagi unustanud sünnipäeva\nMa ei ole kunagi magama jäänud kinos'
  )
  const [startingLives, setStartingLives] = useState(3)

  // Tõde või tegu
  const [truthsText, setTruthsText] = useState('Mis on sinu kõige piinlikum mälestus?')
  const [daresText, setDaresText] = useState('Tee 10 kükki\nLaula 15 sekundit')

  function buildData() {
    switch (gameType) {
      case 'kuldvillak':
        return {
          categories,
          finalJeopardy:
            finalQ.trim() || finalA.trim()
              ? { q: finalQ, a: finalA, hostNote: finalNote || undefined }
              : undefined,
        }
      case 'roosidesoda':
        return { rounds }
      case 'sonaseletus':
        return {
          words: wordsText
            .split('\n')
            .map((w) => w.trim())
            .filter(Boolean),
          roundSeconds,
        }
      case 'ma_ei_ole_kunagi':
        return {
          statements: statementsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        }
      case 'viimane_pusti':
        return {
          statements: statementsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          startingLives,
        }
      case 'tode_voi_tegu':
        return {
          truths: truthsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          dares: daresText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        }
      default:
        return {}
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Nimi on kohustuslik')
      return
    }
    if (!user?.id || !pb.authStore.isValid) {
      setError('Salvestamiseks pead olema sisse logitud (lehe konto, mitte ainult PocketBase admin).')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createOwnedPack({
        name: name.trim(),
        description: description.trim(),
        game_type: gameType,
        data: buildData(),
      })
      navigate(`/play/${gameType}`)
    } catch (err: any) {
      console.error(err)
      setError(formatPbError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-white/60 hover:text-gold mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Tagasi
      </Link>

      <h1 className="font-display text-3xl text-gold mb-6">Loo uus küsimuste set</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-gold/80 mb-2">Mängu tüüp</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setGameType(t)}
                className={`px-3 py-1.5 rounded-full font-bold text-xs transition ${
                  gameType === t
                    ? 'bg-gold text-bg'
                    : 'border border-gold/40 text-gold hover:bg-gold/10'
                }`}
              >
                {GAME_META[t].emoji} {GAME_META[t].title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gold/80 mb-1.5">Nimi</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nt. Sünnipäev 2026"
          />
        </div>
        <div>
          <label className="block text-sm text-gold/80 mb-1.5">Kirjeldus</label>
          <input
            className="input-field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lühike kirjeldus"
          />
        </div>

        {/* Kuldvillak editor */}
        {gameType === 'kuldvillak' && (
          <div className="space-y-4">
            {categories.map((cat, cIdx) => (
              <div key={cIdx} className="card-panel p-4">
                <div className="flex gap-2 mb-3">
                  <input
                    className="input-field font-display text-gold"
                    value={cat.name}
                    onChange={(e) => {
                      const next = [...categories]
                      next[cIdx].name = e.target.value
                      setCategories(next)
                    }}
                  />
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCategories(categories.filter((_, i) => i !== cIdx))}
                      className="text-accent-red p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                {cat.questions.map((q, qIdx) => (
                  <div key={qIdx} className="grid grid-cols-[50px_1fr_1fr] gap-2 mb-1">
                    <div className="text-gold font-bold text-sm flex items-center">{q.points}p</div>
                    <input
                      className="input-field text-sm"
                      placeholder="Küsimus"
                      value={q.q}
                      onChange={(e) => {
                        const next = [...categories]
                        next[cIdx].questions[qIdx].q = e.target.value
                        setCategories(next)
                      }}
                    />
                    <input
                      className="input-field text-sm"
                      placeholder="Vastus"
                      value={q.a}
                      onChange={(e) => {
                        const next = [...categories]
                        next[cIdx].questions[qIdx].a = e.target.value
                        setCategories(next)
                      }}
                    />
                    <div className="col-span-3 mb-2">
                      <input
                        className="input-field text-xs text-amber-100/90"
                        placeholder="Hosti märkus (ainult adminile)"
                        value={q.hostNote || ''}
                        onChange={(e) => {
                          const next = [...categories]
                          next[cIdx].questions[qIdx].hostNote = e.target.value
                          setCategories(next)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setCategories([
                  ...categories,
                  {
                    name: `Kategooria ${categories.length + 1}`,
                    questions: [100, 200, 300, 400, 500].map((p) => ({ points: p, q: '', a: '', hostNote: '' })),
                  },
                ])
              }
              className="btn-outline text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Lisa kategooria
            </button>
            <div className="card-panel p-4 border-gold/30 space-y-2">
              <div className="font-display text-gold text-sm">Final Jeopardy (valikuline)</div>
              <input className="input-field text-sm" placeholder="Final küsimus" value={finalQ} onChange={(e) => setFinalQ(e.target.value)} />
              <input className="input-field text-sm" placeholder="Final vastus" value={finalA} onChange={(e) => setFinalA(e.target.value)} />
              <input className="input-field text-xs" placeholder="Final hosti märkus" value={finalNote} onChange={(e) => setFinalNote(e.target.value)} />
            </div>
          </div>
        )}

        {/* Rooside Sõda */}
        {gameType === 'roosidesoda' && (
          <div className="space-y-4">
            {rounds.map((r, rIdx) => (
              <div key={rIdx} className="card-panel p-4">
                <div className="flex gap-2 mb-2">
                  <input
                    className="input-field font-display text-gold flex-1"
                    value={r.title}
                    onChange={(e) => {
                      const next = [...rounds]
                      next[rIdx].title = e.target.value
                      setRounds(next)
                    }}
                  />
                  <select
                    className="input-field w-24"
                    value={r.multiplier}
                    onChange={(e) => {
                      const next = [...rounds]
                      next[rIdx].multiplier = Number(e.target.value)
                      setRounds(next)
                    }}
                  >
                    <option value={1}>1×</option>
                    <option value={2}>2×</option>
                    <option value={3}>3×</option>
                  </select>
                </div>
                <input
                  className="input-field mb-2"
                  placeholder="Küsimus"
                  value={r.question}
                  onChange={(e) => {
                    const next = [...rounds]
                    next[rIdx].question = e.target.value
                    setRounds(next)
                  }}
                />
                {r.answers.map((a, aIdx) => (
                  <div key={aIdx} className="grid grid-cols-[1fr_80px] gap-2 mb-2">
                    <input
                      className="input-field text-sm"
                      placeholder={`Vastus ${aIdx + 1}`}
                      value={a.text}
                      onChange={(e) => {
                        const next = [...rounds]
                        next[rIdx].answers[aIdx].text = e.target.value
                        setRounds(next)
                      }}
                    />
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={a.points}
                      onChange={(e) => {
                        const next = [...rounds]
                        next[rIdx].answers[aIdx].points = Number(e.target.value)
                        setRounds(next)
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setRounds([
                  ...rounds,
                  {
                    title: `VOOR ${rounds.length + 1}`,
                    multiplier: 1,
                    question: '',
                    answers: [30, 20, 15, 10].map((p) => ({ text: '', points: p })),
                  },
                ])
              }
              className="btn-outline text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Lisa voor
            </button>
          </div>
        )}

        {/* Sõnaseletus */}
        {gameType === 'sonaseletus' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gold/80 mb-1">Vooru pikkus (sek)</label>
              <input
                type="number"
                className="input-field w-32"
                value={roundSeconds}
                onChange={(e) => setRoundSeconds(Number(e.target.value) || 60)}
              />
            </div>
            <div>
              <label className="block text-sm text-gold/80 mb-1">Sõnad (üks real)</label>
              <textarea
                className="input-field min-h-[180px] font-mono text-sm"
                value={wordsText}
                onChange={(e) => setWordsText(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Ma ei ole / Viimane püsti */}
        {(gameType === 'ma_ei_ole_kunagi' || gameType === 'viimane_pusti') && (
          <div className="space-y-3">
            {gameType === 'viimane_pusti' && (
              <div>
                <label className="block text-sm text-gold/80 mb-1">Algused elud</label>
                <input
                  type="number"
                  className="input-field w-24"
                  value={startingLives}
                  onChange={(e) => setStartingLives(Number(e.target.value) || 3)}
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-gold/80 mb-1">Väited (üks real)</label>
              <textarea
                className="input-field min-h-[180px] text-sm"
                value={statementsText}
                onChange={(e) => setStatementsText(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tõde või tegu */}
        {gameType === 'tode_voi_tegu' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gold/80 mb-1">Tõed (üks real)</label>
              <textarea
                className="input-field min-h-[160px] text-sm"
                value={truthsText}
                onChange={(e) => setTruthsText(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gold/80 mb-1">Teod (üks real)</label>
              <textarea
                className="input-field min-h-[160px] text-sm"
                value={daresText}
                onChange={(e) => setDaresText(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-gold flex items-center gap-2 text-lg px-8"
        >
          <Save size={18} />
          {saving ? 'Salvestan...' : 'Salvesta set'}
        </button>
      </div>
    </div>
  )
}
