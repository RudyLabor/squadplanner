import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home, Auth, Squads, SquadDetail, SessionDetail, Landing, Sessions, Profile, Messages, Party, Onboarding, CallHistory, Premium } from './pages'
import { AppLayout } from './components/layout'
import { useAuthStore, subscribeToIncomingCalls } from './hooks'
import { CallModal } from './components/CallModal'
import { IncomingCallModal } from './components/IncomingCallModal'

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
    // Redirect to landing page, not auth - users can choose to login from there
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function AppContent() {
  const { initialize, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Subscribe to incoming calls when user is authenticated
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToIncomingCalls(user.id)
    return () => unsubscribe()
  }, [user])

  return (
    <>
      {/* Global call modals */}
      <CallModal />
      <IncomingCallModal />

      <AppLayout>
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={
          <ProtectedRoute><Home /></ProtectedRoute>
        } />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />

        {/* Protected routes */}
        <Route path="/squads" element={
          <ProtectedRoute><Squads /></ProtectedRoute>
        } />
        <Route path="/squad/:id" element={
          <ProtectedRoute><SquadDetail /></ProtectedRoute>
        } />
        <Route path="/party" element={
          <ProtectedRoute><Party /></ProtectedRoute>
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
        <Route path="/call-history" element={
          <ProtectedRoute><CallHistory /></ProtectedRoute>
        } />
        <Route path="/premium" element={
          <Premium />
        } />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
