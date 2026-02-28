import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { createElement } from 'react'

/* ------------------------------------------------------------------ */
/*  Hoisted mocks                                                      */
/* ------------------------------------------------------------------ */
const mockToggle = vi.hoisted(() => vi.fn())
const mockClose = vi.hoisted(() => vi.fn())
const mockActiveOverlay = vi.hoisted(() => ({ value: null as string | null }))

const mockFromChain = vi.hoisted(() => {
  const chain: any = {}
  // All chain methods return the chain, making it both chainable and thenable
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.neq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  // Default thenable behavior: resolves to empty data
  chain.then = vi.fn().mockImplementation((resolve: any) => resolve({ data: [], error: null }))
  return chain
})

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnValue(mockFromChain),
}))

/* ------------------------------------------------------------------ */
/*  vi.mock calls                                                      */
/* ------------------------------------------------------------------ */
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

vi.mock('../icons', () => ({
  Bell: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-bell' }),
  CheckCheck: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-checkcheck' }),
  X: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-x' }),
}))

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
}))

vi.mock('../../hooks', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

vi.mock('../../hooks/useOverlayStore', () => ({
  useOverlayStore: vi.fn().mockImplementation(() => ({
    activeOverlay: mockActiveOverlay.value,
    toggle: mockToggle,
    close: mockClose,
  })),
}))

import { NotificationBell, useNotificationStore } from '../NotificationCenter'

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockActiveOverlay.value = null
    // Reset the zustand store state
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    })
  })

  /* ---------- Basic rendering ---------- */

  it('renders the bell button with correct aria-label (no unread)', () => {
    render(<NotificationBell />)
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })

  it('renders bell icon', () => {
    render(<NotificationBell />)
    expect(screen.getByTestId('icon-bell')).toBeInTheDocument()
  })

  /* ---------- Unread badge ---------- */

  it('shows unread badge when unreadCount > 0', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: false,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 3,
    })
    render(<NotificationBell />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows 9+ when unreadCount > 9', () => {
    useNotificationStore.setState({ notifications: [], unreadCount: 15 })
    render(<NotificationBell />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('does not show badge when unreadCount is 0', () => {
    render(<NotificationBell />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText('9+')).not.toBeInTheDocument()
  })

  it('includes unread count in aria-label', () => {
    useNotificationStore.setState({ notifications: [], unreadCount: 5 })
    render(<NotificationBell />)
    expect(screen.getByLabelText('Notifications (5 non lues)')).toBeInTheDocument()
  })

  /* ---------- Toggle panel ---------- */

  it('calls toggle on bell click', () => {
    render(<NotificationBell />)
    fireEvent.click(screen.getByLabelText('Notifications'))
    expect(mockToggle).toHaveBeenCalledWith('notifications')
  })

  /* ---------- Panel open state ---------- */

  it('shows notification panel when overlay is active', () => {
    mockActiveOverlay.value = 'notifications'
    render(<NotificationBell />)
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', () => {
    mockActiveOverlay.value = 'notifications'
    render(<NotificationBell />)
    expect(screen.getByText('Aucune notification')).toBeInTheDocument()
  })

  it('shows close button in panel', () => {
    mockActiveOverlay.value = 'notifications'
    render(<NotificationBell />)
    expect(screen.getByLabelText('Fermer les notifications')).toBeInTheDocument()
  })

  it('calls close when close button is clicked', () => {
    mockActiveOverlay.value = 'notifications'
    render(<NotificationBell />)
    fireEvent.click(screen.getByLabelText('Fermer les notifications'))
    expect(mockClose).toHaveBeenCalledWith('notifications')
  })

  /* ---------- Notification list ---------- */

  it('renders notification items when present', () => {
    mockActiveOverlay.value = 'notifications'
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'MySquad',
          body: 'Nouvelle confirmation sur "Session A"',
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'rsvp',
          title: 'OtherSquad',
          body: 'Nouvelle confirmation sur "Session B"',
          read: true,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    })
    render(<NotificationBell />)
    expect(screen.getByText('MySquad')).toBeInTheDocument()
    expect(screen.getByText('OtherSquad')).toBeInTheDocument()
    expect(screen.getByText('Nouvelle confirmation sur "Session A"')).toBeInTheDocument()
    expect(screen.getByText('Nouvelle confirmation sur "Session B"')).toBeInTheDocument()
  })

  it('marks notification as read on click', () => {
    mockActiveOverlay.value = 'notifications'
    useNotificationStore.setState({
      notifications: [
        {
          id: 'n1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: false,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    })
    render(<NotificationBell />)
    fireEvent.click(screen.getByText('Squad'))
    // After marking as read, the store should update
    const state = useNotificationStore.getState()
    expect(state.notifications[0].read).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  /* ---------- Mark all as read ---------- */

  // The component auto-marks all as read when the panel opens (useEffect),
  // so the "Tout marquer comme lu" button disappears immediately after render.
  // We verify the auto-mark behavior instead.
  it('auto-marks all as read when panel opens with unread notifications', () => {
    mockActiveOverlay.value = 'notifications'
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: false,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    })
    render(<NotificationBell />)
    // After opening the panel, useEffect auto-calls markAllAsRead
    const state = useNotificationStore.getState()
    expect(state.unreadCount).toBe(0)
    expect(state.notifications.every((n) => n.read)).toBe(true)
  })

  it('does not show mark all as read button when unreadCount is 0', () => {
    mockActiveOverlay.value = 'notifications'
    useNotificationStore.setState({ notifications: [], unreadCount: 0 })
    render(<NotificationBell />)
    expect(screen.queryByLabelText('Tout marquer comme lu')).not.toBeInTheDocument()
  })

  it('marks all notifications via store action', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'A',
          body: 'a',
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'rsvp',
          title: 'B',
          body: 'b',
          read: false,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 2,
    })
    useNotificationStore.getState().markAllAsRead()
    const state = useNotificationStore.getState()
    expect(state.unreadCount).toBe(0)
    expect(state.notifications.every((n) => n.read)).toBe(true)
  })

  /* ---------- Escape key ---------- */

  it('closes panel on Escape key', () => {
    mockActiveOverlay.value = 'notifications'
    render(<NotificationBell />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockClose).toHaveBeenCalledWith('notifications')
  })

  it('does not react to Escape when panel is closed', () => {
    mockActiveOverlay.value = null
    render(<NotificationBell />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockClose).not.toHaveBeenCalled()
  })

  /* ---------- Outside click ---------- */

  it('closes panel on outside click', () => {
    mockActiveOverlay.value = 'notifications'
    render(<NotificationBell />)
    fireEvent.mouseDown(document)
    expect(mockClose).toHaveBeenCalledWith('notifications')
  })

  /* ---------- formatTime helper (via display) ---------- */

  it('displays "A l\'instant" for very recent notifications', () => {
    mockActiveOverlay.value = 'notifications'
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: false,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    })
    render(<NotificationBell />)
    expect(screen.getByText("À l'instant")).toBeInTheDocument()
  })

  it('displays minutes for recent notifications', () => {
    mockActiveOverlay.value = 'notifications'
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: false,
          created_at: fiveMinAgo,
        },
      ],
      unreadCount: 1,
    })
    render(<NotificationBell />)
    expect(screen.getByText('5min')).toBeInTheDocument()
  })

  it('displays hours for notifications within 24h', () => {
    mockActiveOverlay.value = 'notifications'
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: false,
          created_at: twoHoursAgo,
        },
      ],
      unreadCount: 1,
    })
    render(<NotificationBell />)
    expect(screen.getByText('2h')).toBeInTheDocument()
  })

  it('displays days for older notifications', () => {
    mockActiveOverlay.value = 'notifications'
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: false,
          created_at: threeDaysAgo,
        },
      ],
      unreadCount: 1,
    })
    render(<NotificationBell />)
    expect(screen.getByText('3j')).toBeInTheDocument()
  })

  /* ---------- Slicing to 15 max ---------- */

  it('displays at most 20 notifications', () => {
    mockActiveOverlay.value = 'notifications'
    const notifs = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      type: 'rsvp' as const,
      title: `Squad${i}`,
      body: `Body${i}`,
      read: true, // Already read to avoid auto-mark-all-read side effects
      created_at: new Date().toISOString(),
    }))
    useNotificationStore.setState({ notifications: notifs, unreadCount: 0 })
    render(<NotificationBell />)
    // Only 20 should be visible (slice(0, 20))
    expect(screen.getByText('Squad0')).toBeInTheDocument()
    expect(screen.getByText('Squad19')).toBeInTheDocument()
    expect(screen.queryByText('Squad20')).not.toBeInTheDocument()
  })

  /* ---------- Unread dot indicator ---------- */

  it('shows unread badge on bell icon when there are unread notifications', () => {
    // Don't open panel (no mockActiveOverlay) — just check the badge on the bell
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: false,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    })
    render(<NotificationBell />)
    // The bell button shows unread count badge
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('read notifications do not have unread styling', () => {
    mockActiveOverlay.value = 'notifications'
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          type: 'rsvp',
          title: 'Squad',
          body: 'Test',
          read: true,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 0,
    })
    const { container } = render(<NotificationBell />)
    const notifButton = container.querySelector('.bg-primary-5')
    expect(notifButton).not.toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------ */
