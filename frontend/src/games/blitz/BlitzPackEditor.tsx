import { useState } from 'react'
import type { BlitzQuestion, BlitzQuestionType } from './types'
import { parseBlitzQuestions, questionsToCsv } from './parseQuestions'
import { generateBlitzQuiz } from './generateQuiz'
import { Plus, Trash2, Upload, Sparkles, Loader2, Star, Globe, Languages, Check, AlertCircle } from 'lucide-react'
import ImagePickerField from '@/components/ImagePickerField'
import { appUrl } from '@/lib/config'
import { splitBilingualText } from '@/components/BilingualText'

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

  // AI Translation state
  const [translateOpen, setTranslateOpen] = useState(false)
  const [targetLang, setTargetLang] = useState('Inglise')
  const [translating, setTranslating] = useState(false)
  const [translateMsg, setTranslateMsg] = useState('')
  const [translateErr, setTranslateErr] = useState('')

  const hasAnyTranslations = questions.some(
    (q) => q.q_tr || (q.choices_tr && q.choices_tr.some(Boolean)) || (q.acceptedAnswers_tr && q.acceptedAnswers_tr.length > 0)
  )

  async function handleTranslateQuestions(lang: string) {
    if (!questions.length) return
    setTranslating(true)
    setTranslateErr('')
    setTranslateMsg('')
    try {
      const res = await fetch(appUrl('/api/ai/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packData: { questions },
          gameType: 'blitz',
          targetLanguage: lang,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Tõlkimine ebaõnnestus')

      const raw = json.translatedData
      const nextQs: BlitzQuestion[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.questions)
        ? raw.questions
        : []

      if (!nextQs.length) {
        throw new Error('Vastus ei sisaldanud küsimusi')
      }

      onChange({
        questions: nextQs,
        secondsPerQuestion,
        pointsMax,
        revealSeconds,
      })
      setTranslateMsg(`Tõlge (${lang}) lisatud edukalt kõigile ${nextQs.length} küsimusele!`)
      setTranslateOpen(false)
    } catch (e: any) {
      setTranslateErr(e.message || 'Tõlkimine ebaõnnestus')
    } finally {
      setTranslating(false)
    }
  }

  function handleClearTranslations() {
    if (!confirm('Kas soovid eemaldada kõik teise keele tõlked?')) return
    const cleared = questions.map((q) => {
      const { q_tr, choices_tr, acceptedAnswers_tr, ...rest } = q
      return rest as BlitzQuestion
    })
    onChange({
      questions: cleared,
      secondsPerQuestion,
      pointsMax,
      revealSeconds,
    })
    setTranslateMsg('Kõik tõlked on eemaldatud.')
  }

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

      {/* AI Bilingual Translation Tool */}
      <div className="card-panel border-accent-cyan/40 bg-gradient-to-r from-accent-cyan/10 via-blue-500/10 to-transparent p-4 rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-accent-cyan font-display font-black text-sm">
            <Languages size={18} className="text-accent-cyan" />
            <span>AI Tõlge & Kakskeelsus (Bilingual)</span>
            {hasAnyTranslations && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan font-semibold">
                Tõlgitud
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasAnyTranslations && (
              <button
                type="button"
                onClick={handleClearTranslations}
                className="text-[11px] text-white/50 hover:text-accent-red underline py-1 px-2 transition"
              >
                Eemalda tõlked
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTranslateOpen((v) => !v)
                setTranslateErr('')
                setTranslateMsg('')
              }}
              className="btn-outline text-xs !py-1 !px-3 font-bold border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/15 flex items-center gap-1.5 transition"
            >
              <Globe size={14} />
              {translateOpen ? 'Sulge tõlke tööriist' : '🌐 Ava AI tõlge'}
            </button>
          </div>
        </div>

        {translateMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check size={14} />
            <span>{translateMsg}</span>
          </div>
        )}

        {translateErr && (
          <div className="mt-3 p-2.5 rounded-xl bg-accent-red/15 border border-accent-red/30 text-accent-red text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{translateErr}</span>
          </div>
        )}

        {translateOpen && (
          <div className="mt-4 space-y-3 pt-3 border-t border-white/10 animate-in fade-in">
            <p className="text-xs text-white/70 leading-relaxed">
              Gemini lisab igale Blitz küsimusele ja kõigile 4 valikule teise keele tõlke. Mängijad näevad teleriekraanil ja oma telefonides korraga nii eesti- kui ka võõrkeelseid küsimusi ja vastuseid!
            </p>

            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5">Vali sihtkeel:</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {['Inglise', 'Vene', 'Soome', 'Saksa', 'Hispaania', 'Prantsuse'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTargetLang(lang)}
                    className={`text-xs py-2 px-2.5 rounded-xl border font-medium text-center transition ${
                      targetLang === lang
                        ? 'bg-accent-cyan/25 border-accent-cyan text-accent-cyan font-bold shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                        : 'bg-slate-900/80 border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={translating || !questions.length}
                onClick={() => handleTranslateQuestions(targetLang)}
                className="btn-gold !bg-accent-cyan !text-slate-950 hover:brightness-110 flex-1 text-xs py-2.5 font-black flex items-center justify-center gap-2 shadow-lg"
              >
                {translating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Tõlgin {questions.length} küsimust ja valikuid ({targetLang})...
                  </>
                ) : (
                  <>
                    <Globe size={15} /> Tõlgi kõik küsimused ja valikud {targetLang} keelde ({questions.length} tk)
                  </>
                )}
              </button>
            </div>
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
              <div className="space-y-1.5">
                <input
                  className="input-field text-sm font-semibold"
                  placeholder="Küsimuse tekst…"
                  value={q.q}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.includes(' / ') && !q.q_tr) {
                      const sp = splitBilingualText(val)
                      patchQ(i, { q: sp.primary, q_tr: sp.secondary })
                    } else {
                      patchQ(i, { q: val })
                    }
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <div className="text-[10px] text-accent-cyan/90 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 px-2 py-1 rounded bg-accent-cyan/10 border border-accent-cyan/20">
                    <Globe size={11} /> TR
                  </div>
                  <input
                    className="input-field text-xs text-white/90 bg-slate-950/45 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan flex-1"
                    placeholder="Küsimuse tõlge (nt. inglise keeles)…"
                    value={q.q_tr || ''}
                    onChange={(e) => patchQ(i, { q_tr: e.target.value })}
                  />
                </div>
              </div>

              {/* CONTROLS BASED ON QUESTION TYPE */}

              {/* 1. QUIZ & MULTI */}
              {(qType === 'quiz' || qType === 'multi' || qType === 'poll') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.choices.map((c, ci) => (
                    <div key={ci} className="p-2 rounded-xl bg-black/20 border border-white/5 space-y-1">
                      <div className="flex gap-1.5 items-center">
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
                          className="input-field text-xs flex-1 font-medium"
                          placeholder={['A', 'B', 'C', 'D'][ci]}
                          value={c}
                          onChange={(e) => {
                            const val = e.target.value
                            const choices = [...q.choices] as [string, string, string, string]
                            const choices_tr = [...(q.choices_tr || ['', '', '', ''])] as [string, string, string, string]
                            if (val.includes(' / ') && !choices_tr[ci]) {
                              const sp = splitBilingualText(val)
                              choices[ci] = sp.primary
                              choices_tr[ci] = sp.secondary || ''
                              patchQ(i, { choices, choices_tr })
                            } else {
                              choices[ci] = val
                              patchQ(i, { choices })
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 pl-5">
                        <input
                          className="input-field text-[11px] text-white/80 bg-slate-950/40 border-dashed border-white/15 focus:border-solid focus:border-accent-cyan flex-1"
                          placeholder={`Valiku ${['A', 'B', 'C', 'D'][ci]} tõlge…`}
                          value={q.choices_tr?.[ci] || ''}
                          onChange={(e) => {
                            const choices_tr = [...(q.choices_tr || ['', '', '', ''])] as [string, string, string, string]
                            choices_tr[ci] = e.target.value
                            patchQ(i, { choices_tr })
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. TRUE / FALSE */}
              {qType === 'true_false' && (
                <div className="space-y-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <div className="flex gap-4 items-center">
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
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <span className="text-[10px] text-accent-cyan flex items-center gap-1 font-medium shrink-0">
                      <Globe size={11} /> Tõlge:
                    </span>
                    <input
                      className="input-field !text-[11px] !py-0.5 !px-2 flex-1 bg-slate-950/40 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan"
                      placeholder="True (Tõene tõlge)"
                      value={q.choices_tr?.[0] || ''}
                      onChange={(e) => {
                        const tr = [...(q.choices_tr || ['', '', '', ''])] as [string, string, string, string]
                        tr[0] = e.target.value
                        patchQ(i, { choices_tr: tr })
                      }}
                    />
                    <input
                      className="input-field !text-[11px] !py-0.5 !px-2 flex-1 bg-slate-950/40 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan"
                      placeholder="False (Väär tõlge)"
                      value={q.choices_tr?.[1] || ''}
                      onChange={(e) => {
                        const tr = [...(q.choices_tr || ['', '', '', ''])] as [string, string, string, string]
                        tr[1] = e.target.value
                        patchQ(i, { choices_tr: tr })
                      }}
                    />
                  </div>
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
                <div className="bg-white/5 p-2.5 rounded-xl space-y-2 text-xs">
                  <div>
                    <label className="block text-white/60 mb-1">
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
                  <div>
                    <label className="block text-accent-cyan/80 mb-1 flex items-center gap-1 font-semibold">
                      <Globe size={11} /> Tõlgitud vastused (nt inglise k, eralda komaga):
                    </label>
                    <input
                      className="input-field text-xs text-white/90 bg-slate-950/40 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan"
                      placeholder="nt Tallinn, Revel"
                      value={(q.acceptedAnswers_tr || []).join(', ')}
                      onChange={(e) => {
                        const split = e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                        patchQ(i, { acceptedAnswers_tr: split })
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Image Picker */}
              <ImagePickerField
                value={q.imageUrl}
                onChange={(url) => patchQ(i, { imageUrl: url })}
                placeholder="Pildi URL või laadi fail..."
              />

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
