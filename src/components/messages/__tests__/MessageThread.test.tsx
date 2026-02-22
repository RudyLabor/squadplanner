import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement, createRef } from 'react'
import { MessageThread } from '../MessageThread'
import type { MessageBubbleMessage } from '../MessageBubble'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy(
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
    createElement(
      'div',
      { 'data-testid': 'message-list-skeleton', 'data-count': count },
      `Loading ${count} messages`
    ),
}))

// Mock EmptyState
vi.mock('../../EmptyState', () => ({
  EmptyState: ({ title, message, type }: any) =>
    createElement('div', { 'data-testid': 'empty-state', 'data-type': type }, [
      createElement('span', { key: 't' }, title),
      createElement('span', { key: 'm' }, message),
    ]),
}))

// Mock TypingIndicator
vi.mock('../../TypingIndicator', () => ({
  TypingIndicator: ({ text }: any) =>
    createElement('div', { 'data-testid': 'typing-indicator' }, text),
}))

// Mock SwipeableMessage - capture props
vi.mock('../../SwipeableMessage', () => ({
  SwipeableMessage: ({ children, enableSwipeLeft, enableSwipeRight, disabled }: any) =>
    createElement(
      'div',
      {
        'data-testid': 'swipeable-message',
        'data-swipe-left': enableSwipeLeft,
        'data-swipe-right': enableSwipeRight,
        'data-disabled': disabled,
      },
      children
    ),
}))

// Mock MessageBubble - capture all important props
vi.mock('../MessageBubble', () => ({
  MessageBubble: ({
    message,
    isOwn,
    showAvatar,
    showName,
    isSquadChat,
    isAdmin,
    replyToMessage,
    senderRole,
  }: any) =>
    createElement(
      'div',
      {
        'data-testid': `bubble-${message.id}`,
        'data-is-own': isOwn,
        'data-show-avatar': showAvatar,
        'data-show-name': showName,
        'data-is-squad': isSquadChat,
        'data-is-admin': isAdmin,
        'data-reply-to': replyToMessage?.id || '',
        'data-sender-role': senderRole || '',
      },
      message.content
    ),
}))

// Mock utils
vi.mock('../utils', () => ({
  formatDateSeparator: (d: string) => 'Today',
}))

const msg1: MessageBubbleMessage = {
  id: 'msg-1',
  content: 'Hello world',
  created_at: '2026-02-14T12:00:00Z',
  sender_id: 'user-2',
  sender: { username: 'JohnDoe', avatar_url: null },
}

const msg2: MessageBubbleMessage = {
  id: 'msg-2',
  content: 'Reply message',
  created_at: '2026-02-14T12:01:00Z',
  sender_id: 'user-1',
  sender: { username: 'TestUser', avatar_url: null },
}

const msg3SameDate: MessageBubbleMessage = {
  id: 'msg-3',
  content: 'Same date msg',
  created_at: '2026-02-14T12:02:00Z',
  sender_id: 'user-2',
  sender: { username: 'JohnDoe', avatar_url: null },
}

const msgWithReply: MessageBubbleMessage = {
  id: 'msg-reply',
  content: 'This is a reply',
  created_at: '2026-02-14T12:03:00Z',
  sender_id: 'user-1',
  sender: { username: 'TestUser', avatar_url: null },
  reply_to_id: 'msg-1',
}

const systemMsg: MessageBubbleMessage = {
  id: 'msg-system',
  content: 'User joined',
  created_at: '2026-02-14T12:04:00Z',
  sender_id: 'system',
  sender: { username: 'System' },
  is_system_message: true,
}

