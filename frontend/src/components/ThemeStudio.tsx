import { useRef, useState } from 'react'
import { useI18n } from '@/i18n/I18nContext'
import { THEMES, applyTheme, getStoredTheme, type ThemeId } from '@/lib/themes'
import { ImagePlus, Film, Trash2, Palette } from 'lucide-react'

export type BgMedia = {
  kind: 'image' | 'video'
  dataUrl: string
} | null

const MAX_BYTES = 2.5 * 1024 * 1024 // keep session JSON reasonable

async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_BYTES * 1.5) {
    throw new Error('File too large (max ~2.5 MB)')
  }
  if (file.type.startsWith('image/')) {
    return compressImage(file)
  }
  // video: only if under limit
  if (file.size > MAX_BYTES) {
    throw new Error('Video too large (max ~2.5 MB). Use a short clip.')
  }
  return readAsDataUrl(file)
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Read failed'))
    r.readAsDataURL(file)
  })
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxW = 1600
      let w = img.width
      let h = img.height
      if (w > maxW) {
        h = Math.round((h * maxW) / w)
        w = maxW
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      let q = 0.72
      let data = canvas.toDataURL('image/jpeg', q)
      while (data.length > MAX_BYTES * 1.37 && q > 0.4) {
        q -= 0.08
        data = canvas.toDataURL('image/jpeg', q)
      }
      resolve(data)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

type Props = {
  /** Session media — synced to TV when set via update */
  bgMedia?: BgMedia
  onBgMedia?: (m: BgMedia) => void
  compact?: boolean
}

export default function ThemeStudio({ bgMedia, onBgMedia, compact }: Props) {
  const { t, lang } = useI18n()
  const [themeId, setThemeId] = useState<ThemeId>(getStoredTheme())
  const [err, setErr] = useState('')
  const imgRef = useRef<HTMLInputElement>(null)
  const vidRef = useRef<HTMLInputElement>(null)

  function pickTheme(id: ThemeId) {
    setThemeId(id)
    applyTheme(id)
  }

  async function onFile(file: File | undefined, kind: 'image' | 'video') {
    if (!file || !onBgMedia) return
    setErr('')
    try {
      const dataUrl = await fileToDataUrl(file)
      onBgMedia({ kind, dataUrl })
    } catch (e: any) {
      setErr(e?.message || 'Upload failed')
    }
  }

  return (
    <div className={`card-panel ${compact ? 'p-3' : 'p-4'} space-y-3 border-gold/25`}>
      <div className="flex items-center gap-2 text-gold font-display text-sm tracking-wide">
        <Palette size={16} />
        {t('themePreset')}
      </div>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((th) => (
          <button
            key={th.id}
            type="button"
            onClick={() => pickTheme(th.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              themeId === th.id
                ? 'bg-gold text-bg border-gold font-bold'
                : 'border-gold/40 text-gold/90 hover:border-gold'
            }`}
          >
            {th.label[lang] || th.label.et}
          </button>
        ))}
      </div>

      {onBgMedia && (
        <>
          <div className="text-gold/90 text-xs font-medium pt-1">{t('themeBg')}</div>
          <p className="text-white/40 text-[11px] leading-snug">{t('themeBgHint')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1"
              onClick={() => imgRef.current?.click()}
            >
              <ImagePlus size={14} /> {t('themeBgImage')}
            </button>
            <button
              type="button"
              className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1"
              onClick={() => vidRef.current?.click()}
            >
              <Film size={14} /> {t('themeBgVideo')}
            </button>
            {bgMedia && (
              <button
                type="button"
                className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1 border-accent-red/40 text-accent-red"
                onClick={() => onBgMedia(null)}
              >
                <Trash2 size={14} /> {t('themeBgClear')}
              </button>
            )}
          </div>
          <input
            ref={imgRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0], 'image')}
          />
          <input
            ref={vidRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0], 'video')}
          />
          {bgMedia && (
            <div className="rounded-lg overflow-hidden border border-gold/20 max-h-28">
              {bgMedia.kind === 'image' ? (
                <img src={bgMedia.dataUrl} alt="" className="w-full h-28 object-cover opacity-80" />
              ) : (
                <video src={bgMedia.dataUrl} className="w-full h-28 object-cover" muted playsInline />
              )}
            </div>
          )}
          {err && <p className="text-accent-red text-xs">{err}</p>}
        </>
      )}
    </div>
  )
}

/** Full-bleed custom background for host + TV */
export function SessionBgLayer({ media }: { media?: BgMedia }) {
  if (!media?.dataUrl) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {media.kind === 'image' ? (
        <img src={media.dataUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
      ) : (
        <video
          src={media.dataUrl}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
    </div>
  )
}
