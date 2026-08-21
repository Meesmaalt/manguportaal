import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Sparkles, Users, Tv, Layers } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Home() {
  const { isLoggedIn } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="font-display text-5xl md:text-7xl font-black text-gold tracking-wide mb-4 drop-shadow-[0_0_30px_rgba(223,179,66,0.4)]">
          ÕHTU MÄNGUD
        </h1>
        <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto">
          Seltskonnamängud, mis muudavad iga õhtu unustamatuks.
          Logi sisse, vali küsimuste set ja mängi koos sõpradega.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-gold text-lg px-8 py-3">
              Mine mängima
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-gold text-lg px-8 py-3">
                Alusta kohe
              </Link>
              <a href="#mangud" className="btn-outline text-lg px-8 py-3">
                Vaata mänge
              </a>
            </>
          )}
        </div>
      </motion.div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {[
          {
            icon: <Layers className="text-gold" size={28} />,
            title: 'Küsimuste setid',
            text: 'Vali valmis pack või loo oma “profiil” – sünnipäev, teemaõhtu, firmapidu.',
          },
          {
            icon: <Tv className="text-gold" size={28} />,
            title: 'Host + TV režiim',
            text: 'Juhi mängu telefonist või laptopist, suur ekraan näitab ilusat vaadet sessioonikoodiga.',
          },
          {
            icon: <Users className="text-gold" size={28} />,
            title: 'Konto & salvestus',
            text: 'Sinu packid ja ajalugu on salvestatud. Mängi ükskõik millal uuesti.',
          },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="card-panel p-6 text-center"
          >
            <div className="flex justify-center mb-3">{f.icon}</div>
            <h3 className="font-display text-xl text-gold mb-2">{f.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{f.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Games */}
      <section id="mangud" className="mb-16">
        <h2 className="font-display text-3xl text-gold text-center mb-8 flex items-center justify-center gap-2">
          <Sparkles size={28} /> Mängud
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <GameCard
            title="Kuldvillak"
            subtitle="Jeopardy-stiil"
            description="Viis kategooriat, punktid 100–500. Avage kaarte, vastake, koguge punkte. Täiuslik meeskondadele."
            to={isLoggedIn ? '/play/kuldvillak' : '/login'}
            color="from-amber-600/20 to-yellow-900/10"
          />
          <GameCard
            title="Rooside Sõda"
            subtitle="Family Feud"
            description="Voorud, vastused, streigid ja bank. Kes arvab, mida inimesed ütlesid? Klassika igale peole."
            to={isLoggedIn ? '/play/roosidesoda' : '/login'}
            color="from-rose-700/20 to-red-900/10"
          />
        </div>
      </section>
    </div>
  )
}

function GameCard({
  title,
  subtitle,
  description,
  to,
  color,
}: {
  title: string
  subtitle: string
  description: string
  to: string
  color: string
}) {
  return (
    <Link
      to={to}
      className={`card-panel p-8 block hover:border-gold/60 transition-all hover:shadow-gold group bg-gradient-to-br ${color}`}
    >
      <p className="text-gold/70 text-sm font-semibold uppercase tracking-widest mb-1">{subtitle}</p>
      <h3 className="font-display text-3xl text-gold mb-3 group-hover:text-gold-hover transition">{title}</h3>
      <p className="text-white/70 leading-relaxed">{description}</p>
      <span className="inline-block mt-5 text-gold font-bold group-hover:translate-x-1 transition-transform">
        Mängi →
      </span>
    </Link>
  )
}
