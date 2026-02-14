import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
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

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ data: [], error: null }), in: vi.fn().mockReturnValue({ ilike: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) }) }), ilike: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) }) }) }), rpc: vi.fn().mockResolvedValue({ data: null, error: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ data: [], error: null }) }) }), rpc: vi.fn().mockResolvedValue({ data: null, error: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  useSquadsStore: vi.fn().mockReturnValue({ squads: [] }),
  useSessionsStore: vi.fn().mockReturnValue({ sessions: [] }),
}))

vi.mock('../search/SearchResultsList', () => ({
  SearchResultsList: ({ query }: any) => createElement('div', { 'data-testid': 'search-results' }, query ? 'Results' : 'No results'),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

import { GlobalSearch } from '../GlobalSearch'

describe('GlobalSearch', () => {
  it('renders search trigger button', () => {
    render(<GlobalSearch />)
    expect(screen.getByLabelText('Rechercher')).toBeInTheDocument()
  })

  it('opens search modal when button clicked', () => {
    render(<GlobalSearch />)
    fireEvent.click(screen.getByLabelText('Rechercher'))
    expect(screen.getByLabelText('Recherche globale')).toBeInTheDocument()
  })

  it('renders search input in modal', () => {
    render(<GlobalSearch />)
    fireEvent.click(screen.getByLabelText('Rechercher'))
    expect(screen.getByPlaceholderText(/Rechercher squads/)).toBeInTheDocument()
  })

  it('renders keyboard shortcuts in footer', () => {
    render(<GlobalSearch />)
    fireEvent.click(screen.getByLabelText('Rechercher'))
    expect(screen.getByText('naviguer')).toBeInTheDocument()
    expect(screen.getByText('fermer')).toBeInTheDocument()
  })
})
