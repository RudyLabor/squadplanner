import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
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

vi.mock('../../ui', () => ({
  SkeletonFriendsPlaying: () => createElement('div', { 'data-testid': 'skeleton-friends' }),
}))
vi.mock('../../FriendsPlaying', () => ({
  FriendsPlaying: ({ friends, onJoin, onInvite }: any) =>
    createElement(
      'div',
      { 'data-testid': 'friends-playing' },
      friends.map((f: any) => createElement('span', { key: f.id }, f.username))
    ),
}))

import { HomeFriendsSection } from '../HomeFriendsSection'

describe('HomeFriendsSection', () => {
  const defaultProps = {
    friendsPlaying: [] as any[],
    friendsLoading: false,
    onJoin: vi.fn(),
    onInvite: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash', () => {
    const { getByTestId } = render(createElement(HomeFriendsSection, defaultProps))
    expect(getByTestId('friends-playing')).toBeDefined()
  })

  it('shows skeleton when loading', () => {
    const { getByTestId } = render(
      createElement(HomeFriendsSection, { ...defaultProps, friendsLoading: true })
    )
    expect(getByTestId('skeleton-friends')).toBeDefined()
  })

  it('does not show skeleton when not loading', () => {
    const { queryByTestId } = render(createElement(HomeFriendsSection, defaultProps))
    expect(queryByTestId('skeleton-friends')).toBeNull()
  })

  it('passes friends data to FriendsPlaying', () => {
    const friends = [
      { id: 'f1', username: 'Alice', game: 'Valorant', squad_id: 's1' },
      { id: 'f2', username: 'Bob', game: 'CS2', squad_id: 's2' },
    ]
    const { getByText } = render(
      createElement(HomeFriendsSection, { ...defaultProps, friendsPlaying: friends })
    )
    expect(getByText('Alice')).toBeDefined()
    expect(getByText('Bob')).toBeDefined()
  })

  it('renders FriendsPlaying with empty list', () => {
    const { getByTestId } = render(createElement(HomeFriendsSection, defaultProps))
    expect(getByTestId('friends-playing')).toBeDefined()
    expect(getByTestId('friends-playing').childNodes.length).toBe(0)
  })

  it('does not render FriendsPlaying when loading', () => {
    const { queryByTestId } = render(
      createElement(HomeFriendsSection, { ...defaultProps, friendsLoading: true })
    )
    expect(queryByTestId('friends-playing')).toBeNull()
  })
})
