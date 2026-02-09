/**
 * Sound Effects Utilities for Squad Planner
 *
 * Manages audio playback for UI interactions and notifications.
 * Sounds are preloaded for instant playback.
 *
 * Required sound files in public/sounds/:
 * - success.mp3      - Positive action completed (RSVP confirmed, save successful)
 * - error.mp3        - Error occurred (validation failed, action blocked)
 * - notification.mp3 - New notification received
 * - level-up.mp3     - User leveled up or tier increased
 * - achievement.mp3  - Achievement unlocked
 * - click.mp3        - Button click or selection
 * - message.mp3      - New message received in chat
 * - join.mp3         - Someone joined the party/session
 * - leave.mp3        - Someone left the party/session
 * - countdown.mp3    - Countdown tick (3, 2, 1...)
 * - start.mp3        - Session/game starting
 *
 * Recommended: Use short (< 1 second), high-quality MP3 or WAV files
 * Free sound resources: https://freesound.org, https://mixkit.co/free-sound-effects/
 */

type SoundName =
  | 'success'
  | 'error'
  | 'notification'
  | 'levelUp'
  | 'achievement'
  | 'click'
  | 'message'
  | 'join'
  | 'leave'
  | 'countdown'
  | 'start'

// Sound cache to avoid recreating Audio objects
const soundCache: Map<SoundName, HTMLAudioElement> = new Map()

// Sound file paths mapping
const soundPaths: Record<SoundName, string> = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  notification: '/sounds/notification.mp3',
  levelUp: '/sounds/level-up.mp3',
  achievement: '/sounds/achievement.mp3',
  click: '/sounds/click.mp3',
  message: '/sounds/message.mp3',
  join: '/sounds/join.mp3',
  leave: '/sounds/leave.mp3',
  countdown: '/sounds/countdown.mp3',
  start: '/sounds/start.mp3',
}

/**
 * Get or create an Audio element for the specified sound
 */
const getSound = (name: SoundName): HTMLAudioElement | null => {
  // Return cached sound if available
  if (soundCache.has(name)) {
    return soundCache.get(name)!
  }

  // Create new Audio element
  try {
    const audio = new Audio(soundPaths[name])
    audio.preload = 'auto'
    soundCache.set(name, audio)
    return audio
  } catch {
    console.warn(`Failed to load sound: ${name}`)
    return null
  }
}

/**
 * Preload all sounds for instant playback
 * Call this early in the app lifecycle (e.g., after user interaction)
 */
export const preloadSounds = (): void => {
  Object.keys(soundPaths).forEach((name) => {
    getSound(name as SoundName)
  })
}

/**
 * Play a sound effect
 * @param name - The sound to play
 * @param volume - Volume level (0 to 1), defaults to 0.5
 */
export const playSound = (name: SoundName, volume = 0.5): void => {
  if (!getSoundEnabled()) return

  const sound = getSound(name)
  if (!sound) return

  try {
    sound.volume = Math.max(0, Math.min(1, volume))
    sound.currentTime = 0
    sound.play().catch(() => {
      // Ignore autoplay errors - browsers require user interaction first
    })
  } catch {
    // Ignore playback errors
  }
}

/**
 * Stop a currently playing sound
 */
export const stopSound = (name: SoundName): void => {
  const sound = soundCache.get(name)
  if (sound) {
    sound.pause()
    sound.currentTime = 0
  }
}

/**
 * Stop all currently playing sounds
 */
export const stopAllSounds = (): void => {
  soundCache.forEach((sound) => {
    sound.pause()
    sound.currentTime = 0
  })
}

/** Check if sound effects are enabled in user preferences */
export const getSoundEnabled = (): boolean => {
  return localStorage.getItem('soundEnabled') !== 'false'
}

/** Set sound effects preference */
export const setSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem('soundEnabled', String(enabled))
}

/** Get the current master volume (0-1) */
export const getMasterVolume = (): number => {
  const stored = localStorage.getItem('masterVolume')
  return stored ? parseFloat(stored) : 0.5
}

/** Set the master volume (0-1) */
export const setMasterVolume = (volume: number): void => {
  localStorage.setItem('masterVolume', String(Math.max(0, Math.min(1, volume))))
}

/**
 * Play sound with master volume applied
 */
export const playSoundMaster = (name: SoundName, relativeVolume = 1): void => {
  const masterVolume = getMasterVolume()
  playSound(name, masterVolume * relativeVolume)
}
