import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { pb, formatPbError, type Pack, type KuldvillakPackData } from '@/lib/pocketbase'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { ArrowLeft, Save, Code2, LayoutTemplate, Plus, Trash2, Share2 } from 'lucide-react'
import { appUrl } from '@/lib/config'
import BlitzPackEditor from '@/games/blitz/BlitzPackEditor'
import type { BlitzQuestion } from '@/games/blitz/types'

type Mode = 'visual' | 'json'

type CatQ = { points: number; q: string; a: string; hostNote?: string }
type Cat = { name: string; questions: CatQ[] }

export default function EditPack() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoggedIn } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [pack, setPack] = useState<Pack | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<Mode>('visual')
  const [jsonText, setJsonText] = useState('')
  const [categories, setCategories] = useState<Cat[]>([])
  const [finalQ, setFinalQ] = useState('')
  const [finalA, setFinalA] = useState('')
  const [finalNote, setFinalNote] = useState('')
  const [linesText, setLinesText] = useState('')
  const [blitzQs, setBlitzQs] = useState<BlitzQuestion[]>([])
  const [blitzSec, setBlitzSec] = useState(20)
  const [blitzMax, setBlitzMax] = useState(1000)
  const [blitzReveal, setBlitzReveal] = useState(5)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    pb.collection('packs')
      .getOne<Pack>(id)
      .then((p) => {
        setPack(p)
        setName(p.name)
        setDescription(p.description || '')
        setJsonText(JSON.stringify(p.data, null, 2))
        hydrateVisual(p.game_type, p.data)
      })
      .catch((e) => setError(formatPbError(e)))
  }, [id])

  function hydrateVisual(gameType: string, data: unknown) {
    if (gameType === 'kuldvillak') {
      const d = data as KuldvillakPackData
      setCategories(
        (d.categories || []).map((c) => ({
          name: c.name,
          questions: (c.questions || []).map((q) => ({
            points: q.points,
            q: q.q,
            a: q.a,
            hostNote: q.hostNote || '',
          })),
        }))
      )
      setFinalQ(d.finalJeopardy?.q || '')
      setFinalA(d.finalJeopardy?.a || '')
      setFinalNote(d.finalJeopardy?.hostNote || '')
      return
    }
    if (gameType === 'roosidesoda') {
      setJsonText(JSON.stringify(data, null, 2))
      setMode('json')
      return
    }
    if (gameType === 'blitz') {
      const d = data as Record<string, unknown>
      setBlitzQs((d.questions as BlitzQuestion[]) || [])
      setBlitzSec(Number(d.secondsPerQuestion) || 20)
      setBlitzMax(Number(d.pointsMax) || 1000)
      setBlitzReveal(Number(d.revealSeconds) ?? 5)
      return
    }
    // line-based packs
    const d = data as Record<string, unknown>
    if (Array.isArray(d.words)) setLinesText((d.words as string[]).join('\n'))
    else if (Array.isArray(d.statements)) setLinesText((d.statements as string[]).join('\n'))
    else if (Array.isArray(d.truths) || Array.isArray(d.dares)) {
      const truths = (d.truths as string[]) || []
      const dares = (d.dares as string[]) || []
      setLinesText(`# TÕED\n${truths.join('\n')}\n\n# TEOD\n${dares.join('\n')}`)
    } else setLinesText(JSON.stringify(data, null, 2))
  }

  function buildDataFromVisual(): unknown {
    if (!pack) return {}
    if (pack.game_type === 'kuldvillak') {
      return {
        categories: categories.map((c) => ({
          name: c.name,
          questions: c.questions.map((q) => ({
            points: q.points,
            q: q.q,
            a: q.a,
            ...(q.hostNote?.trim() ? { hostNote: q.hostNote.trim() } : {}),
          })),
        })),
        ...(finalQ.trim() || finalA.trim()
          ? {
              finalJeopardy: {
                q: finalQ,
                a: finalA,
                ...(finalNote.trim() ? { hostNote: finalNote.trim() } : {}),
              },
            }
          : {}),
      }
    }
    if (pack.game_type === 'sonaseletus') {
      return {
        words: linesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        roundSeconds: 60,
      }
    }
    if (pack.game_type === 'ma_ei_ole_kunagi') {
      return {
        statements: linesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }
    }
    if (pack.game_type === 'viimane_pusti') {
      return {
        statements: linesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        startingLives: 3,
      }
    }
    if (pack.game_type === 'tode_voi_tegu') {
      const parts = linesText.split(/#\s*TEOD/i)
      const truthBlock = (parts[0] || '').replace(/#\s*TÕED/i, '')
      const dareBlock = parts[1] || ''
      return {
        truths: truthBlock
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        dares: dareBlock
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }
    }
    if (pack.game_type === 'blitz') {
      return {
        questions: blitzQs,
        secondsPerQuestion: blitzSec,
        pointsMax: blitzMax,
        revealSeconds: blitzReveal,
        shuffleOnStart: true,
      }
    }
    return JSON.parse(jsonText)
  }

  function switchMode(next: Mode) {
    if (next === mode) return
    try {
      if (next === 'json') {
        const data = mode === 'visual' ? buildDataFromVisual() : JSON.parse(jsonText)
        setJsonText(JSON.stringify(data, null, 2))
      } else {
        const data = JSON.parse(jsonText)
        if (pack) hydrateVisual(pack.game_type, data)
      }
      setMode(next)
      setError('')
    } catch (e: any) {
      setError(e?.message || 'JSON vigane')
    }
  }

  async function save() {
    if (!pack || !user) return
    if (pack.owner !== user.id) {
      setError(t('editOnlyOwn'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = mode === 'json' ? JSON.parse(jsonText) : buildDataFromVisual()
      await pb.collection('packs').update(pack.id, {
        name: name.trim(),
        description: description.trim(),
        data,
      })
      navigate(`/play/${pack.game_type}`)
    } catch (e: any) {
      setError(formatPbError(e))
    } finally {
      setSaving(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center py-16">
        <p className="text-white/70 mb-4">{t('importNeedLogin')}</p>
        <Link to="/login" className="btn-gold">
          {t('navLogin')}
        </Link>
      </div>
    )
  }

  if (error && !pack) {
    return <div className="max-w-lg mx-auto py-16 text-center text-accent-red text-sm px-4">{error}</div>
  }

  if (!pack) {
    return <div className="text-center py-16 text-gold animate-pulse">{t('loadingGame')}</div>
  }

  const isKuld = pack.game_type === 'kuldvillak'
  const isLines =
    pack.game_type === 'sonaseletus' ||
    pack.game_type === 'ma_ei_ole_kunagi' ||
    pack.game_type === 'viimane_pusti' ||
    pack.game_type === 'tode_voi_tegu'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        to={`/play/${pack.game_type}`}
        className="text-white/50 text-sm hover:text-gold inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>
      <h1 className="font-display text-2xl text-gold mb-2">{t('editPack')}</h1>
      <p className="text-white/45 text-sm mb-6">{pack.game_type}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => switchMode('visual')}
          className={`btn-outline text-sm flex items-center gap-1.5 ${mode === 'visual' ? 'bg-gold/20 border-gold' : ''}`}
        >
          <LayoutTemplate size={14} /> {t('editVisual')}
        </button>
        <button
          type="button"
          onClick={() => switchMode('json')}
          className={`btn-outline text-sm flex items-center gap-1.5 ${mode === 'json' ? 'bg-gold/20 border-gold' : ''}`}
        >
          <Code2 size={14} /> {t('editJson')}
        </button>
      </div>

      <div className="space-y-4">
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nimi" />
        <input
          className="input-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kirjeldus"
        />

        {mode === 'json' && (
          <>
            <p className="text-white/40 text-xs">{t('editJsonHint')}</p>
            <textarea
              className="input-field font-mono text-xs min-h-[360px]"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
          </>
        )}

        {mode === 'visual' && isKuld && (
          <div className="space-y-4">
            {categories.map((cat, cIdx) => (
              <div key={cIdx} className="card-panel p-4">
                <div className="flex gap-2 mb-3">
                  <input
                    className="input-field font-display text-gold"
                    value={cat.name}
                    onChange={(e) => {
                      const next = [...categories]
                      next[cIdx] = { ...next[cIdx], name: e.target.value }
                      setCategories(next)
                    }}
                  />
                  {categories.length > 1 && (
                    <button
                      type="button"
                      className="text-accent-red p-2"
                      onClick={() => setCategories(categories.filter((_, i) => i !== cIdx))}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                {cat.questions.map((q, qIdx) => (
                  <div key={qIdx} className="mb-3">
                    <div className="grid grid-cols-[48px_1fr_1fr] gap-2">
                      <div className="text-gold font-bold text-sm flex items-center">{q.points}p</div>
                      <input
                        className="input-field text-sm"
                        placeholder="Küsimus"
                        value={q.q}
                        onChange={(e) => {
                          const next = [...categories]
                          next[cIdx].questions[qIdx] = { ...q, q: e.target.value }
                          setCategories(next)
                        }}
                      />
                      <input
                        className="input-field text-sm"
                        placeholder="Vastus"
                        value={q.a}
                        onChange={(e) => {
                          const next = [...categories]
                          next[cIdx].questions[qIdx] = { ...q, a: e.target.value }
                          setCategories(next)
                        }}
                      />
                    </div>
                    <input
                      className="input-field text-xs mt-1 text-amber-100/90"
                      placeholder="Hosti märkus"
                      value={q.hostNote || ''}
                      onChange={(e) => {
                        const next = [...categories]
                        next[cIdx].questions[qIdx] = { ...q, hostNote: e.target.value }
                        setCategories(next)
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
            <button
              type="button"
              className="btn-outline text-sm flex items-center gap-2"
              onClick={() =>
                setCategories([
                  ...categories,
                  {
                    name: `Kategooria ${categories.length + 1}`,
                    questions: [100, 200, 300, 400, 500].map((points) => ({
                      points,
                      q: '',
                      a: '',
                      hostNote: '',
                    })),
                  },
                ])
              }
            >
              <Plus size={16} /> {t('addCategory')}
            </button>
            <div className="card-panel p-4 space-y-2 border-gold/30">
              <div className="font-display text-gold text-sm">Final Jeopardy</div>
              <input className="input-field text-sm" placeholder="Küsimus" value={finalQ} onChange={(e) => setFinalQ(e.target.value)} />
              <input className="input-field text-sm" placeholder="Vastus" value={finalA} onChange={(e) => setFinalA(e.target.value)} />
              <input className="input-field text-xs" placeholder="Hosti märkus" value={finalNote} onChange={(e) => setFinalNote(e.target.value)} />
            </div>
          </div>
        )}

        {mode === 'visual' && isLines && (
          <div>
            <p className="text-white/45 text-xs mb-2">
              {pack.game_type === 'tode_voi_tegu'
                ? 'Vorming: # TÕED … # TEOD …'
                : 'Üks kirje real'}
            </p>
            <textarea
              className="input-field font-mono text-sm min-h-[280px]"
              value={linesText}
              onChange={(e) => setLinesText(e.target.value)}
            />
          </div>
        )}

        {mode === 'visual' && pack.game_type === 'blitz' && (
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
        {mode === 'visual' && pack.game_type === 'roosidesoda' && (
          <p className="text-white/50 text-sm">
            Rooside Sõda settide jaoks kasuta JSON-vaadet (struktuur on keerulisem).
          </p>
        )}

        {pack && (
        <div className="mb-3">
          <button
            type="button"
            className="btn-outline text-xs inline-flex items-center gap-1"
            onClick={() => {
              const url = appUrl(`/pack/${pack.id}`)
              navigator.clipboard.writeText(url).catch(() => {})
              alert('Jagamislink kopeeritud:\n' + url)
            }}
          >
            <Share2 size={12} /> Kopeeri jagamislink
          </button>
        </div>
      )}
      {error && <p className="text-accent-red text-sm">{error}</p>}
        <button type="button" className="btn-gold flex items-center gap-2" disabled={saving} onClick={save}>
          <Save size={16} /> {saving ? '…' : t('savePack')}
        </button>
      </div>
    </div>
  )
}
