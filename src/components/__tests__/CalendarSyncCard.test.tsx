import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
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
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1', user_metadata: { username: 'TestUser' } },
      profile: {
        id: 'user-1',
        username: 'TestUser',
        avatar_url: null,
        reliability_score: 85,
        total_sessions: 10,
        created_at: new Date().toISOString(),
      },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1', user_metadata: { username: 'TestUser' } },
      profile: { id: 'user-1', username: 'TestUser', avatar_url: null },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

// Mock toast
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()
const mockShowInfo = vi.fn()
vi.mock('../../lib/toast', () => ({
  showSuccess: (...args: any[]) => mockShowSuccess(...args),
  showError: (...args: any[]) => mockShowError(...args),
  showWarning: vi.fn(),
  showInfo: (...args: any[]) => mockShowInfo(...args),
}))

// Mock haptics
vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

// Mock calendarExport
const mockSessionToCalendarEvent = vi.fn().mockReturnValue({})
const mockGetGoogleCalendarUrl = vi.fn().mockReturnValue('https://calendar.google.com/test')
const mockExportSessionsToICS = vi.fn()
vi.mock('../../utils/calendarExport', () => ({
  sessionToCalendarEvent: (...args: any[]) => mockSessionToCalendarEvent(...args),
  getGoogleCalendarUrl: (...args: any[]) => mockGetGoogleCalendarUrl(...args),
  exportSessionsToICS: (...args: any[]) => mockExportSessionsToICS(...args),
}))

import { CalendarSyncCard } from '../CalendarSyncCard'

const makeSession = (overrides = {}) => ({
  id: 's1',
  squad_id: 'sq1',
  scheduled_at: new Date().toISOString(),
  status: 'pending' as const,
  created_by: 'user-1',
  created_at: new Date().toISOString(),
  ...overrides,
})

describe('CalendarSyncCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  // STRICT: Verifies base rendering — label, .ics button present, Google button absent without session, calendar icon present, container structure
  it('renders base UI without a session — shows label and .ics button only', () => {
    const { container } = render(<CalendarSyncCard />)
    // 1. "Calendrier" label is visible
    expect(screen.getByText('Calendrier')).toBeInTheDocument()
    // 2. .ics download button is always present
    expect(screen.getByText('.ics')).toBeInTheDocument()
    // 3. Google button is NOT present when no session
    expect(screen.queryByText('Google')).not.toBeInTheDocument()
    // 4. The container has the correct border/bg classes
    expect(container.firstChild).toHaveClass('flex', 'items-center')
    // 5. .ics button is a <button> element
    const icsBtn = screen.getByText('.ics').closest('button')
    expect(icsBtn).toBeInTheDocument()
    // 6. There should be exactly one button (no Google button)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(1)
  })

  // STRICT: Verifies that providing a session shows the Google Calendar button and clicking it opens a Google Calendar URL via window.open
  it('shows Google button with session and opens calendar URL on click', () => {
    const session = makeSession()
    const { container } = render(<CalendarSyncCard session={session} squadName="TestSquad" />)

    // 1. Google button is present
    const googleBtn = screen.getByText('Google')
    expect(googleBtn).toBeInTheDocument()
    // 2. .ics button is also present
    expect(screen.getByText('.ics')).toBeInTheDocument()
    // 3. There should now be 2 buttons (Google + .ics)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(2)
    // 4. Click Google button
    fireEvent.click(googleBtn)
    // 5. sessionToCalendarEvent called with session and squadName
    expect(mockSessionToCalendarEvent).toHaveBeenCalledWith(session, 'TestSquad')
    // 6. getGoogleCalendarUrl called with the event object
    expect(mockGetGoogleCalendarUrl).toHaveBeenCalledWith({})
    // 7. window.open called with correct URL and security params
    expect(window.open).toHaveBeenCalledWith(
      'https://calendar.google.com/test',
      '_blank',
      'noopener,noreferrer'
    )
    // 8. showInfo is NOT called (session is present)
    expect(mockShowInfo).not.toHaveBeenCalled()
  })

  // STRICT: Verifies .ics export — clicking the button with sessions calls exportSessionsToICS and shows success toast; with no sessions shows error toast
  it('handles .ics download — success with sessions, error without', () => {
    const session = makeSession()
    // Render with a single session
    const { unmount } = render(<CalendarSyncCard session={session} squadName="MySquad" />)
    const icsBtn = screen.getByText('.ics').closest('button')!

    // 1. Click .ics button
    fireEvent.click(icsBtn)
    // 2. exportSessionsToICS called with the session array and squadName
    expect(mockExportSessionsToICS).toHaveBeenCalledWith([session], 'MySquad')
    // 3. Success toast shown
    expect(mockShowSuccess).toHaveBeenCalledWith('Fichier .ics téléchargé !')
    // 4. No error toast
    expect(mockShowError).not.toHaveBeenCalled()

    unmount()
    vi.clearAllMocks()

    // Render with NO sessions and NO session
    render(<CalendarSyncCard />)
    const icsBtn2 = screen.getByText('.ics').closest('button')!

    // 5. Click .ics with no data
    fireEvent.click(icsBtn2)
    // 6. Error toast shown
    expect(mockShowError).toHaveBeenCalledWith('Aucune session à exporter')
    // 7. exportSessionsToICS NOT called (early return)
    expect(mockExportSessionsToICS).not.toHaveBeenCalled()
    // 8. No success toast
    expect(mockShowSuccess).not.toHaveBeenCalled()
  })
})
