import { useCallback, useEffect, useState } from 'react'
import {
  playSound,
  playSoundMaster,
  stopSound,
  stopAllSounds,
  preloadSounds,
  getSoundEnabled,
  setSoundEnabled,
  getMasterVolume,
  setMasterVolume,
} from '../utils/sounds'

type SoundName = Parameters<typeof playSound>[0]

/**
 * Hook for sound effects with preference management
 *
 * @example
 * ```tsx
 * function AchievementUnlock() {
 *   const { play } = useSoundEffects()
 *
 *   const handleUnlock = () => {
 *     play('achievement')
 *     // ... show achievement UI
 *   }
 *
 *   return <button onClick={handleUnlock}>Unlock!</button>
 * }
 * ```
 */
export function useSoundEffects() {
  const [enabled, setEnabled] = useState(getSoundEnabled)
  const [volume, setVolume] = useState(getMasterVolume)

  // Preload sounds on mount
  useEffect(() => {
    preloadSounds()
  }, [])

  // Sync with localStorage changes (e.g., from Settings page)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'soundEnabled') {
        setEnabled(e.newValue !== 'false')
      }
      if (e.key === 'masterVolume') {
        setVolume(parseFloat(e.newValue || '0.5'))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  /**
   * Play a sound effect
   */
  const play = useCallback(
    (name: SoundName, relativeVolume = 1) => {
      if (enabled) {
        playSoundMaster(name, relativeVolume)
      }
    },
    [enabled]
  )

  /**
   * Play a sound at a specific volume (ignoring master volume)
   */
  const playAt = useCallback(
    (name: SoundName, specificVolume: number) => {
      if (enabled) {
        playSound(name, specificVolume)
      }
    },
    [enabled]
  )

  /**
   * Stop a specific sound
   */
  const stop = useCallback((name: SoundName) => {
    stopSound(name)
  }, [])

  /**
   * Stop all sounds
   */
  const stopAll = useCallback(() => {
    stopAllSounds()
  }, [])

  /**
   * Toggle sound effects on/off
   */
  const toggleSound = useCallback(() => {
    const newValue = !enabled
    setEnabled(newValue)
    setSoundEnabled(newValue)
    // Play a sound when enabling
    if (newValue) {
      playSound('click', 0.5)
    }
  }, [enabled])

  /**
   * Set sound effects preference
   */
  const setSound = useCallback((value: boolean) => {
    setEnabled(value)
    setSoundEnabled(value)
    if (value) {
      playSound('click', 0.5)
    }
  }, [])

  /**
   * Set the master volume
   */
  const setVolumeLevel = useCallback((level: number) => {
    const clamped = Math.max(0, Math.min(1, level))
    setVolume(clamped)
    setMasterVolume(clamped)
  }, [])

  return {
    /** Play a sound effect */
    play,
    /** Play a sound at specific volume */
    playAt,
    /** Stop a specific sound */
    stop,
    /** Stop all sounds */
    stopAll,
    /** Whether sound effects are enabled */
    isEnabled: enabled,
    /** Toggle sound effects on/off */
    toggleSound,
    /** Set sound effects preference */
    setSound,
    /** Current master volume (0-1) */
    volume,
    /** Set master volume (0-1) */
    setVolume: setVolumeLevel,
  }
}

export default useSoundEffects
