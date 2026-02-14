import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement, createRef } from 'react'
import { MessageThread } from '../MessageThread'
import type { MessageBubbleMessage } from '../MessageBubble'

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
vi.mock('../../icons', () => ({
  ChevronDown: (props: any) => createElement('svg', { ...props, 'data-testid': 'chevron-down' }),
}))

// Mock tanstack virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn().mockReturnValue({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: vi.fn(),
    measureElement: vi.fn(),
  }),
}))

// Mock VirtualizedMessageList
vi.mock('../../VirtualizedMessageList', () => ({
  MessageListSkeleton: ({ count }: any) =>
    createElement('div', { 'data-testid': 'message-list-skeleton' }, `Loading ${count} messages`),
}))

// Mock EmptyState
vi.mock('../../EmptyState', () => ({
  EmptyState: ({ title, message }: any) =>
    createElement('div', { 'data-testid': 'empty-state' }, title),
}))

// Mock TypingIndicator
vi.mock('../../TypingIndicator', () => ({
  TypingIndicator: ({ text }: any) =>
    createElement('div', { 'data-testid': 'typing-indicator' }, text),
}))

// Mock SwipeableMessage
vi.mock('../../SwipeableMessage', () => ({
  SwipeableMessage: ({ children }: any) =>
    createElement('div', { 'data-testid': 'swipeable-message' }, children),
}))

// Mock MessageBubble
vi.mock('../MessageBubble', () => ({
  MessageBubble: ({ message }: any) =>
    createElement('div', { 'data-testid': `bubble-${message.id}` }, message.content),
}))

// Mock utils
vi.mock('../utils', () => ({
  formatDateSeparator: (d: string) => 'Today',
}))

const mockMessage: MessageBubbleMessage = {
  id: 'msg-1',
  content: 'Hello world',
  created_at: '2026-02-14T12:00:00Z',
  sender_id: 'user-2',
  sender: { username: 'JohnDoe', avatar_url: null },
}

const mockMessage2: MessageBubbleMessage = {
  id: 'msg-2',
  content: 'Goodbye world',
  created_at: '2026-02-14T12:01:00Z',
  sender_id: 'user-1',
  sender: { username: 'TestUser', avatar_url: null },
}

const defaultProps = {
  isLoading: false,
  embedded: false,
  typingText: null,
  showScrollButton: false,
  messagesContainerRef: createRef<HTMLDivElement>(),
  messagesEndRef: createRef<HTMLDivElement>(),
  messages: [mockMessage, mockMessage2],
  userId: 'user-1',
  isSquadChat: true,
  isAdmin: false,
  onEditMessage: vi.fn(),
  onDeleteMessage: vi.fn(),
  onPinMessage: vi.fn(),
  onReplyMessage: vi.fn(),
  onForwardMessage: vi.fn(),
  onPollVote: vi.fn(),
  onScrollToMessage: vi.fn(),
  onScroll: vi.fn(),
  onScrollToBottom: vi.fn(),
  getMessageDate: (d: string) => new Date(d).toDateString(),
}

describe('MessageThread', () => {
  it('renders without crashing', () => {
    const { container } = render(<MessageThread {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows loading skeleton when isLoading and no messages', () => {
    render(<MessageThread {...defaultProps} isLoading={true} messages={[]} />)
    expect(screen.getByTestId('message-list-skeleton')).toBeInTheDocument()
  })

  it('shows empty state when no messages and not loading', () => {
    render(<MessageThread {...defaultProps} messages={[]} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Nouvelle conversation')).toBeInTheDocument()
  })

  it('renders messages when they exist', () => {
    render(<MessageThread {...defaultProps} />)
    expect(screen.getByTestId('bubble-msg-1')).toBeInTheDocument()
    expect(screen.getByTestId('bubble-msg-2')).toBeInTheDocument()
  })

  it('renders message content', () => {
    render(<MessageThread {...defaultProps} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Goodbye world')).toBeInTheDocument()
  })

  it('shows typing indicator when typingText is set', () => {
    render(<MessageThread {...defaultProps} typingText="JohnDoe est en train d'écrire..." />)
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  it('does not show typing indicator when typingText is null', () => {
    render(<MessageThread {...defaultProps} typingText={null} />)
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })

  it('shows scroll-to-bottom button when showScrollButton is true', () => {
    render(<MessageThread {...defaultProps} showScrollButton={true} />)
    expect(screen.getByLabelText('Scroll to bottom')).toBeInTheDocument()
  })

  it('calls onScrollToBottom when scroll button is clicked', () => {
    const onScrollToBottom = vi.fn()
    render(
      <MessageThread {...defaultProps} showScrollButton={true} onScrollToBottom={onScrollToBottom} />
    )
    fireEvent.click(screen.getByLabelText('Scroll to bottom'))
    expect(onScrollToBottom).toHaveBeenCalledOnce()
  })

  it('hides scroll-to-bottom button when showScrollButton is false', () => {
    render(<MessageThread {...defaultProps} showScrollButton={false} />)
    expect(screen.queryByLabelText('Scroll to bottom')).not.toBeInTheDocument()
  })

  it('wraps messages in SwipeableMessage', () => {
    render(<MessageThread {...defaultProps} />)
    expect(screen.getAllByTestId('swipeable-message').length).toBe(2)
  })

  it('renders even with loading true but messages exist', () => {
    render(<MessageThread {...defaultProps} isLoading={true} messages={[mockMessage]} />)
    expect(screen.getByTestId('bubble-msg-1')).toBeInTheDocument()
  })
})
