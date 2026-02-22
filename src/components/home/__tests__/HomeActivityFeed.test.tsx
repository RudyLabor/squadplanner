import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
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
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

const mockUseActivityFeedQuery = vi.fn().mockReturnValue({ data: [], isLoading: false })
vi.mock('../../../hooks/queries/useActivityFeedQuery', () => ({
  useActivityFeedQuery: (...args: any[]) => mockUseActivityFeedQuery(...args),
  getRelativeTime: vi.fn().mockReturnValue('il y a 5 min'),
}))

vi.mock(
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, p) =>
          typeof p === 'string'
            ? (props: any) => createElement('span', { 'data-testid': `icon-${p}`, ...props })
            : undefined,
      }
    )
)
vi.mock('../../ui', () => ({
  Card: ({ children, ...props }: any) =>
    createElement('div', { 'data-testid': 'card', ...props }, children),
}))

import { HomeActivityFeed } from '../HomeActivityFeed'

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(createElement(QueryClientProvider, { client: qc }, ui))
}

describe('HomeActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActivityFeedQuery.mockReturnValue({ data: [], isLoading: false })
  })

  it('renders without crash', () => {
    renderWithProviders(createElement(HomeActivityFeed, { squadIds: [] }))
    expect(screen.getByText('Activité récente')).toBeDefined()
  })

  it('shows empty state when no activities and no squads', () => {
    renderWithProviders(createElement(HomeActivityFeed, { squadIds: [] }))
    expect(screen.getByText("Pas encore d'activité")).toBeDefined()
    expect(screen.getByText("Rejoins une squad pour voir l'activité ici.")).toBeDefined()
  })

  it('shows different empty message when user has squads', () => {
    renderWithProviders(createElement(HomeActivityFeed, { squadIds: ['squad-1'] }))
    expect(screen.getByText("Pas encore d'activité")).toBeDefined()
    expect(
      screen.getByText(
        'Participe à des sessions ou envoie des messages pour voir ton activité ici.'
      )
    ).toBeDefined()
  })

  it('shows loading skeleton when loading', () => {
    mockUseActivityFeedQuery.mockReturnValue({ data: [], isLoading: true })
    const { container } = renderWithProviders(createElement(HomeActivityFeed, { squadIds: ['s1'] }))
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders activity items when data is available', () => {
    mockUseActivityFeedQuery.mockReturnValue({
      data: [
        {
          id: 'a1',
          type: 'session_rsvp',
          description: 'Alice a confirmé sa présence',
          detail: 'Session Valorant',
          timestamp: new Date().toISOString(),
          avatarInitial: 'A',
          avatarColor: 'bg-primary/15 text-primary',
        },
        {
          id: 'a2',
          type: 'session_created',
          description: 'Bob a créé une session',
          detail: 'CS2 Ranked',
          timestamp: new Date().toISOString(),
          avatarInitial: 'B',
          avatarColor: 'bg-success/15 text-success',
        },
      ],
      isLoading: false,
    })
    renderWithProviders(createElement(HomeActivityFeed, { squadIds: ['s1'] }))
    expect(screen.getByText('Alice a confirmé sa présence')).toBeDefined()
    expect(screen.getByText('Bob a créé une session')).toBeDefined()
  })

  it('has correct section aria-label', () => {
    renderWithProviders(createElement(HomeActivityFeed, { squadIds: [] }))
    expect(screen.getByLabelText('Activité récente')).toBeDefined()
  })

  it('renders activity details', () => {
    mockUseActivityFeedQuery.mockReturnValue({
      data: [
        {
          id: 'a1',
          type: 'squad_joined',
          description: 'Charlie a rejoint la squad',
          detail: 'Team Alpha',
          timestamp: new Date().toISOString(),
          avatarInitial: 'C',
          avatarColor: 'bg-info/15 text-info',
        },
      ],
      isLoading: false,
    })
    renderWithProviders(createElement(HomeActivityFeed, { squadIds: ['s1'] }))
    expect(screen.getByText('Team Alpha')).toBeDefined()
  })

  it('passes squadIds to the query hook', () => {
    const squadIds = ['sq1', 'sq2', 'sq3']
    renderWithProviders(createElement(HomeActivityFeed, { squadIds }))
    expect(mockUseActivityFeedQuery).toHaveBeenCalledWith(squadIds)
  })
})
