import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { DiscoverSquadCard } from '../DiscoverSquadCard'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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

vi.mock('../../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

vi.mock('../../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

vi.mock('../../../hooks/useSquads', () => ({
  useSquadsStore: () => ({ squads: [] }),
}))

describe('DiscoverSquadCard', () => {
  const baseSquad = {
    id: 'squad-1',
    name: 'Alpha Team',
    game: 'Valorant',
    description: 'A great squad',
    invite_code: 'ABC123',
    member_count: 5,
    avg_reliability: 85,
    region: 'EU',
    tags: ['competitive', 'ranked'],
    owner_username: 'player1',
    owner_avatar: null,
    is_public: true,
    created_at: '2026-01-01',
  }

  it('renders squad name and game', () => {
    render(<DiscoverSquadCard squad={baseSquad} />)
    expect(screen.getByText('Alpha Team')).toBeDefined()
    expect(screen.getByText('Valorant')).toBeDefined()
  })

  it('renders member count', () => {
    render(<DiscoverSquadCard squad={baseSquad} />)
    expect(screen.getByText('5 membres')).toBeDefined()
  })

  it('renders reliability percentage', () => {
    render(<DiscoverSquadCard squad={baseSquad} />)
    expect(screen.getByText('85%')).toBeDefined()
  })

  it('renders region', () => {
    render(<DiscoverSquadCard squad={baseSquad} />)
    expect(screen.getByText('EU')).toBeDefined()
  })

  it('renders tags', () => {
    render(<DiscoverSquadCard squad={baseSquad} />)
    expect(screen.getByText('competitive')).toBeDefined()
    expect(screen.getByText('ranked')).toBeDefined()
  })

  it('renders owner username', () => {
    render(<DiscoverSquadCard squad={baseSquad} />)
    expect(screen.getByText('player1')).toBeDefined()
  })

  it('renders description when provided', () => {
    render(<DiscoverSquadCard squad={baseSquad} />)
    expect(screen.getByText('A great squad')).toBeDefined()
  })

  it('renders "Rejoindre" button when not a member', () => {
    render(<DiscoverSquadCard squad={baseSquad} />)
    expect(screen.getByText('Rejoindre')).toBeDefined()
  })

  it('shows singular "membre" for count of 1', () => {
    const singleMemberSquad = { ...baseSquad, member_count: 1 }
    render(<DiscoverSquadCard squad={singleMemberSquad} />)
    expect(screen.getByText('1 membre')).toBeDefined()
  })

  it('handles null reliability', () => {
    const squadNoReliability = { ...baseSquad, avg_reliability: 0 }
    render(<DiscoverSquadCard squad={squadNoReliability} />)
    expect(screen.queryByText('0%')).toBeNull()
  })
})
