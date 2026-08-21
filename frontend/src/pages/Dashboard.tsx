import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Trophy, Heart, Plus, Layers } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl md:text-4xl text-gold mb-2">
          Tere, {user?.name || 'mängija'}!
        </h1>
        <p className="text-white/60 mb-10">Vali mäng või loo uus küsimuste set.</p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/play/kuldvillak"
            className="card-panel p-8 hover:border-gold/60 hover:shadow-gold transition group bg-gradient-to-br from-amber-600/15 to-transparent"
          >
            <Trophy className="text-gold mb-4 group-hover:scale-110 transition" size={36} />
            <h2 className="font-display text-2xl text-gold mb-2">Kuldvillak</h2>
            <p className="text-white/60 text-sm">
              Jeopardy-stiilis lauamäng. Vali pack, loo sessioon ja mängi.
            </p>
          </Link>

          <Link
            to="/play/roosidesoda"
            className="card-panel p-8 hover:border-gold/60 hover:shadow-gold transition group bg-gradient-to-br from-rose-700/15 to-transparent"
          >
            <Heart className="text-gold mb-4 group-hover:scale-110 transition" size={36} />
            <h2 className="font-display text-2xl text-gold mb-2">Rooside Sõda</h2>
            <p className="text-white/60 text-sm">
              Family Feud stiilis voorud, streigid ja bank. Klassika igale peole.
            </p>
          </Link>
        </div>

        <div className="card-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="text-gold" size={24} />
            <div>
              <h3 className="font-semibold text-white">Küsimuste setid</h3>
              <p className="text-white/50 text-sm">Loo oma pack või kasuta ametlikke</p>
            </div>
          </div>
          <Link to="/packs/new" className="btn-outline flex items-center gap-2 text-sm">
            <Plus size={16} />
            Loo uus set
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
