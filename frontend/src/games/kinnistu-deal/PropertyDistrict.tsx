import type { CSSProperties } from 'react'
import type { DealCard, PlayerBoard, PropColor } from './types'
import { COLOR_STYLE, SET_SIZE, rentForSet } from './types'

/** Code-native artwork: crisp on TVs, no external assets or hidden hand data. */
export function StreetBuilding({ color, variant = 0, ghost = false, building }: {
  color: PropColor; variant?: number; ghost?: boolean; building?: 'house' | 'hotel'
}) {
  const fill = ghost ? '#344458' : COLOR_STYLE[color].bg
  const height = building === 'hotel' ? 64 : 36 + (variant % 3) * 9
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="district-building">
      <ellipse cx="51" cy="87" rx="35" ry="8" fill="#020617" opacity=".35" />
      {color === 'rail' ? <g>
        <path d="M12 80h76M12 88h76M20 78v12m15-12v12m15-12v12m15-12v12m15-12v12" stroke="#94a3b8" strokeWidth="3" />
        <rect x="17" y="42" width="65" height="35" rx="8" fill={fill} stroke={ghost ? '#526176' : '#cbd5e1'} strokeWidth="2" />
        <path d="M25 48h12v13H25zm20 0h12v13H45zm20 0h10v13H65z" fill={ghost ? '#526176' : '#bce9ff'} />
        <circle cx="30" cy="76" r="6" fill="#0f172a" /><circle cx="70" cy="76" r="6" fill="#0f172a" />
      </g> : color === 'util' ? <g>
        <path d="M32 79L45 22h10l15 57M39 50h23M35 65h31M42 37h16" fill="none" stroke={ghost ? fill : '#dbeafe'} strokeWidth="4" />
        <path d="M15 34h70M21 47h58" stroke={fill} strokeWidth="5" />
        <path d="M15 35Q5 20 0 29m85 6q10-15 15-6" fill="none" stroke="#94a3b8" strokeWidth="2" />
      </g> : <g>
        <path d={`M24 ${81-height}h45v${height}H24z`} fill={fill} />
        <path d={`M69 ${81-height}l15-8v${height}l-15 8z`} fill={fill} style={{ filter: 'brightness(.65)' }} />
        <path d={`M19 ${81-height}l25-15 40 7-15 8z`} fill={ghost ? '#46566b' : '#e2e8f0'} />
        {Array.from({ length: Math.max(1, Math.floor(height / 16)) }, (_, row) => [32, 51].map(x => (
          <rect key={`${row}-${x}`} x={x} y={87-height+row*15} width="9" height="8" rx="1" fill={ghost ? '#526176' : '#fff3c4'} />
        )))}
        <rect x="42" y="67" width="11" height="14" rx="1" fill="#172536" />
        {building === 'hotel' && <g><rect x="32" y="6" width="28" height="14" rx="3" fill="#fbbf24" /><text x="46" y="17" textAnchor="middle" fontSize="10" fontWeight="900" fill="#172536">H</text></g>}
        {building === 'house' && <path d="M7 76V64l10-9 10 9v12z" fill="#86efac" stroke="#14532d" strokeWidth="2" />}
        <path d="M6 83v-14" stroke="#875c3b" strokeWidth="3" /><circle cx="7" cy="63" r="10" fill={ghost ? '#344458' : '#288367'} />
      </g>}
    </svg>
  )
}

export function PropertyDistrict({ color, cards, building, owner, onClick, highlight }: {
  color: PropColor; cards: DealCard[]; building?: 'house' | 'hotel'; owner: PlayerBoard;
  onClick?: () => void; highlight?: boolean
}) {
  const need = SET_SIZE[color]
  const complete = cards.length >= need
  const Tag = onClick ? 'button' : 'div'
  return <Tag type={onClick ? 'button' : undefined} onClick={onClick}
    className={`property-district ${complete ? 'district-complete' : ''} ${highlight ? 'district-selected' : ''}`}
    style={{ '--district-color': COLOR_STYLE[color].bg } as CSSProperties}>
    <div className="district-heading"><strong>{COLOR_STYLE[color].label}</strong><span>{cards.length}/{need} {complete ? '✓' : ''}</span></div>
    <div className="district-street">
      {Array.from({ length: Math.max(need, cards.length) }, (_, i) => {
        const card = cards[i]
        return <div key={card?.id || `empty-${i}`} className={`district-lot ${card ? '' : 'district-empty'}`}>
          <StreetBuilding color={color} variant={i} ghost={!card} building={i === 0 ? building : undefined} />
          <span>{card?.kind === 'property' ? card.name : 'Vaba krunt'}</span>
        </div>
      })}
    </div>
    <div className="district-road" aria-hidden="true" />
    <div className="district-footer"><span>{building === 'hotel' ? 'Hotell' : building === 'house' ? 'Maja' : complete ? 'Täiskomplekt' : `Veel ${need-cards.length} kinnistut`}</span><strong>Üür {rentForSet(owner, color)}M</strong></div>
  </Tag>
}

export default function PropertyCity({ player, compact = false }: { player: PlayerBoard; compact?: boolean }) {
  const colors = (Object.keys(SET_SIZE) as PropColor[]).filter(c => (player.props[c] || []).length > 0)
  if (!colors.length) return <div className="district-city-empty"><StreetBuilding color="orange" ghost /><p>Sinu linn algab esimesest kinnistust</p></div>
  return <div className={`property-city ${compact ? 'property-city-compact' : ''}`}>
    {colors.map(color => <PropertyDistrict key={color} color={color} cards={player.props[color] || []} building={player.buildings?.[color]} owner={player} />)}
  </div>
}
