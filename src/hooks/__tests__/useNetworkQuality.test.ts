import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
// LIVEKIT REMOVED: Using mock constants for tests (matches source string values)
const ConnectionQuality = {
  Excellent: 'excellent',
  Good: 'good',
  Poor: 'poor',
  Lost: 'lost',
  Unknown: 'unknown',
} as const

import {
  useNetworkQualityStore,
  mapLiveKitQualityToLevel,
  AUDIO_PROFILES,
  type NetworkQualityLevel,
} from '../useNetworkQuality'

describe('mapLiveKitQualityToLevel', () => {
  it('maps Excellent to excellent', () => {
    expect(mapLiveKitQualityToLevel(ConnectionQuality.Excellent)).toBe('excellent')
  })

  it('maps Good to good', () => {
    expect(mapLiveKitQualityToLevel(ConnectionQuality.Good)).toBe('good')
  })

  it('maps Poor to poor', () => {
    expect(mapLiveKitQualityToLevel(ConnectionQuality.Poor)).toBe('poor')
  })

  it('maps Lost to poor', () => {
    expect(mapLiveKitQualityToLevel(ConnectionQuality.Lost)).toBe('poor')
  })

  it('maps Unknown to unknown', () => {
    expect(mapLiveKitQualityToLevel(ConnectionQuality.Unknown)).toBe('unknown')
  })
})

describe('useNetworkQualityStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    act(() => {
      useNetworkQualityStore.setState({
        localQuality: 'unknown',
        localQualityScore: 0,
        remoteQuality: 'unknown',
        remoteQualityScore: 0,
        currentAudioProfile: AUDIO_PROFILES.good,
        qualityHistory: [],
        lastQualityChange: 0,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useNetworkQualityStore.getState()
    expect(state.localQuality).toBe('unknown')
    expect(state.localQualityScore).toBe(0)
    expect(state.remoteQuality).toBe('unknown')
    expect(state.remoteQualityScore).toBe(0)
    expect(state.currentAudioProfile).toEqual(AUDIO_PROFILES.good)
    expect(state.qualityHistory).toEqual([])
    expect(state.lastQualityChange).toBe(0)
  })

  describe('updateQuality', () => {
    it('sets scores and updates history', () => {
      act(() => {
        useNetworkQualityStore
          .getState()
          .updateQuality(ConnectionQuality.Good, ConnectionQuality.Excellent)
      })

      const state = useNetworkQualityStore.getState()
      expect(state.localQualityScore).toBe(2) // Good = 2
      expect(state.remoteQualityScore).toBe(1) // Excellent = 1
      expect(state.qualityHistory).toEqual([2])
      expect(state.remoteQuality).toBe('excellent')
    })

    it('changes quality level when MIN_QUALITY_CHANGE_INTERVAL has passed', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10000)

      let result: NetworkQualityLevel | null
      act(() => {
        result = useNetworkQualityStore
          .getState()
          .updateQuality(ConnectionQuality.Excellent, ConnectionQuality.Excellent)
      })

      const state = useNetworkQualityStore.getState()
      expect(state.localQuality).toBe('excellent')
      expect(state.currentAudioProfile).toEqual(AUDIO_PROFILES.excellent)
      expect(state.lastQualityChange).toBe(10000)
      expect(result!).toBe('excellent')
    })

    it('does NOT change level within MIN_QUALITY_CHANGE_INTERVAL', () => {
      // First update: set quality to excellent at time 10000
      vi.spyOn(Date, 'now').mockReturnValue(10000)
      act(() => {
        useNetworkQualityStore
          .getState()
          .updateQuality(ConnectionQuality.Excellent, ConnectionQuality.Excellent)
      })
      expect(useNetworkQualityStore.getState().localQuality).toBe('excellent')

      // Second update: try to change to poor at time 12000 (only 2000ms later, < 5000ms)
      vi.spyOn(Date, 'now').mockReturnValue(12000)
      let result: NetworkQualityLevel | null
      act(() => {
        result = useNetworkQualityStore
          .getState()
          .updateQuality(ConnectionQuality.Poor, ConnectionQuality.Poor)
      })

      const state = useNetworkQualityStore.getState()
      expect(state.localQuality).toBe('excellent')
      expect(state.lastQualityChange).toBe(10000)
      expect(result!).toBeNull()
    })

    it('returns new level when changed, null when not', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10000)
      let result1: NetworkQualityLevel | null
      act(() => {
        result1 = useNetworkQualityStore
          .getState()
          .updateQuality(ConnectionQuality.Excellent, ConnectionQuality.Excellent)
      })
      expect(result1!).toBe('excellent')

      // Second call: within interval, should return null
      vi.spyOn(Date, 'now').mockReturnValue(12000)
      let result2: NetworkQualityLevel | null
      act(() => {
        result2 = useNetworkQualityStore
          .getState()
          .updateQuality(ConnectionQuality.Poor, ConnectionQuality.Poor)
      })
      expect(result2!).toBeNull()
    })

    it('caps quality history at 5 samples', () => {
      vi.spyOn(Date, 'now').mockReturnValue(100000)

      act(() => {
        useNetworkQualityStore.getState().updateQuality(ConnectionQuality.Excellent)
        useNetworkQualityStore.getState().updateQuality(ConnectionQuality.Good)
        useNetworkQualityStore.getState().updateQuality(ConnectionQuality.Good)
        useNetworkQualityStore.getState().updateQuality(ConnectionQuality.Poor)
        useNetworkQualityStore.getState().updateQuality(ConnectionQuality.Poor)
        useNetworkQualityStore.getState().updateQuality(ConnectionQuality.Excellent) // 6th sample
      })

      const state = useNetworkQualityStore.getState()
      expect(state.qualityHistory).toHaveLength(5)
    })
  })

  describe('resetQuality', () => {
    it('resets all state to defaults', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10000)
      act(() => {
        useNetworkQualityStore
          .getState()
          .updateQuality(ConnectionQuality.Excellent, ConnectionQuality.Good)
      })

      act(() => {
        useNetworkQualityStore.getState().resetQuality()
      })

      const state = useNetworkQualityStore.getState()
      expect(state.localQuality).toBe('unknown')
      expect(state.localQualityScore).toBe(0)
      expect(state.remoteQuality).toBe('unknown')
      expect(state.remoteQualityScore).toBe(0)
      expect(state.currentAudioProfile).toEqual(AUDIO_PROFILES.good)
      expect(state.qualityHistory).toEqual([])
      expect(state.lastQualityChange).toBe(0)
    })
  })

  describe('getStableQuality', () => {
    it('returns unknown with empty history', () => {
      const result = useNetworkQualityStore.getState().getStableQuality()
      expect(result).toBe('unknown')
    })

    it('returns average-based quality from history', () => {
      act(() => {
        useNetworkQualityStore.setState({ qualityHistory: [1, 2, 1] })
      })
      const result = useNetworkQualityStore.getState().getStableQuality()
      expect(result).toBe('excellent')
    })

    it('returns poor quality for high average scores', () => {
      act(() => {
        useNetworkQualityStore.setState({ qualityHistory: [4, 5, 5] })
      })
      const result = useNetworkQualityStore.getState().getStableQuality()
      expect(result).toBe('poor')
    })
  })
})
