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
  const { user, isLoggedIn } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl md:text-4xl text-gold mb-2">
          {isLoggedIn ? `Tere, ${user?.name || 'mängija'}!` : 'Vali mäng'}
        </h1>
        <p className="text-white/60 mb-8">
          {isLoggedIn
            ? 'Vali mäng või loo uus küsimuste set.'
            : 'Konto pole vajalik – vali mäng ja alusta kohe valmis settidega.'}
        </p>

        {!isLoggedIn && (
          <div className="card-panel p-4 mb-8 border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-white/70 text-sm">
              Tahad salvestada omi küsimusi?{' '}
              <Link to="/login" className="text-gold font-semibold hover:underline">
                Loo tasuta konto
              </Link>
            </p>
            <Link to="/login" className="btn-outline text-sm shrink-0">
              Sisene / Registreeri
            </Link>
          </div>
        )}

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
                <span className="inline-block mt-3 text-gold text-sm font-bold group-hover:translate-x-0.5 transition">
                  Mängi →
                </span>
              </Link>
            )
          })}
        </div>

        <div className="card-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="text-gold" size={24} />
            <div>
              <h3 className="font-semibold text-white">Küsimuste setid</h3>
              <p className="text-white/50 text-sm">
                {isLoggedIn
                  ? 'Loo oma pack iga mängu jaoks'
                  : 'Valmis setid on kõigile – oma seti loomiseks logi sisse'}
              </p>
            </div>
          </div>
          {isLoggedIn ? (
            <Link to="/packs/new" className="btn-outline flex items-center gap-2 text-sm">
              <Plus size={16} /> Loo uus set
            </Link>
          ) : (
            <Link to="/login" className="btn-outline text-sm">
              Logi sisse
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
