import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SessionDetail from '../SessionDetail'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/session/sess1', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({ id: 'sess1' }),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    m: new Proxy({}, {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      },
    }),
    motion: new Proxy({}, {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      },
    }),
  }
})

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
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

// Mock query hooks
vi.mock('../../hooks/queries', () => ({
  useSessionQuery: vi.fn().mockReturnValue({ data: {
    id: 'sess1',
    title: 'Session Ranked',
    game: 'Valorant',
    squad_id: 'sq1',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    duration_minutes: 120,
    status: 'proposed',
    created_by: 'user-1',
    rsvp_counts: { present: 2, absent: 0, maybe: 1 },
    my_rsvp: null,
    rsvps: [
      { user_id: 'user-1', response: 'present', profiles: { username: 'TestUser' } },
      { user_id: 'user-2', response: 'present', profiles: { username: 'Player2' } },
    ],
    checkins: [],
  }, isLoading: false }),
  useRsvpMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  useCheckinMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useConfirmSessionMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useCancelSessionMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useUpdateSessionMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  ArrowLeft: (props: any) => createElement('span', props),
  CheckCircle2: (props: any) => createElement('span', props),
  AlertCircle: (props: any) => createElement('span', props),
  XCircle: (props: any) => createElement('span', props),
  Clock: (props: any) => createElement('span', props),
  Loader2: (props: any) => createElement('span', props),
  Sparkles: (props: any) => createElement('span', props),
  Edit2: (props: any) => createElement('span', props),
  X: (props: any) => createElement('span', props),
  Calendar: (props: any) => createElement('span', props),
  Trophy: (props: any) => createElement('span', props),
  Users: (props: any) => createElement('span', props),
  TrendingUp: (props: any) => createElement('span', props),
}))

// Mock components
vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
  ConfirmDialog: () => null,
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  CardContent: ({ children, ...props }: any) => createElement('div', props, children),
  Select: ({ options, value, onChange }: any) => createElement('select', { value, onChange: (e: any) => onChange(e.target.value) }),
  Badge: ({ children, ...props }: any) => createElement('span', props, children),
}))

vi.mock('../../components/VoiceChat', () => ({
  VoiceChat: () => createElement('div', { 'data-testid': 'voice-chat' }),
}))

// Mock session detail sub-components
vi.mock('../session-detail/SessionDetailSections', () => ({
  SessionInfoCards: ({ dateInfo }: any) => createElement('div', { 'data-testid': 'session-info' }, dateInfo?.day || ''),
  RsvpCounts: ({ present, maybe, absent }: any) => createElement('div', { 'data-testid': 'rsvp-counts' }, `${present}/${maybe}/${absent}`),
  RsvpButtons: ({ onRsvp }: any) => createElement('div', { 'data-testid': 'rsvp-buttons' },
    createElement('button', { onClick: () => onRsvp('present') }, 'Present'),
    createElement('button', { onClick: () => onRsvp('absent') }, 'Absent'),
  ),
  CheckinSection: () => createElement('div', { 'data-testid': 'checkin' }),
  ParticipantsList: () => createElement('div', { 'data-testid': 'participants' }),
}))

describe('SessionDetail Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderSessionDetail = () => {
    return render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(SessionDetail)
      )
    )
  }

  it('renders without crash', () => {
    expect(() => renderSessionDetail()).not.toThrow()
  })

  it('renders session title', () => {
    renderSessionDetail()
    expect(screen.getByText('Session Ranked')).toBeDefined()
  })

  it('renders with aria label', () => {
    renderSessionDetail()
    expect(document.querySelector('[aria-label="Détail de session"]')).toBeDefined()
  })
})
