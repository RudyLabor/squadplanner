import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------
const mockNavigate = vi.hoisted(() => vi.fn())
const mockUseParams = vi.hoisted(() => vi.fn())
const mockSupabaseFrom = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// vi.mock declarations
// ---------------------------------------------------------------------------
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/session/share/abc', hash: '', search: '' }),
  useNavigate: () => mockNavigate,
  useParams: mockUseParams,
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: ({ children }: any) => createElement('div', null, children || 'outlet'),
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
  supabaseMinimal: {
    from: mockSupabaseFrom,
  },
}))

vi.mock('../../components/ShareButtons', () => ({
  ShareButtons: ({ url, title }: any) =>
    createElement('div', { 'data-testid': 'share-buttons', 'data-url': url, 'data-title': title }, 'ShareButtons'),
}))

import DefaultExport, { meta } from '../session-share'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setupSupabaseMocks(overrides: {
  session?: any
  sessionError?: any
  squad?: any
  rsvpCount?: number
}) {
  const selectSessionChain = {
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: overrides.session ?? null,
        error: overrides.sessionError ?? null,
      }),
    }),
  }

  const selectSquadChain = {
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: overrides.squad ?? { name: 'TestSquad' },
      }),
    }),
  }

  const selectRsvpChain = {
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        count: overrides.rsvpCount ?? 3,
      }),
    }),
  }

  let callCount = 0
  mockSupabaseFrom.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      return { select: vi.fn().mockReturnValue(selectSessionChain) }
    } else if (callCount === 2) {
      return { select: vi.fn().mockReturnValue(selectSquadChain) }
    } else {
      return { select: vi.fn().mockReturnValue(selectRsvpChain) }
    }
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('routes/session-share', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ id: 'session-123' })
  })

  // =========================================================================
  // meta
  // =========================================================================
  describe('meta', () => {
    it('returns correct SEO metadata with og:image for session sharing', () => {
      const result = meta({ params: { id: 'abc-123' } } as any)

      // 1 - correct title
      expect(result[0]).toEqual({ title: 'Session Gaming - Squad Planner' })

      // 2 - description exists
      const desc = result.find((m: any) => m.name === 'description')
      expect(desc).toBeDefined()
      expect(desc!.content).toContain('Rejoins')

      // 3 - og:image contains session id
      const ogImage = result.find((m: any) => m.property === 'og:image')
      expect(ogImage).toBeDefined()
      expect(ogImage!.content).toContain('abc-123')

      // 4 - twitter card is summary_large_image
      const twitterCard = result.find((m: any) => m.name === 'twitter:card')
      expect(twitterCard).toEqual({ name: 'twitter:card', content: 'summary_large_image' })
    })

    it('includes og:image dimensions', () => {
      const result = meta({ params: { id: 'test-id' } } as any)

      const ogWidth = result.find((m: any) => m.property === 'og:image:width')
      const ogHeight = result.find((m: any) => m.property === 'og:image:height')

      // 1 - width is 1200
      expect(ogWidth).toEqual({ property: 'og:image:width', content: '1200' })

      // 2 - height is 630
      expect(ogHeight).toEqual({ property: 'og:image:height', content: '630' })

      // 3 - og:type is website
      const ogType = result.find((m: any) => m.property === 'og:type')
      expect(ogType).toEqual({ property: 'og:type', content: 'website' })

      // 4 - og:site_name
      const ogSiteName = result.find((m: any) => m.property === 'og:site_name')
      expect(ogSiteName).toEqual({ property: 'og:site_name', content: 'Squad Planner' })
    })
  })

  // =========================================================================
  // Component — loading state
  // =========================================================================
  describe('Component — loading state', () => {
    it('shows a loading spinner while fetching session data', () => {
      // Don't resolve the supabase promise — keep it loading
      mockSupabaseFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      }))

      const { container } = render(createElement(DefaultExport))

      // 1 - spinner is present
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()

      // 2 - no session title yet
      expect(screen.queryByText('Rejoindre la session')).toBeNull()

      // 3 - container renders
      expect(container).toBeTruthy()

      // 4 - no error message
      expect(screen.queryByText('Session introuvable')).toBeNull()
    })
  })

  // =========================================================================
  // Component — error state
  // =========================================================================
  describe('Component — error state', () => {
    it('shows error message when session is not found', async () => {
      setupSupabaseMocks({ session: null, sessionError: { message: 'not found' } })

      render(createElement(DefaultExport))

      // Wait for the error to render
      await waitFor(() => {
        expect(screen.getByText('Session introuvable')).toBeTruthy()
      })

      // 1 - error heading visible
      expect(screen.getByText('Session introuvable')).toBeTruthy()

      // 2 - sub-text explaining the error
      expect(screen.getByText(/n'existe pas ou a été supprimée/)).toBeTruthy()

      // 3 - CTA button to discover Squad Planner
      expect(screen.getByText('Découvrir Squad Planner')).toBeTruthy()
    })

    it('navigates to home when CTA button is clicked in error state', async () => {
      setupSupabaseMocks({ session: null, sessionError: { message: 'not found' } })

      render(createElement(DefaultExport))

      await waitFor(() => {
        expect(screen.getByText('Découvrir Squad Planner')).toBeTruthy()
      })

      // Click the CTA button
      fireEvent.click(screen.getByText('Découvrir Squad Planner'))

      // 1 - navigate was called
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  // =========================================================================
  // Component — success state
  // =========================================================================
  describe('Component — success state', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString() // tomorrow

    it('displays session details when data is loaded', async () => {
      setupSupabaseMocks({
        session: {
          id: 'session-123',
          title: 'Ranked Valorant',
          game: 'Valorant',
          scheduled_at: futureDate,
          duration_minutes: 120,
          status: 'confirmed',
          squad_id: 'squad-1',
        },
        squad: { name: 'AlphaTeam' },
        rsvpCount: 5,
      })

      render(createElement(DefaultExport))

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Ranked Valorant')).toBeTruthy()
      })

      // 1 - title is displayed
      expect(screen.getByText('Ranked Valorant')).toBeTruthy()

      // 2 - squad name is shown
      expect(screen.getByText('AlphaTeam')).toBeTruthy()

      // 3 - game badge is shown
      expect(screen.getByText('Valorant')).toBeTruthy()

      // 4 - join button is shown (future session)
      expect(screen.getByText('Rejoindre la session')).toBeTruthy()
    })

    it('shows session finished message for past sessions', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString() // yesterday

      setupSupabaseMocks({
        session: {
          id: 'session-past',
          title: 'Old Session',
          game: 'LoL',
          scheduled_at: pastDate,
          duration_minutes: 60,
          status: 'completed',
          squad_id: 'squad-2',
        },
        squad: { name: 'BetaSquad' },
        rsvpCount: 2,
      })

      render(createElement(DefaultExport))

      await waitFor(() => {
        expect(screen.getByText('Old Session')).toBeTruthy()
      })

      // 1 - past session banner is shown
      expect(screen.getByText('Cette session est terminée')).toBeTruthy()

      // 2 - no join button for past sessions
      expect(screen.queryByText('Rejoindre la session')).toBeNull()

      // 3 - squad name still shown
      expect(screen.getByText('BetaSquad')).toBeTruthy()

      // 4 - share buttons are present
      expect(screen.getByTestId('share-buttons')).toBeTruthy()
    })
  })
})
