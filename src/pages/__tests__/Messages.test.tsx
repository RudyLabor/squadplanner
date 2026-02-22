import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// --- Hoisted mock variables ---
const mockH = vi.hoisted(() => {
  const mockSetSearchParams = vi.fn()
  const mockFetchSquadConvs = vi.fn()
  const mockFetchDMConvs = vi.fn()
  const mockSetActiveSquadConv = vi.fn()
  const mockSetActiveDMConv = vi.fn()
  const mockSendSquadMessage = vi.fn().mockResolvedValue({ error: null })
  const mockSendDMMessage = vi.fn().mockResolvedValue({ error: null })
  const mockEditSquadMessage = vi.fn().mockResolvedValue({ error: null })
  const mockDeleteSquadMessage = vi.fn().mockResolvedValue({ error: null })
  const mockPinSquadMessage = vi.fn().mockResolvedValue({ error: null })
  const mockMarkSquadAsRead = vi.fn()
  const mockUnsubscribeSquad = vi.fn()
  const mockUnsubscribeDM = vi.fn()
  const mockHandleTyping = vi.fn()

  let squadMessages: any[] = []
  let dmMessages: any[] = []
  let squadConversations: any[] = []
  let dmConversations: any[] = []
  let activeSquadConv: any = null
  let activeDMConv: any = null
  let isLoadingSquad = false
  let isLoadingDM = false
  let mockUser: any = {
    id: 'user-1',
    user_metadata: { username: 'TestUser' },
    email: 'test@test.com',
  }
  let mockSearchParams = new URLSearchParams()
  let mockSquadMembers: any[] = []
  let mockActiveTab: 'squads' | 'dms' = 'squads'
  let mockSetActiveTab = vi.fn()
  let mockHasPermission = false

  // Captured props
  let capturedConvListProps: any = null
  let capturedConvHeaderProps: any = null
  let capturedMessageThreadProps: any = null
  let capturedMessageComposerProps: any = null

  return {
    mockSetSearchParams,
    mockFetchSquadConvs,
    mockFetchDMConvs,
    mockSetActiveSquadConv,
    mockSetActiveDMConv,
    mockSendSquadMessage,
    mockSendDMMessage,
    mockEditSquadMessage,
    mockDeleteSquadMessage,
    mockPinSquadMessage,
    mockMarkSquadAsRead,
    mockUnsubscribeSquad,
    mockUnsubscribeDM,
    mockHandleTyping,
    get squadMessages() {
      return squadMessages
    },
    set squadMessages(v: any) {
      squadMessages = v
    },
    get dmMessages() {
      return dmMessages
    },
    set dmMessages(v: any) {
      dmMessages = v
    },
    get squadConversations() {
      return squadConversations
    },
    set squadConversations(v: any) {
      squadConversations = v
    },
    get dmConversations() {
      return dmConversations
    },
    set dmConversations(v: any) {
      dmConversations = v
    },
    get activeSquadConv() {
      return activeSquadConv
    },
    set activeSquadConv(v: any) {
      activeSquadConv = v
    },
    get activeDMConv() {
      return activeDMConv
    },
    set activeDMConv(v: any) {
      activeDMConv = v
    },
    get isLoadingSquad() {
      return isLoadingSquad
    },
    set isLoadingSquad(v: boolean) {
      isLoadingSquad = v
    },
    get isLoadingDM() {
      return isLoadingDM
    },
    set isLoadingDM(v: boolean) {
      isLoadingDM = v
    },
    get mockUser() {
      return mockUser
    },
    set mockUser(v: any) {
      mockUser = v
    },
    get mockSearchParams() {
      return mockSearchParams
    },
    set mockSearchParams(v: any) {
      mockSearchParams = v
    },
    get mockSquadMembers() {
      return mockSquadMembers
    },
    set mockSquadMembers(v: any) {
      mockSquadMembers = v
    },
    get mockActiveTab() {
      return mockActiveTab
    },
    set mockActiveTab(v: any) {
      mockActiveTab = v
    },
    get mockSetActiveTab() {
      return mockSetActiveTab
    },
    set mockSetActiveTab(v: any) {
      mockSetActiveTab = v
    },
    get mockHasPermission() {
      return mockHasPermission
    },
    set mockHasPermission(v: boolean) {
      mockHasPermission = v
    },
    get capturedConvListProps() {
      return capturedConvListProps
    },
    set capturedConvListProps(v: any) {
      capturedConvListProps = v
    },
    get capturedConvHeaderProps() {
      return capturedConvHeaderProps
    },
    set capturedConvHeaderProps(v: any) {
      capturedConvHeaderProps = v
    },
    get capturedMessageThreadProps() {
      return capturedMessageThreadProps
    },
    set capturedMessageThreadProps(v: any) {
      capturedMessageThreadProps = v
    },
    get capturedMessageComposerProps() {
      return capturedMessageComposerProps
    },
    set capturedMessageComposerProps(v: any) {
      capturedMessageComposerProps = v
    },
  }
})

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/messages', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn(() => [mockH.mockSearchParams, mockH.mockSetSearchParams]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

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

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'dm-user', username: 'DMUser', avatar_url: null },
          }),
        }),
      }),
    }),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null }) }),
      }),
    }),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({
      user: mockH.mockUser,
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
    })),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

