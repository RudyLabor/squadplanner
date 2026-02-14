import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

const { mockSupabase, mockRpc, mockFrom } = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockFrom = vi.fn()
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    rpc: mockRpc,
    from: mockFrom,
    storage: { from: vi.fn() },
    functions: { invoke: vi.fn() },
  }
  return { mockSupabase, mockRpc, mockFrom, mockGetSession, mockGetUser }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: null }),
    {
      getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: null }),
    }
  ),
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

import { useStories, STORY_BACKGROUNDS } from '../useStories'
import { useAuthStore } from '../useAuth'
import { showSuccess, showError } from '../../lib/toast'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockStories = [
  {
    story_id: 'story-1',
    user_id: 'user-1',
    username: 'CurrentUser',
    avatar_url: null,
    content_type: 'text',
    content: 'My story',
    media_url: null,
    background_color: '#5e6dd2',
    text_color: '#ffffff',
    metadata: {},
    view_count: 5,
    has_viewed: true,
    created_at: '2026-02-14T10:00:00Z',
    expires_at: '2026-02-15T10:00:00Z',
    story_count: 1,
  },
  {
    story_id: 'story-2',
    user_id: 'user-2',
    username: 'FriendA',
    avatar_url: 'https://example.com/avatar.jpg',
    content_type: 'text',
    content: 'Friend story',
    media_url: null,
    background_color: '#ef4444',
    text_color: '#ffffff',
    metadata: {},
    view_count: 3,
    has_viewed: false,
    created_at: '2026-02-14T09:00:00Z',
    expires_at: '2026-02-15T09:00:00Z',
    story_count: 1,
  },
  {
    story_id: 'story-3',
    user_id: 'user-3',
    username: 'FriendB',
    avatar_url: null,
    content_type: 'text',
    content: 'Already viewed story',
    media_url: null,
    background_color: '#10b981',
    text_color: '#ffffff',
    metadata: {},
    view_count: 10,
    has_viewed: true,
    created_at: '2026-02-14T08:00:00Z',
    expires_at: '2026-02-15T08:00:00Z',
    story_count: 1,
  },
]

describe('STORY_BACKGROUNDS', () => {
  it('has 8 backgrounds with color and label', () => {
    expect(STORY_BACKGROUNDS).toHaveLength(8)
    STORY_BACKGROUNDS.forEach((bg) => {
      expect(bg).toHaveProperty('color')
      expect(bg).toHaveProperty('label')
      expect(bg.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(bg.label.length).toBeGreaterThan(0)
    })
  })
})

describe('useStories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty stories when no user', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null, profile: null } as any)

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    // Query is disabled when no user, so stories stays as default empty array
    expect(result.current.stories).toEqual([])
    expect(result.current.storyUsers).toEqual([])
  })

  it('fetches stories via RPC get_feed_stories', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    mockRpc.mockResolvedValue({ data: mockStories, error: null })

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.stories).toHaveLength(3)
    })

    expect(mockRpc).toHaveBeenCalledWith('get_feed_stories', {
      p_user_id: 'user-1',
      p_limit: 50,
    })
  })

  it('groups stories by user with correct sorting (own first, then unviewed)', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    mockRpc.mockResolvedValue({ data: mockStories, error: null })

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.storyUsers).toHaveLength(3)
    })

    // Own user should be first
    expect(result.current.storyUsers[0].userId).toBe('user-1')
    expect(result.current.storyUsers[0].isOwnStory).toBe(true)

    // Unviewed stories should come before viewed
    expect(result.current.storyUsers[1].userId).toBe('user-2')
    expect(result.current.storyUsers[1].hasUnviewed).toBe(true)

    // Viewed stories last
    expect(result.current.storyUsers[2].userId).toBe('user-3')
    expect(result.current.storyUsers[2].hasUnviewed).toBe(false)
  })

  it('getUserStories returns stories for a given user', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    mockRpc.mockResolvedValue({ data: mockStories, error: null })

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.stories).toHaveLength(3)
    })

    const user2Stories = result.current.getUserStories('user-2')
    expect(user2Stories).toHaveLength(1)
    expect(user2Stories[0].story_id).toBe('story-2')

    // Non-existent user returns empty
    const noStories = result.current.getUserStories('user-999')
    expect(noStories).toEqual([])
  })

  it('createStory calls supabase.from(stories).insert with correct data', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    // Mock the query to not fetch
    mockRpc.mockResolvedValue({ data: [], error: null })

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-story', user_id: 'user-1' },
          error: null,
        }),
      }),
    })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    act(() => {
      result.current.createStory({
        contentType: 'text' as any,
        content: 'My new story',
        backgroundColor: '#ef4444',
        textColor: '#ffffff',
      })
    })

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('stories')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          content_type: 'text',
          content: 'My new story',
          background_color: '#ef4444',
          text_color: '#ffffff',
        })
      )
    })
  })

  it('viewStory calls supabase.from(story_views).insert', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    mockRpc.mockResolvedValue({ data: [], error: null })

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ error: null }),
    })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    act(() => {
      result.current.viewStory('story-2')
    })

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('story_views')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          story_id: 'story-2',
          viewer_id: 'user-1',
        })
      )
    })
  })

  it('deleteStory calls supabase.from(stories).delete', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    mockRpc.mockResolvedValue({ data: [], error: null })

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    act(() => {
      result.current.deleteStory('story-1')
    })

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('stories')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', 'story-1')
    })
  })

  it('falls back to direct query when RPC fails', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    // RPC fails
    mockRpc.mockResolvedValue({ data: null, error: { message: 'function not found' } })

    // Fallback direct query
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'story-fb',
          user_id: 'user-1',
          profiles: { username: 'TestUser', avatar_url: null },
          content_type: 'text',
          content: 'Fallback story',
          media_url: null,
          background_color: '#5e6dd2',
          text_color: '#ffffff',
          metadata: {},
          view_count: 0,
          created_at: '2026-02-14T10:00:00Z',
          expires_at: '2026-02-15T10:00:00Z',
        },
      ],
      error: null,
    })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockGt = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ gt: mockGt })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.stories).toHaveLength(1)
    })

    expect(mockFrom).toHaveBeenCalledWith('stories')
  })

  it('handles empty results gracefully', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    mockRpc.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stories).toEqual([])
    expect(result.current.storyUsers).toEqual([])
  })
})
