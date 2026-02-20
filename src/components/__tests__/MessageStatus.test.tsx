import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({ useLocation: vi.fn().mockReturnValue({ pathname: '/' }), useNavigate: vi.fn().mockReturnValue(vi.fn()), useParams: vi.fn().mockReturnValue({}), Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children), Outlet: () => null, useMatches: vi.fn().mockReturnValue([]) }))
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

import { MessageStatus } from '../MessageStatus'

describe('MessageStatus', () => {
  it('renders without crash (default)', () => {
    render(<MessageStatus currentUserId="user-1" />)
    expect(screen.getByText('Envoyé')).toBeInTheDocument()
  })

  it('shows default sent status when no readAt or readBy provided', () => {
    const { container } = render(<MessageStatus currentUserId="user-1" />)
    expect(screen.getByText('Envoyé')).toBeInTheDocument()
    expect(container.querySelector('.text-text-tertiary')).toBeInTheDocument()
  })

  it('shows read status for DM with readAt', () => {
    render(<MessageStatus currentUserId="user-1" readAt="2026-01-01T00:00:00Z" />)
    expect(screen.getByText('Lu')).toBeInTheDocument()
  })

  it('shows sent status for DM without readAt (null)', () => {
    render(<MessageStatus currentUserId="user-1" readAt={null} />)
    expect(screen.getByText('Envoyé')).toBeInTheDocument()
  })

  it('shows read status (blue check) for DM with readAt', () => {
    const { container } = render(<MessageStatus currentUserId="user-1" readAt="2026-01-01T00:00:00Z" />)
    expect(container.querySelector('.text-primary')).toBeInTheDocument()
  })

  it('shows sent status (grey check) for DM without readAt', () => {
    const { container } = render(<MessageStatus currentUserId="user-1" readAt={null} />)
    expect(container.querySelector('.text-text-tertiary')).toBeInTheDocument()
  })

  it('shows read status for squad with readBy containing other users', () => {
    render(<MessageStatus currentUserId="user-1" readBy={['user-1', 'user-2']} />)
    expect(screen.getByText('Lu')).toBeInTheDocument()
  })

  it('shows sent status for squad readBy with only own user', () => {
    render(<MessageStatus currentUserId="user-1" readBy={['user-1']} />)
    expect(screen.getByText('Envoyé')).toBeInTheDocument()
  })

  it('shows sent status for squad readBy empty array', () => {
    render(<MessageStatus currentUserId="user-1" readBy={[]} />)
    expect(screen.getByText('Envoyé')).toBeInTheDocument()
  })

  it('shows read status for squad readBy with multiple other users', () => {
    render(<MessageStatus currentUserId="user-1" readBy={['user-1', 'user-2', 'user-3']} />)
    expect(screen.getByText('Lu')).toBeInTheDocument()
  })

  it('uses expectedReaders for squad read calculation', () => {
    // With expectedReaders=3, need 2 readers (excluding self) to be considered "read"
    render(<MessageStatus currentUserId="user-1" readBy={['user-1', 'user-2']} expectedReaders={3} />)
    // Only 1 reader (user-2), need 2 (3-1), so should be "sent"
    expect(screen.getByText('Envoyé')).toBeInTheDocument()
  })

  it('marks as read when expectedReaders is met', () => {
    render(
      <MessageStatus
        currentUserId="user-1"
        readBy={['user-1', 'user-2', 'user-3']}
        expectedReaders={3}
      />
    )
    // 2 readers (user-2, user-3) >= 2 (3-1), so "read"
    expect(screen.getByText('Lu')).toBeInTheDocument()
  })

  it('renders sr-only text for accessibility', () => {
    render(<MessageStatus currentUserId="user-1" readAt="2026-01-01T00:00:00Z" />)
    const srOnly = screen.getByText('Lu')
    expect(srOnly).toHaveClass('sr-only')
  })

  it('renders inline-flex span wrapper', () => {
    const { container } = render(<MessageStatus currentUserId="user-1" />)
    expect(container.querySelector('.inline-flex')).toBeInTheDocument()
  })
})
