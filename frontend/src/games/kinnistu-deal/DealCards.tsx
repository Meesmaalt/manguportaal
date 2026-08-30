import type { ActionKind, DealCard, PropColor } from './types'
import { COLOR_STYLE, SET_SIZE } from './types'
import {
  Coins,
  Landmark,
  Sparkles,
  Train,
  Zap,
  Home,
  Building2,
  Trees,
  Waves,
  Mountain,
  KeyRound,
  Gift,
  Ban,
  ArrowLeftRight,
  Unlink,
  ScrollText,
} from 'lucide-react'

const PROP_ICON: Record<PropColor, typeof Home> = {
  brown: Trees,
  mint: Waves,
  pink: Building2,
  orange: Home,
  red: Landmark,
  yellow: Mountain,
  green: Trees,
  blue: Landmark,
  rail: Train,
  util: Zap,
}

const ACTION_META: Record<
  ActionKind,
  { label: string; hint: string; Icon: typeof Sparkles; gradient: string; border: string }
> = {
  pass_go: {
    label: 'Mine edasi',
    hint: '+2 kaarti',
    Icon: ScrollText,
    gradient: 'from-sky-600 via-sky-800 to-slate-950',
    border: 'border-sky-400/50',
  },
  rent: {
    label: 'Nõua üüri',
    hint: 'Vastane maksab 3M',
    Icon: KeyRound,
    gradient: 'from-amber-500 via-orange-700 to-stone-950',
    border: 'border-amber-300/60',
  },
  debt: {
    label: 'Võlanõue',
    hint: 'Vastane maksab 5M',
    Icon: Coins,
    gradient: 'from-yellow-600 via-amber-800 to-stone-950',
    border: 'border-yellow-300/50',
  },
  birthday: {
    label: 'Sünnipäev!',
    hint: 'Vastane kingib 2M',
    Icon: Gift,
    gradient: 'from-fuchsia-600 via-pink-800 to-purple-950',
    border: 'border-pink-300/50',
  },
  sly_deal: {
    label: 'Salakaup',
    hint: 'Varasta 1 kinnistu',
    Icon: Unlink,
    gradient: 'from-slate-600 via-slate-800 to-black',
    border: 'border-slate-300/40',
  },
  forced_deal: {
    label: 'Sunnitud tehing',
    hint: 'Vaheta kinnistuid',
    Icon: ArrowLeftRight,
    gradient: 'from-indigo-600 via-indigo-900 to-slate-950',
    border: 'border-indigo-300/50',
  },
  deal_breaker: {
    label: 'Tehingumurdja',
    hint: 'Võta terve komplekt',
    Icon: Sparkles,
    gradient: 'from-violet-500 via-purple-800 to-black',
    border: 'border-violet-300/60',
  },
  just_say_no: {
    label: 'Ei, aitäh',
    hint: 'Kaitse / väärtus',
    Icon: Ban,
    gradient: 'from-rose-600 via-red-900 to-stone-950',
    border: 'border-rose-300/50',
  },
}

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
  const size = small
    ? 'w-[4.6rem] h-[6.4rem] text-[0.58rem]'
    : 'w-[6.2rem] h-[8.6rem] text-[0.72rem]'
  const base =
    `relative overflow-hidden rounded-2xl border-2 shadow-xl select-none transition-all shrink-0 ${size} ` +
    (onClick && !disabled ? ' cursor-pointer hover:scale-[1.06] hover:shadow-2xl active:scale-95' : '') +
    (disabled ? ' opacity-40 pointer-events-none' : '') +
    (selected ? ' ring-2 ring-gold scale-105' : '')

  if (card.kind === 'money') {
    return (
      <button
        type="button"
        disabled={disabled || !onClick}
        onClick={onClick}
        className={`${base} border-emerald-400/70 bg-gradient-to-br from-emerald-400 via-emerald-700 to-emerald-950 text-white`}
      >
        <div className="absolute -right-3 -top-3 w-12 h-12 rounded-full bg-white/10" />
        <div className="absolute -left-2 bottom-4 w-8 h-8 rounded-full bg-emerald-300/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1.5">
          <div className="w-9 h-9 rounded-full bg-emerald-300/25 flex items-center justify-center border border-emerald-200/30">
            <Coins size={small ? 16 : 20} className="text-emerald-100" />
          </div>
          <span className="font-display font-black text-xl md:text-2xl leading-none text-emerald-50 drop-shadow">
            {card.value}
          </span>
          <span className="text-[0.55rem] uppercase tracking-[0.15em] text-emerald-100/80 font-bold">miljonit</span>
        </div>
      </button>
    )
  }

  if (card.kind === 'property') {
    const st = COLOR_STYLE[card.color]
    const Icon = PROP_ICON[card.color]
    return (
      <button
        type="button"
        disabled={disabled || !onClick}
        onClick={onClick}
        className={`${base} border-white/25 text-white`}
        style={{
          background: `linear-gradient(165deg, ${st.bg} 0%, ${st.bg}cc 28%, #0c1220 72%, #05080f 100%)`,
        }}
      >
        <div
          className="absolute top-0 inset-x-0 h-3.5 flex items-center justify-center"
          style={{ background: st.bg, boxShadow: `0 4px 12px ${st.bg}66` }}
        >
          <span className="text-[0.5rem] font-black uppercase tracking-wider text-white/95 drop-shadow-sm">
            {st.label}
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1.5 pt-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/20"
            style={{ background: `${st.bg}55` }}
          >
            <Icon size={small ? 14 : 16} className="text-white" />
          </div>
          <span className="font-bold leading-tight text-center line-clamp-2 px-0.5 text-white">
            {card.name}
          </span>
          <span className="font-display text-gold font-black text-sm">{card.value}M</span>
        </div>
        <div className="absolute bottom-1 inset-x-0 text-center text-[0.45rem] text-white/35 uppercase tracking-wide">
          kinnistu
        </div>
      </button>
    )
  }

  // action
  const meta = ACTION_META[card.action]
  const Icon = meta.Icon
  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`${base} bg-gradient-to-br ${meta.gradient} ${meta.border} text-white`}
    >
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1.5 relative z-[1]">
        <div className="w-9 h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
          <Icon size={small ? 15 : 18} className="text-white" />
        </div>
        <span className="font-black leading-tight text-center line-clamp-2 px-0.5">{meta.label}</span>
        <span className="text-[0.5rem] text-white/75 text-center leading-tight px-0.5">{meta.hint}</span>
      </div>
    </button>
  )
}

export function PropPile({ color, cards }: { color: PropColor; cards: DealCard[] }) {
  const need = SET_SIZE[color]
  const done = cards.length >= need
  const st = COLOR_STYLE[color]
  const Icon = PROP_ICON[color]
  return (
    <div
      className={`rounded-xl border px-1.5 py-1 min-w-[3rem] flex flex-col items-center gap-0.5 ${
        done ? 'border-gold shadow-[0_0_12px_rgba(223,179,66,0.45)] scale-105' : 'border-white/15'
      }`}
      style={{ background: `linear-gradient(180deg, ${st.bg}99, ${st.bg}33)` }}
      title={`${st.label}: ${cards.map((c) => (c.kind === 'property' ? c.name : '')).filter(Boolean).join(', ') || 'tühi'} (${cards.length}/${need})`}
    >
      <Icon size={12} className="text-white/90" />
      <div className="text-[0.55rem] text-white font-black">
        {cards.length}/{need}
      </div>
    </div>
  )
}
