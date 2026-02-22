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

// Mock icons
vi.mock('../icons', () => ({
  Pin: (props: any) => createElement('svg', props),
  ChevronDown: (props: any) => createElement('svg', props),
  X: (props: any) => createElement('svg', props),
}))

import { PinnedMessages, type PinnedMessage } from '../PinnedMessages'

describe('PinnedMessages', () => {
  const mockPinnedMessages: PinnedMessage[] = [
    {
      pin_id: 'pin1',
      message_id: 'msg1',
      message_content: 'First pinned message content',
      message_sender_id: 'user1',
      message_sender_username: 'Alice',
      message_created_at: new Date().toISOString(),
      pinned_by_id: 'user2',
      pinned_by_username: 'Bob',
      pinned_at: new Date().toISOString(),
    },
  ]

  const defaultProps = {
    pinnedMessages: mockPinnedMessages,
    currentUserId: 'user1',
    isAdmin: false,
    onUnpin: vi.fn(),
    onScrollToMessage: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no pinned messages', () => {
    const { container } = render(
      createElement(PinnedMessages, { ...defaultProps, pinnedMessages: [] })
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders pinned message count', () => {
    render(createElement(PinnedMessages, defaultProps))
    expect(screen.getByText(/1 message épinglé/)).toBeDefined()
  })

  it('expands on click to show message content', () => {
    render(createElement(PinnedMessages, defaultProps))
    const expandBtn = screen.getByRole('button', { expanded: false })
    fireEvent.click(expandBtn)
    expect(screen.getByText('First pinned message content')).toBeDefined()
  })

  it('shows unpin button for admins', () => {
    render(createElement(PinnedMessages, { ...defaultProps, isAdmin: true }))
    // Expand first
    const expandBtn = screen.getByRole('button', { expanded: false })
    fireEvent.click(expandBtn)
    expect(screen.getByLabelText('Désépingler ce message')).toBeDefined()
  })

  it('calls onScrollToMessage when clicking a pinned message', () => {
    render(createElement(PinnedMessages, defaultProps))
    const expandBtn = screen.getByRole('button', { expanded: false })
    fireEvent.click(expandBtn)
    const msgBtn = screen.getByLabelText('Voir le message de Alice')
    fireEvent.click(msgBtn)
    expect(defaultProps.onScrollToMessage).toHaveBeenCalledWith('msg1')
  })

  it('pluralizes correctly for multiple messages', () => {
    const twoMessages = [
      ...mockPinnedMessages,
      { ...mockPinnedMessages[0], pin_id: 'pin2', message_id: 'msg2' },
    ]
    render(createElement(PinnedMessages, { ...defaultProps, pinnedMessages: twoMessages }))
    expect(screen.getByText(/2 messages épinglés/)).toBeDefined()
  })
})
