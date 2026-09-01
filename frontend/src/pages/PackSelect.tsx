import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { pb, generateCode, formatPbError, type Pack } from '@/lib/pocketbase'
import { createGameSession, downloadJson, packExportPayload, CloudSessionError, createOwnedPack } from '@/lib/sessions'
import { rememberHostSession } from '@/hooks/useGameSession'
import { trackSessionStart } from '@/lib/stats'
import { packTitle, packDescription } from '@/lib/packI18n'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Play, Plus, User, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { GameType } from '@/lib/types'
import { useI18n } from '@/i18n/I18nContext'
import type { TranslationKey } from '@/i18n/translations'

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
      const words = [...(packData.words || [])].sort(() => Math.random() - 0.5)
      return {
        teams: [
          { name: 'Tiim 1', score: 0 },
          { name: 'Tiim 2', score: 0 },
        ],
        activeTeam: 0,
        words,
        wordIndex: 0,
        roundSeconds: packData.roundSeconds || 60,
        timeLeft: packData.roundSeconds || 60,
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
        statements: packData.statements || [],
        index: 0,
        packData,
        code,
      }
    case 'viimane_pusti': {
      const lives = packData.startingLives || 3
      return {
        players: [
          { name: 'Mängija 1', lives, standing: true },
          { name: 'Mängija 2', lives, standing: true },
          { name: 'Mängija 3', lives, standing: true },
        ],
        statements: packData.statements || [],
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
        truths: packData.truths || [],
        dares: packData.dares || [],
        currentCard: null,
        packData,
        code,
      }
    case 'blitz': {
      return {
        phase: 'lobby',
        players: [],
        questions: packData.questions || [],
        qIndex: 0,
        secondsPerQuestion: packData.secondsPerQuestion || 20,
        pointsMax: packData.pointsMax || 1000,
        answers: {},
        lastRoundPoints: {},
        revealSeconds: packData.revealSeconds ?? 5,
        shuffleOnStart: packData.shuffleOnStart !== false,
        preCountdownSeconds: packData.preCountdownSeconds ?? 3,
        teamsEnabled: !!packData.teamsEnabled,
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
        packData: { winSets: packData.winSets || 3, startHand: packData.startHand || 5, theme: packData.theme || 'classic' },
      }
    }
    default:
      return { packData, code }
  }
}

function localOfficial(gameType: string): Pack[] {
  return OFFICIAL_PACKS.filter((p) => p.game_type === gameType).map((p, i) => ({
    id: `local-${gameType}-${i}`,
    ...p,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  })) as Pack[]
}


