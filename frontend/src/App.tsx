import { lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const PackSelect = lazy(() => import('@/pages/PackSelect'))
const PlayKuldvillak = lazy(() => import('@/pages/PlayKuldvillak'))
const PlayRoosidesoda = lazy(() => import('@/pages/PlayRoosidesoda'))
const PlayGeneric = lazy(() => import('@/pages/PlayGeneric'))
const Display = lazy(() => import('@/pages/Display'))
const CreatePack = lazy(() => import('@/pages/CreatePack'))
const Playlist = lazy(() => import('@/pages/Playlist'))
const Buzzer = lazy(() => import('@/pages/Buzzer'))
const FlexPlayer = lazy(() => import('@/pages/FlexPlayer'))
const DealPlayer = lazy(() => import('@/pages/DealPlayer'))
const BlitzPlayer = lazy(() => import('@/pages/BlitzPlayer'))
const MiljonarPlayer = lazy(() => import('@/pages/MiljonarPlayer'))
const SharePack = lazy(() => import('@/pages/SharePack'))
const PrintPack = lazy(() => import('@/pages/PrintPack'))
const ImportPack = lazy(() => import('@/pages/ImportPack'))
const EditPack = lazy(() => import('@/pages/EditPack'))
const Admin = lazy(() => import('@/pages/Admin'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const Changelog = lazy(() => import('@/pages/Changelog'))

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
    <Suspense fallback={<div className="min-h-[60vh] grid place-items-center text-gold" role="status">Laadin mängu…</div>}>
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
      <Route path="/flex/:code/:token" element={<FlexPlayer />} />
      <Route path="/deal/:code/:token" element={<DealPlayer />} />
      <Route path="/blitz/:code" element={<BlitzPlayer />} />
      <Route path="/miljonar/:code" element={<MiljonarPlayer />} />
      <Route path="/buzz/:code" element={<Buzzer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
