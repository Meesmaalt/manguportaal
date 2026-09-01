import type { ReactNode } from 'react'

export function BlitzStage({
  children,
  final = false,
  className = '',
}: {
  children: ReactNode
  final?: boolean
  className?: string
}) {
  return (
    <div className={`blitz-stage ${final ? 'blitz-stage-final' : ''} ${className}`}>
      <div className="blitz-blob blitz-blob-a" />
      <div className="blitz-blob blitz-blob-b" />
      <div className="blitz-blob blitz-blob-c" />
      <div className="blitz-blob blitz-blob-d" />
      {/* floating geometric shapes */}
      <svg className="blitz-shape" style={{ top: '12%', left: '8%', width: 80 }} viewBox="0 0 40 40">
        <polygon points="20,2 38,36 2,36" fill="#f43f5e" />
      </svg>
      <svg className="blitz-shape" style={{ top: '60%', right: '10%', width: 70, animationDuration: '36s' }} viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="4" fill="#22c55e" />
      </svg>
      <svg className="blitz-shape" style={{ bottom: '15%', left: '20%', width: 60, animationDuration: '22s' }} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="#eab308" />
      </svg>
      <svg className="blitz-shape" style={{ top: '25%', right: '22%', width: 55, animationDuration: '40s' }} viewBox="0 0 40 40">
        <polygon points="20,2 38,20 20,38 2,20" fill="#3b82f6" />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function AnswerShape({ index, className = '' }: { index: number; className?: string }) {
  const c = 'blitz-shape-icon ' + className
  if (index === 0) {
    return (
      <svg className={c} viewBox="0 0 24 24" aria-hidden>
        <polygon points="12,3 22,20 2,20" fill="currentColor" />
      </svg>
    )
  }
  if (index === 1) {
    return (
      <svg className={c} viewBox="0 0 24 24" aria-hidden>
        <polygon points="12,2 22,12 12,22 2,12" fill="currentColor" />
      </svg>
    )
  }
  if (index === 2) {
    return (
      <svg className={c} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="9" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg className={c} viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" />
    </svg>
  )
}

/** Kahoot-like solid fills */
export const BLITZ_ANSWER_STYLE = [
  { bg: 'bg-[#e21b3c]', hover: 'hover:brightness-110', label: 'A' },
  { bg: 'bg-[#1368ce]', hover: 'hover:brightness-110', label: 'B' },
  { bg: 'bg-[#d89e00]', hover: 'hover:brightness-110', label: 'C' },
  { bg: 'bg-[#26890c]', hover: 'hover:brightness-110', label: 'D' },
] as const