export default function PackSelect() {
  const { gameType } = useParams<{ gameType: string }>()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const { t, lang } = useI18n()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [startError, setStartError] = useState('')

  const isValid = [
    'kuldvillak',
    'roosidesoda',
    'sonaseletus',
    'ma_ei_ole_kunagi',
    'viimane_pusti',
    'tode_voi_tegu',
    'kinnistu_deal',
    'blitz',
  ].includes(gameType || '')
  const gameTitle = isValid ? t(('game_' + gameType) as TranslationKey) : ''
  const emoji =
    (
      {
        kuldvillak: '🏆',
        roosidesoda: '🌹',
        sonaseletus: '🗣️',
        ma_ei_ole_kunagi: '🙅',
        viimane_pusti: '🧍',
        tode_voi_tegu: '🎲',
        kinnistu_deal: '🏠',
        blitz: '⚡',
      } as Record<string, string>
    )[gameType || ''] || ''

  useEffect(() => {
    if (!isValid) return
    loadPacks()
  }, [gameType, user])

  async function loadPacks() {
    setLoading(true)
    const local = localOfficial(gameType!)
    const uid = user?.id
    try {
      let remote: Pack[] = []
      let pbOk = false
      // Avoid server-side filter (some PB + listRule combos return 400)
      try {
        const list = await pb.collection('packs').getList<Pack>(1, 200, {
          requestKey: null,
        })
        remote = list.items
        pbOk = true
      } catch (e1) {
        console.warn('[ohtu] packs list page1', e1)
        try {
          remote = await pb.collection('packs').getFullList<Pack>({
            requestKey: null,
          })
          pbOk = true
        } catch (e2) {
          console.warn('[ohtu] packs list full', e2)
        }
      }

      if (pbOk) {
        // Database is the source of truth for public packs.
        // Admin can seed/delete/toggle is_official & is_public — code templates are only a seed source.
        remote = remote.filter((p) => {
          if (p.game_type !== gameType) return false
          if (p.is_official || p.is_public) return true
          if (uid && p.owner === uid) return true
          return false
        })
        setPacks(remote)
      } else {
        // PocketBase unreachable — fall back to built-in code templates so guests can still play offline
        setPacks(local)
      }
    } catch {
      setPacks(local)
    } finally {
      setLoading(false)
    }
  }


  async function duplicatePack(pack: Pack) {
    if (!isLoggedIn) {
      setStartError(t('importNeedLogin'))
      return
    }
    setStarting('dup-' + pack.id)
    setStartError('')
    try {
      const created = await createOwnedPack({
        name: `${pack.name} (${t('packCopySuffix')})`,
        description: pack.description || '',
        game_type: pack.game_type,
        data: pack.data,
      })
      setStartError('') // clear
      // success banner via same error slot (green) — use a short message
      setStartError(`✓ ${t('duplicateOk')}: ${created?.name || pack.name + ' (' + t('packCopySuffix') + ')'}`)
      await loadPacks()
    } catch (e: any) {
      setStartError(e?.message || formatPbError(e))
    } finally {
      setStarting(null)
    }
  }


  async function deletePack(pack: Pack) {
    if (!isLoggedIn || !user || pack.owner !== user.id || pack.id.startsWith('local-')) return
    if (pack.is_official) return
    if (!confirm(t('deletePackConfirm'))) return
    setStarting('del-' + pack.id)
    setStartError('')
    try {
      await pb.collection('packs').delete(pack.id)
      setStartError(`✓ ${t('deletePackOk')}`)
      await loadPacks()
    } catch (e: any) {
      setStartError(e?.message || formatPbError(e))
    } finally {
      setStarting(null)
    }
  }

  async function startSession(pack: Pack) {
    setStarting(pack.id)
    setStartError('')
    const code = generateCode()
    const initialState = buildInitialState(gameType!, pack.data, code)
    try {
      const { sessionId, code: sessCode } = await createGameSession({
        gameType: gameType!,
        packId: pack.id.startsWith('local-') ? null : pack.id,
        hostId: user?.id || null,
        state: initialState as Record<string, unknown>,
        allowLocal: false,
      })
      rememberHostSession({ sessionId, code: sessCode, gameType: gameType! })
      trackSessionStart(gameType!)
      navigate(`/play/${gameType}/${sessionId}`)
    } catch (e: any) {
      setStartError(e?.message || 'Sessiooni loomine ebaõnnestus')
    } finally {
      setStarting(null)
    }
  }

  if (!isValid) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60">{t('packUnknown')}</p>
        <Link to="/dashboard" className="text-gold mt-4 inline-block">
          ← {t('packBack')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-white/60 hover:text-gold mb-6 text-sm"
      >
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>

      <h1 className="font-display text-3xl text-gold mb-2">
        {emoji} {t('packTitle', { game: gameTitle })}
      </h1>
      <p className="text-white/60 mb-2">{t('packSub')}</p>
      {!isLoggedIn && (
        <p className="text-white/40 text-sm mb-6 flex items-center gap-2 flex-wrap">
          <User size={14} />
          {t('packGuestNote')}{' '}
          <Link to="/login" className="text-gold hover:underline">
            {t('dashLogin')}
          </Link>
        </p>
      )}
      {isLoggedIn && <div className="mb-6" />}

      {startError && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm border ${
            startError.startsWith('✓')
              ? 'border-accent-green/40 bg-accent-green/10 text-accent-green'
              : 'border-accent-red/40 bg-accent-red/10 text-accent-red'
          }`}
        >
          {startError}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gold animate-pulse py-12">{t('packLoading')}</div>
      ) : packs.length === 0 ? (
        <div className="card-panel p-6 text-center space-y-2">
          <p className="text-white/60 text-sm">{t('packEmptyDb')}</p>
          <p className="text-white/35 text-xs">{t('packEmptyDbHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-display text-xl text-gold">{packTitle(pack, lang)}</h3>
                  {pack.is_official && (
                    <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                      {t('packOfficial')}
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-sm">{packDescription(pack, lang)}</p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                <button
                  type="button"
                  className="btn-outline text-xs !py-2 !px-3"
                  onClick={() =>
                    downloadJson(
                      `${pack.game_type}-${pack.name.slice(0, 40).replace(/\s+/g, '-')}.json`,
                      packExportPayload(pack)
                    )
                  }
                >
                  {t('exportPack')}
                </button>
                {isLoggedIn && (
                  <button
                    type="button"
                    className="btn-outline text-xs !py-2 !px-3"
                    disabled={!!starting}
                    onClick={() => duplicatePack(pack)}
                  >
                    {t('duplicatePack')}
                  </button>
                )}
                {isLoggedIn && user && pack.owner === user.id && !pack.id.startsWith('local-') && !pack.is_official && (
                  <>
                    <Link
                      to={`/packs/${pack.id}/edit`}
                      className="btn-outline text-xs !py-2 !px-3"
                    >
                      {t('editPack')}
                    </Link>
                    <button
                      type="button"
                      className="btn-outline text-xs !py-2 !px-3 border-accent-red/50 text-accent-red"
                      disabled={!!starting}
                      onClick={() => deletePack(pack)}
                    >
                      <Trash2 size={12} className="inline mr-1" />
                      {t('deletePack')}
                    </button>
                  </>
                )}
                {pack.game_type === 'kuldvillak' && (
                  <Link
                    to={`/print?name=${encodeURIComponent(pack.name)}${!pack.id.startsWith('local-') ? `&id=${pack.id}` : ''}`}
                    className="btn-outline text-xs !py-2 !px-3"
                  >
                    {t('printPdf')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => startSession(pack)}
                  disabled={!!starting}
                  className="btn-gold flex items-center gap-2"
                >
                  <Play size={16} />
                  {starting === pack.id ? t('packStarting') : t('packPlay')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        {isLoggedIn ? (
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/packs/new" className="btn-outline inline-flex items-center gap-2">
              <Plus size={16} /> {t('packCreate')}
            </Link>
            <Link to="/packs/import" className="btn-outline inline-flex items-center gap-2">
              {t('importPack')}
            </Link>
          </div>
        ) : (
          <Link to="/login" className="text-gold/80 text-sm hover:underline">
            {t('packLoginCreate')}
          </Link>
        )}
      </div>
    </div>
  )
}
