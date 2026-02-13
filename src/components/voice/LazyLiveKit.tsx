import { lazy, Suspense } from 'react'
import { Skeleton } from '../ui'

// Lazy load LiveKit uniquement quand nécessaire
const LiveKitRoom = lazy(() => import('@livekit/components-react').then(module => ({
  default: module.LiveKitRoom
})))

const AudioTrack = lazy(() => import('@livekit/components-react').then(module => ({
  default: module.AudioTrack  
})))

const useRoomContext = lazy(() => import('@livekit/components-react').then(module => ({
  default: module.useRoomContext
})))

// Composant wrapper avec loading intelligent
export function LazyLiveKitRoom(props: any) {
  return (
    <Suspense fallback={<VoiceLoadingSkeleton />}>
      <LiveKitRoom {...props} />
    </Suspense>
  )
}

export function LazyAudioTrack(props: any) {
  return (
    <Suspense fallback={<Skeleton className="w-8 h-8 rounded-full" />}>
      <AudioTrack {...props} />
    </Suspense>
  )
}

// Skeleton spécialisé pour voice chat
function VoiceLoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-center">
        <Skeleton className="w-16 h-16 rounded-full" />
      </div>
      
      <div className="text-center space-y-2">
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
      
      <div className="flex justify-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 mx-auto" />
        <div className="flex justify-center gap-2">
          {Array.from({length: 4}).map((_, i) => (
            <Skeleton key={i} className="w-8 h-8 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Hook pour preload intelligent
export function useLiveKitPreload() {
  const preload = () => {
    // Preload LiveKit components when user hovers voice button
    import('@livekit/components-react')
  }
  
  return { preload }
}