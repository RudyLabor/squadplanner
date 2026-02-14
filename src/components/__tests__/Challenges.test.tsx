import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
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

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }), rpc: vi.fn().mockResolvedValue({ data: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }), rpc: vi.fn().mockResolvedValue({ data: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }),
}))
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }),
}))

vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr', useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }) }))
vi.mock('../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() }))
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() } }))

// Mock ChallengeCard sub-component
vi.mock('../challenges/ChallengeCard', () => ({
  ChallengeCard: ({ challenge }: any) => createElement('div', { 'data-testid': 'challenge-card' }, challenge.title),
}))

import { Challenges } from '../Challenges'

describe('Challenges', () => {
  const mockChallenges = [
    { id: 'c1', title: 'Daily Challenge', description: 'Play once', xp_reward: 100, type: 'daily' as const, icon: 'star', requirements: { type: 'play', count: 1 } },
    { id: 'c2', title: 'Weekly Win', description: 'Win 5 games', xp_reward: 500, type: 'weekly' as const, icon: 'trophy', requirements: { type: 'win', count: 5 } },
  ]

  it('renders without crash', () => {
    render(<Challenges challenges={mockChallenges} onClaimXP={vi.fn()} />)
    expect(screen.getByText('Challenges')).toBeTruthy()
  })

  it('shows challenge count', () => {
    render(<Challenges challenges={mockChallenges} onClaimXP={vi.fn()} />)
    expect(screen.getByText('2 challenges disponibles')).toBeTruthy()
  })

  it('renders empty state when no challenges', () => {
    render(<Challenges challenges={[]} onClaimXP={vi.fn()} />)
    expect(screen.getByText('Aucun challenge dans cette catégorie')).toBeTruthy()
  })
})
