import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'

// --- Hoisted mock variables ---
const mockH = vi.hoisted(() => {
  const mockNavigate = vi.fn()
  const mockSignIn = vi.fn().mockResolvedValue({ error: null })
  const mockSignUp = vi.fn().mockResolvedValue({ error: null })
  const mockSignInWithGoogle = vi.fn().mockResolvedValue({ error: null })
  const mockFetchSquads = vi.fn().mockResolvedValue(undefined)
  const mockUpdateUser = vi.fn().mockResolvedValue({ error: null })
  const mockResetPasswordForEmail = vi.fn().mockResolvedValue({ error: null })

  let mockUser: any = null
  let mockIsInitialized = true
  let mockSquads: any[] = []
  let mockSearchParams = new URLSearchParams()

  // Captured props
  let capturedFormFieldsProps: any = null
  let capturedGoogleBtnProps: any = null

  return {
    mockNavigate,
    mockSignIn,
    mockSignUp,
    mockSignInWithGoogle,
    mockFetchSquads,
    mockUpdateUser,
    mockResetPasswordForEmail,
    get mockUser() {
      return mockUser
    },
    set mockUser(v: any) {
      mockUser = v
    },
    get mockIsInitialized() {
      return mockIsInitialized
    },
    set mockIsInitialized(v: boolean) {
      mockIsInitialized = v
    },
    get mockSquads() {
      return mockSquads
    },
    set mockSquads(v: any) {
      mockSquads = v
    },
    get mockSearchParams() {
      return mockSearchParams
    },
    set mockSearchParams(v: any) {
      mockSearchParams = v
    },
    get capturedFormFieldsProps() {
      return capturedFormFieldsProps
    },
    set capturedFormFieldsProps(v: any) {
      capturedFormFieldsProps = v
    },
    get capturedGoogleBtnProps() {
      return capturedGoogleBtnProps
    },
    set capturedGoogleBtnProps(v: any) {
      capturedGoogleBtnProps = v
    },
  }
})

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/auth', hash: '', search: '' }),
  useNavigate: vi.fn(() => mockH.mockNavigate),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn(() => [mockH.mockSearchParams]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
  Navigate: ({ to }: any) => createElement('div', { 'data-testid': 'navigate', 'data-to': to }),
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

// Mock icons
vi.mock('../../components/icons', () => ({
  Loader2: ({ children, ...props }: any) =>
    createElement('span', { ...props, 'data-testid': 'loader' }, children),
  Gamepad2: ({ children, ...props }: any) => createElement('span', props, children),
  CheckCircle: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock UI components
vi.mock('../../components/ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: any) =>
    createElement('button', { onClick, disabled, type, ...props }, children),
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

// Mock SquadPlannerLogo
vi.mock('../../components/SquadPlannerLogo', () => ({
  SquadPlannerLogo: () => createElement('span', { 'data-testid': 'logo' }),
}))

// Mock Confetti
vi.mock('../../components/LazyConfetti', () => ({ default: () => null }))

// Mock auth store
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({
      user: mockH.mockUser,
      profile: null,
      isLoading: false,
      isInitialized: mockH.mockIsInitialized,
      signIn: mockH.mockSignIn,
      signUp: mockH.mockSignUp,
      signInWithGoogle: mockH.mockSignInWithGoogle,
    })),
    { getState: vi.fn(() => ({ user: mockH.mockUser, profile: null })) }
  ),
  useSquadsStore: Object.assign(
    vi.fn(() => ({
      squads: mockH.mockSquads,
      fetchSquads: mockH.mockFetchSquads,
    })),
    { getState: vi.fn(() => ({ squads: mockH.mockSquads })) }
  ),
}))

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn((...args: any[]) => mockH.mockUpdateUser(...args)),
      resetPasswordForEmail: vi.fn((...args: any[]) => mockH.mockResetPasswordForEmail(...args)),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

// Mock auth sub-components
vi.mock('../auth/AuthHelpers', () => ({
  translateAuthError: (msg: string) => `translated:${msg}`,
}))

vi.mock('../auth/AuthGoogleButton', () => ({
  AuthGoogleButton: (props: any) => {
    mockH.capturedGoogleBtnProps = props
    return createElement(
      'button',
      { onClick: props.onClick, disabled: props.disabled, 'data-testid': 'google-btn' },
      'Google'
    )
  },
}))

