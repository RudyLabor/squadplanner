import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

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
  Button: ({ children, ...props }: any) => createElement('button', props, children),
  Input: (props: any) => createElement('input', props),
  Expandable: ({ children }: any) => createElement('div', null, children),
}))
vi.mock('../../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn() }))
vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'url' } }),
      }),
    },
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  },
}))

import { ProfileHeader } from '../ProfileHeader'

describe('ProfileHeader', () => {
  const defaultProps = {
    user: { id: 'user-1', email: 'test@test.com' },
    profile: { username: 'TestUser', bio: 'Hello world', avatar_url: null },
    isLoading: false,
    updateProfile: vi.fn().mockResolvedValue({ error: null }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    render(createElement(ProfileHeader, defaultProps))
    expect(screen.getByText('TestUser')).toBeDefined()
  })

  it('shows default username when empty', () => {
    render(
      createElement(ProfileHeader, {
        ...defaultProps,
        profile: { username: '', bio: null, avatar_url: null },
      })
    )
    expect(screen.getByText('Gamer')).toBeDefined()
  })

  it('shows edit button', () => {
    render(createElement(ProfileHeader, defaultProps))
    expect(screen.getByText('Modifier le profil')).toBeDefined()
  })

  it('shows settings button', () => {
    render(createElement(ProfileHeader, defaultProps))
    expect(screen.getByText('Paramètres')).toBeDefined()
  })

  it('shows user email', () => {
    render(createElement(ProfileHeader, defaultProps))
    expect(screen.getByText('test@test.com')).toBeDefined()
  })

  it('shows bio text', () => {
    render(createElement(ProfileHeader, defaultProps))
    expect(screen.getByText('Hello world')).toBeDefined()
  })

  it('shows default bio when no bio', () => {
    render(
      createElement(ProfileHeader, {
        ...defaultProps,
        profile: { username: 'Test', bio: null, avatar_url: null },
      })
    )
    expect(screen.getByText('Pas encore de bio')).toBeDefined()
  })

  it('shows edit form when edit button is clicked', () => {
    render(createElement(ProfileHeader, defaultProps))
    fireEvent.click(screen.getByText('Modifier le profil'))
    expect(screen.getByText('Modifier le profil')).toBeDefined()
    expect(screen.getByPlaceholderText('Ton pseudo')).toBeDefined()
    expect(screen.getByPlaceholderText('Bio (optionnel)')).toBeDefined()
  })

  it('renders photo upload button', () => {
    render(createElement(ProfileHeader, defaultProps))
    expect(screen.getByLabelText('Changer la photo de profil')).toBeDefined()
  })

  it('renders avatar image when url provided', () => {
    render(
      createElement(ProfileHeader, {
        ...defaultProps,
        profile: { username: 'Test', bio: null, avatar_url: 'https://example.com/avatar.jpg' },
      })
    )
    expect(screen.getByAlt('Avatar')).toBeDefined()
  })
})
