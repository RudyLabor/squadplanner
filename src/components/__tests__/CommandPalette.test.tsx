import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

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

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getSession: vi.fn() }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) }) },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }),
}))

vi.mock('../../hooks', () => ({
  useSquadsStore: vi.fn().mockReturnValue({ squads: [] }),
  useSessionsStore: vi.fn().mockReturnValue({ sessions: [] }),
  useViewTransitionNavigate: vi.fn().mockReturnValue(vi.fn()),
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }),
}))

vi.mock('../../hooks/useTheme', () => ({
  useThemeStore: vi.fn().mockReturnValue({ mode: 'dark', setMode: vi.fn(), effectiveTheme: 'dark' }),
}))

vi.mock('../CreateSessionModal', () => ({
  useCreateSessionModal: Object.assign(vi.fn().mockReturnValue({ isOpen: false, open: vi.fn() }), { getState: vi.fn() }),
}))

vi.mock('../command-palette/ShortcutsHelpModal', () => ({
  ShortcutsHelpModal: () => null,
}))
vi.mock('../command-palette/CommandPreviewPanel', () => ({
  CommandPreviewPanel: () => null,
}))
vi.mock('../command-palette/CommandResultList', () => ({
  CommandResultList: () => null,
}))

vi.mock('../../lib/queryClient', () => ({
  queryKeys: { squads: { list: () => ['squads'] }, sessions: { upcoming: () => ['sessions', 'upcoming'] } },
}))

vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr' }))
vi.mock('../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() }))
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() } }))

import { CommandPalette } from '../CommandPalette'

describe('CommandPalette', () => {
  it('renders without crash (closed by default)', () => {
    const queryClient = new QueryClient()
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CommandPalette />
      </QueryClientProvider>
    )
    // Palette is closed by default, so no modal content
    expect(container).toBeTruthy()
  })
})
