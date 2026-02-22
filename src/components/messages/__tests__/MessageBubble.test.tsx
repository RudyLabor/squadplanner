import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { MessageBubble, type MessageBubbleMessage } from '../MessageBubble'

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

// Mock child components
vi.mock('../../MessageStatus', () => ({
  MessageStatus: ({ readBy, readAt }: any) =>
    createElement('span', { 'data-testid': 'message-status' }, readAt ? 'Lu' : 'Envoyé'),
}))

vi.mock('../../MessageActions', () => ({
  MessageActions: (props: any) => createElement('div', { 'data-testid': 'message-actions' }),
}))

vi.mock('../../MessageReactions', () => ({
  MessageReactions: ({ messageId }: any) =>
    createElement('div', { 'data-testid': 'message-reactions' }),
}))

vi.mock('../../MessageReplyPreview', () => ({
  MessageReplyPreview: ({ originalMessage }: any) =>
    createElement('div', { 'data-testid': 'reply-preview' }, originalMessage.content),
}))

vi.mock('../../MessageContent', () => ({
  MessageContent: ({ content }: any) =>
    createElement('span', { 'data-testid': 'message-content' }, content),
}))

vi.mock('../../RoleBadge', () => ({
  RoleBadge: ({ role }: any) => createElement('span', { 'data-testid': 'role-badge' }, role),
}))

vi.mock('../../ThreadView', () => ({
  ThreadIndicator: ({ replyCount, onClick }: any) =>
    createElement(
      'button',
      { 'data-testid': 'thread-indicator', onClick },
      `${replyCount} replies`
    ),
}))

vi.mock('../utils', () => ({
  formatTime: (d: string) => '12:00',
}))

const baseMockMessage: MessageBubbleMessage = {
  id: 'msg-1',
  content: 'Hello world!',
  created_at: '2026-02-14T12:00:00Z',
  sender_id: 'user-2',
  sender: { username: 'JohnDoe', avatar_url: null },
}

const defaultProps = {
  message: baseMockMessage,
  isOwn: false,
  showAvatar: true,
  showName: true,
  currentUserId: 'user-1',
  isSquadChat: true,
  isAdmin: false,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onPin: vi.fn(),
  onReply: vi.fn(),
  onForward: vi.fn(),
  onPollVote: vi.fn(),
}

