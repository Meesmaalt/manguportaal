import { useState, type ReactNode, useEffect } from 'react'
import {
  Volume2,
  VolumeX,
  RotateCcw,
  PartyPopper,
  Frown,
  Drum,
  Sparkles,
  Maximize,
  Minimize,
  Users,
  Tv,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Minus,
  Eye,
  EyeOff,
  BookOpen,
  Wifi,
  WifiOff,
  RefreshCw,
  QrCode,
  Radio,
  SlidersHorizontal,
} from 'lucide-react'
import { useFontScale } from '@/hooks/useFontScale'
import { getMasterVolume, setMasterVolume, playFx } from '@/lib/audio'
import { useI18n } from '@/i18n/I18nContext'
import { appUrl } from '@/lib/config'
import type { ConnectionStatus } from '@/hooks/useGameSession'
import { motion, AnimatePresence } from 'framer-motion'

export type GameToolbarProps = {
  onReset?: () => void
  gameTitle?: string
  gameActions?: ReactNode
  teamsControl?: {
    teams?: { name: string; score: number }[]
    onAddTeam?: () => void
    onRemoveTeam?: () => void
    onAdjustScore?: (idx: number, delta: number) => void
    onRenameTeam?: (idx: number, name: string) => void
  }
  buzzerControl?: {
    sessionCode?: string
    buzzEnabled?: boolean
    onToggleBuzz?: () => void
    showBuzzQr?: boolean
    onToggleBuzzQr?: () => void
    connection?: ConnectionStatus
    lastSync?: number
    onRetry?: () => void
    buzz?: { name: string; at?: number } | null
    onClearBuzz?: () => void
    customBuzzerContent?: ReactNode
  }
  audioControl?: {
    musicOn?: boolean
    onToggleMusic?: () => void
    sfxOn?: boolean
    onToggleSfx?: () => void
    musicLabel?: string
  }
  extra?: ReactNode
}

type TabType = 'teams' | 'buzzer' | 'audio' | 'view' | null

