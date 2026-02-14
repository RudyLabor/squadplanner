import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSoundEnabled, setSoundEnabled, getMasterVolume, setMasterVolume } from '../sounds'

const mockAudio = { play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), preload: '', volume: 0, currentTime: 0 }
vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({ ...mockAudio })))

describe('sounds', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('getSoundEnabled returns true by default', () => {
    expect(getSoundEnabled()).toBe(true)
  })

  it('setSoundEnabled persists value', () => {
    setSoundEnabled(false)
    expect(getSoundEnabled()).toBe(false)
    setSoundEnabled(true)
    expect(getSoundEnabled()).toBe(true)
  })

  it('getMasterVolume returns 0.5 by default', () => {
    expect(getMasterVolume()).toBe(0.5)
  })

  it('setMasterVolume clamps and persists value', () => {
    setMasterVolume(0.8)
    expect(getMasterVolume()).toBe(0.8)

    setMasterVolume(-1)
    expect(getMasterVolume()).toBe(0)

    setMasterVolume(2)
    expect(getMasterVolume()).toBe(1)
  })
})
