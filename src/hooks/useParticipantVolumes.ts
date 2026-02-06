import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'squadplanner-participant-volumes'

interface ParticipantVolumeState {
  volume: number  // 0-200, default 100
  muted: boolean
}

interface StoredVolumes {
  [participantId: string]: ParticipantVolumeState
}

/**
 * Hook to manage individual volume levels for voice chat participants.
 * Persists volume settings to localStorage for each participant.
 */
export function useParticipantVolumes() {
  const [volumes, setVolumes] = useState<StoredVolumes>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Persist to localStorage whenever volumes change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes))
    } catch (error) {
      console.warn('[useParticipantVolumes] Failed to persist volumes:', error)
    }
  }, [volumes])

  /**
   * Get the volume for a specific participant (0-200)
   */
  const getVolume = useCallback((participantId: string): number => {
    return volumes[participantId]?.volume ?? 100
  }, [volumes])

  /**
   * Set the volume for a specific participant (0-200)
   */
  const setVolume = useCallback((participantId: string, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(200, volume))
    setVolumes(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        volume: clampedVolume,
        muted: prev[participantId]?.muted ?? false
      }
    }))
  }, [])

  /**
   * Check if a participant is muted
   */
  const isMuted = useCallback((participantId: string): boolean => {
    return volumes[participantId]?.muted ?? false
  }, [volumes])

  /**
   * Toggle mute state for a participant
   */
  const toggleMute = useCallback((participantId: string) => {
    setVolumes(prev => ({
      ...prev,
      [participantId]: {
        volume: prev[participantId]?.volume ?? 100,
        muted: !(prev[participantId]?.muted ?? false)
      }
    }))
  }, [])

  /**
   * Set mute state explicitly for a participant
   */
  const setMuted = useCallback((participantId: string, muted: boolean) => {
    setVolumes(prev => ({
      ...prev,
      [participantId]: {
        volume: prev[participantId]?.volume ?? 100,
        muted
      }
    }))
  }, [])

  /**
   * Get the effective volume (0 if muted, otherwise the set volume)
   */
  const getEffectiveVolume = useCallback((participantId: string): number => {
    const state = volumes[participantId]
    if (!state) return 100
    return state.muted ? 0 : state.volume
  }, [volumes])

  /**
   * Reset a participant's volume to default (100, unmuted)
   */
  const resetVolume = useCallback((participantId: string) => {
    setVolumes(prev => {
      const newVolumes = { ...prev }
      delete newVolumes[participantId]
      return newVolumes
    })
  }, [])

  /**
   * Reset all participant volumes
   */
  const resetAll = useCallback(() => {
    setVolumes({})
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  return {
    getVolume,
    setVolume,
    isMuted,
    toggleMute,
    setMuted,
    getEffectiveVolume,
    resetVolume,
    resetAll,
    volumes
  }
}

export type { ParticipantVolumeState, StoredVolumes }
