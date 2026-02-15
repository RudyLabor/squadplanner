import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useParticipantVolumes } from '../useParticipantVolumes'

const STORAGE_KEY = 'squadplanner-participant-volumes'

describe('useParticipantVolumes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // ══════════════════════════════════════════════════════════════════════
  // Initialization
  // ══════════════════════════════════════════════════════════════════════
  describe('initialization', () => {
    it('initializes with empty volumes when localStorage is empty', () => {
      const { result } = renderHook(() => useParticipantVolumes())
      expect(result.current.volumes).toEqual({})
    })

    it('restores volumes from localStorage', () => {
      const savedVolumes = {
        'participant-1': { volume: 150, muted: false },
        'participant-2': { volume: 50, muted: true },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedVolumes))

      const { result } = renderHook(() => useParticipantVolumes())
      expect(result.current.volumes).toEqual(savedVolumes)
    })

    it('initializes with empty object on invalid JSON in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json')

      const { result } = renderHook(() => useParticipantVolumes())
      expect(result.current.volumes).toEqual({})
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // getVolume
  // ══════════════════════════════════════════════════════════════════════
  describe('getVolume', () => {
    it('returns 100 as default for unknown participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())
      expect(result.current.getVolume('unknown-id')).toBe(100)
    })

    it('returns the stored volume for a known participant', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ 'p-1': { volume: 75, muted: false } })
      )

      const { result } = renderHook(() => useParticipantVolumes())
      expect(result.current.getVolume('p-1')).toBe(75)
    })

    it('returns 100 when participant has muted but no volume set', () => {
      const { result } = renderHook(() => useParticipantVolumes())
      // No volume set - should default to 100
      expect(result.current.getVolume('p-1')).toBe(100)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // setVolume
  // ══════════════════════════════════════════════════════════════════════
  describe('setVolume', () => {
    it('sets volume for a participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 150)
      })

      expect(result.current.getVolume('p-1')).toBe(150)
    })

    it('clamps volume to minimum 0', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', -50)
      })

      expect(result.current.getVolume('p-1')).toBe(0)
    })

    it('clamps volume to maximum 200', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 300)
      })

      expect(result.current.getVolume('p-1')).toBe(200)
    })

    it('preserves muted state when setting volume', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setMuted('p-1', true)
      })

      act(() => {
        result.current.setVolume('p-1', 120)
      })

      expect(result.current.getVolume('p-1')).toBe(120)
      expect(result.current.isMuted('p-1')).toBe(true)
    })

    it('defaults muted to false for new participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('new-p', 80)
      })

      expect(result.current.isMuted('new-p')).toBe(false)
    })

    it('sets volume to exact 0', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 0)
      })

      expect(result.current.getVolume('p-1')).toBe(0)
    })

    it('sets volume to exact 200', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 200)
      })

      expect(result.current.getVolume('p-1')).toBe(200)
    })

    it('persists to localStorage after setting volume', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 75)
      })

      // useEffect runs asynchronously; check after act
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['p-1'].volume).toBe(75)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // isMuted
  // ══════════════════════════════════════════════════════════════════════
  describe('isMuted', () => {
    it('returns false as default for unknown participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())
      expect(result.current.isMuted('unknown')).toBe(false)
    })

    it('returns true when participant is muted', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ 'p-1': { volume: 100, muted: true } })
      )

      const { result } = renderHook(() => useParticipantVolumes())
      expect(result.current.isMuted('p-1')).toBe(true)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // toggleMute
  // ══════════════════════════════════════════════════════════════════════
  describe('toggleMute', () => {
    it('mutes an unmuted participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.toggleMute('p-1')
      })

      expect(result.current.isMuted('p-1')).toBe(true)
    })

    it('unmutes a muted participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.toggleMute('p-1') // mute
      })
      act(() => {
        result.current.toggleMute('p-1') // unmute
      })

      expect(result.current.isMuted('p-1')).toBe(false)
    })

    it('preserves volume when toggling mute', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 150)
      })
      act(() => {
        result.current.toggleMute('p-1')
      })

      expect(result.current.getVolume('p-1')).toBe(150)
      expect(result.current.isMuted('p-1')).toBe(true)
    })

    it('defaults volume to 100 for unknown participant when toggling', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.toggleMute('new-p')
      })

      expect(result.current.getVolume('new-p')).toBe(100)
      expect(result.current.isMuted('new-p')).toBe(true)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // setMuted
  // ══════════════════════════════════════════════════════════════════════
  describe('setMuted', () => {
    it('explicitly mutes a participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setMuted('p-1', true)
      })

      expect(result.current.isMuted('p-1')).toBe(true)
    })

    it('explicitly unmutes a participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setMuted('p-1', true)
      })
      act(() => {
        result.current.setMuted('p-1', false)
      })

      expect(result.current.isMuted('p-1')).toBe(false)
    })

    it('preserves volume when setting muted state', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 80)
      })
      act(() => {
        result.current.setMuted('p-1', true)
      })

      expect(result.current.getVolume('p-1')).toBe(80)
    })

    it('defaults volume to 100 for new participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setMuted('new-p', true)
      })

      expect(result.current.getVolume('new-p')).toBe(100)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // getEffectiveVolume
  // ══════════════════════════════════════════════════════════════════════
  describe('getEffectiveVolume', () => {
    it('returns 100 for unknown participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())
      expect(result.current.getEffectiveVolume('unknown')).toBe(100)
    })

    it('returns the set volume when not muted', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 75)
      })

      expect(result.current.getEffectiveVolume('p-1')).toBe(75)
    })

    it('returns 0 when participant is muted', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 150)
      })
      act(() => {
        result.current.setMuted('p-1', true)
      })

      expect(result.current.getEffectiveVolume('p-1')).toBe(0)
    })

    it('returns volume again after unmuting', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 130)
      })
      act(() => {
        result.current.setMuted('p-1', true)
      })
      expect(result.current.getEffectiveVolume('p-1')).toBe(0)

      act(() => {
        result.current.setMuted('p-1', false)
      })
      expect(result.current.getEffectiveVolume('p-1')).toBe(130)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // resetVolume
  // ══════════════════════════════════════════════════════════════════════
  describe('resetVolume', () => {
    it('removes a specific participant volume entry', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 150)
        result.current.setVolume('p-2', 50)
      })

      act(() => {
        result.current.resetVolume('p-1')
      })

      // p-1 returns default 100, p-2 untouched
      expect(result.current.getVolume('p-1')).toBe(100)
      expect(result.current.getVolume('p-2')).toBe(50)
    })

    it('resets muted state along with volume', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 80)
        result.current.setMuted('p-1', true)
      })

      act(() => {
        result.current.resetVolume('p-1')
      })

      expect(result.current.isMuted('p-1')).toBe(false)
      expect(result.current.getVolume('p-1')).toBe(100)
    })

    it('is a no-op for unknown participant', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.resetVolume('nonexistent')
      })

      expect(result.current.volumes).toEqual({})
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // resetAll
  // ══════════════════════════════════════════════════════════════════════
  describe('resetAll', () => {
    it('clears all participant volumes', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 150)
        result.current.setVolume('p-2', 50)
        result.current.setMuted('p-3', true)
      })

      act(() => {
        result.current.resetAll()
      })

      expect(result.current.volumes).toEqual({})
    })

    it('removes or empties localStorage entry', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 80)
      })

      act(() => {
        result.current.resetAll()
      })

      // resetAll calls localStorage.removeItem, but then the useEffect
      // persists the new empty volumes state as '{}'. Either behavior is acceptable.
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        expect(JSON.parse(stored)).toEqual({})
      }
    })

    it('handles localStorage errors in resetAll without throwing', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 80)
      })

      // Should not throw
      act(() => {
        result.current.resetAll()
      })

      expect(result.current.volumes).toEqual({})
      removeItemSpy.mockRestore()
    })

    it('all getters return defaults after resetAll', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 150)
        result.current.setMuted('p-1', true)
      })

      act(() => {
        result.current.resetAll()
      })

      expect(result.current.getVolume('p-1')).toBe(100)
      expect(result.current.isMuted('p-1')).toBe(false)
      expect(result.current.getEffectiveVolume('p-1')).toBe(100)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // localStorage persistence
  // ══════════════════════════════════════════════════════════════════════
  describe('localStorage persistence', () => {
    it('persists volumes on every change', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 80)
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['p-1'].volume).toBe(80)
    })

    it('handles localStorage write errors gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full')
      })

      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 80)
      })

      // Should not throw, but log a warning
      expect(warnSpy).toHaveBeenCalled()

      setItemSpy.mockRestore()
      warnSpy.mockRestore()
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // Multiple participants
  // ══════════════════════════════════════════════════════════════════════
  describe('multiple participants', () => {
    it('manages independent volumes for different participants', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 50)
        result.current.setVolume('p-2', 150)
        result.current.setVolume('p-3', 200)
      })

      expect(result.current.getVolume('p-1')).toBe(50)
      expect(result.current.getVolume('p-2')).toBe(150)
      expect(result.current.getVolume('p-3')).toBe(200)
    })

    it('manages independent mute states', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setMuted('p-1', true)
        result.current.setMuted('p-2', false)
      })

      expect(result.current.isMuted('p-1')).toBe(true)
      expect(result.current.isMuted('p-2')).toBe(false)
    })

    it('resetting one does not affect others', () => {
      const { result } = renderHook(() => useParticipantVolumes())

      act(() => {
        result.current.setVolume('p-1', 50)
        result.current.setVolume('p-2', 150)
      })

      act(() => {
        result.current.resetVolume('p-1')
      })

      expect(result.current.getVolume('p-1')).toBe(100) // reset to default
      expect(result.current.getVolume('p-2')).toBe(150) // untouched
    })
  })
})
