import { useState } from 'react'
import type { BlitzQuestion, BlitzQuestionType } from './types'
import { parseBlitzQuestions, questionsToCsv } from './parseQuestions'
import { generateBlitzQuiz } from './generateQuiz'
import { Plus, Trash2, Upload, Sparkles, Loader2, Star } from 'lucide-react'

type Props = {
  questions: BlitzQuestion[]
  secondsPerQuestion: number
  pointsMax: number
  revealSeconds: number
  onChange: (next: {
    questions: BlitzQuestion[]
    secondsPerQuestion: number
    pointsMax: number
    revealSeconds: number
  }) => void
}

const AI_SUGGESTIONS = [
  'Eesti popkultuur ja huumor',
  'Maailma geograafia ja rekordid',
  'Tehnoloogia ja tehisintellekt',
  '2000ndate muusika ja filmid',
  'Loodus ja loomariik',
  'Sport ja olümpiamängud',
]

export default function BlitzPackEditor({
  questions,
  secondsPerQuestion,
  pointsMax,
  revealSeconds,
  onChange,
}: Props) {
  const [importText, setImportText] = useState('')
  const [importMsg, setImportMsg] = useState('')

  // AI Generator state
  const [aiOpen, setAiOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('Eesti popkultuur ja huumor')
  const [aiCount, setAiCount] = useState(6)
  const [aiDifficulty, setAiDifficulty] = useState<'mixed' | 'easy' | 'medium' | 'hard'>('mixed')
  const [aiSpecialTypes, setAiSpecialTypes] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  function patchQ(i: number, patch: Partial<BlitzQuestion>) {
    const next = questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q))
    onChange({ questions: next, secondsPerQuestion, pointsMax, revealSeconds })
  }

  function addQ() {
    onChange({
      questions: [
        ...questions,
        {
          id: `q-${Date.now()}`,
          q: '',
          choices: ['', '', '', ''],
          correct: 0,
          type: 'quiz',
        },
      ],
      secondsPerQuestion,
      pointsMax,
      revealSeconds,
    })
  }

  function removeQ(i: number) {
    onChange({
      questions: questions.filter((_, idx) => idx !== i),
      secondsPerQuestion,
      pointsMax,
      revealSeconds,
    })
  }

  async function handleGenerateAi() {
    if (!aiTopic.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const generated = await generateBlitzQuiz({
        topic: aiTopic.trim(),
        count: aiCount,
        difficulty: aiDifficulty,
        includeSpecialTypes: aiSpecialTypes,
      })

      if (!generated || !generated.length) {
        throw new Error('Ühtegi küsimust ei genereeritud')
      }

      onChange({
        questions: generated,
        secondsPerQuestion,
        pointsMax,
        revealSeconds,
      })
      setAiOpen(false)
      setImportMsg(`Genereeritud edukalt ${generated.length} küsimust teemal "${aiTopic}"!`)
    } catch (err: any) {
      setAiError(err?.message || 'Genereerimine ebaõnnestus')
    } finally {
      setAiLoading(false)
    }
  }

  function doImport() {
    try {
      const { questions: qs, meta } = parseBlitzQuestions(importText)
      if (!qs.length) {
        setImportMsg('Ühtegi küsimust ei leitud')
        return
      }
      onChange({
        questions: qs,
        secondsPerQuestion: meta?.secondsPerQuestion ?? secondsPerQuestion,
        pointsMax: meta?.pointsMax ?? pointsMax,
        revealSeconds: meta?.revealSeconds ?? revealSeconds,
      })
      setImportMsg(`Imporditud ${qs.length} küsimust`)
      setImportText('')
    } catch (e: any) {
      setImportMsg(e?.message || 'Import ebaõnnestus')
    }
  }

  function onFile(file: File) {
    file.text().then((t) => {
      setImportText(t)
    })
  }

  return (
    <div className="space-y-4">
      {/* AI Quiz Generator Toggle & Panel */}
      <div className="card-panel border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-display font-black text-sm">
            <Sparkles size={18} className="text-amber-300 animate-pulse" />
            AI Viktoriini Generaator (Kahoot stiilis)
          </div>
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="btn-gold !text-xs !py-1 !px-3 font-bold"
          >
            {aiOpen ? 'Sulge AI tööriist' : '✨ Ava AI generaator'}
          </button>
        </div>

        {aiOpen && (
          <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
            <p className="text-xs text-white/70">
              Genereeri tehisintellektiga eestikeelne viktoriin mistahes teemal. Toetab mitmekesiseid küsimusetüüpe (Quiz, Tõene/Väär, Arvu pakkumine, Kirjuta vastus)!
            </p>

            <div>
              <label className="text-xs text-white/60 block mb-1">Teema või sündmus:</label>
              <input
                className="input-field text-sm font-bold"
                placeholder="nt Eesti geograafia, 90ndate hitid, tehisintellekt..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
            </div>

            {/* Suggestions pills */}
            <div className="flex flex-wrap gap-1.5">
              {AI_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setAiTopic(sug)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-amber-200 transition"
                >
                  {sug}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label className="text-xs text-white/60">
                Küsimuste arv:
                <select
                  className="input-field text-xs mt-1"
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                >
                  <option value={4}>4 küsimust (kiirvoor)</option>
                  <option value={6}>6 küsimust (standard)</option>
                  <option value={8}>8 küsimust</option>
                  <option value={10}>10 küsimust (täismäng)</option>
                </select>
              </label>

              <label className="text-xs text-white/60">
                Raskusaste:
                <select
                  className="input-field text-xs mt-1"
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as any)}
                >
                  <option value="mixed">Segu (lihtsast raskeni)</option>
                  <option value="easy">Lihtne</option>
                  <option value="medium">Keskmine</option>
                  <option value="hard">Raske</option>
                </select>
              </label>

              <label className="text-xs text-white/60 flex items-center gap-2 pt-5 cursor-pointer col-span-2 sm:col-span-1">
                <input
                  type="checkbox"
                  checked={aiSpecialTypes}
                  onChange={(e) => setAiSpecialTypes(e.target.checked)}
                />
                Kahoot lisatüübid (arv, T/V)
              </label>
            </div>

            {aiError && <p className="text-xs text-rose-400">{aiError}</p>}

            <button
              type="button"
              disabled={aiLoading || !aiTopic.trim()}
              onClick={handleGenerateAi}
              className="btn-gold w-full text-sm font-bold py-2.5 flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Genereerin viktoriini…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Loo ja asenda küsimused ({aiCount} tk)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Global timings */}
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-white/50">
          Sekundid
          <input
            type="number"
            className="input-field text-sm mt-1"
            value={secondsPerQuestion}
            min={5}
            max={120}
            onChange={(e) =>
              onChange({
                questions,
                secondsPerQuestion: Number(e.target.value) || 20,
                pointsMax,
                revealSeconds,
              })
            }
          />
        </label>
        <label className="text-xs text-white/50">
          Max punktid
          <input
            type="number"
            className="input-field text-sm mt-1"
            value={pointsMax}
            min={100}
            onChange={(e) =>
              onChange({
                questions,
                secondsPerQuestion,
                pointsMax: Number(e.target.value) || 1000,
                revealSeconds,
              })
            }
          />
        </label>
        <label className="text-xs text-white/50">
          Reveal (s)
          <input
            type="number"
            className="input-field text-sm mt-1"
            value={revealSeconds}
            min={0}
            max={30}
            onChange={(e) =>
              onChange({
                questions,
                secondsPerQuestion,
                pointsMax,
                revealSeconds: Number(e.target.value) || 0,
              })
            }
          />
        </label>
      </div>

      {/* Import / Export Panel */}
      <div className="card-panel border-dashed border-gold/30 p-3 space-y-2">
        <p className="text-xs text-white/50">
          Import: JSON massiiv või CSV read:{' '}
          <code className="text-gold/80">küsimus,A,B,C,D,õige(0-3|A-D)</code>
        </p>
        <textarea
          className="input-field text-xs font-mono min-h-[4rem]"
          placeholder="Kleebi CSV või JSON…"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-gold text-xs" onClick={doImport}>
            Impordi
          </button>
          <label className="btn-outline text-xs cursor-pointer flex items-center gap-1">
            <Upload size={12} /> Fail
            <input
              type="file"
              accept=".json,.csv,.txt,.tsv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
          <button
            type="button"
            className="btn-outline text-xs"
            onClick={() => {
              const csv = questionsToCsv(questions)
              navigator.clipboard.writeText(csv).catch(() => {})
              setImportMsg('CSV kopeeritud')
            }}
          >
            Ekspordi CSV
          </button>
        </div>
        {importMsg && <p className="text-xs text-gold">{importMsg}</p>}
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const qType = q.type || 'quiz'
          const isGolden = q.pointsMultiplier === 2

          return (
            <div key={q.id || i} className="card-panel border-white/10 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-300">#{i + 1}</span>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Question Type selector */}
                  <select
                    className="input-field text-xs !py-1 !px-2 w-auto font-bold text-amber-200"
                    value={qType}
                    onChange={(e) => {
                      const t = e.target.value as BlitzQuestionType
                      patchQ(i, {
                        type: t,
                        choices: t === 'true_false' ? ['TÕENE', 'VÄÄR', '', ''] : q.choices,
                        correct: t === 'true_false' ? 0 : q.correct,
                      })
                    }}
                  >
                    <option value="quiz">4 valikuga Quiz</option>
                    <option value="true_false">Tõene / Väär</option>
                    <option value="multi">Mitmikvalik</option>
                    <option value="slider">Paku arv (Slider)</option>
                    <option value="type_answer">Kirjuta vastus</option>
                    <option value="poll">Küsitlus / Poll</option>
                  </select>

                  {/* Difficulty selector */}
                  <select
                    className="input-field text-xs !py-1 !px-2 w-auto"
                    value={q.difficulty || 'medium'}
                    onChange={(e) =>
                      patchQ(i, { difficulty: e.target.value as 'easy' | 'medium' | 'hard' })
                    }
                  >
                    <option value="easy">Kerge</option>
                    <option value="medium">Keskmine</option>
                    <option value="hard">Raske</option>
                  </select>

                  {/* Golden Question 2X toggle */}
                  <button
                    type="button"
                    onClick={() => patchQ(i, { pointsMultiplier: isGolden ? 1 : 2 })}
                    className={`text-xs px-2 py-1 rounded-md font-bold flex items-center gap-1 border transition ${
                      isGolden
                        ? 'bg-amber-400/30 border-amber-300 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                        : 'border-white/10 text-white/50 hover:text-white'
                    }`}
                    title="Kahekordsed punktid sellele küsimusele"
                  >
                    <Star size={12} className={isGolden ? 'fill-amber-300 text-amber-300' : ''} />
                    {isGolden ? '2X Kuldne' : '1X'}
                  </button>

                  <button type="button" className="text-accent-red/70 p-1 hover:text-accent-red" onClick={() => removeQ(i)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Question text */}
              <input
                className="input-field text-sm font-semibold"
                placeholder="Küsimuse tekst…"
                value={q.q}
                onChange={(e) => patchQ(i, { q: e.target.value })}
              />

              {/* CONTROLS BASED ON QUESTION TYPE */}

              {/* 1. QUIZ & MULTI */}
              {(qType === 'quiz' || qType === 'multi' || qType === 'poll') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {q.choices.map((c, ci) => (
                    <div key={ci} className="flex gap-1.5 items-center">
                      <input
                        type={qType === 'multi' ? 'checkbox' : 'radio'}
                        name={`correct-${q.id || i}`}
                        checked={
                          qType === 'multi'
                            ? (q.multiCorrect || [q.correct]).includes(ci)
                            : q.correct === ci
                        }
                        onChange={() => {
                          if (qType === 'multi') {
                            const cur = q.multiCorrect || [q.correct]
                            const next = cur.includes(ci) ? cur.filter((x) => x !== ci) : [...cur, ci]
                            patchQ(i, { multiCorrect: next })
                          } else {
                            patchQ(i, { correct: ci as 0 | 1 | 2 | 3 })
                          }
                        }}
                        title="Märgi õigeks vastuseks"
                      />
                      <input
                        className="input-field text-xs flex-1"
                        placeholder={['A', 'B', 'C', 'D'][ci]}
                        value={c}
                        onChange={(e) => {
                          const choices = [...q.choices] as [string, string, string, string]
                          choices[ci] = e.target.value
                          patchQ(i, { choices })
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 2. TRUE / FALSE */}
              {qType === 'true_false' && (
                <div className="flex gap-4 items-center bg-white/5 p-2 rounded-xl">
                  <span className="text-xs text-white/60">Õige vastus:</span>
                  <label className="flex items-center gap-1.5 text-xs text-sky-300 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name={`tf-${q.id || i}`}
                      checked={q.correct === 0}
                      onChange={() => patchQ(i, { correct: 0 })}
                    />
                    TÕENE
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-rose-300 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name={`tf-${q.id || i}`}
                      checked={q.correct === 1}
                      onChange={() => patchQ(i, { correct: 1 })}
                    />
                    VÄÄR
                  </label>
                </div>
              )}

              {/* 3. SLIDER */}
              {qType === 'slider' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/5 p-2.5 rounded-xl text-xs">
                  <label>
                    Min:
                    <input
                      type="number"
                      className="input-field text-xs mt-1"
                      value={q.sliderMin ?? 0}
                      onChange={(e) => patchQ(i, { sliderMin: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Max:
                    <input
                      type="number"
                      className="input-field text-xs mt-1"
                      value={q.sliderMax ?? 100}
                      onChange={(e) => patchQ(i, { sliderMax: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Õige sihtnumber:
                    <input
                      type="number"
                      className="input-field text-xs font-bold text-amber-300 mt-1"
                      value={q.sliderTarget ?? 50}
                      onChange={(e) => patchQ(i, { sliderTarget: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Ühik (nt %, km, aastat):
                    <input
                      className="input-field text-xs mt-1"
                      placeholder="nt km"
                      value={q.sliderUnit || ''}
                      onChange={(e) => patchQ(i, { sliderUnit: e.target.value })}
                    />
                  </label>
                </div>
              )}

              {/* 4. TYPE ANSWER */}
              {qType === 'type_answer' && (
                <div className="bg-white/5 p-2.5 rounded-xl space-y-1.5 text-xs">
                  <label className="block text-white/60">
                    Õiged vastused (eralda komaga, väiketähed kontrollitakse automaatselt):
                  </label>
                  <input
                    className="input-field text-xs font-bold text-emerald-300"
                    placeholder="nt Tallinn, tallin"
                    value={(q.acceptedAnswers || [q.choices[q.correct]]).join(', ')}
                    onChange={(e) => {
                      const split = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                      patchQ(i, {
                        acceptedAnswers: split,
                        choices: [split[0] || '', '', '', ''],
                      })
                    }}
                  />
                </div>
              )}

              {/* Image URL & upload */}
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  className="input-field text-xs flex-1 min-w-[8rem]"
                  placeholder="Pildi URL või laadi fail"
                  value={q.imageUrl || ''}
                  onChange={(e) => patchQ(i, { imageUrl: e.target.value || undefined })}
                />
                <label className="btn-outline text-[10px] cursor-pointer !py-1">
                  Fail
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      if (f.size > 400_000) {
                        alert('Pilt liiga suur (max ~400 KB). Kasuta väiksemat faili või https URL-i.')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        patchQ(i, { imageUrl: String(reader.result || '') })
                      }
                      reader.readAsDataURL(f)
                    }}
                  />
                </label>
                {q.imageUrl && (
                  <button
                    type="button"
                    className="text-[10px] text-accent-red"
                    onClick={() => patchQ(i, { imageUrl: undefined })}
                  >
                    Eemalda pilt
                  </button>
                )}
              </div>
              {q.imageUrl && (
                <img src={q.imageUrl} alt="" className="max-h-20 rounded border border-white/10 object-contain" />
              )}

              <input
                className="input-field text-xs"
                placeholder="Hosti märkus (nt lisainfo)"
                value={q.hostNote || ''}
                onChange={(e) => patchQ(i, { hostNote: e.target.value || undefined })}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="btn-outline text-sm flex items-center gap-1" onClick={addQ}>
          <Plus size={14} /> Lisa küsimus
        </button>
        <p className="text-xs text-white/35">{questions.length} küsimust</p>
      </div>
    </div>
  )
}
