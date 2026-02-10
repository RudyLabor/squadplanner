import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

import {
  useNetworkQualityStore,
  mapAgoraQualityToLevel,
  AUDIO_PROFILES,
  type NetworkQualityLevel,
} from '../useNetworkQuality'

describe('mapAgoraQualityToLevel', () => {
  it('maps 0 to unknown', () => {
    expect(mapAgoraQualityToLevel(0)).toBe('unknown')
  })

  it('maps 1 to excellent', () => {
    expect(mapAgoraQualityToLevel(1)).toBe('excellent')
  })

  it('maps 2 to excellent', () => {
    expect(mapAgoraQualityToLevel(2)).toBe('excellent')
  })

  it('maps 3 to good', () => {
    expect(mapAgoraQualityToLevel(3)).toBe('good')
  })

  it('maps 4 to medium', () => {
    expect(mapAgoraQualityToLevel(4)).toBe('medium')
  })

  it('maps 5 to poor', () => {
    expect(mapAgoraQualityToLevel(5)).toBe('poor')
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
        useNetworkQualityStore.getState().updateQuality(3, 2)
      })

      const state = useNetworkQualityStore.getState()
      expect(state.localQualityScore).toBe(3)
      expect(state.remoteQualityScore).toBe(2)
      expect(state.qualityHistory).toEqual([3])
      expect(state.remoteQuality).toBe('excellent')
    })

    it('changes quality level when MIN_QUALITY_CHANGE_INTERVAL has passed', () => {
      // lastQualityChange is 0 (epoch), so any Date.now() > 5000 will allow change
      vi.spyOn(Date, 'now').mockReturnValue(10000)

      let result: NetworkQualityLevel | null
      act(() => {
        result = useNetworkQualityStore.getState().updateQuality(1, 1)
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
        useNetworkQualityStore.getState().updateQuality(1, 1)
      })
      expect(useNetworkQualityStore.getState().localQuality).toBe('excellent')

      // Second update: try to change to poor at time 12000 (only 2000ms later, < 5000ms)
      vi.spyOn(Date, 'now').mockReturnValue(12000)
      let result: NetworkQualityLevel | null
      act(() => {
        result = useNetworkQualityStore.getState().updateQuality(5, 5)
      })

      const state = useNetworkQualityStore.getState()
      // Quality level should NOT have changed
      expect(state.localQuality).toBe('excellent')
      expect(state.lastQualityChange).toBe(10000)
      expect(result!).toBeNull()
    })

    it('returns new level when changed, null when not', () => {
      // First call: lastQualityChange is 0, so interval has passed
      vi.spyOn(Date, 'now').mockReturnValue(10000)
      let result1: NetworkQualityLevel | null
      act(() => {
        result1 = useNetworkQualityStore.getState().updateQuality(1, 1)
      })
      expect(result1!).toBe('excellent')

      // Second call: within interval, should return null
      vi.spyOn(Date, 'now').mockReturnValue(12000)
      let result2: NetworkQualityLevel | null
      act(() => {
        result2 = useNetworkQualityStore.getState().updateQuality(5, 5)
      })
      expect(result2!).toBeNull()
    })

    it('caps quality history at 5 samples', () => {
      vi.spyOn(Date, 'now').mockReturnValue(100000)

      act(() => {
        useNetworkQualityStore.getState().updateQuality(1, 1)
        useNetworkQualityStore.getState().updateQuality(2, 2)
        useNetworkQualityStore.getState().updateQuality(3, 3)
        useNetworkQualityStore.getState().updateQuality(4, 4)
        useNetworkQualityStore.getState().updateQuality(5, 5)
        useNetworkQualityStore.getState().updateQuality(1, 1) // 6th sample
      })

      const state = useNetworkQualityStore.getState()
      expect(state.qualityHistory).toHaveLength(5)
      // Should have dropped the first sample (1) and kept [2, 3, 4, 5, 1]
      expect(state.qualityHistory).toEqual([2, 3, 4, 5, 1])
    })
  })

  describe('resetQuality', () => {
    it('resets all state to defaults', () => {
      // First set some non-default state
      vi.spyOn(Date, 'now').mockReturnValue(10000)
      act(() => {
        useNetworkQualityStore.getState().updateQuality(1, 2)
      })

      // Now reset
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
      // Set history to [1, 2, 3] -> average 2 -> rounds to 2 -> 'excellent'
      act(() => {
        useNetworkQualityStore.setState({ qualityHistory: [1, 2, 3] })
      })
      const result = useNetworkQualityStore.getState().getStableQuality()
      expect(result).toBe('excellent')
    })

    it('returns poor quality for high average scores', () => {
      // Set history to [4, 5, 5] -> average ~4.67 -> rounds to 5 -> 'poor'
      act(() => {
        useNetworkQualityStore.setState({ qualityHistory: [4, 5, 5] })
      })
      const result = useNetworkQualityStore.getState().getStableQuality()
      expect(result).toBe('poor')
    })
  })
})
