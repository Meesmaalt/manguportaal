import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { pb, formatPbError, type Pack, ensurePbUrl } from '@/lib/pocketbase'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import { useI18n } from '@/i18n/I18nContext'
import type { TranslationKey } from '@/i18n/translations'
import { GAME_META, type GameType } from '@/lib/types'
import {
  Shield,
  LogOut,
  Trash2,
  Star,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Upload,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'

const GAME_TYPES: GameType[] = [
  'kuldvillak',
  'roosidesoda',
  'sonaseletus',
  'ma_ei_ole_kunagi',
  'viimane_pusti',
  'tode_voi_tegu',
]

/**
 * Site admin via PocketBase superuser (same as /_/ dashboard).
 * Superuser bypasses collection API rules — can create/update/delete official packs.
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
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all')
  const [msg, setMsg] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  function isSuperuserAuth() {
    if (!pb.authStore.isValid || !pb.authStore.token) return false
    const rec: any = pb.authStore.record || pb.authStore.model
    if (!rec) return false
    const col = String(rec.collectionName || rec.collectionId || '')
    // PB 0.22+ uses _superusers; older may use superusers
    return (
      col.includes('superuser') ||
      col === '_superusers' ||
      // some clients only expose collectionId like "pbc_..." — treat valid admin token after our login as ok
      Boolean((rec as any).email && !col.includes('users'))
    )
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
      try {
        await pb.collection('_superusers').authWithPassword(email.trim(), password)
      } catch {
        await pb.collection('superusers').authWithPassword(email.trim(), password)
      }
      setAsAdmin(true)
    } catch (err: any) {
      setError(
        formatPbError(err) +
          ' — Kasuta PB superuser kontot (nt admin@ohtu.local), mitte tavalist lehe kasutajat.'
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
    setMsg('')
    setError('')
  }

  function ensureStillAdmin(): boolean {
    if (isSuperuserAuth()) return true
    setAsAdmin(false)
    setError(t('adminSessionLost'))
    return false
  }

  async function loadPacks() {
    if (!ensureStillAdmin()) return
    setBusy('list')
    setError('')
    try {
      ensurePbUrl()
      const list = await pb.collection('packs').getFullList<Pack>({ requestKey: null })
      setPacks(list)
    } catch (err: any) {
      const status = (err as any)?.status
      if (status === 401 || status === 403) {
        setAsAdmin(false)
        setError(t('adminSessionLost'))
      } else {
        setError(formatPbError(err))
      }
    } finally {
      setBusy(null)
    }
  }

  async function patchPack(id: string, data: Record<string, unknown>) {
    if (!ensureStillAdmin()) return
    setBusy(id)
    setError('')
    setMsg('')
    try {
      // Superuser bypasses rules; still send minimal payload
      await pb.collection('packs').update(id, data)
      setMsg(t('adminSaved'))
      await loadPacks()
    } catch (err: any) {
      const status = (err as any)?.status
      if (status === 401 || status === 403) {
        setAsAdmin(false)
        setError(t('adminSessionLost'))
      } else {
        setError(
          formatPbError(err) +
            ' — Superuserina peaks uuendus töötama. Kui ebaõnnestub, ava PB Admin → packs → API rules või proovi enne eemaldada „ametlik“ märge.'
        )
      }
    } finally {
      setBusy(null)
    }
  }

  async function removePack(id: string, name: string, wasOfficial: boolean) {
    if (!ensureStillAdmin()) return
    const hint = wasOfficial
      ? `\n\n${t('adminDeleteOfficialHint')}`
      : ''
    if (!confirm(`${t('deletePackConfirm')}\n${name}${hint}`)) return
    setBusy(id)
    setError('')
    setMsg('')
    try {
      // If official, first clear flag (some PB setups still enforce rules for non-bypass)
      if (wasOfficial) {
        try {
          await pb.collection('packs').update(id, { is_official: false })
        } catch {
          /* superuser may delete directly */
        }
      }
      await pb.collection('packs').delete(id)
      setMsg(`✓ ${t('deletePack')}: ${name}`)
      setPacks((prev) => prev.filter((p) => p.id !== id))
      await loadPacks()
    } catch (err: any) {
      const status = (err as any)?.status
      if (status === 401 || status === 403) {
        setAsAdmin(false)
        setError(t('adminSessionLost'))
      } else {
        setError(
          formatPbError(err) +
            ' — Ametliku seti kustutamiseks: eemalda enne „Ametlik“ või muuda PB-s deleteRule (superuser peaks reegleid ignoreerima).'
        )
      }
    } finally {
      setBusy(null)
    }
  }

  /** Upsert code template into DB as official+public (match by name + game_type). */
  async function upsertTemplate(tpl: (typeof OFFICIAL_PACKS)[number]) {
    const payload = {
      name: tpl.name,
      description: tpl.description || '',
      game_type: tpl.game_type,
      data: tpl.data,
      is_official: true,
      is_public: true,
    }
    const existing = packs.find(
      (p) => p.name === tpl.name && p.game_type === tpl.game_type
    )
    if (existing) {
      await pb.collection('packs').update(existing.id, payload)
      return 'updated' as const
    }
    await pb.collection('packs').create(payload)
    return 'created' as const
  }

  /** Push a code-side official template into PocketBase as is_official */
  async function seedTemplate(tpl: (typeof OFFICIAL_PACKS)[number]) {
    if (!ensureStillAdmin()) return
    setBusy('seed-' + tpl.name)
    setError('')
    setMsg('')
    try {
      const action = await upsertTemplate(tpl)
      setMsg(action === 'updated' ? `✓ ${tpl.name} uuendatud` : `✓ ${tpl.name} → baasi`)
      await loadPacks()
    } catch (err: any) {
      const status = (err as any)?.status
      if (status === 401 || status === 403) {
        setAsAdmin(false)
        setError(t('adminSessionLost'))
      } else {
        setError(
          formatPbError(err, { adminContext: true }) +
            ` — ${t('adminSeedFailHint')}`
        )
      }
    } finally {
      setBusy(null)
    }
  }

  async function seedAllMissing() {
    if (!ensureStillAdmin()) return
    setBusy('seed-all')
    setError('')
    setMsg('')
    let created = 0
    let updated = 0
    try {
      for (const tpl of OFFICIAL_PACKS) {
        if (gameFilter !== 'all' && tpl.game_type !== gameFilter) continue
        const exists = packs.some(
          (p) => p.name === tpl.name && p.game_type === tpl.game_type
        )
        // "Seed all missing" only creates; use seedTemplate for single upsert
        if (exists) continue
        await upsertTemplate(tpl)
        created++
      }
      setMsg(`✓ ${created} setti baasi` + (updated ? `, ${updated} uuendatud` : ''))
      await loadPacks()
    } catch (err: any) {
      const status = (err as any)?.status
      if (status === 401 || status === 403) {
        setAsAdmin(false)
        setError(t('adminSessionLost'))
      } else {
        setError(formatPbError(err, { adminContext: true }) + ` — ${t('adminSeedFailHint')}`)
      }
    } finally {
      setBusy(null)
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const g of GAME_TYPES) c[g] = 0
    for (const p of packs) {
      c[p.game_type] = (c[p.game_type] || 0) + 1
    }
    return c
  }, [packs])

  const filtered = useMemo(() => {
    let list = packs
    if (gameFilter !== 'all') list = list.filter((p) => p.game_type === gameFilter)
    const q = searchQ.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          p.game_type.toLowerCase().includes(q)
      )
    }
    return list
  }, [packs, gameFilter, searchQ])

  const missingTemplates = useMemo(() => {
    return OFFICIAL_PACKS.filter((tpl) => {
      if (gameFilter !== 'all' && tpl.game_type !== gameFilter) return false
      return !packs.some((p) => p.name === tpl.name && p.game_type === tpl.game_type)
    })
  }, [packs, gameFilter])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gold animate-pulse">…</div>
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-gold" size={28} />
          <div>
            <h1 className="font-display text-2xl text-gold">{t('adminTitle')}</h1>
            <p className="text-white/45 text-sm">
              {t('adminLoggedIn')} · {packs.length} setti baasis
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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

      {/* Game filter */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <Filter size={16} className="text-gold/70" />
        <button
          type="button"
          onClick={() => setGameFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full border ${
            gameFilter === 'all' ? 'bg-gold text-bg border-gold font-bold' : 'border-gold/40 text-gold'
          }`}
        >
          {t('adminAllGames')} ({packs.length})
        </button>
        {GAME_TYPES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGameFilter(g)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              gameFilter === g ? 'bg-gold text-bg border-gold font-bold' : 'border-gold/40 text-gold'
            }`}
          >
            {GAME_META[g]?.emoji} {t(('game_' + g) as TranslationKey)} ({counts[g] || 0})
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          className="input-field text-sm"
          placeholder={t('adminSearch')}
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl border border-accent-red/40 bg-accent-red/10 text-accent-red text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 p-3 rounded-xl border border-accent-green/40 bg-accent-green/10 text-accent-green text-sm">
          {msg}
        </div>
      )}

      <div className="mb-4 p-3 rounded-xl border border-gold/20 bg-black/20 text-white/55 text-sm flex gap-2">
        <Info size={16} className="text-gold/70 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>{t('adminPacksHint')}</p>
          <p className="text-white/40 text-xs">{t('adminPacksHint2')}</p>
        </div>
      </div>

      {/* DB packs */}
      <h2 className="font-display text-gold text-lg mb-3">{t('adminInDb')}</h2>
      <div className="space-y-3 mb-10">
        {busy === 'list' && <div className="text-gold animate-pulse text-sm">…</div>}
        {filtered.length === 0 && busy !== 'list' && (
          <p className="text-white/40 text-sm">{t('adminNoPacks')}</p>
        )}
        {filtered.map((pack) => (
          <div
            key={pack.id}
            className="card-panel p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
          >
            <div className="min-w-0">
              <div className="font-display text-gold text-lg truncate">{pack.name}</div>
              <div className="text-white/50 text-xs flex flex-wrap gap-2 mt-1">
                <span className="text-gold/90 font-medium">
                  {GAME_META[pack.game_type as GameType]?.emoji}{' '}
                  {t(('game_' + pack.game_type) as TranslationKey)}
                </span>
                <span className="text-white/30">·</span>
                <span className="uppercase tracking-wide text-white/40">{pack.game_type}</span>
                {pack.is_official && (
                  <span className="text-amber-300 flex items-center gap-0.5">
                    <Star size={12} /> {t('packOfficial')}
                  </span>
                )}
                {pack.is_public && <span className="text-accent-cyan">{t('adminPublic')}</span>}
              </div>
              {pack.description && (
                <p className="text-white/40 text-xs mt-1 line-clamp-2">{pack.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                disabled={!!busy}
                className="btn-outline text-xs !py-1.5 !px-2.5"
                onClick={() => patchPack(pack.id, { is_official: !pack.is_official })}
                title={pack.is_official ? t('adminUnsetOfficial') : t('adminSetOfficial')}
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
                {pack.is_public ? (
                  <EyeOff size={12} className="inline mr-1" />
                ) : (
                  <Eye size={12} className="inline mr-1" />
                )}
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
                onClick={() => removePack(pack.id, pack.name, !!pack.is_official)}
              >
                <Trash2 size={12} className="inline mr-1" /> {t('deletePack')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Templates not yet in DB — collapsed by default */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowTemplates((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-left card-panel p-3 border-dashed border-gold/30 hover:border-gold/50 transition"
        >
          <div>
            <div className="font-display text-gold text-base">
              {t('adminMissing')}
              {missingTemplates.length > 0 && (
                <span className="ml-2 text-sm font-sans text-amber-300/90">
                  ({missingTemplates.length})
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs mt-0.5">{t('adminMissingHint')}</p>
          </div>
          {showTemplates ? (
            <ChevronUp size={18} className="text-gold/70 shrink-0" />
          ) : (
            <ChevronDown size={18} className="text-gold/70 shrink-0" />
          )}
        </button>

        {showTemplates && (
          <div className="mt-3 space-y-3">
            {missingTemplates.length === 0 ? (
              <p className="text-white/40 text-sm px-1">{t('adminNoMissing')}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-gold text-sm flex items-center gap-1"
                    disabled={!!busy || missingTemplates.length === 0}
                    onClick={seedAllMissing}
                  >
                    <Upload size={14} /> {t('adminSeedAll')} ({missingTemplates.length})
                  </button>
                </div>
                <div className="space-y-2">
                  {missingTemplates.map((tpl) => (
                    <div
                      key={tpl.game_type + tpl.name}
                      className="card-panel p-3 flex flex-wrap items-center justify-between gap-2 border-dashed border-gold/30"
                    >
                      <div>
                        <div className="text-gold/90 font-medium text-sm">{tpl.name}</div>
                        <div className="text-white/40 text-xs">
                          {GAME_META[tpl.game_type as GameType]?.emoji}{' '}
                          {t(('game_' + tpl.game_type) as TranslationKey)} · {tpl.game_type}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1"
                        disabled={!!busy}
                        onClick={() => seedTemplate(tpl)}
                      >
                        <Upload size={12} /> {t('adminSeedOne')}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-white/30 text-xs mt-10 text-center">
        PB: <code className="text-white/40">{pb.baseUrl}</code>
      </p>
    </div>
  )
}
