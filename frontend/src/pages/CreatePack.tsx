import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { pb } from '@/lib/pocketbase'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

export default function CreatePack() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gameType, setGameType] = useState<string>('kuldvillak')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Simple Kuldvillak editor
  const [categories, setCategories] = useState([
    {
      name: 'Kategooria 1',
      questions: [
        { points: 100, q: '', a: '' },
        { points: 200, q: '', a: '' },
        { points: 300, q: '', a: '' },
        { points: 400, q: '', a: '' },
        { points: 500, q: '', a: '' },
      ],
    },
  ])

  // Simple Rooside Sõda editor
  const [rounds, setRounds] = useState([
    {
      title: 'VOOR 1',
      multiplier: 1,
      question: '',
      answers: [
        { text: '', points: 30 },
        { text: '', points: 20 },
        { text: '', points: 15 },
        { text: '', points: 10 },
        { text: '', points: 8 },
        { text: '', points: 5 },
      ],
    },
  ])

  async function handleSave() {
    if (!name.trim()) {
      setError('Nimi on kohustuslik')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data =
        gameType === 'kuldvillak'
          ? { categories }
          : { rounds }

      await pb.collection('packs').create({
        name: name.trim(),
        description: description.trim(),
        game_type: gameType,
        data,
        is_official: false,
        is_public: false,
        owner: user!.id,
      })
      navigate(`/play/${gameType}`)
    } catch (err: any) {
      console.error(err)
      setError(
        'Salvestamine ebaõnnestus. Kas PocketBase on käivitatud ja packs kollektsioon olemas?'
      )
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
          <label className="block text-sm text-gold/80 mb-1.5">Mängu tüüp</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGameType('kuldvillak')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition ${
                gameType === 'kuldvillak'
                  ? 'bg-gold text-bg'
                  : 'border border-gold/40 text-gold hover:bg-gold/10'
              }`}
            >
              Kuldvillak
            </button>
            <button
              type="button"
              onClick={() => setGameType('roosidesoda')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition ${
                gameType === 'roosidesoda'
                  ? 'bg-gold text-bg'
                  : 'border border-gold/40 text-gold hover:bg-gold/10'
              }`}
            >
              Rooside Sõda
            </button>
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

        {gameType === 'kuldvillak' && (
          <div className="space-y-6">
            {categories.map((cat, cIdx) => (
              <div key={cIdx} className="card-panel p-5">
                <div className="flex items-center gap-2 mb-4">
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
                      onClick={() => setCategories(categories.filter((_, i) => i !== cIdx))}
                      className="text-accent-red p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                {cat.questions.map((q, qIdx) => (
                  <div key={qIdx} className="grid grid-cols-[60px_1fr_1fr] gap-2 mb-2">
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
                    questions: [100, 200, 300, 400, 500].map((p) => ({
                      points: p,
                      q: '',
                      a: '',
                    })),
                  },
                ])
              }
              className="btn-outline text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Lisa kategooria
            </button>
          </div>
        )}

        {gameType === 'roosidesoda' && (
          <div className="space-y-6">
            {rounds.map((r, rIdx) => (
              <div key={rIdx} className="card-panel p-5">
                <div className="flex gap-2 mb-3">
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
                  className="input-field mb-3"
                  placeholder="Küsimus (nt. Nimeta midagi...)"
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
                    answers: [30, 20, 15, 10, 8, 5].map((p) => ({ text: '', points: p })),
                  },
                ])
              }
              className="btn-outline text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Lisa voor
            </button>
          </div>
        )}

        {error && (
          <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
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
