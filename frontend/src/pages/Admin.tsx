import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { pb, formatPbError, type Pack, ensurePbUrl } from '@/lib/pocketbase'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import AdminSounds from '@/components/AdminSounds'
import AdminAiSettingsCard from '@/components/AdminAiSettingsCard'
import AdminGameSettings from '@/components/AdminGameSettings'
import { backupUserAuth, restoreUserAuth } from '@/lib/adminAuth'
import { hideTemplate, isTemplateHidden, clearHiddenTemplates, unhideTemplate } from '@/lib/hiddenTemplates'
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
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Sparkles,
  Volume2,
  Sliders,
  Database,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  Tv,
} from 'lucide-react'

const GAME_TYPES: GameType[] = [
  'kuldvillak',
  'roosidesoda',
  'sonaseletus',
  'ma_ei_ole_kunagi',
  'viimane_pusti',
  'tode_voi_tegu',
  'kinnistu_deal',
  'blitz',
]

type AdminTab = 'packs' | 'settings' | 'ai' | 'sounds' | 'system'

/**
 * Site admin via PocketBase superuser (same as /_/ dashboard).
 * Superuser bypasses collection API rules — can create/update/delete official packs.
 */
export default function Admin() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<AdminTab>('packs')
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
    return (
      col.includes('superuser') ||
      col === '_superusers' ||
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
      backupUserAuth()
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
    restoreUserAuth()
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
      if (wasOfficial) {
        try {
          await pb.collection('packs').update(id, { is_official: false })
        } catch {}
      }
      await pb.collection('packs').delete(id)
      const pack = packs.find((x) => x.id === id)
      if (pack) hideTemplate(pack.game_type, pack.name)
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
            ' — Ametliku seti kustutamiseks: eemalda enne „Ametlik“ või muuda PB-s deleteRule.'
        )
      }
    } finally {
      setBusy(null)
    }
  }

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

  async function seedTemplate(tpl: (typeof OFFICIAL_PACKS)[number]) {
    if (!ensureStillAdmin()) return
    setBusy('seed-' + tpl.name)
    setError('')
    setMsg('')
    try {
      unhideTemplate(tpl.game_type, tpl.name)
      const action = await upsertTemplate(tpl)
      setMsg(action === 'updated' ? `✓ ${tpl.name} uuendatud` : `✓ ${tpl.name} lisatud andmebaasi`)
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
        if (exists) continue
        await upsertTemplate(tpl)
        created++
      }
      setMsg(`✓ ${created} komplekti viidud baasi` + (updated ? `, ${updated} uuendatud` : ''))
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

  const stats = useMemo(() => {
    const total = packs.length
    const official = packs.filter((p) => p.is_official).length
    const pub = packs.filter((p) => p.is_public).length
    return { total, official, pub }
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
      if (isTemplateHidden(tpl.game_type, tpl.name)) return false
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Admin Top Header */}
      <div className="card-panel p-5 bg-gradient-to-r from-bg-card via-blue-950/20 to-bg-card border-gold/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 shadow-lg shadow-gold/10">
              <Shield className="text-gold" size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl text-gold font-bold">{t('adminTitle')}</h1>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Superuser
                </span>
              </div>
              <p className="text-white/50 text-xs mt-0.5">
                {t('adminLoggedIn')} · PB andmebaas aktiivne
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-outline text-xs !py-2 !px-3 flex items-center gap-1.5"
              onClick={loadPacks}
              disabled={busy === 'list'}
              title="Värskenda andmed andmebaasist"
            >
              <RefreshCw size={13} className={busy === 'list' ? 'animate-spin text-gold' : ''} />
              <span>{t('adminRefresh')}</span>
            </button>
            <button
              type="button"
              className="btn-outline text-xs !py-2 !px-3 flex items-center gap-1.5 border-accent-red/40 text-accent-red hover:bg-accent-red/10"
              onClick={logout}
              title="Logi administraatorist välja"
            >
              <LogOut size={13} />
              <span>{t('navLogout')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('packs')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition border ${
              activeTab === 'packs'
                ? 'bg-gold text-bg font-bold border-gold shadow-md'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers size={15} />
            <span>Mängupakid</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'packs' ? 'bg-black/20 text-bg' : 'bg-white/10 text-white/70'
              }`}
            >
              {packs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition border ${
              activeTab === 'settings'
                ? 'bg-gold text-bg font-bold border-gold shadow-md'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sliders size={15} />
            <span>Mängu seaded</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition border ${
              activeTab === 'ai'
                ? 'bg-gold text-bg font-bold border-gold shadow-md'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sparkles size={15} />
            <span>Gemini AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sounds')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition border ${
              activeTab === 'sounds'
                ? 'bg-gold text-bg font-bold border-gold shadow-md'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Volume2 size={15} />
            <span>Helid & Efektid</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition border ${
              activeTab === 'system'
                ? 'bg-gold text-bg font-bold border-gold shadow-md'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Tv size={15} />
            <span>Süsteem</span>
          </button>
        </div>
      </div>

      {/* Global alerts */}
      {error && (
        <div className="p-4 rounded-xl border border-accent-red/40 bg-accent-red/10 text-accent-red text-sm flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="whitespace-pre-wrap">{error}</div>
        </div>
      )}
      {msg && (
        <div className="p-3.5 rounded-xl border border-accent-green/40 bg-accent-green/10 text-accent-green text-sm flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg('')}
            className="text-xs text-white/50 hover:text-white px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: PACKS MANAGEMENT */}
      {activeTab === 'packs' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-panel p-3.5 bg-black/20 flex flex-col items-center text-center">
              <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                Pakke andmebaasis
              </span>
              <span className="text-xl font-display font-bold text-gold mt-0.5">{stats.total}</span>
            </div>
            <div className="card-panel p-3.5 bg-black/20 flex flex-col items-center text-center">
              <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                Ametlikud komplektid
              </span>
              <span className="text-xl font-display font-bold text-amber-300 mt-0.5">
                {stats.official}
              </span>
            </div>
            <div className="card-panel p-3.5 bg-black/20 flex flex-col items-center text-center">
              <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                Avalikud komplektid
              </span>
              <span className="text-xl font-display font-bold text-accent-cyan mt-0.5">
                {stats.pub}
              </span>
            </div>
          </div>

          {/* Filtering & Search Toolbar */}
          <div className="card-panel p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  className="input-field text-sm !pl-10 !py-2"
                  placeholder={t('adminSearch')}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/packs/create"
                  className="btn-gold text-xs !py-2 !px-3.5 flex items-center gap-1.5 shrink-0 font-semibold"
                >
                  <FolderPlus size={14} />
                  <span>Uus pakk</span>
                </Link>
              </div>
            </div>

            {/* Game Type Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setGameFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  gameFilter === 'all'
                    ? 'bg-gold/20 border-gold text-gold font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t('adminAllGames')} ({packs.length})
              </button>
              {GAME_TYPES.map((g) => {
                const isSelected = gameFilter === g
                const count = counts[g] || 0
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGameFilter(g)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-gold/20 border-gold text-gold font-bold shadow-sm'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{GAME_META[g]?.emoji}</span>
                    <span>{t(('game_' + g) as TranslationKey)}</span>
                    <span className="text-[10px] opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* DB Packs List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-white/60 px-1">
              <span>
                Kuvatakse {filtered.length} / {packs.length} pakki
              </span>
              {searchQ && (
                <button
                  type="button"
                  onClick={() => setSearchQ('')}
                  className="text-gold/80 hover:text-gold underline"
                >
                  Tühjenda otsing
                </button>
              )}
            </div>

            {busy === 'list' && (
              <div className="text-gold animate-pulse text-sm text-center py-6">
                Laadin pakke...
              </div>
            )}

            {filtered.length === 0 && busy !== 'list' && (
              <div className="card-panel p-8 text-center space-y-2 border-dashed border-white/20">
                <Database size={32} className="mx-auto text-white/30" />
                <p className="text-white/60 text-sm font-medium">{t('adminNoPacks')}</p>
                <p className="text-white/35 text-xs">
                  Proovi filtrit muuta või impordi koodi baastempliidid allolevast sektsioonist.
                </p>
              </div>
            )}

            {filtered.map((pack) => (
              <div
                key={pack.id}
                className="card-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gold/30 transition group"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-gold text-base font-bold truncate">
                      {pack.name}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-white/70 border border-white/10 flex items-center gap-1">
                      <span>{GAME_META[pack.game_type as GameType]?.emoji}</span>
                      <span>{t(('game_' + pack.game_type) as TranslationKey)}</span>
                    </span>
                    {pack.is_official && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-semibold">
                        <Star size={11} className="fill-amber-300" /> {t('packOfficial')}
                      </span>
                    )}
                    {pack.is_public ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {t('adminPublic')}
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white/40">
                        Privaatne
                      </span>
                    )}
                  </div>

                  {pack.description && (
                    <p className="text-white/50 text-xs line-clamp-1">{pack.description}</p>
                  )}
                  <div className="text-[10px] text-white/30 font-mono">
                    ID: {pack.id} · uuendatud {new Date(pack.updated).toLocaleDateString()}
                  </div>
                </div>

                {/* Structured Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                  <button
                    type="button"
                    disabled={!!busy}
                    className={`btn-outline text-xs !py-1.5 !px-2.5 flex items-center gap-1 ${
                      pack.is_official
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'text-white/60'
                    }`}
                    onClick={() => patchPack(pack.id, { is_official: !pack.is_official })}
                    title={pack.is_official ? t('adminUnsetOfficial') : t('adminSetOfficial')}
                  >
                    <Star
                      size={12}
                      className={pack.is_official ? 'fill-amber-300 text-amber-300' : ''}
                    />
                    <span>{pack.is_official ? 'Ametlik ✓' : 'Tee ametlikuks'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!!busy}
                    className={`btn-outline text-xs !py-1.5 !px-2.5 flex items-center gap-1 ${
                      pack.is_public ? 'text-cyan-300 border-cyan-500/40' : 'text-white/60'
                    }`}
                    onClick={() => patchPack(pack.id, { is_public: !pack.is_public })}
                  >
                    {pack.is_public ? (
                      <>
                        <EyeOff size={12} />
                        <span>Avalik</span>
                      </>
                    ) : (
                      <>
                        <Eye size={12} />
                        <span>Privaatne</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/packs/${pack.id}/edit`}
                    className="btn-outline text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1 text-gold border-gold/30 hover:border-gold"
                  >
                    <ExternalLink size={12} />
                    <span>{t('editPack')}</span>
                  </Link>

                  <button
                    type="button"
                    disabled={!!busy}
                    className="btn-outline text-xs !py-1.5 !px-2 border-accent-red/40 text-accent-red hover:bg-accent-red/10"
                    onClick={() => removePack(pack.id, pack.name, !!pack.is_official)}
                    title={t('deletePack')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Seed / Missing Code Templates Dropdown Section */}
          <div className="pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className="w-full flex items-center justify-between gap-3 text-left card-panel p-4 bg-black/30 border-dashed border-gold/30 hover:border-gold/50 transition rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                  <Upload size={16} />
                </div>
                <div>
                  <div className="font-display text-gold text-sm font-semibold flex items-center gap-2">
                    <span>{t('adminMissing')}</span>
                    {missingTemplates.length > 0 && (
                      <span className="text-xs font-mono font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {missingTemplates.length}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{t('adminMissingHint')}</p>
                </div>
              </div>
              {showTemplates ? (
                <ChevronUp size={18} className="text-gold/70 shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-gold/70 shrink-0" />
              )}
            </button>

            {showTemplates && (
              <div className="mt-3 p-4 card-panel bg-black/20 border-white/10 space-y-4">
                {missingTemplates.length === 0 ? (
                  <div className="p-3 text-center text-emerald-400 text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{t('adminNoMissing')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                      <span className="text-xs text-white/60">
                        Leitud {missingTemplates.length} ametlikku kooditempliiti, mida pole veel andmebaasi salvestatud.
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-gold text-xs !py-1.5 !px-3 flex items-center gap-1.5"
                          disabled={!!busy || missingTemplates.length === 0}
                          onClick={seedAllMissing}
                        >
                          <Upload size={13} />
                          <span>{t('adminSeedAll')} ({missingTemplates.length})</span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline text-xs !py-1.5 !px-3"
                          disabled={!!busy}
                          onClick={() => {
                            clearHiddenTemplates()
                            setMsg(`✓ ${t('adminRestoreHidden')}`)
                            setShowTemplates(true)
                          }}
                        >
                          {t('adminRestoreHidden')}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {missingTemplates.map((tpl) => (
                        <div
                          key={tpl.game_type + tpl.name}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-gold/90 font-medium text-xs truncate">{tpl.name}</div>
                            <div className="text-white/40 text-[11px] flex items-center gap-1 mt-0.5">
                              <span>{GAME_META[tpl.game_type as GameType]?.emoji}</span>
                              <span>{t(('game_' + tpl.game_type) as TranslationKey)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 shrink-0 hover:border-gold hover:text-gold"
                            disabled={!!busy}
                            onClick={() => seedTemplate(tpl)}
                          >
                            <Upload size={11} />
                            <span>Lisa</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GAME SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <AdminGameSettings />
        </div>
      )}

      {/* TAB 3: AI & GEMINI SETTINGS */}
      {activeTab === 'ai' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <AdminAiSettingsCard />
        </div>
      )}

      {/* TAB 3: SOUND EFFECTS */}
      {activeTab === 'sounds' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <AdminSounds />
        </div>
      )}

      {/* TAB 4: SYSTEM & DIAGNOSTICS */}
      {activeTab === 'system' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="card-panel p-5 space-y-4">
            <h2 className="font-display text-gold text-lg font-bold flex items-center gap-2">
              <Sliders size={20} />
              <span>Süsteemi andmed ja diagnostika</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1">
                <span className="text-white/50 block font-semibold">PocketBase Endpoint</span>
                <code className="text-gold font-mono break-all">{pb.baseUrl}</code>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1">
                <span className="text-white/50 block font-semibold">Autenditud Superuser</span>
                <span className="text-emerald-400 font-mono">
                  {(pb.authStore.record as any)?.email || 'Aktiivne sessioon'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <h3 className="text-xs font-semibold text-white/75 uppercase tracking-wider">
                Andmete jaotus mängude kaupa:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GAME_TYPES.map((g) => (
                  <div
                    key={g}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-1 text-white/80 truncate">
                      <span>{GAME_META[g]?.emoji}</span>
                      <span className="truncate">{t(('game_' + g) as TranslationKey)}</span>
                    </span>
                    <span className="font-mono font-bold text-gold shrink-0 ml-2">
                      {counts[g] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
              <span>Peidetud templiitide mälu tühjendamine:</span>
              <button
                type="button"
                onClick={() => {
                  clearHiddenTemplates()
                  setMsg('✓ Peidetud kooditempliitide vahemälu tühjendatud!')
                }}
                className="btn-outline text-xs !py-1.5 !px-3"
              >
                Tühjenda vahemälu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
