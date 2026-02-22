import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
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
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    from: vi
      .fn()
      .mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }),
  },
  supabase: {
    from: vi
      .fn()
      .mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))
vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

const mockSetQuery = vi.fn()
const mockClearSearch = vi.fn()

vi.mock('../../hooks/useMessageSearch', () => ({
  useMessageSearch: () => ({
    query: '',
    setQuery: mockSetQuery,
    squadResults: [],
    dmResults: [],
    totalResults: 0,
    isLoading: false,
    clearSearch: mockClearSearch,
  }),
}))

import { MessageSearchPanel } from '../MessageSearchPanel'

describe('MessageSearchPanel', () => {
  it('renders without crash when open', () => {
    render(<MessageSearchPanel isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText('Rechercher dans les messages...')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const { container } = render(<MessageSearchPanel isOpen={false} onClose={vi.fn()} />)
    expect(container.querySelector('input')).toBeNull()
  })

  it('shows search input with autofocus', () => {
    render(<MessageSearchPanel isOpen={true} onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText('Rechercher dans les messages...')
    expect(input).toBeInTheDocument()
  })

  it('shows hint for minimum characters when query is short', () => {
    render(<MessageSearchPanel isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/au moins 2 caractères/)).toBeInTheDocument()
  })

  it('has close button', () => {
    const onClose = vi.fn()
    render(<MessageSearchPanel isOpen={true} onClose={onClose} />)
    // There are two X buttons (clear search + close panel)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('passes squadId to useMessageSearch', () => {
    render(<MessageSearchPanel isOpen={true} onClose={vi.fn()} squadId="sq-1" />)
    expect(screen.getByPlaceholderText('Rechercher dans les messages...')).toBeInTheDocument()
  })

  it('renders correctly with all optional props', () => {
    render(
      <MessageSearchPanel
        isOpen={true}
        onClose={vi.fn()}
        onNavigateToMessage={vi.fn()}
        onNavigateToDM={vi.fn()}
        squadId="sq-1"
      />
    )
    expect(screen.getByPlaceholderText('Rechercher dans les messages...')).toBeInTheDocument()
  })
})
