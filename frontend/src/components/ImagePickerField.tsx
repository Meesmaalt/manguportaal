import { useState } from 'react'
import { Image as ImageIcon, Upload, Trash2, Globe, Check, AlertCircle, Loader2 } from 'lucide-react'
import { compressImageFile, isBase64Image, getBase64Size } from '@/lib/imageUtils'

type Props = {
  value?: string
  onChange: (url: string | undefined) => void
  placeholder?: string
  className?: string
}

export default function ImagePickerField({
  value,
  onChange,
  placeholder = 'Pildi veebiaadress (URL) või laadi fail',
  className = '',
}: Props) {
  const [mode, setMode] = useState<'url' | 'file'>('url')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const isBase64 = isBase64Image(value)
  const sizeLabel = isBase64 ? getBase64Size(value || '') : ''

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      // Compress and resize image to ~30-70KB
      const compressed = await compressImageFile(file, 900, 0.78)
      onChange(compressed)
    } catch (err: any) {
      setError(err?.message || 'Pildi töötlemine ebaõnnestus')
    } finally {
      setUploading(false)
      // Reset input value so same file can be re-uploaded if needed
      e.target.value = ''
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* If value is a base64 image, show compact badge instead of a 200,000 char input */}
        {isBase64 ? (
          <div className="flex items-center gap-2 flex-1 min-w-[200px] p-1.5 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
            <ImageIcon size={14} className="text-emerald-400 shrink-0" />
            <span className="font-semibold truncate">Pilt lisatud failist</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
              {sizeLabel}
            </span>

            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <label className="text-[11px] text-emerald-300 hover:text-white cursor-pointer underline px-1">
                {uploading ? 'Töötlen...' : 'Asenda'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-accent-red hover:text-red-300 p-1 rounded hover:bg-accent-red/10 transition"
                title="Eemalda pilt"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Web URL Input */
          <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder={placeholder}
              className="input-field text-xs flex-1 !py-1.5"
              value={value || ''}
              onChange={(e) => onChange(e.target.value.trim() || undefined)}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-accent-red hover:text-red-300 p-1.5 rounded hover:bg-accent-red/10 transition shrink-0"
                title="Eemalda pildi URL"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        {/* Upload Button */}
        {!isBase64 && (
          <label className="btn-outline text-[11px] !py-1.5 px-3 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 hover:border-gold">
            {uploading ? (
              <>
                <Loader2 size={12} className="animate-spin text-gold" />
                <span>Tihendan...</span>
              </>
            ) : (
              <>
                <Upload size={12} />
                <span>Laadi fail</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {error && <p className="text-accent-red text-[11px]">{error}</p>}

      {/* Mini Image Preview */}
      {value && (
        <div className="flex items-center gap-2 pt-0.5">
          <img
            src={value}
            alt="Eelvaade"
            className="h-14 max-w-[140px] rounded-lg border border-white/15 object-cover bg-black/40 shadow-sm"
          />
          <span className="text-[10px] text-white/40">
            {isBase64 ? `Optimeeritud suurus: ${sizeLabel}` : 'Veebipildi URL'}
          </span>
        </div>
      )}
    </div>
  )
}
