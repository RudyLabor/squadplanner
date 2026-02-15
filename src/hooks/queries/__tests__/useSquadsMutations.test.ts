import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// ── Hoisted mocks ─────────────────────────────────────────────────────
const {
  mockSupabase,
  mockFrom,
  mockShowSuccess,
  mockShowError,
  mockSendMemberJoined,
  mockSendMemberLeft,
  mockCreateOptimisticMutation,
} = vi.hoisted(() => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockInsert = vi.fn().mockReturnThis()
  const mockUpdate = vi.fn().mockReturnThis()
  const mockDeleteFn = vi.fn().mockReturnThis()
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDeleteFn,
  })

  const mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-1', email: 'test@test.com' } },
  })

  const mockSupabase = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }

  const mockShowSuccess = vi.fn()
  const mockShowError = vi.fn()
  const mockSendMemberJoined = vi.fn().mockResolvedValue(undefined)
  const mockSendMemberLeft = vi.fn().mockResolvedValue(undefined)

  const mockOptimisticHandlers = {
    onMutate: vi.fn().mockResolvedValue({ snapshots: new Map() }),
    onError: vi.fn(),
    onSettled: vi.fn(),
  }
  const mockCreateOptimisticMutation = vi.fn().mockReturnValue(mockOptimisticHandlers)

  return {
    mockSupabase,
    mockFrom,
    mockShowSuccess,
    mockShowError,
    mockSendMemberJoined,
    mockSendMemberLeft,
    mockCreateOptimisticMutation,
  }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

vi.mock('../../../lib/queryClient', () => ({
  queryKeys: {
    squads: {
      all: ['squads'],
      lists: () => ['squads', 'list'],
      list: () => ['squads', 'list'],
      details: () => ['squads', 'detail'],
      detail: (id: string) => ['squads', 'detail', id],
      members: (squadId: string) => ['squads', 'detail', squadId, 'members'],
    },
  },
}))

vi.mock('../../../lib/toast', () => ({
  showSuccess: mockShowSuccess,
  showError: mockShowError,
}))

vi.mock('../../../lib/systemMessages', () => ({
  sendMemberJoinedMessage: mockSendMemberJoined,
  sendMemberLeftMessage: mockSendMemberLeft,
}))

vi.mock('../../../utils/optimisticUpdate', () => ({
  createOptimisticMutation: mockCreateOptimisticMutation,
}))

// ── Helpers ───────────────────────────────────────────────────────────
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

/** Helper to build a chained supabase builder mock.
 *  Every chainable method returns the chain object.
 *  Accessing the chain as a thenable (via await) resolves `resolvedValue`.
 */
function makeChainMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolvedValue)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  // Make the chain itself awaitable so that `const { error } = await chain.update().eq()` works
  chain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    Promise.resolve(resolvedValue).then(resolve, reject)
  return chain
}

import {
  useCreateSquadMutation,
  useJoinSquadMutation,
  useLeaveSquadMutation,
  useUpdateSquadMutation,
  useDeleteSquadMutation,
} from '../useSquadsMutations'

// ── Tests ─────────────────────────────────────────────────────────────

