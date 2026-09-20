/**
 * Utility functions for handling, compressing and displaying images in game packs.
 */

/**
 * Checks if a string is a base64 encoded data URI
 */
export function isBase64Image(url?: string): boolean {
  if (!url) return false
  return url.startsWith('data:image/')
}

/**
 * Returns human readable size of a base64 data URI (e.g. "45 KB", "1.2 MB")
 */
export function getBase64Size(base64Str: string): string {
  if (!base64Str || !base64Str.includes(',')) return '0 KB'
  const dataPart = base64Str.split(',')[1] || ''
  const bytes = Math.round((dataPart.length * 3) / 4)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Compresses an image file on the client using HTML5 Canvas.
 * Resizes large images (max 1000px width/height) and converts to optimized JPEG or WebP,
 * reducing 2-5MB photos down to ~30-70KB for fast saving and loading.
 */
export async function compressImageFile(file: File, maxDim = 1000, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('Valitud fail ei ole pilt'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Faili lugemine ebaõnnestus'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Pildi dekodeerimine ebaõnnestus'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate aspect ratio scaled dimensions
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          // Fallback to original data URL if canvas context unavailable
          resolve(String(e.target?.result || ''))
          return
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height)

        // Try JPEG with quality compression
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedDataUrl)
        } catch {
          resolve(String(e.target?.result || ''))
        }
      }
      img.src = String(e.target?.result || '')
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Replaces massive base64 image strings with clean placeholders for AI requests or compact JSON views,
 * returning the cleaned object and an extraction map to restore them later.
 */
export function extractAndStripImages(obj: any): { stripped: any; imageMap: Record<string, string> } {
  const imageMap: Record<string, string> = {}
  let counter = 0

  function cloneAndStrip(val: any): any {
    if (val === null || val === undefined) return val
    if (typeof val === 'string') {
      if (isBase64Image(val)) {
        const placeholder = `__IMG_ASSET_${counter++}__`
        imageMap[placeholder] = val
        return placeholder
      }
      return val
    }
    if (Array.isArray(val)) {
      return val.map(cloneAndStrip)
    }
    if (typeof val === 'object') {
      const res: Record<string, any> = {}
      for (const [k, v] of Object.entries(val)) {
        res[k] = cloneAndStrip(v)
      }
      return res
    }
    return val
  }

  const stripped = cloneAndStrip(obj)
  return { stripped, imageMap }
}

/**
 * Restores stripped image placeholders back into the object.
 */
export function restoreImages(obj: any, imageMap: Record<string, string>): any {
  function cloneAndRestore(val: any): any {
    if (val === null || val === undefined) return val
    if (typeof val === 'string') {
      if (val in imageMap) {
        return imageMap[val]
      }
      // Check if string contains placeholder
      for (const [placeholder, originalBase64] of Object.entries(imageMap)) {
        if (val.includes(placeholder)) {
          return val.replace(placeholder, originalBase64)
        }
      }
      return val
    }
    if (Array.isArray(val)) {
      return val.map(cloneAndRestore)
    }
    if (typeof val === 'object') {
      const res: Record<string, any> = {}
      for (const [k, v] of Object.entries(val)) {
        res[k] = cloneAndRestore(v)
      }
      return res
    }
    return val
  }

  return cloneAndRestore(obj)
}
