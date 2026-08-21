import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import PackSelect from '@/pages/PackSelect'
import PlayKuldvillak from '@/pages/PlayKuldvillak'
import PlayRoosidesoda from '@/pages/PlayRoosidesoda'
import Display from '@/pages/Display'
import CreatePack from '@/pages/CreatePack'

function PrivateRoute({ children }: { children: React.ReactNode }) {
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
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/play/:gameType"
          element={
            <PrivateRoute>
              <PackSelect />
            </PrivateRoute>
          }
        />
        <Route
          path="/play/kuldvillak/:sessionId"
          element={
            <PrivateRoute>
              <PlayKuldvillak />
            </PrivateRoute>
          }
        />
        <Route
          path="/play/roosidesoda/:sessionId"
          element={
            <PrivateRoute>
              <PlayRoosidesoda />
            </PrivateRoute>
          }
        />
        <Route
          path="/packs/new"
          element={
            <PrivateRoute>
              <CreatePack />
            </PrivateRoute>
          }
        />
      </Route>
      {/* Full-screen display – no layout chrome */}
      <Route path="/ekraan/:code" element={<Display />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
