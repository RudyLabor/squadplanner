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
  ProgressRing: ({ value }: any) => createElement('div', { 'data-testid': 'progress-ring' }, `${value}%`),
  AnimatedCounter: ({ end, suffix }: any) => createElement('span', { 'data-testid': 'counter' }, `${end}${suffix || ''}`),
  HelpTooltip: ({ children }: any) => createElement('div', null, children),
}))

import { ProfileStats } from '../ProfileStats'

describe('ProfileStats', () => {
  const defaultProfile = {
    reliability_score: 80,
    total_sessions: 10,
    total_checkins: 8,
    level: 3,
    xp: 250,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    render(createElement(ProfileStats, {
      profile: defaultProfile,
      profileReady: true,
    }))
    expect(screen.getByLabelText('Statistiques')).toBeDefined()
  })

  it('shows skeleton when not ready', () => {
    const { container } = render(createElement(ProfileStats, {
      profile: null,
      profileReady: false,
    }))
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows create session CTA when no activity', () => {
    render(createElement(ProfileStats, {
      profile: { reliability_score: 0, total_sessions: 0, total_checkins: 0, level: 1, xp: 0 },
      profileReady: true,
    }))
    expect(screen.getByText('Planifie ta première session !')).toBeDefined()
    expect(screen.getByText('Créer une session')).toBeDefined()
  })

  it('does not show create session CTA when has activity', () => {
    render(createElement(ProfileStats, {
      profile: defaultProfile,
      profileReady: true,
    }))
    expect(screen.queryByText('Planifie ta première session !')).toBeNull()
  })

  it('renders reliability score', () => {
    render(createElement(ProfileStats, {
      profile: defaultProfile,
      profileReady: true,
    }))
    expect(screen.getByText('80%')).toBeDefined()
  })

  it('renders progress ring', () => {
    render(createElement(ProfileStats, {
      profile: defaultProfile,
      profileReady: true,
    }))
    expect(screen.getByTestId('progress-ring')).toBeDefined()
  })

  it('renders Score de fiabilite label', () => {
    render(createElement(ProfileStats, {
      profile: defaultProfile,
      profileReady: true,
    }))
    expect(screen.getByText('Score de fiabilité')).toBeDefined()
  })

  it('renders stat grid with 4 stats', () => {
    render(createElement(ProfileStats, {
      profile: defaultProfile,
      profileReady: true,
    }))
    expect(screen.getByText('Sessions')).toBeDefined()
    expect(screen.getByText('Check-ins')).toBeDefined()
    expect(screen.getByText('Niveau')).toBeDefined()
    expect(screen.getByText('XP')).toBeDefined()
  })

  it('shows tier name based on score', () => {
    render(createElement(ProfileStats, {
      profile: { ...defaultProfile, reliability_score: 95 },
      profileReady: true,
    }))
    expect(screen.getByText('Légende')).toBeDefined()
  })

  it('shows Debutant tier for low score', () => {
    render(createElement(ProfileStats, {
      profile: { ...defaultProfile, reliability_score: 30, total_sessions: 1, total_checkins: 1 },
      profileReady: true,
    }))
    expect(screen.getByText('Débutant')).toBeDefined()
  })

  it('treats new player score as 0 regardless of DB value', () => {
    render(createElement(ProfileStats, {
      profile: { reliability_score: 100, total_sessions: 0, total_checkins: 0, level: 1, xp: 0 },
      profileReady: true,
    }))
    expect(screen.getByText('0%')).toBeDefined()
  })

  it('shows next tier progress when not at max', () => {
    render(createElement(ProfileStats, {
      profile: { ...defaultProfile, reliability_score: 60 },
      profileReady: true,
    }))
    expect(screen.getByText(/restants/)).toBeDefined()
  })

  it('handles null profile gracefully', () => {
    expect(() =>
      render(createElement(ProfileStats, {
        profile: null,
        profileReady: false,
      }))
    ).not.toThrow()
  })
})
