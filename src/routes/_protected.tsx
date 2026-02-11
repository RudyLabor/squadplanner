import { useState, useEffect, memo } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuthStore, useSquadsStore } from '../hooks'

const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

export default function ProtectedLayout() {
  const { user, isInitialized } = useAuthStore()
  const { squads, fetchSquads } = useSquadsStore()
  const [hasCheckedSquads, setHasCheckedSquads] = useState(false)

  useEffect(() => {
    if (user && !hasCheckedSquads) {
      fetchSquads().then(() => setHasCheckedSquads(true))
    }
  }, [user, hasCheckedSquads, fetchSquads])

  // During SSR, render a loading state (server doesn't have auth)
  if (typeof window === 'undefined') {
    return <LoadingSpinner />
  }

  if (!isInitialized) return <LoadingSpinner />
  if (!user) return <Navigate to="/" replace />
  if (!hasCheckedSquads) return <LoadingSpinner />
  if (hasCheckedSquads && squads.length === 0 && localStorage.getItem('sq-onboarding-skipped') !== 'true') {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
