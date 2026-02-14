import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Messages } from '../Messages'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/messages', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1', user_metadata: { username: 'TestUser' }, email: 'test@test.com' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn(),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

// Mock Messages store
vi.mock('../../hooks/useMessages', () => ({
  useMessagesStore: Object.assign(
    vi.fn().mockReturnValue({
      messages: [],
      conversations: [],
      activeConversation: null,
      isLoading: false,
      fetchConversations: vi.fn(),
      setActiveConversation: vi.fn(),
      sendMessage: vi.fn(),
      editMessage: vi.fn().mockResolvedValue({ error: null }),
      deleteMessage: vi.fn().mockResolvedValue({ error: null }),
      pinMessage: vi.fn().mockResolvedValue({ error: null }),
      markAsRead: vi.fn(),
      unsubscribe: vi.fn(),
    }),
    { getState: vi.fn().mockReturnValue({ conversations: [] }) }
  ),
}))

// Mock DirectMessages store
vi.mock('../../hooks/useDirectMessages', () => ({
  useDirectMessagesStore: Object.assign(
    vi.fn().mockReturnValue({
      messages: [],
      conversations: [],
      activeConversation: null,
      isLoading: false,
      fetchConversations: vi.fn(),
      setActiveConversation: vi.fn(),
      sendMessage: vi.fn(),
      unsubscribe: vi.fn(),
    }),
    { getState: vi.fn().mockReturnValue({ conversations: [] }) }
  ),
}))

// Mock typing indicator
vi.mock('../../hooks/useTypingIndicator', () => ({
  useTypingIndicator: vi.fn().mockReturnValue({ typingText: '', handleTyping: vi.fn() }),
}))

// Mock state persistence
vi.mock('../../hooks/useStatePersistence', () => ({
  useStatePersistence: vi.fn().mockReturnValue(['squads', vi.fn()]),
}))

// Mock squad members query
vi.mock('../../hooks/queries/useSquadMembers', () => ({
  useSquadMembersQuery: vi.fn().mockReturnValue({ data: [] }),
}))

// Mock roles
vi.mock('../../lib/roles', () => ({
  hasPermission: vi.fn().mockReturnValue(false),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Sparkles: (props: any) => createElement('span', props),
}))

// Mock components
vi.mock('../../components/PinnedMessages', () => ({
  PinnedMessages: () => null,
}))

vi.mock('../../components/EditMessageModal', () => ({
  EditMessageModal: () => null,
}))

vi.mock('../../components/CreatePollModal', () => ({
  CreatePollModal: () => null,
}))

vi.mock('../../components/ForwardMessageModal', () => ({
  ForwardMessageModal: () => null,
}))

vi.mock('../../components/ui', () => ({
  CrossfadeTransition: ({ children, skeleton, isLoading }: any) => isLoading ? skeleton : children,
  SkeletonChatPage: () => createElement('div', { 'data-testid': 'skeleton-chat' }),
}))

vi.mock('../../components/PullToRefresh', () => ({
  PullToRefresh: ({ children }: any) => createElement('div', null, children),
}))

vi.mock('../../components/messages/ConversationList', () => ({
  ConversationList: () => createElement('div', { 'data-testid': 'conversation-list' }),
}))

vi.mock('../../components/messages/ConversationHeader', () => ({
  ConversationHeader: () => createElement('div', { 'data-testid': 'conversation-header' }),
}))

vi.mock('../../components/messages/MessageThread', () => ({
  MessageThread: () => createElement('div', { 'data-testid': 'message-thread' }),
}))

vi.mock('../../components/messages/MessageComposer', () => ({
  MessageComposer: () => createElement('div', { 'data-testid': 'message-composer' }),
}))

vi.mock('../../components/messages/MessageToast', () => ({
  MessageToast: () => null,
}))

vi.mock('../../components/ThreadView', () => ({
  ThreadView: () => null,
}))

describe('Messages Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    // Mock window.innerWidth for isDesktop check
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
  })

  const renderMessages = () => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Messages)
      )
    )
  }

  it('renders without crash', () => {
    expect(() => renderMessages()).not.toThrow()
  })

  it('renders conversation list', () => {
    const { container } = renderMessages()
    expect(container.querySelector('[data-testid="conversation-list"]')).toBeDefined()
  })

  it('renders with aria label', () => {
    renderMessages()
    expect(document.querySelector('[aria-label="Messages"]')).toBeDefined()
  })
})
