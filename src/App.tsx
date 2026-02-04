import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home, Auth, Squads, SquadDetail, SessionDetail, Landing, Sessions, Profile, Messages } from './pages'
import { AppLayout } from './components/layout'
import { useAuthStore } from './hooks'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuthStore()
  
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#5e6dd2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  return <>{children}</>
}

function AppContent() {
  const { initialize, user } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <AppLayout>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? <Home /> : <Landing />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected routes */}
        <Route path="/squads" element={
          <ProtectedRoute><Squads /></ProtectedRoute>
        } />
        <Route path="/squad/:id" element={
          <ProtectedRoute><SquadDetail /></ProtectedRoute>
        } />
        <Route path="/sessions" element={
          <ProtectedRoute><Sessions /></ProtectedRoute>
        } />
        <Route path="/session/:id" element={
          <ProtectedRoute><SessionDetail /></ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute><Messages /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
