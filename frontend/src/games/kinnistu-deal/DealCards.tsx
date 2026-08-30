import type { DealCard, PropColor } from './types'
import { COLOR_STYLE, SET_SIZE } from './types'
import { Coins, Landmark, Sparkles } from 'lucide-react'

export function CardFace({
  card,
  small,
  onClick,
  disabled,
  selected,
}: {
  card: DealCard
  small?: boolean
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
}) {
  const base =
    'relative rounded-xl border-2 shadow-lg select-none transition-transform shrink-0 ' +
    (small ? 'w-[4.4rem] h-[6rem] text-[0.6rem]' : 'w-[5.6rem] h-[7.6rem] text-[0.7rem]') +
    (onClick && !disabled ? ' cursor-pointer hover:scale-105 active:scale-95' : '') +
    (disabled ? ' opacity-40 pointer-events-none' : '') +
    (selected ? ' ring-2 ring-gold scale-105' : '')

  if (card.kind === 'money') {
    return (
      <button type="button" disabled={disabled || !onClick} onClick={onClick} className={`${base} border-emerald-400/60 bg-gradient-to-br from-emerald-700 to-emerald-950 text-emerald-50`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1">
          <Coins size={small ? 14 : 18} className="text-emerald-300" />
          <span className="font-display font-black text-base md:text-xl text-emerald-200">{card.value}M</span>
          <span className="uppercase tracking-wider opacity-70 text-[0.55rem]">Raha</span>
        </div>
      </button>
    )
  }
  if (card.kind === 'property') {
    const st = COLOR_STYLE[card.color]
    return (
      <button
        type="button"
        disabled={disabled || !onClick}
        onClick={onClick}
        className={`${base} border-white/25 text-white`}
        style={{ background: `linear-gradient(165deg, ${st.bg} 0%, #0a0a0a 78%)` }}
      >
        <div className="absolute top-0 inset-x-0 h-2.5 rounded-t-[0.55rem]" style={{ background: st.bg }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1 pt-2.5">
          <Landmark size={small ? 11 : 14} className="opacity-80" />
          <span className="font-bold leading-tight text-center line-clamp-2 px-0.5">{card.name}</span>
          <span className="text-[0.55rem] opacity-70">{st.label}</span>
          <span className="font-display text-gold font-black">{card.value}M</span>
        </div>
      </button>
    )
  }
  const accent =
    card.action === 'just_say_no'
      ? 'from-rose-700 to-rose-950 border-rose-400/50'
      : card.action === 'deal_breaker'
        ? 'from-violet-700 to-violet-950 border-violet-300/50'
        : 'from-amber-700 to-amber-950 border-amber-300/50'
  return (
    <button type="button" disabled={disabled || !onClick} onClick={onClick} className={`${base} bg-gradient-to-br ${accent} text-amber-50`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1">
        <Sparkles size={small ? 12 : 16} className="text-amber-200" />
        <span className="font-bold leading-tight text-center line-clamp-3 px-0.5">{card.name}</span>
        <span className="text-[0.5rem] uppercase tracking-wide opacity-70">Tegevus</span>
      </div>
    </button>
  )
}

export function PropPile({ color, cards }: { color: PropColor; cards: DealCard[] }) {
  const need = SET_SIZE[color]
  const done = cards.length >= need
  const st = COLOR_STYLE[color]
  return (
    <div
      className={`rounded-lg border px-1 py-1 min-w-[2.8rem] ${done ? 'border-gold shadow-[0_0_10px_rgba(223,179,66,0.4)]' : 'border-white/15'}`}
      style={{ background: `${st.bg}44` }}
      title={`${st.label} ${cards.length}/${need}`}
    >
      <div className="h-1.5 rounded-full mb-0.5" style={{ background: st.bg }} />
      <div className="text-[0.55rem] text-white font-bold text-center">
        {cards.length}/{need}
      </div>
    </div>
  )
}