describe('MessageBubble', () => {
  it('renders without crashing', () => {
    const { container } = render(<MessageBubble {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('returns null for null message', () => {
    const { container } = render(<MessageBubble {...defaultProps} message={null as any} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null for message without id', () => {
    const { container } = render(
      <MessageBubble {...defaultProps} message={{ ...baseMockMessage, id: '' }} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders system message correctly', () => {
    const sysMsg: MessageBubbleMessage = {
      ...baseMockMessage,
      is_system_message: true,
      content: 'John a rejoint la squad',
    }
    render(<MessageBubble {...defaultProps} message={sysMsg} />)
    expect(screen.getByText('John a rejoint la squad')).toBeInTheDocument()
  })

  it('shows celebration style for system messages with keywords', () => {
    const sysMsg: MessageBubbleMessage = {
      ...baseMockMessage,
      is_system_message: true,
      content: 'User a confirme sa presence',
    }
    const { container } = render(<MessageBubble {...defaultProps} message={sysMsg} />)
    expect(container.textContent).toContain('confirme')
  })

  it('displays sender name when showName is true and not own message', () => {
    render(<MessageBubble {...defaultProps} showName={true} isOwn={false} />)
    expect(screen.getByText('JohnDoe')).toBeInTheDocument()
  })

  it('does not display sender name for own messages', () => {
    render(<MessageBubble {...defaultProps} showName={true} isOwn={true} />)
    expect(screen.queryByText('JohnDoe')).not.toBeInTheDocument()
  })

  it('renders message content', () => {
    render(<MessageBubble {...defaultProps} />)
    expect(screen.getByTestId('message-content')).toHaveTextContent('Hello world!')
  })

  it('shows avatar initial when no avatar URL', () => {
    render(<MessageBubble {...defaultProps} showAvatar={true} isOwn={false} />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('shows avatar image when avatar URL is provided', () => {
    const msgWithAvatar: MessageBubbleMessage = {
      ...baseMockMessage,
      sender: { username: 'JohnDoe', avatar_url: 'https://example.com/avatar.jpg' },
    }
    const { container } = render(
      <MessageBubble {...defaultProps} message={msgWithAvatar} showAvatar={true} isOwn={false} />
    )
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('shows pinned indicator when message is pinned', () => {
    const pinnedMsg: MessageBubbleMessage = { ...baseMockMessage, is_pinned: true }
    render(<MessageBubble {...defaultProps} message={pinnedMsg} />)
    expect(screen.getByText(/pingl/)).toBeInTheDocument()
  })

  it('shows edited indicator when message was edited', () => {
    const editedMsg: MessageBubbleMessage = {
      ...baseMockMessage,
      edited_at: '2026-02-14T13:00:00Z',
    }
    render(<MessageBubble {...defaultProps} message={editedMsg} />)
    expect(screen.getByText('(modifié)')).toBeInTheDocument()
  })

  it('shows message time', () => {
    render(<MessageBubble {...defaultProps} />)
    expect(screen.getByText('12:00')).toBeInTheDocument()
  })

  it('renders MessageActions component', () => {
    render(<MessageBubble {...defaultProps} />)
    expect(screen.getAllByTestId('message-actions').length).toBeGreaterThan(0)
  })

  it('renders MessageReactions for squad chats', () => {
    render(<MessageBubble {...defaultProps} isSquadChat={true} />)
    expect(screen.getByTestId('message-reactions')).toBeInTheDocument()
  })

  it('does not render MessageReactions for non-squad chats', () => {
    render(<MessageBubble {...defaultProps} isSquadChat={false} />)
    expect(screen.queryByTestId('message-reactions')).not.toBeInTheDocument()
  })

  it('renders reply preview when replyToMessage is provided', () => {
    const replyTo = {
      id: 'reply-1',
      sender_id: 'user-3',
      sender_username: 'Alice',
      content: 'Original message',
    }
    render(<MessageBubble {...defaultProps} replyToMessage={replyTo} />)
    expect(screen.getByTestId('reply-preview')).toHaveTextContent('Original message')
  })

  it('renders role badge when senderRole is provided', () => {
    render(<MessageBubble {...defaultProps} senderRole="admin" showName={true} isOwn={false} />)
    expect(screen.getByTestId('role-badge')).toHaveTextContent('admin')
  })

  it('renders thread indicator for squad chats with onThread callback', () => {
    const onThread = vi.fn()
    const msgWithThread: MessageBubbleMessage = {
      ...baseMockMessage,
      thread_reply_count: 5,
    }
    render(
      <MessageBubble
        {...defaultProps}
        message={msgWithThread}
        isSquadChat={true}
        onThread={onThread}
      />
    )
    expect(screen.getByTestId('thread-indicator')).toBeInTheDocument()
  })

  it('shows MessageStatus for own squad chat messages', () => {
    render(
      <MessageBubble
        {...defaultProps}
        isOwn={true}
        isSquadChat={true}
        message={{ ...baseMockMessage, sender_id: 'user-1', read_by: [] }}
      />
    )
    expect(screen.getByTestId('message-status')).toBeInTheDocument()
  })

  it('shows MessageStatus for own DM messages', () => {
    render(
      <MessageBubble
        {...defaultProps}
        isOwn={true}
        isSquadChat={false}
        message={{ ...baseMockMessage, sender_id: 'user-1', read_at: null }}
      />
    )
    expect(screen.getByTestId('message-status')).toBeInTheDocument()
  })
})