const defaultProps = {
  isLoading: false,
  embedded: false,
  typingText: null as string | null,
  showScrollButton: false,
  messagesContainerRef: createRef<HTMLDivElement>(),
  messagesEndRef: createRef<HTMLDivElement>(),
  messages: [msg1, msg2],
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
  // === LOADING STATE ===

  it('shows loading skeleton when isLoading and no messages', () => {
    render(<MessageThread {...defaultProps} isLoading={true} messages={[]} />)
    expect(screen.getByTestId('message-list-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('message-list-skeleton').getAttribute('data-count')).toBe('10')
  })

  it('does NOT show skeleton when loading but messages exist', () => {
    render(<MessageThread {...defaultProps} isLoading={true} messages={[msg1]} />)
    expect(screen.queryByTestId('message-list-skeleton')).not.toBeInTheDocument()
    expect(screen.getByTestId('bubble-msg-1')).toBeInTheDocument()
  })

  // === EMPTY STATE ===

  it('shows empty state when no messages and not loading', () => {
    render(<MessageThread {...defaultProps} messages={[]} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Nouvelle conversation')).toBeInTheDocument()
    expect(screen.getByText('Envoie le premier message !')).toBeInTheDocument()
  })

  it('uses max-w constraint when not embedded', () => {
    const { container } = render(<MessageThread {...defaultProps} messages={[]} />)
    expect(container.innerHTML).toContain('max-w-4xl')
  })

  it('does not use max-w constraint when embedded', () => {
    const { container } = render(<MessageThread {...defaultProps} messages={[]} embedded={true} />)
    expect(container.innerHTML).not.toContain('max-w-4xl')
  })

  // === MESSAGE RENDERING ===

  it('renders messages when they exist', () => {
    render(<MessageThread {...defaultProps} />)
    expect(screen.getByTestId('bubble-msg-1')).toBeInTheDocument()
    expect(screen.getByTestId('bubble-msg-2')).toBeInTheDocument()
  })

  it('renders message content text', () => {
    render(<MessageThread {...defaultProps} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Reply message')).toBeInTheDocument()
  })

  it('wraps messages in SwipeableMessage', () => {
    render(<MessageThread {...defaultProps} />)
    expect(screen.getAllByTestId('swipeable-message').length).toBe(2)
  })

  // === isOwn DETECTION ===

  it('correctly marks own messages (sender_id matches userId)', () => {
    render(<MessageThread {...defaultProps} />)
    // msg1 is from user-2, not own
    expect(screen.getByTestId('bubble-msg-1').getAttribute('data-is-own')).toBe('false')
    // msg2 is from user-1 (our userId), own
    expect(screen.getByTestId('bubble-msg-2').getAttribute('data-is-own')).toBe('true')
  })

  // === SWIPE DIRECTION ===

  it('enables swipe left for non-own messages (reply)', () => {
    render(<MessageThread {...defaultProps} />)
    const swipeables = screen.getAllByTestId('swipeable-message')
    // First message is not own -> swipe left enabled
    expect(swipeables[0].getAttribute('data-swipe-left')).toBe('true')
    expect(swipeables[0].getAttribute('data-swipe-right')).toBe('false')
  })

  it('enables swipe right for own messages (actions)', () => {
    render(<MessageThread {...defaultProps} />)
    const swipeables = screen.getAllByTestId('swipeable-message')
    // Second message is own -> swipe right enabled
    expect(swipeables[1].getAttribute('data-swipe-right')).toBe('true')
    expect(swipeables[1].getAttribute('data-swipe-left')).toBe('false')
  })

  it('disables swipe for system messages', () => {
    render(<MessageThread {...defaultProps} messages={[systemMsg]} />)
    const swipeable = screen.getByTestId('swipeable-message')
    expect(swipeable.getAttribute('data-disabled')).toBe('true')
  })

  // === AVATAR & NAME LOGIC ===

  it('shows avatar for first message from a sender', () => {
    render(<MessageThread {...defaultProps} messages={[msg1, msg2]} />)
    expect(screen.getByTestId('bubble-msg-1').getAttribute('data-show-avatar')).toBe('true')
    expect(screen.getByTestId('bubble-msg-2').getAttribute('data-show-avatar')).toBe('true')
  })

  it('hides avatar for consecutive messages from same sender', () => {
    render(<MessageThread {...defaultProps} messages={[msg1, msg3SameDate]} />)
    // msg1 shows avatar (first), msg3 same sender -> no avatar
    expect(screen.getByTestId('bubble-msg-1').getAttribute('data-show-avatar')).toBe('true')
    expect(screen.getByTestId('bubble-msg-3').getAttribute('data-show-avatar')).toBe('false')
  })

  it('shows name in squad chat when showAvatar is true', () => {
    render(<MessageThread {...defaultProps} isSquadChat={true} messages={[msg1]} />)
    expect(screen.getByTestId('bubble-msg-1').getAttribute('data-show-name')).toBe('true')
  })

  it('does not show name in DM chat', () => {
    render(<MessageThread {...defaultProps} isSquadChat={false} messages={[msg1]} />)
    expect(screen.getByTestId('bubble-msg-1').getAttribute('data-show-name')).toBe('false')
  })

  // === REPLY TO MESSAGE ===

  it('resolves reply_to_id to replyToMessage data', () => {
    render(<MessageThread {...defaultProps} messages={[msg1, msgWithReply]} />)
    expect(screen.getByTestId('bubble-msg-reply').getAttribute('data-reply-to')).toBe('msg-1')
  })

  it('does not set replyToMessage when reply_to_id does not match', () => {
    const msgOrphan: MessageBubbleMessage = {
      ...msgWithReply,
      id: 'msg-orphan',
      reply_to_id: 'nonexistent',
    }
    render(<MessageThread {...defaultProps} messages={[msg1, msgOrphan]} />)
    expect(screen.getByTestId('bubble-msg-orphan').getAttribute('data-reply-to')).toBe('')
  })

  // === MEMBER ROLES MAP ===

  it('passes senderRole from memberRolesMap', () => {
    const rolesMap = new Map([['user-2', 'admin']])
    render(<MessageThread {...defaultProps} memberRolesMap={rolesMap} messages={[msg1]} />)
    expect(screen.getByTestId('bubble-msg-1').getAttribute('data-sender-role')).toBe('admin')
  })

  // === TYPING INDICATOR ===

  it('shows typing indicator when typingText is set', () => {
    render(<MessageThread {...defaultProps} typingText="JohnDoe est en train d'écrire..." />)
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    expect(screen.getByText("JohnDoe est en train d'écrire...")).toBeInTheDocument()
  })

  it('does not show typing indicator when typingText is null', () => {
    render(<MessageThread {...defaultProps} typingText={null} />)
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })

  // === SCROLL TO BOTTOM BUTTON ===

  it('shows scroll-to-bottom button when showScrollButton=true', () => {
    render(<MessageThread {...defaultProps} showScrollButton={true} />)
    expect(screen.getByLabelText('Scroll to bottom')).toBeInTheDocument()
  })

  it('hides scroll-to-bottom button when showScrollButton=false', () => {
    render(<MessageThread {...defaultProps} showScrollButton={false} />)
    expect(screen.queryByLabelText('Scroll to bottom')).not.toBeInTheDocument()
  })

  it('calls onScrollToBottom when scroll button clicked', () => {
    const onScrollToBottom = vi.fn()
    render(
      <MessageThread
        {...defaultProps}
        showScrollButton={true}
        onScrollToBottom={onScrollToBottom}
      />
    )
    fireEvent.click(screen.getByLabelText('Scroll to bottom'))
    expect(onScrollToBottom).toHaveBeenCalledOnce()
  })

  // === VIRTUALIZATION THRESHOLD ===
  // Messages >= 50 should use VirtualizedMessages path

  it('uses non-virtualized rendering for < 50 messages', () => {
    render(<MessageThread {...defaultProps} messages={[msg1, msg2]} />)
    // Direct rendering: messages should be visible as bubbles
    expect(screen.getByTestId('bubble-msg-1')).toBeInTheDocument()
    expect(screen.getByTestId('bubble-msg-2')).toBeInTheDocument()
  })

  it('uses virtualized rendering for >= 50 messages', () => {
    // Create 50 messages
    const manyMessages: MessageBubbleMessage[] = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      content: `Message ${i}`,
      created_at: `2026-02-14T12:${String(i).padStart(2, '0')}:00Z`,
      sender_id: i % 2 === 0 ? 'user-1' : 'user-2',
      sender: { username: i % 2 === 0 ? 'TestUser' : 'JohnDoe' },
    }))
    render(<MessageThread {...defaultProps} messages={manyMessages} />)
    // With virtualization, messages are rendered by the virtualizer
    // The mock useVirtualizer returns no virtual items, so no bubbles rendered
    expect(screen.queryByTestId('bubble-msg-0')).not.toBeInTheDocument()
  })

  // === isAdmin PROP ===

  it('passes isAdmin to MessageBubble', () => {
    render(<MessageThread {...defaultProps} isAdmin={true} messages={[msg1]} />)
    expect(screen.getByTestId('bubble-msg-1').getAttribute('data-is-admin')).toBe('true')
  })

  // === DATE SEPARATOR ===

  it('renders date separator when date changes between messages', () => {
    const msg1Day1: MessageBubbleMessage = {
      ...msg1,
      created_at: '2026-02-13T12:00:00Z',
    }
    const msg2Day2: MessageBubbleMessage = {
      ...msg2,
      created_at: '2026-02-14T12:00:00Z',
    }
    // getMessageDate returns different values for different days
    const getMessageDate = (d: string) => new Date(d).toDateString()
    render(
      <MessageThread
        {...defaultProps}
        messages={[msg1Day1, msg2Day2]}
        getMessageDate={getMessageDate}
      />
    )
    // Should show "Today" separator (from mock formatDateSeparator)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('does not render date separator for messages on same date', () => {
    // Both messages have same date -> same getMessageDate
    const getMessageDate = () => 'Sat Feb 14 2026'
    render(
      <MessageThread {...defaultProps} messages={[msg1, msg2]} getMessageDate={getMessageDate} />
    )
    // Only one date separator for the first message (where prev is undefined -> '' !== 'Sat...')
    const separators = screen.getAllByText('Today')
    expect(separators.length).toBe(1)
  })
})
