import type { ActionKind, DealCard, PlayerBoard, PropColor } from './types'
import { COLOR_STYLE, SET_SIZE, rentForSet } from './types'
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
  Hotel,
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
    hint: 'Tänavate + maja järgi',
    Icon: KeyRound,
    gradient: 'from-amber-500 via-orange-700 to-stone-950',
    border: 'border-amber-300/60',
  },
  debt: {
    label: 'Võlanõue',
    hint: '5M',
    Icon: Coins,
    gradient: 'from-yellow-600 via-amber-800 to-stone-950',
    border: 'border-yellow-300/50',
  },
  birthday: {
    label: 'Sünnipäev!',
    hint: '2M kingitus',
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
    hint: 'Terve komplekt',
    Icon: Sparkles,
    gradient: 'from-violet-500 via-purple-800 to-black',
    border: 'border-violet-300/60',
  },
  just_say_no: {
    label: 'Ei, aitäh',
    hint: 'Tühista rünnak',
    Icon: Ban,
    gradient: 'from-rose-600 via-red-900 to-stone-950',
    border: 'border-rose-300/50',
  },
  house: {
    label: 'Maja',
    hint: 'Täiskomplektile +üür',
    Icon: Home,
    gradient: 'from-lime-600 via-green-800 to-emerald-950',
    border: 'border-lime-300/50',
  },
  hotel: {
    label: 'Hotell',
    hint: 'Veel suurem üür',
    Icon: Hotel,
    gradient: 'from-teal-500 via-cyan-800 to-slate-950',
    border: 'border-teal-300/50',
  },
}

export function CardFace({
  card,
  small,
  large,
  onClick,
  disabled,
  selected,
}: {
  card: DealCard
  small?: boolean
  /** player hand — bigger touch targets */
  large?: boolean
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
}) {
  const size = large
    ? 'w-[7.25rem] h-[10rem] text-[0.8rem] sm:w-[8rem] sm:h-[11rem] sm:text-[0.85rem]'
    : small
      ? 'w-[5rem] h-[7rem] text-[0.62rem]'
      : 'w-[6.5rem] h-[9rem] text-[0.75rem]'
  const base =
    `relative overflow-hidden rounded-2xl border-2 shadow-xl select-none transition-all shrink-0 ${size} ` +
    (onClick && !disabled ? ' cursor-pointer hover:scale-[1.05] hover:shadow-2xl active:scale-95' : '') +
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
        <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-white/10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
          <div className="w-11 h-11 rounded-full bg-emerald-300/25 flex items-center justify-center border border-emerald-200/30">
            <Coins size={large ? 24 : small ? 16 : 20} className="text-emerald-100" />
          </div>
          <span className="font-display font-black text-2xl sm:text-3xl leading-none text-emerald-50 drop-shadow">
            {card.value}
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.15em] text-emerald-100/80 font-bold">
            miljonit
          </span>
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
          className="absolute top-0 inset-x-0 h-4 flex items-center justify-center"
          style={{ background: st.bg, boxShadow: `0 4px 12px ${st.bg}66` }}
        >
          <span className="text-[0.55rem] font-black uppercase tracking-wider text-white/95">
            {st.label}
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 pt-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20"
            style={{ background: `${st.bg}55` }}
          >
            <Icon size={large ? 20 : 16} className="text-white" />
          </div>
          <span className="font-bold leading-tight text-center line-clamp-2 px-0.5 text-white text-[0.8em] sm:text-[0.95em]">
            {card.name}
          </span>
          <span className="font-display text-gold font-black text-base">{card.value}M</span>
        </div>
      </button>
    )
  }

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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 z-[1]">
        <div className="w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
          <Icon size={large ? 22 : 18} className="text-white" />
        </div>
        <span className="font-black leading-tight text-center line-clamp-2 px-0.5">{meta.label}</span>
        <span className="text-[0.55rem] text-white/80 text-center leading-tight px-1">{meta.hint}</span>
      </div>
    </button>
  )
}

/** Full property set strip — readable street names + rent preview */
export function PropertySetRow({
  color,
  cards,
  building,
  highlight,
  onClick,
  showRent,
  owner,
}: {
  color: PropColor
  cards: DealCard[]
  building?: 'house' | 'hotel'
  highlight?: boolean
  onClick?: () => void
  showRent?: boolean
  owner?: PlayerBoard
}) {
  if (!cards.length) return null
  const st = COLOR_STYLE[color]
  const need = SET_SIZE[color]
  const done = cards.length >= need
  const rent = owner ? rentForSet(owner, color) : 0
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-xl border overflow-hidden transition ${
        highlight ? 'ring-2 ring-gold border-gold' : done ? 'border-gold/50' : 'border-white/15'
      } ${onClick ? 'cursor-pointer hover:border-gold/60' : ''}`}
      style={{ background: `linear-gradient(90deg, ${st.bg}dd 0%, ${st.bg}44 35%, #0a1018 100%)` }}
    >
      <div className="flex items-stretch min-h-[3.25rem]">
        <div
          className="w-2.5 shrink-0"
          style={{ background: st.bg }}
        />
        <div className="flex-1 px-2.5 py-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wide text-white/90">
              {st.label}
              {building === 'house' && ' · 🏠'}
              {building === 'hotel' && ' · 🏨'}
            </span>
            <span className={`text-[10px] font-bold ${done ? 'text-gold' : 'text-white/50'}`}>
              {cards.length}/{need}
              {showRent && rent > 0 && <span className="text-emerald-300 ml-1.5">üür {rent}M</span>}
            </span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-white leading-snug mt-0.5">
            {cards
              .map((c) => (c.kind === 'property' ? c.name : ''))
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      </div>
    </Tag>
  )
}

export function PlayerTableBoard({
  player,
  compact,
}: {
  player: PlayerBoard
  compact?: boolean
}) {
  const colors = (Object.keys(SET_SIZE) as PropColor[]).filter(
    (c) => (player.props[c] || []).length > 0
  )
  if (!colors.length) {
    return <p className="text-white/30 text-xs">Pole veel kinnistuid</p>
  }
  return (
    <div className={`space-y-1.5 ${compact ? '' : 'max-h-64 overflow-y-auto pr-1'}`}>
      {colors.map((c) => (
        <PropertySetRow
          key={c}
          color={c}
          cards={player.props[c] || []}
          building={player.buildings?.[c]}
          showRent
          owner={player}
        />
      ))}
    </div>
  )
}

/** @deprecated small chips — prefer PropertySetRow */
export function PropPile({ color, cards }: { color: PropColor; cards: DealCard[] }) {
  const need = SET_SIZE[color]
  const done = cards.length >= need
  const st = COLOR_STYLE[color]
  return (
    <div
      className={`rounded-lg border px-1.5 py-1 min-w-[2.8rem] text-center ${
        done ? 'border-gold' : 'border-white/15'
      }`}
      style={{ background: `${st.bg}55` }}
    >
      <div className="text-[0.55rem] text-white font-black">
        {cards.length}/{need}
      </div>
    </div>
  )
}
