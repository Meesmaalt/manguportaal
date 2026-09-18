import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import { pb, type Pack } from '@/lib/pocketbase'
import { useI18n } from '@/i18n/I18nContext'
import { GAME_META, type GameType } from '@/lib/types'
import type { TranslationKey } from '@/i18n/translations'
import { Printer, ArrowLeft, Download } from 'lucide-react'

/** Host printout & Cheat Sheet – supports all 9 game types. Works offline once loaded. */
export default function PrintPack() {
  const [params] = useSearchParams()
  const name = params.get('name') || ''
  const id = params.get('id') || ''
  const gameTypeParam = params.get('gameType') as GameType | null
  const { t } = useI18n()
  const [pack, setPack] = useState<{
    name: string
    description?: string
    game_type: GameType
    data: any
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      // Prefer DB pack by id
      if (id && !id.startsWith('local-')) {
        try {
          const rec = await pb.collection('packs').getOne<Pack>(id)
          if (!cancelled) {
            setPack({
              name: rec.name,
              description: rec.description,
              game_type: rec.game_type as GameType,
              data: rec.data,
            })
            setLoading(false)
            return
          }
        } catch {
          /* fall through */
        }
      }
      const local = OFFICIAL_PACKS.find(
        (p) => p.name === name && (!gameTypeParam || p.game_type === gameTypeParam)
      )
      if (!cancelled) {
        setPack(
          local
            ? {
                name: local.name,
                description: local.description,
                game_type: local.game_type as GameType,
                data: local.data,
              }
            : null
        )
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, name, gameTypeParam])

  if (loading) {
    return <div className="p-8 text-center text-gold animate-pulse">Laadin väljatrüki andmeid...</div>
  }

  if (!pack) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <p className="text-accent-red mb-4">{t('packUnknown')}</p>
        <Link to="/dashboard" className="text-gold underline">
          ← {t('packBack')}
        </Link>
      </div>
    )
  }

  const data = pack.data || {}
  const gt = pack.game_type
  const meta = GAME_META[gt]

  return (
    <div className="print-pack bg-white text-black min-h-screen p-6 md:p-10 font-sans">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-pack { padding: 0 !important; max-width: 100% !important; }
          .page-break { page-break-before: always; }
        }
        .print-pack h1 { font-size: 1.6rem; font-weight: bold; margin-bottom: 0.25rem; color: #111; }
        .print-pack h2 { font-size: 1.15rem; font-weight: bold; margin: 1.25rem 0 0.5rem; border-bottom: 2px solid #222; padding-bottom: 0.25rem; color: #222; }
        .print-pack table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 1.25rem; }
        .print-pack th, .print-pack td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; vertical-align: top; text-align: left; }
        .print-pack th { background: #f0f0f0; font-weight: bold; }
        .note { color: #555; font-style: italic; font-size: 0.8rem; }
        .correct-answer { font-weight: bold; color: #0f5132; }
      `}</style>

      {/* Screen Toolbar */}
      <div className="no-print mb-8 p-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-white flex flex-wrap gap-4 items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-gold !py-2 px-5 flex items-center gap-2 font-bold shadow-md active:scale-95 transition"
          >
            <Printer size={16} /> {t('printPdf')}
          </button>
          <span className="text-white/60 text-xs hidden sm:inline">
            Saatejuhi spikker paberil või PDF-ina (Ctrl+P / Cmd+P)
          </span>
        </div>

        <Link
          to={`/play/${gt}`}
          className="text-xs text-white/70 hover:text-gold flex items-center gap-1 transition"
        >
          <ArrowLeft size={14} /> Tagasi mängu juurde
        </Link>
      </div>

      {/* Header Info */}
      <div className="border-b-2 border-black pb-3 mb-4 flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
            {meta?.emoji} {t(('game_' + gt) as TranslationKey)} · Saatejuhi spikker
          </div>
          <h1>{pack.name}</h1>
          {pack.description && <p className="text-neutral-600 text-sm mt-0.5">{pack.description}</p>}
        </div>
        <div className="text-right text-xs text-neutral-500 font-mono">
          <div>{new Date().toLocaleDateString()}</div>
          <div>ÕHTU MÄNGUD</div>
        </div>
      </div>

      {/* Kuldvillak Printout */}
      {gt === 'kuldvillak' && (
        <div>
          {(data.categories || []).map((cat: any, cIdx: number) => (
            <div key={cIdx} className="mb-4">
              <h2>{cat.name}</h2>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '4.5rem' }}>Punktid</th>
                    <th>Küsimus</th>
                    <th>Õige vastus</th>
                    <th style={{ width: '12rem' }}>Märkused saatejuhile</th>
                  </tr>
                </thead>
                <tbody>
                  {(cat.questions || []).map((q: any, qIdx: number) => (
                    <tr key={qIdx}>
                      <td>
                        <strong>{q.points}</strong>
                      </td>
                      <td>{q.q}</td>
                      <td className="correct-answer">{q.a}</td>
                      <td className="note">{q.hostNote || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {data.finalJeopardy && (
            <div className="page-break">
              <h2>Final Jeopardy (Finaal)</h2>
              <table>
                <tbody>
                  <tr>
                    <td style={{ width: '6rem', fontWeight: 'bold' }}>Küsimus</td>
                    <td>{data.finalJeopardy.q}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Vastus</td>
                    <td className="correct-answer">{data.finalJeopardy.a}</td>
                  </tr>
                  {data.finalJeopardy.hostNote && (
                    <tr>
                      <td>Märkus</td>
                      <td className="note">{data.finalJeopardy.hostNote}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rooside Sõda Printout */}
      {gt === 'roosidesoda' && (
        <div>
          {(data.rounds || []).map((rnd: any, rIdx: number) => (
            <div key={rIdx} className="mb-6">
              <h2>
                Voor {rIdx + 1}: {rnd.question}{' '}
                <span className="text-xs font-normal text-neutral-600">(Kordaja: x{rnd.multiplier || 1})</span>
              </h2>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '3rem' }}>Nr</th>
                    <th>100 eestlase vastus</th>
                    <th style={{ width: '6rem' }}>Punktid</th>
                  </tr>
                </thead>
                <tbody>
                  {(rnd.answers || []).map((a: any, aIdx: number) => (
                    <tr key={aIdx}>
                      <td>{aIdx + 1}.</td>
                      <td className="font-semibold">{a.text || '—'}</td>
                      <td>
                        <strong>{a.points}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Miljonär Printout */}
      {gt === 'miljonar' && (
        <div>
          <h2>15 tasemeküsimust & õiged vastused</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: '3.5rem' }}>Tase</th>
                <th>Küsimus ja valikud (Õige vastus rasvane)</th>
                <th style={{ width: '8rem' }}>Õige vastus</th>
              </tr>
            </thead>
            <tbody>
              {(data.questions || []).map((q: any, qIdx: number) => {
                const letters = ['A', 'B', 'C', 'D']
                return (
                  <tr key={qIdx}>
                    <td>
                      <strong>{qIdx + 1}</strong>
                    </td>
                    <td>
                      <div className="font-semibold mb-1">{q.q}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-neutral-700">
                        {(q.choices || []).map((c: string, cIdx: number) => (
                          <div
                            key={cIdx}
                            className={cIdx === q.correct ? 'font-bold text-black underline' : ''}
                          >
                            {letters[cIdx]}: {c}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="correct-answer">
                      {letters[q.correct]}: {q.choices?.[q.correct]}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sõnaseletus Printout */}
      {gt === 'sonaseletus' && (
        <div>
          <h2>Sõnade nimekiri (Alias kaardid)</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-sm">
            {(data.words || []).map((w: string, wIdx: number) => (
              <div key={wIdx} className="border border-neutral-300 p-2 rounded bg-neutral-50 text-center font-medium">
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ma ei ole kunagi & Viimane püsti */}
      {(gt === 'ma_ei_ole_kunagi' || gt === 'viimane_pusti') && (
        <div>
          <h2>Väited ({data.statements?.length || 0} tk)</h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm">
            {(data.statements || []).map((s: string, sIdx: number) => (
              <li key={sIdx} className="pl-1">
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tõde või tegu */}
      {gt === 'tode_voi_tegu' && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2>Tõed ({data.truths?.length || 0} tk)</h2>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm">
              {(data.truths || []).map((t: string, tIdx: number) => (
                <li key={tIdx} className="pl-1">
                  {t}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2>Teod ({data.dares?.length || 0} tk)</h2>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm">
              {(data.dares || []).map((d: string, dIdx: number) => (
                <li key={dIdx} className="pl-1">
                  {d}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Blitz Quiz */}
      {gt === 'blitz' && (
        <div>
          <h2>Kiirviktoriini küsimused</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: '3rem' }}>Nr</th>
                <th>Küsimus ja valikud</th>
                <th style={{ width: '8rem' }}>Tüüp / Vastus</th>
              </tr>
            </thead>
            <tbody>
              {(data.questions || []).map((q: any, qIdx: number) => (
                <tr key={qIdx}>
                  <td>
                    <strong>{qIdx + 1}</strong>
                  </td>
                  <td>
                    <div className="font-semibold">{q.text || q.q}</div>
                    {Array.isArray(q.options) && (
                      <div className="text-xs text-neutral-600 mt-1">
                        Valikud: {q.options.join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="correct-answer">
                    {q.type === 'slider' ? `Väärtus: ${q.correctValue}` : `Õige: ${q.correct ?? q.correctIndex}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kinnistu Deal */}
      {gt === 'kinnistu_deal' && (
        <div>
          <h2>Kinnistu Deal mängukaardid ja reeglid</h2>
          <p className="text-sm text-neutral-700 leading-relaxed">
            Mängupakis on 106 kaarti (Kinnistukaardid, Raha, Majad/Hotellid, Tehingupurustajad, Sunnitud vahetused jne).
            Võidab esimene mängija, kes kogub 3 täielikku erinevat värvikomplekti.
          </p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-neutral-300 text-xs text-neutral-500 flex justify-between">
        <span>Õhtu Mängud platvorm · Spikker saatejuhile</span>
        <span>Leht 1</span>
      </div>
    </div>
  )
}

