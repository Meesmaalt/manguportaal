import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { pb, formatPbError, type Pack } from '@/lib/pocketbase'
import { createOwnedPack } from '@/lib/sessions'
import { useAuth } from '@/hooks/useAuth'
import { Copy, Check, Layers } from 'lucide-react'

export default function SharePack() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [pack, setPack] = useState<Pack | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    pb.collection('packs')
      .getOne<Pack>(id)
      .then(setPack)
      .catch((e) => setError(formatPbError(e) || 'Packi ei leitud või pole avalik'))
  }, [id])

  async function clonePack() {
    if (!pack || !isLoggedIn) {
      navigate('/login')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await createOwnedPack({
        name: `${pack.name} (koopia)`,
        description: pack.description || '',
        game_type: pack.game_type,
        data: pack.data,
      })
      navigate(`/packs/${created.id}/edit`)
    } catch (e: any) {
      setError(formatPbError(e) || 'Kloonimine ebaõnnestus')
    } finally {
      setBusy(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const qCount =
    pack && typeof pack.data === 'object' && pack.data && Array.isArray((pack.data as any).questions)
      ? (pack.data as any).questions.length
      : null

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-display text-3xl text-gold mb-2 flex items-center gap-2">
        <Layers size={28} /> Pack
      </h1>
      {error && <p className="text-accent-red text-sm mb-4">{error}</p>}
      {!pack && !error && <p className="text-white/40">Laadin…</p>}
      {pack && (
        <div className="card-panel border-gold/30 p-5 space-y-3">
          <p className="font-display text-2xl text-gold font-black">{pack.name}</p>
          {pack.description && <p className="text-white/60 text-sm">{pack.description}</p>}
          <p className="text-xs text-white/40 uppercase tracking-wide">
            {pack.game_type}
            {qCount != null && ` · ${qCount} küsimust`}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={copyLink}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Link kopeeritud' : 'Kopeeri jagamislink'}
            </button>
            <button
              type="button"
              className="btn-gold text-xs flex items-center gap-1"
              disabled={busy}
              onClick={clonePack}
            >
              Klooni endale
            </button>
            <Link to={`/play/${pack.game_type}`} className="btn-outline text-xs">
              Mängi
            </Link>
          </div>
          {!isLoggedIn && (
            <p className="text-[11px] text-white/35">Kloonimiseks logi sisse.</p>
          )}
        </div>
      )}
    </div>
  )
}
