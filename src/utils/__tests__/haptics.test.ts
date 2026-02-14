import { describe, it, expect, vi, beforeEach } from 'vitest'
import { haptic, getHapticEnabled, setHapticEnabled, isHapticSupported } from '../haptics'

describe('haptics', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { vibrate: vi.fn() })
    localStorage.clear()
  })

  it('haptic.light calls vibrate(10)', () => {
    haptic.light()
    expect(navigator.vibrate).toHaveBeenCalledWith(10)
  })

  it('haptic.medium calls vibrate(25)', () => {
    haptic.medium()
    expect(navigator.vibrate).toHaveBeenCalledWith(25)
  })

  it('haptic.error calls vibrate with pattern', () => {
    haptic.error()
    expect(navigator.vibrate).toHaveBeenCalledWith([50, 100, 50])
  })

  it('getHapticEnabled returns true by default', () => {
    expect(getHapticEnabled()).toBe(true)
  })

  it('setHapticEnabled persists to localStorage', () => {
    setHapticEnabled(false)
    expect(getHapticEnabled()).toBe(false)
  })

  it('isHapticSupported checks vibrate in navigator', () => {
    expect(isHapticSupported()).toBe(true)
  })
})
