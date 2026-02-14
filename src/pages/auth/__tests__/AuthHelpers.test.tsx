import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

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

import { translateAuthError, PasswordStrength } from '../AuthHelpers'

describe('translateAuthError', () => {
  it('translates "Invalid login credentials"', () => {
    expect(translateAuthError('Invalid login credentials')).toBe('Email ou mot de passe incorrect')
  })

  it('translates "User already registered"', () => {
    expect(translateAuthError('User already registered')).toBe('Cet email est déjà utilisé')
  })

  it('translates "Email not confirmed"', () => {
    expect(translateAuthError('Email not confirmed')).toBe('Vérifie ton email avant de te connecter')
  })

  it('returns original message for unknown errors', () => {
    expect(translateAuthError('Some unknown error')).toBe('Some unknown error')
  })

  it('translates partial matches', () => {
    expect(translateAuthError('Error: Invalid login credentials please try again')).toBe('Email ou mot de passe incorrect')
  })
})

describe('PasswordStrength', () => {
  it('renders without crashing', () => {
    const { container } = render(<PasswordStrength password="test" />)
    expect(container).toBeTruthy()
  })

  it('shows "Faible" for weak passwords', () => {
    render(<PasswordStrength password="abc" />)
    expect(screen.getByText('Faible')).toBeTruthy()
  })

  it('shows "Fort" for strong passwords', () => {
    render(<PasswordStrength password="MyStr0ng!Pass" />)
    expect(screen.getByText('Fort')).toBeTruthy()
  })

  it('shows "Bon" for decent passwords', () => {
    render(<PasswordStrength password="Abcdef1234" />)
    expect(screen.getByText('Bon')).toBeTruthy()
  })
})
