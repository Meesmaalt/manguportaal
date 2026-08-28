import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import PackSelect from '@/pages/PackSelect'
import PlayKuldvillak from '@/pages/PlayKuldvillak'
import PlayRoosidesoda from '@/pages/PlayRoosidesoda'
import PlayGeneric from '@/pages/PlayGeneric'
import Display from '@/pages/Display'
import CreatePack from '@/pages/CreatePack'
import Playlist from '@/pages/Playlist'
import WeddingEvening from '@/pages/WeddingEvening'
import Buzzer from '@/pages/Buzzer'
import PrintPack from '@/pages/PrintPack'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold font-display text-2xl animate-pulse">Laadin...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* Dashboard & mängud avatud ka külalisele */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/playlist" element={<Playlist />} />
        <Route path="/pulm" element={<WeddingEvening />} />
        <Route path="/print" element={<PrintPack />} />
        <Route path="/play/:gameType" element={<PackSelect />} />
        <Route path="/play/kuldvillak/:sessionId" element={<PlayKuldvillak />} />
        <Route path="/play/roosidesoda/:sessionId" element={<PlayRoosidesoda />} />
        <Route path="/play/:gameType/:sessionId" element={<PlayGeneric />} />
        {/* Oma seti loomine nõuab kontot */}
        <Route
          path="/packs/new"
          element={
            <PrivateRoute>
              <CreatePack />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="/ekraan" element={<Display />} />
      <Route path="/ekraan/:code" element={<Display />} />
      <Route path="/buzzer/:code" element={<Buzzer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
