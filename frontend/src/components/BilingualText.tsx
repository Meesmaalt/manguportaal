import React from 'react'

export function splitBilingualText(text?: string, explicitTr?: string): { primary: string; secondary?: string } {
  if (!text && !explicitTr) return { primary: '' }
  if (explicitTr && explicitTr.trim()) {
    return {
      primary: (text || '').trim(),
      secondary: explicitTr.trim()
    }
  }

  const raw = (text || '').trim()
  if (!raw) return { primary: '' }

  // Check for common separators: " / ", " // ", or " | "
  if (raw.includes(' / ')) {
    const idx = raw.indexOf(' / ')
    return {
      primary: raw.slice(0, idx).trim(),
      secondary: raw.slice(idx + 3).trim()
    }
  }

  if (raw.includes(' // ')) {
    const idx = raw.indexOf(' // ')
    return {
      primary: raw.slice(0, idx).trim(),
      secondary: raw.slice(idx + 4).trim()
    }
  }

  return { primary: raw }
}

type BilingualTextProps = {
  text?: string
  translation?: string
  layout?: 'block' | 'board' | 'inline' | 'answer'
  className?: string
  primaryClassName?: string
  secondaryClassName?: string
  translationClassName?: string
  badgeText?: string
  as?: keyof HTMLElementTagNameMap
}

export default function BilingualText({
  text,
  translation,
  layout = 'block',
  className = '',
  primaryClassName = '',
  secondaryClassName = '',
  translationClassName = '',
  badgeText = 'TR',
}: BilingualTextProps) {
  const { primary, secondary } = splitBilingualText(text, translation)
  const effectiveSecondaryClass = translationClassName || secondaryClassName

  if (!secondary) {
    return <span className={className || primaryClassName}>{primary}</span>
  }

  if (layout === 'board') {
    return (
      <div className={`flex flex-col items-center justify-center text-center leading-tight ${className}`}>
        <span className={`font-bold ${primaryClassName}`}>{primary}</span>
        <span className={`text-[10px] md:text-xs text-white/60 font-normal tracking-normal mt-0.5 max-w-full truncate px-1 ${effectiveSecondaryClass}`}>
          {secondary}
        </span>
      </div>
    )
  }

  if (layout === 'answer') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className={`font-bold ${primaryClassName}`}>{primary}</div>
        <div className={`text-sm opacity-80 font-normal flex items-center justify-center gap-1.5 ${effectiveSecondaryClass}`}>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/20 border border-current/20">
            {badgeText}
          </span>
          <span>{secondary}</span>
        </div>
      </div>
    )
  }

  if (layout === 'inline') {
    return (
      <span className={className}>
        <span className={primaryClassName}>{primary}</span>
        <span className={`ml-2 text-xs opacity-75 font-normal italic ${effectiveSecondaryClass}`}>
          ({secondary})
        </span>
      </span>
    )
  }

  // Default 'block' layout for large question displays / TV screens
  return (
    <div className={`space-y-2.5 text-left ${className}`}>
      <div className={`leading-relaxed text-white font-semibold ${primaryClassName}`}>
        {primary}
      </div>
      <div className={`pt-2 border-t border-white/15 flex items-start gap-2 text-gold/90 font-normal ${effectiveSecondaryClass}`}>
        <span className="shrink-0 text-[10px] font-sans font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-gold/15 text-gold border border-gold/30 mt-0.5">
          {badgeText}
        </span>
        <div className="text-base md:text-lg leading-snug italic text-white/85">
          {secondary}
        </div>
      </div>
    </div>
  )
}
