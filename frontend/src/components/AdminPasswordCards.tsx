import { useState } from 'react'
import { pb, formatPbError } from '@/lib/pocketbase'

export const LEGACY_DEFAULT_PASSWORD = 'ohtu123456'

function pbBase() {
  return String(pb.baseUrl || '').replace(/\/$/, '')
}

/** Kas serveris puudub veel päris administraator? Vigade korral eeldame, et pole esmakordne seadistus. */
export async function fetchNeedsSetup(): Promise<boolean> {
  try {
    const res = await fetch(`${pbBase()}/api/admin-setup/status`)
    if (!res.ok) return false
    return Boolean((await res.json()).needsSetup)
  } catch {
    return false
  }
}

/** Esmakordne seadistus: esimene sisenemine määrab administraatori e-posti ja parooli. */
export function FirstSetupForm({ onDone }: { onDone: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (pw !== pw2) return setErr('Paroolid ei kattu')
    if (pw.length < 10) return setErr('Parool peab olema vähemalt 10 märki')
    setBusy(true)
    try {
      const res = await fetch(`${pbBase()}/api/admin-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pw }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Seadistamine ebaõnnestus')
      onDone(email.trim(), pw)
    } catch (e: any) {
      setErr(e?.message || 'Seadistamine ebaõnnestus')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-panel p-6 space-y-4">
      <h2 className="font-display text-gold text-lg font-bold">Esmakordne seadistus</h2>
      <p className="text-white/60 text-sm">Määra administraatori e-post ja parool. Seda näed ainult üks kord: pärast seda on sisselogimine tavaline.</p>
      <div>
        <label className="text-white/50 text-xs block mb-1">Email</label>
        <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </div>
      <div>
        <label className="text-white/50 text-xs block mb-1">Parool (vähemalt 10 märki)</label>
        <input className="input-field" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={10} required />
      </div>
      <div>
        <label className="text-white/50 text-xs block mb-1">Korda parooli</label>
        <input className="input-field" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" minLength={10} required />
      </div>
      {err && <p className="text-accent-red text-sm">{err}</p>}
      <button type="submit" className="btn-gold w-full" disabled={busy}>{busy ? '…' : 'Loo administraator'}</button>
    </form>
  )
}

/** Parooli vahetus sisseloginud superkasutajale. `warn` näitab, et kasutusel on vana vaikeparool. */
export function ChangePasswordCard({ warn }: { warn?: boolean }) {
  const [oldPw, setOldPw] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setMsg('')
    if (pw !== pw2) return setErr('Paroolid ei kattu')
    if (pw.length < 10) return setErr('Parool peab olema vähemalt 10 märki')
    const rec: any = pb.authStore.record || pb.authStore.model
    if (!rec?.id) return setErr('Logi uuesti sisse')
    setBusy(true)
    try {
      await pb.collection('_superusers').update(rec.id, { oldPassword: oldPw, password: pw, passwordConfirm: pw })
      await pb.collection('_superusers').authWithPassword(rec.email, pw)
      setOldPw(''); setPw(''); setPw2('')
      setMsg('✓ Parool vahetatud')
    } catch (e: any) {
      setErr(formatPbError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={`card-panel p-5 space-y-3 ${warn ? 'border-2 border-accent-red/70' : ''}`}>
      <h2 className="font-display text-gold text-lg font-bold">Muuda administraatori parooli</h2>
      {warn && <p className="text-accent-red text-sm font-medium">Kasutad vana vaikeparooli. Vaheta see kohe!</p>}
      <input className="input-field" type="password" placeholder="Praegune parool" value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" required />
      <input className="input-field" type="password" placeholder="Uus parool (vähemalt 10 märki)" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={10} required />
      <input className="input-field" type="password" placeholder="Korda uut parooli" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" minLength={10} required />
      {err && <p className="text-accent-red text-sm">{err}</p>}
      {msg && <p className="text-green-400 text-sm">{msg}</p>}
      <button type="submit" className="btn-gold" disabled={busy}>{busy ? '…' : 'Vaheta parool'}</button>
    </form>
  )
}
