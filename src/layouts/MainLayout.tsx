import React, { useEffect } from 'react'
import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { useProfileStore } from '../stores/useProfileStore'
import { supabase } from '../lib/supabaseClient'
import { LogOut, Film, Search, Shield } from 'lucide-react'

export const MainLayout: React.FC = () => {
  const { logout, role, user } = useAuthStore()
  const { currentProfile, clearProfile } = useProfileStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''

  // Real-time user status ban check heartbeat
  useEffect(() => {
    if (!user) return

    const checkUserStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('status')
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        if (data && data.status === 'banned') {
          console.warn('Active session user was banned by an administrator. Logging out...')
          await logout()
          clearProfile()
          navigate('/login')
        }
      } catch (err) {
        // Silent fallback ignore
      }
    }

    checkUserStatus()
    const interval = setInterval(checkUserStatus, 10000)

    return () => clearInterval(interval)
  }, [user, logout, clearProfile, navigate])

  const handleLogout = async () => {
    await logout()
    clearProfile()
    navigate('/')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const current = Object.fromEntries(searchParams.entries())
    if (val) {
      setSearchParams({ ...current, search: val })
    } else {
      const { search, ...rest } = current
      setSearchParams(rest)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 md:gap-8 flex-1">
          <Link to="/browse" className="text-xl md:text-2xl font-bold font-heading text-primary tracking-wider hover:text-primary/90 flex items-center gap-2 shrink-0">
            <Film className="w-5.5 h-5.5 text-secondary" />
            ZORYNTH
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground shrink-0">
            <Link to="/browse" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/browse?type=movie" className="hover:text-foreground transition-colors">Movies</Link>
            <Link to="/browse?type=series" className="hover:text-foreground transition-colors">TV Shows</Link>
          </nav>

          {/* Header Search bar */}
          <div className="relative max-w-xs flex-1 hidden sm:block">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search movies, TV shows..."
              className="w-full bg-background/50 border border-border/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {role === 'admin' && (
            <a 
              href="http://localhost:5174"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-secondary" />
              Admin Panel
            </a>
          )}

          {currentProfile && (
            <div className="flex items-center gap-2 border border-border/80 rounded-full px-3 py-1 bg-muted/30">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs text-muted-foreground">{currentProfile.name}</span>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md text-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-8 px-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Zorynth VOD Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
