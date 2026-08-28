import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { pb, generateCode, type Pack } from '@/lib/pocketbase'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Play, Plus, User } from 'lucide-react'
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
  const { t } = useI18n()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  const isValid = [
    'kuldvillak',
    'roosidesoda',
    'sonaseletus',
    'ma_ei_ole_kunagi',
    'viimane_pusti',
    'tode_voi_tegu',
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
      } as Record<string, string>
    )[gameType || ''] || ''

  useEffect(() => {
    if (!isValid) return
    loadPacks()
  }, [gameType, user])

  async function loadPacks() {
    setLoading(true)
    const local = localOfficial(gameType!)
    try {
      const ownerFilter = user?.id ? ` || owner = "${user.id}"` : ''
      const list = await pb.collection('packs').getList<Pack>(1, 50, {
        filter: `game_type = "${gameType}" && (is_official = true || is_public = true${ownerFilter})`,
        sort: '-is_official,-created',
      })
      const names = new Set(local.map((p) => p.name))
      const remote = list.items.filter((p) => !names.has(p.name))
      setPacks([...local, ...remote])
    } catch {
      setPacks(local)
    } finally {
      setLoading(false)
    }
  }

  async function startSession(pack: Pack) {
    setStarting(pack.id)
    const code = generateCode()
    const initialState = buildInitialState(gameType!, pack.data, code)

    if (!isLoggedIn || pack.id.startsWith('local-')) {
      try {
        if (isLoggedIn && user) {
          const session = await pb.collection('game_sessions').create({
            code,
            game_type: gameType,
            pack: null,
            host: user.id,
            state: initialState,
            status: 'playing',
          })
          navigate(`/play/${gameType}/${session.id}`)
          return
        }
      } catch {
        /* local */
      }
      const localId = `local-${Date.now()}`
      localStorage.setItem(`session_${localId}`, JSON.stringify(initialState))
      navigate(`/play/${gameType}/${localId}`)
      setStarting(null)
      return
    }

    try {
      const session = await pb.collection('game_sessions').create({
        code,
        game_type: gameType,
        pack: pack.id,
        host: user!.id,
        state: initialState,
        status: 'playing',
      })
      navigate(`/play/${gameType}/${session.id}`)
    } catch {
      const localId = `local-${Date.now()}`
      localStorage.setItem(`session_${localId}`, JSON.stringify(initialState))
      navigate(`/play/${gameType}/${localId}`)
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

      {loading ? (
        <div className="text-center text-gold animate-pulse py-12">{t('packLoading')}</div>
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
                  <h3 className="font-display text-xl text-gold">{pack.name}</h3>
                  {pack.is_official && (
                    <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                      {t('packOfficial')}
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-sm">{pack.description || ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {pack.game_type === 'kuldvillak' && (
                  <Link
                    to={`/print?name=${encodeURIComponent(pack.name)}`}
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
          <Link to="/packs/new" className="btn-outline inline-flex items-center gap-2">
            <Plus size={16} /> {t('packCreate')}
          </Link>
        ) : (
          <Link to="/login" className="text-gold/80 text-sm hover:underline">
            {t('packLoginCreate')}
          </Link>
        )}
      </div>
    </div>
  )
}
