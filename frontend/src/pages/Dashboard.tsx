import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import { GAME_META, type GameType } from '@/lib/types'

const ORDER: GameType[] = [
  'kuldvillak',
  'roosidesoda',
  'sonaseletus',
  'ma_ei_ole_kunagi',
  'viimane_pusti',
  'tode_voi_tegu',
]

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl md:text-4xl text-gold mb-2">
          Tere, {user?.name || 'mängija'}!
        </h1>
        <p className="text-white/60 mb-10">Vali mäng või loo uus küsimuste set.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {ORDER.map((key) => {
            const g = GAME_META[key]
            return (
              <Link
                key={key}
                to={`/play/${key}`}
                className="card-panel p-6 hover:border-gold/60 hover:shadow-gold transition group"
              >
                <div className="text-3xl mb-2">{g.emoji}</div>
                <p className="text-gold/60 text-xs uppercase tracking-widest">{g.subtitle}</p>
                <h2 className="font-display text-xl text-gold mb-1 group-hover:text-gold-hover">
                  {g.title}
                </h2>
                <p className="text-white/50 text-sm">{g.description}</p>
              </Link>
            )
          })}
        </div>

        <div className="card-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="text-gold" size={24} />
            <div>
              <h3 className="font-semibold text-white">Küsimuste setid</h3>
              <p className="text-white/50 text-sm">Loo oma pack iga mängu jaoks</p>
            </div>
          </div>
          <Link to="/packs/new" className="btn-outline flex items-center gap-2 text-sm">
            <Plus size={16} /> Loo uus set
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
