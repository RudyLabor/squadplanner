import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Must import after mocks are set up
import {
  queryClient,
  queryKeys,
  prefetchRoute,
  prefetchSquadDetail,
  prefetchSessionDetail,
  initQueryPersistence,
} from '../queryClient'

describe('queryClient', () => {
  describe('QueryClient default options', () => {
    it('has staleTime of 30 seconds', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.staleTime).toBe(30 * 1000)
    })

    it('has gcTime of 10 minutes', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.gcTime).toBe(10 * 60 * 1000)
    })

    it('has retry set to 1 for queries', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.retry).toBe(1)
    })

    it('has retry set to 1 for mutations', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.mutations?.retry).toBe(1)
    })

    it('has refetchOnWindowFocus disabled', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
    })

    it('has refetchOnMount enabled', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.refetchOnMount).toBe(true)
    })

    it('has refetchOnReconnect enabled', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.refetchOnReconnect).toBe(true)
    })

    it('retryDelay uses exponential backoff capped at 10s', () => {
      const defaults = queryClient.getDefaultOptions()
      const retryDelay = defaults.queries?.retryDelay as (attemptIndex: number) => number
      expect(typeof retryDelay).toBe('function')
      // attempt 0 -> min(1000 * 2^0, 10000) = 1000
      expect(retryDelay(0)).toBe(1000)
      // attempt 1 -> min(1000 * 2^1, 10000) = 2000
      expect(retryDelay(1)).toBe(2000)
      // attempt 2 -> min(1000 * 2^2, 10000) = 4000
      expect(retryDelay(2)).toBe(4000)
      // attempt 3 -> min(1000 * 2^3, 10000) = 8000
      expect(retryDelay(3)).toBe(8000)
      // attempt 4 -> min(1000 * 2^4, 10000) = 10000 (capped)
      expect(retryDelay(4)).toBe(10000)
      // attempt 5 -> min(1000 * 2^5, 10000) = 10000 (still capped)
      expect(retryDelay(5)).toBe(10000)
    })
  })

  describe('queryKeys factory', () => {
    describe('squads', () => {
      it('squads.all returns base key', () => {
        expect(queryKeys.squads.all).toEqual(['squads'])
      })

      it('squads.lists() appends list', () => {
        expect(queryKeys.squads.lists()).toEqual(['squads', 'list'])
      })

      it('squads.list() returns same as lists()', () => {
        expect(queryKeys.squads.list()).toEqual(['squads', 'list'])
      })

      it('squads.details() appends detail', () => {
        expect(queryKeys.squads.details()).toEqual(['squads', 'detail'])
      })

      it('squads.detail(id) appends specific id', () => {
        expect(queryKeys.squads.detail('abc-123')).toEqual(['squads', 'detail', 'abc-123'])
      })

      it('squads.members(squadId) appends members to detail', () => {
        expect(queryKeys.squads.members('squad-1')).toEqual([
          'squads',
          'detail',
          'squad-1',
          'members',
        ])
      })
    })

    describe('sessions', () => {
      it('sessions.all returns base key', () => {
        expect(queryKeys.sessions.all).toEqual(['sessions'])
      })

      it('sessions.lists() appends list', () => {
        expect(queryKeys.sessions.lists()).toEqual(['sessions', 'list'])
      })

      it('sessions.list() without squadId returns just list', () => {
        expect(queryKeys.sessions.list()).toEqual(['sessions', 'list'])
      })

      it('sessions.list(squadId) includes squadId filter', () => {
        expect(queryKeys.sessions.list('squad-1')).toEqual([
          'sessions',
          'list',
          { squadId: 'squad-1' },
        ])
      })

      it('sessions.upcoming() appends upcoming', () => {
        expect(queryKeys.sessions.upcoming()).toEqual(['sessions', 'upcoming'])
      })

      it('sessions.details() appends detail', () => {
        expect(queryKeys.sessions.details()).toEqual(['sessions', 'detail'])
      })

      it('sessions.detail(id) appends specific id', () => {
        expect(queryKeys.sessions.detail('sess-1')).toEqual(['sessions', 'detail', 'sess-1'])
      })

      it('sessions.rsvps(sessionId) appends rsvps to detail', () => {
        expect(queryKeys.sessions.rsvps('sess-1')).toEqual([
          'sessions',
          'detail',
          'sess-1',
          'rsvps',
        ])
      })
    })

    describe('profile', () => {
      it('profile.all returns base key', () => {
        expect(queryKeys.profile.all).toEqual(['profile'])
      })

      it('profile.current() appends current', () => {
        expect(queryKeys.profile.current()).toEqual(['profile', 'current'])
      })

      it('profile.byId(id) appends user id', () => {
        expect(queryKeys.profile.byId('user-42')).toEqual(['profile', 'user-42'])
      })

      it('profile.stats(userId) appends stats', () => {
        expect(queryKeys.profile.stats('user-42')).toEqual(['profile', 'user-42', 'stats'])
      })
    })

    describe('messages', () => {
      it('messages.all returns base key', () => {
        expect(queryKeys.messages.all).toEqual(['messages'])
      })

      it('messages.squad(squadId) includes squad and squadId', () => {
        expect(queryKeys.messages.squad('squad-1')).toEqual(['messages', 'squad', 'squad-1'])
      })

      it('messages.direct(recipientId) includes direct and recipientId', () => {
        expect(queryKeys.messages.direct('user-2')).toEqual(['messages', 'direct', 'user-2'])
      })

      it('messages.conversations() appends conversations', () => {
        expect(queryKeys.messages.conversations()).toEqual(['messages', 'conversations'])
      })

      it('messages.unread() appends unread', () => {
        expect(queryKeys.messages.unread()).toEqual(['messages', 'unread'])
      })
    })

    describe('friendsPlaying', () => {
      it('friendsPlaying.all returns base key', () => {
        expect(queryKeys.friendsPlaying.all).toEqual(['friends-playing'])
      })

      it('friendsPlaying.list() appends list', () => {
        expect(queryKeys.friendsPlaying.list()).toEqual(['friends-playing', 'list'])
      })
    })

    describe('premium', () => {
      it('premium.all returns base key', () => {
        expect(queryKeys.premium.all).toEqual(['premium'])
      })

      it('premium.status() appends status', () => {
        expect(queryKeys.premium.status()).toEqual(['premium', 'status'])
      })
    })

    describe('challenges', () => {
      it('challenges.all returns base key', () => {
        expect(queryKeys.challenges.all).toEqual(['challenges'])
      })

      it('challenges.active() appends active', () => {
        expect(queryKeys.challenges.active()).toEqual(['challenges', 'active'])
      })

      it('challenges.completed() appends completed', () => {
        expect(queryKeys.challenges.completed()).toEqual(['challenges', 'completed'])
      })
    })

    describe('discover', () => {
      it('discover.all returns base key', () => {
        expect(queryKeys.discover.all).toEqual(['discover'])
      })

      it('discover.publicSquads with both params', () => {
        expect(queryKeys.discover.publicSquads('valorant', 'eu')).toEqual([
          'discover',
          'squads',
          { game: 'valorant', region: 'eu' },
        ])
      })

      it('discover.publicSquads with no params', () => {
        expect(queryKeys.discover.publicSquads()).toEqual([
          'discover',
          'squads',
          { game: undefined, region: undefined },
        ])
      })

      it('discover.globalLeaderboard with params', () => {
        expect(queryKeys.discover.globalLeaderboard('lol', 'na')).toEqual([
          'discover',
          'leaderboard',
          { game: 'lol', region: 'na' },
        ])
      })

      it('discover.matchmaking with params', () => {
        expect(queryKeys.discover.matchmaking('apex', 'asia')).toEqual([
          'discover',
          'matchmaking',
          { game: 'apex', region: 'asia' },
        ])
      })

      it('discover.publicProfile(username)', () => {
        expect(queryKeys.discover.publicProfile('testuser')).toEqual([
          'discover',
          'profile',
          'testuser',
        ])
      })
    })

    describe('activityFeed', () => {
      it('activityFeed.all returns base key', () => {
        expect(queryKeys.activityFeed.all).toEqual(['activity-feed'])
      })

      it('activityFeed.list spreads squadIds', () => {
        expect(queryKeys.activityFeed.list(['s1', 's2'])).toEqual([
          'activity-feed',
          'list',
          's1',
          's2',
        ])
      })

      it('activityFeed.list with empty array', () => {
        expect(queryKeys.activityFeed.list([])).toEqual(['activity-feed', 'list'])
      })
    })

    describe('aiAdvanced', () => {
      it('aiAdvanced.all returns base key', () => {
        expect(queryKeys.aiAdvanced.all).toEqual(['ai-advanced'])
      })

      it('aiAdvanced.sessionSummary(sessionId)', () => {
        expect(queryKeys.aiAdvanced.sessionSummary('sess-1')).toEqual([
          'ai-advanced',
          'session-summary',
          'sess-1',
        ])
      })

      it('aiAdvanced.predictions(squadId)', () => {
        expect(queryKeys.aiAdvanced.predictions('squad-1')).toEqual([
          'ai-advanced',
          'predictions',
          'squad-1',
        ])
      })
    })
  })

  describe('prefetchRoute', () => {
    let prefetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue(undefined)
    })

    afterEach(() => {
      prefetchSpy.mockRestore()
    })

    it('/home with userId prefetches squads and upcoming sessions', async () => {
      await prefetchRoute('/home', 'user-1')
      expect(prefetchSpy).toHaveBeenCalledTimes(2)
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.squads.list(),
          staleTime: 30_000,
        })
      )
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.sessions.upcoming(),
          staleTime: 30_000,
        })
      )
    })

    it('/home without userId does NOT prefetch', async () => {
      await prefetchRoute('/home')
      expect(prefetchSpy).not.toHaveBeenCalled()
    })

    it('/squads prefetches squads list', async () => {
      await prefetchRoute('/squads')
      expect(prefetchSpy).toHaveBeenCalledTimes(1)
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.squads.list(),
        })
      )
    })

    it('/messages prefetches conversations and unread', async () => {
      await prefetchRoute('/messages')
      expect(prefetchSpy).toHaveBeenCalledTimes(2)
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.messages.conversations(),
        })
      )
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.messages.unread(),
        })
      )
    })

    it('/premium prefetches premium status with 60s staleTime', async () => {
      await prefetchRoute('/premium')
      expect(prefetchSpy).toHaveBeenCalledTimes(1)
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.premium.status(),
          staleTime: 60_000,
        })
      )
    })

    it('unknown route does not prefetch anything', async () => {
      await prefetchRoute('/unknown-route')
      expect(prefetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('prefetchSquadDetail', () => {
    let prefetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue(undefined)
    })

    afterEach(() => {
      prefetchSpy.mockRestore()
    })

    it('prefetches detail, members, sessions, and messages for a squad', async () => {
      await prefetchSquadDetail('squad-42')
      expect(prefetchSpy).toHaveBeenCalledTimes(4)
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.squads.detail('squad-42'),
        })
      )
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.squads.members('squad-42'),
        })
      )
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.sessions.list('squad-42'),
        })
      )
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.messages.squad('squad-42'),
        })
      )
    })

    it('all prefetches use 30s staleTime', async () => {
      await prefetchSquadDetail('squad-42')
      for (const call of prefetchSpy.mock.calls) {
        expect((call[0] as any).staleTime).toBe(30_000)
      }
    })
  })

  describe('prefetchSessionDetail', () => {
    let prefetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue(undefined)
    })

    afterEach(() => {
      prefetchSpy.mockRestore()
    })

    it('prefetches session detail with 15s staleTime', async () => {
      await prefetchSessionDetail('sess-99')
      expect(prefetchSpy).toHaveBeenCalledTimes(1)
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.sessions.detail('sess-99'),
          staleTime: 15_000,
        })
      )
    })
  })

  describe('initQueryPersistence', () => {
    it('calls persistQueryClient with correct options on success', async () => {
      const mockPersister = {
        persistClient: vi.fn(),
        restoreClient: vi.fn(),
        removeClient: vi.fn(),
      }
      const mockPersistQueryClient = vi.fn()

      vi.doMock('@tanstack/query-persist-client-core', () => ({
        persistQueryClient: mockPersistQueryClient,
      }))
      vi.doMock('../queryPersister', () => ({
        createIDBPersister: () => mockPersister,
      }))

      // Re-import to pick up mocks
      const { initQueryPersistence: init } = await import('../queryClient')
      await init()

      expect(mockPersistQueryClient).toHaveBeenCalledWith(
        expect.objectContaining({
          queryClient: expect.anything(),
          persister: mockPersister,
          maxAge: 24 * 60 * 60 * 1000,
          buster: '',
        })
      )

      vi.doUnmock('@tanstack/query-persist-client-core')
      vi.doUnmock('../queryPersister')
    })

    it('does not throw when dynamic import fails', async () => {
      vi.doMock('@tanstack/query-persist-client-core', () => {
        throw new Error('module unavailable')
      })

      // Re-import to pick up mocks
      const { initQueryPersistence: init } = await import('../queryClient')
      await expect(init()).resolves.toBeUndefined()

      vi.doUnmock('@tanstack/query-persist-client-core')
    })

    it('dehydrateOptions.shouldDehydrateQuery filters correctly', async () => {
      let capturedOptions: any = null
      const mockPersister = {
        persistClient: vi.fn(),
        restoreClient: vi.fn(),
        removeClient: vi.fn(),
      }

      vi.doMock('@tanstack/query-persist-client-core', () => ({
        persistQueryClient: (opts: any) => {
          capturedOptions = opts
        },
      }))
      vi.doMock('../queryPersister', () => ({
        createIDBPersister: () => mockPersister,
      }))

      const { initQueryPersistence: init } = await import('../queryClient')
      await init()

      const shouldDehydrate = capturedOptions?.dehydrateOptions?.shouldDehydrateQuery

      // Should persist successful queries with allowed keys
      expect(shouldDehydrate({ state: { status: 'success' }, queryKey: ['squads'] })).toBe(true)
      expect(shouldDehydrate({ state: { status: 'success' }, queryKey: ['sessions'] })).toBe(true)
      expect(shouldDehydrate({ state: { status: 'success' }, queryKey: ['profile'] })).toBe(true)
      expect(shouldDehydrate({ state: { status: 'success' }, queryKey: ['messages'] })).toBe(true)
      expect(shouldDehydrate({ state: { status: 'success' }, queryKey: ['challenges'] })).toBe(true)
      expect(shouldDehydrate({ state: { status: 'success' }, queryKey: ['premium'] })).toBe(true)

      // Should NOT persist non-success queries
      expect(shouldDehydrate({ state: { status: 'error' }, queryKey: ['squads'] })).toBe(false)
      expect(shouldDehydrate({ state: { status: 'loading' }, queryKey: ['squads'] })).toBe(false)

      // Should NOT persist non-allowed keys
      expect(shouldDehydrate({ state: { status: 'success' }, queryKey: ['unknown'] })).toBe(false)
      expect(shouldDehydrate({ state: { status: 'success' }, queryKey: ['discover'] })).toBe(false)

      vi.doUnmock('@tanstack/query-persist-client-core')
      vi.doUnmock('../queryPersister')
    })
  })
})
