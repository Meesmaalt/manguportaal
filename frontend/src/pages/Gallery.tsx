import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pb, generateCode, type Pack } from '@/lib/pocketbase'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import { createGameSession } from '@/lib/sessions'
import { rememberHostSession } from '@/hooks/useGameSession'
import { trackSessionStart } from '@/lib/stats'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import type { TranslationKey } from '@/i18n/translations'
import { GAME_META, type GameType } from '@/lib/types'
import { ArrowLeft, Play, Sparkles, Search, Eye, X, Layers, HelpCircle, Users, CheckCircle2, Flame, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function buildInitialState(gameType: string, packData: any, code: string) {
  switch (gameType) {
    case 'kuldvillak':
      return {
        teams: [
          { name: 'Meeskond 1', score: 0 },
          { name: 'Meeskond 2', score: 0 },
        ],
        disabledCards: [],
        currentQuestion: null,
        showAnswer: false,
        packData,
        code,
        buzzEnabled: true,
        showBuzzQr: false,
        buzz: null,
        finalPhase: 'none',
        finalWagers: [0, 0],
      }
    case 'roosidesoda':
      return {
        teams: [
          { name: 'Meeskond 1', score: 0 },
          { name: 'Meeskond 2', score: 0 },
        ],
        currentRoundIdx: 0,
        revealed: [],
        strikes: 0,
        bank: 0,
        activeTeam: 0,
        packData,
        code,
      }
    case 'sonaseletus': {
      const words = [...(packData?.words || [])].sort(() => Math.random() - 0.5)
      return {
        teams: [
          { name: 'Tiim 1', score: 0 },
          { name: 'Tiim 2', score: 0 },
        ],
        activeTeam: 0,
        words,
        wordIndex: 0,
        roundSeconds: packData?.roundSeconds || 60,
        timeLeft: packData?.roundSeconds || 60,
        running: false,
        packData,
        code,
      }
    }
    case 'ma_ei_ole_kunagi':
      return {
        players: [
          { name: 'Mängija 1', lives: 3 },
          { name: 'Mängija 2', lives: 3 },
          { name: 'Mängija 3', lives: 3 },
        ],
        statements: packData?.statements || [],
        index: 0,
        packData,
        code,
      }
    case 'viimane_pusti': {
      const lives = packData?.startingLives || 3
      return {
        players: [
          { name: 'Mängija 1', lives, standing: true },
          { name: 'Mängija 2', lives, standing: true },
          { name: 'Mängija 3', lives, standing: true },
        ],
        statements: packData?.statements || [],
        index: 0,
        startingLives: lives,
        packData,
        code,
      }
    }
    case 'tode_voi_tegu':
      return {
        players: [{ name: 'Mängija 1' }, { name: 'Mängija 2' }, { name: 'Mängija 3' }],
        currentPlayer: 0,
        truths: packData?.truths || [],
        dares: packData?.dares || [],
        currentCard: null,
        packData,
        code,
      }
    case 'blitz': {
      return {
        phase: 'lobby',
        players: [],
        questions: packData?.questions || [],
        qIndex: 0,
        secondsPerQuestion: packData?.secondsPerQuestion || 20,
        pointsMax: packData?.pointsMax || 1000,
        answers: {},
        lastRoundPoints: {},
        revealSeconds: packData?.revealSeconds ?? 5,
        shuffleOnStart: packData?.shuffleOnStart !== false,
        preCountdownSeconds: packData?.preCountdownSeconds ?? 3,
        teamsEnabled: !!packData?.teamsEnabled,
        code,
        packData,
      }
    }
    case 'kinnistu_deal': {
      const tok = () => Math.random().toString(36).slice(2, 10)
      return {
        players: [
          { token: tok(), name: 'Mängija 1', hand: [], bank: [], props: {} },
          { token: tok(), name: 'Mängija 2', hand: [], bank: [], props: {} },
          { token: tok(), name: 'Mängija 3', hand: [], bank: [], props: {} },
        ],
        deck: [],
        discard: [],
        current: 0,
        playsLeft: 0,
        phase: 'lobby',
        log: [],
        code,
        packData: { winSets: packData?.winSets || 3, startHand: packData?.startHand || 5, theme: packData?.theme || 'classic' },
      }
    }
    case 'miljonar': {
      const qs = Array.isArray(packData?.questions) ? packData.questions : []
      const backupQs = Array.isArray(packData?.backupQuestions) ? packData.backupQuestions : []
      return {
        phase: 'lobby',
        contestant: { name: 'Mängija 1' },
        questions: qs,
        backupQuestions: backupQs,
        currentTierIndex: 0,
        lifelines: {
          fifty_fifty: true,
          ask_audience: true,
          phone_friend: true,
          switch_question: true,
        },
        selectedChoice: null,
        isLocked: false,
        eliminatedChoices: [],
        accumulatedBank: 0,
        guaranteedBank: 0,
        musicEnabled: true,
        sfxEnabled: true,
        audienceVotes: {},
        audienceStats: null,
        phoneTimer: null,
        contestantHistory: [],
        code,
        packData,
      }
    }
    default:
      return { packData, code }
  }
}

function getPackStats(pack: Pack): string {
  const d = pack.data as any
  if (!d) return ''
  switch (pack.game_type) {
    case 'kuldvillak': {
      const cats = d.categories?.length || 0
      const totalQ = d.categories?.reduce((acc: number, c: any) => acc + (c.questions?.length || 0), 0) || 0
      return `${cats} kategooriat · ${totalQ} küsimust`
    }
    case 'roosidesoda': {
      const rounds = d.rounds?.length || 0
      return `${rounds} küsimusvooru`
    }
    case 'sonaseletus': {
      const words = d.words?.length || 0
      return `${words} sõna`
    }
    case 'ma_ei_ole_kunagi':
    case 'viimane_pusti': {
      const st = d.statements?.length || 0
      return `${st} väidet`
    }
    case 'tode_voi_tegu': {
      const truths = d.truths?.length || 0
      const dares = d.dares?.length || 0
      return `${truths} tõde · ${dares} tegu`
    }
    case 'blitz': {
      const qs = d.questions?.length || 0
      return `${qs} kiirküsimust`
    }
    case 'miljonar': {
      const qs = d.questions?.length || 0
      return `${qs} tasemeküsimust`
    }
    case 'kinnistu_deal': {
      return 'Klassikaline 106-kaardiline pakk'
    }
    default:
      return ''
  }
}

/**
 * Public pack gallery — browse is_official / is_public packs across games.
 */
export default function Gallery() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewPack, setPreviewPack] = useState<Pack | null>(null)
  const [launchingId, setLaunchingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await pb.collection('packs').getList<Pack>(1, 200, { requestKey: null })
        if (!cancelled) {
          const remotePacks = list.items.filter((p) => p.is_official || p.is_public)
          // Merge with local official packs
          const localFormatted: Pack[] = OFFICIAL_PACKS.map((p, idx) => ({
            id: `official-${p.game_type}-${p.slug || idx}`,
            name: p.name,
            description: p.description,
            game_type: p.game_type,
            data: p.data,
            is_official: true,
            is_public: true,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          })) as Pack[]

          // Deduplicate by name + game_type
          const map = new Map<string, Pack>()
          for (const p of [...remotePacks, ...localFormatted]) {
            const key = `${p.game_type}::${p.name}`
            if (!map.has(key)) {
              map.set(key, p)
            }
          }
          setPacks(Array.from(map.values()))
        }
      } catch {
        if (!cancelled) {
          const localFormatted: Pack[] = OFFICIAL_PACKS.map((p, idx) => ({
            id: `official-${p.game_type}-${p.slug || idx}`,
            name: p.name,
            description: p.description,
            game_type: p.game_type,
            data: p.data,
            is_official: true,
            is_public: true,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          })) as Pack[]
          setPacks(localFormatted)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function directPlay(pack: Pack) {
    setLaunchingId(pack.id)
    const code = generateCode()
    const initialState = buildInitialState(pack.game_type, pack.data, code)
    try {
      const { sessionId, code: sessCode } = await createGameSession({
        gameType: pack.game_type,
        packId: pack.id.startsWith('official-') ? null : pack.id,
        hostId: user?.id || null,
        state: initialState as Record<string, unknown>,
        allowLocal: true,
      })
      rememberHostSession({ sessionId, code: sessCode, gameType: pack.game_type })
      trackSessionStart(pack.game_type)
      navigate(`/play/${pack.game_type}/${sessionId}`)
    } catch (e) {
      console.error('Failed to launch pack', e)
      navigate(`/play/${pack.game_type}`)
    } finally {
      setLaunchingId(null)
    }
  }

  const filtered = useMemo(() => {
    return packs.filter((p) => {
      if (gameFilter !== 'all' && p.game_type !== gameFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchDesc = (p.description || '').toLowerCase().includes(q)
        return matchName || matchDesc
      }
      return true
    })
  }, [packs, gameFilter, searchQuery])

  const games = useMemo(() => {
    const s = new Set(packs.map((p) => p.game_type))
    return (Object.keys(GAME_META) as GameType[]).filter((g) => s.has(g))
  }, [packs])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 ohtu-page-enter">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm mb-6 transition">
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <Sparkles className="text-gold animate-pulse" size={28} />
            <h1 className="font-display text-3xl md:text-4xl font-black text-gold">{t('galleryTitle')}</h1>
          </div>
          <p className="text-white/65 text-sm md:text-base leading-relaxed">{t('gallerySub')}</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            type="text"
            placeholder="Otsi teemat või küsimust..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-4 text-xs py-2.5 w-full rounded-full bg-black/40 border-white/15 focus:border-gold/60"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
        <button
          type="button"
          onClick={() => setGameFilter('all')}
          className={`text-xs px-4 py-1.5 rounded-full border whitespace-nowrap transition-all ${
            gameFilter === 'all'
              ? 'bg-gold text-bg border-gold font-bold shadow-[0_0_15px_rgba(223,179,66,0.3)]'
              : 'border-white/15 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30'
          }`}
        >
          {t('packFilterAll')} ({packs.length})
        </button>
        {games.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGameFilter(g)}
            className={`text-xs px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-all flex items-center gap-1.5 ${
              gameFilter === g
                ? 'bg-gold text-bg border-gold font-bold shadow-[0_0_15px_rgba(223,179,66,0.3)]'
                : 'border-white/15 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30'
            }`}
          >
            <span>{GAME_META[g]?.emoji}</span>
            <span>{t(('game_' + g) as TranslationKey)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gold gap-3 font-display">
          <Loader2 className="animate-spin" size={24} />
          <span>{t('packLoading')}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-panel p-8 text-center text-white/60 text-sm">
          {searchQuery ? `Otsingule "${searchQuery}" ei leitud ühtegi pakki.` : t('galleryEmpty')}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((pack, i) => {
            const stats = getPackStats(pack)
            const meta = GAME_META[pack.game_type as GameType]
            const isLaunching = launchingId === pack.id

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="group relative rounded-2xl bg-[#081528]/80 border border-white/[0.09] hover:border-gold/50 p-5 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-6px_rgba(223,179,66,0.15)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-gold">
                      <span>{meta?.emoji}</span>
                      <span>{t(('game_' + pack.game_type) as TranslationKey)}</span>
                    </span>
                    {pack.is_official && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        Ametlik
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-gold group-hover:text-gold-hover text-lg font-bold leading-snug mb-1.5 transition-colors">
                    {pack.name}
                  </h3>

                  {pack.description && (
                    <p className="text-white/60 text-xs leading-relaxed mb-3 line-clamp-2">{pack.description}</p>
                  )}

                  {stats && (
                    <div className="text-[11px] text-white/45 flex items-center gap-1.5 mb-4">
                      <Layers size={12} className="text-gold/60" />
                      <span>{stats}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.07] flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={() => directPlay(pack)}
                    className="btn-gold flex-1 text-xs !py-2 flex items-center justify-center gap-1.5 font-bold shadow-sm active:scale-95 transition-transform"
                  >
                    {isLaunching ? (
                      <>
                        <Loader2 className="animate-spin" size={13} /> Alustan...
                      </>
                    ) : (
                      <>
                        <Play size={13} className="fill-bg" /> {t('packPlay')}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewPack(pack)}
                    className="p-2 rounded-xl border border-white/15 hover:border-gold/50 text-white/60 hover:text-gold bg-white/[0.03] transition"
                    title="Eelvaade"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pack Preview Modal */}
      <AnimatePresence>
        {previewPack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-[#09152b] border border-gold/40 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden text-white"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-gold/80 font-bold mb-1">
                    {GAME_META[previewPack.game_type as GameType]?.emoji} {t(('game_' + previewPack.game_type) as TranslationKey)}
                  </div>
                  <h2 className="font-display text-2xl text-gold font-bold">{previewPack.name}</h2>
                  {previewPack.description && <p className="text-white/60 text-xs mt-1">{previewPack.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPack(null)}
                  className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Preview Content Body */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {previewPack.game_type === 'kuldvillak' && (
                  <div className="space-y-4">
                    {(previewPack.data as any)?.categories?.map((cat: any, cIdx: number) => (
                      <div key={cIdx} className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5">
                        <h4 className="font-display text-gold font-bold text-sm mb-2">{cat.name}</h4>
                        <div className="space-y-1.5 pl-2 border-l-2 border-gold/30">
                          {cat.questions?.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="text-white/80">
                              <span className="text-gold/90 font-mono font-bold mr-2">{q.points}p:</span>
                              <span>{q.q}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {previewPack.game_type === 'roosidesoda' && (
                  <div className="space-y-3">
                    {(previewPack.data as any)?.rounds?.map((rnd: any, rIdx: number) => (
                      <div key={rIdx} className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5">
                        <div className="font-display text-gold font-bold text-sm mb-1">
                          {rIdx + 1}. voor: {rnd.question} (Kordaja: x{rnd.multiplier || 1})
                        </div>
                        <div className="text-white/60">Vastuseid: {rnd.answers?.length || 0} tk</div>
                      </div>
                    ))}
                  </div>
                )}

                {previewPack.game_type === 'miljonar' && (
                  <div className="space-y-2">
                    {(previewPack.data as any)?.questions?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                        <div className="text-gold font-bold mb-1">Tase {qIdx + 1}: {q.q}</div>
                        <div className="grid grid-cols-2 gap-1 text-white/70 pl-2">
                          {q.choices?.map((c: string, cIdx: number) => (
                            <div key={cIdx} className={cIdx === q.correct ? 'text-emerald-300 font-bold' : ''}>
                              {['A', 'B', 'C', 'D'][cIdx]}: {c} {cIdx === q.correct ? '✓' : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {previewPack.game_type === 'sonaseletus' && (
                  <div className="flex flex-wrap gap-1.5">
                    {(previewPack.data as any)?.words?.map((w: string, wIdx: number) => (
                      <span key={wIdx} className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-white/90">
                        {w}
                      </span>
                    ))}
                  </div>
                )}

                {(previewPack.game_type === 'ma_ei_ole_kunagi' || previewPack.game_type === 'viimane_pusti') && (
                  <ol className="list-decimal pl-4 space-y-1 text-white/80">
                    {(previewPack.data as any)?.statements?.map((s: string, sIdx: number) => (
                      <li key={sIdx}>{s}</li>
                    ))}
                  </ol>
                )}

                {previewPack.game_type === 'tode_voi_tegu' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                      <h4 className="font-bold text-amber-300 mb-2">Tõed</h4>
                      <ul className="list-disc pl-4 space-y-1 text-white/80">
                        {(previewPack.data as any)?.truths?.map((t: string, tIdx: number) => (
                          <li key={tIdx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                      <h4 className="font-bold text-rose-300 mb-2">Teod</h4>
                      <ul className="list-disc pl-4 space-y-1 text-white/80">
                        {(previewPack.data as any)?.dares?.map((d: string, dIdx: number) => (
                          <li key={dIdx}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {previewPack.game_type === 'blitz' && (
                  <div className="space-y-2">
                    {(previewPack.data as any)?.questions?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                        <div className="text-gold font-bold mb-1">{qIdx + 1}. {q.text}</div>
                        <div className="text-white/60">Tüüp: {q.type || 'single'} · Valikuid: {q.options?.length || 0}</div>
                      </div>
                    ))}
                  </div>
                )}

                {previewPack.game_type === 'kinnistu_deal' && (
                  <div className="text-white/80">
                    Sisaldab kinnistukaarte (Tallinna tänavad ja linnaosad), rahakaarte ning spetsiaalseid tegevuskaarte (Tehingupurustaja, Sunnitud vahetus, Minu sünnipäev jms).
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewPack(null)}
                  className="btn-outline text-xs !py-2 px-4"
                >
                  Sulge
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = previewPack
                    setPreviewPack(null)
                    directPlay(p)
                  }}
                  className="btn-gold text-xs !py-2 px-5 flex items-center gap-1.5 font-bold"
                >
                  <Play size={13} className="fill-bg" /> Alusta seda mängu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
