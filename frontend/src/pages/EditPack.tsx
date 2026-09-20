import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { pb, formatPbError, type Pack, type KuldvillakPackData } from '@/lib/pocketbase'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import {
  ArrowLeft,
  Save,
  Code2,
  LayoutTemplate,
  Plus,
  Trash2,
  Share2,
  Languages,
  Globe,
  Sparkles,
  Copy,
  Check,
  Wand2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { appUrl } from '@/lib/config'
import BlitzPackEditor from '@/games/blitz/BlitzPackEditor'
import type { BlitzQuestion } from '@/games/blitz/types'
import { splitBilingualText } from '@/components/BilingualText'
import type { MiljonarQuestion } from '@/games/miljonar/types'
import { MILJONAR_LADDER, formatPrize } from '@/games/miljonar/types'
import { MILJONAR_KLASSIKA_QUESTIONS } from '@/games/miljonar/miljonarPacks'

type Mode = 'visual' | 'json'

type CatQ = { points: number; q: string; a: string; q_tr?: string; a_tr?: string; hostNote?: string; imageUrl?: string }
type Cat = { name: string; name_tr?: string; questions: CatQ[] }

interface RoosideAnswer {
  text: string
  points: number
}
interface RoosideRound {
  title: string
  multiplier: number
  question: string
  answers: RoosideAnswer[]
}
interface RoosideFinalQ {
  question: string
  answers: RoosideAnswer[]
}

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
  const [jsonCopied, setJsonCopied] = useState(false)
  const [jsonValidationMsg, setJsonValidationMsg] = useState<{ valid: boolean; message: string }>({ valid: true, message: '' })

  // Kuldvillak state
  const [categories, setCategories] = useState<Cat[]>([])
  const [finalQ, setFinalQ] = useState('')
  const [finalQ_tr, setFinalQ_tr] = useState('')
  const [finalA, setFinalA] = useState('')
  const [finalA_tr, setFinalA_tr] = useState('')
  const [finalNote, setFinalNote] = useState('')

  // Miljonär state
  const [miljonarQs, setMiljonarQs] = useState<MiljonarQuestion[]>([])
  const [miljonarBackups, setMiljonarBackups] = useState<MiljonarQuestion[]>([])

  // Rooside Sõda state
  const [roosideRounds, setRoosideRounds] = useState<RoosideRound[]>([])
  const [roosideFinal, setRoosideFinal] = useState<RoosideFinalQ[]>([])

  // Kinnistu Deal state
  const [dealWinSets, setDealWinSets] = useState(3)
  const [dealStartHand, setDealStartHand] = useState(5)
  const [dealTheme, setDealTheme] = useState('')
  const [dealNote, setDealNote] = useState('')

  // Line-based games state
  const [linesText, setLinesText] = useState('')

  // Blitz state
  const [blitzQs, setBlitzQs] = useState<BlitzQuestion[]>([])
  const [blitzSec, setBlitzSec] = useState(20)
  const [blitzMax, setBlitzMax] = useState(1000)
  const [blitzReveal, setBlitzReveal] = useState(5)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Validate JSON on jsonText change
  useEffect(() => {
    if (!jsonText.trim()) {
      setJsonValidationMsg({ valid: true, message: '' })
      return
    }
    try {
      JSON.parse(jsonText)
      setJsonValidationMsg({ valid: true, message: 'JSON on korrektne' })
    } catch (e: any) {
      setJsonValidationMsg({ valid: false, message: e.message || 'Vigane JSON süntaks' })
    }
  }, [jsonText])

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

    if (gameType === 'miljonar') {
      const d = data as Record<string, any>
      let list: MiljonarQuestion[] = []
      if (Array.isArray(d)) list = d
      else if (Array.isArray(d.questions)) list = d.questions
      else if (Array.isArray(d.data)) list = d.data

      if (!list || list.length === 0) {
        list = MILJONAR_KLASSIKA_QUESTIONS.filter((q) => !q.backup)
      }

      // Ensure 15 items with ladder info
      const fullList: MiljonarQuestion[] = list.slice(0, 15).map((q, idx) => {
        const step = MILJONAR_LADDER[idx] || { prize: 100, isMilestone: false }
        return {
          id: q.id || `m-${idx + 1}`,
          tier: idx + 1,
          prize: step.prize,
          q: q.q || '',
          choices: Array.isArray(q.choices) && q.choices.length === 4
            ? [q.choices[0] || '', q.choices[1] || '', q.choices[2] || '', q.choices[3] || '']
            : ['', '', '', ''],
          correct: (typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0) as 0 | 1 | 2 | 3,
          hostNote: q.hostNote || '',
          funFact: q.funFact || '',
          difficulty: q.difficulty || (idx < 5 ? 'easy' : idx < 10 ? 'medium' : 'hard'),
        }
      })
      while (fullList.length < 15) {
        const idx = fullList.length
        const def = MILJONAR_KLASSIKA_QUESTIONS[idx] || {
          id: `m-${idx + 1}`,
          tier: idx + 1,
          prize: MILJONAR_LADDER[idx]?.prize || 100,
          q: '',
          choices: ['', '', '', ''],
          correct: 0,
        }
        fullList.push({ ...def, tier: idx + 1 })
      }
      setMiljonarQs(fullList)
      setMiljonarBackups(Array.isArray(d?.backupQuestions) ? d.backupQuestions : [])
      return
    }

    if (gameType === 'roosidesoda') {
      const d = data as Record<string, any>
      const rds = Array.isArray(d?.rounds) ? d.rounds : []
      if (rds.length > 0) {
        setRoosideRounds(
          rds.map((r: any, rIdx: number) => ({
            title: r.title || `VOOR ${rIdx + 1}`,
            multiplier: Number(r.multiplier) || (rIdx >= 3 ? 3 : rIdx === 2 ? 2 : 1),
            question: r.question || '',
            answers: Array.isArray(r.answers)
              ? r.answers.map((ans: any) => ({
                  text: typeof ans === 'string' ? ans : ans.text || '',
                  points: typeof ans === 'object' ? Number(ans.points) || 10 : 10,
                }))
              : [30, 20, 15, 10, 8, 5].map((p) => ({ text: '', points: p })),
          }))
        )
      } else {
        setRoosideRounds([
          {
            title: 'VOOR 1',
            multiplier: 1,
            question: '',
            answers: [35, 25, 18, 12, 6, 4].map((p) => ({ text: '', points: p })),
          },
        ])
      }
      setRoosideFinal(Array.isArray(d?.finalRound) ? d.finalRound : [])
      return
    }

    if (gameType === 'kinnistu_deal') {
      const d = data as Record<string, any>
      setDealWinSets(Number(d.winSets) || 3)
      setDealStartHand(Number(d.startHand) || 5)
      setDealTheme(d.theme || '')
      setDealNote(d.note || '')
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
    } else {
      setLinesText(JSON.stringify(data, null, 2))
    }
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
    if (pack.game_type === 'miljonar') {
      return {
        name: name.trim() || 'Miljonär',
        questions: miljonarQs,
        backupQuestions: miljonarBackups,
      }
    }
    if (pack.game_type === 'roosidesoda') {
      return {
        rounds: roosideRounds.map((r) => ({
          title: r.title,
          multiplier: r.multiplier,
          question: r.question,
          answers: r.answers.filter((a) => a.text.trim() !== ''),
        })),
        ...(roosideFinal.length > 0 ? { finalRound: roosideFinal } : {}),
      }
    }
    if (pack.game_type === 'kinnistu_deal') {
      return {
        winSets: dealWinSets,
        startHand: dealStartHand,
        theme: dealTheme.trim() || undefined,
        note: dealNote.trim() || undefined,
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

  function formatJsonText() {
    try {
      let raw = jsonText.trim()
      if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim()
      if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '').trim()
      const parsed = JSON.parse(raw)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonText(formatted)
      setError('')
    } catch (e: any) {
      setError('JSON vormindamine ebaõnnestus: ' + (e?.message || 'Vigane süntaks'))
    }
  }

  function copyJson() {
    navigator.clipboard.writeText(jsonText).catch(() => {})
    setJsonCopied(true)
    setTimeout(() => setJsonCopied(false), 2000)
  }

  function switchMode(next: Mode) {
    if (next === mode) return
    try {
      if (next === 'json') {
        const data = mode === 'visual' ? buildDataFromVisual() : JSON.parse(jsonText)
        setJsonText(JSON.stringify(data, null, 2))
      } else {
        let raw = jsonText.trim()
        if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim()
        if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '').trim()
        const data = JSON.parse(raw)
        if (pack) hydrateVisual(pack.game_type, data)
      }
      setMode(next)
      setError('')
    } catch (e: any) {
      setError(e?.message || 'JSON vigane. Paranda JSON enne visuaalvaatesse minekut.')
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
      let data: unknown
      if (mode === 'json') {
        let raw = jsonText.trim()
        if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim()
        if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '').trim()
        data = JSON.parse(raw)
      } else {
        data = buildDataFromVisual()
      }
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
          targetLanguage: lang,
        }),
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
  const isMiljonar = pack.game_type === 'miljonar'
  const isRoosid = pack.game_type === 'roosidesoda'
  const isDeal = pack.game_type === 'kinnistu_deal'
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

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => switchMode('visual')}
          className={`btn-outline text-sm flex items-center gap-1.5 ${mode === 'visual' ? 'bg-gold/20 border-gold text-gold font-bold' : ''}`}
        >
          <LayoutTemplate size={14} /> {t('editVisual')}
        </button>
        <button
          type="button"
          onClick={() => switchMode('json')}
          className={`btn-outline text-sm flex items-center gap-1.5 ${mode === 'json' ? 'bg-gold/20 border-gold text-gold font-bold' : ''}`}
        >
          <Code2 size={14} /> {t('editJson')}
        </button>
      </div>

      <div className="space-y-5">
        {/* Name & Description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gold/80 block">Paki pealkiri</label>
          <input
            className="input-field text-base font-medium"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Paki nimi"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/50 block">Paki lühikirjeldus (valikuline)</label>
          <input
            className="input-field text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lühikirjeldus teemast või raskusastmest..."
          />
        </div>

        {/* JSON MODE VIEW */}
        {mode === 'json' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900/80 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60 font-medium">{t('editJsonHint')}</span>
                {jsonValidationMsg.valid ? (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 size={12} /> Kehtiv JSON
                  </span>
                ) : (
                  <span className="text-[11px] text-accent-red flex items-center gap-1 bg-accent-red/10 px-2 py-0.5 rounded-md border border-accent-red/20">
                    <AlertCircle size={12} /> Vigane JSON
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={formatJsonText}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 hover:border-gold"
                  title="Vorminda ja korrasta JSON taanded"
                >
                  <Wand2 size={12} />
                  <span>Vorminda JSON</span>
                </button>
                <button
                  type="button"
                  onClick={copyJson}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1"
                  title="Kopeeri JSON lõikelauale"
                >
                  {jsonCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{jsonCopied ? 'Kopeeritud!' : 'Kopeeri'}</span>
                </button>
              </div>
            </div>

            <textarea
              className="input-field font-mono text-xs min-h-[380px] leading-relaxed p-3.5 bg-[#050b18] border-gold/30 text-emerald-200 focus:text-white"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
            />

            {!jsonValidationMsg.valid && (
              <p className="text-accent-red text-xs p-2 rounded bg-accent-red/10 border border-accent-red/30">
                {jsonValidationMsg.message}
              </p>
            )}
          </div>
        )}

        {/* VISUAL MODE: KULDVILLAK */}
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

                      {/* 2. Tõlgitud lahtrid */}
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
                          placeholder="Pildi URL"
                          value={q.imageUrl || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...q, imageUrl: e.target.value || undefined }
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

        {/* VISUAL MODE: MILJONÄR */}
        {mode === 'visual' && isMiljonar && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-gold/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-gold flex items-center gap-2">
                  <Sparkles size={16} /> 15 astet miljonini (100 € → 1 000 000 €)
                </h3>
                <p className="text-white/50 text-xs">
                  Vali igal astmel õige vastuse täht (A, B, C või D).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {miljonarQs.map((q, idx) => {
                const step = MILJONAR_LADDER[idx] || { prize: 100, isMilestone: false }
                const letters = ['A', 'B', 'C', 'D']

                return (
                  <div
                    key={q.id || idx}
                    className={`card-panel p-4 space-y-3 ${
                      step.isMilestone ? 'border-amber-400/60 bg-amber-950/20' : 'border-white/10 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                            step.isMilestone ? 'bg-amber-500 text-black' : 'bg-blue-900 text-cyan-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-mono text-sm font-bold text-amber-400">
                          {formatPrize(step.prize)}
                        </span>
                        {step.isMilestone && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Turvasumma
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40">Aste {idx + 1}/15</span>
                    </div>

                    <div>
                      <label className="text-xs text-white/70 block mb-1">Küsimus</label>
                      <input
                        type="text"
                        placeholder={`Aste ${idx + 1} küsimus...`}
                        className="input-field text-sm font-medium"
                        value={q.q}
                        onChange={(e) => {
                          const next = [...miljonarQs]
                          next[idx] = { ...q, q: e.target.value }
                          setMiljonarQs(next)
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/70 block">Vastusevariandid & Õige valik</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.choices.map((choice, cIdx) => {
                          const isCorrect = q.correct === cIdx
                          return (
                            <div
                              key={cIdx}
                              onClick={() => {
                                const next = [...miljonarQs]
                                next[idx] = { ...q, correct: cIdx as 0 | 1 | 2 | 3 }
                                setMiljonarQs(next)
                              }}
                              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                                isCorrect
                                  ? 'bg-emerald-950/60 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                                  : 'bg-slate-950/40 border-white/10 hover:border-white/30'
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                  isCorrect ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-amber-400'
                                }`}
                              >
                                {letters[cIdx]}
                              </span>
                              <input
                                type="text"
                                placeholder={`Valik ${letters[cIdx]}`}
                                className="input-field text-xs flex-1 !bg-transparent !border-0 focus:!ring-0 p-0"
                                value={choice}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const next = [...miljonarQs]
                                  const nextChoices = [...q.choices] as [string, string, string, string]
                                  nextChoices[cIdx] = e.target.value
                                  next[idx] = { ...q, choices: nextChoices }
                                  setMiljonarQs(next)
                                }}
                              />
                              {isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/20 shrink-0">
                                  ÕIGE ✓
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Saatejuhi kommentaar / vihje"
                        className="input-field text-xs text-amber-100/80"
                        value={q.hostNote || ''}
                        onChange={(e) => {
                          const next = [...miljonarQs]
                          next[idx] = { ...q, hostNote: e.target.value }
                          setMiljonarQs(next)
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Lõbus lisafakt (funFact)"
                        className="input-field text-xs text-cyan-200/80"
                        value={q.funFact || ''}
                        onChange={(e) => {
                          const next = [...miljonarQs]
                          next[idx] = { ...q, funFact: e.target.value }
                          setMiljonarQs(next)
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VISUAL MODE: ROOSIDE SÕDA */}
        {mode === 'visual' && isRoosid && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-900/80 rounded-2xl border border-gold/30">
              <div>
                <h3 className="text-sm font-display font-bold text-gold">Rooside Sõja voorud</h3>
                <p className="text-white/50 text-xs">
                  Igas voorus küsitlusküsimus ja 100 inimese hääletustulemused.
                </p>
              </div>
              <button
                type="button"
                className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 hover:border-gold"
                onClick={() => {
                  const newIdx = roosideRounds.length + 1
                  setRoosideRounds([
                    ...roosideRounds,
                    {
                      title: `VOOR ${newIdx}`,
                      multiplier: newIdx >= 4 ? 3 : newIdx === 3 ? 2 : 1,
                      question: '',
                      answers: [30, 20, 15, 10, 8, 5].map((p) => ({ text: '', points: p })),
                    },
                  ])
                }}
              >
                <Plus size={14} /> Lisa voor
              </button>
            </div>

            <div className="space-y-4">
              {roosideRounds.map((r, rIdx) => (
                <div key={rIdx} className="card-panel p-4 border-gold/30 space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input-field text-xs font-display font-bold text-gold w-28 !py-1"
                        value={r.title}
                        onChange={(e) => {
                          const next = [...roosideRounds]
                          next[rIdx] = { ...r, title: e.target.value }
                          setRoosideRounds(next)
                        }}
                      />
                      <select
                        className="input-field text-xs !py-1 w-28"
                        value={r.multiplier}
                        onChange={(e) => {
                          const next = [...roosideRounds]
                          next[rIdx] = { ...r, multiplier: Number(e.target.value) }
                          setRoosideRounds(next)
                        }}
                      >
                        <option value={1}>1× punktid</option>
                        <option value={2}>2× punktid</option>
                        <option value={3}>3× punktid</option>
                        <option value={4}>4× punktid</option>
                      </select>
                    </div>

                    {roosideRounds.length > 1 && (
                      <button
                        type="button"
                        className="text-accent-red p-1.5 hover:bg-accent-red/10 rounded-lg transition"
                        title="Kustuta voor"
                        onClick={() => setRoosideRounds(roosideRounds.filter((_, i) => i !== rIdx))}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-white/70 block mb-1">Vooru küsitlusküsimus</label>
                    <input
                      type="text"
                      placeholder="nt Nimetage midagi, mida inimesed unustavad kodust lahkudes..."
                      className="input-field text-sm"
                      value={r.question}
                      onChange={(e) => {
                        const next = [...roosideRounds]
                        next[rIdx] = { ...r, question: e.target.value }
                        setRoosideRounds(next)
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 block">Vastused ja punktid (1-100)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {r.answers.map((ans, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/40 border border-white/5"
                        >
                          <span className="text-xs text-gold/60 font-bold px-1.5">{aIdx + 1}.</span>
                          <input
                            type="text"
                            placeholder={`Vastus ${aIdx + 1}`}
                            className="input-field text-xs flex-1 !bg-transparent !border-0 focus:!ring-0 p-0"
                            value={ans.text}
                            onChange={(e) => {
                              const next = [...roosideRounds]
                              const nextAns = [...r.answers]
                              nextAns[aIdx] = { ...ans, text: e.target.value }
                              next[rIdx] = { ...r, answers: nextAns }
                              setRoosideRounds(next)
                            }}
                          />
                          <input
                            type="number"
                            placeholder="p"
                            className="input-field text-xs w-14 font-mono font-bold text-amber-400 text-center !py-1"
                            value={ans.points || ''}
                            onChange={(e) => {
                              const next = [...roosideRounds]
                              const nextAns = [...r.answers]
                              nextAns[aIdx] = { ...ans, points: Number(e.target.value) || 0 }
                              next[rIdx] = { ...r, answers: nextAns }
                              setRoosideRounds(next)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISUAL MODE: KINNISTU DEAL */}
        {mode === 'visual' && isDeal && (
          <div className="card-panel p-5 border-gold/30 space-y-4">
            <h3 className="text-sm font-display font-bold text-gold">Kinnistu Deal seadistus</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/70 block mb-1">Võiduks vajalikke komplekte</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="input-field text-sm"
                  value={dealWinSets}
                  onChange={(e) => setDealWinSets(Number(e.target.value) || 3)}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">Algkäe kaartide arv</label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  className="input-field text-sm"
                  value={dealStartHand}
                  onChange={(e) => setDealStartHand(Number(e.target.value) || 5)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/70 block mb-1">Teema / Stiil (valikuline)</label>
              <input
                type="text"
                placeholder="nt pulm, tartu, kontor..."
                className="input-field text-sm"
                value={dealTheme}
                onChange={(e) => setDealTheme(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-white/70 block mb-1">Mängujuhi reeglid / märkused</label>
              <textarea
                placeholder="Erirežiimi lisajuhised..."
                className="input-field text-xs min-h-[100px]"
                value={dealNote}
                onChange={(e) => setDealNote(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* VISUAL MODE: LINE-BASED GAMES */}
        {mode === 'visual' && isLines && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>
                {pack.game_type === 'tode_voi_tegu'
                  ? 'Vorming: # TÕED … ja # TEOD …'
                  : 'Sisesta iga sõna või väide eraldi reale'}
              </span>
              <span>
                Ridu kokku:{' '}
                <strong className="text-gold">
                  {linesText.split('\n').filter((s) => s.trim().length > 0 && !s.trim().startsWith('#')).length}
                </strong>
              </span>
            </div>
            <textarea
              className="input-field font-mono text-sm min-h-[300px] leading-relaxed p-3.5"
              value={linesText}
              onChange={(e) => setLinesText(e.target.value)}
            />
          </div>
        )}

        {/* VISUAL MODE: BLITZ */}
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

        {/* Toolbar & Save actions */}
        {pack && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
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
                className="btn-outline text-xs inline-flex items-center gap-1.5 border-purple-500/30 text-purple-300 hover:text-purple-200 hover:border-purple-400 disabled:opacity-50"
                onClick={() => setTranslateModalOpen(true)}
                disabled={translating}
              >
                <Languages size={14} /> {translating ? 'Tõlgin...' : 'AI Tõlgi'}
              </button>
            </div>

            <button
              type="button"
              className="btn-gold flex items-center gap-2 font-bold px-6 py-2.5 shadow-lg shadow-gold/20"
              disabled={saving}
              onClick={save}
            >
              <Save size={16} /> {saving ? 'Salvestan…' : t('savePack')}
            </button>
          </div>
        )}

        {error && (
          <div className="text-accent-red text-xs p-3 rounded-xl bg-accent-red/10 border border-accent-red/30">
            {error}
          </div>
        )}
      </div>

      {/* AI Translate modal */}
      {translateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="card-panel max-w-sm w-full p-6 border-purple-500/30 shadow-2xl shadow-purple-500/10 space-y-4">
            <h3 className="font-display text-xl text-purple-300">Tõlgi pakk teise keelde</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Mis keelde soovid paki tõlkida? (nt "Inglise", "Vene", "Soome").
            </p>
            <input
              className="input-field w-full font-bold text-sm"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              placeholder="nt Inglise, Soome, Vene..."
              autoFocus
            />
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                className="btn-outline text-xs"
                onClick={() => setTranslateModalOpen(false)}
              >
                Tühista
              </button>
              <button
                type="button"
                className="btn-gold text-xs !bg-purple-600/30 !border-purple-500/50 !text-purple-200 hover:!bg-purple-600/50"
                onClick={() => {
                  setTranslateModalOpen(false)
                  if (targetLang.trim()) {
                    handleAITranslate(targetLang.trim())
                  }
                }}
              >
                Käivita tõlge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
