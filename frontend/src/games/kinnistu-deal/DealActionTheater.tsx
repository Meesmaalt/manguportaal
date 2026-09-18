import { useEffect, useState } from 'react'
import type { DealEventAnimation } from './types'
import { CardFace } from './DealCards'
import { Sparkles, Zap, Shield, Gift, Coins, Landmark, Home, Hotel, ArrowLeftRight, Unlink } from 'lucide-react'
import { playFx } from '@/lib/audio'

export default function DealActionTheater({
  event,
  compact = false,
}: {
  event?: DealEventAnimation | null
  compact?: boolean
}) {
  const [activeEvent, setActiveEvent] = useState<DealEventAnimation | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!event || !event.id) return
    setActiveEvent(event)
    setVisible(true)

    // Trigger dynamic synthesized sound effect for the specific event type
    try {
      if (event.kind === 'deal_breaker') {
        playFx('deal_breaker')
      } else if (event.kind === 'just_say_no') {
        playFx('deal_shield')
      } else if (event.kind === 'sly_deal' || event.kind === 'forced_deal') {
        playFx('deal_steal')
      } else if (event.kind === 'house_built' || event.kind === 'hotel_built') {
        playFx('deal_build')
      } else if (event.kind === 'rent_charged' || event.kind === 'debt' || event.kind === 'pay_completed') {
        playFx('deal_cash')
      } else if (event.kind === 'money_bank') {
        playFx('deal_coins')
      } else if (event.kind === 'prop_placed') {
        playFx('deal_card')
      } else {
        playFx('deal_card')
      }
    } catch {}

    const timer = setTimeout(() => {
      setVisible(false)
    }, compact ? 3200 : 4200)

    return () => clearTimeout(timer)
  }, [event?.id, event?.timestamp, compact])

  if (!visible || !activeEvent) return null

  const { kind, actorName, targetName, card, amount, message, propName } = activeEvent

  // Icon & Theme styles based on event kind
  let theme = {
    border: 'border-gold/60',
    glow: 'shadow-[0_0_50px_rgba(223,179,66,0.45)]',
    bg: 'from-amber-900/90 via-[#0d1424]/95 to-black/95',
    accentText: 'text-gold',
    iconBg: 'bg-gold/20 text-gold border-gold/40',
    Icon: Sparkles,
    particles: ['✨', '⭐', '🌟', '✨'],
  }

  if (kind === 'deal_breaker') {
    theme = {
      border: 'border-violet-400/80',
      glow: 'shadow-[0_0_60px_rgba(168,85,247,0.55)]',
      bg: 'from-violet-950/95 via-[#110d24]/95 to-black/95',
      accentText: 'text-violet-300',
      iconBg: 'bg-violet-500/25 text-violet-300 border-violet-400/50',
      Icon: Zap,
      particles: ['⚡', '💥', '🌪️', '⚡'],
    }
  } else if (kind === 'sly_deal' || kind === 'forced_deal') {
    theme = {
      border: 'border-cyan-400/80',
      glow: 'shadow-[0_0_50px_rgba(34,211,238,0.45)]',
      bg: 'from-cyan-950/95 via-[#0a1828]/95 to-black/95',
      accentText: 'text-cyan-300',
      iconBg: 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50',
      Icon: kind === 'forced_deal' ? ArrowLeftRight : Unlink,
      particles: ['🔄', '💨', '✨', '⚡'],
    }
  } else if (kind === 'just_say_no') {
    theme = {
      border: 'border-rose-400/90',
      glow: 'shadow-[0_0_60px_rgba(244,63,94,0.55)]',
      bg: 'from-rose-950/95 via-[#1f0a12]/95 to-black/95',
      accentText: 'text-rose-300',
      iconBg: 'bg-rose-500/30 text-rose-300 border-rose-400/60',
      Icon: Shield,
      particles: ['🛡️', '⛔', '💥', '🛡️'],
    }
  } else if (kind === 'rent_charged' || kind === 'debt') {
    theme = {
      border: 'border-amber-400/80',
      glow: 'shadow-[0_0_55px_rgba(245,158,11,0.5)]',
      bg: 'from-amber-950/95 via-[#1f1508]/95 to-black/95',
      accentText: 'text-amber-300',
      iconBg: 'bg-amber-500/25 text-amber-300 border-amber-400/50',
      Icon: Coins,
      particles: ['🪙', '💰', '💵', '🪙'],
    }
  } else if (kind === 'birthday') {
    theme = {
      border: 'border-pink-400/80',
      glow: 'shadow-[0_0_55px_rgba(236,72,153,0.5)]',
      bg: 'from-fuchsia-950/95 via-[#200b20]/95 to-black/95',
      accentText: 'text-pink-300',
      iconBg: 'bg-pink-500/25 text-pink-300 border-pink-400/50',
      Icon: Gift,
      particles: ['🎂', '🎁', '🎉', '✨'],
    }
  } else if (kind === 'house_built' || kind === 'hotel_built') {
    theme = {
      border: 'border-emerald-400/80',
      glow: 'shadow-[0_0_50px_rgba(16,185,129,0.45)]',
      bg: 'from-emerald-950/95 via-[#081a14]/95 to-black/95',
      accentText: 'text-emerald-300',
      iconBg: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50',
      Icon: kind === 'hotel_built' ? Hotel : Home,
      particles: ['🏠', '🏨', '🔨', '✨'],
    }
  } else if (kind === 'money_bank') {
    theme = {
      border: 'border-emerald-400/70',
      glow: 'shadow-[0_0_45px_rgba(16,185,129,0.35)]',
      bg: 'from-emerald-950/90 via-[#071710]/95 to-black/95',
      accentText: 'text-emerald-300',
      iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      Icon: Coins,
      particles: ['💵', '🪙', '💰', '✨'],
    }
  } else if (kind === 'prop_placed') {
    theme = {
      border: 'border-sky-400/70',
      glow: 'shadow-[0_0_45px_rgba(56,189,248,0.35)]',
      bg: 'from-sky-950/90 via-[#0a1628]/95 to-black/95',
      accentText: 'text-sky-300',
      iconBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
      Icon: Landmark,
      particles: ['🏠', '🏙️', '🗺️', '✨'],
    }
  }

  const Icon = theme.Icon

  return (
    <div
      onClick={() => setVisible(false)}
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto cursor-pointer p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? 'opacity-100 animate-in fade-in' : 'opacity-0'
      }`}
    >
      {/* Floating particles in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {theme.particles.map((p, i) => (
          <span
            key={i}
            className="absolute text-2xl sm:text-3xl animate-bounce"
            style={{
              top: `${20 + (i * 20) % 60}%`,
              left: `${15 + (i * 25) % 70}%`,
              animationDelay: `${i * 0.25}s`,
              animationDuration: '1.8s',
            }}
          >
            {p}
          </span>
        ))}
      </div>

      <div
        className={`relative max-w-lg w-full rounded-3xl border-2 bg-gradient-to-br ${theme.bg} ${theme.border} ${theme.glow} p-5 sm:p-7 text-center shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300`}
        style={{ perspective: 1000 }}
      >
        {/* Glow halo behind card */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        {/* Action Header badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-4 shadow-md bg-black/40 backdrop-blur">
          <div className={`p-1 rounded-full border ${theme.iconBg}`}>
            <Icon size={16} />
          </div>
          <span className="font-display font-black text-sm uppercase tracking-wider text-white">
            {actorName}
          </span>
        </div>

        {/* Card spotlight if card is available */}
        {card && (
          <div className="flex justify-center mb-4 transform hover:scale-105 transition-transform duration-300 drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]">
            <CardFace card={card} large={!compact} />
          </div>
        )}

        {/* Main message */}
        <h2 className={`font-display font-black text-xl sm:text-2xl md:text-3xl leading-snug tracking-tight mb-2 ${theme.accentText}`}>
          {message}
        </h2>

        {/* Target or extra context */}
        {targetName && (
          <p className="text-sm sm:text-base text-white/85 font-medium flex items-center justify-center gap-1.5">
            <span>Sihtmärk:</span>
            <strong className="text-white bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
              {targetName}
            </strong>
          </p>
        )}

        {propName && (
          <p className="text-xs sm:text-sm text-white/70 mt-1">
            Kinnistu: <span className="text-white font-bold">{propName}</span>
          </p>
        )}

        {amount != null && amount > 0 && (
          <div className="mt-3 inline-block px-4 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-display font-black text-lg">
            {amount}M
          </div>
        )}

        <div className="mt-4 text-[10px] uppercase tracking-widest text-white/40">
          Puuduta jätkamiseks
        </div>
      </div>
    </div>
  )
}
