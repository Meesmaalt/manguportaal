import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { pb, formatPbError, type Pack, type KuldvillakPackData } from '@/lib/pocketbase'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { ArrowLeft, Save, Code2, LayoutTemplate, Plus, Trash2, Share2, Languages, Globe } from 'lucide-react'
import { appUrl } from '@/lib/config'
import BlitzPackEditor from '@/games/blitz/BlitzPackEditor'
import type { BlitzQuestion } from '@/games/blitz/types'
import { splitBilingualText } from '@/components/BilingualText'

type Mode = 'visual' | 'json'

type CatQ = { points: number; q: string; a: string; q_tr?: string; a_tr?: string; hostNote?: string; imageUrl?: string }
type Cat = { name: string; name_tr?: string; questions: CatQ[] }

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
  const [finalQ_tr, setFinalQ_tr] = useState('')
  const [finalA, setFinalA] = useState('')
  const [finalA_tr, setFinalA_tr] = useState('')
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
        (d.categories || []).map((c) => {
          const catSplit = splitBilingualText(c.name, c.name_tr)
          return {
            name: catSplit.primary,
            name_tr: catSplit.secondary || '',
            questions: (c.questions || []).map((q) => {
              const qSplit = splitBilingualText(q.q, q.q_tr)
              const aSplit = splitBilingualText(q.a, q.a_tr)
              return {
                points: q.points,
                q: qSplit.primary,
                q_tr: qSplit.secondary || '',
                a: aSplit.primary,
                a_tr: aSplit.secondary || '',
                hostNote: q.hostNote || '',
                imageUrl: q.imageUrl,
              }
            }),
          }
        })
      )
      const fjQ = splitBilingualText(d.finalJeopardy?.q, d.finalJeopardy?.q_tr)
      const fjA = splitBilingualText(d.finalJeopardy?.a, d.finalJeopardy?.a_tr)
      setFinalQ(fjQ.primary)
      setFinalQ_tr(fjQ.secondary || '')
      setFinalA(fjA.primary)
      setFinalA_tr(fjA.secondary || '')
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
          ...(c.name_tr?.trim() ? { name_tr: c.name_tr.trim() } : {}),
          questions: c.questions.map((q) => ({
            points: q.points,
            q: q.q,
            a: q.a,
            ...(q.q_tr?.trim() ? { q_tr: q.q_tr.trim() } : {}),
            ...(q.a_tr?.trim() ? { a_tr: q.a_tr.trim() } : {}),
            ...(q.hostNote?.trim() ? { hostNote: q.hostNote.trim() } : {}),
            ...(q.imageUrl ? { imageUrl: q.imageUrl } : {}),
          })),
        })),
        ...(finalQ.trim() || finalA.trim()
          ? {
              finalJeopardy: {
                q: finalQ,
                a: finalA,
                ...(finalQ_tr.trim() ? { q_tr: finalQ_tr.trim() } : {}),
                ...(finalA_tr.trim() ? { a_tr: finalA_tr.trim() } : {}),
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

  const [translating, setTranslating] = useState(false)
  const [translateModalOpen, setTranslateModalOpen] = useState(false)
  const [targetLang, setTargetLang] = useState('Inglise')

  async function handleAITranslate(lang: string) {
    setTranslating(true)
    setError('')
    try {
      const data = mode === 'json' ? JSON.parse(jsonText) : buildDataFromVisual()
      
      const res = await fetch(appUrl('/api/ai/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          packData: data, 
          gameType: pack?.game_type, 
          targetLanguage: lang
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      
      const translatedData = json.translatedData
      
      setJsonText(JSON.stringify(translatedData, null, 2))
      if (pack) hydrateVisual(pack.game_type, translatedData)
      
      alert('Tõlge lisatud! Vaata tulemus üle ja vajuta all "Salvesta muudatused".')
      setTranslateModalOpen(false)
    } catch (e: any) {
      setError(e.message || 'Tõlkimine ebaõnnestus')
      setTranslateModalOpen(false)
    } finally {
      setTranslating(false)
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
                      <label className="text-[11px] text-white/50 block mb-1 flex items-center gap-1 font-semibold">
                        <Globe size={12} className="text-accent-cyan" /> Kategooria tõlge (valikuline)
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
                        className="text-accent-red p-2 hover:bg-accent-red/10 rounded-lg transition"
                        title="Kustuta kategooria"
                        onClick={() => setCategories(categories.filter((_, i) => i !== cIdx))}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {cat.questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-3 rounded-xl bg-black/25 border border-white/5 space-y-2">
                      {/* 1. Põhikeele lahtrid */}
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
                            next[cIdx].questions[qIdx] = { ...q, q: e.target.value }
                            setCategories(next)
                          }}
                        />
                        <input
                          className="input-field text-sm"
                          placeholder="Vastus (põhikeel)"
                          value={q.a}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...q, a: e.target.value }
                            setCategories(next)
                          }}
                        />
                      </div>

                      {/* 2. Tõlgitud lahtrid eraldi kordinaatides */}
                      <div className="grid grid-cols-[54px_1fr_1fr] gap-2 items-center">
                        <div className="text-[10px] text-accent-cyan/80 font-bold uppercase tracking-wider text-center flex items-center justify-center gap-0.5">
                          <Globe size={11} /> TR
                        </div>
                        <input
                          className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan"
                          placeholder="🌐 Tõlgitud küsimus (nt inglise k.)"
                          value={q.q_tr || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...q, q_tr: e.target.value }
                            setCategories(next)
                          }}
                        />
                        <input
                          className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan"
                          placeholder="🌐 Tõlgitud vastus (nt inglise k.)"
                          value={q.a_tr || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...q, a_tr: e.target.value }
                            setCategories(next)
                          }}
                        />
                      </div>

                      {/* 3. Märkus ja pilt */}
                      <div className="flex gap-2 pt-1 flex-wrap items-center">
                        <input
                          className="input-field text-xs text-amber-100/90 flex-1 min-w-[140px]"
                          placeholder="Hosti märkus (ainult mängujuhile)"
                          value={q.hostNote || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...q, hostNote: e.target.value }
                            setCategories(next)
                          }}
                        />
                        <input
                          className="input-field text-xs flex-1 min-w-[140px]"
                          placeholder="Pildi URL või laadi fail"
                          value={q.imageUrl || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...q, imageUrl: e.target.value || undefined }
                            setCategories(next)
                          }}
                        />
                        <label className="btn-outline text-[10px] cursor-pointer !py-1 px-3 flex items-center justify-center whitespace-nowrap">
                          Lisa fail
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              if (f.size > 400_000) {
                                alert('Pilt liiga suur (max ~400 KB). Kasuta väiksemat faili või URL-i.')
                                return
                              }
                              const reader = new FileReader()
                              reader.onload = () => {
                                const next = [...categories]
                                next[cIdx].questions[qIdx] = { ...q, imageUrl: String(reader.result || '') }
                                setCategories(next)
                              }
                              reader.readAsDataURL(f)
                            }}
                          />
                        </label>
                        {q.imageUrl && (
                          <button
                            type="button"
                            className="btn-outline text-[10px] text-accent-red !py-1 px-3 whitespace-nowrap"
                            onClick={() => {
                              const next = [...categories]
                              next[cIdx].questions[qIdx] = { ...q, imageUrl: undefined }
                              setCategories(next)
                            }}
                          >
                            Eemalda pilt
                          </button>
                        )}
                      </div>
                      {q.imageUrl && (
                        <div className="pt-1">
                          <img src={q.imageUrl} alt="" className="max-h-24 rounded border border-white/10 object-contain bg-black/20" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
            <div className="card-panel p-4 space-y-3 border-gold/40">
              <div className="font-display text-gold text-sm font-bold flex items-center gap-2">
                🏆 Final Jeopardy
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gold/70 block mb-1">Finaali küsimus</label>
                  <input className="input-field text-sm" placeholder="Küsimus" value={finalQ} onChange={(e) => setFinalQ(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-white/50 block mb-1 flex items-center gap-1">
                    <Globe size={11} className="text-accent-cyan" /> Finaali küsimuse tõlge
                  </label>
                  <input className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan" placeholder="🌐 Tõlgitud küsimus" value={finalQ_tr} onChange={(e) => setFinalQ_tr(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gold/70 block mb-1">Finaali vastus</label>
                  <input className="input-field text-sm" placeholder="Vastus" value={finalA} onChange={(e) => setFinalA(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-white/50 block mb-1 flex items-center gap-1">
                    <Globe size={11} className="text-accent-cyan" /> Finaali vastuse tõlge
                  </label>
                  <input className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan" placeholder="🌐 Tõlgitud vastus" value={finalA_tr} onChange={(e) => setFinalA_tr(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-amber-200/70 block mb-1">Hosti märkus</label>
                <input className="input-field text-xs" placeholder="Hosti märkus" value={finalNote} onChange={(e) => setFinalNote(e.target.value)} />
              </div>
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
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-outline text-xs inline-flex items-center gap-1.5"
            onClick={() => {
              const url = appUrl(`/pack/${pack.id}`)
              navigator.clipboard.writeText(url).catch(() => {})
              alert('Jagamislink kopeeritud:\n' + url)
            }}
          >
            <Share2 size={14} /> Kopeeri jagamislink
          </button>
          
          <button
            type="button"
            className="btn-outline text-xs inline-flex items-center gap-1.5 border-purple-500/30 text-purple-300 hover:text-purple-200 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setTranslateModalOpen(true)}
            disabled={translating}
          >
            <Languages size={14} /> {translating ? 'Tõlgin...' : 'AI Tõlgi (paralleelkeel)'}
          </button>
        </div>
      )}
      {error && <p className="text-accent-red text-sm">{error}</p>}
        <button type="button" className="btn-gold flex items-center gap-2" disabled={saving} onClick={save}>
          <Save size={16} /> {saving ? '…' : t('savePack')}
        </button>
      </div>

      {translateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="card-panel max-w-sm w-full p-6 border-purple-500/30 shadow-2xl shadow-purple-500/10">
            <h3 className="font-display text-xl text-purple-300 mb-2">Tõlgi pakk</h3>
            <p className="text-white/60 text-sm mb-4 leading-relaxed">
              Mis keelde soovid paki tõlkida? (nt "Inglise", "Vene", "Soome").<br />
              <span className="opacity-70 text-xs">Tõlge lisatakse teksti lõppu (nt "Õun / Apple"). Enne jätkamist veendu, et pakk on hetke kujul salvestatud.</span>
            </p>
            <input
              className="input-field mb-6 w-full font-bold"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              placeholder="Sisesta keel..."
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn-outline text-sm"
                onClick={() => setTranslateModalOpen(false)}
              >
                Tühista
              </button>
              <button
                type="button"
                className="btn-gold text-sm !bg-purple-600/20 !border-purple-500/50 !text-purple-200 hover:!bg-purple-600/40"
                onClick={() => {
                  setTranslateModalOpen(false)
                  if (targetLang.trim()) {
                    handleAITranslate(targetLang.trim())
                  }
                }}
              >
                Tõlgi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
