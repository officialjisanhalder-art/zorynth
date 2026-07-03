import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

export const AuthLayout: React.FC = () => {
  const { session } = useAuthStore()

  // If there is already an active session, skip sign-in
  if (session) {
    return <Navigate to="/profiles" replace />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-2xl">
        <Outlet />
      </div>
    </div>
  )
}
