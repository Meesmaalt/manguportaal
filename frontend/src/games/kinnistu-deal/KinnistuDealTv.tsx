import { useEffect, useMemo } from 'react'
import type { KinnistuDealState, PlayerBoard, PropColor } from './types'
import {
  SET_SIZE,
  COLOR_STYLE,
  completeSets,
  bankTotal,
  actionLabel,
  rentForSet,
} from './types'
import { ColorProgressGrid, PropertySetRow } from './DealCards'
import confetti from 'canvas-confetti'
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
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.55 }, spread: 90 })
      playFx('victory')
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
        title: `${players[pending.target]?.name} — kaitse?`,
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
    <div className="min-h-screen bg-[#03070f] text-white px-3 md:px-6 py-4 md:py-6 flex flex-col">
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
        className={`max-w-7xl mx-auto w-full rounded-3xl border-2 bg-gradient-to-br ${toneClass} px-5 py-6 md:px-10 md:py-8 mb-5 text-center shadow-2xl`}
      >
        {headline.tone === 'win' && <Trophy className="inline-block text-gold mb-2" size={48} />}
        {headline.tone === 'pay' && <Coins className="inline-block text-emerald-300 mb-2" size={40} />}
        {headline.tone === 'danger' && <Swords className="inline-block text-rose-300 mb-2" size={40} />}
        <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
          {headline.title}
        </h1>
        {headline.sub && (
          <p className="mt-2 text-base md:text-xl text-white/65 font-medium">{headline.sub}</p>
        )}
        {log[0] && phase !== 'lobby' && (
          <p className="mt-3 text-sm md:text-base text-gold/80 max-w-2xl mx-auto">{log[0]}</p>
        )}
      </div>

      {/* Player boards */}
      <div
        className={`max-w-7xl mx-auto w-full flex-1 grid gap-3 md:gap-4 ${
          players.length <= 2
            ? 'grid-cols-1 md:grid-cols-2'
            : players.length === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {players.map((p, i) => (
          <TvPlayerCard
            key={p.token || i}
            player={p}
            index={i}
            winSets={winSets}
            isTurn={phase === 'turn' && i === current}
            isLeader={i === leaderIdx && phase !== 'lobby'}
            isPaying={phase === 'pay' && i === payFrom}
            isDefending={phase === 'defend' && pending?.target === i}
            isAttacker={
              (phase === 'pick_target' || phase === 'defend' || phase === 'pay') &&
              pending?.from === i
            }
            isWinner={phase === 'over' && winner === i}
          />
        ))}
      </div>

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

function TvPlayerCard({
  player,
  index,
  winSets,
  isTurn,
  isLeader,
  isPaying,
  isDefending,
  isAttacker,
  isWinner,
}: {
  player: PlayerBoard
  index: number
  winSets: number
  isTurn: boolean
  isLeader: boolean
  isPaying: boolean
  isDefending: boolean
  isAttacker: boolean
  isWinner: boolean
}) {
  const sets = completeSets(player)
  const bank = bankTotal(player)
  const colors = (Object.keys(SET_SIZE) as PropColor[]).filter(
    (c) => (player.props[c] || []).length > 0
  )

  let ring = 'border-white/12 bg-black/40'
  if (isWinner) ring = 'border-gold bg-gold/15 shadow-[0_0_40px_rgba(223,179,66,0.35)]'
  else if (isPaying) ring = 'border-emerald-400/60 bg-emerald-950/40 shadow-[0_0_28px_rgba(16,185,129,0.25)]'
  else if (isDefending) ring = 'border-rose-400/60 bg-rose-950/40 shadow-[0_0_28px_rgba(244,63,94,0.25)]'
  else if (isTurn) ring = 'border-cyan-400/55 bg-cyan-950/30 shadow-[0_0_24px_rgba(34,211,238,0.2)]'
  else if (isAttacker) ring = 'border-amber-400/50 bg-amber-950/25'

  return (
    <div className={`rounded-2xl border-2 p-3 md:p-4 flex flex-col min-h-[12rem] ${ring}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-display font-black text-lg md:text-xl text-gold truncate flex items-center gap-1.5">
            {isTurn && <span className="text-cyan-300 text-sm">▶</span>}
            {isWinner && <Trophy size={18} className="text-gold shrink-0" />}
            {player.name}
          </div>
          <div className="text-xs text-white/40 mt-0.5">
            {isPaying && <span className="text-emerald-300 font-bold">MAKSE · </span>}
            {isDefending && <span className="text-rose-300 font-bold">KAITSE · </span>}
            {isLeader && !isWinner && <span className="text-gold/70">liider · </span>}
            {player.hand?.length ?? 0} kaarti käes
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-black text-2xl md:text-3xl text-gold leading-none">
            {sets}
            <span className="text-white/35 text-lg">/{winSets}</span>
          </div>
          <div className="text-emerald-300 font-bold text-sm mt-0.5">{bank}M</div>
        </div>
      </div>

      <div className="mb-2">
        <ColorProgressGrid player={player} />
      </div>

      {colors.length > 0 ? (
        <div className="space-y-1.5 flex-1 overflow-hidden">
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
      ) : (
        <p className="text-white/25 text-sm flex-1 flex items-center">Pole veel kinnistuid</p>
      )}
    </div>
  )
}
