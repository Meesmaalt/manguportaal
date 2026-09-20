import { useEffect, useState, useRef } from 'react'
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
  Image as ImageIcon,
  Minimize2,
} from 'lucide-react'
import { appUrl } from '@/lib/config'
import BlitzPackEditor from '@/games/blitz/BlitzPackEditor'
import type { BlitzQuestion } from '@/games/blitz/types'
import { splitBilingualText } from '@/components/BilingualText'
import type { MiljonarQuestion } from '@/games/miljonar/types'
import { MILJONAR_LADDER, formatPrize } from '@/games/miljonar/types'
import { MILJONAR_KLASSIKA_QUESTIONS } from '@/games/miljonar/miljonarPacks'
import ImagePickerField from '@/components/ImagePickerField'
import {
  isBase64Image,
  getBase64Size,
  extractAndStripImages,
  restoreImages,
  compressImageFile,
} from '@/lib/imageUtils'

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

  // Image assets map for folding massive Base64 strings in JSON mode
  const [compactBase64, setCompactBase64] = useState(true)
  const [imageAssetsMap, setImageAssetsMap] = useState<Record<string, string>>({})
  const imageAssetsMapRef = useRef<Record<string, string>>({})
  imageAssetsMapRef.current = imageAssetsMap

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
  const [optimizingImages, setOptimizingImages] = useState(false)

  // Converts pack data object into formatted JSON string with optional compact Base64 tags
  function formatDataToJsonString(dataObj: any, compact: boolean): string {
    if (!compact) {
      return JSON.stringify(dataObj, null, 2)
    }
    const { stripped, imageMap } = extractAndStripImages(dataObj)
    setImageAssetsMap((prev) => {
      const merged = { ...prev, ...imageMap }
      imageAssetsMapRef.current = merged
      return merged
    })

    function humanizePlaceholders(val: any): any {
      if (typeof val === 'string' && val.startsWith('__IMG_ASSET_')) {
        const original = imageMap[val] || imageAssetsMapRef.current[val] || ''
        const sizeStr = getBase64Size(original)
        return `data:image/asset [Base64 fail: ${sizeStr} - ID: ${val}]`
      }
      if (Array.isArray(val)) return val.map(humanizePlaceholders)
      if (val && typeof val === 'object') {
        const res: Record<string, any> = {}
        for (const [k, v] of Object.entries(val)) {
          res[k] = humanizePlaceholders(v)
        }
        return res
      }
      return val
    }

    const humanized = humanizePlaceholders(stripped)
    return JSON.stringify(humanized, null, 2)
  }

  // Parses JSON string from editor, expanding any folded Base64 placeholders
  function parseDataFromJsonString(text: string): any {
    let raw = text.trim()
    if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim()
    if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '').trim()

    const map = imageAssetsMapRef.current
    for (const [placeholder, base64] of Object.entries(map)) {
      // Look for ID in humanized tag or direct placeholder
      const tagPattern = new RegExp(`"data:image/asset \\[.*ID:\\s*${placeholder}\\]"`, 'g')
      raw = raw.replace(tagPattern, JSON.stringify(base64))
      const placeholderPattern = new RegExp(`"${placeholder}"`, 'g')
      raw = raw.replace(placeholderPattern, JSON.stringify(base64))
    }

    return JSON.parse(raw)
  }

  // Validate JSON on jsonText change
  useEffect(() => {
    if (!jsonText.trim()) {
      setJsonValidationMsg({ valid: true, message: '' })
      return
    }
    try {
      parseDataFromJsonString(jsonText)
      setJsonValidationMsg({ valid: true, message: 'JSON on korrektne' })
    } catch (e: any) {
      setJsonValidationMsg({ valid: false, message: e.message || 'Vigane JSON süntaks' })
    }
  }, [jsonText, imageAssetsMap])

  useEffect(() => {
    if (!id) return
    pb.collection('packs')
      .getOne<Pack>(id)
      .then((p) => {
        setPack(p)
        setName(p.name)
        setDescription(p.description || '')
        setJsonText(formatDataToJsonString(p.data, true))
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
      const d = data as any
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
      const lines = linesText.split('\n')
      const truths: string[] = []
      const dares: string[] = []
      let modeState: 'truths' | 'dares' = 'truths'
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed.startsWith('# TÕED') || trimmed.toLowerCase() === 'tõed') {
          modeState = 'truths'
          continue
        }
        if (trimmed.startsWith('# TEOD') || trimmed.toLowerCase() === 'teod') {
          modeState = 'dares'
          continue
        }
        if (modeState === 'truths') truths.push(trimmed)
        else dares.push(trimmed)
      }
      return { truths, dares }
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
    try {
      return parseDataFromJsonString(jsonText)
    } catch {
      return {}
    }
  }

  function formatJsonText() {
    try {
      const parsed = parseDataFromJsonString(jsonText)
      const formatted = formatDataToJsonString(parsed, compactBase64)
      setJsonText(formatted)
      setError('')
    } catch (e: any) {
      setError('JSON vormindamine ebaõnnestus: ' + (e?.message || 'Vigane süntaks'))
    }
  }

  function copyJson() {
    try {
      // When copying, user copies the clean or full JSON
      const parsed = parseDataFromJsonString(jsonText)
      const cleanJson = JSON.stringify(parsed, null, 2)
      navigator.clipboard.writeText(cleanJson).catch(() => {})
      setJsonCopied(true)
      setTimeout(() => setJsonCopied(false), 2000)
    } catch {
      navigator.clipboard.writeText(jsonText).catch(() => {})
      setJsonCopied(true)
      setTimeout(() => setJsonCopied(false), 2000)
    }
  }

  function toggleCompactMode(nextCompact: boolean) {
    setCompactBase64(nextCompact)
    try {
      const parsed = parseDataFromJsonString(jsonText)
      setJsonText(formatDataToJsonString(parsed, nextCompact))
    } catch {
      // keep current text if invalid
    }
  }

  function switchMode(next: Mode) {
    if (next === mode) return
    try {
      if (next === 'json') {
        const data = mode === 'visual' ? buildDataFromVisual() : parseDataFromJsonString(jsonText)
        setJsonText(formatDataToJsonString(data, compactBase64))
      } else {
        const data = parseDataFromJsonString(jsonText)
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
        data = parseDataFromJsonString(jsonText)
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
      const data = mode === 'json' ? parseDataFromJsonString(jsonText) : buildDataFromVisual()

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

      setJsonText(formatDataToJsonString(translatedData, compactBase64))
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

  // Count embedded Base64 images in pack
  const base64Count = Object.keys(imageAssetsMap).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        to={`/play/${pack.game_type}`}
        className="text-white/50 text-sm hover:text-gold inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-gold/80 uppercase tracking-wider block mb-1">
            {pack.game_type.replace('_', ' ')}
          </span>
          <h1 className="text-2xl font-display font-bold text-white">Toimeta mängupakki</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Translate button */}
          <button
            type="button"
            onClick={() => setTranslateModalOpen(true)}
            className="btn-outline text-xs !py-2 !px-3 flex items-center gap-1.5 hover:border-accent-cyan hover:text-accent-cyan"
            title="Lisa automaatne tõlge teise keelde"
          >
            <Languages size={15} className="text-accent-cyan" />
            <span>AI Tõlge</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => switchMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'visual'
                  ? 'bg-gold text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LayoutTemplate size={14} />
              <span>Visuaalne</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'json'
                  ? 'bg-gold text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Code2 size={14} />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-6 bg-accent-red/10 border border-accent-red/30 rounded-xl text-accent-red text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-xs underline hover:text-white ml-2">
            Sulge
          </button>
        </div>
      )}

      {/* AI Translate Modal */}
      {translateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="card-panel max-w-md w-full p-6 bg-[#08112c] border-accent-cyan/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-accent-cyan font-display font-bold text-lg">
              <Globe size={20} />
              <span>Automaatne AI Kakskeelsus</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Gemini lisab igale küsimusele, vastusele ja kategooriale teise keele tõlke. Mängijad näevad teleris ja telefonis korraga mõlemat keelt!
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 block">Sihtkeel:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Inglise', 'Vene', 'Soome', 'Saksa', 'Hispaania', 'Prantsuse'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTargetLang(lang)}
                    className={`text-xs py-2 px-3 rounded-lg border font-medium transition ${
                      targetLang === lang
                        ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan font-bold'
                        : 'bg-slate-900 border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setTranslateModalOpen(false)}
                className="btn-outline text-xs !py-2 !px-4"
                disabled={translating}
              >
                Tühista
              </button>
              <button
                type="button"
                onClick={() => handleAITranslate(targetLang)}
                disabled={translating}
                className="btn-gold text-xs !py-2 !px-5 flex items-center gap-2 font-bold"
              >
                {translating ? (
                  <>
                    <Sparkles size={14} className="animate-spin text-gold" />
                    <span>Tõlgin pakki...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Tõlgi {targetLang} keelde</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="space-y-6"
      >
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
              <div className="flex items-center gap-2 flex-wrap">
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
                {base64Count > 0 && (
                  <span className="text-[11px] text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    <ImageIcon size={12} /> {base64Count} Base64 pilt{base64Count > 1 ? 'i' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Compact Base64 toggle */}
                <label className="text-[11px] text-white/70 hover:text-white flex items-center gap-1.5 cursor-pointer px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="checkbox"
                    checked={compactBase64}
                    onChange={(e) => toggleCompactMode(e.target.checked)}
                    className="rounded border-white/30 text-gold focus:ring-0"
                  />
                  <span>Lühenda Base64</span>
                </label>

                <button
                  type="button"
                  onClick={formatJsonText}
                  className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 hover:border-gold"
                  title="Vorminda ja korrasta JSON taanded"
                >
                  <Wand2 size={12} />
                  <span>Vorminda</span>
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
                        className="input-field text-xs text-white/85 bg-slate-950/45 border-dashed border-white/20 focus:border-solid focus:border-accent-cyan"
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
                        className="text-accent-red hover:text-red-400 p-2.5 rounded-xl border border-accent-red/30 hover:bg-accent-red/10 transition shrink-0"
                        title="Kustuta kategooria"
                        onClick={() => setCategories(categories.filter((_, i) => i !== cIdx))}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {cat.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-2 hover:border-white/10 transition"
                    >
                      {/* 1. Põhikeele lahtrid */}
                      <div className="grid grid-cols-[54px_1fr_1fr] gap-2 items-center">
                        <div className="font-mono text-gold font-bold text-xs text-center">
                          {q.points}
                        </div>
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

                      {/* 3. Märkus ja pildivalija */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <input
                          className="input-field text-xs text-amber-100/90"
                          placeholder="Hosti märkus (ainult mängujuhile)"
                          value={q.hostNote || ''}
                          onChange={(e) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...q, hostNote: e.target.value }
                            setCategories(next)
                          }}
                        />
                        <ImagePickerField
                          value={q.imageUrl}
                          onChange={(url) => {
                            const next = [...categories]
                            next[cIdx].questions[qIdx] = { ...q, imageUrl: url }
                            setCategories(next)
                          }}
                          placeholder="Pildi URL või laadi fail..."
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
                const letters = ['A', 'B', 'C', 'D'] as const
                return (
                  <div
                    key={idx}
                    className={`card-panel p-4 space-y-3 border ${
                      step.isMilestone ? 'border-amber-500/50 bg-amber-950/20' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center ${
                            step.isMilestone
                              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                              : 'bg-white/10 text-white'
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
                      <div>
                        <label className="text-[11px] text-amber-200/70 block mb-1">Hosti lisamärkus</label>
                        <input
                          type="text"
                          placeholder="Märkus mängujuhile..."
                          className="input-field text-xs text-amber-100/90"
                          value={q.hostNote || ''}
                          onChange={(e) => {
                            const next = [...miljonarQs]
                            next[idx] = { ...q, hostNote: e.target.value }
                            setMiljonarQs(next)
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-cyan-200/70 block mb-1">Põnev fakt (peale vastust)</label>
                        <input
                          type="text"
                          placeholder="nt. See ehitati 1889. aastal..."
                          className="input-field text-xs text-cyan-100/90"
                          value={q.funFact || ''}
                          onChange={(e) => {
                            const next = [...miljonarQs]
                            next[idx] = { ...q, funFact: e.target.value }
                            setMiljonarQs(next)
                          }}
                        />
                      </div>
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
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-gold/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-gold flex items-center gap-2">
                  🌹 Rooside Sõda voorud (100 eestlast vastasid)
                </h3>
                <p className="text-white/50 text-xs">
                  Sisesta küsimus ja populaarsuse järjekorras vastused koos punktidega (nt 35, 25, 18...).
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {roosideRounds.map((round, rIdx) => (
                <div key={rIdx} className="card-panel p-4 border-gold/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-gold text-sm">{round.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gold/20 text-gold font-bold">
                        {round.multiplier}× punktid
                      </span>
                    </div>
                    {roosideRounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRoosideRounds(roosideRounds.filter((_, i) => i !== rIdx))}
                        className="text-accent-red hover:text-red-400 p-1.5 rounded-lg border border-accent-red/20"
                        title="Kustuta voor"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-white/70 block">Vooru küsimus</label>
                    <input
                      type="text"
                      placeholder="nt. Nimeta midagi, mida inimesed vannitoas teevad..."
                      className="input-field text-sm font-medium"
                      value={round.question}
                      onChange={(e) => {
                        const next = [...roosideRounds]
                        next[rIdx] = { ...round, question: e.target.value }
                        setRoosideRounds(next)
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 block">
                      Vastused & Punktid (kuni 6 vastust)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {round.answers.map((ans, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center gap-2 p-1.5 bg-black/30 rounded-xl border border-white/10"
                        >
                          <span className="w-5 h-5 rounded-md bg-white/10 text-gold text-xs font-bold flex items-center justify-center shrink-0">
                            {aIdx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder={`Vastus ${aIdx + 1}`}
                            className="input-field text-xs flex-1 !bg-transparent !border-0 focus:!ring-0 p-0"
                            value={ans.text}
                            onChange={(e) => {
                              const next = [...roosideRounds]
                              const nextAns = [...round.answers]
                              nextAns[aIdx] = { ...ans, text: e.target.value }
                              next[rIdx] = { ...round, answers: nextAns }
                              setRoosideRounds(next)
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Pkt"
                            className="input-field text-xs w-14 text-center font-mono text-gold !py-1 !px-1"
                            value={ans.points || ''}
                            onChange={(e) => {
                              const next = [...roosideRounds]
                              const nextAns = [...round.answers]
                              nextAns[aIdx] = { ...ans, points: Number(e.target.value) || 0 }
                              next[rIdx] = { ...round, answers: nextAns }
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

            <button
              type="button"
              onClick={() =>
                setRoosideRounds([
                  ...roosideRounds,
                  {
                    title: `VOOR ${roosideRounds.length + 1}`,
                    multiplier: roosideRounds.length >= 2 ? 3 : 2,
                    question: '',
                    answers: [35, 25, 18, 12, 6, 4].map((p) => ({ text: '', points: p })),
                  },
                ])
              }
              className="btn-outline text-xs flex items-center gap-2"
            >
              <Plus size={14} /> Lisa voor
            </button>
          </div>
        )}

        {/* VISUAL MODE: KINNISTU DEAL */}
        {mode === 'visual' && isDeal && (
          <div className="card-panel p-5 border-gold/30 space-y-4">
            <h3 className="font-display text-gold text-base font-bold">Kinnistu Deal Seaded</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/70 block">Võiduks vajalikke täiskomplekte</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="input-field text-sm font-mono text-gold"
                  value={dealWinSets}
                  onChange={(e) => setDealWinSets(Number(e.target.value) || 3)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/70 block">Algkäe kaartide arv</label>
                <input
                  type="number"
                  min={3}
                  max={8}
                  className="input-field text-sm font-mono text-gold"
                  value={dealStartHand}
                  onChange={(e) => setDealStartHand(Number(e.target.value) || 5)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 block">Teemaline kohandus / Stiil (valikuline)</label>
              <input
                type="text"
                placeholder="nt. Eesti kinnisvara, Kosmose kolooniad, Tallinna vanalinn..."
                className="input-field text-sm"
                value={dealTheme}
                onChange={(e) => setDealTheme(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 block">Hosti juhised / Märkused</label>
              <textarea
                placeholder="Erijuhised mängujuhendiks või reeglite selgituseks..."
                className="input-field text-xs min-h-[80px]"
                value={dealNote}
                onChange={(e) => setDealNote(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* VISUAL MODE: BLITZ */}
        {mode === 'visual' && pack.game_type === 'blitz' && (
          <BlitzPackEditor
            questions={blitzQs}
            secondsPerQuestion={blitzSec}
            pointsMax={blitzMax}
            revealSeconds={blitzReveal}
            onChange={(next) => {
              setBlitzQs(next.questions)
              setBlitzSec(next.secondsPerQuestion)
              setBlitzMax(next.pointsMax)
              setBlitzReveal(next.revealSeconds)
            }}
          />
        )}

        {/* VISUAL MODE: LINE-BASED GAMES */}
        {mode === 'visual' && isLines && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/70">
                Sisu read (iga kirje eraldi real)
              </label>
              <span className="text-xs text-white/40">
                {linesText.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length} kirjet
              </span>
            </div>
            <textarea
              className="input-field font-mono text-sm min-h-[300px] leading-relaxed p-3.5 bg-black/40"
              value={linesText}
              onChange={(e) => setLinesText(e.target.value)}
              placeholder="Kirjuta või kleebi iga sõna/lause eraldi reale..."
            />
          </div>
        )}

        {/* SAVE BUTTON */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <Link
            to={`/play/${pack.game_type}`}
            className="btn-outline text-xs !py-2.5 !px-5"
          >
            Loobu
          </Link>
          <button
            type="submit"
            disabled={saving || (mode === 'json' && !jsonValidationMsg.valid)}
            className="btn-gold flex items-center gap-2 font-bold px-8 shadow-lg shadow-gold/20"
          >
            <Save size={16} />
            <span>{saving ? 'Salvestan...' : 'Salvesta muudatused'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