/*  Store unit tests                                                   */
/* ------------------------------------------------------------------ */
describe('useNotificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Restore default chainable behavior
    mockFromChain.select.mockReturnValue(mockFromChain)
    mockFromChain.eq.mockReturnValue(mockFromChain)
    mockFromChain.neq.mockReturnValue(mockFromChain)
    mockFromChain.order.mockReturnValue(mockFromChain)
    mockFromChain.in.mockReturnValue(mockFromChain)
    mockFromChain.limit.mockReturnValue(mockFromChain)
    mockFromChain.then.mockImplementation((resolve: any) => resolve({ data: [], error: null }))
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    })
  })

  it('markAsRead updates a single notification', () => {
    useNotificationStore.setState({
      notifications: [
        { id: '1', type: 'rsvp', title: 'A', body: 'a', read: false, created_at: '' },
        { id: '2', type: 'rsvp', title: 'B', body: 'b', read: false, created_at: '' },
      ],
      unreadCount: 2,
    })
    useNotificationStore.getState().markAsRead('1')
    const state = useNotificationStore.getState()
    expect(state.notifications[0].read).toBe(true)
    expect(state.notifications[1].read).toBe(false)
    expect(state.unreadCount).toBe(1)
  })

  it('markAllAsRead updates all notifications', () => {
    useNotificationStore.setState({
      notifications: [
        { id: '1', type: 'rsvp', title: 'A', body: 'a', read: false, created_at: '' },
        { id: '2', type: 'rsvp', title: 'B', body: 'b', read: false, created_at: '' },
      ],
      unreadCount: 2,
    })
    useNotificationStore.getState().markAllAsRead()
    const state = useNotificationStore.getState()
    expect(state.notifications.every((n) => n.read)).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  it('fetchNotifications sets empty on no squad memberships', async () => {
    // Default .then() returns { data: [], error: null } for squad_members query
    // -> userSquadIds is empty -> returns early with empty notifications
    await useNotificationStore.getState().fetchNotifications('user-1')
    const state = useNotificationStore.getState()
    expect(state.notifications).toEqual([])
    expect(state.unreadCount).toBe(0)
    expect(state.isLoading).toBe(false)
  })

  it('fetchNotifications handles error gracefully', async () => {
    mockFromChain.then.mockImplementationOnce((_: any, reject: any) => {
      if (reject) return reject(new Error('fail'))
      throw new Error('fail')
    })
    await useNotificationStore.getState().fetchNotifications('user-1')
    const state = useNotificationStore.getState()
    expect(state.isLoading).toBe(false)
  })

  it('fetchNotifications builds notifications from memberships + sessions + rsvps + squads', async () => {
    const memberships = [{ squad_id: 'sq1' }]
    const sessions = [
      { id: 's1', title: 'Session Alpha', scheduled_at: '2026-01-02', squad_id: 'sq1' },
    ]
    const rsvps = [
      { id: 'r1', session_id: 's1', response: 'accepted', responded_at: '2026-01-01T00:00:00Z' },
    ]
    const squads = [{ id: 'sq1', name: 'Alpha Squad' }]

    // Sequence of awaited calls:
    // 1. squad_members: from().select().eq() -> await chain
    // 2. sessions: from().select().in().order().limit() -> await chain
    // 3. session_rsvps: from().select().in().neq().order().limit() -> await chain
    // 4. squads: from().select().in() -> await chain
    mockFromChain.then
      .mockImplementationOnce((resolve: any) => resolve({ data: memberships, error: null }))
      .mockImplementationOnce((resolve: any) => resolve({ data: sessions, error: null }))
      .mockImplementationOnce((resolve: any) => resolve({ data: rsvps, error: null }))
      .mockImplementationOnce((resolve: any) => resolve({ data: squads, error: null }))

    await useNotificationStore.getState().fetchNotifications('user-1')
    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].title).toBe('Alpha Squad')
    expect(state.notifications[0].body).toContain('Session Alpha')
    expect(state.notifications[0].type).toBe('rsvp')
    expect(state.unreadCount).toBe(1)
    expect(state.isLoading).toBe(false)
  })
})
