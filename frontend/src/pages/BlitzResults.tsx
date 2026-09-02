import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { pb, type GameSession } from '@/lib/pocketbase'
import type { BlitzState } from '@/games/blitz/types'
import { sortedPlayers } from '@/games/blitz/types'
import { BlitzStage } from '@/games/blitz/BlitzStage'
import { appUrl } from '@/lib/config'
import { Trophy, Copy, Check, Share2 } from 'lucide-react'
import { playFx } from '@/lib/audio'

export default function BlitzResults() {
  const { code: codeParam } = useParams<{ code: string }>()
  const code = (codeParam || '').toUpperCase()
  const [state, setState] = useState<BlitzState | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) {
      setError('Puudub kood')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await pb.collection('game_sessions').getList<GameSession>(1, 1, {
          filter: `code = "${code}"`,
        })
        if (list.items.length) {
          if (!cancelled) setState(list.items[0].state as BlitzState)
        } else {
          // local fallback
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key?.startsWith('session_')) continue
            try {
              const data = JSON.parse(localStorage.getItem(key)!) as BlitzState
              if (data.code?.toUpperCase() === code) {
                if (!cancelled) setState(data)
                break
              }
            } catch {}
          }
          if (!cancelled && !list.items.length) {
            // check if we found local - state might still be null
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Ei õnnestunud laadida')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code])

  const rows =
    state?.resultsSnapshot?.rows ||
    (state ? sortedPlayers(state.players || []).map((p) => ({
      name: p.name,
      score: p.score,
      avatar: p.avatar,
      team: p.team,
    })) : [])

  const shareUrl = appUrl(`/blitz/${code}/tulemused`)

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      playFx('click')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Blitz tulemused · ${code}`,
          text: rows.slice(0, 3).map((r, i) => `${i + 1}. ${r.name} ${r.score}p`).join('\n'),
          url: shareUrl,
        })
      } else {
        copyLink()
      }
    } catch {
      copyLink()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0520] text-amber-300">
        Laadin tulemusi…
      </div>
    )
  }

  return (
    <BlitzStage>
      <div className="min-h-screen px-4 py-10">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <Trophy className="mx-auto text-amber-300 mb-2" size={48} />
            <h1 className="font-display text-3xl blitz-logo">Tulemused</h1>
            <p className="blitz-code-pill inline-block mt-3 text-sm tracking-[0.3em]">{code}</p>
          </div>

          {error && <p className="text-rose-400 text-sm text-center mb-4">{error}</p>}

          {!rows.length ? (
            <p className="text-center text-white/50">
              Tulemusi ei leitud. Mäng võib olla alles pooleli või sessioon aegunud.
            </p>
          ) : (
            <div className="blitz-glass rounded-2xl p-4 space-y-2 mb-6">
              {rows.map((r, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center px-3 py-2.5 rounded-xl text-sm ${
                    i === 0
                      ? 'bg-amber-400/20 border border-amber-300/40'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="font-semibold text-white">
                    {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `}
                    {r.avatar ? r.avatar + ' ' : ''}
                    {r.name}
                  </span>
                  <span className="font-display font-black text-amber-200">{r.score}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center gap-3 mb-8">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`}
              alt="QR"
              className="rounded-xl border border-white/20 bg-white p-2"
              width={160}
              height={160}
            />
            <p className="text-xs text-white/40 text-center break-all max-w-xs">{shareUrl}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button type="button" className="btn-outline text-xs flex items-center gap-1" onClick={copyLink}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Kopeeritud' : 'Kopeeri link'}
              </button>
              <button type="button" className="btn-gold text-xs flex items-center gap-1" onClick={nativeShare}>
                <Share2 size={12} /> Jaga
              </button>
            </div>
          </div>

          <p className="text-center">
            <Link to={`/blitz/${code}`} className="text-amber-300/80 text-sm hover:text-amber-200">
              ← Tagasi mängija vaatesse
            </Link>
          </p>
        </div>
      </div>
    </BlitzStage>
  )
}
