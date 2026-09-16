import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { pb, formatPbError } from '@/lib/pocketbase'
import { createOwnedPack } from '@/lib/sessions'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Plus, Trash2, Save, Sparkles, Copy, Check, Upload, Loader2 } from 'lucide-react'
import { GAME_META, type GameType } from '@/lib/types'
import BlitzPackEditor from '@/games/blitz/BlitzPackEditor'
import type { BlitzQuestion } from '@/games/blitz/types'
import {
  MILJONAR_KLASSIKA_QUESTIONS,
  MILJONAR_EESTI_QUESTIONS,
  MILJONAR_PEO_QUESTIONS,
} from '@/games/miljonar/miljonarPacks'
import { generateMiljonarQuizWithAi } from '@/games/miljonar/generateMiljonarQuiz'
import {
  generateKuldvillakAi,
  generateRoosidesodaAi,
  generateSonaseletusAi,
  generateMaEiOleKunagiAi,
  generateViimanePustiAi,
  generateTodeVoiTeguAi,
} from '@/lib/aiGameGenerators'
import AiGeneratorBar from '@/components/AiGeneratorBar'
import type { MiljonarQuestion } from '@/games/miljonar/types'
import { MILJONAR_LADDER, formatPrize } from '@/games/miljonar/types'

const TYPES: GameType[] = [
  'kuldvillak',
  'miljonar',
  'roosidesoda',
  'blitz',
  'kinnistu_deal',
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
  const [finalQ_tr, setFinalQ_tr] = useState('')
  const [finalA, setFinalA] = useState('')
  const [finalA_tr, setFinalA_tr] = useState('')
  const [finalNote, setFinalNote] = useState('')
  const [categories, setCategories] = useState<
    {
      name: string
      name_tr?: string
      questions: { points: number; q: string; q_tr?: string; a: string; a_tr?: string; hostNote?: string }[]
    }[]
  >([
    {
      name: 'Kategooria 1',
      name_tr: '',
      questions: [100, 200, 300, 400, 500].map((p) => ({ points: p, q: '', q_tr: '', a: '', a_tr: '', hostNote: '' })),
    },
  ])

  // Rooside Sõda
  const [finalRound, setFinalRound] = useState<any>(null)
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

  // Blitz
  const [blitzQs, setBlitzQs] = useState<BlitzQuestion[]>([
    {
      id: 'q1',
      q: 'Mis on Eesti pealinn?',
      choices: ['Tartu', 'Tallinn', 'Pärnu', 'Narva'],
      correct: 1,
    },
  ])
  const [blitzSec, setBlitzSec] = useState(20)
  const [blitzMax, setBlitzMax] = useState(1000)
  const [blitzReveal, setBlitzReveal] = useState(5)

  // Miljonär
  const [miljonarQs, setMiljonarQs] = useState<MiljonarQuestion[]>(() => {
    return MILJONAR_KLASSIKA_QUESTIONS.filter((q) => !q.backup).map((q) => ({ ...q }))
  })
  const [miljonarTopic, setMiljonarTopic] = useState('')
  const [miljonarAiLoading, setMiljonarAiLoading] = useState(false)
  const [miljonarCopiedPrompt, setMiljonarCopiedPrompt] = useState(false)
  const [miljonarJsonOpen, setMiljonarJsonOpen] = useState(false)
  const [miljonarJsonText, setMiljonarJsonText] = useState('')
  const [miljonarJsonError, setMiljonarJsonError] = useState('')

  async function handleMiljonarAi() {
    if (!miljonarTopic.trim()) return
    setMiljonarAiLoading(true)
    setError('')
    try {
      const res = await generateMiljonarQuizWithAi(miljonarTopic.trim())
      if (res.questions && res.questions.length >= 15) {
        setMiljonarQs(res.questions.slice(0, 15))
        if (!name) setName(`Miljonär: ${miljonarTopic.trim()}`)
      }
    } catch (e: any) {
      setError('AI genereerimine ebaõnnestus. Kasuta ChatGPT prompti või valmisteemasid.')
    } finally {
      setMiljonarAiLoading(false)
    }
  }

  function copyMiljonarChatGptPrompt() {
    const topic = miljonarTopic.trim() || 'Üldteadmised, meelelahutus ja Eesti'
    const promptText = `Loo telesaate "Kes tahab saada miljonäriks?" formaadis täpselt 15 küsimust eesti keeles teemal: "${topic}".
Küsimused PEAVAD olema rangelt kasvavas raskusastmes (15 astet: 1-5 lihtsad soojendused, 6-10 keskmised ja faktilised, 11-14 rasked nuputamised, 15 tõeline elitaarne miljoniküsimus).

Vasta AINULT puhta JSON massiivina (ilma markdown jutumärkideta):
[
  {
    "tier": 1,
    "q": "Küsimus 1 tekst",
    "choices": ["Valik A", "Valik B", "Valik C", "Valik D"],
    "correct": 0,
    "hostNote": "Selgitus"
  },
  ...
]`
    navigator.clipboard.writeText(promptText)
    setMiljonarCopiedPrompt(true)
    setTimeout(() => setMiljonarCopiedPrompt(false), 2500)
  }

  function handleImportMiljonarJson() {
    setMiljonarJsonError('')
    try {
      let raw = miljonarJsonText.trim()
      if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim()
      if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '').trim()
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed : parsed.questions
      if (!Array.isArray(list) || list.length < 5) {
        throw new Error('JSON peab sisaldama vähemalt 5-15 küsimustega massiivi')
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
      // Pad to 15 if fewer
      while (formatted.length < 15) {
        const idx = formatted.length
        const def = MILJONAR_KLASSIKA_QUESTIONS[idx]
        formatted.push({ ...def, tier: idx + 1 })
      }
      setMiljonarQs(formatted)
      setMiljonarJsonOpen(false)
      setMiljonarJsonText('')
    } catch (e: any) {
      setMiljonarJsonError(e.message || 'Vigane JSON formaat')
    }
  }

  function buildData() {
    switch (gameType) {
      case 'miljonar':
        return {
          questions: miljonarQs,
          backupQuestions: MILJONAR_KLASSIKA_QUESTIONS.filter((q) => q.backup),
        }
      case 'kuldvillak':
        return {
          categories: categories.map((c) => ({
            name: c.name,
            ...(c.name_tr?.trim() ? { name_tr: c.name_tr.trim() } : {}),
            questions: c.questions.map((q) => ({
              points: q.points,
              q: q.q,
              a: q.a,
              ...(q.q_tr?.trim() ? { q_tr: q.q_tr.trim() } : {}),
              ...(q.a_tr?.trim() ? { a_tr: q.a_tr.trim() } : {}),
              ...(q.hostNote?.trim() ? { hostNote: q.hostNote.trim() } : {}),
            })),
          })),
          finalJeopardy:
            finalQ.trim() || finalA.trim()
              ? {
                  q: finalQ,
                  a: finalA,
                  ...(finalQ_tr.trim() ? { q_tr: finalQ_tr.trim() } : {}),
                  ...(finalA_tr.trim() ? { a_tr: finalA_tr.trim() } : {}),
                  ...(finalNote.trim() ? { hostNote: finalNote.trim() } : {}),
                }
              : undefined,
        }
      case 'roosidesoda':
        return { rounds, finalRound }
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
      case 'blitz':
        return {
          questions: blitzQs,
          secondsPerQuestion: blitzSec,
          pointsMax: blitzMax,
          revealSeconds: blitzReveal,
          shuffleOnStart: true,
          preCountdownSeconds: 3,
        }
      case 'kinnistu_deal':
        return {
          winSets: 3,
          startHand: 5,
          theme: 'classic',
          label: 'Klassika',
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
            <AiGeneratorBar
              title="Genereeri 5x5 Kuldvillaku laud ja finaalküsimus"
              placeholder="Teema (nt Eesti geograafia, 90ndate popkultuur, Teadus, Seltskond)..."
              presetTopics={['Eesti ajalugu & geograafia', 'Filmid & seriaalid', 'Popmuusika', 'Teadus & loodus', 'Õlle & toidukultuur']}
              defaultPrompt={`Loo telesaate "Kuldvillak" stiilis 5 kategooriat (igas 5 küsimust 100-500p) + finaalküsimus teemal: "{TOPIC}". Vasta puhta JSON objektina.`}
              onGenerate={async (topic) => {
                const res = await generateKuldvillakAi(topic)
                if (res.categories && res.categories.length) {
                  setCategories(res.categories)
                  if (res.finalJeopardy) {
                    setFinalQ(res.finalJeopardy.q || '')
                    setFinalA(res.finalJeopardy.a || '')
                    setFinalNote(res.finalJeopardy.hostNote || '')
                  }
                  if (!name) setName(`Kuldvillak: ${topic}`)
                }
              }}
            />

            {categories.map((cat, cIdx) => (
              <div key={cIdx} className="card-panel p-4 border-gold/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="text-[11px] text-gold/80 block mb-1 font-semibold">Kategooria nimi</label>
                    <input
                      className="input-field font-display text-gold"
                      placeholder="nt. Geograafia"
                      value={cat.name}
                      onChange={(e) => {
                        const next = [...categories]
                        next[cIdx] = { ...next[cIdx], name: e.target.value }
                        setCategories(next)
                      }}
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[11px] text-white/50 block mb-1 font-semibold">
                        🌐 Kategooria tõlge (valikuline)
                      </label>
                      <input
                        className="input-field font-display text-white/90 bg-slate-950/40 border-dashed border-white/20 focus:border-solid focus:border-gold"
                        placeholder="nt. Geography"
                        value={cat.name_tr || ''}
                        onChange={(e) => {
                          const next = [...categories]
                          next[cIdx] = { ...next[cIdx], name_tr: e.target.value }
                          setCategories(next)
                        }}
                      />
                    </div>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCategories(categories.filter((_, i) => i !== cIdx))}
                        className="text-accent-red p-2 hover:bg-accent-red/10 rounded-lg transition"
                        title="Kustuta kategooria"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {cat.questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-3 rounded-xl bg-black/25 border border-white/5 space-y-2">
                      <div className="grid grid-cols-[54px_1fr_1fr] gap-2 items-center">
                        <div className="text-gold font-bold text-xs text-center py-2 rounded-lg bg-gold/10 border border-gold/20">
                          {q.points}p
                        </div>
                        <input
                          className="input-field text-sm"
                          placeholder="Küsimus (põhikeel)"
                          value={q.q}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...next[cIdx].questions[qIdx], q: e.target.value }
                            setCategories(next)
                          }}
                        />
                        <input
                          className="input-field text-sm"
                          placeholder="Vastus (põhikeel)"
                          value={q.a}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...next[cIdx].questions[qIdx], a: e.target.value }
                            setCategories(next)
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-[54px_1fr_1fr] gap-2 items-center">
                        <div className="text-[10px] text-accent-cyan/80 font-bold uppercase tracking-wider text-center">
                          🌐 TR
                        </div>
                        <input
                          className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan"
                          placeholder="🌐 Tõlgitud küsimus (nt inglise k.)"
                          value={q.q_tr || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...next[cIdx].questions[qIdx], q_tr: e.target.value }
                            setCategories(next)
                          }}
                        />
                        <input
                          className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan"
                          placeholder="🌐 Tõlgitud vastus (nt inglise k.)"
                          value={q.a_tr || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...next[cIdx].questions[qIdx], a_tr: e.target.value }
                            setCategories(next)
                          }}
                        />
                      </div>

                      <div className="pt-1">
                        <input
                          className="input-field text-xs text-amber-100/90"
                          placeholder="Hosti märkus (ainult mängujuhile)"
                          value={q.hostNote || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...next[cIdx].questions[qIdx], hostNote: e.target.value }
                            setCategories(next)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setCategories([
                  ...categories,
                  {
                    name: `Kategooria ${categories.length + 1}`,
                    name_tr: '',
                    questions: [100, 200, 300, 400, 500].map((p) => ({ points: p, q: '', q_tr: '', a: '', a_tr: '', hostNote: '' })),
                  },
                ])
              }
              className="btn-outline text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Lisa kategooria
            </button>
            <div className="card-panel p-4 border-gold/30 space-y-3">
              <div className="font-display text-gold text-sm font-bold">🏆 Final Jeopardy (valikuline)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gold/70 block mb-1">Final küsimus</label>
                  <input className="input-field text-sm" placeholder="Küsimus" value={finalQ} onChange={(e) => setFinalQ(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-white/50 block mb-1">🌐 Final küsimuse tõlge</label>
                  <input className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20" placeholder="Tõlgitud küsimus" value={finalQ_tr} onChange={(e) => setFinalQ_tr(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gold/70 block mb-1">Final vastus</label>
                  <input className="input-field text-sm" placeholder="Õige vastus" value={finalA} onChange={(e) => setFinalA(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-white/50 block mb-1">🌐 Final vastuse tõlge</label>
                  <input className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20" placeholder="Tõlgitud vastus" value={finalA_tr} onChange={(e) => setFinalA_tr(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-amber-200/70 block mb-1">Hosti märkus</label>
                <input className="input-field text-xs" placeholder="Final hosti märkus" value={finalNote} onChange={(e) => setFinalNote(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Rooside Sõda */}
        {gameType === 'roosidesoda' && (
          <div className="space-y-4">
            <AiGeneratorBar
              title="Genereeri 4 vooru Rooside Sõja küsitlusi"
              placeholder="Teema (nt Eesti argielu, Suhted ja abielu, Peod ja reisimine, Töö ja kolleegid)..."
              presetTopics={['Eesti argielu', 'Suhted ja kohtingud', 'Puhkus ja reisimine', 'Toidud ja jook', 'Töökoha huumor']}
              defaultPrompt={`Loo telesaate "Rooside Sõda" (Family Feud) stiilis 4-vooruline mäng teemal: "{TOPIC}". Vasta puhta JSON objektina.`}
              onGenerate={async (topic) => {
                const res = await generateRoosidesodaAi(topic)
                if (res.rounds && res.rounds.length) {
                  setRounds(res.rounds)
                  if (res.finalRound) setFinalRound(res.finalRound)
                  if (!name) setName(`Rooside Sõda: ${topic}`)
                }
              }}
            />

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
                    <option value={4}>4×</option>
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
            <AiGeneratorBar
              title="Genereeri 40 sõnaseletuse / Aliase kaarti"
              placeholder="Teema (nt Kuulsad eestlased, 90ndate nostalgia, Filmid, Argipäev)..."
              presetTopics={['Eesti kuulsused ja kohad', '90ndate nostalgia', 'Toidud & joogid', 'Ametid & hobid', 'Peod & meelelahutus']}
              onGenerate={async (topic) => {
                const list = await generateSonaseletusAi(topic, 45)
                if (list && list.length) {
                  setWordsText(list.join('\n'))
                  if (!name) setName(`Sõnaseletus: ${topic}`)
                }
              }}
            />

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
            <AiGeneratorBar
              title={gameType === 'ma_ei_ole_kunagi' ? 'Genereeri 30 "Ma ei ole kunagi" väidet' : 'Genereeri 30 "Viimane püsti" väidet'}
              placeholder="Teema (nt Peod, Suhted, Töö, Reisimine, Huumor)..."
              presetTopics={['Lõbusad peod ja reisimine', 'Tööelu ja ülemused', 'Piinlikud olukorrad', 'Lapsepõlv & kooliaeg']}
              onGenerate={async (topic) => {
                const list =
                  gameType === 'ma_ei_ole_kunagi'
                    ? await generateMaEiOleKunagiAi(topic, 30)
                    : await generateViimanePustiAi(topic, 30)
                if (list && list.length) {
                  setStatementsText(list.join('\n'))
                  if (!name) setName(`${gameType === 'ma_ei_ole_kunagi' ? 'Ma ei ole kunagi' : 'Viimane püsti'}: ${topic}`)
                }
              }}
            />

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
          <div className="space-y-4">
            <AiGeneratorBar
              title="Genereeri 20 tõde ja 20 tegu"
              placeholder="Teema (nt Sõpruskond, Vürtsikas peoõhtu, Perekondlik mäng, Naer ja huumor)..."
              presetTopics={['Sõprade peoõhtu', 'Perekond ja lapsed', 'Romantiline & paarid', 'Naljakas & julge']}
              onGenerate={async (topic) => {
                const res = await generateTodeVoiTeguAi(topic, 20)
                if (res.truths?.length && res.dares?.length) {
                  setTruthsText(res.truths.join('\n'))
                  setDaresText(res.dares.join('\n'))
                  if (!name) setName(`Tõde või tegu: ${topic}`)
                }
              }}
            />

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
          </div>
        )}

        
        {gameType === 'miljonar' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-gold/30 rounded-2xl p-4">
              <div>
                <h3 className="font-display text-lg text-gold flex items-center gap-2">
                  <Sparkles size={18} /> 15 küsimust miljonini
                </h3>
                <p className="text-white/60 text-xs">
                  Vali valmisteema, genereeri tehisintellektiga või kopeeri ChatGPT/Gemini prompt!
                </p>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMiljonarQs(MILJONAR_KLASSIKA_QUESTIONS.filter((q) => !q.backup))}
                  className="btn-outline text-xs !py-1 !px-2.5"
                >
                  🏆 Klassika
                </button>
                <button
                  type="button"
                  onClick={() => setMiljonarQs(MILJONAR_EESTI_QUESTIONS.filter((q) => !q.backup))}
                  className="btn-outline text-xs !py-1 !px-2.5"
                >
                  🇪🇪 Eesti
                </button>
                <button
                  type="button"
                  onClick={() => setMiljonarQs(MILJONAR_PEO_QUESTIONS.filter((q) => !q.backup))}
                  className="btn-outline text-xs !py-1 !px-2.5"
                >
                  🎉 Pidu
                </button>
                <button
                  type="button"
                  onClick={() => setMiljonarJsonOpen(!miljonarJsonOpen)}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1"
                >
                  <Upload size={13} /> Kleebi JSON
                </button>
              </div>
            </div>

            {/* AI Generator Bar */}
            <div className="card-panel p-3.5 border-blue-900/60 bg-blue-950/30 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Sisesta teema (nt Eesti filmid, Muusika 2000ndad, Teadus)..."
                className="input-field text-xs flex-1"
                value={miljonarTopic}
                onChange={(e) => setMiljonarTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleMiljonarAi()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleMiljonarAi}
                disabled={miljonarAiLoading || !miljonarTopic.trim()}
                className="btn-gold text-xs flex items-center justify-center gap-1.5 px-4 shrink-0"
              >
                {miljonarAiLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Genereerin...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Genereeri AI-ga
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={copyMiljonarChatGptPrompt}
                className="btn-outline text-xs flex items-center justify-center gap-1.5 px-3 shrink-0"
                title="Kopeeri valmis prompt ChatGPT või Gemini sisse kleepimiseks"
              >
                {miljonarCopiedPrompt ? (
                  <>
                    <Check size={14} className="text-emerald-400" /> Prompt kopeeritud!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Kopeeri AI prompt
                  </>
                )}
              </button>
            </div>

            {/* JSON Import Area */}
            {miljonarJsonOpen && (
              <div className="card-panel p-4 border-gold/40 bg-slate-900/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gold uppercase tracking-wider">
                    Kleebi ChatGPT / Gemini genereeritud JSON:
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMiljonarJsonOpen(false)}
                    className="text-white/40 hover:text-white text-xs"
                  >
                    Sulge
                  </button>
                </div>
                <textarea
                  placeholder='Kleebi siia [ { "tier": 1, "q": "...", "choices": ["A","B","C","D"], "correct": 0 }, ... ]'
                  className="input-field font-mono text-xs min-h-[140px]"
                  value={miljonarJsonText}
                  onChange={(e) => setMiljonarJsonText(e.target.value)}
                />
                {miljonarJsonError && (
                  <p className="text-accent-red text-xs">{miljonarJsonError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleImportMiljonarJson}
                    className="btn-gold text-xs px-4"
                  >
                    Laadi küsimused tabelisse
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {miljonarQs.map((q, idx) => {
                const step = MILJONAR_LADDER[idx] || { prize: 100, isMilestone: false }
                return (
                  <div
                    key={idx}
                    className={`card-panel p-4 border transition ${step.isMilestone ? 'border-amber-500/60 bg-amber-950/10' : 'border-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-bold text-sm text-gold">
                        Tase {idx + 1} · {formatPrize(step.prize)} {step.isMilestone && '(Turvasumma)'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder={`Tase ${idx + 1} küsimus...`}
                        className="input-field text-sm font-medium w-full"
                        value={q.q}
                        onChange={(e) => {
                          const updated = [...miljonarQs]
                          updated[idx] = { ...updated[idx], q: e.target.value }
                          setMiljonarQs(updated)
                        }}
                      />

                      <div className="grid sm:grid-cols-2 gap-2 pt-1">
                        {q.choices.map((choice, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...miljonarQs]
                                updated[idx] = { ...updated[idx], correct: cIdx as 0 | 1 | 2 | 3 }
                                setMiljonarQs(updated)
                              }}
                              className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition ${
                                q.correct === cIdx
                                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                  : 'bg-white/5 text-white/40 hover:bg-white/10'
                              }`}
                            >
                              {['A', 'B', 'C', 'D'][cIdx]}
                            </button>
                            <input
                              type="text"
                              placeholder={`Valik ${['A', 'B', 'C', 'D'][cIdx]}`}
                              className={`input-field text-xs py-1.5 flex-1 ${q.correct === cIdx ? 'border-emerald-500/50' : ''}`}
                              value={choice}
                              onChange={(e) => {
                                const updated = [...miljonarQs]
                                const newChoices = [...updated[idx].choices] as [string, string, string, string]
                                newChoices[cIdx] = e.target.value
                                updated[idx] = { ...updated[idx], choices: newChoices }
                                setMiljonarQs(updated)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {gameType === 'blitz' && (
          <BlitzPackEditor
            questions={blitzQs}
            secondsPerQuestion={blitzSec}
            pointsMax={blitzMax}
            revealSeconds={blitzReveal}
            onChange={(n) => {
              setBlitzQs(n.questions)
              setBlitzSec(n.secondsPerQuestion)
              setBlitzMax(n.pointsMax)
              setBlitzReveal(n.revealSeconds)
            }}
          />
        )}

        {gameType === 'kinnistu_deal' && (
          <div className="card-panel border-white/10 p-4 text-sm text-white/60 space-y-2">
            <p>
              Kinnistu Deal kasutab sisseehitatud kaardipakki (raha, kinnistud, tegevused).
              Võid muuta ainult võidutingimust.
            </p>
            <p className="text-xs text-white/40">
              Teemapakid (Pulm, Tartu, Kontor) tulevad ametlike settide hulgast — laadi administ või vali mängimisel.
            </p>
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
