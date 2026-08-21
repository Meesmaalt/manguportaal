import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { pb, generateCode, type Pack } from '@/lib/pocketbase'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Play, Plus, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PackSelect() {
  const { gameType } = useParams<{ gameType: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const isValid = gameType === 'kuldvillak' || gameType === 'roosidesoda'

  useEffect(() => {
    if (!isValid) return
    loadPacks()
  }, [gameType, user])

  async function loadPacks() {
    setLoading(true)
    setError('')
    try {
      // Try PocketBase first
      const list = await pb.collection('packs').getList<Pack>(1, 50, {
        filter: `game_type = "${gameType}" && (is_official = true || is_public = true || owner = "${user?.id}")`,
        sort: '-is_official,-created',
      })
      setPacks(list.items)
    } catch (e) {
      console.warn('PocketBase packs failed, using local official packs', e)
      // Fallback to local official packs
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
    try {
      const code = generateCode()
      let packId = pack.id

      // If local pack, create it in PB first (or just embed data in session)
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
          // If create fails (no collection), store data in session state
          packId = pack.id
        }
      }

      const initialState =
        gameType === 'kuldvillak'
          ? {
              teams: [
                { name: 'Meeskond 1', score: 0 },
                { name: 'Meeskond 2', score: 0 },
              ],
              disabledCards: [] as string[],
              currentQuestion: null as any,
              showAnswer: false,
              packData: pack.data,
            }
          : {
              teams: [
                { name: 'Meeskond 1', score: 0 },
                { name: 'Meeskond 2', score: 0 },
              ],
              currentRoundIdx: 0,
              revealed: [] as number[],
              strikes: 0,
              bank: 0,
              activeTeam: 0,
              packData: pack.data,
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
      // Offline / no PB fallback: create local session in memory via URL state is hard;
      // instead show message and still allow local play with a fake id
      setError(
        'Sessiooni loomine ebaõnnestus (PocketBase pole käivitatud?). ' +
          'Käivita PocketBase või proovi uuesti. Võid ka mängida offline-režiimis allpool.'
      )
      // Create a local-only session key
      const localId = `local-${Date.now()}`
      const stateKey = `session_${localId}`
      const initialState =
        gameType === 'kuldvillak'
          ? {
              teams: [
                { name: 'Meeskond 1', score: 0 },
                { name: 'Meeskond 2', score: 0 },
              ],
              disabledCards: [],
              currentQuestion: null,
              showAnswer: false,
              packData: pack.data,
              code: generateCode(),
            }
          : {
              teams: [
                { name: 'Meeskond 1', score: 0 },
                { name: 'Meeskond 2', score: 0 },
              ],
              currentRoundIdx: 0,
              revealed: [],
              strikes: 0,
              bank: 0,
              activeTeam: 0,
              packData: pack.data,
              code: generateCode(),
            }
      localStorage.setItem(stateKey, JSON.stringify(initialState))
      navigate(`/play/${gameType}/${localId}`)
    } finally {
      setStarting(null)
    }
  }

  if (!isValid) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60">Tundmatu mäng</p>
        <Link to="/dashboard" className="text-gold mt-4 inline-block">
          ← Tagasi
        </Link>
      </div>
    )
  }

  const title = gameType === 'kuldvillak' ? 'Kuldvillak' : 'Rooside Sõda'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-white/60 hover:text-gold mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Tagasi
      </Link>

      <h1 className="font-display text-3xl text-gold mb-2">Vali küsimuste set</h1>
      <p className="text-white/60 mb-8">
        {title} · Need on sinu “profiilid”. Vali üks ja alusta mängu.
      </p>

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
              transition={{ delay: i * 0.05 }}
              className="card-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-xl text-gold">{pack.name}</h3>
                  {pack.is_official && (
                    <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                      Ametlik
                    </span>
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
            <div className="text-center py-12 text-white/50">
              Ühtegi seti ei leitud. Loo oma!
            </div>
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
