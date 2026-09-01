import { useState } from 'react'
import type { BlitzQuestion } from './types'
import { parseBlitzQuestions, questionsToCsv } from './parseQuestions'
import { Plus, Trash2, Upload } from 'lucide-react'

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

export default function BlitzPackEditor({
  questions,
  secondsPerQuestion,
  pointsMax,
  revealSeconds,
  onChange,
}: Props) {
  const [importText, setImportText] = useState('')
  const [importMsg, setImportMsg] = useState('')

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

      <div className="card-panel border-dashed border-gold/30 p-3 space-y-2">
        <p className="text-xs text-white/50">
          Import: JSON massiiv / pack, või CSV/TSV read:{' '}
          <code className="text-gold/80">küsimus,A,B,C,D,õige(0-3|A-D)</code>
        </p>
        <textarea
          className="input-field text-xs font-mono min-h-[5rem]"
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

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="card-panel border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-white/40">#{i + 1}</span>
              <button type="button" className="text-accent-red/70 p-1" onClick={() => removeQ(i)}>
                <Trash2 size={14} />
              </button>
            </div>
            <input
              className="input-field text-sm"
              placeholder="Küsimus"
              value={q.q}
              onChange={(e) => patchQ(i, { q: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {q.choices.map((c, ci) => (
                <div key={ci} className="flex gap-1 items-center">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correct === ci}
                    onChange={() => patchQ(i, { correct: ci as 0 | 1 | 2 | 3 })}
                    title="Õige vastus"
                  />
                  <input
                    className="input-field text-sm flex-1"
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
                    if (f.size > 1_500_000) {
                      alert('Pilt liiga suur (max ~1.5 MB). Tihenda või kasuta URL-i.')
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
              placeholder="Hosti märkus"
              value={q.hostNote || ''}
              onChange={(e) => patchQ(i, { hostNote: e.target.value || undefined })}
            />
          </div>
        ))}
      </div>

      <button type="button" className="btn-outline text-sm flex items-center gap-1" onClick={addQ}>
        <Plus size={14} /> Lisa küsimus
      </button>
      <p className="text-xs text-white/35">{questions.length} küsimust</p>
    </div>
  )
}