vi.mock('../auth/AuthFormFields', () => ({
  AuthFormFields: (props: any) => {
    mockH.capturedFormFieldsProps = props
    return createElement(
      'div',
      { 'data-testid': 'auth-form-fields' },
      createElement('span', null, `mode:${props.mode}`),
      // Expose setters for testing
      createElement('input', {
        'data-testid': 'email-input',
        value: props.email,
        onChange: (e: any) => props.setEmail(e.target.value),
      }),
      createElement('input', {
        'data-testid': 'password-input',
        value: props.password,
        onChange: (e: any) => props.setPassword(e.target.value),
      }),
      props.mode === 'register' &&
        createElement('input', {
          'data-testid': 'username-input',
          value: props.username,
          onChange: (e: any) => props.setUsername(e.target.value),
        }),
      props.mode === 'reset' &&
        createElement('input', {
          'data-testid': 'confirm-password-input',
          value: props.confirmPassword,
          onChange: (e: any) => props.setConfirmPassword(e.target.value),
        })
    )
  },
}))

import Auth from '../Auth'

describe('Auth Page', () => {
  beforeEach(() => {
    mockH.mockNavigate.mockClear()
    mockH.mockSignIn.mockReset().mockResolvedValue({ error: null })
    mockH.mockSignUp.mockReset().mockResolvedValue({ error: null })
    mockH.mockSignInWithGoogle.mockReset().mockResolvedValue({ error: null })
    mockH.mockFetchSquads.mockReset().mockResolvedValue(undefined)
    mockH.mockUpdateUser.mockReset().mockResolvedValue({ error: null })
    mockH.mockResetPasswordForEmail.mockReset().mockResolvedValue({ error: null })
    mockH.mockUser = null
    mockH.mockIsInitialized = true
    mockH.mockSquads = []
    mockH.mockSearchParams = new URLSearchParams()
    mockH.capturedFormFieldsProps = null
    mockH.capturedGoogleBtnProps = null

    // Mock sessionStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})
  })

  const renderAuth = () => render(createElement(Auth))

  // =================== REDIRECT WHEN LOGGED IN ===================
  describe('Redirect when logged in', () => {
    it('redirects to /home when user is logged in and mode is login', () => {
      mockH.mockUser = { id: 'user-1' }
      mockH.mockIsInitialized = true
      renderAuth()
      expect(screen.getByTestId('navigate')).toBeTruthy()
      expect(screen.getByTestId('navigate').getAttribute('data-to')).toBe('/home')
    })

    it('does NOT redirect when mode is reset even if user is logged in', () => {
      mockH.mockUser = { id: 'user-1' }
      mockH.mockSearchParams = new URLSearchParams('mode=reset')
      renderAuth()
      expect(screen.queryByTestId('navigate')).toBeNull()
      expect(screen.getByText('Nouveau mot de passe')).toBeTruthy()
    })

    it('does NOT redirect when not initialized', () => {
      mockH.mockUser = { id: 'user-1' }
      mockH.mockIsInitialized = false
      renderAuth()
      // Should render the auth page, not redirect
      expect(screen.queryByTestId('navigate')).toBeNull()
    })
  })

  // =================== LOGIN MODE ===================
  describe('Login mode (default)', () => {
    it('renders login heading', () => {
      renderAuth()
      expect(screen.getByText(/Ta squad t'attend, reconnecte-toi/)).toBeTruthy()
    })

    it('renders login subtitle', () => {
      renderAuth()
      expect(screen.getByText(/Des sessions sont peut-être déjà planifiées/)).toBeTruthy()
    })

    it('renders "Se connecter" submit button', () => {
      renderAuth()
      expect(screen.getByText('Se connecter')).toBeTruthy()
    })

    it('renders Google sign-in button', () => {
      renderAuth()
      expect(screen.getByTestId('google-btn')).toBeTruthy()
    })

    it('renders "Créer un compte" switch link', () => {
      renderAuth()
      expect(screen.getByText('Créer un compte')).toBeTruthy()
    })

    it('renders "Mot de passe oublié ?" link', () => {
      renderAuth()
      expect(screen.getByText('Mot de passe oublié ?')).toBeTruthy()
    })

    it('passes mode="login" to AuthFormFields', () => {
      renderAuth()
      expect(screen.getByText('mode:login')).toBeTruthy()
    })
  })

  // =================== REGISTER MODE ===================
  describe('Register mode', () => {
    it('renders register mode when URL param is register', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=register')
      renderAuth()
      expect(screen.getByText('Rejoins ta squad en 30 secondes')).toBeTruthy()
      expect(screen.getByText('Créer mon compte gratuit')).toBeTruthy()
    })

    it('renders register subtitle', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=register')
      renderAuth()
      expect(screen.getByText('Inscription gratuite. Pas de carte bancaire. Jamais.')).toBeTruthy()
    })

    it('shows "Se connecter" switch link in register mode', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=register')
      renderAuth()
      // In register mode, the switch link should say "Se connecter"
      const switchBtn = screen.getAllByText('Se connecter')
      expect(switchBtn.length).toBeGreaterThanOrEqual(1)
    })
  })

  // =================== RESET MODE ===================
  describe('Reset mode', () => {
    it('renders reset mode heading', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=reset')
      renderAuth()
      expect(screen.getByText('Nouveau mot de passe')).toBeTruthy()
    })

    it('renders "Mettre à jour" button', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=reset')
      renderAuth()
      expect(screen.getByText('Mettre à jour')).toBeTruthy()
    })

    it('renders "Retour à la connexion" link', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=reset')
      renderAuth()
      expect(screen.getByText('Retour à la connexion')).toBeTruthy()
    })

    it('hides Google button in reset mode', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=reset')
      renderAuth()
      expect(screen.queryByTestId('google-btn')).toBeNull()
    })

    it('does not show mode switch links in reset mode', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=reset')
      renderAuth()
      expect(screen.queryByText('Première fois ?')).toBeNull()
    })
  })

  // =================== MODE SWITCHING ===================
  describe('Mode switching', () => {
    it('switches from login to register when "Créer un compte" is clicked', () => {
      renderAuth()
      fireEvent.click(screen.getByText('Créer un compte'))
      expect(screen.getByText('Rejoins ta squad en 30 secondes')).toBeTruthy()
      expect(screen.getByText('mode:register')).toBeTruthy()
    })

    it('switches from register to login', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=register')
      renderAuth()
      const switchBtns = screen
        .getAllByRole('button')
        .filter((b) => b.textContent === 'Se connecter')
      // Find the switch button (not the submit button)
      const switchBtn = switchBtns.find((b) => b.type === 'button')
      if (switchBtn) fireEvent.click(switchBtn)
      expect(screen.getByText(/Ta squad t'attend, reconnecte-toi/)).toBeTruthy()
    })

    it('returns to login from reset mode', () => {
      mockH.mockSearchParams = new URLSearchParams('mode=reset')
      renderAuth()
      fireEvent.click(screen.getByText('Retour à la connexion'))
      expect(screen.getByText(/Ta squad t'attend, reconnecte-toi/)).toBeTruthy()
    })
  })

  // =================== LOGIN FORM SUBMISSION ===================
  describe('Login form submission', () => {
    it('calls signIn with email and password', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123')
    })

    it('navigates to /onboarding when no squads after login', async () => {
      mockH.mockSquads = []
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockNavigate).toHaveBeenCalledWith('/onboarding')
    })

    it('navigates to /home when user has squads after login', async () => {
      mockH.mockSquads = [{ id: 'sq1' }]
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockNavigate).toHaveBeenCalledWith('/home')
    })

    it('shows translated error on login failure', async () => {
      mockH.mockSignIn.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } })
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(screen.getByText('translated:Invalid credentials')).toBeTruthy()
    })
  })

  // =================== REGISTER FORM SUBMISSION ===================
  describe('Register form submission', () => {
    it('calls signUp with email, password, and username', async () => {
      mockH.mockSearchParams = new URLSearchParams('mode=register')
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'new@test.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'NewUser' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockSignUp).toHaveBeenCalledWith('new@test.com', 'password123', 'NewUser')
    })

    it('shows error when signUp fails', async () => {
      mockH.mockSearchParams = new URLSearchParams('mode=register')
      mockH.mockSignUp.mockResolvedValueOnce({ error: { message: 'Email taken' } })
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'new@test.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'NewUser' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(screen.getByText('translated:Email taken')).toBeTruthy()
    })
  })

  // =================== VALIDATION ===================
  describe('Client-side validation', () => {
    it('shows field error when email is empty', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      // Field errors are set via setFieldErrors, not rendered directly by our mock
      // but signIn should NOT be called
      expect(mockH.mockSignIn).not.toHaveBeenCalled()
    })

    it('shows field error when password is empty', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockSignIn).not.toHaveBeenCalled()
    })

    it('shows field error when password is too short', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: '12345' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockSignIn).not.toHaveBeenCalled()
    })

    it('shows error for invalid email format', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'notanemail' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockSignIn).not.toHaveBeenCalled()
    })

    it('shows error when username is empty in register mode', async () => {
      mockH.mockSearchParams = new URLSearchParams('mode=register')
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      // Username left empty
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockSignUp).not.toHaveBeenCalled()
    })
  })

  // =================== GOOGLE SIGN-IN ===================
  describe('Google sign-in', () => {
    it('calls signInWithGoogle when Google button is clicked', async () => {
      renderAuth()
      await act(async () => {
        fireEvent.click(screen.getByTestId('google-btn'))
      })
      expect(mockH.mockSignInWithGoogle).toHaveBeenCalled()
    })

    it('shows error when Google sign-in fails', async () => {
      mockH.mockSignInWithGoogle.mockResolvedValueOnce({ error: { message: 'Google error' } })
      renderAuth()
      await act(async () => {
        fireEvent.click(screen.getByTestId('google-btn'))
      })
      expect(screen.getByText('translated:Google error')).toBeTruthy()
    })
  })

  // =================== FORGOT PASSWORD ===================
  describe('Forgot password', () => {
    it('shows error when email is empty for forgot password', async () => {
      renderAuth()
      await act(async () => {
        fireEvent.click(screen.getByText('Mot de passe oublié ?'))
      })
      expect(
        screen.getByText('Entre ton email pour recevoir le lien de réinitialisation')
      ).toBeTruthy()
    })

    it('calls resetPasswordForEmail when email is provided', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      await act(async () => {
        fireEvent.click(screen.getByText('Mot de passe oublié ?'))
      })
      expect(mockH.mockResetPasswordForEmail).toHaveBeenCalled()
    })

    it('shows success message after reset email sent', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
      await act(async () => {
        fireEvent.click(screen.getByText('Mot de passe oublié ?'))
      })
      expect(screen.getByText('Email envoyé ! Vérifie ta boîte mail')).toBeTruthy()
    })
  })

  // =================== PASSWORD UPDATE (RESET MODE) ===================
  describe('Password update in reset mode', () => {
    beforeEach(() => {
      mockH.mockSearchParams = new URLSearchParams('mode=reset')
    })

    it('shows error when password is too short', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: '12345' } })
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: '12345' } })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(screen.getByText('Le mot de passe doit contenir au moins 6 caractères')).toBeTruthy()
    })

    it('shows error when passwords do not match', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'different' },
      })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeTruthy()
    })

    it('calls updateUser when passwords match and are valid', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'newpassword' } })
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword' },
      })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(mockH.mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword' })
    })

    it('shows success message after password update', async () => {
      renderAuth()
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'newpassword' } })
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword' },
      })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(screen.getByText('Mot de passe mis à jour !')).toBeTruthy()
    })

    it('shows error when updateUser fails', async () => {
      mockH.mockUpdateUser.mockResolvedValueOnce({ error: { message: 'Token expired' } })
      renderAuth()
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'newpassword' } })
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword' },
      })
      await act(async () => {
        fireEvent.submit(document.querySelector('form')!)
      })
      expect(screen.getByText('translated:Token expired')).toBeTruthy()
    })
  })

  // =================== FOOTER ===================
  describe('Footer', () => {
    it('renders legal links', () => {
      renderAuth()
      expect(screen.getByText("conditions d'utilisation")).toBeTruthy()
      expect(screen.getByText('politique de confidentialité')).toBeTruthy()
    })

    it('has correct legal link hrefs', () => {
      renderAuth()
      const links = document.querySelectorAll('a')
      const hrefs = Array.from(links).map((l) => l.getAttribute('href'))
      expect(hrefs).toContain('/legal')
      expect(hrefs).toContain('/legal?tab=privacy')
    })
  })

  // =================== LOGO ===================
  describe('Logo', () => {
    it('renders SquadPlannerLogo', () => {
      renderAuth()
      expect(screen.getByTestId('logo')).toBeTruthy()
    })

    it('renders "Squad Planner" brand text', () => {
      renderAuth()
      expect(screen.getByText('Squad Planner')).toBeTruthy()
    })
  })
})
