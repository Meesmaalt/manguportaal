import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pb, formatPbError, type Pack, ensurePbUrl } from '@/lib/pocketbase'
import { useI18n } from '@/i18n/I18nContext'
import { Shield, LogOut, Trash2, Star, Eye, EyeOff, RefreshCw, ExternalLink } from 'lucide-react'

/**
 * Site admin via PocketBase *superuser* (same credentials as PB dashboard /_/ ).
 * Superuser auth bypasses collection API rules → can manage official packs.
 */
export default function Admin() {
  const { t } = useI18n()
  const [email, setEmail] = useState('admin@ohtu.local')
  const [password, setPassword] = useState('')
  const [asAdmin, setAsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  function isSuperuserAuth() {
    // PB SDK: record collectionName or collectionId for superusers
    const rec: any = pb.authStore.record || pb.authStore.model
    if (!pb.authStore.token || !rec) return false
    const col = rec.collectionName || rec.collectionId || ''
    return col === '_superusers' || col === 'superusers' || String(col).includes('superuser')
  }

  useEffect(() => {
    ensurePbUrl()
    setAsAdmin(isSuperuserAuth())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (asAdmin) loadPacks()
  }, [asAdmin])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy('login')
    ensurePbUrl()
    try {
      // Prefer _superusers (PB 0.23+)
      try {
        await pb.collection('_superusers').authWithPassword(email.trim(), password)
      } catch {
        // older naming
        await pb.collection('superusers').authWithPassword(email.trim(), password)
      }
      if (!isSuperuserAuth() && !pb.authStore.isValid) {
        throw new Error('Auth failed')
      }
      setAsAdmin(true)
    } catch (err: any) {
      setError(
        formatPbError(err) +
          ' — Kasuta PocketBase superuser kontot (nt admin@ohtu.local), mitte tavalist lehe kasutajat.'
      )
      setAsAdmin(false)
    } finally {
      setBusy(null)
    }
  }

  function logout() {
    pb.authStore.clear()
    setAsAdmin(false)
    setPacks([])
  }

  async function loadPacks() {
    setBusy('list')
    setError('')
    try {
      ensurePbUrl()
      const list = await pb.collection('packs').getFullList<Pack>({
        requestKey: null,
      })
      // newest first if created exists
      setPacks(list)
    } catch (err: any) {
      setError(formatPbError(err))
    } finally {
      setBusy(null)
    }
  }

  async function patchPack(id: string, data: Record<string, unknown>) {
    setBusy(id)
    setError('')
    try {
      await pb.collection('packs').update(id, data)
      await loadPacks()
    } catch (err: any) {
      setError(formatPbError(err))
    } finally {
      setBusy(null)
    }
  }

  async function removePack(id: string, name: string) {
    if (!confirm(`${t('deletePackConfirm')}\n${name}`)) return
    setBusy(id)
    try {
      await pb.collection('packs').delete(id)
      await loadPacks()
    } catch (err: any) {
      setError(formatPbError(err))
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gold animate-pulse">
        …
      </div>
    )
  }

  if (!asAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-gold" size={32} />
          <div>
            <h1 className="font-display text-2xl text-gold">{t('adminTitle')}</h1>
            <p className="text-white/50 text-sm">{t('adminSub')}</p>
          </div>
        </div>
        <form onSubmit={login} className="card-panel p-6 space-y-4">
          <div>
            <label className="text-white/50 text-xs block mb-1">Email</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-white/50 text-xs block mb-1">Password</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-accent-red text-sm">{error}</p>}
          <button type="submit" className="btn-gold w-full" disabled={!!busy}>
            {busy === 'login' ? '…' : t('adminLogin')}
          </button>
          <p className="text-white/35 text-xs leading-relaxed">{t('adminHint')}</p>
        </form>
        <p className="text-center mt-6">
          <Link to="/" className="text-gold/70 text-sm hover:text-gold">
            ← {t('packBack')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Shield className="text-gold" size={28} />
          <div>
            <h1 className="font-display text-2xl text-gold">{t('adminTitle')}</h1>
            <p className="text-white/45 text-sm">{t('adminLoggedIn')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-outline text-sm flex items-center gap-1" onClick={loadPacks}>
            <RefreshCw size={14} /> {t('adminRefresh')}
          </button>
          <button
            type="button"
            className="btn-outline text-sm flex items-center gap-1 border-accent-red/40 text-accent-red"
            onClick={logout}
          >
            <LogOut size={14} /> {t('navLogout')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl border border-accent-red/40 bg-accent-red/10 text-accent-red text-sm">
          {error}
        </div>
      )}

      <p className="text-white/50 text-sm mb-4">{t('adminPacksHint')}</p>

      <div className="space-y-3">
        {busy === 'list' && <div className="text-gold animate-pulse text-sm">…</div>}
        {packs.length === 0 && busy !== 'list' && (
          <p className="text-white/40 text-sm">{t('adminNoPacks')}</p>
        )}
        {packs.map((pack) => (
          <div key={pack.id} className="card-panel p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="min-w-0">
              <div className="font-display text-gold text-lg truncate">{pack.name}</div>
              <div className="text-white/45 text-xs flex flex-wrap gap-2 mt-1">
                <span className="uppercase tracking-wide">{pack.game_type}</span>
                {pack.is_official && (
                  <span className="text-amber-300 flex items-center gap-0.5">
                    <Star size={12} /> {t('packOfficial')}
                  </span>
                )}
                {pack.is_public && <span className="text-accent-cyan">{t('adminPublic')}</span>}
                {pack.owner && <span className="text-white/30">owner: {String(pack.owner).slice(0, 8)}…</span>}
              </div>
              {pack.description && <p className="text-white/40 text-xs mt-1 line-clamp-2">{pack.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                disabled={!!busy}
                className="btn-outline text-xs !py-1.5 !px-2.5"
                title="Official"
                onClick={() => patchPack(pack.id, { is_official: !pack.is_official })}
              >
                <Star size={12} className="inline mr-1" />
                {pack.is_official ? t('adminUnsetOfficial') : t('adminSetOfficial')}
              </button>
              <button
                type="button"
                disabled={!!busy}
                className="btn-outline text-xs !py-1.5 !px-2.5"
                onClick={() => patchPack(pack.id, { is_public: !pack.is_public })}
              >
                {pack.is_public ? <EyeOff size={12} className="inline mr-1" /> : <Eye size={12} className="inline mr-1" />}
                {pack.is_public ? t('adminUnsetPublic') : t('adminSetPublic')}
              </button>
              <Link
                to={`/packs/${pack.id}/edit`}
                className="btn-outline text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1"
              >
                <ExternalLink size={12} /> {t('editPack')}
              </Link>
              <button
                type="button"
                disabled={!!busy}
                className="btn-outline text-xs !py-1.5 !px-2.5 border-accent-red/50 text-accent-red"
                onClick={() => removePack(pack.id, pack.name)}
              >
                <Trash2 size={12} className="inline mr-1" /> {t('deletePack')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-white/30 text-xs mt-10 text-center">
        PB: <code className="text-white/40">{pb.baseUrl}</code>
      </p>
    </div>
  )
}
