import type { ActionKind, DealCard, PlayerBoard, PropColor } from './types'
import { COLOR_STYLE, SET_SIZE, rentForSet, RENT_BY_COUNT, HOUSE_RENT_BONUS, HOTEL_RENT_BONUS } from './types'
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
  CheckCircle2,
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
  { label: string; hint: string; Icon: typeof Sparkles; gradient: string; border: string; glow: string; badgeColor: string }
> = {
  pass_go: {
    label: 'Mine edasi',
    hint: 'Võta +2 kaarti pakist',
    Icon: ScrollText,
    gradient: 'from-sky-500 via-sky-700 to-slate-950',
    border: 'border-sky-400/80',
    glow: 'shadow-sky-500/25',
    badgeColor: 'bg-sky-400/20 text-sky-200 border-sky-300/40',
  },
  rent: {
    label: 'Nõua üüri',
    hint: 'Tänavate + maja/hotelli järgi',
    Icon: KeyRound,
    gradient: 'from-amber-500 via-orange-600 to-stone-950',
    border: 'border-amber-300/80',
    glow: 'shadow-amber-500/30',
    badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-300/40',
  },
  debt: {
    label: 'Võlanõue',
    hint: 'Vastane maksab sulle 5M',
    Icon: Coins,
    gradient: 'from-yellow-500 via-amber-700 to-stone-950',
    border: 'border-yellow-300/80',
    glow: 'shadow-yellow-500/25',
    badgeColor: 'bg-yellow-400/20 text-yellow-200 border-yellow-300/40',
  },
  birthday: {
    label: 'Sünnipäev!',
    hint: 'Kõik teised annavad 2M',
    Icon: Gift,
    gradient: 'from-fuchsia-500 via-pink-700 to-purple-950',
    border: 'border-pink-300/80',
    glow: 'shadow-pink-500/30',
    badgeColor: 'bg-pink-400/20 text-pink-200 border-pink-300/40',
  },
  sly_deal: {
    label: 'Salakaup',
    hint: 'Varasta 1 vaba kinnistu',
    Icon: Unlink,
    gradient: 'from-slate-500 via-cyan-900 to-black',
    border: 'border-cyan-400/80',
    glow: 'shadow-cyan-500/30',
    badgeColor: 'bg-cyan-400/20 text-cyan-200 border-cyan-300/40',
  },
  forced_deal: {
    label: 'Sunnitud tehing',
    hint: 'Vaheta 1 oma kinnistu vastasega',
    Icon: ArrowLeftRight,
    gradient: 'from-indigo-500 via-indigo-800 to-slate-950',
    border: 'border-indigo-300/80',
    glow: 'shadow-indigo-500/25',
    badgeColor: 'bg-indigo-400/20 text-indigo-200 border-indigo-300/40',
  },
  deal_breaker: {
    label: 'Tehingumurdja',
    hint: 'Varasta TERVE vastase komplekt!',
    Icon: Sparkles,
    gradient: 'from-violet-500 via-purple-700 to-black',
    border: 'border-violet-300/90 ring-1 ring-violet-400/50',
    glow: 'shadow-violet-500/40',
    badgeColor: 'bg-violet-400/30 text-violet-100 border-violet-300/50',
  },
  just_say_no: {
    label: 'Ei, aitäh!',
    hint: 'Tühista vastase rünnak või nõue',
    Icon: Ban,
    gradient: 'from-rose-500 via-red-800 to-stone-950',
    border: 'border-rose-300/90 ring-1 ring-rose-400/50',
    glow: 'shadow-rose-500/40',
    badgeColor: 'bg-rose-400/30 text-rose-100 border-rose-300/50',
  },
  house: {
    label: 'Maja',
    hint: 'Täiskomplektile · +3M üür',
    Icon: Home,
    gradient: 'from-emerald-500 via-green-700 to-emerald-950',
    border: 'border-emerald-300/80',
    glow: 'shadow-emerald-500/25',
    badgeColor: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40',
  },
  hotel: {
    label: 'Hotell',
    hint: 'Ainult majaga komplektile · +4M üür',
    Icon: Hotel,
    gradient: 'from-teal-400 via-cyan-700 to-slate-950',
    border: 'border-teal-300/80',
    glow: 'shadow-teal-500/25',
    badgeColor: 'bg-teal-400/20 text-teal-200 border-teal-300/40',
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
    ? 'w-[7.5rem] h-[10.5rem] text-[0.82rem] sm:w-[8.25rem] sm:h-[11.5rem] sm:text-[0.88rem]'
    : small
      ? 'w-[5.25rem] h-[7.25rem] text-[0.64rem]'
      : 'w-[6.75rem] h-[9.25rem] text-[0.76rem]'

  const base =
    `group relative overflow-hidden rounded-2xl border-2 select-none transition-all duration-200 shrink-0 ${size} ` +
    (onClick && !disabled
      ? ' cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 active:translate-y-0'
      : '') +
    (disabled ? ' opacity-40 pointer-events-none grayscale-[40%]' : '') +
    (selected
      ? ' ring-4 ring-gold border-gold scale-105 shadow-[0_0_25px_rgba(223,179,66,0.6)] z-10'
      : ' shadow-lg')

  // 1. MONEY CARD
  if (card.kind === 'money') {
    return (
      <button
        type="button"
        disabled={disabled || !onClick}
        onClick={onClick}
        className={`${base} border-emerald-300/80 bg-gradient-to-br from-emerald-500 via-emerald-700 to-emerald-950 text-white`}
      >
        {/* Holographic gloss sweep */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none" />
        <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/15 blur-sm pointer-events-none" />
        <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-black/25 pointer-events-none" />

        {/* Guilloche border frame */}
        <div className="absolute inset-1 rounded-xl border border-emerald-300/30 pointer-events-none flex flex-col justify-between p-1.5">
          <div className="flex justify-between items-center text-[0.6rem] font-black text-emerald-200">
            <span>{card.value}M</span>
            <span>{card.value}M</span>
          </div>
          <div className="flex justify-between items-center text-[0.6rem] font-black text-emerald-200">
            <span>{card.value}M</span>
            <span>{card.value}M</span>
          </div>
        </div>

        {/* Card Center Medallion */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 z-[1]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-b from-emerald-200/40 to-emerald-900/60 flex items-center justify-center border-2 border-emerald-200/60 shadow-inner">
            <Coins size={large ? 24 : small ? 16 : 20} className="text-emerald-50 drop-shadow" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl leading-none text-emerald-50 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {card.value}
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.18em] text-emerald-100 font-black drop-shadow-sm">
            miljonit
          </span>
        </div>
      </button>
    )
  }

  // 2. PROPERTY CARD
  if (card.kind === 'property') {
    const st = COLOR_STYLE[card.color]
    const Icon = PROP_ICON[card.color]
    const rentTable = RENT_BY_COUNT[card.color] || []

    return (
      <button
        type="button"
        disabled={disabled || !onClick}
        onClick={onClick}
        className={`${base} border-white/30 text-white`}
        style={{
          background: `linear-gradient(165deg, ${st.bg} 0%, ${st.bg}dd 30%, #0d1522 75%, #05080f 100%)`,
        }}
      >
        {/* Holographic sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

        {/* Top colored lacquer ribbon */}
        <div
          className="absolute top-0 inset-x-0 h-5 flex items-center justify-between px-2 shadow-md z-[2]"
          style={{ background: st.bg, borderBottom: '1px solid rgba(255,255,255,0.3)' }}
        >
          <span className="text-[0.58rem] font-black uppercase tracking-wider text-white drop-shadow">
            {st.label}
          </span>
          <span className="text-[0.58rem] font-display font-black text-gold">
            {SET_SIZE[card.color]} tk
          </span>
        </div>

        {/* Card Body */}
        <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pt-6 pb-2 z-[1]">
          {/* Icon Badge */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/30 shadow-md mt-1"
            style={{ background: `linear-gradient(135deg, ${st.bg}88 0%, rgba(0,0,0,0.5) 100%)` }}
          >
            <Icon size={large ? 22 : small ? 16 : 18} className="text-white drop-shadow" />
          </div>

          {/* Street Name */}
          <span className="font-bold leading-tight text-center line-clamp-2 px-0.5 text-white text-[0.84em] sm:text-[0.96em] drop-shadow">
            {card.name}
          </span>

          {/* Value + Rent hint */}
          <div className="w-full flex items-center justify-between px-1 pt-1 border-t border-white/15 text-[0.62rem]">
            <span className="text-white/60">Üür: <strong className="text-emerald-300">{rentTable[1] || 1}M…</strong></span>
            <span className="font-display text-gold font-black text-sm">{card.value}M</span>
          </div>
        </div>
      </button>
    )
  }

  // 3. ACTION CARD
  const meta = ACTION_META[card.action]
  const Icon = meta.Icon

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`${base} bg-gradient-to-br ${meta.gradient} ${meta.border} text-white shadow-lg ${meta.glow}`}
    >
      {/* Light sheen & background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)] pointer-events-none" />
      <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10 blur-sm pointer-events-none" />

      {/* Action header tag */}
      <div className="absolute top-1.5 inset-x-2 flex justify-between items-center text-[0.55rem] font-bold text-white/70 uppercase tracking-widest z-[2]">
        <span>Tegevus</span>
        <span className="text-gold font-display font-black">{card.value}M</span>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 pt-4 z-[1]">
        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-md ${meta.badgeColor}`}>
          <Icon size={large ? 24 : small ? 16 : 20} className="drop-shadow" />
        </div>
        <span className="font-black leading-tight text-center line-clamp-2 px-0.5 text-[0.88em] sm:text-[0.98em] text-white drop-shadow">
          {meta.label}
        </span>
        <span className="text-[0.6rem] text-white/90 text-center leading-tight px-1 font-medium line-clamp-2">
          {meta.hint}
        </span>
      </div>
    </button>
  )
}

/** Full property set strip — readable street names + rent preview + celebration ribbon */
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
      className={`relative w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
        highlight
          ? 'ring-4 ring-gold border-gold shadow-[0_0_20px_rgba(223,179,66,0.5)] scale-[1.01]'
          : done
            ? 'border-gold/80 shadow-[0_0_16px_rgba(223,179,66,0.35)] bg-gradient-to-r from-amber-950/40 via-black/50 to-black/60'
            : 'border-white/15 bg-black/40 hover:border-white/30'
      } ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''}`}
      style={{
        background: `linear-gradient(90deg, ${st.bg}ee 0%, ${st.bg}55 35%, #080f1a 100%)`,
      }}
    >
      {/* Set complete golden shimmer bar */}
      {done && (
        <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-xl bg-gradient-to-r from-amber-500 to-gold text-black font-display font-black text-[0.65rem] uppercase tracking-wider flex items-center gap-1 shadow-md z-[2]">
          <CheckCircle2 size={11} className="text-black" />
          <span>Täiskomplekt!</span>
        </div>
      )}

      <div className="flex items-stretch min-h-[4rem]">
        {/* Color accent bar */}
        <div
          className="w-3 shrink-0 shadow-inner"
          style={{ background: st.bg }}
        />

        <div className="flex-1 px-3 py-2 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-white drop-shadow">
                {st.label}
              </span>
              {building === 'house' && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-600/80 border border-emerald-300/40 text-emerald-100 text-[0.65rem] font-black">
                  🏠 Maja (+{HOUSE_RENT_BONUS}M)
                </span>
              )}
              {building === 'hotel' && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-600/80 border border-rose-300/40 text-rose-100 text-[0.65rem] font-black">
                  🏨 Hotell (+{HOTEL_RENT_BONUS}M)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm font-black font-display ${done ? 'text-gold' : 'text-white/80'}`}>
                {cards.length}/{need}
              </span>
              {showRent && rent > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                  üür {rent}M
                </span>
              )}
            </div>
          </div>

          <div className="text-xs sm:text-sm font-semibold text-white/95 leading-snug mt-1 truncate">
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
    return <p className="text-white/35 text-xs italic py-1">Pole veel kinnistuid</p>
  }

  return (
    <div className="space-y-2">
      <ColorProgressGrid player={player} />
      {!compact && (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
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
      )}
    </div>
  )
}

/** Color progress chip — big enough to read at party distance */
export function PropPile({
  color,
  cards,
  building,
}: {
  color: PropColor
  cards: DealCard[]
  building?: 'house' | 'hotel'
}) {
  const need = SET_SIZE[color]
  const n = cards.length
  const done = n >= need
  const st = COLOR_STYLE[color]

  return (
    <div
      className={`relative rounded-xl border-2 px-2.5 py-1.5 min-w-[3.85rem] text-center shadow-md transition-all duration-200 ${
        done
          ? 'border-gold bg-gradient-to-b from-amber-900/60 to-black/80 shadow-[0_0_14px_rgba(223,179,66,0.4)] scale-105'
          : 'border-white/20 bg-black/40'
      }`}
      style={{
        background: done
          ? undefined
          : `linear-gradient(160deg, ${st.bg} 0%, ${st.bg}88 40%, #0a0f18 100%)`,
      }}
      title={`${st.label} ${n}/${need}`}
    >
      <div className="text-[0.6rem] font-black uppercase tracking-wider text-white/95 leading-none mb-1 drop-shadow">
        {st.label.slice(0, 4)}
      </div>

      <div className={`font-display font-black text-base leading-none ${done ? 'text-gold' : 'text-white'}`}>
        {n}/{need}
      </div>

      {building && (
        <div className="text-[0.7rem] mt-0.5 leading-none">
          {building === 'hotel' ? '🏨' : '🏠'}
        </div>
      )}
    </div>
  )
}

/** All colors at a glance */
export function ColorProgressGrid({ player }: { player: PlayerBoard }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(SET_SIZE) as PropColor[]).map((c) => (
        <PropPile
          key={c}
          color={c}
          cards={player.props[c] || []}
          building={player.buildings?.[c]}
        />
      ))}
    </div>
  )
}

export function BankStrip({ bank }: { bank: DealCard[] }) {
  if (!bank.length) {
    return <p className="text-white/35 text-xs italic">Pank tühi</p>
  }

  const sorted = [...bank].sort((a, b) => a.value - b.value)
  const total = bank.reduce((acc, c) => acc + c.value, 0)

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {sorted.map((c, i) => (
        <span
          key={`${c.id}-${i}`}
          className="inline-flex items-center justify-center min-w-[2.25rem] h-8 px-2 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-900 border border-emerald-300/40 text-emerald-50 font-display font-black text-sm shadow-md"
        >
          {c.value}M
        </span>
      ))}
      <span className="text-xs font-bold text-emerald-300 ml-1">
        = {total}M
      </span>
    </div>
  )
}

