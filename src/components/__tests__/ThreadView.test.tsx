import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock framer-motion
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

// Mock icons
vi.mock('../icons', () => ({
  X: (props: any) => createElement('svg', props),
  Send: (props: any) => createElement('svg', props),
  MessageSquare: (props: any) => createElement('svg', props),
  Loader2: (props: any) => createElement('svg', props),
}))

// Mock auth
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

// Mock threads hook
vi.mock('../../hooks/useThreads', () => ({
  useThreads: vi.fn().mockReturnValue({
    messages: [],
    isLoading: false,
    sendReply: vi.fn(),
    isSending: false,
  }),
  useThreadInfo: vi.fn().mockReturnValue({
    data: null,
  }),
}))

import { ThreadView, ThreadIndicator } from '../ThreadView'

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn()

describe('ThreadView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(createElement(ThreadView, {
      threadId: 'thread-1',
      isOpen: false,
      onClose: vi.fn(),
    }))
    expect(container.innerHTML).toBe('')
  })

  it('renders thread panel when open', () => {
    render(createElement(ThreadView, {
      threadId: 'thread-1',
      isOpen: true,
      onClose: vi.fn(),
    }))
    expect(screen.getByText('Thread')).toBeDefined()
  })

  it('shows empty state when no messages', () => {
    render(createElement(ThreadView, {
      threadId: 'thread-1',
      isOpen: true,
      onClose: vi.fn(),
    }))
    expect(screen.getByText('Aucune réponse')).toBeDefined()
  })

  it('renders input field', () => {
    render(createElement(ThreadView, {
      threadId: 'thread-1',
      isOpen: true,
      onClose: vi.fn(),
    }))
    expect(screen.getByPlaceholderText('Répondre dans le thread...')).toBeDefined()
  })
})

describe('ThreadIndicator', () => {
  it('renders nothing when replyCount is 0', () => {
    const { container } = render(createElement(ThreadIndicator, {
      replyCount: 0,
      onClick: vi.fn(),
    }))
    expect(container.innerHTML).toBe('')
  })

  it('renders reply count', () => {
    render(createElement(ThreadIndicator, {
      replyCount: 5,
      onClick: vi.fn(),
    }))
    expect(screen.getByText('5 réponses')).toBeDefined()
  })

  it('uses singular for 1 reply', () => {
    render(createElement(ThreadIndicator, {
      replyCount: 1,
      onClick: vi.fn(),
    }))
    expect(screen.getByText('1 réponse')).toBeDefined()
  })
})
