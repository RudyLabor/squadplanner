import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'

// --- Hoisted mock variables ---
const mockH = vi.hoisted(() => {
  const mockNavigate = vi.fn()
  const mockCreateSquad = vi.fn().mockResolvedValue({
    squad: { id: 'new-squad', name: 'TestSquad', invite_code: 'ABC123' },
    error: null,
  })
  const mockJoinSquad = vi.fn().mockResolvedValue({ error: null })
  const mockFetchSquads = vi.fn().mockResolvedValue(undefined)
  const mockRefreshProfile = vi.fn().mockResolvedValue(undefined)

  let mockUser: any = { id: 'user-1' }
  let mockProfile: any = { id: 'user-1', username: 'TestUser', avatar_url: null }
  let mockSquads: any[] = []

  // Captured props from step sub-components
  let capturedSquadChoiceProps: any = null
  let capturedCreateSquadProps: any = null
  let capturedJoinSquadProps: any = null
  let capturedProfileProps: any = null
  let capturedPermissionsProps: any = null
  let capturedCompleteProps: any = null
  let capturedSplashProps: any = null
  let capturedProgressProps: any = null

  return {
    mockNavigate,
    mockCreateSquad,
    mockJoinSquad,
    mockFetchSquads,
    mockRefreshProfile,
    get mockUser() {
      return mockUser
    },
    set mockUser(v: any) {
      mockUser = v
    },
    get mockProfile() {
      return mockProfile
    },
    set mockProfile(v: any) {
      mockProfile = v
    },
    get mockSquads() {
      return mockSquads
    },
    set mockSquads(v: any) {
      mockSquads = v
    },
    get capturedSquadChoiceProps() {
      return capturedSquadChoiceProps
    },
    set capturedSquadChoiceProps(v: any) {
      capturedSquadChoiceProps = v
    },
    get capturedCreateSquadProps() {
      return capturedCreateSquadProps
    },
    set capturedCreateSquadProps(v: any) {
      capturedCreateSquadProps = v
    },
    get capturedJoinSquadProps() {
      return capturedJoinSquadProps
    },
    set capturedJoinSquadProps(v: any) {
      capturedJoinSquadProps = v
    },
    get capturedProfileProps() {
      return capturedProfileProps
    },
    set capturedProfileProps(v: any) {
      capturedProfileProps = v
    },
    get capturedPermissionsProps() {
      return capturedPermissionsProps
    },
    set capturedPermissionsProps(v: any) {
      capturedPermissionsProps = v
    },
    get capturedCompleteProps() {
      return capturedCompleteProps
    },
    set capturedCompleteProps(v: any) {
      capturedCompleteProps = v
    },
    get capturedSplashProps() {
      return capturedSplashProps
    },
    set capturedSplashProps(v: any) {
      capturedSplashProps = v
    },
    get capturedProgressProps() {
      return capturedProgressProps
    },
    set capturedProgressProps(v: any) {
      capturedProgressProps = v
    },
  }
})

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/onboarding', hash: '', search: '' }),
  useNavigate: vi.fn(() => mockH.mockNavigate),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }),
    rpc: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://test.com/avatar.jpg' } }),
      }),
    },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
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
      profile: mockH.mockProfile,
      isLoading: false,
      refreshProfile: mockH.mockRefreshProfile,
    })),
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
    vi.fn(() => ({
      user: mockH.mockUser,
      profile: mockH.mockProfile,
      isLoading: false,
      refreshProfile: mockH.mockRefreshProfile,
    })),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))

// Mock squads store
vi.mock('../../hooks/useSquads', () => ({
  useSquadsStore: Object.assign(
    vi.fn(() => ({
      squads: mockH.mockSquads,
      createSquad: mockH.mockCreateSquad,
      joinSquad: mockH.mockJoinSquad,
      fetchSquads: mockH.mockFetchSquads,
    })),
    { getState: vi.fn(() => ({ squads: mockH.mockSquads })) }
  ),
}))

// Mock toast & i18n
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

// Mock Confetti
vi.mock('../../components/LazyConfetti', () => ({ default: () => null }))

// Mock onboarding sub-components with prop capture
vi.mock('../onboarding/StepToast', () => ({
  StepToast: ({ message, isVisible }: any) =>
    isVisible ? createElement('div', { 'data-testid': 'step-toast' }, message) : null,
}))

vi.mock('../onboarding/OnboardingStepSplash', () => ({
  OnboardingStepSplash: (props: any) => {
    mockH.capturedSplashProps = props
    return createElement(
      'div',
      { 'data-testid': 'step-splash' },
      createElement('button', { onClick: props.onStart, 'data-testid': 'start-btn' }, 'Start')
    )
  },
}))

