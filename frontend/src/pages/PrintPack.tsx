import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { OFFICIAL_PACKS } from '@/data/official-packs'
import type { KuldvillakPackData } from '@/lib/pocketbase'
import { useI18n } from '@/i18n/I18nContext'

/** Host printout – use browser Print → PDF. Works offline once loaded. */
export default function PrintPack() {
  const [params] = useSearchParams()
  const name = params.get('name') || ''
  const { t } = useI18n()

  const pack = useMemo(
    () => OFFICIAL_PACKS.find((p) => p.name === name && p.game_type === 'kuldvillak'),
    [name]
  )

  if (!pack) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <p className="text-red-600 mb-4">{t('packUnknown')}</p>
        <Link to="/dashboard" className="text-blue-700 underline">
          {t('packBack')}
        </Link>
      </div>
    )
  }

  const data = pack.data as KuldvillakPackData

  return (
    <div className="print-pack bg-white text-black min-h-screen p-6 md:p-10">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-pack { padding: 0 !important; }
        }
        .print-pack h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .print-pack h2 { font-size: 1.1rem; margin: 1rem 0 0.5rem; border-bottom: 2px solid #333; }
        .print-pack table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 1rem; }
        .print-pack th, .print-pack td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; vertical-align: top; }
        .print-pack th { background: #f3f3f3; }
        .note { color: #666; font-style: italic; font-size: 0.8rem; }
      `}</style>

      <div className="no-print mb-6 flex flex-wrap gap-3 items-center">
        <button type="button" onClick={() => window.print()} className="btn-gold">
          {t('printPdf')}
        </button>
        <Link to="/play/kuldvillak" className="btn-outline text-sm">
          ← {t('packBack')}
        </Link>
        <span className="text-white/50 text-sm">{t('printHint')}</span>
      </div>

      <h1>{pack.name}</h1>
      <p style={{ color: '#555', marginBottom: '1rem' }}>{pack.description}</p>

      {data.categories.map((cat) => (
        <div key={cat.name}>
          <h2>{cat.name}</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: '4rem' }}>Pts</th>
                <th>Küsimus</th>
                <th>Vastus</th>
                <th>Host</th>
              </tr>
            </thead>
            <tbody>
              {cat.questions.map((q, i) => (
                <tr key={i}>
                  <td>
                    <strong>{q.points}</strong>
                  </td>
                  <td>{q.q}</td>
                  <td>{q.a}</td>
                  <td className="note">{q.hostNote || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {data.finalJeopardy && (
        <div>
          <h2>Final Jeopardy</h2>
          <table>
            <tbody>
              <tr>
                <td>
                  <strong>Q</strong>
                </td>
                <td>{data.finalJeopardy.q}</td>
              </tr>
              <tr>
                <td>
                  <strong>A</strong>
                </td>
                <td>{data.finalJeopardy.a}</td>
              </tr>
              {data.finalJeopardy.hostNote && (
                <tr>
                  <td>Host</td>
                  <td className="note">{data.finalJeopardy.hostNote}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#888' }}>
        Õhtu Mängud · hostile · {new Date().toLocaleDateString()}
      </p>
    </div>
  )
}
