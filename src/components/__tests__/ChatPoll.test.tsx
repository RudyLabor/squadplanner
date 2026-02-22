import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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
    auth: { getSession: vi.fn() },
    from: vi
      .fn()
      .mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }),
  },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
      isInitialized: true,
    }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' } }) }
  ),
}))

vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr' }))
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))
vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

import { ChatPoll, isPollMessage, parsePollData } from '../ChatPoll'
import type { PollData } from '../ChatPoll'

describe('ChatPoll', () => {
  const pollData: PollData = {
    type: 'poll',
    question: 'Quel jeu ce soir ?',
    options: ['Valorant', 'League of Legends', 'CS2'],
    votes: { '0': ['user-2'], '1': [], '2': [] },
    createdBy: 'user-2',
  }

  it('renders without crash', () => {
    render(<ChatPoll pollData={pollData} messageId="msg-1" />)
    expect(screen.getByText('Sondage')).toBeTruthy()
  })

  it('displays the question', () => {
    render(<ChatPoll pollData={pollData} messageId="msg-1" />)
    expect(screen.getByText('Quel jeu ce soir ?')).toBeTruthy()
  })

  it('displays all options', () => {
    render(<ChatPoll pollData={pollData} messageId="msg-1" />)
    expect(screen.getByText('Valorant')).toBeTruthy()
    expect(screen.getByText('League of Legends')).toBeTruthy()
    expect(screen.getByText('CS2')).toBeTruthy()
  })
})

describe('isPollMessage', () => {
  it('returns true for valid poll JSON', () => {
    expect(isPollMessage(JSON.stringify({ type: 'poll', question: 'test', options: [] }))).toBe(
      true
    )
  })

  it('returns false for non-poll content', () => {
    expect(isPollMessage('Hello world')).toBe(false)
  })
})

describe('parsePollData', () => {
  it('parses valid poll data', () => {
    const data = { type: 'poll', question: 'Test', options: ['A', 'B'], votes: {}, createdBy: 'u1' }
    expect(parsePollData(JSON.stringify(data))).toEqual(data)
  })

  it('returns null for invalid content', () => {
    expect(parsePollData('not json')).toBeNull()
  })
})
