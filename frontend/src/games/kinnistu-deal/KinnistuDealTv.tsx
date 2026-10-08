import DealTurnStatus from './DealTurnStatus'
import DealArena from './DealArena'
import { useEffect, useMemo } from 'react'
import type { KinnistuDealState } from './types'
import {
  COLOR_STYLE, completeSets, bankTotal,
  actionLabel,
} from './types'
import DealActionTheater from './DealActionTheater'
import { confettiBurst } from '@/lib/confettiBurst'
import { playFx } from '@/lib/audio'
import { Landmark, Trophy, Coins, Swords } from 'lucide-react'

/**
 * Full-screen TV / living-room spectator view.
 * No hands, no controls — only drama: who leads, who pays, what just happened.
 */
export default function KinnistuDealTv({
  state,
  sessionCode,
}: {
  state: KinnistuDealState
  sessionCode?: string
}) {
  const { players, phase, current, log, winner, playsLeft, pending, payFrom, payAmount } = state
  const winSets = state.packData?.winSets ?? 3
  const code = sessionCode || state.code || ''

  const leaderIdx = useMemo(() => {
    let best = 0
    let bestScore = -1
    players.forEach((p, i) => {
      const s = completeSets(p) * 100 + bankTotal(p)
      if (s > bestScore) {
        bestScore = s
        best = i
      }
    })
    return best
  }, [players])

  useEffect(() => {
    if (phase === 'over' && state.confettiAt) {
      confettiBurst({ particleCount: 160, spread: 90, y: 0.55 })
      playFx('victory', { prefer: 'deal_win' })
    }
  }, [phase, state.confettiAt])

  useEffect(() => {
    if (phase === 'pay') playFx('tick')
    if (phase === 'defend') playFx('wrong')
  }, [phase, payFrom])

  const headline = useMemo(() => {
    if (phase === 'lobby') return { title: 'Ootame mängijaid…', sub: 'Skanni oma QR telefonis', tone: 'muted' as const }
    if (phase === 'over' && winner != null)
      return { title: `${players[winner]?.name} võitis!`, sub: `${completeSets(players[winner])} komplekti`, tone: 'win' as const }
    if (phase === 'pay' && payFrom != null)
      return {
        title: `${players[payFrom]?.name} maksab ${payAmount}M`,
        sub: pending?.from != null ? `→ ${players[pending.from]?.name}` : '',
        tone: 'pay' as const,
      }
    if (phase === 'defend' && pending?.target != null)
      return {
        title: `${players[pending.responseIndex ?? pending.target]?.name} vastab`,
        sub: `${players[pending.from]?.name}: ${actionLabel(pending.action)}`,
        tone: 'danger' as const,
      }
    if (phase === 'pick_target' && pending)
      return {
        title: `${players[pending.from]?.name}`,
        sub: `${actionLabel(pending.action)}${pending.color ? ` · ${COLOR_STYLE[pending.color].label}` : ''} — valib vastast`,
        tone: 'action' as const,
      }
    if (phase === 'pick_rent_color' && pending)
      return {
        title: `${players[pending.from]?.name}`,
        sub: pending.action === 'rent' ? 'Valib üüri värvi' : `Valib komplekti (${actionLabel(pending.action)})`,
        tone: 'action' as const,
      }
    if (phase === 'pick_property' && pending)
      return {
        title: `${players[pending.from]?.name}`,
        sub: 'Valib kinnistut',
        tone: 'action' as const,
      }
    if (phase === 'turn')
      return {
        title: `Käik: ${players[current]?.name}`,
        sub: `Veel ${playsLeft} kaarti · pakk ${state.deck?.length ?? 0}`,
        tone: 'turn' as const,
      }
    return { title: 'Kinnistu Deal', sub: '', tone: 'muted' as const }
  }, [phase, players, current, playsLeft, pending, payFrom, payAmount, winner, state.deck, winSets])

  const toneClass =
    headline.tone === 'win'
      ? 'from-gold/30 via-amber-900/20 to-transparent border-gold'
      : headline.tone === 'pay'
        ? 'from-emerald-600/25 via-emerald-950/30 to-transparent border-emerald-400/50'
        : headline.tone === 'danger'
          ? 'from-rose-600/30 via-rose-950/40 to-transparent border-rose-400/50'
          : headline.tone === 'action'
            ? 'from-amber-500/25 via-orange-950/30 to-transparent border-amber-400/50'
            : headline.tone === 'turn'
              ? 'from-cyan-500/20 via-slate-950/40 to-transparent border-cyan-400/40'
              : 'from-white/5 to-transparent border-white/15'

  return (
    <div className="min-h-screen deal-table-surface text-white px-3 md:px-6 py-4 md:py-6 flex flex-col">
      <DealActionTheater event={state.lastEvent} />
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-gold font-display font-black text-xl md:text-2xl">
          <Landmark className="text-gold" />
          Kinnistu Deal
        </div>
        <div className="flex items-center gap-3 text-xs md:text-sm text-white/40">
          <span>
            Võiduks <strong className="text-gold">{winSets}</strong> komplekti
          </span>
          {code && (
            <span className="border border-white/20 rounded-full px-3 py-1 tracking-widest text-white/60">
              {code}
            </span>
          )}
        </div>
      </div>

      {/* Hero moment */}
      <div
        className={`max-w-7xl mx-auto w-full rounded-3xl border-2 bg-gradient-to-br ${toneClass} px-5 py-3 md:px-8 md:py-4 mb-4 text-center shadow-2xl`}
      >
        {headline.tone === 'win' && <Trophy className="inline-block text-gold mb-2" size={48} />}
        {headline.tone === 'pay' && <Coins className="inline-block text-emerald-300 mb-2" size={40} />}
        {headline.tone === 'danger' && <Swords className="inline-block text-rose-300 mb-2" size={40} />}
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight">
          {headline.title}
        </h1>
        {headline.sub && (
          <p className="mt-2 text-base md:text-xl text-white/65 font-medium">{headline.sub}</p>
        )}
        {log[0] && phase !== 'lobby' && (
          <p className="mt-3 text-sm md:text-base text-gold/80 max-w-2xl mx-auto">{log[0]}</p>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto w-full"><DealTurnStatus state={state}/><DealArena state={state}/></div>

      {/* Footer log ticker */}
      {phase !== 'lobby' && log.length > 1 && (
        <div className="max-w-7xl mx-auto w-full mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs md:text-sm text-white/35">
          {log.slice(1, 5).map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      )}

      {phase === 'lobby' && (
        <p className="text-center text-white/40 text-sm md:text-base mt-8">
          Mängijad on telefonis · teler näitab lauda
        </p>
      )}
    </div>
  )
}
