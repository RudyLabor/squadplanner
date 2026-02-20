import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
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

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock Capacitor at globalThis level
const mockCapacitor = {
  isNativePlatform: vi.fn(() => true),
  getPlatform: vi.fn(() => 'ios'),
}

// Mock AppReview plugin
vi.mock('@capawesome/capacitor-app-review', () => ({
  AppReview: {
    requestReview: vi.fn().mockResolvedValue(undefined),
  },
}))

import {
  requestReviewIfAppropriate,
  canRequestReview,
  getRequestCountThisYear,
  useAppStoreReview,
} from '../useAppStoreReview'

describe('useAppStoreReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    ;(globalThis as any).Capacitor = mockCapacitor
    mockCapacitor.isNativePlatform.mockReturnValue(true)
    mockCapacitor.getPlatform.mockReturnValue('ios')
  })

  afterEach(() => {
    delete (globalThis as any).Capacitor
  })

  describe('canRequestReview', () => {
    it('returns true when on native with no prior requests', () => {
      expect(canRequestReview()).toBe(true)
    })

    it('returns false when not on native platform', () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      expect(canRequestReview()).toBe(false)
    })

    it('returns true when fewer than 3 requests in the past year', () => {
      const record = {
        timestamps: [Date.now() - 100_000, Date.now() - 50_000],
      }
      localStorageMock.setItem('squadplanner_review_requests', JSON.stringify(record))
      expect(canRequestReview()).toBe(true)
    })

    it('returns false when 3 requests already made this year', () => {
      const record = {
        timestamps: [
          Date.now() - 100_000,
          Date.now() - 50_000,
          Date.now() - 10_000,
        ],
      }
      localStorageMock.setItem('squadplanner_review_requests', JSON.stringify(record))
      expect(canRequestReview()).toBe(false)
    })

    it('ignores requests older than 1 year', () => {
      const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000
      const record = {
        timestamps: [twoYearsAgo, twoYearsAgo + 1000, twoYearsAgo + 2000],
      }
      localStorageMock.setItem('squadplanner_review_requests', JSON.stringify(record))
      expect(canRequestReview()).toBe(true)
    })
  })

  describe('getRequestCountThisYear', () => {
    it('returns 0 when no requests made', () => {
      expect(getRequestCountThisYear()).toBe(0)
    })

    it('counts only requests within the past year', () => {
      const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000
      const record = {
        timestamps: [twoYearsAgo, Date.now() - 1000, Date.now() - 500],
      }
      localStorageMock.setItem('squadplanner_review_requests', JSON.stringify(record))
      expect(getRequestCountThisYear()).toBe(2)
    })
  })

  describe('requestReviewIfAppropriate', () => {
    it('returns false on web platform', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      const result = await requestReviewIfAppropriate('session_completed')
      expect(result).toBe(false)
    })

    it('returns false when rate limited (3 requests already)', async () => {
      const record = {
        timestamps: [
          Date.now() - 100_000,
          Date.now() - 50_000,
          Date.now() - 10_000,
        ],
      }
      localStorageMock.setItem('squadplanner_review_requests', JSON.stringify(record))
      const result = await requestReviewIfAppropriate('level_up')
      expect(result).toBe(false)
    })

    it('records the request timestamp on success', async () => {
      const result = await requestReviewIfAppropriate('badge_earned')
      expect(result).toBe(true)

      // Verify localStorage was updated
      const setItemCalls = localStorageMock.setItem.mock.calls.filter(
        (c: string[]) => c[0] === 'squadplanner_review_requests'
      )
      expect(setItemCalls.length).toBeGreaterThanOrEqual(1)

      const saved = JSON.parse(setItemCalls[setItemCalls.length - 1][1])
      expect(saved.timestamps).toHaveLength(1)
      expect(saved.timestamps[0]).toBeGreaterThan(Date.now() - 5000)
    })

    it('accepts all valid trigger types', async () => {
      const triggers: Array<'session_completed' | 'level_up' | 'badge_earned'> = [
        'session_completed',
        'level_up',
        'badge_earned',
      ]

      for (const trigger of triggers) {
        localStorageMock.clear()
        const result = await requestReviewIfAppropriate(trigger)
        expect(result).toBe(true)
      }
    })
  })

  describe('useAppStoreReview hook', () => {
    it('exposes expected API', () => {
      const hook = useAppStoreReview()
      expect(typeof hook.requestReviewIfAppropriate).toBe('function')
      expect(typeof hook.canRequestReview).toBe('function')
      expect(typeof hook.getRequestCountThisYear).toBe('function')
      expect(typeof hook.isNativeApp).toBe('boolean')
    })

    it('reports isNativeApp correctly on native', () => {
      const hook = useAppStoreReview()
      expect(hook.isNativeApp).toBe(true)
    })

    it('reports isNativeApp as false on web', () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      // Need to re-call since isNativeApp is computed at call time
      const hook = useAppStoreReview()
      expect(hook.isNativeApp).toBe(false)
    })
  })
})
