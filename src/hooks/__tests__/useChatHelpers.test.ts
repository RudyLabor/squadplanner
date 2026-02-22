import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRpc, mockSupabase } = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockSupabase = {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    rpc: mockRpc,
  }
  return { mockRpc, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

import {
  savePartyToStorage,
  getSavedPartyInfo,
  clearSavedParty,
  forceLeaveVoiceParty,
  PARTY_STORAGE_KEY,
} from '../useChatHelpers'

describe('useChatHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('savePartyToStorage', () => {
    it('saves correct JSON with timestamp', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      savePartyToStorage('channel-abc', 'user-1', 'TestUser')

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        PARTY_STORAGE_KEY,
        JSON.stringify({
          channelName: 'channel-abc',
          userId: 'user-1',
          username: 'TestUser',
          timestamp: now,
        })
      )

      vi.spyOn(Date, 'now').mockRestore()
    })
  })

  describe('getSavedPartyInfo', () => {
    it('returns parsed data when valid', () => {
      const now = Date.now()
      const data = {
        channelName: 'channel-abc',
        userId: 'user-1',
        username: 'TestUser',
        timestamp: now,
      }
      localStorageMock.setItem(PARTY_STORAGE_KEY, JSON.stringify(data))

      vi.spyOn(Date, 'now').mockReturnValue(now + 1000) // 1 second later, still valid

      const result = getSavedPartyInfo()

      expect(result).toEqual(data)

      vi.spyOn(Date, 'now').mockRestore()
    })

    it('returns null when no data', () => {
      const result = getSavedPartyInfo()

      expect(result).toBeNull()
    })

    it('returns null and clears when expired (> 5 min)', () => {
      const savedTimestamp = 1000000
      const data = {
        channelName: 'channel-abc',
        userId: 'user-1',
        username: 'TestUser',
        timestamp: savedTimestamp,
      }
      localStorageMock.setItem(PARTY_STORAGE_KEY, JSON.stringify(data))

      // 6 minutes later
      vi.spyOn(Date, 'now').mockReturnValue(savedTimestamp + 6 * 60 * 1000)

      const result = getSavedPartyInfo()

      expect(result).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PARTY_STORAGE_KEY)

      vi.spyOn(Date, 'now').mockRestore()
    })
  })

  describe('clearSavedParty', () => {
    it('removes item from localStorage', () => {
      localStorageMock.setItem(PARTY_STORAGE_KEY, 'some-data')

      clearSavedParty()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PARTY_STORAGE_KEY)
    })
  })

  describe('forceLeaveVoiceParty', () => {
    it('calls leaveChannel when connected', async () => {
      const mockLeaveChannel = vi.fn().mockResolvedValue(undefined)
      const storeGetter = vi.fn().mockReturnValue({
        isConnected: true,
        leaveChannel: mockLeaveChannel,
      })

      await forceLeaveVoiceParty(storeGetter)

      expect(mockLeaveChannel).toHaveBeenCalled()
      // clearSavedParty is also called
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PARTY_STORAGE_KEY)
    })

    it('calls RPC when not connected', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const storeGetter = vi.fn().mockReturnValue({
        isConnected: false,
        leaveChannel: vi.fn(),
      })

      await forceLeaveVoiceParty(storeGetter)

      expect(mockRpc).toHaveBeenCalledWith('leave_voice_party')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PARTY_STORAGE_KEY)
    })
  })
})
