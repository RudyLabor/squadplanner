import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useSoundStore } from '../useSound'

describe('useSoundStore', () => {
  beforeEach(() => {
    act(() => {
      useSoundStore.setState({
        enabled: true,
        volume: 0.5,
      })
    })
  })

  describe('default state', () => {
    it('defaults to enabled', () => {
      expect(useSoundStore.getState().enabled).toBe(true)
    })

    it('defaults volume to 0.5', () => {
      expect(useSoundStore.getState().volume).toBe(0.5)
    })
  })

  describe('setEnabled', () => {
    it('disables sounds', () => {
      act(() => {
        useSoundStore.getState().setEnabled(false)
      })
      expect(useSoundStore.getState().enabled).toBe(false)
    })

    it('enables sounds', () => {
      act(() => {
        useSoundStore.getState().setEnabled(false)
        useSoundStore.getState().setEnabled(true)
      })
      expect(useSoundStore.getState().enabled).toBe(true)
    })
  })

  describe('setVolume', () => {
    it('updates volume', () => {
      act(() => {
        useSoundStore.getState().setVolume(0.8)
      })
      expect(useSoundStore.getState().volume).toBe(0.8)
    })

    it('can set volume to 0 (mute)', () => {
      act(() => {
        useSoundStore.getState().setVolume(0)
      })
      expect(useSoundStore.getState().volume).toBe(0)
    })

    it('can set volume to 1 (max)', () => {
      act(() => {
        useSoundStore.getState().setVolume(1)
      })
      expect(useSoundStore.getState().volume).toBe(1)
    })
  })
})