export default function GameToolbar({
  onReset,
  gameTitle,
  gameActions,
  teamsControl,
  buzzerControl,
  audioControl,
  extra,
}: GameToolbarProps) {
  const { smaller, reset, larger, fontScale } = useFontScale()
  const [vol, setVol] = useState(() => getMasterVolume())
  const { t } = useI18n()
  const [activeFx, setActiveFx] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>(null)
  const [copiedKind, setCopiedKind] = useState<'tv' | 'buzz' | null>(null)

  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    } catch {}
  }

  function triggerSound(fxName: 'applause' | 'sad_trombone' | 'drumroll' | 'jingle') {
    setActiveFx(fxName)
    playFx(fxName)
    setTimeout(() => setActiveFx(null), 800)
  }

  function onVol(v: number) {
    setVol(v)
    setMasterVolume(v)
  }

  async function copyText(text: string, kind: 'tv' | 'buzz') {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKind(kind)
      setTimeout(() => setCopiedKind(null), 2000)
    } catch {}
  }

  const toggleTab = (tab: TabType) => {
    setActiveTab((prev) => (prev === tab ? null : tab))
  }

  const code = buzzerControl?.sessionCode
  const tvUrl = code ? appUrl(`/ekraan/${code}`) : ''
  const buzzUrl = code ? appUrl(`/buzzer/${code}`) : ''
  const tvQrSrc = tvUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&ecc=M&margin=4&data=${encodeURIComponent(tvUrl)}`
    : ''

  const connStatus = buzzerControl?.connection || 'offline'
  const connStatusClass =
    connStatus === 'live'
      ? 'text-accent-green border-accent-green/40 bg-accent-green/10'
      : connStatus === 'local'
        ? 'text-gold border-gold/40 bg-gold/10'
        : connStatus === 'reconnecting'
          ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
          : 'text-white/50 border-white/20 bg-white/5'

  return (
    <div className="w-full max-w-5xl mx-auto mb-4 font-sans select-none">
      {/* Active Buzzer Global Notification */}
      {buzzerControl?.buzz && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mb-3 bg-gradient-to-r from-accent-cyan/25 via-accent-cyan/15 to-accent-cyan/25 border-2 border-accent-cyan rounded-2xl p-3 shadow-[0_0_25px_rgba(34,211,238,0.3)] flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-accent-cyan/20 text-accent-cyan animate-bounce">
              <Zap size={22} />
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-accent-cyan/80">
                Buzzer vajutatud!
              </div>
              <div className="font-display font-black text-2xl text-white drop-shadow">
                {buzzerControl.buzz.name}
              </div>
            </div>
          </div>
          {buzzerControl.onClearBuzz && (
            <button
              type="button"
              onClick={buzzerControl.onClearBuzz}
              className="btn-gold !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <RotateCcw size={14} />
              {t('buzzClear')} / Järgmine
            </button>
          )}
        </motion.div>
      )}

      {/* Main Host Control Bar */}
      <div className="bg-bg-card/90 backdrop-blur-md border border-gold/30 rounded-2xl p-2 shadow-xl flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left: Game Actions (Spikker, Piilu, AI, Finaal, Proov jne) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {gameActions}
            {extra}
          </div>

          {/* Right: Contextual Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            {/* Teams Tab */}
            {teamsControl && (
              <button
                type="button"
                onClick={() => toggleTab('teams')}
                className={`text-xs !py-1.5 !px-3 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
                  activeTab === 'teams'
                    ? 'bg-gold text-bg border-gold shadow-md font-bold'
                    : 'border-white/15 text-white/80 hover:border-gold/60 hover:text-white bg-white/5'
                }`}
                title="Meeskondade ja skooride juhtimine"
              >
                <Users size={14} className={activeTab === 'teams' ? 'text-bg' : 'text-gold'} />
                <span>Tiimid</span>
                {teamsControl.teams && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === 'teams' ? 'bg-bg text-gold' : 'bg-gold/20 text-gold'
                    }`}
                  >
                    {teamsControl.teams.length}
                  </span>
                )}
                {activeTab === 'teams' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}

            {/* TV & Buzzer Tab */}
            {buzzerControl && (
              <button
                type="button"
                onClick={() => toggleTab('buzzer')}
                className={`text-xs !py-1.5 !px-3 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
                  activeTab === 'buzzer'
                    ? 'bg-accent-cyan text-bg border-accent-cyan shadow-md font-bold'
                    : buzzerControl.buzzEnabled
                      ? 'border-accent-cyan/40 text-accent-cyan hover:border-accent-cyan bg-accent-cyan/10'
                      : 'border-white/15 text-white/80 hover:border-gold/60 hover:text-white bg-white/5'
                }`}
                title="TV ekraan ja buzzeri ühendused"
              >
                <Tv size={14} />
                <span>TV & Buzzer</span>
                {code && <span className="text-[10px] font-mono opacity-80">{code}</span>}
                {activeTab === 'buzzer' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}

            {/* Audio Tab */}
            <button
              type="button"
              onClick={() => toggleTab('audio')}
              className={`text-xs !py-1.5 !px-3 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
                activeTab === 'audio'
                  ? 'bg-gold text-bg border-gold shadow-md font-bold'
                  : audioControl?.musicOn
                    ? 'border-gold/60 text-gold bg-gold/10'
                    : 'border-white/15 text-white/80 hover:border-gold/60 hover:text-white bg-white/5'
              }`}
              title="Helitugevus, taustamuusika ja heliefektid"
            >
              {audioControl?.musicOn ? <Volume2 size={14} className="text-gold" /> : <Volume2 size={14} />}
              <span>Heli</span>
              <span className="text-[10px] font-mono opacity-80">{Math.round(vol * 100)}%</span>
              {activeTab === 'audio' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Settings & View Tab */}
            <button
              type="button"
              onClick={() => toggleTab('view')}
              className={`text-xs !py-1.5 !px-3 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
                activeTab === 'view'
                  ? 'bg-gold text-bg border-gold shadow-md font-bold'
                  : 'border-white/15 text-white/80 hover:border-gold/60 hover:text-white bg-white/5'
              }`}
              title="Vaate suurus, täisekraan ja algseis"
            >
              <SlidersHorizontal size={14} className={activeTab === 'view' ? 'text-bg' : 'text-gold'} />
              <span>Seaded</span>
              {activeTab === 'view' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Expandable Context Drawers */}
        <AnimatePresence>
          {activeTab && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-2 border-t border-white/10"
            >
              {/* TEAMS DRAWER */}
              {activeTab === 'teams' && teamsControl && (
                <div className="p-3 bg-bg/80 rounded-xl border border-gold/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-gold text-xs uppercase tracking-wider font-bold">
                        Meeskondade haldus ({teamsControl.teams?.length || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamsControl.onAddTeam && (
                        <button
                          type="button"
                          onClick={teamsControl.onAddTeam}
                          className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 text-gold border-gold/40 hover:bg-gold hover:text-bg"
                        >
                          <Plus size={13} /> Lisa tiim
                        </button>
                      )}
                      {teamsControl.onRemoveTeam && (
                        <button
                          type="button"
                          onClick={teamsControl.onRemoveTeam}
                          disabled={!teamsControl.teams || teamsControl.teams.length <= 1}
                          className="btn-outline text-xs !py-1 !px-2.5 flex items-center gap-1 text-accent-red border-accent-red/40 hover:bg-accent-red hover:text-white disabled:opacity-40"
                        >
                          <Minus size={13} /> Eemalda tiim
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Team score overview chips */}
                  {teamsControl.teams && teamsControl.teams.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                      {teamsControl.teams.map((tItem, idx) => (
                        <div
                          key={idx}
                          className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{tItem.name}</div>
                            <div className="text-gold font-display font-black text-sm">{tItem.score} p</div>
                          </div>
                          {teamsControl.onAdjustScore && (
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => teamsControl.onAdjustScore!(idx, 100)}
                                className="w-5 h-5 rounded bg-gold/15 hover:bg-gold text-gold hover:text-bg text-[10px] font-bold flex items-center justify-center transition"
                                title="+100 punkti"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => teamsControl.onAdjustScore!(idx, -100)}
                                className="w-5 h-5 rounded bg-accent-red/15 hover:bg-accent-red text-accent-red hover:text-white text-[10px] font-bold flex items-center justify-center transition"
                                title="-100 punkti"
                              >
                                -
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TV & BUZZER DRAWER */}
              {activeTab === 'buzzer' && buzzerControl && (
                <div className="p-3 bg-bg/80 rounded-xl border border-accent-cyan/20 flex flex-col gap-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* TV Ekraan Section */}
                    <div className="space-y-2 border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gold text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
                          <Tv size={14} /> TV Mänguekraan
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${connStatusClass}`}
                        >
                          {connStatus === 'reconnecting' ? (
                            <RefreshCw size={10} className="animate-spin" />
                          ) : connStatus === 'live' || connStatus === 'local' ? (
                            <Wifi size={10} />
                          ) : (
                            <WifiOff size={10} />
                          )}
                          {connStatus === 'live' ? 'Live' : connStatus === 'local' ? 'Sama seade' : connStatus}
                        </span>
                      </div>

                      {code && (
                        <div className="flex items-center gap-2">
                          <span className="text-white/60 text-xs">Mängukood:</span>
                          <span className="font-mono font-bold text-gold text-sm bg-black/40 px-2 py-0.5 rounded border border-gold/30">
                            {code}
                          </span>
                        </div>
                      )}

                      {tvUrl && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => copyText(tvUrl, 'tv')}
                            className="btn-outline text-xs !py-1.5 !px-2.5 flex items-center gap-1 hover:text-gold"
                          >
                            {copiedKind === 'tv' ? <Check size={13} className="text-accent-green" /> : <Copy size={13} />}
                            {copiedKind === 'tv' ? 'Kopeeritud!' : 'Kopeeri TV link'}
                          </button>
                          <a
                            href={tvUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-gold text-xs !py-1.5 !px-2.5 flex items-center gap-1 font-bold"
                          >
                            <ExternalLink size={13} /> Ava ekraan
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Buzzer Section */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-accent-cyan text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
                          <Zap size={14} /> Mängijate Buzzer
                        </span>
                        {buzzerControl.onToggleBuzz && (
                          <button
                            type="button"
                            onClick={buzzerControl.onToggleBuzz}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition flex items-center gap-1 ${
                              buzzerControl.buzzEnabled
                                ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan'
                                : 'border-white/20 text-white/50 hover:text-white'
                            }`}
                          >
                            <Radio size={12} className={buzzerControl.buzzEnabled ? 'animate-pulse' : ''} />
                            {buzzerControl.buzzEnabled ? 'Buzzer sees' : 'Buzzer väljas'}
                          </button>
                        )}
                      </div>

                      {buzzUrl && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => copyText(buzzUrl, 'buzz')}
                            className="btn-outline text-xs !py-1.5 !px-2.5 flex items-center gap-1 hover:text-accent-cyan"
                          >
                            {copiedKind === 'buzz' ? <Check size={13} className="text-accent-green" /> : <Copy size={13} />}
                            {copiedKind === 'buzz' ? 'Kopeeritud!' : 'Kopeeri Buzzeri link'}
                          </button>
                          {buzzerControl.onToggleBuzzQr && (
                            <button
                              type="button"
                              onClick={buzzerControl.onToggleBuzzQr}
                              disabled={!buzzerControl.buzzEnabled}
                              className={`btn-outline text-xs !py-1.5 !px-2.5 flex items-center gap-1 ${
                                buzzerControl.showBuzzQr
                                  ? 'bg-gold/20 border-gold text-gold font-bold'
                                  : 'border-white/20 text-white/60'
                              } disabled:opacity-40`}
                            >
                              <QrCode size={13} />
                              {buzzerControl.showBuzzQr ? 'QR ekraanil SEES' : 'Kuva QR ekraanil'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Custom Buzzer Controls (e.g. SmartBuzzerPanel for Nuputamine / Tekst) */}
                      {buzzerControl.customBuzzerContent && (
                        <div className="pt-2">{buzzerControl.customBuzzerContent}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIO & SOUNDBOARD DRAWER */}
              {activeTab === 'audio' && (
                <div className="p-3 bg-bg/80 rounded-xl border border-gold/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Volume Slider & Music Toggles */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 bg-black/40 border border-gold/30 rounded-xl px-3 py-1.5 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => onVol(vol > 0 ? 0 : 1)}
                          className="text-gold hover:opacity-80"
                          title="Vaigista / Taasta heli"
                        >
                          {vol > 0 ? <Volume2 size={16} /> : <VolumeX size={16} className="text-accent-red" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.05}
                          value={vol}
                          onChange={(e) => onVol(Number(e.target.value))}
                          className="w-28 accent-[#dfb342] h-1.5 cursor-pointer"
                        />
                        <span className="text-gold text-xs font-mono tabular-nums w-10 text-right">
                          {Math.round(vol * 100)}%
                        </span>
                      </div>

                      {audioControl?.onToggleMusic && (
                        <button
                          type="button"
                          onClick={audioControl.onToggleMusic}
                          className={`btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 rounded-xl ${
                            audioControl.musicOn
                              ? 'bg-gold/20 border-gold text-gold font-bold'
                              : 'text-white/60 border-white/20'
                          }`}
                        >
                          {audioControl.musicOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                          {audioControl.musicOn
                            ? `${audioControl.musicLabel || 'Taustamuusika'} SEES`
                            : `${audioControl.musicLabel || 'Taustamuusika'}`}
                        </button>
                      )}

                      {audioControl?.onToggleSfx && (
                        <button
                          type="button"
                          onClick={audioControl.onToggleSfx}
                          className={`btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5 rounded-xl ${
                            audioControl.sfxOn
                              ? 'bg-gold/20 border-gold text-gold font-bold'
                              : 'text-white/60 border-white/20'
                          }`}
                        >
                          {audioControl.sfxOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                          {audioControl.sfxOn ? 'Heliefektid SEES' : 'Heliefektid VÄLJAS'}
                        </button>
                      )}
                    </div>

                    {/* Soundboard Buttons */}
                    <div className="flex items-center gap-1.5 bg-black/40 border border-gold/20 rounded-xl px-2 py-1">
                      <span className="text-gold/60 text-[10px] uppercase tracking-widest font-bold px-1 hidden sm:inline">
                        Helipult:
                      </span>
                      <button
                        type="button"
                        onClick={() => triggerSound('applause')}
                        className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                          activeFx === 'applause'
                            ? 'bg-gold text-bg font-bold scale-105'
                            : 'text-white/80 hover:text-gold hover:bg-gold/10'
                        }`}
                        title="Aplaus rahvalt"
                      >
                        <PartyPopper size={14} />
                        <span>Aplaus</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerSound('sad_trombone')}
                        className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                          activeFx === 'sad_trombone'
                            ? 'bg-accent-red text-white font-bold scale-105'
                            : 'text-white/80 hover:text-accent-red hover:bg-accent-red/10'
                        }`}
                        title="Hale tromboon / Vale vastus"
                      >
                        <Frown size={14} />
                        <span>Tromboon</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerSound('drumroll')}
                        className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                          activeFx === 'drumroll'
                            ? 'bg-amber-400 text-bg font-bold scale-105'
                            : 'text-white/80 hover:text-amber-400 hover:bg-amber-400/10'
                        }`}
                        title="Trummipõrin põnevuse tekitamiseks"
                      >
                        <Drum size={14} />
                        <span>Trummipõrin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerSound('jingle')}
                        className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                          activeFx === 'jingle'
                            ? 'bg-emerald-400 text-bg font-bold scale-105'
                            : 'text-white/80 hover:text-emerald-400 hover:bg-emerald-400/10'
                        }`}
                        title="Õige vastuse fanfaar"
                      >
                        <Sparkles size={14} />
                        <span>Fanfaar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW & SETTINGS DRAWER */}
              {activeTab === 'view' && (
                <div className="p-3 bg-bg/80 rounded-xl border border-gold/20 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Font Scale Adjuster */}
                    <div className="flex items-center gap-1 bg-black/40 border border-gold/30 rounded-xl px-2.5 py-1">
                      <span className="text-gold text-xs font-medium mr-1">
                        {t('toolbarText')} {Math.round(fontScale * 100)}%
                      </span>
                      <button
                        type="button"
                        className="text-gold font-bold px-2 py-0.5 rounded-lg hover:bg-gold hover:text-bg text-xs transition"
                        onClick={smaller}
                        title="Väiksem tekst"
                      >
                        A−
                      </button>
                      <button
                        type="button"
                        className="text-gold font-bold px-2 py-0.5 rounded-lg hover:bg-gold hover:text-bg text-xs transition"
                        onClick={reset}
                        title="Algne suurus"
                      >
                        A
                      </button>
                      <button
                        type="button"
                        className="text-gold font-bold px-2 py-0.5 rounded-lg hover:bg-gold hover:text-bg text-xs transition"
                        onClick={larger}
                        title="Suurem tekst"
                      >
                        A+
                      </button>
                    </div>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="btn-outline text-xs !py-1.5 !px-3 rounded-xl flex items-center gap-1.5 hover:text-gold"
                      title="Täisekraan vaade"
                    >
                      {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                      {fullscreen ? 'Välju täisekraanilt' : 'Täisekraan'}
                    </button>
                  </div>

                  {/* Reset Game Button */}
                  {onReset && (
                    <button
                      type="button"
                      onClick={onReset}
                      className="btn-outline text-xs !py-1.5 !px-3 rounded-xl flex items-center gap-1.5 border-accent-red/60 text-accent-red hover:bg-accent-red hover:text-white transition"
                      title="Taasta mängu algseis"
                    >
                      <RotateCcw size={14} />
                      {t('toolbarReset')}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
