import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/auth', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Navigate: () => null,
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
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      }
    }),
    motion: new Proxy({}, {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      }
    }),
  }
})

// Mock icons
vi.mock('../../components/icons', () => ({
  Loader2: ({ children, ...props }: any) => createElement('span', props, children),
  Gamepad2: ({ children, ...props }: any) => createElement('span', props, children),
  CheckCircle: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock UI components
vi.mock('../../components/ui', () => ({
  Button: ({ children, ...props }: any) => createElement('button', props, children),
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

// Mock SquadPlannerLogo
vi.mock('../../components/SquadPlannerLogo', () => ({
  SquadPlannerLogo: () => createElement('span', { 'data-testid': 'logo' }),
}))

// Mock Confetti
vi.mock('../../components/LazyConfetti', () => ({
  default: () => null,
}))

// Mock auth store - user not logged in
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
    }),
    { getState: vi.fn().mockReturnValue({ user: null, profile: null }) }
  ),
  useSquadsStore: Object.assign(
    vi.fn().mockReturnValue({
      squads: [],
      fetchSquads: vi.fn().mockResolvedValue(undefined),
    }),
    { getState: vi.fn().mockReturnValue({ squads: [] }) }
  ),
}))

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

// Mock auth sub-components
vi.mock('../auth/AuthHelpers', () => ({
  translateAuthError: (msg: string) => msg,
}))

vi.mock('../auth/AuthGoogleButton', () => ({
  AuthGoogleButton: ({ onClick, disabled }: any) =>
    createElement('button', { onClick, disabled, 'data-testid': 'google-btn' }, 'Google'),
}))

vi.mock('../auth/AuthFormFields', () => ({
  AuthFormFields: ({ mode }: any) =>
    createElement('div', { 'data-testid': 'auth-form-fields' }, `Form (${mode})`),
}))

import Auth from '../Auth'

describe('Auth', () => {
  it('renders without crashing', () => {
    render(createElement(Auth))
    expect(screen.getByTestId('logo')).toBeTruthy()
  })

  it('renders login heading by default', () => {
    render(createElement(Auth))
    expect(screen.getByText("T'as manqué à ta squad !")).toBeTruthy()
  })

  it('renders the auth form fields', () => {
    render(createElement(Auth))
    expect(screen.getByTestId('auth-form-fields')).toBeTruthy()
  })

  it('renders Google sign-in button', () => {
    render(createElement(Auth))
    expect(screen.getByTestId('google-btn')).toBeTruthy()
  })

  it('renders submit button with login text', () => {
    render(createElement(Auth))
    expect(screen.getByText('Se connecter')).toBeTruthy()
  })

  it('renders switch mode link', () => {
    render(createElement(Auth))
    expect(screen.getByText('Créer un compte')).toBeTruthy()
  })

  it('renders legal links in footer', () => {
    render(createElement(Auth))
    expect(screen.getByText("conditions d'utilisation")).toBeTruthy()
    expect(screen.getByText(/politique de confidentialité/i)).toBeTruthy()
  })
})
