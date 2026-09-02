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
import Buzzer from '@/pages/Buzzer'
import DealPlayer from '@/pages/DealPlayer'
import BlitzPlayer from '@/pages/BlitzPlayer'
import BlitzResults from '@/pages/BlitzResults'
import SharePack from '@/pages/SharePack'
import PrintPack from '@/pages/PrintPack'
import ImportPack from '@/pages/ImportPack'
import EditPack from '@/pages/EditPack'
import Admin from '@/pages/Admin'
import Gallery from '@/pages/Gallery'
import Changelog from '@/pages/Changelog'

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
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/playlist" element={<Playlist />} />
        <Route path="/print" element={<PrintPack />} />
        <Route path="/packs/import" element={<ImportPack />} />
        <Route path="/pack/:id" element={<SharePack />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route
          path="/packs/:id/edit"
          element={
            <PrivateRoute>
              <EditPack />
            </PrivateRoute>
          }
        />
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
      <Route path="/deal/:code/:token" element={<DealPlayer />} />
      <Route path="/blitz/:code/tulemused" element={<BlitzResults />} />
      <Route path="/blitz/:code" element={<BlitzPlayer />} />
      <Route path="/buzz/:code" element={<Buzzer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