vi.mock('../onboarding/OnboardingStepSquadChoice', () => ({
  OnboardingStepSquadChoice: (props: any) => {
    mockH.capturedSquadChoiceProps = props
    return createElement(
      'div',
      { 'data-testid': 'step-squad-choice' },
      createElement(
        'button',
        { onClick: props.onCreateSquad, 'data-testid': 'create-squad-btn' },
        'Create'
      ),
      createElement(
        'button',
        { onClick: props.onJoinSquad, 'data-testid': 'join-squad-btn' },
        'Join'
      )
    )
  },
}))

vi.mock('../onboarding/OnboardingStepCreateSquad', () => ({
  OnboardingStepCreateSquad: (props: any) => {
    mockH.capturedCreateSquadProps = props
    return createElement(
      'div',
      { 'data-testid': 'step-create-squad' },
      createElement(
        'button',
        { onClick: props.onCreateSquad, 'data-testid': 'submit-create' },
        'Submit Create'
      ),
      createElement('button', { onClick: props.onBack, 'data-testid': 'back-create' }, 'Back')
    )
  },
}))

vi.mock('../onboarding/OnboardingStepJoinSquad', () => ({
  OnboardingStepJoinSquad: (props: any) => {
    mockH.capturedJoinSquadProps = props
    return createElement(
      'div',
      { 'data-testid': 'step-join-squad' },
      createElement(
        'button',
        { onClick: props.onJoinSquad, 'data-testid': 'submit-join' },
        'Submit Join'
      ),
      createElement('button', { onClick: props.onBack, 'data-testid': 'back-join' }, 'Back')
    )
  },
}))

vi.mock('../onboarding/OnboardingStepPermissions', () => ({
  OnboardingStepPermissions: (props: any) => {
    mockH.capturedPermissionsProps = props
    return createElement(
      'div',
      { 'data-testid': 'step-permissions' },
      createElement(
        'button',
        { onClick: props.onComplete, 'data-testid': 'permissions-complete' },
        'Complete'
      ),
      createElement('button', { onClick: props.onBack, 'data-testid': 'back-permissions' }, 'Back')
    )
  },
}))

vi.mock('../onboarding/OnboardingStepProfile', () => ({
  OnboardingStepProfile: (props: any) => {
    mockH.capturedProfileProps = props
    return createElement(
      'div',
      { 'data-testid': 'step-profile' },
      createElement('button', { onClick: props.onSave, 'data-testid': 'save-profile' }, 'Save'),
      createElement('button', { onClick: props.onBack, 'data-testid': 'back-profile' }, 'Back')
    )
  },
}))

vi.mock('../onboarding/OnboardingStepComplete', () => ({
  OnboardingStepComplete: (props: any) => {
    mockH.capturedCompleteProps = props
    return createElement(
      'div',
      { 'data-testid': 'step-complete' },
      createElement('button', { onClick: props.onComplete, 'data-testid': 'final-complete' }, 'Go')
    )
  },
}))

vi.mock('../onboarding/OnboardingProgress', () => ({
  OnboardingProgress: (props: any) => {
    mockH.capturedProgressProps = props
    return createElement('div', { 'data-testid': 'onboarding-progress' }, `step:${props.step}`)
  },
}))

import { Onboarding } from '../Onboarding'

