import { useEffect, useRef, useState } from 'react'
import { listSoundRows, uploadSound, deleteSound, type SoundRow } from '@/lib/gameSounds'
import { useI18n } from '@/i18n/I18nContext'
import { Upload, Trash2, Volume2, RefreshCw } from 'lucide-react'

export default function AdminSounds() {
  const { t } = useI18n()
  const [rows, setRows] = useState<SoundRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function reload() {
    setBusy('list')
    setErr('')
    try {
      setRows(await listSoundRows())
    } catch (e: any) {
      setErr(e?.message || 'Helide laadimine ebaõnnestus (kas game_sounds kollektsioon on olemas?)')
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function onFile(key: string, file?: File) {
    if (!file) return
    setBusy(key)
    setErr('')
    setMsg('')
    try {
      await uploadSound(key, file)
      setMsg(`✓ ${key}`)
      await reload()
    } catch (e: any) {
      setErr(
        (e?.message || 'Upload failed') +
          ' — Vajalik superuser + PB kollektsioon game_sounds (migratsioon 1730000007).'
      )
    } finally {
      setBusy(null)
    }
  }

  async function onDelete(key: string) {
    if (!confirm(t('soundsDeleteConfirm'))) return
    setBusy(key)
    try {
      await deleteSound(key)
      setMsg(`✓ ${t('deletePack')}: ${key}`)
      await reload()
    } catch (e: any) {
      setErr(e?.message || 'Delete failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Volume2 className="text-gold" size={22} />
          <h2 className="font-display text-gold text-lg">{t('soundsTitle')}</h2>
        </div>
        <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={reload}>
          <RefreshCw size={12} /> {t('adminRefresh')}
        </button>
      </div>
      <p className="text-white/45 text-xs mb-4">{t('soundsHint')}</p>
      {err && <p className="text-accent-red text-sm mb-2">{err}</p>}
      {msg && <p className="text-accent-green text-sm mb-2">{msg}</p>}
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="card-panel p-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
          >
            <div className="min-w-0">
              <div className="text-gold text-sm font-medium">{row.label}</div>
              <div className="text-white/35 text-[11px] font-mono">{row.key}</div>
              {row.hasCustom ? (
                <span className="text-[10px] text-emerald-300">custom</span>
              ) : row.fileUrl ? (
                <span className="text-[10px] text-white/35">default</span>
              ) : (
                <span className="text-[10px] text-amber-300/80">puudub</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {row.fileUrl && (
                <audio controls preload="none" className="h-8 max-w-[200px]" src={row.fileUrl}>
                  <track kind="captions" />
                </audio>
              )}
              <input
                ref={(el) => {
                  inputRefs.current[row.key] = el
                }}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.webm"
                className="hidden"
                onChange={(e) => onFile(row.key, e.target.files?.[0])}
              />
              <button
                type="button"
                className="btn-outline text-xs !py-1.5 !px-2 flex items-center gap-1"
                disabled={!!busy}
                onClick={() => inputRefs.current[row.key]?.click()}
              >
                <Upload size={12} /> {t('soundsUpload')}
              </button>
              {row.hasCustom && (
                <button
                  type="button"
                  className="btn-outline text-xs !py-1.5 !px-2 border-accent-red/40 text-accent-red flex items-center gap-1"
                  disabled={!!busy}
                  onClick={() => onDelete(row.key)}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
