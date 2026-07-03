import React from 'react'
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { Shield, LayoutDashboard, Database, LogOut } from 'lucide-react'

export const AdminLayout: React.FC = () => {
  const { user, role, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Enforce admin validation
  if (!user || role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  const navItems = [
    { path: '/', label: 'Dashboard & Users', icon: LayoutDashboard },
    { path: '/content', label: 'CMS Video Catalog', icon: Database }
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-border bg-card/40 flex flex-col p-6 shrink-0 gap-6">
        <div className="flex items-center gap-2 pb-6 border-b border-border">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold font-heading tracking-wider">ADMIN CONTROL</span>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border pt-4 flex flex-col gap-2">
          {/* External link to main consumer app */}
          <a
            href="http://localhost:5173"
            className="flex items-center justify-center gap-2 w-full py-2 bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold rounded-lg text-xs transition-all cursor-pointer"
          >
            Go to Zorynth App
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 font-semibold rounded-lg text-xs transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <span className="text-[10px] text-center text-muted-foreground font-medium mt-1">Admin: {user.email}</span>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
