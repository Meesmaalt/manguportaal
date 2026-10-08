import type { CSSProperties } from 'react'
import { COLOR_LABEL, LABELS, type FlexCard as Card } from './rules'
export const INK={red:'#e94d63',yellow:'#f3c74c',green:'#2cb990',blue:'#438de3',wild:'#6357ad'}
export default function FlexCard({card,onClick,disabled=false,selected=false,back=false}:{card?:Card;onClick?:()=>void;disabled?:boolean;selected?:boolean;back?:boolean}) {
 if(back||!card)return <div className="flex-card flex-card-back" aria-label="Peidetud kaart"><span>FLEX</span><small>↯</small></div>
 const symbol=card.kind==='number'?String(card.number):card.kind==='skip'?'⊘':card.kind==='reverse'?'⇄':card.kind==='wild_flip'?'↻':card.kind==='wild_target2'?'⊕2':card.kind==='wild_all2'?'∀+2':card.kind==='draw2'?'+2':'+4'
 const label=`${card.color==='wild'?'Joker':COLOR_LABEL[card.color]} ${card.kind==='number'?card.number:LABELS[card.kind]}${card.flexColor?` · Flex ${COLOR_LABEL[card.flexColor]}`:card.flex?' · Flex':''}${card.flip?' · Pööra jõud':''}`
 const Tag=onClick?'button':'div'
 return <Tag type={onClick?'button':undefined} onClick={onClick} disabled={onClick?disabled:undefined} aria-label={label} className={`flex-card ${selected?'flex-card-selected':''} ${disabled?'flex-card-disabled':''}`} style={{'--card-ink':INK[card.color]} as CSSProperties}>
  <span className="flex-corner">{symbol}</span><span className="flex-card-oval">{symbol}</span><span className="flex-card-label">{card.kind==='number'?COLOR_LABEL[card.color as keyof typeof COLOR_LABEL]:LABELS[card.kind]}</span>
  {card.flexColor&&<span className="flex-alt" style={{background:INK[card.flexColor]}}>{COLOR_LABEL[card.flexColor]} ↯</span>}
  {card.flex&&<span className="flex-alt">FLEX ↯</span>}{card.flip&&<span className="flex-alt">JÕUD ↻</span>}
 </Tag>
}
