import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

interface AuthUser {
  id: string
  email?: string
}

interface AuthState {
  user: AuthUser | null
  session: { access_token: string } | null
  role: 'user' | 'admin' | null
  status: 'active' | 'banned' | null
  setUser: (user: AuthUser | null) => void
  setSession: (session: { access_token: string } | null) => void
  setRole: (role: 'user' | 'admin' | null) => void
  setStatus: (status: 'active' | 'banned' | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  status: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  logout: async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // Offline fallback
    }
    set({ user: null, session: null, role: null, status: null })
  }
}))
