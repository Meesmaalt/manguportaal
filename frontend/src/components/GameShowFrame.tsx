import type { ReactNode } from 'react'
import { Maximize, Minimize, Radio } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function GameShowFrame({ children, display = false, title = 'ÕHTU' }: { children: ReactNode; display?: boolean; title?: string }) {
  const [fullscreen, setFullscreen] = useState(false)
  async function toggleFullscreen() {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen() } catch {}
  }
  useEffect(() => { const sync=()=>setFullscreen(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange',sync); return()=>document.removeEventListener('fullscreenchange',sync) }, [])
  return <div className={`game-show ${display ? 'game-show-display' : ''}`}>
    <div className="game-show-glow game-show-glow-a" /><div className="game-show-glow game-show-glow-b" />
    <div className="game-show-topbar"><div className="game-show-brand"><span>{title}</span><i><Radio size={11}/> LIVE</i></div>
      <button type="button" className="game-show-fullscreen" onClick={toggleFullscreen}>{fullscreen?<Minimize size={15}/>:<Maximize size={15}/>}<span>{fullscreen?'Välju':'Täisekraan'}</span></button>
    </div><div className="relative z-10">{children}</div>
  </div>
}