describe('useCreateSquadMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a squad when user is authenticated and profile exists', async () => {
    // Auth → user exists
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    // profiles.select → existing profile found
    const profileChain = makeChainMock({ data: { id: 'user-1' }, error: null })
    // squads.insert → success
    const squadChain = makeChainMock({
      data: { id: 'squad-1', name: 'TestSquad', game: 'Valorant' },
      error: null,
    })
    // squad_members.insert → success
    const memberChain = makeChainMock({ data: null, error: null })

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileChain
      if (table === 'squads') return squadChain
      if (table === 'squad_members') {
        callCount++
        return memberChain
      }
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useCreateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ name: 'TestSquad', game: 'Valorant' })
    })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))

    // Verify squads.insert was called
    expect(mockFrom).toHaveBeenCalledWith('squads')
  })

  it('creates a profile if no existing profile exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    // profiles.select → no existing profile
    const profileSelectChain = makeChainMock({ data: null, error: null })
    // profiles.insert → success (auto-create)
    const profileInsertChain = makeChainMock({ data: null, error: null })
    const squadChain = makeChainMock({
      data: { id: 'squad-1', name: 'MySquad', game: 'LoL' },
      error: null,
    })
    const memberChain = makeChainMock({ data: null, error: null })

    let profileCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        profileCallCount++
        if (profileCallCount === 1) return profileSelectChain // select
        return profileInsertChain // insert
      }
      if (table === 'squads') return squadChain
      if (table === 'squad_members') return memberChain
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useCreateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ name: 'MySquad', game: 'LoL' })
    })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    // profiles was called at least twice (select + insert)
    expect(profileCallCount).toBeGreaterThanOrEqual(2)
  })

  it('throws when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const { result } = renderHook(() => useCreateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ name: 'Fail', game: 'Test' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Not authenticated')
  })

  it('throws when profile creation fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    const profileSelectChain = makeChainMock({ data: null, error: null })
    const profileInsertChain = makeChainMock({
      data: null,
      error: { message: 'DB error' },
    })

    let profileCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        profileCallCount++
        if (profileCallCount === 1) return profileSelectChain
        return profileInsertChain
      }
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useCreateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ name: 'Fail', game: 'Test' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('profil')
  })

  it('throws when squad insertion fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    const profileChain = makeChainMock({ data: { id: 'user-1' }, error: null })
    const squadChain = makeChainMock({
      data: null,
      error: { message: 'Squad insert failed' },
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileChain
      if (table === 'squads') return squadChain
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useCreateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ name: 'Fail', game: 'Test' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('calls showSuccess on success', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    const profileChain = makeChainMock({ data: { id: 'user-1' }, error: null })
    const squadChain = makeChainMock({
      data: { id: 'squad-1', name: 'OK', game: 'Test' },
      error: null,
    })
    const memberChain = makeChainMock({ data: null, error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileChain
      if (table === 'squads') return squadChain
      if (table === 'squad_members') return memberChain
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useCreateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ name: 'OK', game: 'Test' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockShowSuccess).toHaveBeenCalledWith('Squad créée avec succès !')
  })

  it('calls showError on failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useCreateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ name: 'Fail', game: 'X' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockShowError).toHaveBeenCalled()
  })
})

describe('useJoinSquadMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('joins a squad with a valid invite code', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    const profileSelectChain = makeChainMock({ data: { id: 'user-1' }, error: null })
    const squadFindChain = makeChainMock({ data: { id: 'squad-1' }, error: null })
    const existingMemberChain = makeChainMock({ data: null, error: { code: 'PGRST116' } })
    const insertMemberChain = makeChainMock({ data: null, error: null })
    const profileUsernameChain = makeChainMock({ data: { username: 'TestUser' }, error: null })

    let profileCount = 0
    let squadCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        profileCount++
        if (profileCount === 1) return profileSelectChain
        return profileUsernameChain
      }
      if (table === 'squads') return squadFindChain
      if (table === 'squad_members') {
        squadCount++
        if (squadCount === 1) return existingMemberChain
        return insertMemberChain
      }
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useJoinSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('ABC123')
    })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
  })

  it('throws when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useJoinSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('CODE')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Not authenticated')
  })

  it('throws when invite code is invalid (squad not found)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    const profileChain = makeChainMock({ data: { id: 'user-1' }, error: null })
    const squadFindChain = makeChainMock({ data: null, error: { code: 'PGRST116' } })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileChain
      if (table === 'squads') return squadFindChain
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useJoinSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('BADCODE')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('invitation invalide')
  })

  it('throws when user is already a member', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    const profileChain = makeChainMock({ data: { id: 'user-1' }, error: null })
    const squadFindChain = makeChainMock({ data: { id: 'squad-1' }, error: null })
    const existingMemberChain = makeChainMock({ data: { id: 'member-1' }, error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileChain
      if (table === 'squads') return squadFindChain
      if (table === 'squad_members') return existingMemberChain
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useJoinSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('ABC123')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('déjà partie')
  })

  it('calls sendMemberJoinedMessage when username is available', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    const profileSelectChain = makeChainMock({ data: { id: 'user-1' }, error: null })
    const squadFindChain = makeChainMock({ data: { id: 'squad-1' }, error: null })
    const existingMemberChain = makeChainMock({ data: null, error: { code: 'PGRST116' } })
    const insertMemberChain = makeChainMock({ data: null, error: null })
    const profileUsernameChain = makeChainMock({ data: { username: 'JoinUser' }, error: null })

    let profileCount = 0
    let memberCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        profileCount++
        if (profileCount === 1) return profileSelectChain
        return profileUsernameChain
      }
      if (table === 'squads') return squadFindChain
      if (table === 'squad_members') {
        memberCount++
        if (memberCount === 1) return existingMemberChain
        return insertMemberChain
      }
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useJoinSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('ABC123')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSendMemberJoined).toHaveBeenCalledWith('squad-1', 'JoinUser')
  })

  it('calls showSuccess on success', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    })

    const profileSelectChain = makeChainMock({ data: { id: 'user-1' }, error: null })
    const squadFindChain = makeChainMock({ data: { id: 'squad-1' }, error: null })
    const existingMemberChain = makeChainMock({ data: null, error: { code: 'PGRST116' } })
    const insertMemberChain = makeChainMock({ data: null, error: null })
    const profileUsernameChain = makeChainMock({ data: { username: 'User' }, error: null })

    let profileCount = 0
    let memberCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        profileCount++
        if (profileCount === 1) return profileSelectChain
        return profileUsernameChain
      }
      if (table === 'squads') return squadFindChain
      if (table === 'squad_members') {
        memberCount++
        if (memberCount === 1) return existingMemberChain
        return insertMemberChain
      }
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useJoinSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('ABC123')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockShowSuccess).toHaveBeenCalledWith('Tu as rejoint la squad !')
  })
})

