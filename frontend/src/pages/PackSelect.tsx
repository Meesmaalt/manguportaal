import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { pb, generateCode, type Pack } from '@/lib/pocketbase'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Play, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { GAME_META, type GameType } from '@/lib/types'

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
        players: [
          { name: 'Mängija 1' },
          { name: 'Mängija 2' },
          { name: 'Mängija 3' },
        ],
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

export default function PackSelect() {
  const { gameType } = useParams<{ gameType: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const meta = GAME_META[gameType as GameType]
  const isValid = !!meta

  useEffect(() => {
    if (!isValid) return
    loadPacks()
  }, [gameType, user])

  async function loadPacks() {
    setLoading(true)
    setError('')
    try {
      const list = await pb.collection('packs').getList<Pack>(1, 50, {
        filter: `game_type = "${gameType}" && (is_official = true || is_public = true || owner = "${user?.id}")`,
        sort: '-is_official,-created',
      })
      setPacks(list.items)
    } catch {
      const local = OFFICIAL_PACKS.filter((p) => p.game_type === gameType).map((p, i) => ({
        id: `local-${i}`,
        ...p,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      })) as Pack[]
      setPacks(local)
    } finally {
      setLoading(false)
    }
  }

  async function startSession(pack: Pack) {
    if (!user) return
    setStarting(pack.id)
    setError('')
    const code = generateCode()
    const initialState = buildInitialState(gameType!, pack.data, code)

    try {
      let packId = pack.id
      if (pack.id.startsWith('local-')) {
        try {
          const created = await pb.collection('packs').create({
            name: pack.name,
            description: pack.description,
            game_type: pack.game_type,
            data: pack.data,
            is_official: true,
            is_public: true,
            owner: user.id,
          })
          packId = created.id
        } catch {
          packId = pack.id
        }
      }

      const session = await pb.collection('game_sessions').create({
        code,
        game_type: gameType,
        pack: packId.startsWith('local-') ? null : packId,
        host: user.id,
        state: initialState,
        status: 'playing',
      })
      navigate(`/play/${gameType}/${session.id}`)
    } catch (err: any) {
      console.error(err)
      setError('PocketBase sessioon ebaõnnestus – mängin offline.')
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
        <p className="text-white/60">Tundmatu mäng</p>
        <Link to="/dashboard" className="text-gold mt-4 inline-block">← Tagasi</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-gold mb-6 text-sm">
        <ArrowLeft size={16} /> Tagasi
      </Link>

      <h1 className="font-display text-3xl text-gold mb-2">
        {meta.emoji} Vali set · {meta.title}
      </h1>
      <p className="text-white/60 mb-8">Küsimuste set / “profiil”. Vali üks ja alusta.</p>

      {error && (
        <div className="mb-6 text-amber-200 text-sm bg-amber-900/30 border border-amber-600/40 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gold animate-pulse py-12">Laadin setid...</div>
      ) : (
        <div className="space-y-4">
          {packs.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-xl text-gold">{pack.name}</h3>
                  {pack.is_official && (
                    <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Ametlik</span>
                  )}
                </div>
                <p className="text-white/50 text-sm">{pack.description || 'Küsimuste set'}</p>
              </div>
              <button
                onClick={() => startSession(pack)}
                disabled={!!starting}
                className="btn-gold flex items-center gap-2 shrink-0"
              >
                <Play size={16} />
                {starting === pack.id ? 'Alustan...' : 'Alusta'}
              </button>
            </motion.div>
          ))}
          {packs.length === 0 && (
            <div className="text-center py-12 text-white/50">Ühtegi seti ei leitud.</div>
          )}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link to="/packs/new" className="btn-outline inline-flex items-center gap-2">
          <Plus size={16} /> Loo uus set
        </Link>
      </div>
    </div>
  )
}
