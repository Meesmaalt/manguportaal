import { Link } from 'react-router-dom'
import { APP_VERSION } from '@/lib/version'
import { useI18n } from '@/i18n/I18nContext'
import { ArrowLeft } from 'lucide-react'

const ENTRIES: { v: string; items: string[] }[] = [
  {
    v: '3.21',
    items: [
      'TV ühendus avaneb automaatselt, kui pole LIVE',
      'Tühi settide nimekiri: lingid galeriisse ja admini seedi',
      'Changelog lehel',
      'Blitz pildi suuruse hoiatus redaktoris',
    ],
  },
  {
    v: '3.20',
    items: [
      'Helide üleslaadimine adminis (game_sounds)',
      'Admin superuser ei hävita tavakasutaja sessiooni',
    ],
  },
  {
    v: '3.19',
    items: ['Blitz tiimikaptenid', 'Kinnistu Deal esimese käigu meeldetuletus'],
  },
  {
    v: '3.18',
    items: ['Settide galerii', 'Kinnistu Deal peo lobby'],
  },
]

export default function Changelog() {
  const { t } = useI18n()
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-sm mb-6">
        <ArrowLeft size={16} /> {t('packBack')}
      </Link>
      <h1 className="font-display text-2xl text-gold mb-1">{t('changelogTitle')}</h1>
      <p className="text-white/40 text-sm mb-8">v{APP_VERSION}</p>
      <div className="space-y-6">
        {ENTRIES.map((e) => (
          <div key={e.v} className="card-panel p-4">
            <div className="font-display text-gold text-lg mb-2">v{e.v}</div>
            <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
              {e.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
