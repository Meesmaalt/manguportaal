import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import { generateCode } from '@/lib/pocketbase'
import { useI18n } from '@/i18n/I18nContext'
import { Heart, Play, Printer } from 'lucide-react'

const WEDDING_NAME = 'Kuldvillak – Pulm Aleksander & Riina'

/**
 * Simple wedding evening flow — not a full playlist product.
 * 1) Kuldvillak wedding pack  2) suggest short next games
 */
export default function WeddingEvening() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const pack = OFFICIAL_PACKS.find((p) => p.name === WEDDING_NAME)

  function startKuldvillak() {
    if (!pack) return
    setStarting(true)
    const code = generateCode()
    const initialState = {
      teams: [
        { name: 'Pruut', score: 0 },
        { name: 'Peig', score: 0 },
      ],
      disabledCards: [],
      currentQuestion: null,
      showAnswer: false,
      packData: pack.data,
      code,
      buzzEnabled: true,
      buzz: null,
      finalPhase: 'none',
      finalWagers: [0, 0],
    }
    const localId = `local-${Date.now()}`
    localStorage.setItem(`session_${localId}`, JSON.stringify(initialState))
    localStorage.setItem('ohtu_evening', JSON.stringify({ step: 'kuldvillak', startedAt: Date.now() }))
    navigate(`/play/kuldvillak/${localId}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Heart className="text-gold mx-auto mb-3" size={36} />
        <h1 className="font-display text-3xl md:text-4xl text-gold font-black mb-2">
          {t('weddingTitle')}
        </h1>
        <p className="text-white/60">{t('weddingSub')}</p>
      </div>

      <ol className="space-y-4 mb-10">
        <li className="card-panel p-5 border-gold/40">
          <div className="text-gold/60 text-xs uppercase tracking-widest mb-1">1</div>
          <h2 className="font-display text-xl text-gold mb-2">{t('game_kuldvillak')}</h2>
          <p className="text-white/55 text-sm mb-4">{t('weddingStep1')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!pack || starting}
              onClick={startKuldvillak}
              className="btn-gold flex items-center gap-2"
            >
              <Play size={16} /> {t('weddingStart')}
            </button>
            {pack && (
              <Link
                to={`/print?name=${encodeURIComponent(WEDDING_NAME)}`}
                className="btn-outline text-sm flex items-center gap-2"
              >
                <Printer size={14} /> {t('printPdf')}
              </Link>
            )}
          </div>
        </li>
        <li className="card-panel p-5 opacity-90">
          <div className="text-gold/60 text-xs uppercase tracking-widest mb-1">2</div>
          <h2 className="font-display text-xl text-gold mb-2">{t('game_roosidesoda')}</h2>
          <p className="text-white/55 text-sm mb-3">{t('weddingStep2')}</p>
          <Link to="/play/roosidesoda" className="text-accent-cyan text-sm hover:underline">
            {t('homePlayCta')}
          </Link>
        </li>
        <li className="card-panel p-5 opacity-90">
          <div className="text-gold/60 text-xs uppercase tracking-widest mb-1">3</div>
          <h2 className="font-display text-xl text-gold mb-2">{t('game_tode_voi_tegu')}</h2>
          <p className="text-white/55 text-sm mb-3">{t('weddingStep3')}</p>
          <Link to="/play/tode_voi_tegu" className="text-accent-cyan text-sm hover:underline">
            {t('homePlayCta')}
          </Link>
        </li>
      </ol>

      <p className="text-center text-white/35 text-xs">{t('weddingNote')}</p>
    </div>
  )
}
