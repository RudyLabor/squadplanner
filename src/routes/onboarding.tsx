import { useState, useEffect, memo } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '../hooks'
import { Onboarding } from '../pages/Onboarding'

const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

export function meta() {
  return [
    { title: "Bienvenue - Squad Planner" },
  ]
}

export default function OnboardingRoute() {
  // During SSR, render loading state
  if (typeof window === 'undefined') return <LoadingSpinner />

  const { user, isInitialized } = useAuthStore()

  if (!isInitialized) return <LoadingSpinner />
  if (!user) return <Navigate to="/" replace />

  return <Onboarding />
}
