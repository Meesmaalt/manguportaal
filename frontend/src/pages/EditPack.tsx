import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { pb, formatPbError, type Pack } from '@/lib/pocketbase'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { ArrowLeft, Save } from 'lucide-react'

/** Minimal editor: name, description, raw JSON data for own packs */
export default function EditPack() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoggedIn } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [pack, setPack] = useState<Pack | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    pb.collection('packs')
      .getOne<Pack>(id)
      .then((p) => {
        setPack(p)
        setName(p.name)
        setDescription(p.description || '')
        setJsonText(JSON.stringify(p.data, null, 2))
      })
      .catch((e) => setError(formatPbError(e)))
  }, [id])

  if (!isLoggedIn) {
    return (
      <div className="text-center py-16">
        <p className="text-white/70 mb-4">{t('importNeedLogin')}</p>
        <Link to="/login" className="btn-gold">
          {t('navLogin')}
        </Link>
      </div>
    )
  }

  async function save() {
    if (!pack || !user) return
    if (pack.owner !== user.id) {
      setError(t('editOnlyOwn'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = JSON.parse(jsonText)
      await pb.collection('packs').update(pack.id, {
        name: name.trim(),
        description: description.trim(),
        data,
      })
      navigate(`/play/${pack.game_type}`)
    } catch (e: any) {
      setError(formatPbError(e))
    } finally {
      setSaving(false)
    }
  }

  if (error && !pack) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-accent-red text-sm px-4">{error}</div>
    )
  }

  if (!pack) {
    return <div className="text-center py-16 text-gold animate-pulse">{t('loadingGame')}</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to={`/play/${pack.game_type}`} className="text-white/50 text-sm hover:text-gold inline-flex items-center gap-2 mb-6">
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>
      <h1 className="font-display text-2xl text-gold mb-6">{t('editPack')}</h1>
      <div className="space-y-4">
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nimi" />
        <input
          className="input-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kirjeldus"
        />
        <p className="text-white/40 text-xs">{t('editJsonHint')}</p>
        <textarea
          className="input-field font-mono text-xs min-h-[320px]"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        {error && <p className="text-accent-red text-sm">{error}</p>}
        <button type="button" className="btn-gold flex items-center gap-2" disabled={saving} onClick={save}>
          <Save size={16} /> {saving ? '…' : t('savePack')}
        </button>
      </div>
    </div>
  )
}
