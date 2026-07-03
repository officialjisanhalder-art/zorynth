import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabaseAdmin } from '../lib/supabaseClient'
import { Shield, Users, Video, BarChart2, ShieldAlert, CheckCircle, Ban, ArrowRight, RefreshCw } from 'lucide-react'

interface UserAccount {
  id: string
  email: string
  created_at: string
  role: 'user' | 'admin'
  status: 'active' | 'banned'
}

interface Stats {
  streamedMinutes: number
  activeStreamers: number
  mediaCount: number
}

export const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [stats, setStats] = useState<Stats>({ streamedMinutes: 0, activeStreamers: 0, mediaCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // --- Fetch user_roles (service role bypasses RLS) ---
      const rolesResp = await supabaseAdmin.from('user_roles').select('user_id, role, status, created_at').order('created_at', { ascending: false })
      if (rolesResp.error) throw new Error('user_roles: ' + rolesResp.error.message)

      // --- Fetch profiles to get emails ---
      const profilesResp = await supabaseAdmin.from('profiles').select('user_id, name, email')
      if (profilesResp.error) throw new Error('profiles: ' + profilesResp.error.message)

      const rolesData = rolesResp.data || []
      const profilesData = profilesResp.data || []

      const formatted: UserAccount[] = rolesData.map((r: any) => {
        const profile = profilesData.find((p: any) => p.user_id === r.user_id)
        return {
          id: r.user_id,
          email: profile?.email || profile?.name || r.user_id.substring(0, 8) + '...',
          created_at: r.created_at ? r.created_at.split('T')[0] : '—',
          role: r.role,
          status: r.status || 'active'
        }
      })

      setUsers(formatted)

      // --- Fetch media count ---
      const mediaResp = await supabaseAdmin.from('media').select('id', { count: 'exact', head: true })
      const mediaCount = mediaResp.count ?? 0

      // --- Fetch watch history ---
      const historyResp = await supabaseAdmin.from('watch_history').select('progress_seconds')
      const historyData = historyResp.data || []
      const totalSeconds = historyData.reduce((acc: number, h: any) => acc + (h.progress_seconds || 0), 0)

      setStats({
        streamedMinutes: Math.round(totalSeconds / 60),
        activeStreamers: historyData.length,
        mediaCount
      })

    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleToggleStatus = async (userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return
    const nextStatus = target.status === 'active' ? 'banned' : 'active'

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u))

    const { error } = await supabaseAdmin.from('user_roles').update({ status: nextStatus }).eq('user_id', userId)
    if (error) {
      console.error('Toggle status error:', error.message)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: target.status } : u))
    }
  }

  const handleToggleRole = async (userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return
    const nextRole = target.role === 'admin' ? 'user' : 'admin'

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u))

    const { error } = await supabaseAdmin.from('user_roles').update({ role: nextRole }).eq('user_id', userId)
    if (error) {
      console.error('Toggle role error:', error.message)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: target.role } : u))
    }
  }

  return (
    <div className="p-6 md:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" /> Admin Operations
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Platform-wide statistics, user controls, and library administration.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            to="/content"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all text-xs cursor-pointer"
          >
            Manage Video Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="border border-border bg-card/40 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Streamed Minutes</span>
            <span className="text-2xl font-bold font-heading text-foreground">{loading ? '...' : `${stats.streamedMinutes}m`}</span>
          </div>
          <BarChart2 className="w-10 h-10 text-secondary opacity-60" />
        </div>
        <div className="border border-border bg-card/40 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Total Users</span>
            <span className="text-2xl font-bold font-heading text-foreground">{loading ? '...' : users.length}</span>
          </div>
          <Users className="w-10 h-10 text-primary opacity-60" />
        </div>
        <div className="border border-border bg-card/40 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Media Titles</span>
            <span className="text-2xl font-bold font-heading text-foreground">{loading ? '...' : `${stats.mediaCount} Titles`}</span>
          </div>
          <Video className="w-10 h-10 text-secondary opacity-60" />
        </div>
        <div className="border border-border bg-card/40 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase font-bold">Node Status</span>
            <span className="text-2xl font-bold font-heading text-green-400">99.9% Uptime</span>
          </div>
          <CheckCircle className="w-10 h-10 text-green-400 opacity-60 animate-pulse" />
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card/40 shadow-xl">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-card/60">
          <h3 className="font-bold font-heading text-foreground text-sm">
            Account Directory ({loading ? '…' : users.length})
          </h3>
          <span className="text-xs text-muted-foreground">Manage user roles and account bans.</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            No users found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold font-heading uppercase text-[10px]">
                  <th className="px-6 py-3">Email Address</th>
                  <th className="px-6 py-3">Registration Date</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Access Level</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((account) => (
                  <tr key={account.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{account.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{account.created_at}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        account.role === 'admin'
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        {account.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {account.status === 'active' ? (
                          <><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-green-400">Active</span></>
                        ) : (
                          <><ShieldAlert className="w-4 h-4 text-destructive" /><span className="text-destructive">Banned</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleRole(account.id)}
                        className="px-2.5 py-1 border border-border rounded hover:bg-muted transition-all cursor-pointer font-semibold text-[10px] text-foreground"
                      >
                        Toggle Role
                      </button>
                      <button
                        onClick={() => handleToggleStatus(account.id)}
                        className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer font-semibold text-[10px] ${
                          account.status === 'active'
                            ? 'border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10'
                            : 'border border-green-500/20 text-green-400 bg-green-500/5 hover:bg-green-500/10'
                        }`}
                      >
                        <Ban className="w-3 h-3" />
                        {account.status === 'active' ? 'Ban User' : 'Unban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
