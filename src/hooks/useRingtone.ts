import { useEffect, useRef, useCallback } from 'react'

// Singleton AudioContext to avoid multiple instances
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )()
  }
  return audioContext
}

// Generate a ringtone using Web Audio API
// This creates a classic phone-like ringtone sound
function createRingtoneOscillator(ctx: AudioContext, gainNode: GainNode): OscillatorNode[] {
  // Create two oscillators for a dual-tone ringtone (like a real phone)
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()

  // Classic phone ringtone frequencies (440Hz + 480Hz)
  osc1.frequency.value = 440
  osc2.frequency.value = 480

  osc1.type = 'sine'
  osc2.type = 'sine'

  // Connect oscillators to gain (volume control)
  osc1.connect(gainNode)
  osc2.connect(gainNode)

  return [osc1, osc2]
}

interface UseRingtoneReturn {
  play: () => void
  stop: () => void
  isPlaying: boolean
}

export function useRingtone(shouldPlay: boolean): UseRingtoneReturn {
  const isPlayingRef = useRef(false)
  const oscillatorsRef = useRef<OscillatorNode[]>([])
  const gainNodeRef = useRef<GainNode | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopRingtone = useCallback(() => {
    // Stop all oscillators
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        // Oscillator may already be stopped
      }
    })
    oscillatorsRef.current = []

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    isPlayingRef.current = false
  }, [])

  const playRingtone = useCallback(() => {
    if (isPlayingRef.current) return

    try {
      const ctx = getAudioContext()

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      isPlayingRef.current = true

      // Create gain node for volume control
      const gainNode = ctx.createGain()
      gainNode.connect(ctx.destination)
      gainNode.gain.value = 0.3 // 30% volume
      gainNodeRef.current = gainNode

      // Function to play one ring cycle
      const playRingCycle = () => {
        if (!isPlayingRef.current) return

        const oscillators = createRingtoneOscillator(ctx, gainNode)
        oscillatorsRef.current = oscillators

        // Start oscillators
        oscillators.forEach((osc) => osc.start())

        // Stop after 1 second (ring duration)
        timeoutRef.current = setTimeout(() => {
          oscillators.forEach((osc) => {
            try {
              osc.stop()
              osc.disconnect()
            } catch {
              // Ignore
            }
          })
          oscillatorsRef.current = []
        }, 1000)
      }

      // Play first ring immediately
      playRingCycle()

      // Repeat every 3 seconds (1s ring + 2s pause)
      intervalRef.current = setInterval(playRingCycle, 3000)

      // Also trigger vibration on devices that support it
      if ('vibrate' in navigator) {
        // Vibration pattern: ring for 1s, pause for 2s, repeat
        // Note: This needs to be triggered repeatedly as pattern length is limited
        const vibratePattern = () => {
          if (isPlayingRef.current) {
            navigator.vibrate([1000, 2000])
            setTimeout(vibratePattern, 3000)
          }
        }
        vibratePattern()
      }
    } catch (error) {
      console.warn('[Ringtone] Error playing ringtone:', error)
      isPlayingRef.current = false
    }
  }, [])

  // Auto-play/stop based on shouldPlay prop
  useEffect(() => {
    if (shouldPlay) {
      playRingtone()
    } else {
      stopRingtone()
    }

    return () => {
      stopRingtone()
    }
  }, [shouldPlay, playRingtone, stopRingtone])

  return {
    play: playRingtone,
    stop: stopRingtone,
    isPlaying: isPlayingRef.current,
  }
}

// Alternative: Play a notification sound (shorter, single tone)
export function playNotificationSound() {
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const gainNode = ctx.createGain()
    gainNode.connect(ctx.destination)
    gainNode.gain.value = 0.2

    const osc = ctx.createOscillator()
    osc.frequency.value = 880 // A5 note
    osc.type = 'sine'
    osc.connect(gainNode)

    // Fade out
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    osc.start()
    osc.stop(ctx.currentTime + 0.3)

    // Vibrate briefly
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
  } catch (error) {
    console.warn('[Sound] Error playing notification:', error)
  }
}
