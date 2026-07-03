import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LandingPage } from './pages/landing'
import { LoginPage } from './pages/login'
import { RegisterPage } from './pages/register'
import { ProfilesPage } from './pages/profiles'
import { BrowsePage } from './pages/browse'
import { PlayerPage } from './pages/player'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'

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
          {/* Guest Landing Route */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Gateway */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Secure Profile Selection */}
          <Route path="/profiles" element={<ProfilesPage />} />

          {/* Main App Layout */}
          <Route element={<MainLayout />}>
            <Route path="/browse" element={<BrowsePage />} />
          </Route>

          {/* Dedicated Custom Video Player */}
          <Route path="/watch/movie/:id" element={<PlayerPage />} />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
