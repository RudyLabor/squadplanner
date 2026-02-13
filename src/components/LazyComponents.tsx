import { lazy, Suspense } from 'react'
import { Skeleton } from './ui'

// HEAVY COMPONENTS - Lazy load obligatoire
export const LazyMessages = lazy(() => import('../pages/Messages'))
export const LazyProfile = lazy(() => import('../pages/Profile'))  
export const LazyParty = lazy(() => import('../pages/Party'))
export const LazySessionDetail = lazy(() => import('../pages/SessionDetail'))

// VENDOR-HEAVY COMPONENTS (LiveKit = 457KB !)
export const LazyLiveKitRoom = lazy(() => import('../components/voice/LazyLiveKit').then(m => ({ default: m.LazyLiveKitRoom })))
export const LazyMotionComponents = lazy(() => import('../components/motion'))
export const LazyCharts = lazy(() => import('../components/analytics/Charts'))

// Wrapper avec skeleton intelligent
export function LazyWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <Suspense fallback={fallback || <Skeleton className="w-full h-96" />}>
      {children}
    </Suspense>
  )
}

// Routes lazy avec preload intelligent
export const lazyRoutes = {
  messages: {
    Component: LazyMessages,
    preload: () => import('../pages/Messages'),
    skeleton: <MessagesPageSkeleton />
  },
  
  profile: {
    Component: LazyProfile, 
    preload: () => import('../pages/Profile'),
    skeleton: <ProfilePageSkeleton />
  }
}

// Skeleton spécialisés (pas génériques)
function MessagesPageSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="w-80 border-r">
        {Array.from({length: 8}).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-16 w-full" />
        <div className="flex-1 p-4 space-y-4">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
              <div className="flex gap-2 max-w-xs">
                {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full" />}
                <Skeleton className="h-12 flex-1 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfilePageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({length: 3}).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}