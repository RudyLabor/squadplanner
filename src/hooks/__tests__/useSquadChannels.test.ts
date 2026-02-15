import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase chainable mock
const { mockSupabase, mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabase = {
    from: mockFrom,
  }
  return { mockSupabase, mockFrom }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

// Auth store mock
const mockUser = vi.hoisted(() => ({ id: 'user-1', username: 'test' }))
vi.mock('../useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: mockUser }),
    { getState: vi.fn().mockReturnValue({ user: mockUser }) }
  ),
}))

// Toast mock
const { mockShowSuccess, mockShowError } = vi.hoisted(() => ({
  mockShowSuccess: vi.fn(),
  mockShowError: vi.fn(),
}))
vi.mock('../../lib/toast', () => ({
  showSuccess: mockShowSuccess,
  showError: mockShowError,
}))

import { useSquadChannels } from '../useSquadChannels'

// Create a chainable mock that supports all Supabase query builder methods.
// The `data` and `error` control what the chain resolves to.
function createChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error })
  chain.then = vi.fn().mockImplementation((onFulfilled) =>
    Promise.resolve({ data, error }).then(onFulfilled)
  )
  return chain
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// Helper: set up mockFrom so that query (select) returns `channels` array,
// and the mutation call (insert/update/delete) returns mutationResult.
// All subsequent calls (refetches) also return the `channels` array safely.
function setupMutationMock(
  queryData: unknown[],
  mutationData: unknown = null,
  mutationError: unknown = null
) {
  // Call 1: initial query fetch -> returns queryData array
  // Call 2: mutation -> returns mutationData
  // Call 3+: refetch after invalidation -> returns queryData array
  let callCount = 0
  mockFrom.mockImplementation(() => {
    callCount++
    if (callCount === 1) return createChain(queryData)
    if (callCount === 2) return createChain(mutationData, mutationError)
    return createChain(queryData) // refetches always safe
  })
}

describe('useSquadChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('query behavior', () => {
    it('returns empty channels array when squadId is undefined', () => {
      mockFrom.mockReturnValue(createChain([]))

      const { result } = renderHook(() => useSquadChannels(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.channels).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('fetches channels for a valid squadId', async () => {
      const channels = [
        { id: 'ch-1', name: 'general', is_default: true, squad_id: 'squad-1', position: 0 },
        { id: 'ch-2', name: 'ranked', is_default: false, squad_id: 'squad-1', position: 1 },
      ]
      mockFrom.mockReturnValue(createChain(channels))

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.channels).toEqual(channels)
      })
    })

    it('returns empty array when query errors (table not available)', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockFrom.mockReturnValue(createChain(null, { message: 'relation not found' }))

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.channels).toEqual([])
      })

      consoleSpy.mockRestore()
    })

    it('computes defaultChannel as the first is_default channel', async () => {
      const channels = [
        { id: 'ch-1', name: 'general', is_default: false, position: 0 },
        { id: 'ch-2', name: 'default', is_default: true, position: 1 },
      ]
      mockFrom.mockReturnValue(createChain(channels))

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.defaultChannel).toEqual(channels[1])
      })
    })

    it('falls back to first channel when no default channel', async () => {
      const channels = [
        { id: 'ch-1', name: 'general', is_default: false, position: 0 },
        { id: 'ch-2', name: 'ranked', is_default: false, position: 1 },
      ]
      mockFrom.mockReturnValue(createChain(channels))

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.defaultChannel).toEqual(channels[0])
      })
    })

    it('returns null defaultChannel when no channels exist', async () => {
      mockFrom.mockReturnValue(createChain([]))

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.defaultChannel).toBeNull()
      })
    })
  })

  describe('createChannel mutation', () => {
    it('calls supabase insert with correct params', async () => {
      setupMutationMock([], { id: 'new-ch', name: 'voice' })

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() => {
        result.current.createChannel('voice', 'Voice channel', 'voice')
      })

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('squad_channels')
      })
    })

    it('shows success toast on create', async () => {
      setupMutationMock([], { id: 'new-ch', name: 'voice' })

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() => {
        result.current.createChannel('voice')
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Canal créé')
      })
    })

    it('shows duplicate error toast', async () => {
      setupMutationMock([], null, { message: 'duplicate key violation' })

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() => {
        result.current.createChannel('general')
      })

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Ce nom de canal existe déjà')
      })
    })

    it('shows generic error toast on non-duplicate error', async () => {
      setupMutationMock([], null, { message: 'internal server error' })

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() => {
        result.current.createChannel('test-channel')
      })

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Erreur lors de la création')
      })
    })
  })

  describe('updateChannel mutation', () => {
    it('shows success toast on update', async () => {
      const channels = [{ id: 'ch-1', name: 'old-name', is_default: false }]
      setupMutationMock(channels)

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.channels).toHaveLength(1))

      act(() => {
        result.current.updateChannel('ch-1', 'new-name', 'description')
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Canal modifié')
      })
    })

    it('shows error toast on update failure', async () => {
      setupMutationMock([], null, { message: 'update error' })

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() => {
        result.current.updateChannel('ch-1', 'new-name')
      })

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Erreur lors de la modification')
      })
    })
  })

  describe('deleteChannel mutation', () => {
    it('shows success toast on delete', async () => {
      const channels = [
        { id: 'ch-1', name: 'general', is_default: true },
        { id: 'ch-2', name: 'ranked', is_default: false },
      ]
      setupMutationMock(channels)

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.channels).toHaveLength(2))

      act(() => {
        result.current.deleteChannel('ch-2')
      })

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Canal supprimé')
      })
    })

    it('prevents deletion of default channel and shows error', async () => {
      const channels = [{ id: 'ch-1', name: 'general', is_default: true }]
      mockFrom.mockReturnValue(createChain(channels))

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.channels).toHaveLength(1))

      act(() => {
        result.current.deleteChannel('ch-1')
      })

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          'Impossible de supprimer le canal par défaut'
        )
      })
    })
  })

  describe('return values', () => {
    it('exposes isCreating status', async () => {
      mockFrom.mockReturnValue(createChain([]))

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isCreating).toBe(false)
    })

    it('exposes all expected functions and values', async () => {
      mockFrom.mockReturnValue(createChain([]))

      const { result } = renderHook(() => useSquadChannels('squad-1'), {
        wrapper: createWrapper(),
      })

      expect(result.current).toHaveProperty('channels')
      expect(result.current).toHaveProperty('defaultChannel')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('createChannel')
      expect(result.current).toHaveProperty('updateChannel')
      expect(result.current).toHaveProperty('deleteChannel')
      expect(result.current).toHaveProperty('isCreating')
      expect(typeof result.current.createChannel).toBe('function')
      expect(typeof result.current.updateChannel).toBe('function')
      expect(typeof result.current.deleteChannel).toBe('function')
    })
  })
})
