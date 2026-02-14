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

// Mock tanstack virtualizer
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn().mockReturnValue({
    getVirtualItems: vi.fn().mockReturnValue([]),
    getTotalSize: vi.fn().mockReturnValue(0),
    scrollToIndex: vi.fn(),
    measureElement: vi.fn(),
  }),
}))

// Mock LoadingMore
vi.mock('../ui/LoadingMore', () => ({
  LoadingMore: ({ text }: any) => createElement('div', { 'data-testid': 'loading-more' }, text),
}))

// Mock MessageSkeletons
vi.mock('../MessageSkeletons', () => ({
  MessageListSkeleton: () => createElement('div', { 'data-testid': 'skeleton' }, 'Loading...'),
  ConversationSkeleton: () => null,
  DMConversationSkeleton: () => null,
  ConversationListSkeleton: () => null,
}))

import { VirtualizedMessageList } from '../VirtualizedMessageList'

describe('VirtualizedMessageList', () => {
  const defaultProps = {
    messages: [] as any[],
    currentUserId: 'user-1',
    isSquadChat: true,
    isLoading: false,
    renderMessage: (msg: any) => createElement('div', { key: msg.id }, msg.content),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders skeleton when loading with no messages', () => {
    render(createElement(VirtualizedMessageList, {
      ...defaultProps,
      isLoading: true,
    }))
    expect(screen.getByTestId('skeleton')).toBeDefined()
  })

  it('renders the container when not loading', () => {
    const { container } = render(createElement(VirtualizedMessageList, defaultProps))
    expect(container.querySelector('.overflow-y-auto')).toBeDefined()
  })

  it('renders loading more indicator when isLoadingMore', () => {
    render(createElement(VirtualizedMessageList, {
      ...defaultProps,
      isLoadingMore: true,
    }))
    expect(screen.getByTestId('loading-more')).toBeDefined()
  })

  it('renders typing indicator when provided', () => {
    render(createElement(VirtualizedMessageList, {
      ...defaultProps,
      typingIndicator: createElement('div', { 'data-testid': 'typing' }, 'Typing...'),
    }))
    expect(screen.getByTestId('typing')).toBeDefined()
  })

  it('renders with messages-end marker', () => {
    const { container } = render(createElement(VirtualizedMessageList, defaultProps))
    expect(container.querySelector('#messages-end')).toBeDefined()
  })
})
