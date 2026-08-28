import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pb, formatPbError } from '@/lib/pocketbase'
import { parseImportedPack } from '@/lib/sessions'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { Upload } from 'lucide-react'

export default function ImportPack() {
  const { t } = useI18n()
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-white/70 mb-4">{t('importNeedLogin')}</p>
        <Link to="/login" className="btn-gold">
          {t('navLogin')}
        </Link>
      </div>
    )
  }

  async function onFile(file: File) {
    setError('')
    setOk('')
    setBusy(true)
    try {
      const text = await file.text()
      const parsed = parseImportedPack(JSON.parse(text))
      await pb.collection('packs').create({
        name: parsed.name,
        description: parsed.description,
        game_type: parsed.game_type,
        data: parsed.data,
        is_official: false,
        is_public: false,
        owner: user!.id,
      })
      setOk(t('importSuccess'))
      setTimeout(() => navigate(`/play/${parsed.game_type}`), 800)
    } catch (e: any) {
      setError(formatPbError(e) || t('importError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-display text-3xl text-gold mb-2 flex items-center gap-2">
        <Upload size={28} /> {t('importPack')}
      </h1>
      <p className="text-white/55 text-sm mb-8">{t('importHint')}</p>

      <label className="card-panel p-8 border-dashed border-2 border-gold/40 flex flex-col items-center gap-3 cursor-pointer hover:border-gold transition">
        <span className="text-gold font-bold">{busy ? t('importing') : t('importChoose')}</span>
        <span className="text-white/40 text-xs">.json</span>
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
      </label>

      {error && <p className="text-accent-red mt-4 text-sm">{error}</p>}
      {ok && <p className="text-accent-green mt-4 text-sm">{ok}</p>}

      <Link to="/dashboard" className="inline-block mt-8 text-white/50 text-sm hover:text-gold">
        ← {t('packBack')}
      </Link>
    </div>
  )
}