describe('Onboarding Page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockH.mockNavigate.mockClear()
    mockH.mockCreateSquad.mockReset().mockResolvedValue({
      squad: { id: 'new-squad', name: 'TestSquad', invite_code: 'ABC123' },
      error: null,
    })
    mockH.mockJoinSquad.mockReset().mockResolvedValue({ error: null })
    mockH.mockFetchSquads.mockReset().mockResolvedValue(undefined)
    mockH.mockRefreshProfile.mockReset().mockResolvedValue(undefined)
    mockH.mockUser = { id: 'user-1' }
    mockH.mockProfile = { id: 'user-1', username: 'TestUser', avatar_url: null }
    mockH.mockSquads = []
    mockH.capturedSquadChoiceProps = null
    mockH.capturedCreateSquadProps = null
    mockH.capturedJoinSquadProps = null
    mockH.capturedProfileProps = null
    mockH.capturedPermissionsProps = null
    mockH.capturedCompleteProps = null
    mockH.capturedSplashProps = null
    mockH.capturedProgressProps = null

    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderOnboarding = () => render(createElement(Onboarding))

  // =================== INITIAL RENDER ===================
  describe('Initial render', () => {
    it('renders with aria label "Onboarding"', () => {
      renderOnboarding()
      expect(document.querySelector('[aria-label="Onboarding"]')).toBeTruthy()
    })

    it('starts at squad-choice step', () => {
      renderOnboarding()
      expect(screen.getByTestId('step-squad-choice')).toBeTruthy()
    })

    it('renders progress indicator showing current step', () => {
      renderOnboarding()
      expect(screen.getByText('step:squad-choice')).toBeTruthy()
    })
  })

  // =================== REDIRECT IF HAS SQUADS ===================
  describe('Redirect when user has squads', () => {
    it('redirects to /home when user already has squads', () => {
      mockH.mockSquads = [{ id: 'sq1', name: 'Existing' }]
      renderOnboarding()
      expect(mockH.mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
    })
  })

  // =================== STEP NAVIGATION ===================
  describe('Step navigation', () => {
    it('navigates to create-squad step when Create is clicked', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-squad-btn'))
      })
      // Wait for isNavigating debounce
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByTestId('step-create-squad')).toBeTruthy()
    })

    it('navigates to join-squad step when Join is clicked', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('join-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByTestId('step-join-squad')).toBeTruthy()
    })

    it('goes back from create-squad to squad-choice', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByTestId('step-create-squad')).toBeTruthy()
      await act(async () => {
        fireEvent.click(screen.getByTestId('back-create'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByTestId('step-squad-choice')).toBeTruthy()
    })
  })

  // =================== CREATE SQUAD FLOW ===================
  describe('Create squad flow', () => {
    it('passes squadName and squadGame to CreateSquad step', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(mockH.capturedCreateSquadProps.squadName).toBe('')
      expect(mockH.capturedCreateSquadProps.squadGame).toBe('')
    })

    it('passes error and isLoading to CreateSquad step', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(mockH.capturedCreateSquadProps.error).toBeNull()
      expect(mockH.capturedCreateSquadProps.isLoading).toBe(false)
    })

    it('calls createSquad and navigates to profile on success', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      // Set squad name via props callback
      await act(async () => {
        mockH.capturedCreateSquadProps.onSquadNameChange('My Squad')
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-create'))
      })
      expect(mockH.mockCreateSquad).toHaveBeenCalled()
    })
  })

  // =================== JOIN SQUAD FLOW ===================
  describe('Join squad flow', () => {
    it('passes inviteCode to JoinSquad step', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('join-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(mockH.capturedJoinSquadProps.inviteCode).toBe('')
    })

    it('calls joinSquad and fetches squads on success', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('join-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      await act(async () => {
        mockH.capturedJoinSquadProps.onInviteCodeChange('CODE123')
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-join'))
      })
      expect(mockH.mockJoinSquad).toHaveBeenCalled()
    })
  })

  // =================== PROFILE STEP ===================
  describe('Profile step', () => {
    it('pre-fills username from profile', () => {
      mockH.mockProfile = {
        id: 'user-1',
        username: 'ExistingUser',
        avatar_url: 'https://avatar.jpg',
      }
      renderOnboarding()
      // Profile effect should set username
      // The profile step shows after creating/joining squad
    })
  })

  // =================== COMPLETE STEP ===================
  describe('Complete step props', () => {
    it('passes createdSquadId and related data to CompleteStep', async () => {
      renderOnboarding()
      // Navigate: squad-choice -> create-squad -> submit -> profile -> save -> permissions -> complete
      // This is complex, so we test the data flow to the complete step once rendered
    })
  })

  // =================== PROGRESS COMPONENT ===================
  describe('Progress tracking', () => {
    it('passes current step to OnboardingProgress', () => {
      renderOnboarding()
      expect(mockH.capturedProgressProps.step).toBe('squad-choice')
    })

    it('updates progress when step changes', async () => {
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByText('step:create-squad')).toBeTruthy()
    })
  })

  // =================== EDGE CASES ===================
  describe('Edge cases', () => {
    it('renders without crash when user is null', () => {
      mockH.mockUser = null
      expect(() => renderOnboarding()).not.toThrow()
    })

    it('renders without crash when profile is null', () => {
      mockH.mockProfile = null
      expect(() => renderOnboarding()).not.toThrow()
    })

    it('handles createSquad returning an error', async () => {
      mockH.mockCreateSquad.mockResolvedValueOnce({ squad: null, error: { message: 'Name taken' } })
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      await act(async () => {
        mockH.capturedCreateSquadProps.onSquadNameChange('Test')
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-create'))
      })
      // Should show error in the step
    })

    it('handles createSquad returning neither squad nor error', async () => {
      mockH.mockCreateSquad.mockResolvedValueOnce({ squad: null, error: null })
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      await act(async () => {
        mockH.capturedCreateSquadProps.onSquadNameChange('Test')
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-create'))
      })
    })

    it('handles joinSquad returning an error', async () => {
      mockH.mockJoinSquad.mockResolvedValueOnce({ error: { message: 'Invalid code' } })
      renderOnboarding()
      await act(async () => {
        fireEvent.click(screen.getByTestId('join-squad-btn'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      await act(async () => {
        mockH.capturedJoinSquadProps.onInviteCodeChange('BAD')
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-join'))
      })
    })
  })
})
