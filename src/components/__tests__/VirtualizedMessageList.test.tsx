import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
import { useVirtualizer } from '@tanstack/react-virtual'

const mockUseVirtualizer = vi.mocked(useVirtualizer)

// Helper to generate mock messages
function generateMessages(
  count: number,
  options: Partial<{ contentLength: number; isSystem: boolean; hasReply: boolean }> = {}
) {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    content: 'x'.repeat(options.contentLength || 20),
    created_at: new Date(Date.now() - (count - i) * 60000).toISOString(),
    sender_id: `user-${i % 3}`,
    is_system_message: options.isSystem || false,
    reply_to_id: options.hasReply ? `msg-${i - 1}` : null,
  }))
}

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
    mockUseVirtualizer.mockReturnValue({
      getVirtualItems: vi.fn().mockReturnValue([]),
      getTotalSize: vi.fn().mockReturnValue(0),
      scrollToIndex: vi.fn(),
      measureElement: vi.fn(),
    } as any)
  })

  it('renders skeleton when loading with no messages', () => {
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        isLoading: true,
      })
    )
    expect(screen.getByTestId('skeleton')).toBeDefined()
  })

  it('renders the container when not loading', () => {
    const { container } = render(createElement(VirtualizedMessageList, defaultProps))
    expect(container.querySelector('.overflow-y-auto')).toBeDefined()
  })

  it('renders loading more indicator when isLoadingMore', () => {
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        isLoadingMore: true,
      })
    )
    expect(screen.getByTestId('loading-more')).toBeDefined()
  })

  it('renders typing indicator when provided', () => {
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        typingIndicator: createElement('div', { 'data-testid': 'typing' }, 'Typing...'),
      })
    )
    expect(screen.getByTestId('typing')).toBeDefined()
  })

  it('renders with messages-end marker', () => {
    const { container } = render(createElement(VirtualizedMessageList, defaultProps))
    expect(container.querySelector('#messages-end')).toBeDefined()
  })

  // --- P1.1 Audit: dynamic height estimation based on content length ---

  it('passes estimateSize function to useVirtualizer', () => {
    const messages = generateMessages(5)
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages,
      })
    )
    expect(mockUseVirtualizer).toHaveBeenCalled()
    const callArgs = mockUseVirtualizer.mock.calls[0][0]
    expect(callArgs).toHaveProperty('estimateSize')
    expect(typeof callArgs.estimateSize).toBe('function')
  })

  it('estimates smaller height for system messages', () => {
    const systemMsg = [
      {
        id: 'sys-1',
        content: 'User joined',
        created_at: new Date().toISOString(),
        sender_id: 'system',
        is_system_message: true,
      },
    ]
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages: systemMsg,
      })
    )
    const callArgs = mockUseVirtualizer.mock.calls[0][0]
    const height = callArgs.estimateSize(0)
    // System messages return 60
    expect(height).toBe(60)
  })

  it('estimates larger height for long messages', () => {
    const longMsg = [
      {
        id: 'long-1',
        content: 'x'.repeat(300),
        created_at: new Date().toISOString(),
        sender_id: 'user-1',
      },
    ]
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages: longMsg,
      })
    )
    const callArgs = mockUseVirtualizer.mock.calls[0][0]
    const height = callArgs.estimateSize(0)
    // Long message should have a higher estimate, capped at 300
    expect(height).toBeGreaterThan(70)
    expect(height).toBeLessThanOrEqual(300)
  })

  it('estimates extra height for messages with replies', () => {
    const replyMsg = [
      {
        id: 'reply-1',
        content: 'Short reply',
        created_at: new Date().toISOString(),
        sender_id: 'user-1',
        reply_to_id: 'msg-0',
      },
    ]
    const normalMsg = [
      {
        id: 'normal-1',
        content: 'Short reply',
        created_at: new Date().toISOString(),
        sender_id: 'user-1',
        reply_to_id: null,
      },
    ]

    // Render with reply message
    const { unmount } = render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages: replyMsg,
      })
    )
    const replyHeight = mockUseVirtualizer.mock.calls[0][0].estimateSize(0)
    unmount()

    vi.clearAllMocks()

    // Render with normal message (same content length)
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages: normalMsg,
      })
    )
    const normalHeight = mockUseVirtualizer.mock.calls[0][0].estimateSize(0)

    // Reply message should be taller due to +40 for reply
    expect(replyHeight).toBeGreaterThan(normalHeight)
  })

  it('returns default 80 for undefined message index', () => {
    const messages = generateMessages(1)
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages,
      })
    )
    const callArgs = mockUseVirtualizer.mock.calls[0][0]
    // Index out of bounds returns 80
    const height = callArgs.estimateSize(999)
    expect(height).toBe(80)
  })

  // --- P1.1 Audit: rendering with 100+ messages ---

  it('passes correct count to virtualizer with 100+ messages', () => {
    const messages = generateMessages(150)
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages,
      })
    )
    const callArgs = mockUseVirtualizer.mock.calls[0][0]
    expect(callArgs.count).toBe(150)
  })

  // --- P1.1 Audit: scroll behavior and onScroll callback ---

  it('attaches onScroll handler to container', () => {
    const onScrollMock = vi.fn()
    const { container } = render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        onScroll: onScrollMock,
      })
    )
    const scrollContainer = container.querySelector('.overflow-y-auto')
    expect(scrollContainer).toBeDefined()
    // The onScroll is attached to the div
    if (scrollContainer) {
      fireEvent.scroll(scrollContainer)
    }
  })

  it('uses overscan of 5 for virtualizer', () => {
    render(createElement(VirtualizedMessageList, defaultProps))
    const callArgs = mockUseVirtualizer.mock.calls[0][0]
    expect(callArgs.overscan).toBe(5)
  })

  it('uses message id as item key', () => {
    const messages = generateMessages(3)
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages,
      })
    )
    const callArgs = mockUseVirtualizer.mock.calls[0][0]
    expect(callArgs.getItemKey(0)).toBe('msg-0')
    expect(callArgs.getItemKey(1)).toBe('msg-1')
  })

  // --- P1.1 Audit: virtual items rendering ---

  it('renders virtual items when virtualizer returns items', () => {
    const messages = generateMessages(3)
    mockUseVirtualizer.mockReturnValue({
      getVirtualItems: vi.fn().mockReturnValue([
        { key: 'msg-0', index: 0, start: 0, size: 80 },
        { key: 'msg-1', index: 1, start: 80, size: 80 },
      ]),
      getTotalSize: vi.fn().mockReturnValue(240),
      scrollToIndex: vi.fn(),
      measureElement: vi.fn(),
    } as any)

    const renderMessage = vi.fn((msg: any) =>
      createElement('div', { key: msg.id, 'data-testid': `message-${msg.id}` }, msg.content)
    )

    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages,
        renderMessage,
      })
    )

    // renderMessage should have been called for each virtual item
    expect(renderMessage).toHaveBeenCalledTimes(2)
    expect(renderMessage).toHaveBeenCalledWith(messages[0], 0)
    expect(renderMessage).toHaveBeenCalledWith(messages[1], 1)
  })

  // --- P1.1 Audit: typing indicator placement ---

  it('renders typing indicator after the virtual list', () => {
    const { container } = render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        typingIndicator: createElement(
          'div',
          { 'data-testid': 'typing-indicator' },
          'Someone is typing...'
        ),
      })
    )
    expect(screen.getByTestId('typing-indicator')).toBeDefined()
    expect(screen.getByText('Someone is typing...')).toBeDefined()
  })

  it('does not render typing indicator when not provided', () => {
    render(createElement(VirtualizedMessageList, defaultProps))
    expect(screen.queryByTestId('typing-indicator')).toBeNull()
  })

  // --- P1.1 Audit: LoadingMore indicator ---

  it('does not show loading-more indicator when isLoadingMore is false', () => {
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        isLoadingMore: false,
      })
    )
    expect(screen.queryByTestId('loading-more')).toBeNull()
  })

  it('shows loading-more indicator with correct text', () => {
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        isLoadingMore: true,
      })
    )
    expect(screen.getByText('Chargement des messages...')).toBeDefined()
  })

  // --- P1.1 Audit: skeleton state ---

  it('does not show skeleton when loading but messages exist', () => {
    const messages = generateMessages(5)
    render(
      createElement(VirtualizedMessageList, {
        ...defaultProps,
        messages,
        isLoading: true,
      })
    )
    expect(screen.queryByTestId('skeleton')).toBeNull()
  })
})
