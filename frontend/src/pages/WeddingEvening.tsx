import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateCode } from '@/lib/pocketbase'
import { createGameSession, downloadJson, packExportPayload } from '@/lib/sessions'
import { KULDVILLAK_PULM_ALEKSANDER_RIINA, WEDDING_PACK_META } from '@/data/wedding-pack-template'
import { useI18n } from '@/i18n/I18nContext'
import { useAuth } from '@/hooks/useAuth'
import { Heart, Play, Download, Upload } from 'lucide-react'

export default function WeddingEvening() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [starting, setStarting] = useState(false)

  function exportPack() {
    const payload = packExportPayload({
      name: WEDDING_PACK_META.name,
      description: WEDDING_PACK_META.description,
      game_type: WEDDING_PACK_META.game_type,
      data: KULDVILLAK_PULM_ALEKSANDER_RIINA,
    })
    downloadJson('kuldvillak-pulm-aleksander-riina.json', payload)
  }

  async function startKuldvillak() {
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
      packData: KULDVILLAK_PULM_ALEKSANDER_RIINA,
      code,
      buzzEnabled: true,
      showBuzzQr: false,
      buzz: null,
      finalPhase: 'none',
      finalWagers: [0, 0],
    }
    try {
      const { sessionId, isLocal } = await createGameSession({
        gameType: 'kuldvillak',
        hostId: user?.id || null,
        state: initialState,
      })
      if (isLocal) {
        alert(t('sessionLocalWarn'))
      }
      navigate(`/play/kuldvillak/${sessionId}`)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Heart className="text-gold mx-auto mb-3" size={36} />
        <h1 className="font-display text-3xl md:text-4xl text-gold font-black mb-2">
          {t('weddingTitle')}
        </h1>
        <p className="text-white/60">{t('weddingSub')}</p>
        <p className="text-white/40 text-sm mt-2">{t('weddingPrivate')}</p>
      </div>

      <div className="card-panel p-5 border-gold/40 mb-6 flex flex-wrap gap-2 justify-center">
        <button type="button" onClick={exportPack} className="btn-outline text-sm flex items-center gap-2">
          <Download size={14} /> {t('exportPack')}
        </button>
        {isLoggedIn ? (
          <Link to="/packs/import" className="btn-outline text-sm flex items-center gap-2">
            <Upload size={14} /> {t('importPack')}
          </Link>
        ) : (
          <Link to="/login" className="btn-outline text-sm">
            {t('importNeedLogin')}
          </Link>
        )}
      </div>

      <ol className="space-y-4 mb-10">
        <li className="card-panel p-5 border-gold/40">
          <div className="text-gold/60 text-xs uppercase tracking-widest mb-1">1</div>
          <h2 className="font-display text-xl text-gold mb-2">{t('game_kuldvillak')}</h2>
          <p className="text-white/55 text-sm mb-4">{t('weddingStep1')}</p>
          <button
            type="button"
            disabled={starting}
            onClick={startKuldvillak}
            className="btn-gold flex items-center gap-2"
          >
            <Play size={16} /> {t('weddingStart')}
          </button>
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