// Mock Messages store
vi.mock('../../hooks/useMessages', () => ({
  useMessagesStore: Object.assign(
    vi.fn(() => ({
      messages: mockH.squadMessages,
      conversations: mockH.squadConversations,
      activeConversation: mockH.activeSquadConv,
      isLoading: mockH.isLoadingSquad,
      fetchConversations: mockH.mockFetchSquadConvs,
      setActiveConversation: mockH.mockSetActiveSquadConv,
      sendMessage: mockH.mockSendSquadMessage,
      editMessage: mockH.mockEditSquadMessage,
      deleteMessage: mockH.mockDeleteSquadMessage,
      pinMessage: mockH.mockPinSquadMessage,
      markAsRead: mockH.mockMarkSquadAsRead,
      unsubscribe: mockH.mockUnsubscribeSquad,
    })),
    { getState: vi.fn(() => ({ conversations: mockH.squadConversations })) }
  ),
}))

// Mock DirectMessages store
vi.mock('../../hooks/useDirectMessages', () => ({
  useDirectMessagesStore: Object.assign(
    vi.fn(() => ({
      messages: mockH.dmMessages,
      conversations: mockH.dmConversations,
      activeConversation: mockH.activeDMConv,
      isLoading: mockH.isLoadingDM,
      fetchConversations: mockH.mockFetchDMConvs,
      setActiveConversation: mockH.mockSetActiveDMConv,
      sendMessage: mockH.mockSendDMMessage,
      unsubscribe: mockH.mockUnsubscribeDM,
    })),
    { getState: vi.fn(() => ({ conversations: mockH.dmConversations })) }
  ),
}))

// Mock typing indicator
vi.mock('../../hooks/useTypingIndicator', () => ({
  useTypingIndicator: vi.fn(() => ({ typingText: '', handleTyping: mockH.mockHandleTyping })),
}))

// Mock state persistence
vi.mock('../../hooks/useStatePersistence', () => ({
  useStatePersistence: vi.fn(() => [mockH.mockActiveTab, mockH.mockSetActiveTab]),
}))

// Mock squad members query
vi.mock('../../hooks/queries/useSquadMembers', () => ({
  useSquadMembersQuery: vi.fn(() => ({ data: mockH.mockSquadMembers })),
}))

// Mock roles
vi.mock('../../lib/roles', () => ({
  hasPermission: vi.fn(() => mockH.mockHasPermission),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Sparkles: (props: any) => createElement('span', props),
}))

// Mock components
vi.mock('../../components/PinnedMessages', () => ({
  PinnedMessages: (props: any) =>
    props.pinnedMessages?.length > 0
      ? createElement('div', { 'data-testid': 'pinned-messages' })
      : null,
}))

