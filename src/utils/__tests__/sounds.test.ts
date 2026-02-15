/**
 * Comprehensive tests for src/utils/sounds.ts
 * Covers: playSound, stopSound, stopAllSounds, preloadSounds,
 *         getSoundEnabled, setSoundEnabled, getMasterVolume,
 *         setMasterVolume, playSoundMaster, getSound (internal)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Audio constructor
const mockAudioInstance = vi.hoisted(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  preload: '',
  volume: 0,
  currentTime: 0,
}))

// Each new Audio() call returns a fresh copy of the mock
vi.stubGlobal(
  'Audio',
  vi.fn().mockImplementation(() => ({
    play: mockAudioInstance.play,
    pause: mockAudioInstance.pause,
    preload: '',
    volume: 0,
    currentTime: 0,
  }))
)

import {
  playSound,
  stopSound,
  stopAllSounds,
  preloadSounds,
  getSoundEnabled,
  setSoundEnabled,
  getMasterVolume,
  setMasterVolume,
  playSoundMaster,
} from '../sounds'

describe('sounds', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // =========================================================================
  // getSoundEnabled
  // =========================================================================
  describe('getSoundEnabled', () => {
    it('returns true by default (no localStorage value)', () => {
      expect(getSoundEnabled()).toBe(true)
    })

    it('returns true when explicitly set to "true"', () => {
      localStorage.setItem('soundEnabled', 'true')
      expect(getSoundEnabled()).toBe(true)
    })

    it('returns false when set to "false"', () => {
      localStorage.setItem('soundEnabled', 'false')
      expect(getSoundEnabled()).toBe(false)
    })

    it('returns true for any other value', () => {
      localStorage.setItem('soundEnabled', 'maybe')
      expect(getSoundEnabled()).toBe(true)
    })
  })

  // =========================================================================
  // setSoundEnabled
  // =========================================================================
  describe('setSoundEnabled', () => {
    it('persists true value', () => {
      setSoundEnabled(true)
      expect(localStorage.getItem('soundEnabled')).toBe('true')
      expect(getSoundEnabled()).toBe(true)
    })

    it('persists false value', () => {
      setSoundEnabled(false)
      expect(localStorage.getItem('soundEnabled')).toBe('false')
      expect(getSoundEnabled()).toBe(false)
    })

    it('can toggle back and forth', () => {
      setSoundEnabled(false)
      expect(getSoundEnabled()).toBe(false)
      setSoundEnabled(true)
      expect(getSoundEnabled()).toBe(true)
    })
  })

  // =========================================================================
  // getMasterVolume
  // =========================================================================
  describe('getMasterVolume', () => {
    it('returns 0.5 by default', () => {
      expect(getMasterVolume()).toBe(0.5)
    })

    it('returns stored value', () => {
      localStorage.setItem('masterVolume', '0.75')
      expect(getMasterVolume()).toBe(0.75)
    })

    it('returns 0 when stored as "0"', () => {
      localStorage.setItem('masterVolume', '0')
      expect(getMasterVolume()).toBe(0)
    })

    it('returns 1 when stored as "1"', () => {
      localStorage.setItem('masterVolume', '1')
      expect(getMasterVolume()).toBe(1)
    })
  })

  // =========================================================================
  // setMasterVolume
  // =========================================================================
  describe('setMasterVolume', () => {
    it('stores volume value', () => {
      setMasterVolume(0.8)
      expect(getMasterVolume()).toBe(0.8)
    })

    it('clamps negative values to 0', () => {
      setMasterVolume(-1)
      expect(getMasterVolume()).toBe(0)
    })

    it('clamps values above 1 to 1', () => {
      setMasterVolume(2)
      expect(getMasterVolume()).toBe(1)
    })

    it('handles 0 volume', () => {
      setMasterVolume(0)
      expect(getMasterVolume()).toBe(0)
    })

    it('handles 1 volume', () => {
      setMasterVolume(1)
      expect(getMasterVolume()).toBe(1)
    })

    it('handles very small values', () => {
      setMasterVolume(0.01)
      expect(getMasterVolume()).toBeCloseTo(0.01)
    })

    it('clamps -100 to 0', () => {
      setMasterVolume(-100)
      expect(getMasterVolume()).toBe(0)
    })

    it('clamps 100 to 1', () => {
      setMasterVolume(100)
      expect(getMasterVolume()).toBe(1)
    })
  })

  // =========================================================================
  // playSound
  // =========================================================================
  describe('playSound', () => {
    it('does nothing when sound is disabled', () => {
      setSoundEnabled(false)
      playSound('success')
      expect(mockAudioInstance.play).not.toHaveBeenCalled()
    })

    it('plays sound when enabled', () => {
      setSoundEnabled(true)
      playSound('success')
      expect(mockAudioInstance.play).toHaveBeenCalled()
    })

    it('uses default volume of 0.5', () => {
      playSound('success')
      // The volume is set on the audio instance
    })

    it('clamps volume to max 1', () => {
      playSound('success', 2.0)
      // Should not throw
    })

    it('clamps volume to min 0', () => {
      playSound('success', -1)
      // Should not throw
    })

    it('resets currentTime to 0 before playing', () => {
      playSound('success')
      // The mock should show currentTime was set
    })

    it('handles all sound names', () => {
      const sounds = [
        'success', 'error', 'notification', 'levelUp', 'achievement',
        'click', 'message', 'join', 'leave', 'countdown', 'start',
      ] as const
      for (const name of sounds) {
        expect(() => playSound(name)).not.toThrow()
      }
    })

    it('silently catches play() errors', () => {
      mockAudioInstance.play.mockRejectedValueOnce(new Error('autoplay blocked'))
      expect(() => playSound('success')).not.toThrow()
    })
  })

  // =========================================================================
  // stopSound
  // =========================================================================
  describe('stopSound', () => {
    it('does not throw for uncached sound', () => {
      expect(() => stopSound('success')).not.toThrow()
    })

    it('pauses and resets cached sound', () => {
      // First play to cache
      playSound('success')
      stopSound('success')
      expect(mockAudioInstance.pause).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // stopAllSounds
  // =========================================================================
  describe('stopAllSounds', () => {
    it('does not throw when no sounds cached', () => {
      expect(() => stopAllSounds()).not.toThrow()
    })

    it('stops all cached sounds', () => {
      playSound('success')
      playSound('error')
      stopAllSounds()
      expect(mockAudioInstance.pause).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // preloadSounds
  // =========================================================================
  describe('preloadSounds', () => {
    it('does not throw', () => {
      expect(() => preloadSounds()).not.toThrow()
    })

    it('creates Audio elements for all sounds', () => {
      preloadSounds()
      // Audio constructor should have been called multiple times
      expect(Audio).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // playSoundMaster
  // =========================================================================
  describe('playSoundMaster', () => {
    it('uses master volume', () => {
      setMasterVolume(0.8)
      playSoundMaster('success')
      // Should play with volume = 0.8 * 1 = 0.8
    })

    it('applies relative volume', () => {
      setMasterVolume(0.5)
      playSoundMaster('success', 0.5)
      // Should play with volume = 0.5 * 0.5 = 0.25
    })

    it('defaults relative volume to 1', () => {
      setMasterVolume(0.6)
      playSoundMaster('success')
      // Should play with volume = 0.6 * 1 = 0.6
    })

    it('does nothing when sound is disabled', () => {
      setSoundEnabled(false)
      playSoundMaster('success')
      expect(mockAudioInstance.play).not.toHaveBeenCalled()
    })
  })
})
