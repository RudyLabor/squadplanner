import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { Onboarding } from '../Onboarding'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/onboarding', hash: '', search: '' }),
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
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }),
    rpc: vi.fn(),
    storage: { from: vi.fn().mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/avatar.jpg' } }) }) },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null }, isLoading: false, refreshProfile: vi.fn().mockResolvedValue(undefined) }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null }, isLoading: false, refreshProfile: vi.fn().mockResolvedValue(undefined) }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

// Mock squads store
vi.mock('../../hooks/useSquads', () => ({
  useSquadsStore: Object.assign(
    vi.fn().mockReturnValue({
      squads: [],
      createSquad: vi.fn().mockResolvedValue({ squad: { id: 'new-squad', name: 'Test', invite_code: 'ABC123' }, error: null }),
      joinSquad: vi.fn().mockResolvedValue({ error: null }),
      fetchSquads: vi.fn().mockResolvedValue(undefined),
    }),
    { getState: vi.fn().mockReturnValue({ squads: [] }) }
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

// Mock Confetti
vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

// Mock onboarding sub-components
vi.mock('../onboarding/StepToast', () => ({
  StepToast: () => null,
}))

vi.mock('../onboarding/OnboardingStepSplash', () => ({
  OnboardingStepSplash: () => createElement('div', { 'data-testid': 'step-splash' }),
}))

vi.mock('../onboarding/OnboardingStepSquadChoice', () => ({
  OnboardingStepSquadChoice: () => createElement('div', { 'data-testid': 'step-squad-choice' }, 'Choisis ta squad'),
}))

vi.mock('../onboarding/OnboardingStepCreateSquad', () => ({
  OnboardingStepCreateSquad: () => createElement('div', { 'data-testid': 'step-create-squad' }),
}))

vi.mock('../onboarding/OnboardingStepJoinSquad', () => ({
  OnboardingStepJoinSquad: () => createElement('div', { 'data-testid': 'step-join-squad' }),
}))

vi.mock('../onboarding/OnboardingStepPermissions', () => ({
  OnboardingStepPermissions: () => createElement('div', { 'data-testid': 'step-permissions' }),
}))

vi.mock('../onboarding/OnboardingStepProfile', () => ({
  OnboardingStepProfile: () => createElement('div', { 'data-testid': 'step-profile' }),
}))

vi.mock('../onboarding/OnboardingStepComplete', () => ({
  OnboardingStepComplete: () => createElement('div', { 'data-testid': 'step-complete' }),
}))

vi.mock('../onboarding/OnboardingProgress', () => ({
  OnboardingProgress: () => createElement('div', { 'data-testid': 'onboarding-progress' }),
}))

describe('Onboarding Page', () => {
  beforeEach(() => {
    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') },
      writable: true,
    })
  })

  const renderOnboarding = () => {
    return render(createElement(Onboarding))
  }

  it('renders without crash', () => {
    expect(() => renderOnboarding()).not.toThrow()
  })

  it('renders with aria label', () => {
    renderOnboarding()
    expect(document.querySelector('[aria-label="Onboarding"]')).toBeDefined()
  })

  it('renders initial step (squad-choice)', () => {
    renderOnboarding()
    expect(screen.getByTestId('step-squad-choice')).toBeDefined()
  })
})
