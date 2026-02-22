import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/auth', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

vi.mock('../../../components/ui', () => ({
  Input: ({ label, ...props }: any) =>
    createElement(
      'div',
      {},
      label ? createElement('label', {}, label) : null,
      createElement('input', props)
    ),
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

vi.mock('../AuthHelpers', () => ({
  PasswordStrength: ({ password }: any) =>
    createElement('div', { 'data-testid': 'password-strength' }, password),
}))

import { AuthFormFields } from '../AuthFormFields'

describe('AuthFormFields', () => {
  const defaultProps = {
    mode: 'login' as const,
    email: '',
    setEmail: vi.fn(),
    password: '',
    setPassword: vi.fn(),
    confirmPassword: '',
    setConfirmPassword: vi.fn(),
    username: '',
    setUsername: vi.fn(),
    fieldErrors: {},
    setFieldErrors: vi.fn(),
  }

  it('renders without crashing', () => {
    const { container } = render(<AuthFormFields {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows email and password fields in login mode', () => {
    render(<AuthFormFields {...defaultProps} mode="login" />)
    const inputs = screen
      .getAllByRole('textbox')
      .concat(document.querySelectorAll('input[type="password"]') as any)
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('shows username field in register mode', () => {
    render(<AuthFormFields {...defaultProps} mode="register" />)
    const inputs = document.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('shows password strength in register mode when password has content', () => {
    render(<AuthFormFields {...defaultProps} mode="register" password="test123" />)
    expect(screen.getByTestId('password-strength')).toBeTruthy()
  })

  it('shows confirm password in reset mode', () => {
    render(<AuthFormFields {...defaultProps} mode="reset" />)
    const passwordInputs = document.querySelectorAll('input[type="password"]')
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2)
  })

  it('displays field errors when present', () => {
    render(<AuthFormFields {...defaultProps} fieldErrors={{ email: 'Email invalide' }} />)
    expect(screen.getByText('Email invalide')).toBeTruthy()
  })
})