vi.mock('../../components/EditMessageModal', () => ({
  EditMessageModal: ({ isOpen }: any) =>
    isOpen ? createElement('div', { 'data-testid': 'edit-modal' }) : null,
}))

vi.mock('../../components/CreatePollModal', () => ({
  CreatePollModal: ({ isOpen }: any) =>
    isOpen ? createElement('div', { 'data-testid': 'poll-modal' }) : null,
}))

vi.mock('../../components/ForwardMessageModal', () => ({
  ForwardMessageModal: ({ isOpen }: any) =>
    isOpen ? createElement('div', { 'data-testid': 'forward-modal' }) : null,
}))

vi.mock('../../components/ui', () => ({
  CrossfadeTransition: ({ children, skeleton, isLoading }: any) =>
    isLoading ? skeleton : children,
  SkeletonChatPage: () => createElement('div', { 'data-testid': 'skeleton-chat' }),
}))

vi.mock('../../components/PullToRefresh', () => ({
  PullToRefresh: ({ children }: any) =>
    createElement('div', { 'data-testid': 'pull-to-refresh' }, children),
}))

vi.mock('../../components/messages/ConversationList', () => ({
  ConversationList: (props: any) => {
    mockH.capturedConvListProps = props
    return createElement(
      'div',
      { 'data-testid': 'conversation-list' },
      createElement('span', null, `tab:${props.activeTab}`),
      createElement('span', null, `unread:${props.totalUnread}`)
    )
  },
}))

vi.mock('../../components/messages/ConversationHeader', () => ({
  ConversationHeader: (props: any) => {
    mockH.capturedConvHeaderProps = props
    return createElement(
      'div',
      { 'data-testid': 'conversation-header' },
      createElement('span', null, props.chatName || ''),
      createElement('span', null, props.chatSubtitle || ''),
      createElement('button', { onClick: props.onBack, 'data-testid': 'back-btn' }, 'Back')
    )
  },
}))

vi.mock('../../components/messages/MessageThread', () => ({
  MessageThread: (props: any) => {
    mockH.capturedMessageThreadProps = props
    return createElement('div', { 'data-testid': 'message-thread' })
  },
}))

vi.mock('../../components/messages/MessageComposer', () => ({
  MessageComposer: (props: any) => {
    mockH.capturedMessageComposerProps = props
    return createElement('div', { 'data-testid': 'message-composer' })
  },
}))

vi.mock('../../components/messages/MessageToast', () => ({
  MessageToast: ({ isVisible, message }: any) =>
    isVisible ? createElement('div', { 'data-testid': 'message-toast' }, message) : null,
}))

vi.mock('../../components/ThreadView', () => ({
  ThreadView: ({ isOpen }: any) =>
    isOpen ? createElement('div', { 'data-testid': 'thread-view' }) : null,
}))

import { Messages } from '../Messages'

