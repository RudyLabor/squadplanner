import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../utils/sounds', () => ({
  playSound: vi.fn(),
  playSoundMaster: vi.fn(),
  stopSound: vi.fn(),
  stopAllSounds: vi.fn(),
  preloadSounds: vi.fn(),
  getSoundEnabled: vi.fn().mockReturnValue(true),
  setSoundEnabled: vi.fn(),
  getMasterVolume: vi.fn().mockReturnValue(0.5),
  setMasterVolume: vi.fn(),
}))

import { useSoundEffects } from '../useSoundEffects'
import {
  playSound,
  playSoundMaster,
  stopSound,
  stopAllSounds,
  setSoundEnabled,
  setMasterVolume,
} from '../../utils/sounds'

describe('useSoundEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initial state: isEnabled is true, volume is 0.5', () => {
    const { result } = renderHook(() => useSoundEffects())

    expect(result.current.isEnabled).toBe(true)
    expect(result.current.volume).toBe(0.5)
  })

  it('play calls playSoundMaster when enabled', () => {
    const { result } = renderHook(() => useSoundEffects())

    act(() => {
      result.current.play('click' as never)
    })

    expect(playSoundMaster).toHaveBeenCalledWith('click', 1)
  })

  it('play does not call playSoundMaster when disabled', () => {
    const { result } = renderHook(() => useSoundEffects())

    // Disable sound via toggleSound
    act(() => {
      result.current.toggleSound()
    })

    vi.clearAllMocks()

    act(() => {
      result.current.play('click' as never)
    })

    expect(playSoundMaster).not.toHaveBeenCalled()
  })

  it('playAt calls playSound with specific volume', () => {
    const { result } = renderHook(() => useSoundEffects())

    act(() => {
      result.current.playAt('click' as never, 0.8)
    })

    expect(playSound).toHaveBeenCalledWith('click', 0.8)
  })

  it('stop calls stopSound', () => {
    const { result } = renderHook(() => useSoundEffects())

    act(() => {
      result.current.stop('click' as never)
    })

    expect(stopSound).toHaveBeenCalledWith('click')
  })

  it('stopAll calls stopAllSounds', () => {
    const { result } = renderHook(() => useSoundEffects())

    act(() => {
      result.current.stopAll()
    })

    expect(stopAllSounds).toHaveBeenCalled()
  })

  it('toggleSound toggles enabled state', () => {
    const { result } = renderHook(() => useSoundEffects())

    expect(result.current.isEnabled).toBe(true)

    act(() => {
      result.current.toggleSound()
    })

    expect(result.current.isEnabled).toBe(false)
    expect(setSoundEnabled).toHaveBeenCalledWith(false)

    act(() => {
      result.current.toggleSound()
    })

    expect(result.current.isEnabled).toBe(true)
    expect(setSoundEnabled).toHaveBeenCalledWith(true)
  })

  it('setVolumeLevel clamps value between 0 and 1', () => {
    const { result } = renderHook(() => useSoundEffects())

    // Set volume above 1
    act(() => {
      result.current.setVolume(1.5)
    })
    expect(result.current.volume).toBe(1)
    expect(setMasterVolume).toHaveBeenCalledWith(1)

    // Set volume below 0
    act(() => {
      result.current.setVolume(-0.5)
    })
    expect(result.current.volume).toBe(0)
    expect(setMasterVolume).toHaveBeenCalledWith(0)

    // Set volume within range
    act(() => {
      result.current.setVolume(0.7)
    })
    expect(result.current.volume).toBe(0.7)
    expect(setMasterVolume).toHaveBeenCalledWith(0.7)
  })
})
