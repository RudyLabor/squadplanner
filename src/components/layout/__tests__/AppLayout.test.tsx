import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}))

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn() }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../../hooks', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'u1' }, profile: { id: 'u1', username: 'Test' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'u1' }, profile: { id: 'u1', username: 'Test' } }) }),
  useSquadsStore: vi.fn().mockReturnValue({}),
  useKeyboardVisible: vi.fn().mockReturnValue(false),
  useUnreadCountStore: Object.assign(vi.fn().mockReturnValue({ totalUnread: 0, fetchCounts: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() }), { getState: vi.fn().mockReturnValue({}) }),
  useSquadNotificationsStore: Object.assign(vi.fn().mockReturnValue({ pendingRsvpCount: 0, fetchPendingCounts: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() }), { getState: vi.fn().mockReturnValue({}) }),
  useGlobalPresence: vi.fn(),
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'u1' }, profile: { id: 'u1', username: 'Test' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'u1' }, profile: { id: 'u1', username: 'Test' } }) }),
}))

vi.mock('../../CreateSessionModal', () => ({
  useCreateSessionModal: Object.assign(vi.fn().mockReturnValue(vi.fn()), { getState: vi.fn().mockReturnValue({}) }),
}))

vi.mock('../../CustomStatusModal', () => ({
  CustomStatusModal: () => null,
}))

vi.mock('../DesktopSidebar', () => ({
  DesktopSidebar: () => createElement('aside', null, 'DesktopSidebar'),
}))

vi.mock('../MobileBottomNav', () => ({
  MobileBottomNav: () => createElement('nav', null, 'MobileBottomNav'),
}))

vi.mock('../TopBar', () => ({
  TopBar: () => createElement('header', null, 'TopBar'),
}))

import { AppLayout } from '../AppLayout'

describe('AppLayout', () => {
  it('renders without crash with children', () => {
    render(<AppLayout><div>Page Content</div></AppLayout>)
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('renders navigation components', () => {
    render(<AppLayout><div>Content</div></AppLayout>)
    expect(screen.getByText('DesktopSidebar')).toBeInTheDocument()
    expect(screen.getByText('MobileBottomNav')).toBeInTheDocument()
    expect(screen.getByText('TopBar')).toBeInTheDocument()
  })
})
