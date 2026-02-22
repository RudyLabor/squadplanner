import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { ConversationHeader } from '../ConversationHeader'

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
vi.mock('../../icons', () => ({
  ArrowLeft: (props: any) => createElement('svg', { ...props, 'data-testid': 'arrow-left-icon' }),
  Users: (props: any) => createElement('svg', { ...props, 'data-testid': 'users-icon' }),
  Gamepad2: (props: any) => createElement('svg', { ...props, 'data-testid': 'gamepad-icon' }),
  Search: (props: any) => createElement('svg', { ...props, 'data-testid': 'search-icon' }),
  Phone: (props: any) => createElement('svg', { ...props, 'data-testid': 'phone-icon' }),
}))

// Mock voice call (lazy import)
vi.mock('../../../hooks/useVoiceCall', () => ({
  useVoiceCallStore: {
    getState: vi.fn().mockReturnValue({ startCall: vi.fn() }),
  },
}))

const defaultProps = {
  embedded: false,
  isSquadChat: false,
  squadConv: null,
  dmConv: null,
  chatName: 'Test Chat',
  chatSubtitle: 'Online',
  showMessageSearch: false,
  messageSearchQuery: '',
  messageSearchCount: 0,
  onBack: vi.fn(),
  onToggleSearch: vi.fn(),
  onSearchChange: vi.fn(),
}

describe('ConversationHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConversationHeader {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows back button when not embedded', () => {
    render(<ConversationHeader {...defaultProps} embedded={false} />)
    expect(screen.getByLabelText('Retour')).toBeInTheDocument()
  })

  it('hides back button when embedded', () => {
    render(<ConversationHeader {...defaultProps} embedded={true} />)
    expect(screen.queryByLabelText('Retour')).not.toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    render(<ConversationHeader {...defaultProps} onBack={onBack} />)
    fireEvent.click(screen.getByLabelText('Retour'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('displays squad chat header with squad name', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={true}
        squadConv={{ type: 'squad', name: 'Ma Squad' }}
        chatName="Ma Squad"
        chatSubtitle="5 membres"
      />
    )
    expect(screen.getByText('Ma Squad')).toBeInTheDocument()
    expect(screen.getByText('5 membres')).toBeInTheDocument()
  })

  it('displays session icon for session type squad conv', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={true}
        squadConv={{ type: 'session', name: 'Session' }}
        chatName="Session"
      />
    )
    expect(screen.getByTestId('gamepad-icon')).toBeInTheDocument()
  })

  it('displays users icon for squad type squad conv', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={true}
        squadConv={{ type: 'squad', name: 'Squad' }}
        chatName="Squad"
      />
    )
    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
  })

  it('displays DM header with username', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={false}
        dmConv={{
          other_user_id: 'user-2',
          other_user_username: 'JohnDoe',
          other_user_avatar_url: null,
        }}
        chatName="JohnDoe"
      />
    )
    expect(screen.getByText('JohnDoe')).toBeInTheDocument()
  })

  it('shows initial letter when no avatar in DM', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        dmConv={{
          other_user_id: 'user-2',
          other_user_username: 'JohnDoe',
          other_user_avatar_url: null,
        }}
        chatName="JohnDoe"
      />
    )
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('shows avatar image in DM when provided', () => {
    const { container } = render(
      <ConversationHeader
        {...defaultProps}
        dmConv={{
          other_user_id: 'user-2',
          other_user_username: 'JohnDoe',
          other_user_avatar_url: 'https://example.com/avatar.jpg',
        }}
        chatName="JohnDoe"
      />
    )
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('shows phone button for DM conversations', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        dmConv={{
          other_user_id: 'user-2',
          other_user_username: 'JohnDoe',
          other_user_avatar_url: null,
        }}
      />
    )
    expect(screen.getByLabelText('Appeler JohnDoe')).toBeInTheDocument()
  })

  it('shows search toggle button for squad chats', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={true}
        squadConv={{ type: 'squad', name: 'Squad' }}
        chatName="Squad"
      />
    )
    expect(screen.getByLabelText('Rechercher dans les messages')).toBeInTheDocument()
  })

  it('calls onToggleSearch when search button is clicked', () => {
    const onToggleSearch = vi.fn()
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={true}
        squadConv={{ type: 'squad', name: 'Squad' }}
        chatName="Squad"
        onToggleSearch={onToggleSearch}
      />
    )
    fireEvent.click(screen.getByLabelText('Rechercher dans les messages'))
    expect(onToggleSearch).toHaveBeenCalledOnce()
  })

  it('shows search bar when showMessageSearch is true', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={true}
        squadConv={{ type: 'squad', name: 'Squad' }}
        showMessageSearch={true}
      />
    )
    expect(screen.getByPlaceholderText('Rechercher dans les messages...')).toBeInTheDocument()
  })

  it('shows result count when search query exists', () => {
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={true}
        squadConv={{ type: 'squad', name: 'Squad' }}
        showMessageSearch={true}
        messageSearchQuery="hello"
        messageSearchCount={3}
      />
    )
    expect(screen.getByText('3 résultat(s)')).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in search input', () => {
    const onSearchChange = vi.fn()
    render(
      <ConversationHeader
        {...defaultProps}
        isSquadChat={true}
        squadConv={{ type: 'squad', name: 'Squad' }}
        showMessageSearch={true}
        onSearchChange={onSearchChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Rechercher dans les messages...'), {
      target: { value: 'test' },
    })
    expect(onSearchChange).toHaveBeenCalledWith('test')
  })
})
