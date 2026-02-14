import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/u/TestUser', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({ username: 'TestUser' }),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    m: new Proxy({}, {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      }
    }),
    motion: new Proxy({}, {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      }
    }),
  }
})

// Mock icons
vi.mock('../../components/icons', () => ({
  ArrowLeft: ({ children, ...props }: any) => createElement('span', props, children),
  Shield: ({ children, ...props }: any) => createElement('span', props, children),
  Flame: ({ children, ...props }: any) => createElement('span', props, children),
  Star: ({ children, ...props }: any) => createElement('span', props, children),
  Calendar: ({ children, ...props }: any) => createElement('span', props, children),
  Gamepad2: ({ children, ...props }: any) => createElement('span', props, children),
  MapPin: ({ children, ...props }: any) => createElement('span', props, children),
  ExternalLink: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock public profile query
vi.mock('../../hooks/queries', () => ({
  usePublicProfileQuery: vi.fn().mockReturnValue({
    data: {
      username: 'TestUser',
      avatar_url: null,
      bio: 'Gamer passionnel',
      region: 'Europe',
      playstyle: 'competitive',
      xp: 1200,
      level: 5,
      reliability_score: 88,
      streak_days: 12,
      total_sessions: 50,
      total_checkins: 45,
      total_noshow: 2,
      preferred_games: ['Fortnite', 'Valorant'],
      twitch_username: 'testuser_tv',
      discord_username: 'TestUser#1234',
      created_at: '2025-06-15T00:00:00Z',
    },
    isLoading: false,
  }),
}))

import { PublicProfile } from '../PublicProfile'

describe('PublicProfile', () => {
  it('renders without crashing', () => {
    render(createElement(PublicProfile))
    expect(screen.getByText('TestUser')).toBeTruthy()
  })

  it('renders username', () => {
    render(createElement(PublicProfile))
    expect(screen.getByText('TestUser')).toBeTruthy()
  })

  it('renders bio', () => {
    render(createElement(PublicProfile))
    expect(screen.getByText('Gamer passionnel')).toBeTruthy()
  })

  it('renders stat cards', () => {
    render(createElement(PublicProfile))
    expect(screen.getByText('XP')).toBeTruthy()
    expect(screen.getByText('Fiabilité')).toBeTruthy()
    expect(screen.getByText('Sessions')).toBeTruthy()
    expect(screen.getByText('Streak')).toBeTruthy()
  })

  it('renders preferred games', () => {
    render(createElement(PublicProfile))
    expect(screen.getByText('Fortnite')).toBeTruthy()
    expect(screen.getByText('Valorant')).toBeTruthy()
  })

  it('renders social links', () => {
    render(createElement(PublicProfile))
    expect(screen.getByText('Twitch')).toBeTruthy()
    expect(screen.getByText(/Discord: TestUser#1234/)).toBeTruthy()
  })

  it('renders back link to discover', () => {
    render(createElement(PublicProfile))
    expect(screen.getByText('Découvrir')).toBeTruthy()
  })
})
