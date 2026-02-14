import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

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

vi.mock('../../icons', () => new Proxy({}, { get: (_t, p) => typeof p === 'string' ? (props: any) => createElement('span', { 'data-testid': `icon-${p}`, ...props }) : undefined }))
vi.mock('../../ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', { 'data-testid': 'card', ...props }, children),
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))
vi.mock('../../PremiumGate', () => ({
  PremiumBadge: () => createElement('span', null, 'Premium'),
}))
vi.mock('./ProfileActivityCard', () => ({
  ProfileActivityCard: ({ streakDays }: any) => createElement('div', { 'data-testid': 'activity-card' }, `Streak: ${streakDays}`),
}))
vi.mock('./ProfileCoachCard', () => ({
  ProfileCoachCard: () => createElement('div', { 'data-testid': 'coach-card' }, 'Coach'),
}))

import { ProfileHistory } from '../ProfileHistory'

describe('ProfileHistory', () => {
  const defaultProps = {
    profile: { streak_days: 5, streak_last_date: null, reliability_score: 80 },
    hasPremium: false,
    canAccessFeature: vi.fn().mockReturnValue(false),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    render(createElement(ProfileHistory, defaultProps))
    expect(screen.getByTestId('activity-card')).toBeDefined()
    expect(screen.getByTestId('coach-card')).toBeDefined()
  })

  it('shows premium CTA when not premium', () => {
    render(createElement(ProfileHistory, defaultProps))
    expect(screen.getByText('Passe Premium')).toBeDefined()
    expect(screen.getByText('Coach IA avancé, historique illimité, audio HD')).toBeDefined()
  })

  it('shows premium badge when premium', () => {
    render(createElement(ProfileHistory, { ...defaultProps, hasPremium: true }))
    expect(screen.getByText('Compte Premium')).toBeDefined()
    expect(screen.getByText('Toutes les features sont débloquées')).toBeDefined()
  })

  it('hides premium CTA when premium', () => {
    render(createElement(ProfileHistory, { ...defaultProps, hasPremium: true }))
    expect(screen.queryByText('Passe Premium')).toBeNull()
  })

  it('passes streak days to activity card', () => {
    render(createElement(ProfileHistory, defaultProps))
    expect(screen.getByText('Streak: 5')).toBeDefined()
  })

  it('renders call history card', () => {
    render(createElement(ProfileHistory, defaultProps))
    expect(screen.getByText('Historique des appels')).toBeDefined()
    expect(screen.getByText('Voir tous tes appels passés')).toBeDefined()
  })

  it('handles null profile gracefully', () => {
    expect(() =>
      render(createElement(ProfileHistory, {
        ...defaultProps,
        profile: null,
      }))
    ).not.toThrow()
  })

  it('passes aiCoachTip to coach card', () => {
    render(createElement(ProfileHistory, {
      ...defaultProps,
      aiCoachTip: { tip: 'Test tip', tone: 'neutral' },
    }))
    expect(screen.getByTestId('coach-card')).toBeDefined()
  })
})