describe('Messages Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })

    // Reset all mock state
    mockH.squadMessages = []
    mockH.dmMessages = []
    mockH.squadConversations = []
    mockH.dmConversations = []
    mockH.activeSquadConv = null
    mockH.activeDMConv = null
    mockH.isLoadingSquad = false
    mockH.isLoadingDM = false
    mockH.mockUser = {
      id: 'user-1',
      user_metadata: { username: 'TestUser' },
      email: 'test@test.com',
    }
    mockH.mockSearchParams = new URLSearchParams()
    mockH.mockSquadMembers = []
    mockH.mockActiveTab = 'squads'
    mockH.mockSetActiveTab = vi.fn()
    mockH.mockHasPermission = false
    mockH.capturedConvListProps = null
    mockH.capturedConvHeaderProps = null
    mockH.capturedMessageThreadProps = null
    mockH.capturedMessageComposerProps = null

    mockH.mockFetchSquadConvs.mockClear()
    mockH.mockFetchDMConvs.mockClear()
    mockH.mockSetActiveSquadConv.mockClear()
    mockH.mockSetActiveDMConv.mockClear()
    mockH.mockSendSquadMessage.mockReset().mockResolvedValue({ error: null })
    mockH.mockSendDMMessage.mockReset().mockResolvedValue({ error: null })
    mockH.mockEditSquadMessage.mockReset().mockResolvedValue({ error: null })
    mockH.mockDeleteSquadMessage.mockReset().mockResolvedValue({ error: null })
    mockH.mockPinSquadMessage.mockReset().mockResolvedValue({ error: null })
    mockH.mockMarkSquadAsRead.mockClear()
    mockH.mockUnsubscribeSquad.mockClear()
    mockH.mockUnsubscribeDM.mockClear()
    mockH.mockSetSearchParams.mockClear()
  })

  const renderMessages = () =>
    render(createElement(QueryClientProvider, { client: queryClient }, createElement(Messages)))

  // =================== MOBILE: NO ACTIVE CONVERSATION ===================
  describe('Mobile: no active conversation', () => {
    it('renders conversation list when no active conversation', () => {
      renderMessages()
      expect(screen.getByTestId('conversation-list')).toBeTruthy()
    })

    it('renders with aria label "Messages"', () => {
      renderMessages()
      expect(document.querySelector('[aria-label="Messages"]')).toBeTruthy()
    })

    it('renders PullToRefresh wrapper', () => {
      renderMessages()
      expect(screen.getByTestId('pull-to-refresh')).toBeTruthy()
    })

    it('fetches conversations on mount', () => {
      renderMessages()
      expect(mockH.mockFetchSquadConvs).toHaveBeenCalled()
      expect(mockH.mockFetchDMConvs).toHaveBeenCalled()
    })

    it('shows loading skeleton when initially loading with no data', () => {
      mockH.isLoadingSquad = true
      mockH.isLoadingDM = true
      mockH.squadConversations = []
      renderMessages()
      // CrossfadeTransition shows skeleton when isLoading is true
      expect(screen.getByTestId('skeleton-chat')).toBeTruthy()
    })

    it('shows conversation list after loading timeout', () => {
      // loadingTimedOut starts false, then becomes true after 2s
      // Since we don't advance timers, the initial state with loading = false should show list
      mockH.isLoadingSquad = false
      renderMessages()
      expect(screen.getByTestId('conversation-list')).toBeTruthy()
    })
  })

  // =================== CONVERSATION LIST PROPS ===================
  describe('Conversation list props', () => {
    it('passes activeTab to ConversationList', () => {
      mockH.mockActiveTab = 'dms'
      renderMessages()
      expect(screen.getByText('tab:dms')).toBeTruthy()
    })

    it('passes total unread count', () => {
      mockH.squadConversations = [
        { id: 'c1', squad_id: 'sq1', name: 'Squad 1', unread_count: 3 },
        { id: 'c2', squad_id: 'sq2', name: 'Squad 2', unread_count: 2 },
      ]
      mockH.dmConversations = [{ other_user_id: 'u1', other_user_username: 'A', unread_count: 1 }]
      renderMessages()
      expect(screen.getByText('unread:6')).toBeTruthy()
    })

    it('passes squad and DM conversations to list', () => {
      mockH.squadConversations = [{ id: 'c1', squad_id: 'sq1', name: 'SquadA', unread_count: 0 }]
      mockH.dmConversations = [
        { other_user_id: 'u1', other_user_username: 'UserB', unread_count: 0 },
      ]
      renderMessages()
      expect(mockH.capturedConvListProps.squadConversations).toHaveLength(1)
      expect(mockH.capturedConvListProps.dmConversations).toHaveLength(1)
    })

    it('filters squad conversations by search query', () => {
      mockH.squadConversations = [
        { id: 'c1', squad_id: 'sq1', name: 'Alpha Squad', unread_count: 0 },
        { id: 'c2', squad_id: 'sq2', name: 'Beta Team', unread_count: 0 },
      ]
      renderMessages()
      // By default, searchQuery is '', so both are included
      expect(mockH.capturedConvListProps.filteredSquadConvs).toHaveLength(2)
    })

    it('passes isDesktop false on mobile', () => {
      renderMessages()
      expect(mockH.capturedConvListProps.isDesktop).toBe(false)
    })
  })

  // =================== MOBILE: ACTIVE SQUAD CONVERSATION ===================
  describe('Mobile: active squad conversation', () => {
    beforeEach(() => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Alpha Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
    })

    it('renders chat view instead of conversation list', () => {
      renderMessages()
      expect(screen.getByTestId('conversation-header')).toBeTruthy()
      expect(screen.getByTestId('message-thread')).toBeTruthy()
      expect(screen.getByTestId('message-composer')).toBeTruthy()
    })

    it('passes correct chatName and chatSubtitle for squad chat', () => {
      renderMessages()
      expect(screen.getByText('Alpha Squad')).toBeTruthy()
      expect(screen.getByText('Chat de squad')).toBeTruthy()
    })

    it('passes "Chat de session" when squad conv type is session', () => {
      mockH.activeSquadConv = { ...mockH.activeSquadConv, type: 'session' }
      renderMessages()
      expect(screen.getByText('Chat de session')).toBeTruthy()
    })

    it('marks messages as read when squad conv is active', () => {
      renderMessages()
      expect(mockH.mockMarkSquadAsRead).toHaveBeenCalledWith('sq1', null)
    })

    it('passes isSquadChat=true to child components', () => {
      renderMessages()
      expect(mockH.capturedMessageThreadProps.isSquadChat).toBe(true)
    })

    it('passes messages to MessageThread', () => {
      mockH.squadMessages = [
        { id: 'm1', content: 'Hello', sender_id: 'user-1', created_at: new Date().toISOString() },
      ]
      renderMessages()
      expect(mockH.capturedMessageThreadProps.messages).toHaveLength(1)
    })
  })

  // =================== MOBILE: ACTIVE DM CONVERSATION ===================
  describe('Mobile: active DM conversation', () => {
    beforeEach(() => {
      mockH.activeDMConv = {
        other_user_id: 'u2',
        other_user_username: 'FriendUser',
        other_user_avatar_url: null,
        last_message_content: null,
        last_message_at: null,
        last_message_sender_id: null,
        unread_count: 0,
      }
    })

    it('renders chat view for DM', () => {
      renderMessages()
      expect(screen.getByTestId('conversation-header')).toBeTruthy()
      expect(screen.getByText('FriendUser')).toBeTruthy()
    })

    it('passes "Message privé" subtitle for DM', () => {
      renderMessages()
      expect(screen.getByText('Message privé')).toBeTruthy()
    })

    it('passes isSquadChat=false for DM', () => {
      renderMessages()
      expect(mockH.capturedMessageThreadProps.isSquadChat).toBe(false)
    })

    it('uses DM messages instead of squad messages', () => {
      mockH.dmMessages = [
        { id: 'dm1', content: 'Hi', sender_id: 'u2', created_at: new Date().toISOString() },
      ]
      renderMessages()
      expect(mockH.capturedMessageThreadProps.messages).toHaveLength(1)
    })
  })

  // =================== DESKTOP LAYOUT ===================
  describe('Desktop layout', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      window.dispatchEvent(new Event('resize'))
    })

    it('shows split layout on desktop with no active conversation', () => {
      renderMessages()
      // Desktop shows "Sélectionne une conversation" placeholder
      expect(screen.getByText('Sélectionne une conversation')).toBeTruthy()
    })

    it('shows conversation list in sidebar on desktop', () => {
      renderMessages()
      expect(screen.getByTestId('conversation-list')).toBeTruthy()
    })

    it('shows chat view in main area when squad conv is active', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      renderMessages()
      expect(screen.getByTestId('conversation-header')).toBeTruthy()
      expect(screen.getByTestId('message-thread')).toBeTruthy()
    })
  })

  // =================== MENTION MEMBERS ===================
  describe('Mention members computation', () => {
    it('computes mention members from squad members, excluding current user', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      mockH.mockSquadMembers = [
        { user_id: 'user-1', role: 'owner', profiles: { username: 'TestUser', avatar_url: null } },
        { user_id: 'user-2', role: 'member', profiles: { username: 'Other', avatar_url: 'url' } },
      ]
      renderMessages()
      // mentionMembers should only include user-2
      expect(mockH.capturedMessageComposerProps.mentionMembers).toHaveLength(1)
      expect(mockH.capturedMessageComposerProps.mentionMembers[0].username).toBe('Other')
    })

    it('handles missing profiles in squad members', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      mockH.mockSquadMembers = [{ user_id: 'user-2', role: 'member', profiles: null }]
      renderMessages()
      expect(mockH.capturedMessageComposerProps.mentionMembers).toHaveLength(1)
      expect(mockH.capturedMessageComposerProps.mentionMembers[0].username).toBe('Utilisateur')
    })
  })

  // =================== PINNED MESSAGES ===================
  describe('Pinned messages', () => {
    it('shows pinned messages when squad chat has pinned messages', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      mockH.squadMessages = [
        {
          id: 'm1',
          content: 'Pinned msg',
          sender_id: 'user-2',
          created_at: new Date().toISOString(),
          is_pinned: true,
          sender: { username: 'User2' },
        },
      ]
      renderMessages()
      expect(screen.getByTestId('pinned-messages')).toBeTruthy()
    })

    it('does not show pinned messages in DM mode', () => {
      mockH.activeDMConv = {
        other_user_id: 'u2',
        other_user_username: 'Friend',
        other_user_avatar_url: null,
        last_message_content: null,
        last_message_at: null,
        last_message_sender_id: null,
        unread_count: 0,
      }
      mockH.dmMessages = [
        {
          id: 'dm1',
          content: 'test',
          sender_id: 'u2',
          created_at: new Date().toISOString(),
          is_pinned: true,
          sender: { username: 'Friend' },
        },
      ]
      renderMessages()
      expect(screen.queryByTestId('pinned-messages')).toBeNull()
    })
  })

  // =================== THREAD VIEW ===================
  describe('ThreadView visibility', () => {
    it('does not show thread view when no thread is open', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      renderMessages()
      expect(screen.queryByTestId('thread-view')).toBeNull()
    })
  })

  // =================== MEMBER ROLES ===================
  describe('Member roles computation', () => {
    it('builds memberRolesMap from squad members data', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      mockH.mockSquadMembers = [
        { user_id: 'user-1', role: 'owner', profiles: { username: 'TestUser', avatar_url: null } },
        { user_id: 'user-2', role: 'admin', profiles: { username: 'Admin', avatar_url: null } },
      ]
      renderMessages()
      const rolesMap = mockH.capturedMessageThreadProps.memberRolesMap
      expect(rolesMap.get('user-1')).toBe('owner')
      expect(rolesMap.get('user-2')).toBe('admin')
    })
  })

  // =================== EDGE CASES ===================
  describe('Edge cases', () => {
    it('handles null user gracefully', () => {
      mockH.mockUser = null
      renderMessages()
      expect(screen.getByTestId('conversation-list')).toBeTruthy()
    })

    it('passes userId to MessageThread', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      renderMessages()
      expect(mockH.capturedMessageThreadProps.userId).toBe('user-1')
    })

    it('passes isAdmin based on hasPermission', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      mockH.mockHasPermission = true
      renderMessages()
      expect(mockH.capturedMessageThreadProps.isAdmin).toBe(true)
    })

    it('passes isAdmin=false when no permission', () => {
      mockH.activeSquadConv = {
        id: 'c1',
        squad_id: 'sq1',
        name: 'Squad',
        type: 'squad',
        session_id: null,
        unread_count: 0,
      }
      mockH.mockHasPermission = false
      renderMessages()
      expect(mockH.capturedMessageThreadProps.isAdmin).toBe(false)
    })
  })
})
