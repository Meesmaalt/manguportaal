import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Sparkles, Users, Tv, Layers, Play } from 'lucide-react'
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

export default function Home() {
  const { isLoggedIn } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-14"
      >
        <h1 className="font-display text-5xl md:text-7xl font-black text-gold tracking-wide mb-4 drop-shadow-[0_0_30px_rgba(223,179,66,0.4)]">
          ÕHTU MÄNGUD
        </h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">
          Seltskonnamängud kohe mängimiseks. Konto pole kohustuslik – vali mäng ja alusta.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard" className="btn-gold text-lg px-8 py-3 flex items-center gap-2">
            <Play size={20} /> Mängi kohe
          </Link>
          {!isLoggedIn && (
            <Link to="/login" className="btn-outline text-lg px-6 py-3">
              Konto (valikuline)
            </Link>
          )}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5 mb-16">
        {[
          {
            icon: <Play className="text-gold" size={26} />,
            title: 'Ilma kontota',
            text: 'Valmis setid on sees. Alusta sekunditega – sobib peole.',
          },
          {
            icon: <Tv className="text-gold" size={26} />,
            title: 'Host + TV',
            text: 'Juhi telefonist, ava koodiga link teleris.',
          },
          {
            icon: <Layers className="text-gold" size={26} />,
            title: 'Oma setid',
            text: 'Konto abil saad salvestada isiklikke küsimusi.',
          },
        ].map((f, i) => (
          <div key={i} className="card-panel p-5 text-center">
            <div className="flex justify-center mb-2">{f.icon}</div>
            <h3 className="font-display text-lg text-gold mb-1">{f.title}</h3>
            <p className="text-white/55 text-sm">{f.text}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-2xl text-gold text-center mb-6 flex items-center justify-center gap-2">
        <Sparkles size={22} /> Mängud
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ORDER.map((key) => {
          const g = GAME_META[key]
          return (
            <Link
              key={key}
              to={`/play/${key}`}
              className="card-panel p-5 hover:border-gold/50 transition group"
            >
              <span className="text-2xl">{g.emoji}</span>
              <p className="text-gold/60 text-xs uppercase tracking-widest mt-1">{g.subtitle}</p>
              <h3 className="font-display text-xl text-gold group-hover:text-gold-hover">{g.title}</h3>
              <p className="text-white/55 text-sm mt-1">{g.description}</p>
              <span className="inline-block mt-3 text-gold text-sm font-bold">Mängi →</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
