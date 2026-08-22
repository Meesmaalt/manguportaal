import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, User, Home } from 'lucide-react'

export default function Layout() {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-gold/20 bg-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-display text-2xl md:text-3xl font-black text-gold tracking-wider group-hover:text-gold-hover transition">
              ÕHTU
            </span>
            <span className="text-white/60 text-sm hidden sm:inline font-medium">mängud</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm text-white/80 hover:text-gold transition px-2 py-1.5"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Mängud</span>
            </Link>
            {isLoggedIn ? (
              <>
                <span className="flex items-center gap-1.5 text-sm text-gold/90 px-2">
                  <User size={16} />
                  <span className="hidden sm:inline max-w-[120px] truncate">{user?.name || user?.email}</span>
                </span>
                <button
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="btn-outline text-sm !px-3 !py-1.5 flex items-center gap-1.5"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Välju</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-gold text-sm !px-4 !py-2">
                Sisene
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gold/10 py-6 text-center text-white/40 text-sm">
        Õhtu Mängud · Seltskonnamängud sõpradele
      </footer>
    </div>
  )
}
