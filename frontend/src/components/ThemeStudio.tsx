import { useRef, useState } from 'react'
import { useI18n } from '@/i18n/I18nContext'
import { THEMES, applyTheme, getStoredTheme, type ThemeId } from '@/lib/themes'
import { ImagePlus, Film, Trash2, Palette, ChevronDown, ChevronUp } from 'lucide-react'

export type BgMedia = {
  kind: 'image' | 'video'
  dataUrl: string
} | null

/** Keep session JSON small enough for PocketBase realtime (~1 MB practical). */
const MAX_BYTES = 1.2 * 1024 * 1024

async function fileToDataUrl(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    return compressImage(file)
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Video too large (max ~1.2 MB). Use a short clip so TV can sync.')
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
      const maxW = 1280
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
      let q = 0.68
      let data = canvas.toDataURL('image/jpeg', q)
      while (data.length > MAX_BYTES * 1.37 && q > 0.35) {
        q -= 0.08
        data = canvas.toDataURL('image/jpeg', q)
      }
      if (data.length > MAX_BYTES * 1.5) {
        reject(new Error('Image still too large after compress'))
        return
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
  bgMedia?: BgMedia
  onBgMedia?: (m: BgMedia) => void
  themeId?: ThemeId
  onThemeId?: (id: ThemeId) => void
  compact?: boolean
  defaultOpen?: boolean
}

export default function ThemeStudio({
  bgMedia,
  onBgMedia,
  themeId: controlledTheme,
  onThemeId,
  compact,
  defaultOpen = false,
}: Props) {
  const { t, lang } = useI18n()
  const [themeId, setThemeId] = useState<ThemeId>(controlledTheme || getStoredTheme())
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(defaultOpen)
  const imgRef = useRef<HTMLInputElement>(null)
  const vidRef = useRef<HTMLInputElement>(null)

  function pickTheme(id: ThemeId) {
    setThemeId(id)
    applyTheme(id)
    onThemeId?.(id)
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

  const activeId = controlledTheme || themeId
  const activeLabel =
    THEMES.find((th) => th.id === activeId)?.label[lang] ||
    THEMES.find((th) => th.id === activeId)?.label.et ||
    activeId

  return (
    <div className={`card-panel ${compact ? 'p-2' : 'p-4'} border-gold/25`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-gold font-display text-sm tracking-wide">
          <Palette size={16} />
          {t('themePreset')}
          {!open && (
            <span className="text-white/45 font-sans font-normal text-xs tracking-normal">
              · {activeLabel}
              {bgMedia ? ` · ${bgMedia.kind === 'image' ? t('themeBgImage') : t('themeBgVideo')}` : ''}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp size={16} className="text-gold/70 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gold/70 shrink-0" />
        )}
      </button>

      {open && (
        <div className="space-y-3 mt-3 pt-3 border-t border-gold/15">
          <div className="flex flex-wrap gap-2">
            {THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => pickTheme(th.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  activeId === th.id
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
      )}
    </div>
  )
}

/** Full-bleed custom background for host + TV (sits behind game UI). */
export function SessionBgLayer({ media, display }: { media?: BgMedia; display?: boolean }) {
  if (!media?.dataUrl) return null
  // Full-strength image; only light vignette so board text stays readable
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      {media.kind === 'image' ? (
        <img
          src={media.dataUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          src={media.dataUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: display
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.22) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </div>
  )
}
