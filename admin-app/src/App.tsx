import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from './pages/login'
import { AdminDashboardPage } from './pages/dashboard'
import { AdminContentPage } from './pages/content'
import { AdminLayout } from './layouts/AdminLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Admin Authentication Portal */}
          <Route path="/login" element={<LoginPage />} />

          {/* Secure Admin Control Workspace */}
          <Route element={<AdminLayout />}>
            <Route path="/" element={<AdminDashboardPage />} />
            <Route path="/content" element={<AdminContentPage />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
