import { useState } from 'react'
import type { KinnistuDealState } from './types'
import { SET_SIZE, completeSets, bankTotal, makeToken, type PropColor } from './types'
import { emptyPlayer, startGame, endTurn } from './logic'
import { CardFace, PropPile } from './DealCards'
import SessionCodeBadge from '@/components/SessionCodeBadge'
import GameToolbar from '@/components/GameToolbar'
import { useI18n } from '@/i18n/I18nContext'
import { appUrl } from '@/lib/config'
import { Landmark, Copy, Check, UserPlus, Play, SkipForward, Trophy, Tv, ExternalLink } from 'lucide-react'

type Props = {
  state: KinnistuDealState
  update: (p: Partial<KinnistuDealState> | ((s: KinnistuDealState) => KinnistuDealState)) => void
  isHost?: boolean
  sessionCode?: string
}

export default function KinnistuDealGame({ state, update, isHost = true, sessionCode }: Props) {
  const { t } = useI18n()
  const { players, phase, current, log, winner, deck, playsLeft } = state
  const winSets = state.packData?.winSets ?? 3
  const code = sessionCode || state.code || ''
  const [copied, setCopied] = useState<string | null>(null)

  function copyLink(token: string) {
    const url = appUrl(`/deal/${code}/${token}`)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  function addPlayer() {
    if (!isHost || phase !== 'lobby' || players.length >= 5) return
    update({
      players: [...players, emptyPlayer(`Mängija ${players.length + 1}`)],
    })
  }

  function removePlayer(i: number) {
    if (!isHost || phase !== 'lobby' || players.length <= 2) return
    update({ players: players.filter((_, idx) => idx !== i) })
  }

  function rename(i: number, name: string) {
    if (!isHost) return
    update({
      players: players.map((p, idx) => (idx === i ? { ...p, name } : p)),
    })
  }

  function doStart() {
    if (!isHost) return
    update((s) => startGame(s))
  }

  function doEndTurn() {
    if (!isHost || phase !== 'turn') return
    update((s) => endTurn(s))
  }

  function resetLobby() {
    if (!isHost) return
    update({
      phase: 'lobby',
      deck: [],
      discard: [],
      current: 0,
      playsLeft: 0,
      pending: null,
      winner: undefined,
      players: players.map((p) => ({
        ...p,
        token: p.token || makeToken(),
        hand: [],
        bank: [],
        props: {},
      })),
      log: [],
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 pb-10">
      {isHost && <SessionCodeBadge code={code} />}
      {isHost && (
        <GameToolbar
          onReset={resetLobby}
          extra={
            phase === 'lobby' ? (
              <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={addPlayer}>
                <UserPlus size={14} /> Lisa mängija
              </button>
            ) : phase === 'turn' ? (
              <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={doEndTurn}>
                <SkipForward size={14} /> Lõpeta käik (host)
              </button>
            ) : null
          }
        />
      )}

      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 text-gold font-display text-2xl md:text-3xl font-black">
          <Landmark /> Kinnistu Deal
        </div>
        <p className="text-white/45 text-sm mt-1">Kogu {winSets} täiskomplekti · igaüks oma telefonis</p>
        {phase === 'turn' && (
          <p className="text-accent-cyan text-sm mt-1">
            Käik: <strong>{players[current]?.name}</strong>
            {isHost && (
              <span className="text-white/40"> · jäänud {playsLeft} · pakk {deck.length}</span>
            )}
          </p>
        )}
      </div>

      {/* TV join */}
      {isHost && code && (
        <div className="card-panel border-gold/30 p-3 mb-4 flex flex-wrap items-center justify-between gap-2 max-w-xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Tv size={16} className="text-gold" />
            TV: {appUrl(`/ekraan/${code}`)}
          </div>
          <a href={appUrl(`/ekraan/${code}`)} target="_blank" rel="noreferrer" className="btn-outline text-xs flex items-center gap-1">
            <ExternalLink size={12} /> Ava
          </a>
        </div>
      )}

      {/* Players table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {players.map((p, i) => {
          const sets = completeSets(p)
          const active = phase !== 'lobby' && phase !== 'over' && i === current
          return (
            <div
              key={p.token || i}
              className={`rounded-2xl border p-3 md:p-4 ${
                active ? 'border-gold bg-gold/10 shadow-[0_0_20px_rgba(223,179,66,0.2)]' : 'border-white/10 bg-black/35'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-display text-gold text-lg truncate">
                  {active && <span className="text-accent-cyan mr-1">▶</span>}
                  {p.name}
                </div>
                <div className="text-xs text-white/50 flex gap-2 shrink-0">
                  <span className="text-emerald-300">{bankTotal(p)}M</span>
                  <span className="text-gold">
                    {sets}/{winSets}
                  </span>
                </div>
              </div>

              {isHost && phase === 'lobby' && (
                <div className="space-y-2 mb-2">
                  <input
                    className="input-field text-sm"
                    value={p.name}
                    onChange={(e) => rename(i, e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="btn-outline text-[10px] !py-1 !px-2 flex items-center gap-1"
                      onClick={() => copyLink(p.token)}
                    >
                      {copied === p.token ? <Check size={11} /> : <Copy size={11} />}
                      {copied === p.token ? 'Kopeeritud' : 'Privaatne link'}
                    </button>
                    {players.length > 2 && (
                      <button type="button" className="text-accent-red/70 text-[10px] px-2" onClick={() => removePlayer(i)}>
                        Eemalda
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 break-all">{appUrl(`/deal/${code}/${p.token}`)}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {(Object.keys(SET_SIZE) as PropColor[]).map((c) => (
                  <PropPile key={c} color={c} cards={p.props[c] || []} />
                ))}
              </div>

              {phase !== 'lobby' && (
                <p className="text-white/30 text-[10px] mt-2">
                  {isHost ? `${p.hand.length} kaarti käes · ${p.bank.length} pangas` : `${p.hand.length} kaarti käes`}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {phase === 'lobby' && isHost && (
        <div className="text-center space-y-3 mb-6">
          <p className="text-white/55 text-sm max-w-lg mx-auto">
            Lisa 2–5 mängijat, kopeeri igaühele <strong className="text-gold">privaatne link</strong>.
            Nemad näevad ainult oma kaarte. TV näitab lauda. Siis alusta.
          </p>
          <button
            type="button"
            className="btn-gold text-lg px-8 py-3 inline-flex items-center gap-2"
            onClick={doStart}
            disabled={players.length < 2}
          >
            <Play size={18} /> Alusta mängu
          </button>
        </div>
      )}

      {phase === 'lobby' && !isHost && (
        <p className="text-center text-white/50 text-sm">Host valmistab mängijaid…</p>
      )}

      {phase === 'over' && winner != null && (
        <div className="card-panel border-gold/50 p-8 text-center mb-6">
          <Trophy className="inline text-gold mb-2" size={40} />
          <h2 className="font-display text-3xl text-gold font-black">{players[winner]?.name}</h2>
          <p className="text-white/60 mt-1">Kogus {winSets} komplekti!</p>
          {isHost && (
            <button type="button" className="btn-gold mt-4" onClick={doStart}>
              Mängi uuesti
            </button>
          )}
        </div>
      )}

      {phase === 'turn' && !isHost && (
        <p className="text-center text-white/40 text-sm mb-4">
          Mängijad mängivad oma telefonides. See on avalik laud.
        </p>
      )}

      {isHost && phase === 'turn' && (
        <p className="text-center text-white/45 text-xs mb-4 max-w-md mx-auto">
          Mängijad mängivad ise oma linkidel. Host saab käigu lõpetada, kui keegi takerdub.
        </p>
      )}

      {/* Host peek at current hand (optional help) */}
      {isHost && phase === 'turn' && players[current] && (
        <div className="card-panel border-white/10 p-3 mb-4 opacity-80">
          <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">
            Host-vaade · {players[current].name} käsi (privaatne mängijale)
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {players[current].hand.map((c) => (
              <CardFace key={c.id} card={c} small />
            ))}
            {!players[current].hand.length && <span className="text-white/30 text-sm">tühi</span>}
          </div>
        </div>
      )}

      {log?.length > 0 && (
        <div className="text-center space-y-0.5 mt-4">
          {log.slice(0, 6).map((line, i) => (
            <p key={i} className={`text-xs ${i === 0 ? 'text-gold/90' : 'text-white/30'}`}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function initialKinnistuDealState(code: string): KinnistuDealState {
  return {
    players: [emptyPlayer('Mängija 1'), emptyPlayer('Mängija 2'), emptyPlayer('Mängija 3')],
    deck: [],
    discard: [],
    current: 0,
    playsLeft: 0,
    phase: 'lobby',
    log: [],
    code,
    packData: { winSets: 3, startHand: 5 },
  }
}