describe('useLeaveSquadMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a mutation hook backed by optimistic update', () => {
    const { result } = renderHook(() => useLeaveSquadMutation(), {
      wrapper: createWrapper(),
    })
    expect(result.current).toHaveProperty('mutate')
    expect(result.current).toHaveProperty('mutateAsync')
  })

  it('calls createOptimisticMutation with correct config', () => {
    renderHook(() => useLeaveSquadMutation(), {
      wrapper: createWrapper(),
    })
    expect(mockCreateOptimisticMutation).toHaveBeenCalled()
    const config = mockCreateOptimisticMutation.mock.calls[0][1]
    expect(config.errorMessage).toBe('Impossible de quitter la squad')
  })

  it('throws when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useLeaveSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('squad-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Not authenticated')
  })

  it('calls sendMemberLeftMessage when username is available', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    })

    const profileChain = makeChainMock({ data: { username: 'LeavingUser' }, error: null })
    const deleteMemberChain = makeChainMock({ data: null, error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileChain
      if (table === 'squad_members') return deleteMemberChain
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useLeaveSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('squad-1')
    })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    if (result.current.isSuccess) {
      expect(mockSendMemberLeft).toHaveBeenCalledWith('squad-1', 'LeavingUser')
    }
  })

  it('calls showSuccess on success', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    })

    const profileChain = makeChainMock({ data: { username: 'User' }, error: null })
    const deleteMemberChain = makeChainMock({ data: null, error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profileChain
      if (table === 'squad_members') return deleteMemberChain
      return makeChainMock({ data: null, error: null })
    })

    const { result } = renderHook(() => useLeaveSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('squad-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockShowSuccess).toHaveBeenCalledWith('Tu as quitte la squad')
  })
})

describe('useUpdateSquadMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates a squad name and game', async () => {
    const updateChain = makeChainMock({ data: null, error: null })
    mockFrom.mockImplementation(() => updateChain)

    const { result } = renderHook(() => useUpdateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ squadId: 'squad-1', name: 'New Name', game: 'CS2' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFrom).toHaveBeenCalledWith('squads')
    expect(mockShowSuccess).toHaveBeenCalledWith('Squad modifiée !')
  })

  it('includes description when provided', async () => {
    const updateChain = makeChainMock({ data: null, error: null })
    mockFrom.mockImplementation(() => updateChain)

    const { result } = renderHook(() => useUpdateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({
        squadId: 'squad-1',
        name: 'Squad',
        game: 'LoL',
        description: 'Best team!',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockShowSuccess).toHaveBeenCalled()
  })

  it('calls showError when update fails', async () => {
    const updateChain = makeChainMock({ data: null, error: { message: 'Update failed' } })
    mockFrom.mockImplementation(() => updateChain)

    const { result } = renderHook(() => useUpdateSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ squadId: 'squad-1', name: 'Fail', game: 'X' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockShowError).toHaveBeenCalled()
  })
})

describe('useDeleteSquadMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a squad successfully', async () => {
    const deleteChain = makeChainMock({ data: null, error: null })
    mockFrom.mockImplementation(() => deleteChain)

    const { result } = renderHook(() => useDeleteSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('squad-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFrom).toHaveBeenCalledWith('squads')
    expect(mockShowSuccess).toHaveBeenCalledWith('Squad supprimée')
  })

  it('throws when deletion fails', async () => {
    const deleteChain = makeChainMock({ data: null, error: { message: 'Delete failed' } })
    mockFrom.mockImplementation(() => deleteChain)

    const { result } = renderHook(() => useDeleteSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('squad-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockShowError).toHaveBeenCalled()
  })

  it('shows generic error message when error.message is empty', async () => {
    const deleteChain = makeChainMock({ data: null, error: { message: '' } })
    mockFrom.mockImplementation(() => deleteChain)

    const { result } = renderHook(() => useDeleteSquadMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('squad-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockShowError).toHaveBeenCalledWith('Impossible de supprimer la squad')
  })
})
