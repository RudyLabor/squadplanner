import { useCallback, useRef } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Sound preferences store ──────────────────────────────────────
interface SoundState {
  enabled: boolean
  volume: number
  setEnabled: (v: boolean) => void
  setVolume: (v: number) => void
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.5,
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) => set({ volume }),
    }),
    { name: 'squadplanner-sounds' }
  )
)

// ── Web Audio synth sounds (no external files needed) ────────────
type SoundName =
  | 'message-sent'
  | 'message-received'
  | 'notification'
  | 'rsvp-confirm'
  | 'call-join'
  | 'call-leave'
  | 'level-up'
  | 'achievement'
  | 'error'
  | 'click'
  | 'toggle'

let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  rampDown = true
) {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    }
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available
  }
}

function playChime(frequencies: number[], interval: number, duration: number, volume = 0.2) {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration, 'sine', volume), i * interval)
  })
}

const SOUNDS: Record<SoundName, () => void> = {
  'message-sent': () => playTone(880, 0.1, 'sine', 0.15),
  'message-received': () => playChime([660, 880], 80, 0.15, 0.12),
  'notification': () => playChime([523, 659, 784], 100, 0.2, 0.15),
  'rsvp-confirm': () => playChime([523, 659, 784, 1047], 80, 0.25, 0.18),
  'call-join': () => playChime([440, 554, 659], 120, 0.3, 0.2),
  'call-leave': () => playChime([659, 554, 440], 120, 0.3, 0.15),
  'level-up': () => playChime([523, 659, 784, 1047, 1319], 100, 0.4, 0.2),
  'achievement': () => playChime([784, 988, 1175, 1568], 80, 0.3, 0.2),
  'error': () => playTone(220, 0.3, 'sawtooth', 0.1),
  'click': () => playTone(1200, 0.05, 'sine', 0.08),
  'toggle': () => playTone(1000, 0.06, 'triangle', 0.1),
}

/**
 * Hook for playing UI sounds.
 * Respects user preferences (enabled/volume).
 *
 * @example
 * const { play } = useSound()
 * <button onClick={() => { play('click'); doAction() }}>Click</button>
 */
export function useSound() {
  const lastPlayedRef = useRef<Record<string, number>>({})

  const play = useCallback((name: SoundName, options?: { throttleMs?: number }) => {
    const { enabled, volume } = useSoundStore.getState()
    if (!enabled || volume === 0) return

    // Respect quiet hours
    try {
      const qh = JSON.parse(localStorage.getItem('squadplanner-quiet-hours') || '{}')
      if (qh?.state?.enabled) {
        const hour = new Date().getHours()
        const start = qh.state.startHour ?? 23
        const end = qh.state.endHour ?? 8
        const isQuiet = start > end
          ? (hour >= start || hour < end)
          : (hour >= start && hour < end)
        if (isQuiet) return
      }
    } catch {}

    // Throttle to prevent audio spam
    const throttle = options?.throttleMs ?? 100
    const now = Date.now()
    if (now - (lastPlayedRef.current[name] || 0) < throttle) return
    lastPlayedRef.current[name] = now

    // Play the sound
    SOUNDS[name]?.()
  }, [])

  return { play }
}

export default useSound
